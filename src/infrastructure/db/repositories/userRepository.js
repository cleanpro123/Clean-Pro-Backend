const User = require('../models/User');

module.exports = {
  // Single-user reads expand the address refs into full documents so callers
  // (e.g. the customer profile) receive ready-to-render addresses.
  findById: (id) => User.findById(id).populate('addresses'),
  findByEmail: (email) => User.findOne({ email: String(email).toLowerCase() }),
  findByPhone: (phone) => User.findOne({ phone }),
  list: ({ status, accountType, approvalStatus, q, skip = 0, limit = 50 } = {}) => {
    const filter = {};
    if (status) filter.status = status;
    if (accountType) filter.accountType = accountType;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (q) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }
    return User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
  },
  count: (filter = {}) => User.countDocuments(filter),
  create: (data) => User.create(data),
  updateById: (id, patch) =>
    User.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).populate(
      'addresses'
    ),
  setStatus: (id, status) =>
    User.findByIdAndUpdate(id, { status }, { new: true }),
  setApproval: (id, approvalStatus) =>
    User.findByIdAndUpdate(id, { approvalStatus }, { new: true }),
  // Append/remove an Address id on the user's ordered addresses array.
  pushAddress: (id, addressId) =>
    User.findByIdAndUpdate(
      id,
      { $push: { addresses: addressId } },
      { new: true }
    ).populate('addresses'),
  pullAddress: (id, addressId) =>
    User.findByIdAndUpdate(
      id,
      { $pull: { addresses: addressId } },
      { new: true }
    ).populate('addresses'),
};
