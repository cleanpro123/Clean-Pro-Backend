const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');

// Delete one of a user's addresses: verify ownership, drop the Address
// document, then unlink its id from the user's addresses array. Returns the
// refreshed user (with addresses populated).
async function removeAddress({ userId, addressId }) {
  const address = await addressRepo.findById(addressId);
  if (!address || String(address.userId) !== String(userId)) {
    throw AppError.notFound('Address not found');
  }

  await addressRepo.deleteById(addressId);
  const user = await userRepo.pullAddress(userId, addressId);
  return user;
}

module.exports = removeAddress;
