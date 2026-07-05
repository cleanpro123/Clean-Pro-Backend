// Must be first so Sentry can instrument everything loaded after it.
require('./config/instrument');

const env = require('./config/env');
const logger = require('./config/logger');
const { connectDb, disconnectDb } = require('./config/db');
const createApp = require('./app');

async function start() {
  await connectDb();
  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info({ port: env.port, env: env.nodeEnv }, 'clean-pro-api listening');
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error({ err }, 'failed to start');
  process.exit(1);
});
