const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const { hashPassword, comparePassword } = require('../../../infrastructure/security/password');

// In-app password change for a signed-in user: verify the current password,
// then store a fresh hash. (Forgotten passwords use the OTP reset flow instead.)
async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw AppError.badRequest('Your current password is incorrect');

  const same = await comparePassword(newPassword, user.passwordHash);
  if (same) throw AppError.badRequest('New password must be different from the current one');

  const passwordHash = await hashPassword(newPassword);
  await userRepo.updateById(userId, { passwordHash });
  return { changed: true };
}

module.exports = changePassword;
