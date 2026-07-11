const Admin = require('../models/Admin');

module.exports = {
  findById: (id) => Admin.findById(id),
  findByEmail: (email) => Admin.findOne({ email: String(email).toLowerCase() }),
  list: ({ q, skip = 0, limit = 50 } = {}) => {
    const filter = {};
    if (q) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    return Admin.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  },
  count: (filter = {}) => Admin.countDocuments(filter),
  create: (data) => Admin.create(data),
  updateById: (id, patch) =>
    Admin.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Admin.findByIdAndDelete(id),
};
