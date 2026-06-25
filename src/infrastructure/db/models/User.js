const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    // 'laundry_company' | 'clothing_company' | 'authority' | 'other'
    businessType: { type: String },
    registrationNo: { type: String, trim: true },
    address: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    accountType: {
      type: String,
      enum: ['personal', 'business'],
      default: 'personal',
      index: true,
    },
    // personal accounts are auto-approved; business accounts await admin review.
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true,
    },
    company: { type: companySchema, default: undefined },
    // Ordered references into the Address collection. Populate to expand into
    // full address documents.
    addresses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
    ],
    status: {
      type: String,
      enum: ['active', 'blocked'],
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
