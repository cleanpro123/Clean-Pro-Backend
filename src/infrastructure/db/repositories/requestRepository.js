const Request = require('../models/Request');

module.exports = {
  STATUSES: Request.STATUSES,
  // Reads expand addressId into the full Address document so the user, agent
  // and admin views can render the complete pickup address from the link.
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    Request.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('addressId'),
  count: (filter = {}) => Request.countDocuments(filter),
  findById: (id) => Request.findById(id).populate('addressId'),
  create: (data) => Request.create(data),
  updateById: (id, patch) =>
    Request.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).populate('addressId'),
  deleteById: (id) => Request.findByIdAndDelete(id),
};
