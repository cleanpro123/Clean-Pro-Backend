const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const createRequest = require('../../../application/use-cases/requests/createRequest');
const transitionStatus = require('../../../application/use-cases/requests/transitionStatus');

function paginate(req) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  return { page, limit, skip: (page - 1) * limit };
}

// ── User ──
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

// ── Common ──
exports.get = asyncHandler(async (req, res) => {
  const r = await requestRepo.findById(req.params.id);
  if (!r) throw AppError.notFound('Request not found');

  if (req.user.role === 'user' && String(r.userId) !== req.user.id) {
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

exports.assignAgent = asyncHandler(async (req, res) => {
  const agent = await agentRepo.findById(req.body.agentId);
  if (!agent) throw AppError.notFound('Agent not found');
  const r = await requestRepo.updateById(req.params.id, {
    agentId: agent._id,
    status: 'assigned',
  });
  if (!r) throw AppError.notFound('Request not found');
  ok(res, r);
});
