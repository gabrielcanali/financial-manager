const { sendSuccess } = require('../http/response');

const getHealth = (req, res) => {
  return sendSuccess(res, { data: { status: 'ok' }, meta: {} }, 200);
};

module.exports = { getHealth };
