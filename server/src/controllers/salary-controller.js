const salaryService = require('../services/salary-service');
const { sendSuccess } = require('../http/response');

async function getSalaryConfig(req, res, next) {
  try {
    const config = await salaryService.getSalaryConfig();
    return sendSuccess(res, { data: config, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function updateSalaryConfig(req, res, next) {
  try {
    const config = await salaryService.updateSalaryConfig(req.body);
    return sendSuccess(res, { data: config, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function generateSalaryProjections(req, res, next) {
  try {
    const { month } = req.params;
    const items = await salaryService.generateSalaryProjectionsForMonth({ month });
    return sendSuccess(res, { data: { items }, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

async function confirmSalaryTransactions(req, res, next) {
  try {
    const { month } = req.params;
    const { currentDate } = req.body;
    const result = await salaryService.confirmSalaryTransactionsForMonth({
      month,
      currentDate,
    });
    return sendSuccess(res, { data: result, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSalaryConfig,
  updateSalaryConfig,
  generateSalaryProjections,
  confirmSalaryTransactions,
};
