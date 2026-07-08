const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');
const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');
const { hashPassword } = require('../../../infrastructure/security/password');

// Reset a customer's password after they've verified their email via OTP
// (same flow as signup: request code → verify → reset).
async function resetPassword({ email, password }) {
  const otp = await otpRepo.findByEmail(email);
  if (!otp || !otp.verified || otp.expiresAt < new Date()) {
    throw AppError.badRequest('Please verify your email before resetting your password');
  }

  const user = await userRepo.findByEmail(email);
  if (!user) throw AppError.notFound('No account found for this email');

  const passwordHash = await hashPassword(password);
  await userRepo.updateById(user._id, { passwordHash });

  // Consume the OTP so it can't be reused, and sign the account out of all
  // devices — a password reset should invalidate every existing session.
  await otpRepo.deleteByEmail(email);
  await refreshTokenRepo.deleteAllForSubject('user', user._id);

  return { ok: true };
}

module.exports = resetPassword;
