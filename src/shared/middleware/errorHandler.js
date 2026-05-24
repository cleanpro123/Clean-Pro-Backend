const AppError = require('../errors/AppError');
const logger = require('../../config/logger');

function notFound(_req, _res, next) {
  next(AppError.notFound('Route not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let appErr = err instanceof AppError ? err : null;

  if (!appErr) {
    // Mongoose / mongo errors → operational mapping
    if (err?.name === 'CastError') {
      appErr = AppError.badRequest(`Invalid ${err.path}`);
    } else if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      appErr = AppError.conflict(`${field} already in use`, err.keyValue);
    } else if (err?.name === 'ValidationError') {
      appErr = AppError.badRequest('Validation failed', {
        issues: Object.values(err.errors || {}).map((e) => ({
          path: e.path,
          message: e.message,
        })),
      });
    } else if (err?.name === 'JsonWebTokenError') {
      appErr = AppError.unauthorized('Invalid token');
    } else if (err?.name === 'TokenExpiredError') {
      appErr = AppError.unauthorized('Token expired');
    } else {
      appErr = new AppError(err.message || 'Internal Server Error', 500);
    }
  }

  if (appErr.statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.originalUrl } });
  } else {
    logger.warn(
      { code: appErr.code, message: appErr.message, url: req.originalUrl },
      'request error'
    );
  }

  res.status(appErr.statusCode).json({
    ok: false,
    error: {
      code: appErr.code,
      message: appErr.message,
      ...(appErr.details ? { details: appErr.details } : {}),
    },
  });
}

module.exports = { notFound, errorHandler };
