const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');
const requestRepo = require('../../../infrastructure/db/repositories/requestRepository');
const specialRequestRepo = require('../../../infrastructure/db/repositories/specialRequestRepository');
const reviewRepo = require('../../../infrastructure/db/repositories/reviewRepository');
const notificationRepo = require('../../../infrastructure/db/repositories/notificationRepository');
const refreshTokenRepo = require('../../../infrastructure/db/repositories/refreshTokenRepository');
const otpRepo = require('../../../infrastructure/db/repositories/emailOtpRepository');

// Permanently delete a user and EVERYTHING tied to their id, so no orphaned
// documents are left behind:
//   - orders (Request)        - addresses (Address)
//   - reviews (Review)        - notifications (Notification)
//   - login sessions (RefreshToken)  - any pending OTPs (by email)
// Used by both self-deletion (Privacy Center) and admin deletion.
async function deleteUser(userId) {
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  // Clear all related collections first, then the user record itself.
  await Promise.all([
    requestRepo.deleteByUser(userId),
    specialRequestRepo.deleteByUser(userId),
    addressRepo.deleteByUser(userId),
    reviewRepo.deleteByUser(userId),
    notificationRepo.deleteByUser(userId),
    refreshTokenRepo.deleteAllForSubject('user', userId),
    otpRepo.deleteByEmail(user.email),
  ]);

  await userRepo.remove(userId);
  return { deleted: true };
}

module.exports = deleteUser;
