const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const repo = require('../../../infrastructure/db/repositories/offerRepository');

exports.publicList = asyncHandler(async (_req, res) => {
  const items = await repo.list({ active: true });
  const now = new Date();
  const usable = items.filter(
    (o) => !o.validTill || new Date(o.validTill) >= now
  );
  ok(res, usable);
});

exports.adminList = asyncHandler(async (_req, res) => {
  ok(res, await repo.list());
});

exports.create = asyncHandler(async (req, res) => {
  const o = await repo.create({
    ...req.body,
    code: req.body.code.toUpperCase(),
  });
  created(res, o);
});

exports.update = asyncHandler(async (req, res) => {
  const patch = { ...req.body };
  if (patch.code) patch.code = patch.code.toUpperCase();
  const o = await repo.updateById(req.params.id, patch);
  if (!o) throw AppError.notFound('Offer not found');
  ok(res, o);
});

exports.remove = asyncHandler(async (req, res) => {
  const o = await repo.deleteById(req.params.id);
  if (!o) throw AppError.notFound('Offer not found');
  noContent(res);
});
