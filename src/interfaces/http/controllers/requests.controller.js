const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const createRequest = require('../../../application/use-cases/requests/createRequest');
const transitionStatus = require('../../../application/use-cases/requests/transitionStatus');
const updateRequestTotal = require('../../../application/use-cases/requests/updateRequestTotal');
const getRequestStats = require('../../../application/use-cases/requests/getRequestStats');

function paginate(req) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  return { page, limit, skip: (page - 1) * limit };
}

// ── User ──

// CREATE ORDER (customer)
// Handles "POST /api/requests": passes the logged-in user's id plus the
// order details from the request body to the createRequest use case,
// then responds 201 Created with the new order.
exports.userCreate = asyncHandler(async (req, res) => {
  const r = await createRequest({ userId: req.user.id, ...req.body });
  created(res, r);
});

exports.userList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { userId: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    requestRepo.list({ filter, skip, limit }),
    requestRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ── Agent ──
exports.agentList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { agentId: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    requestRepo.list({ filter, skip, limit }),
    requestRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ── Admin ──
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    requestRepo.list({ filter, skip, limit }),
    requestRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// STATS (admin) — server-side revenue/order counts for a date window, with an
// optional previous window for comparison and optional per-agent scoping. The
// validator has already coerced from/to/prevFrom/prevTo into Date objects.
exports.adminStats = asyncHandler(async (req, res) => {
  const { from, to, prevFrom, prevTo, agentId } = req.query;
  const result = await getRequestStats({ from, to, prevFrom, prevTo, agentId });
  ok(res, result);
});

// ── Common ──
exports.get = asyncHandler(async (req, res) => {
  const r = await requestRepo.findById(req.params.id);
  if (!r) throw AppError.notFound('Request not found');

  // userId is populated on reads, so compare against its _id.
  const ownerId = String(r.userId?._id || r.userId);
  if (req.user.role === 'user' && ownerId !== req.user.id) {
    throw AppError.forbidden();
  }
  if (req.user.role === 'agent' && (!r.agentId || String(r.agentId) !== req.user.id)) {
    throw AppError.forbidden();
  }

  ok(res, r);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const r = await transitionStatus({
    id: req.params.id,
    status: req.body.status,
    actor: req.user,
  });
  ok(res, r);
});

exports.updateTotal = asyncHandler(async (req, res) => {
  const r = await updateRequestTotal({
    id: req.params.id,
    total: req.body.total,
    actor: req.user,
  });
  ok(res, r);
});

exports.assignAgent = asyncHandler(async (req, res) => {
  const agent = await agentRepo.findById(req.body.agentId);
  if (!agent) throw AppError.notFound('Agent not found');
  // Assigning (or reassigning) an agent only sets agentId — it does NOT change
  // the order status. A freshly placed order stays `pending` until the agent or
  // an admin explicitly accepts it.
  const r = await requestRepo.updateById(req.params.id, {
    agentId: agent._id,
  });
  if (!r) throw AppError.notFound('Request not found');
  ok(res, r);
});
