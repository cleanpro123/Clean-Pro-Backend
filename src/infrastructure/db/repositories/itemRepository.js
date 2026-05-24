const Item = require('../models/Item');
module.exports = {
  list: (filter = {}) => Item.find(filter).sort({ createdAt: 1 }),
  findById: (id) => Item.findById(id),
  create: (data) => Item.create(data),
  updateById: (id, patch) =>
    Item.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Item.findByIdAndDelete(id),
};
