const Request = require('../models/Request');

module.exports = {
  STATUSES: Request.STATUSES,
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    Request.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  count: (filter = {}) => Request.countDocuments(filter),
  findById: (id) => Request.findById(id),
  create: (data) => Request.create(data),
  updateById: (id, patch) =>
    Request.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Request.findByIdAndDelete(id),
};
