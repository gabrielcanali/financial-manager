const { readJsonFile, writeJsonFile } = require("./json-store");
const {
  resolveGlobalFilePath,
  resolveTransactionsMonthPath,
} = require("./paths");

const SALARY_FILE_NAME = "salary.json";
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_ADVANCE_TYPES = new Set(["percent"]);
const VALID_DIRECTIONS = new Set(["income"]);

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

function parseMonthString(month) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const year = Number(match[1]);
  const monthValue = Number(match[2]);
  if (monthValue < 1 || monthValue > 12) {
    throw new Error("Month must be between 01 and 12");
  }
  return { year, month: monthValue };
}

function buildDateFromMonth(monthString, day) {
  const { year, month } = parseMonthString(monthString);
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  parseIsoDate(dateString);
  return dateString;
}

function getSalaryFilePath(baseDir) {
  return resolveGlobalFilePath(SALARY_FILE_NAME, baseDir);
}

function assertSalaryConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Salary config must be an object");
  }
  if (typeof config.baseSalary !== "number" || config.baseSalary <= 0) {
    throw new Error("Salary baseSalary must be > 0");
  }
  if (!VALID_DIRECTIONS.has(config.direction)) {
    throw new Error("Salary direction must be income");
  }
  if (
    !Number.isInteger(config.paymentDay) ||
    config.paymentDay < 1 ||
    config.paymentDay > 31
  ) {
    throw new Error("Salary paymentDay must be between 1 and 31");
  }
  if (
    typeof config.categoryId !== "string" ||
    config.categoryId.length === 0
  ) {
    throw new Error("Salary categoryId is required");
  }
  if (
    typeof config.description !== "string" ||
    config.description.length === 0
  ) {
    throw new Error("Salary description is required");
  }
  if (!config.advance || typeof config.advance !== "object") {
    throw new Error("Salary advance is required");
  }
  if (typeof config.advance.enabled !== "boolean") {
    throw new Error("Salary advance enabled must be boolean");
  }

  if (!config.advance.enabled) {
    return;
  }

  if (!VALID_ADVANCE_TYPES.has(config.advance.type)) {
    throw new Error("Salary advance type must be percent");
  }
  if (
    !Number.isInteger(config.advance.day) ||
    config.advance.day < 1 ||
    config.advance.day > 31
  ) {
    throw new Error("Salary advance day must be between 1 and 31");
  }
  if (typeof config.advance.value !== "number" || config.advance.value <= 0) {
    throw new Error("Salary advance value must be > 0");
  }

  const advanceAmount = (config.baseSalary * config.advance.value) / 100;
  if (!(advanceAmount > 0 && advanceAmount < config.baseSalary)) {
    throw new Error("Salary advance amount must be less than baseSalary");
  }
}

function buildSalaryConfig(config) {
  return {
    baseSalary: config.baseSalary,
    direction: config.direction,
    paymentDay: config.paymentDay,
    categoryId: config.categoryId,
    description: config.description,
    advance: {
      enabled: config.advance.enabled,
      day: config.advance.day,
      type: config.advance.type,
      value: config.advance.value,
    },
  };
}

function buildSalaryTransaction(id, date, amount, config) {
  return {
    id,
    date,
    amount,
    direction: config.direction,
    categoryId: config.categoryId,
    description: config.description,
    status: "projected",
    source: { type: "salary" },
  };
}

async function getSalaryConfig(baseDir = process.cwd()) {
  const filePath = getSalaryFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertSalaryConfig(data);
  return data;
}

async function setSalaryConfig(config, baseDir = process.cwd()) {
  assertSalaryConfig(config);
  const filePath = getSalaryFilePath(baseDir);
  const data = buildSalaryConfig(config);
  await writeJsonFile(filePath, data);
  return data;
}

async function loadTransactionsMonth(month, baseDir) {
  const filePath = resolveTransactionsMonthPath(month, baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    data = { month, items: [] };
  }

  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid transactions file structure");
  }
  if (data.month !== month) {
    throw new Error("Transactions file month does not match request");
  }

  return { filePath, data };
}

async function generateSalaryProjectionsForMonth(
  month,
  options = {},
  baseDir = process.cwd()
) {
  parseMonthString(month);

  const transactionIdFactory = options.transactionIdFactory;
  if (typeof transactionIdFactory !== "function") {
    throw new Error("transactionIdFactory is required");
  }

  const salaryConfig = await getSalaryConfig(baseDir);

  const projections = [];
  let advanceAmount = 0;

  if (salaryConfig.advance.enabled) {
    advanceAmount = (salaryConfig.baseSalary * salaryConfig.advance.value) / 100;
    const advanceDate = buildDateFromMonth(month, salaryConfig.advance.day);
    const advanceId = transactionIdFactory({
      type: "advance",
      month,
      date: advanceDate,
      salary: salaryConfig,
    });
    if (typeof advanceId !== "string" || advanceId.length === 0) {
      throw new Error("transactionIdFactory must return a valid id");
    }
    projections.push(
      buildSalaryTransaction(advanceId, advanceDate, advanceAmount, salaryConfig)
    );
  }

  const paymentAmount = salaryConfig.baseSalary - advanceAmount;
  if (paymentAmount <= 0) {
    throw new Error("Salary payment amount must be > 0");
  }
  const paymentDate = buildDateFromMonth(month, salaryConfig.paymentDay);
  const paymentId = transactionIdFactory({
    type: "payment",
    month,
    date: paymentDate,
    salary: salaryConfig,
  });
  if (typeof paymentId !== "string" || paymentId.length === 0) {
    throw new Error("transactionIdFactory must return a valid id");
  }
  projections.push(
    buildSalaryTransaction(paymentId, paymentDate, paymentAmount, salaryConfig)
  );

  const { filePath, data } = await loadTransactionsMonth(month, baseDir);
  const existingIds = new Set(
    data.items.map((item) => (item ? item.id : null)).filter(Boolean)
  );
  const pendingIds = new Set();

  projections.forEach((transaction) => {
    if (existingIds.has(transaction.id) || pendingIds.has(transaction.id)) {
      throw new Error(`Transaction id already exists: ${transaction.id}`);
    }
    pendingIds.add(transaction.id);
  });

  await writeJsonFile(filePath, {
    month,
    items: [...data.items, ...projections],
  });

  return projections;
}

module.exports = {
  getSalaryConfig,
  setSalaryConfig,
  generateSalaryProjectionsForMonth,
};
