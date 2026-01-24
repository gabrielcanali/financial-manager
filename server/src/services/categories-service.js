const { AppError } = require('../http/app-error');
const categoriesRepository = require('../repositories/categories-repository');

const SPECIAL_CATEGORY_ID = 'cat_saved';
const SPECIAL_CATEGORY_NAME = 'Dinheiro Guardado';

function isSpecialCategory(category) {
  return Boolean(category && (category.id === SPECIAL_CATEGORY_ID || category.isSpecial === true));
}

async function ensureSpecialCategory(categories) {
  const exists = categories.some((category) => category && category.id === SPECIAL_CATEGORY_ID);
  if (exists) {
    return categories;
  }

  const created = await categoriesRepository.createCategory({
    id: SPECIAL_CATEGORY_ID,
    name: SPECIAL_CATEGORY_NAME,
    isSpecial: true,
  });

  return [...categories, created];
}

async function listCategories() {
  const categories = await categoriesRepository.listCategories();
  return ensureSpecialCategory(categories);
}

async function createCategory({ id, name }) {
  if (id === SPECIAL_CATEGORY_ID || name === SPECIAL_CATEGORY_NAME) {
    throw new AppError({
      code: 'CATEGORY_SPECIAL_PROTECTED',
      message: 'Special category is managed by the system',
      status: 400,
      details: null,
    });
  }

  const categories = await categoriesRepository.listCategories();
  await ensureSpecialCategory(categories);

  const exists = categories.some((category) => category && category.id === id);
  if (exists) {
    throw new AppError({
      code: 'CATEGORY_ALREADY_EXISTS',
      message: 'Category id already exists',
      status: 409,
      details: { id },
    });
  }

  return categoriesRepository.createCategory({ id, name });
}

async function updateCategory({ id, name }) {
  if (id === SPECIAL_CATEGORY_ID) {
    throw new AppError({
      code: 'CATEGORY_SPECIAL_PROTECTED',
      message: 'Special category cannot be updated',
      status: 403,
      details: { id },
    });
  }

  if (name === SPECIAL_CATEGORY_NAME) {
    throw new AppError({
      code: 'CATEGORY_SPECIAL_PROTECTED',
      message: 'Special category name is reserved',
      status: 400,
      details: null,
    });
  }

  const categories = await categoriesRepository.listCategories();
  await ensureSpecialCategory(categories);

  const exists = categories.some((category) => category && category.id === id);
  if (!exists) {
    throw new AppError({
      code: 'CATEGORY_NOT_FOUND',
      message: 'Category not found',
      status: 404,
      details: { id },
    });
  }

  return categoriesRepository.updateCategory({ id, name });
}

async function deleteCategory(id) {
  if (id === SPECIAL_CATEGORY_ID) {
    throw new AppError({
      code: 'CATEGORY_SPECIAL_PROTECTED',
      message: 'Special category cannot be deleted',
      status: 403,
      details: { id },
    });
  }

  const categories = await categoriesRepository.listCategories();
  await ensureSpecialCategory(categories);

  const exists = categories.some((category) => category && category.id === id);
  if (!exists) {
    throw new AppError({
      code: 'CATEGORY_NOT_FOUND',
      message: 'Category not found',
      status: 404,
      details: { id },
    });
  }

  await categoriesRepository.deleteCategory(id);
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  SPECIAL_CATEGORY_ID,
  SPECIAL_CATEGORY_NAME,
};
