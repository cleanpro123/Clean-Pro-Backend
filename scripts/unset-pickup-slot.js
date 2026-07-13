/* eslint-disable no-console */
// One-off migration: drop the removed `pickupSlot` field from every request.
//
// The pickup-day / time-slot feature was removed, so the field is no longer
// written or read. This unsets it from existing documents so the collection
// matches the current schema.
//
// Run once against each environment:  node scripts/unset-pickup-slot.js
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');

async function run() {
  await mongoose.connect(env.mongoUri);
  const coll = mongoose.connection.collection('requests');

  const res = await coll.updateMany(
    { pickupSlot: { $exists: true } },
    { $unset: { pickupSlot: '' } }
  );

  console.log(`Removed pickupSlot from ${res.modifiedCount} request(s).`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Failed to unset pickupSlot:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
