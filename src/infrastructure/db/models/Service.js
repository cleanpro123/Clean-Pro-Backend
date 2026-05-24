const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'cube-outline' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

serviceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Service', serviceSchema);
