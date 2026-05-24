const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info({ uri: env.mongoUri }, 'mongo connected');
  } catch (err) {
    logger.error({ err }, 'mongo connection failed');
    throw err;
  }
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
