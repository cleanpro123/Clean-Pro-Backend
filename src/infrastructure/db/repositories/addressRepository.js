const Address = require('../models/Address');

module.exports = {
  create: (data) => Address.create(data),
  findById: (id) => Address.findById(id),
  listByUser: (userId) => Address.find({ userId }).sort({ createdAt: 1 }),
  updateById: (id, patch) =>
    Address.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Address.findByIdAndDelete(id),
  deleteByUser: (userId) => Address.deleteMany({ userId }),
};
