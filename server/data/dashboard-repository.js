const { readJsonFile } = require("./json-store");
const {
  resolveTransactionsMonthPath,
  resolveGlobalFilePath,
} = require("./paths");
const {
  getCreditCardConfig,
  getBillingMonthForDate,
} = require("./credit-card-repository");

const RECURRING_FILE_NAME = "recurring.json";
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const YEAR_PATTERN = /^(\d{4})$/;
const VALID_DIRECTIONS = new Set(["income", "expense"]);
const VALID_STATUSES = new Set(["confirmed", "projected"]);
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

function assertYearString(year) {
  if (typeof year !== "string" || !YEAR_PATTERN.test(year)) {
    throw new Error("Year must be in YYYY format");
  }
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

function assertRecurringData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid recurring.json structure");
  }
}

function assertRecurringItem(recurring) {
  if (!recurring || typeof recurring !== "object") {
    throw new Error("Recurring item must be an object");
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

function buildRecurringProjection(recurring, date) {
  return {
    date,
    amount: recurring.amount,
    direction: recurring.direction,
    categoryId: recurring.categoryId,
    description: recurring.name,
    status: "projected",
    source: { type: "recurring" },
  };
}

function buildEmptySummary(month) {
  return {
    month,
    totals: {
      confirmed: { income: 0, expense: 0 },
      projected: { income: 0, expense: 0 },
    },
    balances: {
      confirmed: 0,
      projected: 0,
    },
  };
}

function addTransactionTotals(summary, transaction) {
  if (!VALID_STATUSES.has(transaction.status)) {
    throw new Error("Transaction status must be confirmed or projected");
  }
  if (!VALID_DIRECTIONS.has(transaction.direction)) {
    throw new Error("Transaction direction must be income or expense");
  }
  if (typeof transaction.amount !== "number" || transaction.amount <= 0) {
    throw new Error("Transaction amount must be > 0");
  }
  summary.totals[transaction.status][transaction.direction] += transaction.amount;
}

function buildRecurringMatchKey(transaction) {
  return [
    transaction.date,
    String(transaction.amount),
    transaction.categoryId,
    transaction.description,
  ].join("|");
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
  return data.items;
}

async function loadRecurringData(baseDir, allowMissing) {
  const filePath = getRecurringFilePath(baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT" || !allowMissing) {
      throw error;
    }
    return [];
  }

  assertRecurringData(data);
  return data.items;
}

async function getRecurringProjectionsForMonth(month, baseDir) {
  const recurringItems = await loadRecurringData(baseDir, true);
  const activeItems = recurringItems.filter(
    (item) => item && item.isActive === true
  );
  if (activeItems.length === 0) {
    return [];
  }

  activeItems.forEach((item) => assertRecurringItem(item));

  let closingDay = null;
  if (activeItems.some((item) => item.payment?.mode === "creditCard")) {
    const config = await getCreditCardConfig(baseDir);
    closingDay = config.closingDay;
  }

  const projections = [];

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

    projections.push(buildRecurringProjection(recurring, date));
  }

  return projections;
}

function finalizeSummary(summary) {
  summary.balances.confirmed =
    summary.totals.confirmed.income - summary.totals.confirmed.expense;
  summary.balances.projected =
    summary.totals.confirmed.income +
    summary.totals.projected.income -
    (summary.totals.confirmed.expense + summary.totals.projected.expense);
  return summary;
}

async function getMonthlySummary(month, baseDir = process.cwd()) {
  parseMonthString(month);

  const summary = buildEmptySummary(month);
  const transactions = await loadTransactionsMonth(month, baseDir);

  const confirmedRecurringKeys = new Set();
  transactions.forEach((transaction) => {
    addTransactionTotals(summary, transaction);
    if (
      transaction.status === "confirmed" &&
      transaction.source?.type === "recurring"
    ) {
      confirmedRecurringKeys.add(buildRecurringMatchKey(transaction));
    }
  });

  const recurringProjections = await getRecurringProjectionsForMonth(
    month,
    baseDir
  );
  recurringProjections.forEach((projection) => {
    const key = buildRecurringMatchKey(projection);
    if (confirmedRecurringKeys.has(key)) {
      return;
    }
    addTransactionTotals(summary, projection);
  });

  return finalizeSummary(summary);
}

async function getAnnualSummary(year, baseDir = process.cwd()) {
  assertYearString(year);

  const totals = {
    confirmed: { income: 0, expense: 0 },
    projected: { income: 0, expense: 0 },
  };

  for (let month = 1; month <= 12; month += 1) {
    const monthString = formatMonth(Number(year), month);
    const summary = await getMonthlySummary(monthString, baseDir);
    totals.confirmed.income += summary.totals.confirmed.income;
    totals.confirmed.expense += summary.totals.confirmed.expense;
    totals.projected.income += summary.totals.projected.income;
    totals.projected.expense += summary.totals.projected.expense;
  }

  const summary = {
    year,
    totals,
    balances: { confirmed: 0, projected: 0 },
  };

  summary.balances.confirmed =
    summary.totals.confirmed.income - summary.totals.confirmed.expense;
  summary.balances.projected =
    summary.totals.confirmed.income +
    summary.totals.projected.income -
    (summary.totals.confirmed.expense + summary.totals.projected.expense);

  return summary;
}

module.exports = {
  getMonthlySummary,
  getAnnualSummary,
};
