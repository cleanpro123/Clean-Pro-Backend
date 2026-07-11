const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

// Host + db name only — never log the full URI, which carries the credentials.
function safeMongoTarget(uri) {
  try {
    const u = new URL(uri);
    return `${u.host}${u.pathname}`;
  } catch {
    return 'configured';
  }
}

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info({ target: safeMongoTarget(env.mongoUri) }, 'mongo connected');
  } catch (err) {
    logger.error({ err }, 'mongo connection failed');
    throw err;
  }
}


async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = { connectDb, disconnectDb };
