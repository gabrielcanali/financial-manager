const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const salaryController = require('../controllers/salary-controller');

const router = express.Router();

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(['income']);
const VALID_ADVANCE_TYPES = new Set(['percent']);

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

function assertAmount(value, field) {
  if (typeof value !== 'number' || value <= 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: `${field} must be a number > 0`,
      status: 400,
      details: null,
    });
  }
}

function assertDirection(value) {
  if (!VALID_DIRECTIONS.has(value)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'direction must be income',
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

function parseIsoDate(dateString) {
  const match = ISO_DATE_PATTERN.exec(dateString);
  if (!match) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'currentDate must be in YYYY-MM-DD format',
      status: 400,
      details: null,
    });
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + 1 !== month ||
    candidate.getUTCDate() !== day
  ) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'currentDate must be a valid calendar day',
      status: 400,
      details: null,
    });
  }
}

function assertAdvance(advance) {
  if (!advance || typeof advance !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'advance is required',
      status: 400,
      details: null,
    });
  }
  if (typeof advance.enabled !== 'boolean') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'advance.enabled must be boolean',
      status: 400,
      details: null,
    });
  }

  if (!advance.enabled) {
    return;
  }

  if (!VALID_ADVANCE_TYPES.has(advance.type)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'advance.type must be percent',
      status: 400,
      details: null,
    });
  }
  if (!Number.isInteger(advance.day) || advance.day < 1 || advance.day > 31) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'advance.day must be between 1 and 31',
      status: 400,
      details: null,
    });
  }
  assertAmount(advance.value, 'advance.value');
}

function validateUpdateSalary(req) {
  assertBodyObject(req.body);

  assertAmount(req.body.baseSalary, 'baseSalary');
  assertDirection(req.body.direction);

  if (
    !Number.isInteger(req.body.paymentDay) ||
    req.body.paymentDay < 1 ||
    req.body.paymentDay > 31
  ) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'paymentDay must be an integer between 1 and 31',
      status: 400,
      details: null,
    });
  }

  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertAdvance(req.body.advance);
}

function validateGenerateSalary(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
}

function validateConfirmSalary(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
  if (!req.body || Object.keys(req.body).length === 0) {
    return;
  }
  assertBodyObject(req.body);
  assertString(req.body.currentDate, 'currentDate');
  parseIsoDate(req.body.currentDate);
}

router.get('/salaries', salaryController.getSalaryConfig);
router.put('/salaries', validateRequest(validateUpdateSalary), salaryController.updateSalaryConfig);
router.post(
  '/salaries/:month/generate',
  validateRequest(validateGenerateSalary),
  salaryController.generateSalaryProjections
);
router.post(
  '/salaries/:month/confirm',
  validateRequest(validateConfirmSalary),
  salaryController.confirmSalaryTransactions
);

module.exports = { salaryRouter: router };
