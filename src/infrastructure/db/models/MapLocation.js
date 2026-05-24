const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    place: { type: String, required: true },
    description: { type: String, default: '' },
    pickupRadius: { type: String, default: '' },
  },
  { timestamps: true }
);

mapSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('MapLocation', mapSchema);
