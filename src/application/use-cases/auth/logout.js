const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');

async function logout({ refreshToken }) {
  if (!refreshToken) return;
  await refreshTokenRepo.revokeByToken(refreshToken);
}

module.exports = logout;
