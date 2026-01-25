const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const recurringController = require('../controllers/recurring-controller');

const router = express.Router();

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(['income', 'expense']);
const VALID_FREQUENCIES = new Set(['monthly', 'yearly']);
const VALID_PAYMENT_MODES = new Set(['direct', 'creditCard']);

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

function assertAmount(value) {
  if (typeof value !== 'number' || value <= 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'amount must be a number > 0',
      status: 400,
      details: null,
    });
  }
}

function assertDirection(value) {
  if (!VALID_DIRECTIONS.has(value)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'direction must be income or expense',
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
      message: 'month must be in YYYY-MM format',
      status: 400,
      details: null,
    });
  }
  const monthValue = Number(match[2]);
  if (monthValue < 1 || monthValue > 12) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'month must be between 01 and 12',
      status: 400,
      details: null,
    });
  }
}

function assertSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'schedule is required',
      status: 400,
      details: null,
    });
  }
  if (!VALID_FREQUENCIES.has(schedule.frequency)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'schedule.frequency must be monthly or yearly',
      status: 400,
      details: null,
    });
  }
  if (!Number.isInteger(schedule.dayOfMonth) || schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'schedule.dayOfMonth must be between 1 and 31',
      status: 400,
      details: null,
    });
  }

  if (schedule.frequency === 'yearly') {
    if (!Number.isInteger(schedule.month) || schedule.month < 1 || schedule.month > 12) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: 'schedule.month must be between 1 and 12',
        status: 400,
        details: null,
      });
    }
  }

  if (schedule.frequency === 'monthly' && 'month' in schedule) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'schedule.month is only allowed for yearly frequency',
      status: 400,
      details: null,
    });
  }
}

function assertPayment(payment) {
  if (!payment || typeof payment !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'payment is required',
      status: 400,
      details: null,
    });
  }
  if (!VALID_PAYMENT_MODES.has(payment.mode)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'payment.mode must be direct or creditCard',
      status: 400,
      details: null,
    });
  }
}

function assertIsActive(value) {
  if (typeof value !== 'boolean') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'isActive must be boolean',
      status: 400,
      details: null,
    });
  }
}

function validateCreateRecurring(req) {
  assertBodyObject(req.body);
  assertString(req.body.id, 'id');
  assertString(req.body.name, 'name');
  assertDirection(req.body.direction);
  assertAmount(req.body.amount);
  assertString(req.body.categoryId, 'categoryId');
  assertSchedule(req.body.schedule);
  assertPayment(req.body.payment);
  assertIsActive(req.body.isActive);
}

function validateUpdateRecurring(req) {
  assertString(req.params.id, 'id');
  assertBodyObject(req.body);

  if ('id' in req.body && req.body.id !== req.params.id) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Body id must match route id',
      status: 400,
      details: null,
    });
  }

  assertString(req.body.name, 'name');
  assertDirection(req.body.direction);
  assertAmount(req.body.amount);
  assertString(req.body.categoryId, 'categoryId');
  assertSchedule(req.body.schedule);
  assertPayment(req.body.payment);
  assertIsActive(req.body.isActive);
}

function validateDeleteRecurring(req) {
  assertString(req.params.id, 'id');
}

function validateGenerateRecurring(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
}

router.get('/recurrences', recurringController.listRecurring);
router.post('/recurrences', validateRequest(validateCreateRecurring), recurringController.createRecurring);
router.put('/recurrences/:id', validateRequest(validateUpdateRecurring), recurringController.updateRecurring);
router.delete('/recurrences/:id', validateRequest(validateDeleteRecurring), recurringController.deleteRecurring);
router.post(
  '/recurrences/:month/generate',
  validateRequest(validateGenerateRecurring),
  recurringController.generateRecurringTransactions
);

module.exports = { recurringRouter: router };
