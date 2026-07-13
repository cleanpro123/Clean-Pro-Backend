const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');
const { hashPassword } = require('../../../infrastructure/security/password');
const issueTokens = require('./issueTokens');

async function registerUser({ name, phone, email, password, avatar }) {
  // Email must have been verified via OTP first.
  const otp = await otpRepo.findByEmail(email);
  if (!otp || !otp.verified || otp.expiresAt < new Date()) {
    throw AppError.badRequest('Please verify your email before creating an account');
  }

  const existingEmail = await userRepo.findByEmail(email);
  if (existingEmail) throw AppError.conflict('Email already registered');

  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({
    name,
    phone,
    email,
    passwordHash,
    avatar,
  });

  // Consume the OTP so it can't be reused.
  await otpRepo.deleteByEmail(email);

  const tokens = await issueTokens({
    subjectId: user._id,
    role: 'user',
    name: user.name,
  });

  return { user, tokens };
}

module.exports = registerUser;
