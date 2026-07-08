const userRepo = require('../../../infrastructure/db/repositories/userRepository');

// Report whether an email/phone is already tied to an account. Used by the
// signup form to warn the user on "Continue" before an OTP is ever sent — the
// register use-case still re-checks both as the authoritative guard.
async function checkAvailability({ email, phone }) {
  const [emailUser, phoneUser] = await Promise.all([
    email ? userRepo.findByEmail(email) : null,
    phone ? userRepo.findByPhone(phone) : null,
  ]);

  return {
    emailTaken: Boolean(emailUser),
    phoneTaken: Boolean(phoneUser),
  };
}

module.exports = checkAvailability;
