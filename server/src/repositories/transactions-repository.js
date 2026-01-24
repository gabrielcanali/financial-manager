const path = require('path');
const dataRepository = require('../../data/transactions-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function listTransactions(month) {
  return dataRepository.listTransactions(month, baseDir);
}

async function createTransaction(month, transaction) {
  return dataRepository.createTransaction(month, transaction, baseDir);
}

async function updateTransaction(month, transaction) {
  return dataRepository.updateTransaction(month, transaction, baseDir);
}

async function deleteTransaction(month, transactionId) {
  return dataRepository.deleteTransaction(month, transactionId, baseDir);
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
