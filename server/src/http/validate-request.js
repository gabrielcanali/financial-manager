const { AppError } = require('./app-error');

const validateRequest = (validate) => (req, res, next) => {
  if (typeof validate !== 'function') {
    return next(
      new AppError({
        code: 'VALIDATION_CONFIG_INVALID',
        message: 'Validation function is required',
        status: 500,
        details: null,
      })
    );
  }

  try {
    validate(req);
    return next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }

    return next(
      new AppError({
        code: 'VALIDATION_ERROR',
        message: err?.message || 'Request validation failed',
        status: 400,
        details: err?.details ?? null,
      })
    );
  }
};

module.exports = { validateRequest };
