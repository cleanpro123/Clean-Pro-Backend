const bcrypt = require('bcryptjs');
const env = require('../../config/env');

async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptRounds);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
