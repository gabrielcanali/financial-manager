const categoriesService = require('../services/categories-service');
const { sendSuccess } = require('../http/response');

async function listCategories(req, res, next) {
  try {
    const items = await categoriesService.listCategories();
    return sendSuccess(res, { data: { items }, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { id, name } = req.body;
    const item = await categoriesService.createCategory({ id, name });
    return sendSuccess(res, { data: item, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const item = await categoriesService.updateCategory({ id, name });
    return sendSuccess(res, { data: item, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    await categoriesService.deleteCategory(id);
    return sendSuccess(res, { data: {}, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
