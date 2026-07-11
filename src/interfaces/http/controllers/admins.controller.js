const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created, noContent } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const adminRepo = require('../../../infrastructure/db/repositories/adminRepository');
const { hashPassword } = require('../../../infrastructure/security/password');

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    adminRepo.list({ q: req.query.q, skip, limit }),
    adminRepo.count(),
  ]);
  ok(res, items, { page, limit, total });
});

exports.get = asyncHandler(async (req, res) => {
  const a = await adminRepo.findById(req.params.id);
  if (!a) throw AppError.notFound('Admin not found');
  ok(res, a);
});

exports.create = asyncHandler(async (req, res) => {
  const { password, email, name } = req.body;
  const existing = await adminRepo.findByEmail(email);
  if (existing) throw AppError.badRequest('An admin with this email already exists');
  const passwordHash = await hashPassword(password);
  const a = await adminRepo.create({ name, email, passwordHash });
  created(res, a);
});

exports.update = asyncHandler(async (req, res) => {
  const { password, email, ...rest } = req.body;
  const patch = { ...rest };
  if (email) {
    const existing = await adminRepo.findByEmail(email);
    if (existing && String(existing.id) !== req.params.id) {
      throw AppError.badRequest('An admin with this email already exists');
    }
    patch.email = email;
  }
  if (password) patch.passwordHash = await hashPassword(password);
  const a = await adminRepo.updateById(req.params.id, patch);
  if (!a) throw AppError.notFound('Admin not found');
  ok(res, a);
});

exports.remove = asyncHandler(async (req, res) => {
  // Don't let an admin delete their own account, and never leave zero admins.
  if (String(req.params.id) === String(req.user.id)) {
    throw AppError.badRequest('You cannot remove your own admin account');
  }
  const total = await adminRepo.count();
  if (total <= 1) throw AppError.badRequest('At least one admin must remain');
  const a = await adminRepo.deleteById(req.params.id);
  if (!a) throw AppError.notFound('Admin not found');
  noContent(res);
});
