const mongoose = require('mongoose');

async function orderStats(Model, { from, to, agentId } = {}) {
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
  const [row] = await Model.aggregate([
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

module.exports = orderStats;
