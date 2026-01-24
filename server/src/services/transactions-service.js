const { AppError } = require('../http/app-error');
const transactionsRepository = require('../repositories/transactions-repository');

function mapRepositoryError(error, { month, transactionId } = {}) {
  if (!error) {
    return null;
  }

  if (error.code === 'ENOENT') {
    return new AppError({
      code: 'TRANSACTIONS_MONTH_NOT_FOUND',
      message: 'Transactions month not found',
      status: 404,
      details: month ? { month } : null,
    });
  }

  const message = error.message || '';

  if (message.startsWith('Transaction id already exists')) {
    return new AppError({
      code: 'TRANSACTION_ALREADY_EXISTS',
      message: 'Transaction id already exists',
      status: 409,
      details: transactionId ? { id: transactionId } : null,
    });
  }

  if (message.startsWith('Transaction not found')) {
    return new AppError({
      code: 'TRANSACTION_NOT_FOUND',
      message: 'Transaction not found',
      status: 404,
      details: transactionId ? { id: transactionId } : null,
    });
  }

  return null;
}

async function listTransactions({ month }) {
  return transactionsRepository.listTransactions(month);
}

async function createTransaction({ month, transaction }) {
  try {
    return await transactionsRepository.createTransaction(month, transaction);
  } catch (error) {
    const mapped = mapRepositoryError(error, {
      month,
      transactionId: transaction?.id,
    });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function updateTransaction({ month, transaction }) {
  try {
    return await transactionsRepository.updateTransaction(month, transaction);
  } catch (error) {
    const mapped = mapRepositoryError(error, {
      month,
      transactionId: transaction?.id,
    });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function deleteTransaction({ month, transactionId }) {
  try {
    await transactionsRepository.deleteTransaction(month, transactionId);
  } catch (error) {
    const mapped = mapRepositoryError(error, { month, transactionId });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
