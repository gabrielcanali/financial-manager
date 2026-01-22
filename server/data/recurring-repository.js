const { readJsonFile, writeJsonFile } = require("./json-store");
const {
  resolveGlobalFilePath,
  resolveTransactionsMonthPath,
} = require("./paths");
const {
  getCreditCardConfig,
  getBillingMonthForDate,
} = require("./credit-card-repository");

const RECURRING_FILE_NAME = "recurring.json";
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(["income", "expense"]);
const VALID_FREQUENCIES = new Set(["monthly", "yearly"]);
const VALID_PAYMENT_MODES = new Set(["direct", "creditCard"]);

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

function formatMonth(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonthsToMonthString(month, offset) {
  const { year, month: monthValue } = parseMonthString(month);
  const baseIndex = year * 12 + (monthValue - 1) + offset;
  const targetYear = Math.floor(baseIndex / 12);
  const targetMonth = (baseIndex % 12) + 1;
  return formatMonth(targetYear, targetMonth);
}

function buildDateFromParts(year, month, day) {
  const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  parseIsoDate(dateString);
  return dateString;
}

function buildDateFromMonth(monthString, day) {
  const { year, month } = parseMonthString(monthString);
  return buildDateFromParts(year, month, day);
}

function getRecurringFilePath(baseDir) {
  return resolveGlobalFilePath(RECURRING_FILE_NAME, baseDir);
}

function assertRecurringInput(recurring) {
  if (!recurring || typeof recurring !== "object") {
    throw new Error("Recurring item must be an object");
  }
  if (typeof recurring.id !== "string" || recurring.id.length === 0) {
    throw new Error("Recurring id is required");
  }
  if (typeof recurring.name !== "string" || recurring.name.length === 0) {
    throw new Error("Recurring name is required");
  }
  if (!VALID_DIRECTIONS.has(recurring.direction)) {
    throw new Error("Recurring direction must be income or expense");
  }
  if (typeof recurring.amount !== "number" || recurring.amount <= 0) {
    throw new Error("Recurring amount must be > 0");
  }
  if (
    typeof recurring.categoryId !== "string" ||
    recurring.categoryId.length === 0
  ) {
    throw new Error("Recurring categoryId is required");
  }
  if (!recurring.schedule || typeof recurring.schedule !== "object") {
    throw new Error("Recurring schedule is required");
  }
  if (!VALID_FREQUENCIES.has(recurring.schedule.frequency)) {
    throw new Error("Recurring schedule frequency must be monthly or yearly");
  }
  if (
    !Number.isInteger(recurring.schedule.dayOfMonth) ||
    recurring.schedule.dayOfMonth < 1 ||
    recurring.schedule.dayOfMonth > 31
  ) {
    throw new Error("Recurring schedule dayOfMonth must be between 1 and 31");
  }
  if (recurring.schedule.frequency === "yearly") {
    if (
      !Number.isInteger(recurring.schedule.month) ||
      recurring.schedule.month < 1 ||
      recurring.schedule.month > 12
    ) {
      throw new Error("Recurring schedule month must be between 1 and 12");
    }
  }
  if (
    recurring.schedule.frequency === "monthly" &&
    "month" in recurring.schedule
  ) {
    throw new Error("Recurring schedule month is only allowed for yearly");
  }
  if (!recurring.payment || typeof recurring.payment !== "object") {
    throw new Error("Recurring payment is required");
  }
  if (!VALID_PAYMENT_MODES.has(recurring.payment.mode)) {
    throw new Error("Recurring payment mode must be direct or creditCard");
  }
  if (typeof recurring.isActive !== "boolean") {
    throw new Error("Recurring isActive must be boolean");
  }
}

function assertRecurringId(recurringId) {
  if (typeof recurringId !== "string" || recurringId.length === 0) {
    throw new Error("Recurring id is required");
  }
}

function assertRecurringData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid recurring.json structure");
  }
}

function assertTransactionsData(data, month) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid transactions file structure");
  }
  if (typeof data.month !== "string" || data.month.length === 0) {
    throw new Error("Transactions file month is required");
  }
  const parsed = parseMonthString(data.month);
  const requested = parseMonthString(month);
  if (parsed.year !== requested.year || parsed.month !== requested.month) {
    throw new Error("Transactions file month does not match request");
  }
}

function getTargetMonthForDate(dateString, mode, closingDay) {
  if (mode === "creditCard") {
    return getBillingMonthForDate(dateString, closingDay);
  }
  const { year, month } = parseIsoDate(dateString);
  return formatMonth(year, month);
}

function resolveMonthlyRecurringDate(recurring, targetMonth, closingDay) {
  const day = recurring.schedule.dayOfMonth;
  let actualMonth = targetMonth;

  if (recurring.payment.mode === "creditCard") {
    if (!Number.isInteger(closingDay)) {
      throw new Error("Closing day is required for creditCard recurring");
    }
    if (day >= closingDay) {
      actualMonth = addMonthsToMonthString(targetMonth, -1);
    }
  }

  const date = buildDateFromMonth(actualMonth, day);
  const billingMonth = getTargetMonthForDate(
    date,
    recurring.payment.mode,
    closingDay
  );
  if (billingMonth !== targetMonth) {
    throw new Error("Recurring target month mismatch for monthly schedule");
  }
  return date;
}

function resolveYearlyRecurringDate(recurring, targetMonth, closingDay) {
  const { year: targetYear, month: targetMonthNumber } =
    parseMonthString(targetMonth);
  const day = recurring.schedule.dayOfMonth;
  const scheduleMonth = recurring.schedule.month;

  let billingMonthNumber = scheduleMonth;
  if (recurring.payment.mode === "creditCard") {
    if (!Number.isInteger(closingDay)) {
      throw new Error("Closing day is required for creditCard recurring");
    }
    if (day >= closingDay) {
      billingMonthNumber = scheduleMonth === 12 ? 1 : scheduleMonth + 1;
    }
  }

  if (targetMonthNumber !== billingMonthNumber) {
    return null;
  }

  let actualYear = targetYear;
  if (
    recurring.payment.mode === "creditCard" &&
    day >= closingDay &&
    scheduleMonth === 12 &&
    targetMonthNumber === 1
  ) {
    actualYear = targetYear - 1;
  }

  const date = buildDateFromParts(actualYear, scheduleMonth, day);
  const billingMonth = getTargetMonthForDate(
    date,
    recurring.payment.mode,
    closingDay
  );
  if (billingMonth !== targetMonth) {
    throw new Error("Recurring target month mismatch for yearly schedule");
  }
  return date;
}

function buildRecurringTransaction(recurring, transactionId, date) {
  return {
    id: transactionId,
    date,
    amount: recurring.amount,
    direction: recurring.direction,
    categoryId: recurring.categoryId,
    description: recurring.name,
    status: "confirmed",
    source: { type: "recurring" },
  };
}

async function listRecurring(baseDir = process.cwd()) {
  const filePath = getRecurringFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertRecurringData(data);
  return data.items;
}

async function createRecurring(recurring, baseDir = process.cwd()) {
  assertRecurringInput(recurring);

  const filePath = getRecurringFilePath(baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    data = { items: [] };
  }

  assertRecurringData(data);

  const exists = data.items.some((item) => item && item.id === recurring.id);
  if (exists) {
    throw new Error(`Recurring id already exists: ${recurring.id}`);
  }

  const nextData = { ...data, items: [...data.items, recurring] };
  await writeJsonFile(filePath, nextData);
  return recurring;
}

async function updateRecurring(recurring, baseDir = process.cwd()) {
  assertRecurringInput(recurring);

  const filePath = getRecurringFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertRecurringData(data);

  const index = data.items.findIndex((item) => item && item.id === recurring.id);
  if (index === -1) {
    throw new Error(`Recurring not found: ${recurring.id}`);
  }

  const nextItems = data.items.slice();
  nextItems[index] = recurring;
  await writeJsonFile(filePath, { ...data, items: nextItems });
  return recurring;
}

async function deleteRecurring(recurringId, baseDir = process.cwd()) {
  assertRecurringId(recurringId);

  const filePath = getRecurringFilePath(baseDir);
  const data = await readJsonFile(filePath);
  assertRecurringData(data);

  const nextItems = data.items.filter((item) => item && item.id !== recurringId);
  if (nextItems.length === data.items.length) {
    throw new Error(`Recurring not found: ${recurringId}`);
  }

  await writeJsonFile(filePath, { ...data, items: nextItems });
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

  assertTransactionsData(data, month);
  return { filePath, data };
}

async function generateRecurringTransactionsForMonth(
  month,
  options = {},
  baseDir = process.cwd()
) {
  parseMonthString(month);

  const transactionIdFactory = options.transactionIdFactory;
  if (typeof transactionIdFactory !== "function") {
    throw new Error("transactionIdFactory is required");
  }

  const recurringPath = getRecurringFilePath(baseDir);
  const recurringData = await readJsonFile(recurringPath);
  assertRecurringData(recurringData);

  const activeItems = recurringData.items.filter(
    (item) => item && item.isActive === true
  );
  if (activeItems.length === 0) {
    return [];
  }

  let closingDay = null;
  if (activeItems.some((item) => item.payment?.mode === "creditCard")) {
    const config = await getCreditCardConfig(baseDir);
    closingDay = config.closingDay;
  }

  const { filePath, data } = await loadTransactionsMonth(month, baseDir);
  const existingIds = new Set(
    data.items.map((item) => (item ? item.id : null)).filter(Boolean)
  );
  const pendingTransactions = [];
  const pendingIds = new Set();

  for (const recurring of activeItems) {
    let date = null;
    if (recurring.schedule.frequency === "monthly") {
      date = resolveMonthlyRecurringDate(recurring, month, closingDay);
    } else {
      date = resolveYearlyRecurringDate(recurring, month, closingDay);
    }

    if (!date) {
      continue;
    }

    const transactionId = transactionIdFactory(recurring, date, month);
    if (typeof transactionId !== "string" || transactionId.length === 0) {
      throw new Error("transactionIdFactory must return a valid id");
    }
    if (existingIds.has(transactionId) || pendingIds.has(transactionId)) {
      throw new Error(`Transaction id already exists: ${transactionId}`);
    }

    pendingIds.add(transactionId);
    pendingTransactions.push(
      buildRecurringTransaction(recurring, transactionId, date)
    );
  }

  if (pendingTransactions.length === 0) {
    return [];
  }

  await writeJsonFile(filePath, {
    month,
    items: [...data.items, ...pendingTransactions],
  });

  return pendingTransactions;
}

module.exports = {
  listRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  generateRecurringTransactionsForMonth,
};
