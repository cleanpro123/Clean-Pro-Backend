const SpecialRequest = require('../models/SpecialRequest');

// Reads expand addressId, userId (name/phone) and agentId (name/phone/vehicle)
// exactly like requestRepository so special orders render the same everywhere.
module.exports = {
  STATUSES: SpecialRequest.STATUSES,
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    SpecialRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('addressId')
      .populate('userId', 'name phone avatar')
      .populate('agentId', 'name phone vehicle'),
  count: (filter = {}) => SpecialRequest.countDocuments(filter),
  findById: (id) =>
    SpecialRequest.findById(id)
      .populate('addressId')
      .populate('userId', 'name phone avatar')
      .populate('agentId', 'name phone vehicle'),
  create: (data) => SpecialRequest.create(data),
  updateById: (id, patch) =>
    SpecialRequest.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    })
      .populate('addressId')
      .populate('userId', 'name phone avatar')
      .populate('agentId', 'name phone vehicle'),
  deleteById: (id) => SpecialRequest.findByIdAndDelete(id),
  deleteByUser: (userId) => SpecialRequest.deleteMany({ userId }),
};
