const asyncHandler = require('../../../shared/utils/asyncHandler');
const { ok, created } = require('../../../shared/utils/respond');
const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const addAddress = require('../../../application/use-cases/users/addAddress');
const removeAddress = require('../../../application/use-cases/users/removeAddress');

exports.list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const skip = (page - 1) * limit;
  const [items, total, active, blocked, pendingBusiness] = await Promise.all([
    userRepo.list({
      status: req.query.status,
      accountType: req.query.accountType,
      approvalStatus: req.query.approvalStatus,
      q: req.query.q,
      skip,
      limit,
    }),
    userRepo.count(),
    userRepo.count({ status: 'active' }),
    userRepo.count({ status: 'blocked' }),
    userRepo.count({ accountType: 'business', approvalStatus: 'pending' }),
  ]);
  ok(res, items, {
    page,
    limit,
    total,
    counts: { total, active, blocked, pendingBusiness },
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

exports.setApproval = asyncHandler(async (req, res) => {
  const user = await userRepo.setApproval(req.params.id, req.body.approvalStatus);
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

// ── Addresses (user self) ──
exports.listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressRepo.listByUser(req.user.id);
  ok(res, addresses);
});

exports.addAddress = asyncHandler(async (req, res) => {
  const address = await addAddress({ userId: req.user.id, ...req.body });
  created(res, address);
});

exports.removeAddress = asyncHandler(async (req, res) => {
  const user = await removeAddress({
    userId: req.user.id,
    addressId: req.params.addressId,
  });
  ok(res, user);
});
