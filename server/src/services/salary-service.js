const { AppError } = require('../http/app-error');
const salaryRepository = require('../repositories/salary-repository');

function mapRepositoryError(error, context = {}) {
  if (!error) {
    return null;
  }

  if (error.code === 'ENOENT') {
    return new AppError({
      code: 'SALARY_NOT_CONFIGURED',
      message: 'Salary config not found',
      status: 404,
      details: null,
    });
  }

  const message = error.message || '';

  if (message.startsWith('Transaction id already exists')) {
    return new AppError({
      code: 'SALARY_TRANSACTION_ALREADY_EXISTS',
      message: 'Salary transaction id already exists',
      status: 409,
      details: context.transactionId ? { id: context.transactionId } : null,
    });
  }

  return null;
}

function buildSalaryTransactionId({ type, month }) {
  return `salary_${month}_${type}`;
}

function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function getSalaryConfig() {
  try {
    return await salaryRepository.getSalaryConfig();
  } catch (error) {
    const mapped = mapRepositoryError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function updateSalaryConfig(config) {
  try {
    return await salaryRepository.setSalaryConfig(config);
  } catch (error) {
    const mapped = mapRepositoryError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function generateSalaryProjectionsForMonth({ month }) {
  const transactionIdFactory = ({ type, month: targetMonth }) => {
    const monthKey = targetMonth || month;
    if (!monthKey) {
      throw new Error('Month is required to generate salary transactions');
    }
    return buildSalaryTransactionId({ type, month: monthKey });
  };

  try {
    return await salaryRepository.generateSalaryProjectionsForMonth(month, {
      transactionIdFactory,
    });
  } catch (error) {
    const mapped = mapRepositoryError(error);
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function confirmSalaryTransactionsForMonth({ month, currentDate }) {
  const resolvedDate = currentDate || getCurrentDateString();

  try {
    return await salaryRepository.confirmSalaryTransactionsForMonth(
      month,
      resolvedDate
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
  getSalaryConfig,
  updateSalaryConfig,
  generateSalaryProjectionsForMonth,
  confirmSalaryTransactionsForMonth,
};
