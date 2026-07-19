const AppError = require('../../../shared/errors/AppError');
const specialRepo = require('../../../infrastructure/db/repositories/specialRequestRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const { formatAddress, genCode, pickAgent } = require('../shared/orderAssignment');

// DIRECT ORDER (special customers only)
// A special/VIP customer books a pickup without choosing items — just the
// address, delivery speed, payment method and an optional note. The order is
// stored in the SpecialRequest collection with an empty item list and total 0
// (the agent/admin finalises pricing on the ground). An agent is auto-assigned
// by service-area match, same as a normal order.
async function createSpecialRequest({
  userId,
  addressId,
  deliveryType,
  paymentMethod,
  note,
}) {
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.status === 'blocked') throw AppError.forbidden('Account blocked');
  // Only special (VIP) customers may place direct orders.
  if (!user.isSpecial) {
    throw AppError.forbidden('Direct orders are available to special customers only');
  }

  const addressDoc = await addressRepo.findById(addressId);
  if (!addressDoc || String(addressDoc.userId) !== String(user._id)) {
    throw AppError.notFound('Address not found');
  }
  const addressText = formatAddress(addressDoc);

  const picked = await pickAgent(addressText);

  const req = await specialRepo.create({
    code: genCode(),
    userId: user._id,
    addressId: addressDoc._id,
    deliveryType: deliveryType === 'fast' ? 'fast' : 'normal',
    paymentMethod: paymentMethod || 'cod',
    note: (note || '').trim(),
    total: 0,
    status: 'pending',
    agentId: picked ? picked._id : null,
  });

  return specialRepo.findById(req._id);
}

module.exports = createSpecialRequest;
