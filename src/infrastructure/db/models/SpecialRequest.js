const mongoose = require('mongoose');

// A "direct" order placed by a special (VIP) customer. Structurally the same as
// a normal Request but with NO item list — the customer just books a pickup
// (address + delivery speed + payment + note) and the agent handles the rest.
// Kept in its own collection so special orders stay separate from normal ones,
// while sharing the same statuses so admin/agent views render them the same.
const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'in_progress',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const specialRequestSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
      index: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
      index: true,
    },
    // Delivery speed chosen on the direct-order page (normal or fast).
    deliveryType: { type: String, enum: ['normal', 'fast'], default: 'normal' },
    total: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card'],
      default: 'cod',
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'pending',
      index: true,
    },
    note: { type: String, default: '', maxlength: 500 },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

specialRequestSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    // Tag so merged admin/agent/user lists can distinguish direct orders and
    // render them with an empty item list like normal orders.
    ret.kind = 'special';
    if (!ret.items) ret.items = [];
    return ret;
  },
});

specialRequestSchema.statics.STATUSES = REQUEST_STATUSES;

module.exports = mongoose.model('SpecialRequest', specialRequestSchema);
