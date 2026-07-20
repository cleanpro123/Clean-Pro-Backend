const mongoose = require('mongoose');
const Request = require('../models/Request');

// Aggregate order counts + delivered revenue for a single date window, filtered
// by placedAt. Done in the DB so date filtering (custom day / last year) doesn't
// depend on the client having fetched every order. Optionally scoped to an agent.
async function statsFor({ from, to, agentId } = {}) {
  const match = {};
  // Coerce to Date here: under Express 5 the validate middleware can't write
  // coerced values back onto the read-only req.query, so from/to may arrive as
  // ISO strings. A string $gte never matches a Date field → 0 results.
  if (from || to) {
    match.placedAt = {};
    if (from) match.placedAt.$gte = new Date(from);
    if (to) match.placedAt.$lt = new Date(to);
  }
  if (agentId) match.agentId = new mongoose.Types.ObjectId(agentId);

  const isDelivered = { $eq: ['$status', 'delivered'] };
  const [row] = await Request.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        delivered: { $sum: { $cond: [isDelivered, 1, 0] } },
        revenue: { $sum: { $cond: [isDelivered, '$total', 0] } },
      },
    },
  ]);
  return {
    orders: row?.orders || 0,
    delivered: row?.delivered || 0,
    revenue: row?.revenue || 0,
  };
}

module.exports = {
  STATUSES: Request.STATUSES,
  statsFor,
  // Reads expand addressId into the full Address document, and userId into the
  // customer's name/phone — the order no longer stores those, so every view
  // renders the customer + address from these links (single source of truth).
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    Request.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('addressId')
      .populate('userId', 'name phone avatar isSpecial')
      .populate('agentId', 'name phone vehicle'),
  count: (filter = {}) => Request.countDocuments(filter),
  findById: (id) =>
    Request.findById(id)
      .populate('addressId')
      .populate('userId', 'name phone avatar isSpecial')
      .populate('agentId', 'name phone vehicle'),
  create: (data) => Request.create(data),
  updateById: (id, patch) =>
    Request.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    })
      .populate('addressId')
      .populate('userId', 'name phone avatar isSpecial')
      .populate('agentId', 'name phone vehicle'),
  deleteById: (id) => Request.findByIdAndDelete(id),
  // Remove every order belonging to a user (used when the account is deleted).
  deleteByUser: (userId) => Request.deleteMany({ userId }),
};
