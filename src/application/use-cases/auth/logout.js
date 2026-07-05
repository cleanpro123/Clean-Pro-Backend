const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');

async function logout({ refreshToken }) {
  if (!refreshToken) return;
  // Delete the session row outright so logout leaves no lingering token.
  await refreshTokenRepo.deleteByToken(refreshToken);
}

module.exports = logout;
