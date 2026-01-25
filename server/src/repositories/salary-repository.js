const path = require('path');
const dataRepository = require('../../data/salary-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function getSalaryConfig() {
  return dataRepository.getSalaryConfig(baseDir);
}

async function setSalaryConfig(config) {
  return dataRepository.setSalaryConfig(config, baseDir);
}

async function generateSalaryProjectionsForMonth(month, options) {
  return dataRepository.generateSalaryProjectionsForMonth(month, options, baseDir);
}

async function confirmSalaryTransactionsForMonth(month, currentDate) {
  return dataRepository.confirmSalaryTransactionsForMonth(month, currentDate, baseDir);
}

module.exports = {
  getSalaryConfig,
  setSalaryConfig,
  generateSalaryProjectionsForMonth,
  confirmSalaryTransactionsForMonth,
};
