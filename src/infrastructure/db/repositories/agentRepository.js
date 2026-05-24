const Agent = require('../models/Agent');

module.exports = {
  findById: (id) => Agent.findById(id),
  findByEmail: (email) => Agent.findOne({ email: String(email).toLowerCase() }),
  findByPhone: (phone) => Agent.findOne({ phone }),
  list: ({ status, q, skip = 0, limit = 50 } = {}) => {
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }
    return Agent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  },
  count: (filter = {}) => Agent.countDocuments(filter),
  create: (data) => Agent.create(data),
  updateById: (id, patch) =>
    Agent.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Agent.findByIdAndDelete(id),
};
