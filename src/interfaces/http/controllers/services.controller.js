const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const repo = require('../../../infrastructure/db/repositories/serviceRepository');

exports.publicList = asyncHandler(async (_req, res) => {
  ok(res, await repo.list({ active: true }));
});

exports.adminList = asyncHandler(async (_req, res) => {
  ok(res, await repo.list());
});

exports.create = asyncHandler(async (req, res) => {
  const svc = await repo.create(req.body);
  created(res, svc);
});

exports.update = asyncHandler(async (req, res) => {
  const svc = await repo.updateById(req.params.id, req.body);
  if (!svc) throw AppError.notFound('Service not found');
  ok(res, svc);
});

exports.remove = asyncHandler(async (req, res) => {
  const svc = await repo.deleteById(req.params.id);
  if (!svc) throw AppError.notFound('Service not found');
  noContent(res);
});
