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

  const ok = await comparePassword(password, subject.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  const tokens = await issueTokens({
    subjectId: subject._id,
    role,
    name: subject.name,
  });

  return { subject, tokens };
}

module.exports = login;
