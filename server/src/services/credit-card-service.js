const { AppError } = require('../http/app-error');
const creditCardRepository = require('../repositories/credit-card-repository');

function assertClosingDay(closingDay) {
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new AppError({
      code: 'CREDIT_CARD_INVALID_CLOSING_DAY',
      message: 'closingDay must be an integer between 1 and 31',
      status: 400,
      details: { closingDay },
    });
  }
}

async function getCreditCardConfig() {
  return creditCardRepository.getCreditCardConfig();
}

async function updateCreditCardConfig({ closingDay }) {
  assertClosingDay(closingDay);
  return creditCardRepository.setCreditCardConfig({ closingDay });
}

module.exports = {
  getCreditCardConfig,
  updateCreditCardConfig,
};
