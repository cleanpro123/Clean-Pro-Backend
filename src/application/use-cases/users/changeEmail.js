const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');

// Change a signed-in customer's email after they've proven they own the new
// address via OTP (request code → verify → change). Same shape as the password
// reset flow, but authenticated and it updates the login identity instead.
async function changeEmail({ userId, email }) {
  const nextEmail = String(email).toLowerCase().trim();

  const otp = await otpRepo.findByEmail(nextEmail);
  if (!otp || !otp.verified || otp.expiresAt < new Date()) {
    throw AppError.badRequest('Please verify the new email before changing it');
  }

  // Guard against a race where the address got claimed between verify and now.
  const taken = await userRepo.findByEmail(nextEmail);
  if (taken && String(taken._id) !== String(userId)) {
    throw AppError.conflict('Email already registered');
  }

  const user = await userRepo.updateById(userId, { email: nextEmail });
  if (!user) throw AppError.notFound('Profile not found');

  // Consume the OTP so it can't be reused.
  await otpRepo.deleteByEmail(nextEmail);

  return user;
}

module.exports = changeEmail;
