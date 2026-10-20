const Request = require('../models/Request');

// Aggregate order counts + delivered revenue for a single date window, filtered
// by placedAt. Done in the DB so date filtering (custom day / last year) doesn't
// depend on the client having fetched every order. Optionally scoped to an agent.
const orderStats = require('./orderStats');
const statsFor = (options) => orderStats(Request, options);

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
