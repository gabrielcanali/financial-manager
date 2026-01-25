const metaService = require('../services/meta-service');
const { sendSuccess } = require('../http/response');

async function getMeta(req, res, next) {
  try {
    const meta = await metaService.getMeta();
    return sendSuccess(res, { data: meta, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function updateLastOpenedMonth(req, res, next) {
  try {
    const { lastOpenedMonth } = req.body;
    const meta = await metaService.updateLastOpenedMonth({ lastOpenedMonth });
    return sendSuccess(res, { data: meta, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMeta,
  updateLastOpenedMonth,
};
