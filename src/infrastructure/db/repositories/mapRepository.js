const MapLocation = require('../models/MapLocation');
module.exports = {
  list: () => MapLocation.find().sort({ createdAt: -1 }),
  findById: (id) => MapLocation.findById(id),
  create: (data) => MapLocation.create(data),
  updateById: (id, patch) =>
    MapLocation.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => MapLocation.findByIdAndDelete(id),
};
