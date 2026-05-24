const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const { hashPassword } = require('../../../infrastructure/security/password');
const issueTokens = require('./issueTokens');

async function registerUser({ name, phone, email, password }) {
  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw AppError.conflict('Email already registered');

  const existingPhone = await userRepo.findByPhone(phone);
  if (existingPhone) throw AppError.conflict('Phone already registered');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ name, phone, email, passwordHash });

  const tokens = await issueTokens({
    subjectId: user._id,
    role: 'user',
    name: user.name,
  });

  return { user, tokens };
}

module.exports = registerUser;
