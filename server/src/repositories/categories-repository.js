const path = require('path');
const dataRepository = require('../../data/categories-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function listCategories() {
  return dataRepository.listCategories(baseDir);
}

async function createCategory(category) {
  return dataRepository.createCategory(category, baseDir);
}

async function updateCategory(category) {
  return dataRepository.updateCategory(category, baseDir);
}

async function deleteCategory(categoryId) {
  return dataRepository.deleteCategory(categoryId, baseDir);
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
