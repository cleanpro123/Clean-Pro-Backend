const AppError = require('../../../shared/errors/AppError');
const { verifyRefresh } = require('../../../infrastructure/security/jwt');
const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const adminRepo = require('../../../infrastructure/db/repositories/adminRepository');
const issueTokens = require('./issueTokens');

const repos = { user: userRepo, agent: agentRepo, admin: adminRepo };

async function refreshTokens({ refreshToken }) {
  if (!refreshToken) throw AppError.badRequest('Missing refresh token');

  const stored = await refreshTokenRepo.findValid(refreshToken);
  if (!stored) throw AppError.unauthorized('Invalid or expired refresh token');

  let decoded;
  try {
    decoded = verifyRefresh(refreshToken);
  } catch {
    await refreshTokenRepo.revokeByToken(refreshToken);
    throw AppError.unauthorized('Invalid refresh token');
  }

  const repo = repos[decoded.role];
  if (!repo) throw AppError.unauthorized();

  const subject = await repo.findById(decoded.sub);
  if (!subject) throw AppError.unauthorized();

  // rotate: revoke old, issue new pair
  await refreshTokenRepo.revokeByToken(refreshToken);
  const tokens = await issueTokens({
    subjectId: subject._id,
    role: decoded.role,
    name: subject.name,
  });

  return { tokens, role: decoded.role };
}

module.exports = refreshTokens;
