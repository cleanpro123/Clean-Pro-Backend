/* eslint-disable no-console */
// Bootstraps a clean DB with ONLY one admin account so you can log in.
// Everything else (users, agents, services, items, offers, maps, requests,
// reviews) is created through the API. Run `npm run populate` to spin up
// realistic demo data via real API calls.
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { hashPassword } = require('../src/infrastructure/security/password');

const Admin = require('../src/infrastructure/db/models/Admin');
const User = require('../src/infrastructure/db/models/User');
const Agent = require('../src/infrastructure/db/models/Agent');
const Service = require('../src/infrastructure/db/models/Service');
const Item = require('../src/infrastructure/db/models/Item');
const Offer = require('../src/infrastructure/db/models/Offer');
const MapLocation = require('../src/infrastructure/db/models/MapLocation');
const Request = require('../src/infrastructure/db/models/Request');
const Review = require('../src/infrastructure/db/models/Review');
const RefreshToken = require('../src/infrastructure/db/models/RefreshToken');

async function run() {
  await mongoose.connect(env.mongoUri);

  await Promise.all([
    Admin.deleteMany(),
    User.deleteMany(),
    Agent.deleteMany(),
    Service.deleteMany(),
    Item.deleteMany(),
    Offer.deleteMany(),
    MapLocation.deleteMany(),
    Request.deleteMany(),
    Review.deleteMany(),
    RefreshToken.deleteMany(),
  ]);

  await Admin.create({
    name: 'Nutro Admin',
    email: 'admin@nutro.in',
    passwordHash: await hashPassword('admin@1234'),
  });

  console.log('Clean DB ready.');
  console.log('  admin@nutro.in / admin@1234');
  console.log('Run `npm run populate` to add demo data through the API.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
