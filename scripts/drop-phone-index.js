/* eslint-disable no-console */
// One-off migration: drop the legacy UNIQUE index on users.phone.
//
// Phone numbers are no longer unique (multiple accounts may share a number),
// but a database created before that change still carries a `phone_1` unique
// index. Until it is dropped, inserting a duplicate phone fails with a
// MongoDB E11000 duplicate-key error even though the app code allows it.
//
// Run once against each environment:  node scripts/drop-phone-index.js
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');

async function run() {
  await mongoose.connect(env.mongoUri);
  const coll = mongoose.connection.collection('users');

  const indexes = await coll.indexes();
  const phoneIdx = indexes.find(
    (i) => i.key && i.key.phone === 1 && i.unique
  );

  if (!phoneIdx) {
    console.log('No unique phone index found — nothing to drop.');
  } else {
    await coll.dropIndex(phoneIdx.name);
    console.log(`Dropped unique index "${phoneIdx.name}" on users.phone.`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Failed to drop phone index:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
