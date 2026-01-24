const express = require('express');
const { validateRequest } = require('../http/validate-request');
const categoriesController = require('../controllers/categories-controller');
const { AppError } = require('../http/app-error');
const { SPECIAL_CATEGORY_ID, SPECIAL_CATEGORY_NAME } = require('../services/categories-service');

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

function assertNotSpecial(value) {
  if (value === SPECIAL_CATEGORY_ID || value === SPECIAL_CATEGORY_NAME) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Special category is reserved',
      status: 400,
      details: null,
    });
  }
}

function validateCreateCategory(req) {
  assertBodyObject(req.body);
  assertString(req.body.id, 'id');
  assertString(req.body.name, 'name');

  if ('isSpecial' in req.body) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'isSpecial is not allowed in payload',
      status: 400,
      details: null,
    });
  }

  assertNotSpecial(req.body.id);
  assertNotSpecial(req.body.name);
}

function validateUpdateCategory(req) {
  assertString(req.params.id, 'id');
  assertBodyObject(req.body);
  assertString(req.body.name, 'name');

  if ('isSpecial' in req.body) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'isSpecial is not allowed in payload',
      status: 400,
      details: null,
    });
  }

  if ('id' in req.body && req.body.id !== req.params.id) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Body id must match route id',
      status: 400,
      details: null,
    });
  }

  assertNotSpecial(req.params.id);
  assertNotSpecial(req.body.name);
}

function validateDeleteCategory(req) {
  assertString(req.params.id, 'id');
  assertNotSpecial(req.params.id);
}

router.get('/categories', categoriesController.listCategories);
router.post('/categories', validateRequest(validateCreateCategory), categoriesController.createCategory);
router.put('/categories/:id', validateRequest(validateUpdateCategory), categoriesController.updateCategory);
router.delete('/categories/:id', validateRequest(validateDeleteCategory), categoriesController.deleteCategory);

module.exports = { categoriesRouter: router };
