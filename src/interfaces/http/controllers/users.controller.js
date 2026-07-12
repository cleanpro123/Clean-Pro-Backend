const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const addAddress = require('../../../application/use-cases/users/addAddress');
const updateAddress = require('../../../application/use-cases/users/updateAddress');
const removeAddress = require('../../../application/use-cases/users/removeAddress');
const changeEmail = require('../../../application/use-cases/users/changeEmail');
const changePassword = require('../../../application/use-cases/users/changePassword');
const deleteUser = require('../../../application/use-cases/users/deleteUser');

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;
  const [items, total, active, blocked] = await Promise.all([
    userRepo.list({
      status: req.query.status,
      q: req.query.q,
      skip,
      limit,
    }),
    userRepo.count(),
    userRepo.count({ status: 'active' }),
    userRepo.count({ status: 'blocked' }),
  ]);
  ok(res, items, {
    page,
    limit,
    total,
    counts: { total, active, blocked },
  });
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
  // Addresses are managed through the dedicated /me/addresses endpoints, never
  // through this profile patch.
  const { addresses, ...patch } = req.body;
  const user = await userRepo.updateById(req.user.id, patch);
  ok(res, user);
});

// Privacy Center — user deactivates their own account. Reversible: signing back
// in with the correct password reactivates it (see auth/login use-case).
exports.deactivateMe = asyncHandler(async (req, res) => {
  const user = await userRepo.setStatus(req.user.id, 'deactivated');
  if (!user) throw AppError.notFound();
  ok(res, { status: 'deactivated' });
});

// Privacy Center — user permanently deletes their own account and ALL related
// data (orders, addresses, reviews, notifications, sessions, OTPs).
exports.deleteMe = asyncHandler(async (req, res) => {
  await deleteUser(req.user.id);
  ok(res, { deleted: true });
});

// Admin — permanently delete a user and everything tied to their id.
exports.remove = asyncHandler(async (req, res) => {
  await deleteUser(req.params.id);
  ok(res, { deleted: true });
});

// Change the login email. The new address must already be OTP-verified
// (client flow: /auth/otp/request?purpose=change-email → /auth/otp/verify).
exports.changeEmail = asyncHandler(async (req, res) => {
  const user = await changeEmail({ userId: req.user.id, email: req.body.email });
  ok(res, user);
});

// Security — change the signed-in user's password (requires the current one).
exports.changePassword = asyncHandler(async (req, res) => {
  await changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  ok(res, { changed: true });
});

// ── Addresses (user self) ──
exports.listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressRepo.listByUser(req.user.id);
  ok(res, addresses);
});

exports.addAddress = asyncHandler(async (req, res) => {
  const address = await addAddress({ userId: req.user.id, ...req.body });
  created(res, address);
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const address = await updateAddress({
    userId: req.user.id,
    addressId: req.params.addressId,
    patch: req.body,
  });
  ok(res, address);
});

exports.removeAddress = asyncHandler(async (req, res) => {
  const user = await removeAddress({
    userId: req.user.id,
    addressId: req.params.addressId,
  });
  ok(res, user);
});
