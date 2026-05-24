const AppError = require('../../../shared/errors/AppError');
const { verifyAccess } = require('../../../infrastructure/security/jwt');

module.exports = function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing bearer token'));
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccess(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (err) {
    next(err);
  }
};
