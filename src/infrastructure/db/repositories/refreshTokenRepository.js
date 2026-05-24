const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashToken,
  store: ({ token, role, subjectId, expiresAt }) =>
    RefreshToken.create({
      tokenHash: hashToken(token),
      role,
      subjectId,
      expiresAt,
    }),
  findValid: (token) =>
    RefreshToken.findOne({
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
  revokeByToken: (token) =>
    RefreshToken.findOneAndUpdate(
      { tokenHash: hashToken(token) },
      { revokedAt: new Date() }
    ),
  revokeAllForSubject: (role, subjectId) =>
    RefreshToken.updateMany(
      { role, subjectId, revokedAt: null },
      { revokedAt: new Date() }
    ),
};
