const env = require('../../../config/env');
const AppError = require('../../../shared/errors/AppError');
const { generateCode, hashCode } = require('../../../shared/utils/otp');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const { sendMail, otpEmail } = require('../../../infrastructure/email/mailer');

// purpose 'register'     → email must NOT exist yet (new signup).
// purpose 'reset'        → email MUST exist (password reset for an account).
// purpose 'change-email' → code goes to the NEW address, which must be free.
async function requestEmailOtp({ email, purpose = 'register' }) {
  const existing = await userRepo.findByEmail(email);
  if ((purpose === 'register' || purpose === 'change-email') && existing) {
    throw AppError.conflict('Email already registered');
  }
  if (purpose === 'reset' && !existing) {
    throw AppError.notFound('No account found for this email');
  }

  const code = generateCode(env.otp.length);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60_000);
  await otpRepo.upsert(email, { codeHash: hashCode(code), expiresAt, purpose });

  const { subject, text, html } = otpEmail(code, env.otp.ttlMinutes);
  await sendMail({ to: email, subject, text, html });

  return { sent: true, expiresInMinutes: env.otp.ttlMinutes };
}

module.exports = requestEmailOtp;
