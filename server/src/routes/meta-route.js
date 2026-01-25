const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const metaController = require('../controllers/meta-controller');

const router = express.Router();

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

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

function assertString(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: `${field} is required`,
      status: 400,
      details: null,
    });
  }
}

function assertMonthString(month) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'lastOpenedMonth must be in YYYY-MM format',
      status: 400,
      details: null,
    });
  }
  const monthValue = Number(match[2]);
  if (monthValue < 1 || monthValue > 12) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'lastOpenedMonth must be between 01 and 12',
      status: 400,
      details: null,
    });
  }
}

function validateUpdateMeta(req) {
  assertBodyObject(req.body);
  assertString(req.body.lastOpenedMonth, 'lastOpenedMonth');
  assertMonthString(req.body.lastOpenedMonth);
}

router.get('/meta', metaController.getMeta);
router.put('/meta', validateRequest(validateUpdateMeta), metaController.updateLastOpenedMonth);

module.exports = { metaRouter: router };
