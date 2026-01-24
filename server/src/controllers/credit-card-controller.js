const creditCardService = require('../services/credit-card-service');
const { sendSuccess } = require('../http/response');

async function getCreditCardConfig(req, res, next) {
  try {
    const config = await creditCardService.getCreditCardConfig();
    return sendSuccess(res, { data: config, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function updateCreditCardConfig(req, res, next) {
  try {
    const { closingDay } = req.body;
    const config = await creditCardService.updateCreditCardConfig({ closingDay });
    return sendSuccess(res, { data: config, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getCreditCardConfig,
  updateCreditCardConfig,
};
