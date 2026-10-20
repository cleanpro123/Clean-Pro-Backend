const StaffOtp = require('../models/StaffOtp');

module.exports = {
  upsert: (identity, code) => StaffOtp.findOneAndUpdate(identity,
    { ...identity, ...code, attempts: 0 }, { upsert: true, new: true }),
  find: (identity) => StaffOtp.findOne(identity),
  incrementAttempts: (id) => StaffOtp.findByIdAndUpdate(id, { $inc: { attempts: 1 } }),
  // Matching and deleting in one operation prevents concurrent code reuse.
  consume: (id, codeHash, maxAttempts) => StaffOtp.findOneAndDelete({
    _id: id, codeHash, expiresAt: { $gt: new Date() }, attempts: { $lt: maxAttempts },
  }),
};
