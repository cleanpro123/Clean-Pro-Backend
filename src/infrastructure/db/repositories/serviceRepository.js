const Service = require('../models/Service');
module.exports = {
  list: (filter = {}) => Service.find(filter).sort({ createdAt: 1 }),
  findById: (id) => Service.findById(id),
  findByKey: (key) => Service.findOne({ key: String(key).toLowerCase() }),
  create: (data) => Service.create(data),
  updateById: (id, patch) =>
    Service.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id) => Service.findByIdAndDelete(id),
};
