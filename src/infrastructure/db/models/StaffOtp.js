const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['admin', 'agent'], required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});
schema.index({ email: 1, role: 1, requestedBy: 1 }, { unique: true });
module.exports = mongoose.model('StaffOtp', schema);
