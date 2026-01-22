const { readJsonFile, writeJsonFile } = require("./json-store");
const { resolveGlobalFilePath } = require("./paths");

const META_FILE_NAME = "meta.json";
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

function parseMonthString(month) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const monthValue = Number(match[2]);
  if (monthValue < 1 || monthValue > 12) {
    throw new Error("Month must be between 01 and 12");
  }
}

function getMetaFilePath(baseDir) {
  return resolveGlobalFilePath(META_FILE_NAME, baseDir);
}

function assertMetaData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid meta.json structure");
  }
  if (
    typeof data.lastOpenedMonth !== "string" ||
    data.lastOpenedMonth.length === 0
  ) {
    throw new Error("Meta lastOpenedMonth is required");
  }
  parseMonthString(data.lastOpenedMonth);
}

async function loadMetaData(baseDir, allowMissing) {
  const filePath = getMetaFilePath(baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT" || !allowMissing) {
      throw error;
    }
    return { filePath, data: null };
  }

  assertMetaData(data);
  return { filePath, data };
}

async function getMeta(baseDir = process.cwd()) {
  const { data } = await loadMetaData(baseDir, false);
  return data;
}

async function getLastOpenedMonth(baseDir = process.cwd()) {
  const data = await getMeta(baseDir);
  return data.lastOpenedMonth;
}

async function setLastOpenedMonth(month, baseDir = process.cwd()) {
  parseMonthString(month);

  const { filePath, data } = await loadMetaData(baseDir, true);
  const nextData = data ? { ...data, lastOpenedMonth: month } : { lastOpenedMonth: month };
  await writeJsonFile(filePath, nextData);

  return nextData;
}

module.exports = {
  getMeta,
  getLastOpenedMonth,
  setLastOpenedMonth,
};
