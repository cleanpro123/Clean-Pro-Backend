const rateLimit = require('express-rate-limit');

// Emit a rejection in the same { ok, error } envelope the rest of the API uses,
// so the client's apiRequest() surfaces a clean message instead of a raw 429.
function limitHandler(_req, res) {
  res.status(429).json({
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please wait a moment and try again.',
    },
  });
}

const common = {
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  handler: limitHandler,
};

// Tight limit for credential + OTP endpoints — throttles brute-force and
// OTP-email bombing. Keyed by client IP (needs `trust proxy` set on the app).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts / IP / window
  ...common,
});

// Stricter still for the endpoint that actually sends an email.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 OTP emails / IP / window
  ...common,
});

// Generous ceiling for the whole API to blunt scraping / abuse without
// affecting normal use.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  ...common,
});

module.exports = { authLimiter, otpRequestLimiter, globalLimiter };
