const { AppError } = require('./app-error');
const { sendError } = require('./response');

const errorHandler = (err, req, res, next) => {
  const normalized = err instanceof AppError
    ? err
    : new AppError({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        status: 500,
        details: null,
      });

  return sendError(
    res,
    {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
    normalized.status
  );
};

module.exports = { errorHandler };
