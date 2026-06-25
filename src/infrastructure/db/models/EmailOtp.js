const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, default: 'register' },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    // Mongo TTL index — the document is removed automatically once it expires.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
