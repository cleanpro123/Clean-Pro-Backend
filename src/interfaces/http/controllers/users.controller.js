const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;
  const [items, total, active, blocked] = await Promise.all([
    userRepo.list({ status: req.query.status, q: req.query.q, skip, limit }),
    userRepo.count(),
    userRepo.count({ status: 'active' }),
    userRepo.count({ status: 'blocked' }),
  ]);
  ok(res, items, { page, limit, total, counts: { total, active, blocked } });
});

exports.get = asyncHandler(async (req, res) => {
  const user = await userRepo.findById(req.params.id);
  if (!user) throw AppError.notFound('User not found');
  ok(res, user);
});

exports.setStatus = asyncHandler(async (req, res) => {
  const user = await userRepo.setStatus(req.params.id, req.body.status);
  if (!user) throw AppError.notFound('User not found');
  ok(res, user);
});

exports.me = asyncHandler(async (req, res) => {
  const user = await userRepo.findById(req.user.id);
  if (!user) throw AppError.notFound();
  ok(res, user);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await userRepo.updateById(req.user.id, req.body);
  ok(res, user);
});
