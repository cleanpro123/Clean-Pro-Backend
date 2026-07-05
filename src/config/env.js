require('dotenv').config();

// Fail fast at boot: a missing DB URI or JWT secret must crash immediately with
// a clear message, never silently fall back to an insecure default or run with
// `undefined` (which forges/verifies tokens with a blank key).
const missing = [];

// Required everywhere — the app cannot function or is insecure without these.
const REQUIRED = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// Required so signup OTP email actually sends. If you haven't wired email yet,
// remove these from the list — but then OTP requests will fail at runtime.
const REQUIRED_EMAIL = ['EMAIL_USER', 'EMAIL_APP_PASSWORD'];

function required(name) {
  const val = process.env[name];
  if (val === undefined || val === '') {
    missing.push(name);
    return undefined;
  }
  return val;
}

// Non-secret operational settings keep sane defaults so a missing one can't
// silently produce NaN/undefined.
function optional(name, fallback) {
  const val = process.env[name];
  return val === undefined || val === '' ? fallback : val;
}

[...REQUIRED, ...REQUIRED_EMAIL].forEach(required);

// A weak/short JWT secret is as bad as a missing one — reject obvious defaults.
const WEAK = new Set(['secret', 'changeme', 'dev-access-secret', 'dev-refresh-secret', 'replace-me']);
for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
  const v = process.env[name];
  if (v && (v.length < 16 || WEAK.has(v.toLowerCase()) || v.startsWith('replace-me'))) {
    missing.push(`${name} (too weak — use a long random string, min 16 chars)`);
  }
}

if (missing.length) {
  // Thrown synchronously on require → server.js never starts a broken instance.
  throw new Error(
    `Missing/invalid required environment variables:\n  - ${missing.join(
      '\n  - '
    )}\nSet these in your environment (e.g. Render dashboard) before starting.`
  );
}

const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', 4000)),
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: optional('JWT_ACCESS_TTL', '15m'),
    refreshTtl: optional('JWT_REFRESH_TTL', '7d'),
  },
  bcryptRounds: Number(optional('BCRYPT_ROUNDS', 10)),
  corsOrigin: optional('CORS_ORIGIN', '*'),
  logLevel: optional('LOG_LEVEL', 'info'),
  email: {
    host: optional('EMAIL_HOST', 'smtp.gmail.com'),
    port: Number(optional('EMAIL_PORT', 465)),
    secure: String(optional('EMAIL_SECURE', 'true')) === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
    from: optional('EMAIL_FROM', `Clean Pro <${process.env.EMAIL_USER}>`),
  },
  otp: {
    length: Number(optional('OTP_LENGTH', 6)),
    ttlMinutes: Number(optional('OTP_TTL_MINUTES', 10)),
    maxAttempts: Number(optional('OTP_MAX_ATTEMPTS', 5)),
  },
};

module.exports = env;
