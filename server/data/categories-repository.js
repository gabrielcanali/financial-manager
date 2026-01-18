const { readJsonFile, writeJsonFile } = require("./json-store");
const { resolveGlobalFilePath } = require("./paths");

const CATEGORIES_FILE_NAME = "categories.json";

function getCategoriesFilePath(baseDir) {
  return resolveGlobalFilePath(CATEGORIES_FILE_NAME, baseDir);
}

function assertCategoryInput(category) {
  if (!category || typeof category !== "object") {
    throw new Error("Category must be an object");
  }
  if (typeof category.id !== "string" || category.id.length === 0) {
    throw new Error("Category id is required");
  }
  if (typeof category.name !== "string" || category.name.length === 0) {
    throw new Error("Category name is required");
  }
  if ("isSpecial" in category && typeof category.isSpecial !== "boolean") {
    throw new Error("Category isSpecial must be boolean");
  }
}

function assertCategoryId(categoryId) {
  if (typeof categoryId !== "string" || categoryId.length === 0) {
    throw new Error("Category id is required");
  }
}

function assertCategoriesData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid categories.json structure");
  }
}

function buildCategory(category, existingCategory) {
  const result = {
    id: category.id,
    name: category.name,
  };

  if ("isSpecial" in category) {
    result.isSpecial = category.isSpecial;
  } else if (existingCategory && "isSpecial" in existingCategory) {
    result.isSpecial = existingCategory.isSpecial;
  }

  return result;
}

async function listCategories(baseDir = process.cwd()) {
  const filePath = getCategoriesFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertCategoriesData(data);
  return data.items;
}

async function createCategory(category, baseDir = process.cwd()) {
  assertCategoryInput(category);

  const filePath = getCategoriesFilePath(baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    data = { items: [] };
  }

  assertCategoriesData(data);

  const exists = data.items.some((item) => item && item.id === category.id);
  if (exists) {
    throw new Error(`Category id already exists: ${category.id}`);
  }

  const nextItem = buildCategory(category);
  const nextData = { ...data, items: [...data.items, nextItem] };
  await writeJsonFile(filePath, nextData);

  return nextItem;
}

async function updateCategory(category, baseDir = process.cwd()) {
  assertCategoryInput(category);

  const filePath = getCategoriesFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertCategoriesData(data);

  const index = data.items.findIndex((item) => item && item.id === category.id);
  if (index === -1) {
    throw new Error(`Category not found: ${category.id}`);
  }

  const nextItem = buildCategory(category, data.items[index]);
  const nextItems = data.items.slice();
  nextItems[index] = nextItem;

  await writeJsonFile(filePath, { ...data, items: nextItems });
  return nextItem;
}

async function deleteCategory(categoryId, baseDir = process.cwd()) {
  assertCategoryId(categoryId);

  const filePath = getCategoriesFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertCategoriesData(data);

  const nextItems = data.items.filter((item) => item && item.id !== categoryId);
  if (nextItems.length === data.items.length) {
    throw new Error(`Category not found: ${categoryId}`);
  }

  await writeJsonFile(filePath, { ...data, items: nextItems });
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
