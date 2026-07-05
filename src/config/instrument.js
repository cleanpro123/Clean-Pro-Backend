// Sentry instrumentation — MUST be required before express/app so Sentry can
// auto-instrument HTTP and other libraries. Enabled only when SENTRY_DSN is set
// (so local dev without a DSN is unaffected).
//
// Set SENTRY_DSN in your environment (e.g. the Render dashboard).
require('dotenv').config();
const Sentry = require('@sentry/node');

const dsn = process.env.SENTRY_DSN;
const enabled = !!dsn;

if (enabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    // Don't attach IPs / request bodies with PII to events.
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
  });
}

// Capture only unexpected (5xx) errors — 4xx are normal client errors.
function captureError(err) {
  if (!enabled) return;
  try {
    Sentry.captureException(err);
  } catch {
    // never let telemetry throw into request handling
  }
}

module.exports = { Sentry, sentryEnabled: enabled, captureError };
