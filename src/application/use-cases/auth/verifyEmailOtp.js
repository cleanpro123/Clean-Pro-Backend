const env = require('../../../config/env');
const AppError = require('../../../shared/errors/AppError');
const { hashCode } = require('../../../shared/utils/otp');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');

async function verifyEmailOtp({ email, code }) {
  const rec = await otpRepo.findByEmail(email);
  if (!rec) throw AppError.badRequest('Please request a new code');
  if (rec.expiresAt < new Date()) throw AppError.badRequest('Code expired — request a new one');
  if (rec.attempts >= env.otp.maxAttempts)
    throw AppError.badRequest('Too many attempts — request a new code');

  if (rec.codeHash !== hashCode(code)) {
    await otpRepo.incAttempts(rec._id);
    throw AppError.badRequest('Invalid code');
  }

  await otpRepo.markVerified(rec._id);
  return { verified: true };
}

module.exports = verifyEmailOtp;
