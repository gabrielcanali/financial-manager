const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const transactionsController = require('../controllers/transactions-controller');

const router = express.Router();

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(['income', 'expense']);
const VALID_STATUSES = new Set(['confirmed', 'projected']);
const VALID_SOURCES = new Set(['manual', 'recurring', 'installment', 'salary']);

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

function parseIsoDate(dateString) {
  const match = ISO_DATE_PATTERN.exec(dateString);
  if (!match) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'date must be in YYYY-MM-DD format',
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
      message: 'date must be a valid calendar day',
      status: 400,
      details: null,
    });
  }

  return { year, month, day };
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

function assertStatus(value) {
  if (!VALID_STATUSES.has(value)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'status must be confirmed or projected',
      status: 400,
      details: null,
    });
  }
}

function assertSource(source) {
  if (!source || typeof source !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'source is required',
      status: 400,
      details: null,
    });
  }
  if (typeof source.type !== 'string' || source.type.length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'source.type is required',
      status: 400,
      details: null,
    });
  }
  if (!VALID_SOURCES.has(source.type)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'source.type must be manual, recurring, installment, or salary',
      status: 400,
      details: null,
    });
  }
}

function assertDateMatchesMonth(dateString, monthString) {
  const { year, month } = parseIsoDate(dateString);
  const match = MONTH_PATTERN.exec(monthString);
  const monthValue = Number(match[2]);
  const yearValue = Number(match[1]);
  if (year !== yearValue || month !== monthValue) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'date must belong to the requested month',
      status: 400,
      details: null,
    });
  }
}

function validateListTransactions(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
}

function validateCreateTransaction(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
  assertBodyObject(req.body);
  assertString(req.body.id, 'id');
  assertString(req.body.date, 'date');
  parseIsoDate(req.body.date);
  assertAmount(req.body.amount);
  assertDirection(req.body.direction);
  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertStatus(req.body.status);
  assertSource(req.body.source);
  assertDateMatchesMonth(req.body.date, req.params.month);
}

function validateUpdateTransaction(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
  assertString(req.params.id, 'id');
  assertBodyObject(req.body);
  if ('id' in req.body) {
    assertString(req.body.id, 'id');
    if (req.body.id !== req.params.id) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: 'Body id must match route id',
        status: 400,
        details: null,
      });
    }
  }
  assertString(req.body.date, 'date');
  parseIsoDate(req.body.date);
  assertAmount(req.body.amount);
  assertDirection(req.body.direction);
  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertStatus(req.body.status);
  assertSource(req.body.source);
  assertDateMatchesMonth(req.body.date, req.params.month);
}

function validateDeleteTransaction(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
  assertString(req.params.id, 'id');
}

router.get(
  '/transactions/:month',
  validateRequest(validateListTransactions),
  transactionsController.listTransactions
);
router.post(
  '/transactions/:month',
  validateRequest(validateCreateTransaction),
  transactionsController.createTransaction
);
router.put(
  '/transactions/:month/:id',
  validateRequest(validateUpdateTransaction),
  transactionsController.updateTransaction
);
router.delete(
  '/transactions/:month/:id',
  validateRequest(validateDeleteTransaction),
  transactionsController.deleteTransaction
);

module.exports = { transactionsRouter: router };
