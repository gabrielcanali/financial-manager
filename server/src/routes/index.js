const express = require('express');
const { healthRouter } = require('./health-route');
const { categoriesRouter } = require('./categories-route');
const { creditCardRouter } = require('./credit-card-route');
const { transactionsRouter } = require('./transactions-route');

const router = express.Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(creditCardRouter);
router.use(transactionsRouter);

module.exports = { routes: router };
