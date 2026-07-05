const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

// Keep at most this many active sessions (rows) per subject. Logging in on more
// devices than this deletes the oldest session(s). Bump if users legitimately
// need more simultaneous devices.
const MAX_SESSIONS_PER_SUBJECT = 5;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashToken,
  MAX_SESSIONS_PER_SUBJECT,

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
      // Kept for back-compat with any existing soft-revoked rows; new rows are
      // deleted rather than revoked, so this is normally null.
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),

  // Delete a single session row (used on logout and on rotation) so revoked
  // tokens don't linger in the collection until their TTL expiry.
  deleteByToken: (token) =>
    RefreshToken.deleteOne({ tokenHash: hashToken(token) }),

  // Delete every session for a subject — e.g. "log out of all devices",
  // password change, or when an account is blocked.
  deleteAllForSubject: (role, subjectId) =>
    RefreshToken.deleteMany({ role, subjectId }),

  // Trim to the newest MAX_SESSIONS_PER_SUBJECT rows for this subject, deleting
  // any older sessions beyond the cap.
  enforceSessionCap: async (role, subjectId, max = MAX_SESSIONS_PER_SUBJECT) => {
    const toRemove = await RefreshToken.find({ role, subjectId })
      .sort({ createdAt: -1 })
      .skip(max)
      .select('_id')
      .lean();
    if (toRemove.length) {
      await RefreshToken.deleteMany({ _id: { $in: toRemove.map((d) => d._id) } });
    }
  },
};
