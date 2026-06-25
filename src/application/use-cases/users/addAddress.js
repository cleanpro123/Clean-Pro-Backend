const AppError = require('../../../shared/errors/AppError');
const userRepo = require('../../../infrastructure/db/repositories/userRepository');
const addressRepo = require('../../../infrastructure/db/repositories/addressRepository');

// Create an Address document for a user and link its id onto the user's
// ordered addresses array. Returns the created address.
async function addAddress({ userId, ...fields }) {
  const user = await userRepo.findById(userId);
  if (!user) throw AppError.notFound('User not found');

  const address = await addressRepo.create({ ...fields, userId });
  await userRepo.pushAddress(userId, address._id);
  return address;
}

module.exports = addAddress;
