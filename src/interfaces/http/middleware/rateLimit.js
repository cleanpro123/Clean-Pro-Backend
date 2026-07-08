const rateLimit = require('express-rate-limit');

// Turn a seconds count into a friendly "X minutes" / "X seconds" phrase.
function formatWait(seconds) {
  if (!seconds || seconds < 1) return null;
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const mins = Math.ceil(seconds / 60);
  return `${mins} minute${mins === 1 ? '' : 's'}`;
}

// Emit a rejection in the same { ok, error } envelope the rest of the API uses,
// so the client's apiRequest() surfaces a clean message instead of a raw 429.
// The message tells the user exactly how long to wait, derived from the
// limiter's own reset time (also exposed via the standard Retry-After header).
function limitHandler(req, res) {
  const resetTime = req.rateLimit?.resetTime;
  const waitSeconds =
    resetTime instanceof Date
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : null;
  const wait = formatWait(waitSeconds);

  if (waitSeconds) res.set('Retry-After', String(waitSeconds));
  res.status(429).json({
    ok: false,
    error: {
      code: 'RATE_LIMITED',
      message: wait
        ? `Too many attempts. Please try again in ${wait}.`
        : 'Too many attempts. Please wait a moment and try again.',
      retryAfterSeconds: waitSeconds || undefined,
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
