const express = require('express');
const { validateRequest } = require('../http/validate-request');
const { getHealth } = require('../controllers/health-controller');

const router = express.Router();

const validateHealth = () => {
  return true;
};

router.get('/health', validateRequest(validateHealth), getHealth);

module.exports = { healthRouter: router };
