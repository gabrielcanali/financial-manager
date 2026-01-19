const { readJsonFile, writeJsonFile } = require("./json-store");
const { resolveGlobalFilePath } = require("./paths");

const CREDIT_CARD_FILE_NAME = "creditCard.json";
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function getCreditCardFilePath(baseDir) {
  return resolveGlobalFilePath(CREDIT_CARD_FILE_NAME, baseDir);
}

function assertClosingDay(closingDay) {
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new Error("closingDay must be an integer between 1 and 31");
  }
}

function assertCreditCardData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid creditCard.json structure");
  }
  assertClosingDay(data.closingDay);
}

function parseIsoDate(dateString) {
  const match = ISO_DATE_PATTERN.exec(dateString);
  if (!match) {
    throw new Error("Invalid date format, expected YYYY-MM-DD");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + 1 !== month ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error("Invalid date value");
  }

  return { year, month, day };
}

function padMonth(month) {
  return String(month).padStart(2, "0");
}

function getBillingMonthForDate(dateString, closingDay) {
  assertClosingDay(closingDay);

  const { year, month, day } = parseIsoDate(dateString);
  if (day < closingDay) {
    return `${year}-${padMonth(month)}`;
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${padMonth(nextMonth)}`;
}

async function getCreditCardConfig(baseDir = process.cwd()) {
  const filePath = getCreditCardFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertCreditCardData(data);
  return data;
}

async function setCreditCardConfig(config, baseDir = process.cwd()) {
  if (!config || typeof config !== "object") {
    throw new Error("Credit card config must be an object");
  }
  assertClosingDay(config.closingDay);

  const data = { closingDay: config.closingDay };
  const filePath = getCreditCardFilePath(baseDir);
  await writeJsonFile(filePath, data);
  return data;
}

module.exports = {
  getCreditCardConfig,
  setCreditCardConfig,
  getBillingMonthForDate,
};
