const Admin = require('../models/Admin');

module.exports = {
  findById: (id) => Admin.findById(id),
  findByEmail: (email) => Admin.findOne({ email: String(email).toLowerCase() }),
  create: (data) => Admin.create(data),
};
