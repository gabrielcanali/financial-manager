const { AppError } = require('../http/app-error');
const recurringRepository = require('../repositories/recurring-repository');

function mapRepositoryError(error, context = {}) {
  if (!error) {
    return null;
  }

  const message = error.message || '';

  if (message.startsWith('Recurring id already exists')) {
    return new AppError({
      code: 'RECURRING_ALREADY_EXISTS',
      message: 'Recurring id already exists',
      status: 409,
      details: context.recurringId ? { id: context.recurringId } : null,
    });
  }

  if (message.startsWith('Recurring not found')) {
    return new AppError({
      code: 'RECURRING_NOT_FOUND',
      message: 'Recurring not found',
      status: 404,
      details: context.recurringId ? { id: context.recurringId } : null,
    });
  }

  if (message.startsWith('Transaction id already exists')) {
    return new AppError({
      code: 'RECURRING_TRANSACTION_ALREADY_EXISTS',
      message: 'Recurring transaction id already exists',
      status: 409,
      details: context.transactionId ? { id: context.transactionId } : null,
    });
  }

  return null;
}

function buildRecurringTransactionId(recurring, month) {
  return `rec_${recurring.id}_${month}`;
}

async function listRecurring() {
  return recurringRepository.listRecurring();
}

async function createRecurring(recurring) {
  try {
    return await recurringRepository.createRecurring(recurring);
  } catch (error) {
    const mapped = mapRepositoryError(error, { recurringId: recurring?.id });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function updateRecurring(recurring) {
  try {
    return await recurringRepository.updateRecurring(recurring);
  } catch (error) {
    const mapped = mapRepositoryError(error, { recurringId: recurring?.id });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function deleteRecurring(recurringId) {
  try {
    await recurringRepository.deleteRecurring(recurringId);
  } catch (error) {
    const mapped = mapRepositoryError(error, { recurringId });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function generateRecurringTransactionsForMonth({ month }) {
  const transactionIdFactory = (recurring, date, targetMonth) => {
    const monthKey = targetMonth || month;
    if (!monthKey) {
      throw new Error('Month is required to generate recurring transactions');
    }
    return buildRecurringTransactionId(recurring, monthKey);
  };

  try {
    return await recurringRepository.generateRecurringTransactionsForMonth(
      month,
      { transactionIdFactory }
    );
  } catch (error) {
    const mapped = mapRepositoryError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  generateRecurringTransactionsForMonth,
};
