const express = require('express');
const { healthRouter } = require('./health-route');
const { categoriesRouter } = require('./categories-route');
const { creditCardRouter } = require('./credit-card-route');
const { transactionsRouter } = require('./transactions-route');
const { installmentsRouter } = require('./installments-route');
const { recurringRouter } = require('./recurring-route');
const { salaryRouter } = require('./salary-route');
const { dashboardRouter } = require('./dashboard-route');
const { metaRouter } = require('./meta-route');

const router = express.Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(creditCardRouter);
router.use(transactionsRouter);
router.use(installmentsRouter);
router.use(recurringRouter);
router.use(salaryRouter);
router.use(dashboardRouter);
router.use(metaRouter);

module.exports = { routes: router };
