const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true, index: true },
    label: { type: String, default: '' },
    discount: { type: String, required: true },
    minOrder: { type: Number, default: 0 },
    validTill: { type: Date, default: null },
    usage: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

offerSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Offer', offerSchema);
