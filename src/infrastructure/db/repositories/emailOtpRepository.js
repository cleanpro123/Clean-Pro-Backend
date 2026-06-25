const EmailOtp = require('../models/EmailOtp');

const norm = (email) => String(email).toLowerCase().trim();

module.exports = {
  // One active OTP per email — replace any previous one on each request.
  upsert: (email, { codeHash, expiresAt, purpose = 'register' }) =>
    EmailOtp.findOneAndUpdate(
      { email: norm(email) },
      { email: norm(email), codeHash, expiresAt, purpose, attempts: 0, verified: false },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ),
  findByEmail: (email) => EmailOtp.findOne({ email: norm(email) }),
  incAttempts: (id) =>
    EmailOtp.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true }),
  markVerified: (id) =>
    EmailOtp.findByIdAndUpdate(id, { verified: true }, { new: true }),
  deleteByEmail: (email) => EmailOtp.deleteMany({ email: norm(email) }),
};
