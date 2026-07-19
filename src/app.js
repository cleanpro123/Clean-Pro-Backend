const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const { notFound, errorHandler } = require('./shared/middleware/errorHandler');
const { globalLimiter } = require('./interfaces/http/middleware/rateLimit');

const authRoutes = require('./interfaces/http/routes/auth.routes');
const userRoutes = require('./interfaces/http/routes/users.routes');
const adminRoutes = require('./interfaces/http/routes/admins.routes');
const agentRoutes = require('./interfaces/http/routes/agents.routes');
const serviceRoutes = require('./interfaces/http/routes/services.routes');
const itemRoutes = require('./interfaces/http/routes/items.routes');
const offerRoutes = require('./interfaces/http/routes/offers.routes');
const mapRoutes = require('./interfaces/http/routes/maps.routes');
const requestRoutes = require('./interfaces/http/routes/requests.routes');
const specialRequestRoutes = require('./interfaces/http/routes/specialRequests.routes');
const reviewRoutes = require('./interfaces/http/routes/reviews.routes');
const notificationRoutes = require('./interfaces/http/routes/notifications.routes');

function createApp() {
  const app = express();

  // Behind Render/any reverse proxy: trust the first proxy hop so the rate
  // limiter and logs see the real client IP (X-Forwarded-For) rather than the
  // proxy's. Without this, express-rate-limit refuses to key on IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  // Global ceiling on all requests; auth/OTP routes add tighter per-route caps.
  app.use(globalLimiter);

  
  // Root + health both answer 200 so platform health checks and uptime
  // monitors that ping "/" don't get a 404.
  app.get('/', (_req, res) =>
    res.json({ ok: true, service: 'Clean Pro API', status: 'up' })
  );
  app.get('/health', (_req, res) => res.json({ ok: true, status: 'up' }));

  // Public privacy policy — Play Store / App Store require a reachable URL.
  // Served at https://<host>/privacy (and /privacy.html).
  const privacyPage = path.join(__dirname, 'interfaces/http/legal/privacy-policy.html');
  app.get(['/privacy', '/privacy.html'], (_req, res) => res.sendFile(privacyPage));

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admins', adminRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/maps', mapRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/special-requests', specialRequestRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
