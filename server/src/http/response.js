const sendSuccess = (res, { data = {}, meta = {} } = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    meta,
  });
};

const sendError = (res, { code, message, details }, status = 500) => {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details: details ?? null,
    },
  });
};

module.exports = { sendSuccess, sendError };
