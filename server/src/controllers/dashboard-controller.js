const dashboardService = require('../services/dashboard-service');
const { sendSuccess } = require('../http/response');

async function getMonthlySummary(req, res, next) {
  try {
    const { month } = req.params;
    const summary = await dashboardService.getMonthlySummary({ month });
    return sendSuccess(res, { data: summary, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function getAnnualSummary(req, res, next) {
  try {
    const { year } = req.params;
    const summary = await dashboardService.getAnnualSummary({ year });
    return sendSuccess(res, { data: summary, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMonthlySummary,
  getAnnualSummary,
};
