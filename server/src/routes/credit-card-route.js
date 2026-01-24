const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const creditCardController = require('../controllers/credit-card-controller');

const router = express.Router();

function assertBodyObject(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Request body must be an object',
      status: 400,
      details: null,
    });
  }
}

function validateUpdateCreditCard(req) {
  assertBodyObject(req.body);

  if (!Number.isInteger(req.body.closingDay)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'closingDay must be an integer',
      status: 400,
      details: null,
    });
  }
  if (req.body.closingDay < 1 || req.body.closingDay > 31) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'closingDay must be between 1 and 31',
      status: 400,
      details: null,
    });
  }
}

router.get('/credit-cards', creditCardController.getCreditCardConfig);
router.put(
  '/credit-cards',
  validateRequest(validateUpdateCreditCard),
  creditCardController.updateCreditCardConfig
);

module.exports = { creditCardRouter: router };
