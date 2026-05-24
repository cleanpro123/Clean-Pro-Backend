const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const repo = require('../../../infrastructure/db/repositories/itemRepository');

exports.publicList = asyncHandler(async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  ok(res, await repo.list(filter));
});

exports.adminList = asyncHandler(async (_req, res) => {
  ok(res, await repo.list());
});

exports.create = asyncHandler(async (req, res) => {
  const item = await repo.create(req.body);
  created(res, item);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await repo.updateById(req.params.id, req.body);
  if (!item) throw AppError.notFound('Item not found');
  ok(res, item);
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await repo.deleteById(req.params.id);
  if (!item) throw AppError.notFound('Item not found');
  noContent(res);
});
