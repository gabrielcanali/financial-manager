const path = require('path');
const dataRepository = require('../../data/recurring-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function listRecurring() {
  return dataRepository.listRecurring(baseDir);
}

async function createRecurring(recurring) {
  return dataRepository.createRecurring(recurring, baseDir);
}

async function updateRecurring(recurring) {
  return dataRepository.updateRecurring(recurring, baseDir);
}

async function deleteRecurring(recurringId) {
  return dataRepository.deleteRecurring(recurringId, baseDir);
}

async function generateRecurringTransactionsForMonth(month, options = {}) {
  return dataRepository.generateRecurringTransactionsForMonth(month, options, baseDir);
}

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  generateRecurringTransactionsForMonth,
};
