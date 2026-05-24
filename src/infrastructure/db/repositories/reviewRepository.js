const Review = require('../models/Review');

module.exports = {
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  count: (filter = {}) => Review.countDocuments(filter),
  findById: (id) => Review.findById(id),
  findByRequest: (requestId) => Review.findOne({ requestId }),
  create: (data) => Review.create(data),
  updateById: (id, patch) =>
    Review.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Review.findByIdAndDelete(id),
};
