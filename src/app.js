const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const { notFound, errorHandler } = require('./shared/middleware/errorHandler');

const authRoutes = require('./interfaces/http/routes/auth.routes');
const userRoutes = require('./interfaces/http/routes/users.routes');
const agentRoutes = require('./interfaces/http/routes/agents.routes');
const serviceRoutes = require('./interfaces/http/routes/services.routes');
const itemRoutes = require('./interfaces/http/routes/items.routes');
const offerRoutes = require('./interfaces/http/routes/offers.routes');
const mapRoutes = require('./interfaces/http/routes/maps.routes');
const requestRoutes = require('./interfaces/http/routes/requests.routes');
const reviewRoutes = require('./interfaces/http/routes/reviews.routes');
const notificationRoutes = require('./interfaces/http/routes/notifications.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  
  app.get('/health', (_req, res) => res.json({ ok: true, status: 'up' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/maps', mapRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
