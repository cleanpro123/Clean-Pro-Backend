const Notification = require('../models/Notification');

module.exports = {
  // Reads expand orderId into the full order so the feed can render its
  // current status, code and date from the linked request.
  list: ({ filter = {}, skip = 0, limit = 50 } = {}) =>
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('orderId'),
  count: (filter = {}) => Notification.countDocuments(filter),
  findById: (id) => Notification.findById(id).populate('orderId'),
  create: (data) => Notification.create(data),
  deleteById: (id) => Notification.findByIdAndDelete(id),
  // Remove every notification for a user (used when the account is deleted).
  deleteByUser: (userId) => Notification.deleteMany({ userId }),
};
