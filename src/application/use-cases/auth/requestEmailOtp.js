const env = require('../../../config/env');
const AppError = require('../../../shared/errors/AppError');
const { generateCode, hashCode } = require('../../../shared/utils/otp');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const { sendMail, otpEmail } = require('../../../infrastructure/email/mailer');

async function requestEmailOtp({ email }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw AppError.conflict('Email already registered');

  const code = generateCode(env.otp.length);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60_000);
  await otpRepo.upsert(email, { codeHash: hashCode(code), expiresAt, purpose: 'register' });

  const { subject, text, html } = otpEmail(code, env.otp.ttlMinutes);
  await sendMail({ to: email, subject, text, html });

  return { sent: true, expiresInMinutes: env.otp.ttlMinutes };
}

module.exports = requestEmailOtp;
