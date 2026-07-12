const AppError = require('../../../shared/errors/AppError');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');

// Update one of a user's addresses after verifying ownership. Returns the
// refreshed address document.
async function updateAddress({ userId, addressId, patch }) {
  const address = await addressRepo.findById(addressId);
  if (!address || String(address.userId) !== String(userId)) {
    throw AppError.notFound('Address not found');
  }
  return addressRepo.updateById(addressId, patch);
}

module.exports = updateAddress;
