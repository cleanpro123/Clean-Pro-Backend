/* One-off (safe to delete): print isSpecial for a user by email. */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/infrastructure/db/models/User');

(async () => {
  const email = process.argv[2];
  await mongoose.connect(process.env.MONGO_URI);
  const raw = await User.findOne({ email: String(email).toLowerCase() }).lean();
  if (!raw) {
    console.log('NO USER FOUND for', email);
  } else {
    console.log('name:', raw.name);
    console.log('email:', raw.email);
    console.log('isSpecial (raw db):', raw.isSpecial, '(type', typeof raw.isSpecial + ')');
    const doc = await User.findById(raw._id);
    console.log('toJSON.isSpecial:', doc.toJSON().isSpecial);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
