const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const adminRepo = require('../../../infrastructure/db/repositories/adminRepository');
const { comparePassword } = require('../../../infrastructure/security/password');
const issueTokens = require('./issueTokens');

const repos = {
  user: userRepo,
  agent: agentRepo,
  admin: adminRepo,
};

async function login({ role, email, password }) {
  const repo = repos[role];
  if (!repo) throw AppError.badRequest('Unknown role');

  const subject = await repo.findByEmail(email);
  if (!subject) throw AppError.unauthorized('Invalid credentials');

  if (subject.status === 'blocked') {
    throw AppError.forbidden('This account has been blocked');
  }

  // Business accounts awaiting / denied admin review can't sign in.
  if (subject.approvalStatus === 'pending') {
    throw new AppError(
      'Your business account is pending admin approval',
      403,
      'PENDING_APPROVAL'
    );
  }
  if (subject.approvalStatus === 'rejected') {
    throw new AppError(
      'Your business account request was not approved',
      403,
      'ACCOUNT_REJECTED'
    );
  }

  const ok = await comparePassword(password, subject.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  // Customers carry an addresses array of Address refs — expand them so the
  // post-login profile matches what /auth/me returns.
  if (role === 'user') await subject.populate('addresses');

  const tokens = await issueTokens({
    subjectId: subject._id,
    role,
    name: subject.name,
  });

  return { subject, tokens };
}

module.exports = login;
