const recurringService = require('../services/recurring-service');
const { sendSuccess } = require('../http/response');

async function listRecurring(req, res, next) {
  try {
    const items = await recurringService.listRecurring();
    return sendSuccess(res, { data: { items }, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function createRecurring(req, res, next) {
  try {
    const recurring = req.body;
    const created = await recurringService.createRecurring(recurring);
    return sendSuccess(res, { data: created, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateRecurring(req, res, next) {
  try {
    const { id } = req.params;
    const recurring = { ...req.body, id };
    const updated = await recurringService.updateRecurring(recurring);
    return sendSuccess(res, { data: updated, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function deleteRecurring(req, res, next) {
  try {
    const { id } = req.params;
    await recurringService.deleteRecurring(id);
    return sendSuccess(res, { data: {}, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function generateRecurringTransactions(req, res, next) {
  try {
    const { month } = req.params;
    const items = await recurringService.generateRecurringTransactionsForMonth({ month });
    return sendSuccess(res, { data: { items }, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  generateRecurringTransactions,
};
