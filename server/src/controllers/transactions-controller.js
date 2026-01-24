const transactionsService = require('../services/transactions-service');
const { sendSuccess } = require('../http/response');

async function listTransactions(req, res, next) {
  try {
    const { month } = req.params;
    const items = await transactionsService.listTransactions({ month });
    return sendSuccess(res, { data: { items }, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function createTransaction(req, res, next) {
  try {
    const { month } = req.params;
    const transaction = req.body;
    const created = await transactionsService.createTransaction({ month, transaction });
    return sendSuccess(res, { data: created, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const { month, id } = req.params;
    const transaction = { ...req.body, id };
    const updated = await transactionsService.updateTransaction({ month, transaction });
    return sendSuccess(res, { data: updated, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { month, id } = req.params;
    await transactionsService.deleteTransaction({ month, transactionId: id });
    return sendSuccess(res, { data: {}, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
