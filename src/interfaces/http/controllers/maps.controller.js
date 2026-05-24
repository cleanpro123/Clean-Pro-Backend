const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const repo = require('../../../infrastructure/db/repositories/mapRepository');

exports.list = asyncHandler(async (_req, res) => ok(res, await repo.list()));

exports.get = asyncHandler(async (req, res) => {
  const m = await repo.findById(req.params.id);
  if (!m) throw AppError.notFound('Location not found');
  ok(res, m);
});

exports.create = asyncHandler(async (req, res) => {
  const m = await repo.create(req.body);
  created(res, m);
});

exports.update = asyncHandler(async (req, res) => {
  const m = await repo.updateById(req.params.id, req.body);
  if (!m) throw AppError.notFound('Location not found');
  ok(res, m);
});

exports.remove = asyncHandler(async (req, res) => {
  const m = await repo.deleteById(req.params.id);
  if (!m) throw AppError.notFound('Location not found');
  noContent(res);
});
