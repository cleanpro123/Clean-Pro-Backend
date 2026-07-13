const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Phone is validated for format but NOT unique — multiple accounts may
    // share a number (e.g. family members). See scripts/drop-phone-index.js
    // to drop the legacy unique index from an existing database.
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    // Ordered references into the Address collection. Populate to expand into
    // full address documents.
    addresses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    ],
    status: {
      type: String,
      // 'deactivated' = self-deactivated by the user; can only be reactivated
      // by a branch/admin (the user cannot sign back in on their own).
      enum: ['active', 'blocked', 'deactivated'],
      default: 'active',
      index: true,
    },
    orders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
