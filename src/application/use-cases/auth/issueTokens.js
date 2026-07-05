const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const { signAccess, signRefresh } = require('../../../infrastructure/security/jwt');
const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');

async function issueTokens({ subjectId, role, name }) {
  // jti guarantees uniqueness for tokens issued within the same second
  // (JWT iat is second-precision, so otherwise-identical payloads produce
  // identical tokens and would collide with the tokenHash unique index).
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = signAccess({
    sub: String(subjectId),
    role,
    name,
    jti: accessJti,
  });
  const refreshToken = signRefresh({
    sub: String(subjectId),
    role,
    jti: refreshJti,
  });

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await refreshTokenRepo.store({
    token: refreshToken,
    role,
    subjectId,
    expiresAt,
  });

  // Keep only the newest N sessions per subject so logging in repeatedly (or on
  // many devices) can't grow the collection unbounded.
  await refreshTokenRepo.enforceSessionCap(role, subjectId);

  return {
    accessToken,
    refreshToken,
    accessTtl: env.jwt.accessTtl,
    refreshTtl: env.jwt.refreshTtl,
  };
}

module.exports = issueTokens;
