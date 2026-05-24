const AppError = require('../../../shared/errors/AppError');

module.exports = function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
};
