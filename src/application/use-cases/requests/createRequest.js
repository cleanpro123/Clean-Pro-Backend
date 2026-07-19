// Dependencies: error helper + the database repositories this use case talks to
const AppError = require('../../../shared/errors/AppError');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const notificationRepo = require('../../../infrastructure/db/repositories/notificationRepository');
const { formatAddress, genCode, pickAgent } = require('../shared/orderAssignment');

// MAIN ORDER-CREATION USE CASE
// Takes the customer's id and order details, validates the customer,
// computes the price, auto-assigns a delivery agent, then saves the order.
async function createRequest({ userId, addressId, paymentMethod, items, note }) {
  // 1) Load the customer placing the order and make sure they're allowed to
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  if (user.status === 'blocked') throw AppError.forbidden('Account blocked');

  // 2) Resolve the saved pickup address and confirm it belongs to this user.
  const addressDoc = await addressRepo.findById(addressId);
  if (!addressDoc || String(addressDoc.userId) !== String(user._id)) {
    throw AppError.notFound('Address not found');
  }
  // Flattened text is used only to match the order to an agent's service area.
  const addressText = formatAddress(addressDoc);

  // 3) Sum up the order total (quantity × price for every item)
  const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);

  // 4) Auto-assign at creation to the agent whose area best matches the
  // pickup address. The order still starts as `pending` even when an agent is
  // pre-assigned — the assigned agent (or an admin) accepts it to move it
  // forward. If no agent matches, agentId stays null for later assignment.
  const picked = await pickAgent(addressText);

  // 5) Persist the new order to the database
  const req = await requestRepo.create({
    code: genCode(),
    userId: user._id,
    addressId: addressDoc._id,
    note: (note || '').trim(),
    paymentMethod: paymentMethod || 'cod',
    items,
    total,
    status: 'pending',
    agentId: picked ? picked._id : null,
  });

  // 6) Open a notification for this order, linked to the customer. It stays
  // hidden in the feed while the order is still pending (the feed reads the
  // order's live status), so the record exists from the moment the order is
  // placed and surfaces once it's accepted.
  await notificationRepo.create({ userId: user._id, orderId: req._id });

  // Return the order with its address populated so the caller gets the full,
  // ready-to-render address straight away.
  return requestRepo.findById(req._id);
}

module.exports = createRequest;
