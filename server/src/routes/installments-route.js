const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { AppError } = require('../http/app-error');
const installmentsController = require('../controllers/installments-controller');

const router = express.Router();

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(['income', 'expense']);
const VALID_MODES = new Set(['direct', 'creditCard']);
const VALID_STATUSES = new Set(['confirmed', 'projected']);
const VALID_CONFLICT_STRATEGIES = new Set([
  'skipEdited',
  'overwriteEdited',
  'cancel',
]);

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

function assertMode(value) {
  if (!VALID_MODES.has(value)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'mode must be direct or creditCard',
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

function assertSourceInstallment(source) {
  if (!source || typeof source !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'source is required',
      status: 400,
      details: null,
    });
  }
  if (source.type !== 'installment') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'source.type must be installment',
      status: 400,
      details: null,
    });
  }
}

function assertInstallmentParentFields(installment, groupId) {
  if (!installment || typeof installment !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment is required',
      status: 400,
      details: null,
    });
  }
  if (typeof installment.groupId !== 'string' || installment.groupId.length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.groupId is required',
      status: 400,
      details: null,
    });
  }
  if (installment.groupId !== groupId) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.groupId must match route groupId',
      status: 400,
      details: null,
    });
  }
  assertMode(installment.mode);
  if (!Number.isInteger(installment.total) || installment.total < 1) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.total must be an integer >= 1',
      status: 400,
      details: null,
    });
  }
  if (installment.index !== null) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.index must be null for parent',
      status: 400,
      details: null,
    });
  }
}

function assertInstallmentParcelFields(installment) {
  if (!installment || typeof installment !== 'object') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment is required',
      status: 400,
      details: null,
    });
  }
  if (typeof installment.groupId !== 'string' || installment.groupId.length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.groupId is required',
      status: 400,
      details: null,
    });
  }
  assertMode(installment.mode);
  if (!Number.isInteger(installment.total) || installment.total < 1) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.total must be an integer >= 1',
      status: 400,
      details: null,
    });
  }
  if (!Number.isInteger(installment.index) || installment.index < 1) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'installment.index must be an integer >= 1',
      status: 400,
      details: null,
    });
  }
}

function assertIdsArray(ids, total) {
  if (!Array.isArray(ids) || ids.length !== total) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'ids must be an array with length equal to total',
      status: 400,
      details: null,
    });
  }
  ids.forEach((id, index) => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `ids[${index}] must be a non-empty string`,
        status: 400,
        details: null,
      });
    }
  });
}

function assertConflictStrategy(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'conflictStrategy must be provided when set',
      status: 400,
      details: null,
    });
  }
  if (!VALID_CONFLICT_STRATEGIES.has(value)) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'conflictStrategy must be skipEdited, overwriteEdited, or cancel',
      status: 400,
      details: null,
    });
  }
}

function assertDeleteParcels(value) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'deleteParcels is required',
      status: 400,
      details: null,
    });
  }
  if (value !== 'true' && value !== 'false') {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'deleteParcels must be true or false',
      status: 400,
      details: null,
    });
  }
}

function validateCreateInstallmentPlan(req) {
  assertBodyObject(req.body);
  assertString(req.body.parentId, 'parentId');
  assertString(req.body.groupId, 'groupId');
  if (!Number.isInteger(req.body.total) || req.body.total < 1) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'total must be an integer >= 1',
      status: 400,
      details: null,
    });
  }
  assertMode(req.body.mode);
  assertString(req.body.firstDate, 'firstDate');
  parseIsoDate(req.body.firstDate);
  assertAmount(req.body.amount);
  assertDirection(req.body.direction);
  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertIdsArray(req.body.ids, req.body.total);
}

function validateUpdateInstallmentParent(req) {
  assertString(req.params.groupId, 'groupId');
  assertBodyObject(req.body);
  assertString(req.body.id, 'id');
  assertString(req.body.date, 'date');
  parseIsoDate(req.body.date);
  assertAmount(req.body.amount);
  assertDirection(req.body.direction);
  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertSourceInstallment(req.body.source);
  assertInstallmentParentFields(req.body.installment, req.params.groupId);

  if ('conflictStrategy' in req.query) {
    assertConflictStrategy(req.query.conflictStrategy);
  }
}

function validateUpdateInstallmentParcel(req) {
  assertString(req.params.month, 'month');
  assertMonthString(req.params.month);
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
  assertString(req.body.date, 'date');
  parseIsoDate(req.body.date);
  assertAmount(req.body.amount);
  assertDirection(req.body.direction);
  assertString(req.body.categoryId, 'categoryId');
  assertString(req.body.description, 'description');
  assertStatus(req.body.status);
  assertSourceInstallment(req.body.source);
  assertInstallmentParcelFields(req.body.installment);
}

function validateDeleteInstallmentGroup(req) {
  assertString(req.params.groupId, 'groupId');
  assertDeleteParcels(req.query.deleteParcels);
}

router.post(
  '/installments',
  validateRequest(validateCreateInstallmentPlan),
  installmentsController.createInstallmentPlan
);

router.put(
  '/installments/parents/:groupId',
  validateRequest(validateUpdateInstallmentParent),
  installmentsController.updateInstallmentParent
);

router.put(
  '/installments/parcels/:month/:id',
  validateRequest(validateUpdateInstallmentParcel),
  installmentsController.updateInstallmentParcel
);

router.delete(
  '/installments/parents/:groupId',
  validateRequest(validateDeleteInstallmentGroup),
  installmentsController.deleteInstallmentGroup
);

module.exports = { installmentsRouter: router };
