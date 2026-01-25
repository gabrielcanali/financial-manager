const path = require('path');
const dataRepository = require('../../data/dashboard-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function getMonthlySummary(month) {
  return dataRepository.getMonthlySummary(month, baseDir);
}

async function getAnnualSummary(year) {
  return dataRepository.getAnnualSummary(year, baseDir);
}

module.exports = {
  getMonthlySummary,
  getAnnualSummary,
};
