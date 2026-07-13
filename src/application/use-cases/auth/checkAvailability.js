const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const requestEmailOtp = require('./requestEmailOtp');

// Signup "Continue" in one round-trip:
//   - If the email is already tied to an account, report it as taken and DO NOT
//     send an OTP (the form shows a "log in instead" prompt).
//   - Otherwise this is a fresh signup, so send the verification code
//     immediately on the same call instead of a second /otp/request round-trip.
// Phone is intentionally NOT checked — numbers may be shared across accounts.
// The register use-case still re-checks the email as the authoritative guard.
async function checkAvailability({ email }) {
  const emailUser = email ? await userRepo.findByEmail(email) : null;
  const emailTaken = Boolean(emailUser);

  if (emailTaken) {
    return { emailTaken: true, phoneTaken: false, otpSent: false };
  }

  // Free → send the signup OTP now.
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
