const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Men', 'Women', 'Home'],
      required: true,
      index: true,
    },
    prices: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

itemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    if (ret.prices instanceof Map) ret.prices = Object.fromEntries(ret.prices);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Item', itemSchema);
