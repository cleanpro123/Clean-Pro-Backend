const AppError = require('../../../shared/errors/AppError');
const { verifyAccess } = require('../../../infrastructure/security/jwt');

const repos = {
  user: require('../../../infrastructure/db/repositories/userRepository'),
  agent: require('../../../infrastructure/db/repositories/agentRepository'),
  admin: require('../../../infrastructure/db/repositories/adminRepository'),
};

module.exports = async function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing bearer token'));
  }
  const token = header.slice(7);
  try {
    const decoded = verifyAccess(token);
    const repo = repos[decoded.role];
    const subject = repo && await repo.findById(decoded.sub);
    if (!subject) throw AppError.unauthorized('Account no longer exists');
    if (['blocked', 'deactivated'].includes(subject.status)) {
      throw AppError.forbidden('This account is not active');
    }
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
