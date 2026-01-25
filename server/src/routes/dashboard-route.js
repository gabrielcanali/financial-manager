const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const dashboardController = require('../controllers/dashboard-controller');

const router = express.Router();

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const YEAR_PATTERN = /^(\d{4})$/;

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

function assertYearString(year) {
  if (!YEAR_PATTERN.test(year)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'year must be in YYYY format',
      status: 400,
      details: null,
    });
  }
}

function validateMonthlySummary(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
}

function validateAnnualSummary(req) {
  assertString(req.params.year, 'year');
  assertYearString(req.params.year);
}

router.get(
  '/dashboard/monthly/:month',
  validateRequest(validateMonthlySummary),
  dashboardController.getMonthlySummary
);
router.get(
  '/dashboard/annual/:year',
  validateRequest(validateAnnualSummary),
  dashboardController.getAnnualSummary
);

module.exports = { dashboardRouter: router };
