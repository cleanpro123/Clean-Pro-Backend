const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const specialRepo = require('../../../infrastructure/db/repositories/specialRequestRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const createSpecialRequest = require('../../../application/use-cases/requests/createSpecialRequest');

function paginate(req) {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  return { page, limit, skip: (page - 1) * limit };
}

// ── User ──
exports.userCreate = asyncHandler(async (req, res) => {
  const r = await createSpecialRequest({ userId: req.user.id, ...req.body });
  created(res, r);
});

exports.userList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { userId: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    specialRepo.list({ filter, skip, limit }),
    specialRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ── Agent ──
exports.agentList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = { agentId: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    specialRepo.list({ filter, skip, limit }),
    specialRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ── Admin ──
exports.adminList = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    specialRepo.list({ filter, skip, limit }),
    specialRepo.count(filter),
  ]);
  ok(res, items, { page, limit, total });
});

// ── Common ──
exports.get = asyncHandler(async (req, res) => {
  const r = await specialRepo.findById(req.params.id);
  if (!r) throw AppError.notFound('Special order not found');

  const ownerId = String(r.userId?._id || r.userId);
  if (req.user.role === 'user' && ownerId !== req.user.id) {
    throw AppError.forbidden();
  }
  if (req.user.role === 'agent' && (!r.agentId || String(r.agentId?._id || r.agentId) !== req.user.id)) {
    throw AppError.forbidden();
  }
  ok(res, r);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const existing = await specialRepo.findById(req.params.id);
  if (!existing) throw AppError.notFound('Special order not found');
  // Agents may only update the orders assigned to them.
  if (
    req.user.role === 'agent' &&
    (!existing.agentId || String(existing.agentId?._id || existing.agentId) !== req.user.id)
  ) {
    throw AppError.forbidden();
  }
  const r = await specialRepo.updateById(req.params.id, { status: req.body.status });
  ok(res, r);
});

exports.assignAgent = asyncHandler(async (req, res) => {
  const agent = await agentRepo.findById(req.body.agentId);
  if (!agent) throw AppError.notFound('Agent not found');
  // Special orders have no `assigned` status — assigning just sets the agent;
  // the order keeps its current status (the agent then accepts it).
  const r = await specialRepo.updateById(req.params.id, { agentId: agent._id });
  if (!r) throw AppError.notFound('Special order not found');
  ok(res, r);
});
