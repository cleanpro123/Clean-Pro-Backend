const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    service: { type: String, default: 'wash' },
  },
  { _id: false }
);

const REQUEST_STATUSES = [
  'pending',
  'accepted',
  'assigned',
  'in_progress',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const requestSchema = new mongoose.Schema(
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
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    // The chosen pickup address — a reference to the customer's Address
    // document. Reads populate it so every view renders the full, up-to-date
    // address from this single source of truth.
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
      index: true,
    },
    items: { type: [lineItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
    // How the customer pays. Only cash on delivery is live today; UPI and card
    // are reserved for when online payments go in.
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
    pickupSlot: { type: String, default: '' },
    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

requestSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

requestSchema.statics.STATUSES = REQUEST_STATUSES;

module.exports = mongoose.model('Request', requestSchema);
