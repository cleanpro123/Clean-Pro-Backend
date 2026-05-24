const AppError = require('../errors/AppError');

module.exports = function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;
      next();
    } catch (err) {
      if (err?.issues) {
        return next(
          AppError.badRequest('Validation failed', {
            issues: err.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          })
        );
      }
      next(err);
    }
  };
};
