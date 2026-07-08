const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const requestEmailOtp = require('./requestEmailOtp');

// Signup "Continue" in one round-trip:
//   - If the email or phone is already tied to an account, report which one is
//     taken and DO NOT send an OTP (the form shows a "log in instead" prompt).
//   - If both are free, this is a fresh signup, so send the verification code
//     immediately on the same call instead of a second /otp/request round-trip.
// The register use-case still re-checks both as the authoritative guard.
async function checkAvailability({ email, phone }) {
  const [emailUser, phoneUser] = await Promise.all([
    email ? userRepo.findByEmail(email) : null,
    phone ? userRepo.findByPhone(phone) : null,
  ]);

  const emailTaken = Boolean(emailUser);
  const phoneTaken = Boolean(phoneUser);

  if (emailTaken || phoneTaken) {
    return { emailTaken, phoneTaken, otpSent: false };
  }

  // Both free → send the signup OTP now.
  const otp = email
    ? await requestEmailOtp({ email, purpose: 'register' })
    : { sent: false };

  return {
    emailTaken: false,
    phoneTaken: false,
    otpSent: Boolean(otp.sent),
    expiresInMinutes: otp.expiresInMinutes,
  };
}

module.exports = checkAvailability;
