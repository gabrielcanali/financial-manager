const fs = require("fs/promises");
const { readJsonFile, writeJsonFile } = require("./json-store");
const { resolveTransactionsMonthPath } = require("./paths");
const { confirmSalaryTransactionsForMonth } = require("./salary-repository");

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(["income", "expense"]);
const VALID_STATUSES = new Set(["confirmed", "projected"]);
const VALID_SOURCES = new Set(["manual", "recurring", "installment", "salary"]);

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

function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function assertMonthString(month) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const monthValue = Number(match[2]);
  if (monthValue < 1 || monthValue > 12) {
    throw new Error("Month must be between 01 and 12");
  }
}

function assertTransactionInput(transaction) {
  if (!transaction || typeof transaction !== "object") {
    throw new Error("Transaction must be an object");
  }
  if (typeof transaction.id !== "string" || transaction.id.length === 0) {
    throw new Error("Transaction id is required");
  }
  if (typeof transaction.date !== "string" || transaction.date.length === 0) {
    throw new Error("Transaction date is required");
  }
  parseIsoDate(transaction.date);
  if (typeof transaction.amount !== "number" || transaction.amount <= 0) {
    throw new Error("Transaction amount must be > 0");
  }
  if (!VALID_DIRECTIONS.has(transaction.direction)) {
    throw new Error("Transaction direction must be income or expense");
  }
  if (
    typeof transaction.categoryId !== "string" ||
    transaction.categoryId.length === 0
  ) {
    throw new Error("Transaction categoryId is required");
  }
  if (
    typeof transaction.description !== "string" ||
    transaction.description.length === 0
  ) {
    throw new Error("Transaction description is required");
  }
  if (!VALID_STATUSES.has(transaction.status)) {
    throw new Error("Transaction status must be confirmed or projected");
  }
  if (!transaction.source || typeof transaction.source !== "object") {
    throw new Error("Transaction source is required");
  }
  if (!VALID_SOURCES.has(transaction.source.type)) {
    throw new Error(
      "Transaction source.type must be manual, recurring, installment, or salary"
    );
  }
}

function assertTransactionId(transactionId) {
  if (typeof transactionId !== "string" || transactionId.length === 0) {
    throw new Error("Transaction id is required");
  }
}

function assertTransactionsData(data, month) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid transactions file structure");
  }
  if (typeof data.month !== "string" || data.month.length === 0) {
    throw new Error("Transactions file month is required");
  }
  if (data.month !== month) {
    throw new Error("Transactions file month does not match request");
  }
}

function assertTransactionMatchesMonth(transaction, month) {
  const match = MONTH_PATTERN.exec(month);
  const dateParts = parseIsoDate(transaction.date);
  if (!match) {
    throw new Error("Month must be in YYYY-MM format");
  }
  const monthValue = Number(match[2]);
  const yearValue = Number(match[1]);
  if (dateParts.year !== yearValue || dateParts.month !== monthValue) {
    throw new Error("Transaction date month does not match target month");
  }
}

async function listTransactions(month, baseDir = process.cwd()) {
  assertMonthString(month);
  await confirmSalaryTransactionsForMonth(
    month,
    getCurrentDateString(),
    baseDir
  );
  const filePath = resolveTransactionsMonthPath(month, baseDir);

  try {
    const data = await readJsonFile(filePath);
    assertTransactionsData(data, month);
    return data.items;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function createTransaction(month, transaction, baseDir = process.cwd()) {
  assertMonthString(month);
  assertTransactionInput(transaction);
  assertTransactionMatchesMonth(transaction, month);

  const filePath = resolveTransactionsMonthPath(month, baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
    assertTransactionsData(data, month);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    data = { month, items: [] };
  }

  const exists = data.items.some((item) => item && item.id === transaction.id);
  if (exists) {
    throw new Error(`Transaction id already exists: ${transaction.id}`);
  }

  const nextItems = [...data.items, transaction];
  await writeJsonFile(filePath, { month, items: nextItems });

  return transaction;
}

async function updateTransaction(month, transaction, baseDir = process.cwd()) {
  assertMonthString(month);
  assertTransactionInput(transaction);
  assertTransactionMatchesMonth(transaction, month);

  const filePath = resolveTransactionsMonthPath(month, baseDir);
  const data = await readJsonFile(filePath);
  assertTransactionsData(data, month);

  const index = data.items.findIndex((item) => item && item.id === transaction.id);
  if (index === -1) {
    throw new Error(`Transaction not found: ${transaction.id}`);
  }

  const nextItems = data.items.slice();
  nextItems[index] = transaction;
  await writeJsonFile(filePath, { month, items: nextItems });

  return transaction;
}

async function deleteTransaction(month, transactionId, baseDir = process.cwd()) {
  assertMonthString(month);
  assertTransactionId(transactionId);

  const filePath = resolveTransactionsMonthPath(month, baseDir);
  const data = await readJsonFile(filePath);
  assertTransactionsData(data, month);

  const nextItems = data.items.filter((item) => item && item.id !== transactionId);
  if (nextItems.length === data.items.length) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (nextItems.length === 0) {
    await fs.unlink(filePath);
    return;
  }

  await writeJsonFile(filePath, { month, items: nextItems });
}

module.exports = {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
