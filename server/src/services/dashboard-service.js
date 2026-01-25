const dashboardRepository = require('../repositories/dashboard-repository');

async function getMonthlySummary({ month }) {
  return dashboardRepository.getMonthlySummary(month);
}

async function getAnnualSummary({ year }) {
  return dashboardRepository.getAnnualSummary(year);
}

module.exports = {
  getMonthlySummary,
  getAnnualSummary,
};
