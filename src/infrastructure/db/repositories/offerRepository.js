const Offer = require('../models/Offer');
module.exports = {
  list: (filter = {}) => Offer.find(filter).sort({ createdAt: -1 }),
  findById: (id) => Offer.findById(id),
  findByCode: (code) => Offer.findOne({ code: String(code).toUpperCase() }),
  create: (data) => Offer.create(data),
  updateById: (id, patch) =>
    Offer.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Offer.findByIdAndDelete(id),
};
