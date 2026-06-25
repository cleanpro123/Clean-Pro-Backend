const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    mapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MapLocation',
      default: null,
      index: true,
    },
    place: { type: String, default: '' },
    vehicle: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'offline', 'blocked'],
      default: 'active',
      index: true,
    },
    pickupsToday: { type: Number, default: 0 },
  },
  { timestamps: true }
);

agentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Agent', agentSchema);
