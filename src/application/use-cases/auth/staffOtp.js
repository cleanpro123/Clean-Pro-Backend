const env = require('../../../config/env');
const AppError = require('../../../shared/errors/AppError');
const { generateCode, hashCode } = require('../../../shared/utils/otp');
const otpRepo = require('../../../infrastructure/db/repositories/staffOtpRepository');
const adminRepo = require('../../../infrastructure/db/repositories/adminRepository');
const agentRepo = require('../../../infrastructure/db/repositories/agentRepository');
const { sendMail, otpEmail } = require('../../../infrastructure/email/mailer');

function identity({ email, role, requestedBy }) {
  if (!['admin', 'agent'].includes(role)) throw AppError.badRequest('Invalid account role');
  return { email: email.trim().toLowerCase(), role, requestedBy };
}

exports.request = async (input) => {
  const key = identity(input);
  const repo = key.role === 'admin' ? adminRepo : agentRepo;
  if (await repo.findByEmail(key.email)) throw AppError.conflict('This email is already registered');
  const code = generateCode(env.otp.length);
  await otpRepo.upsert(key, {
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + env.otp.ttlMinutes * 60_000),
  });
  await sendMail({ to: key.email, ...otpEmail(code, env.otp.ttlMinutes) });
  return { sent: true, expiresInMinutes: env.otp.ttlMinutes, codeLength: env.otp.length };
};

exports.consume = async (input) => {
  const rec = await otpRepo.find(identity(input));
  if (!rec) throw AppError.badRequest('Please request a verification code first');
  if (rec.expiresAt <= new Date()) throw AppError.badRequest('Code expired — request a new one');
  if (rec.attempts >= env.otp.maxAttempts) throw AppError.badRequest('Too many attempts — request a new code');
  const codeHash = hashCode(input.otpCode || '');
  if (rec.codeHash !== codeHash) {
    await otpRepo.incrementAttempts(rec._id);
    throw AppError.badRequest('Invalid verification code');
  }
  if (!await otpRepo.consume(rec._id, codeHash, env.otp.maxAttempts)) {
    throw AppError.badRequest('Code expired or already used — request a new one');
  }
};
