const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const mapRepo = require('../../../infrastructure/db/repositories/mapRepository');
const { hashPassword } = require('../../../infrastructure/security/password');

// If a mapId is supplied, look up the map and overwrite the agent's place
// + zone with the map's textual location. Returns a sanitized patch ready
// to be persisted on the Agent doc.
async function applyMap(patch) {
  if (!patch || patch.mapId === undefined) return patch;
  if (patch.mapId === null) {
    return { ...patch, place: '', zone: '' };
  }
  const m = await mapRepo.findById(patch.mapId);
  if (!m) throw AppError.badRequest('Map location not found');
  return { ...patch, place: m.place, zone: m.name };
}

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    agentRepo.list({ status: req.query.status, q: req.query.q, skip, limit }),
    agentRepo.count(),
  ]);
  ok(res, items, { page, limit, total });
});

exports.get = asyncHandler(async (req, res) => {
  const a = await agentRepo.findById(req.params.id);
  if (!a) throw AppError.notFound('Agent not found');
  ok(res, a);
});

exports.create = asyncHandler(async (req, res) => {
  const { password, ...rest } = req.body;
  const patch = await applyMap(rest);
  const passwordHash = await hashPassword(password);
  const a = await agentRepo.create({ ...patch, passwordHash });
  created(res, a);
});

exports.update = asyncHandler(async (req, res) => {
  const patch = await applyMap(req.body);
  const a = await agentRepo.updateById(req.params.id, patch);
  if (!a) throw AppError.notFound('Agent not found');
  ok(res, a);
});

exports.remove = asyncHandler(async (req, res) => {
  const a = await agentRepo.deleteById(req.params.id);
  if (!a) throw AppError.notFound('Agent not found');
  noContent(res);
});

// Agent self
exports.me = asyncHandler(async (req, res) => {
  const a = await agentRepo.findById(req.user.id);
  if (!a) throw AppError.notFound();
  ok(res, a);
});

exports.updateMyLocation = asyncHandler(async (req, res) => {
  const patch = await applyMap(req.body);
  const a = await agentRepo.updateById(req.user.id, patch);
  ok(res, a);
});
