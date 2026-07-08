const mongoose = require('mongoose');

// One notification per order. Created when the order is placed and linked to
// the customer (userId) and the order (orderId). The order's own status drives
// what the feed shows — a notification stays hidden while the order is still
// pending/assigned and surfaces once it's accepted and onward.
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-expire notifications 2 weeks after they're created. MongoDB's TTL monitor
// deletes documents once createdAt is older than expireAfterSeconds.
const TWO_WEEKS_SECONDS = 14 * 24 * 60 * 60;
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: TWO_WEEKS_SECONDS });

notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
