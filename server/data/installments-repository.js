const fs = require("fs/promises");
const path = require("path");
const { readJsonFile, writeJsonFile } = require("./json-store");
const {
  resolveGlobalFilePath,
  resolveTransactionsDir,
  resolveTransactionsMonthPath,
} = require("./paths");
const {
  getCreditCardConfig,
  getBillingMonthForDate,
} = require("./credit-card-repository");

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const VALID_DIRECTIONS = new Set(["income", "expense"]);
const VALID_MODES = new Set(["direct", "creditCard"]);
const VALID_STATUSES = new Set(["confirmed", "projected"]);
const INSTALLMENTS_FILE_NAME = "installments.json";

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

function formatMonth(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonthsToDate(dateString, offset) {
  const { year, month, day } = parseIsoDate(dateString);
  const baseIndex = (year * 12 + (month - 1)) + offset;
  const targetYear = Math.floor(baseIndex / 12);
  const targetMonth = (baseIndex % 12) + 1;
  const targetDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  parseIsoDate(targetDate);
  return targetDate;
}

function assertInstallmentInput(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Installment payload must be an object");
  }
  if (typeof payload.parentId !== "string" || payload.parentId.length === 0) {
    throw new Error("Installment parentId is required");
  }
  if (typeof payload.groupId !== "string" || payload.groupId.length === 0) {
    throw new Error("Installment groupId is required");
  }
  if (!Number.isInteger(payload.total) || payload.total < 1) {
    throw new Error("Installment total must be an integer >= 1");
  }
  if (!VALID_MODES.has(payload.mode)) {
    throw new Error("Installment mode must be direct or creditCard");
  }
  if (typeof payload.firstDate !== "string" || payload.firstDate.length === 0) {
    throw new Error("Installment firstDate is required");
  }
  parseIsoDate(payload.firstDate);
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    throw new Error("Installment amount must be > 0");
  }
  if (!VALID_DIRECTIONS.has(payload.direction)) {
    throw new Error("Installment direction must be income or expense");
  }
  if (typeof payload.categoryId !== "string" || payload.categoryId.length === 0) {
    throw new Error("Installment categoryId is required");
  }
  if (typeof payload.description !== "string" || payload.description.length === 0) {
    throw new Error("Installment description is required");
  }
  if (!Array.isArray(payload.ids) || payload.ids.length !== payload.total) {
    throw new Error("Installment ids must be an array with length equal to total");
  }
  payload.ids.forEach((id, index) => {
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`Installment id at index ${index} is invalid`);
    }
  });
}

function assertInstallmentParent(parent) {
  if (!parent || typeof parent !== "object") {
    throw new Error("Installment parent must be an object");
  }
  if (typeof parent.id !== "string" || parent.id.length === 0) {
    throw new Error("Installment parent id is required");
  }
  if (typeof parent.date !== "string" || parent.date.length === 0) {
    throw new Error("Installment parent date is required");
  }
  parseIsoDate(parent.date);
  if (typeof parent.amount !== "number" || parent.amount <= 0) {
    throw new Error("Installment parent amount must be > 0");
  }
  if (!VALID_DIRECTIONS.has(parent.direction)) {
    throw new Error("Installment parent direction must be income or expense");
  }
  if (
    typeof parent.categoryId !== "string" ||
    parent.categoryId.length === 0
  ) {
    throw new Error("Installment parent categoryId is required");
  }
  if (
    typeof parent.description !== "string" ||
    parent.description.length === 0
  ) {
    throw new Error("Installment parent description is required");
  }
  if (!parent.source || parent.source.type !== "installment") {
    throw new Error("Installment parent source.type must be installment");
  }
  if (!parent.installment || typeof parent.installment !== "object") {
    throw new Error("Installment parent installment is required");
  }
  if (
    typeof parent.installment.groupId !== "string" ||
    parent.installment.groupId.length === 0
  ) {
    throw new Error("Installment parent groupId is required");
  }
  if (!VALID_MODES.has(parent.installment.mode)) {
    throw new Error("Installment parent mode must be direct or creditCard");
  }
  if (
    !Number.isInteger(parent.installment.total) ||
    parent.installment.total < 1
  ) {
    throw new Error("Installment parent total must be an integer >= 1");
  }
  if (parent.installment.index !== null) {
    throw new Error("Installment parent index must be null");
  }
}

function buildInstallmentTransaction(base, index, date) {
  return {
    id: base.ids[index - 1],
    date,
    amount: base.amount,
    direction: base.direction,
    categoryId: base.categoryId,
    description: base.description,
    status: index === 1 ? "confirmed" : "projected",
    source: { type: "installment" },
    installment: {
      groupId: base.groupId,
      mode: base.mode,
      total: base.total,
      index,
    },
  };
}

function buildInstallmentParent(base) {
  return {
    id: base.parentId,
    date: base.firstDate,
    amount: base.amount,
    direction: base.direction,
    categoryId: base.categoryId,
    description: base.description,
    source: { type: "installment" },
    installment: {
      groupId: base.groupId,
      mode: base.mode,
      total: base.total,
      index: null,
    },
  };
}

function getInstallmentsFilePath(baseDir) {
  return resolveGlobalFilePath(INSTALLMENTS_FILE_NAME, baseDir);
}

function assertInstallmentsData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid installments.json structure");
  }
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

function assertTransactionsData(data, month) {
  if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
    throw new Error("Invalid transactions file structure");
  }
  if (typeof data.month !== "string" || data.month.length === 0) {
    throw new Error("Transactions file month is required");
  }
  const match = MONTH_PATTERN.exec(data.month);
  if (!match) {
    throw new Error("Transactions file month must be in YYYY-MM format");
  }
  if (data.month !== month) {
    throw new Error("Transactions file month does not match request");
  }
}

function assertInstallmentParcel(parcel) {
  if (!parcel || typeof parcel !== "object") {
    throw new Error("Installment parcel must be an object");
  }
  if (typeof parcel.id !== "string" || parcel.id.length === 0) {
    throw new Error("Installment parcel id is required");
  }
  if (typeof parcel.date !== "string" || parcel.date.length === 0) {
    throw new Error("Installment parcel date is required");
  }
  parseIsoDate(parcel.date);
  if (typeof parcel.amount !== "number" || parcel.amount <= 0) {
    throw new Error("Installment parcel amount must be > 0");
  }
  if (!VALID_DIRECTIONS.has(parcel.direction)) {
    throw new Error("Installment parcel direction must be income or expense");
  }
  if (typeof parcel.categoryId !== "string" || parcel.categoryId.length === 0) {
    throw new Error("Installment parcel categoryId is required");
  }
  if (typeof parcel.description !== "string" || parcel.description.length === 0) {
    throw new Error("Installment parcel description is required");
  }
  if (!VALID_STATUSES.has(parcel.status)) {
    throw new Error("Installment parcel status must be confirmed or projected");
  }
  if (!parcel.source || parcel.source.type !== "installment") {
    throw new Error("Installment parcel source.type must be installment");
  }
  if (!parcel.installment || typeof parcel.installment !== "object") {
    throw new Error("Installment parcel installment is required");
  }
  if (
    typeof parcel.installment.groupId !== "string" ||
    parcel.installment.groupId.length === 0
  ) {
    throw new Error("Installment parcel groupId is required");
  }
  if (!VALID_MODES.has(parcel.installment.mode)) {
    throw new Error("Installment parcel mode must be direct or creditCard");
  }
  if (
    !Number.isInteger(parcel.installment.total) ||
    parcel.installment.total < 1
  ) {
    throw new Error("Installment parcel total must be an integer >= 1");
  }
  if (!Number.isInteger(parcel.installment.index) || parcel.installment.index < 1) {
    throw new Error("Installment parcel index must be an integer >= 1");
  }
}

async function getTargetMonth(dateString, mode, closingDay) {
  if (mode === "creditCard") {
    return getBillingMonthForDate(dateString, closingDay);
  }
  const { year, month } = parseIsoDate(dateString);
  return formatMonth(year, month);
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

async function loadInstallmentsData(baseDir, allowMissing) {
  const filePath = getInstallmentsFilePath(baseDir);
  let data;

  try {
    data = await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== "ENOENT" || !allowMissing) {
      throw error;
    }
    data = { items: [] };
  }

  assertInstallmentsData(data);
  return { filePath, data };
}

async function listTransactionFiles(baseDir) {
  const transactionsDir = resolveTransactionsDir(baseDir);
  let entries;

  try {
    entries = await fs.readdir(transactionsDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(transactionsDir, entry.name));
}

async function createInstallmentPlan(payload, baseDir = process.cwd()) {
  assertInstallmentInput(payload);

  let closingDay = null;
  if (payload.mode === "creditCard") {
    const config = await getCreditCardConfig(baseDir);
    closingDay = config.closingDay;
  }

  const transactions = [];
  for (let index = 1; index <= payload.total; index += 1) {
    const date = addMonthsToDate(payload.firstDate, index - 1);
    transactions.push(buildInstallmentTransaction(payload, index, date));
  }

  const grouped = new Map();
  for (const transaction of transactions) {
    const targetMonth = await getTargetMonth(
      transaction.date,
      payload.mode,
      closingDay
    );
    if (!grouped.has(targetMonth)) {
      grouped.set(targetMonth, []);
    }
    grouped.get(targetMonth).push(transaction);
  }

  const { filePath: installmentsPath, data: installmentsData } =
    await loadInstallmentsData(baseDir, true);

  const duplicateParent = installmentsData.items.find(
    (item) =>
      item &&
      item.installment &&
      item.installment.groupId === payload.groupId
  );
  if (duplicateParent) {
    throw new Error(`Installment groupId already exists: ${payload.groupId}`);
  }
  const duplicateParentId = installmentsData.items.find(
    (item) => item && item.id === payload.parentId
  );
  if (duplicateParentId) {
    throw new Error(`Installment parentId already exists: ${payload.parentId}`);
  }

  const parent = buildInstallmentParent(payload);
  await writeJsonFile(installmentsPath, {
    items: [...installmentsData.items, parent],
  });

  for (const [month, items] of grouped.entries()) {
    const { filePath, data } = await loadTransactionsMonth(month, baseDir);
    const existingIds = new Set(
      data.items.map((item) => (item ? item.id : null)).filter(Boolean)
    );
    items.forEach((item) => {
      if (existingIds.has(item.id)) {
        throw new Error(`Transaction id already exists: ${item.id}`);
      }
    });

    await writeJsonFile(filePath, {
      month,
      items: [...data.items, ...items],
    });
  }

  return transactions;
}

async function updateInstallmentParent(parent, options = {}, baseDir = process.cwd()) {
  assertInstallmentParent(parent);

  const { filePath, data } = await loadInstallmentsData(baseDir, false);
  const index = data.items.findIndex(
    (item) =>
      item &&
      item.installment &&
      item.installment.groupId === parent.installment.groupId
  );

  if (index === -1) {
    throw new Error(`Installment parent not found: ${parent.installment.groupId}`);
  }

  const existing = data.items[index];
  if (existing.id !== parent.id) {
    throw new Error("Installment parent id cannot be changed");
  }
  if (existing.installment.mode !== parent.installment.mode) {
    throw new Error("Installment mode cannot be changed");
  }
  if (existing.installment.total !== parent.installment.total) {
    throw new Error("Installment total cannot be changed");
  }
  if (existing.date !== parent.date) {
    throw new Error("Installment parent date cannot be changed");
  }

  const conflictStrategy = options.conflictStrategy;
  if (
    conflictStrategy &&
    conflictStrategy !== "skipEdited" &&
    conflictStrategy !== "overwriteEdited" &&
    conflictStrategy !== "cancel"
  ) {
    throw new Error("Invalid conflictStrategy");
  }

  const transactionFiles = await listTransactionFiles(baseDir);
  let hasEditedParcels = false;

  for (const filePathItem of transactionFiles) {
    const month = path.basename(filePathItem, ".json");
    assertMonthString(month);
    const dataItem = await readJsonFile(filePathItem);
    assertTransactionsData(dataItem, month);

    dataItem.items.forEach((item) => {
      if (
        item &&
        item.source &&
        item.source.type === "installment" &&
        item.installment &&
        item.installment.groupId === parent.installment.groupId &&
        item.status === "projected" &&
        item.editedManually === true
      ) {
        hasEditedParcels = true;
      }
    });
  }

  if (hasEditedParcels && !conflictStrategy) {
    throw new Error("Edited parcels require conflictStrategy");
  }
  if (hasEditedParcels && conflictStrategy === "cancel") {
    throw new Error("Installment parent update cancelled");
  }

  let updatedParcels = 0;
  let skippedEdited = 0;

  for (const filePathItem of transactionFiles) {
    const month = path.basename(filePathItem, ".json");
    assertMonthString(month);
    const dataItem = await readJsonFile(filePathItem);
    assertTransactionsData(dataItem, month);

    let changed = false;
    const nextItems = dataItem.items.map((item) => {
      if (
        !item ||
        !item.installment ||
        item.installment.groupId !== parent.installment.groupId ||
        item.source?.type !== "installment" ||
        item.status !== "projected"
      ) {
        return item;
      }

      if (item.editedManually === true && conflictStrategy === "skipEdited") {
        skippedEdited += 1;
        return item;
      }

      const nextItem = {
        ...item,
        amount: parent.amount,
        direction: parent.direction,
        categoryId: parent.categoryId,
        description: parent.description,
        installment: {
          ...item.installment,
          mode: parent.installment.mode,
          total: parent.installment.total,
        },
      };

      if (
        nextItem.amount !== item.amount ||
        nextItem.direction !== item.direction ||
        nextItem.categoryId !== item.categoryId ||
        nextItem.description !== item.description
      ) {
        changed = true;
        updatedParcels += 1;
      }

      return nextItem;
    });

    if (changed) {
      await writeJsonFile(filePathItem, { month, items: nextItems });
    }
  }

  const nextItems = data.items.slice();
  nextItems[index] = parent;
  await writeJsonFile(filePath, { items: nextItems });

  return { parent, updatedParcels, skippedEdited };
}

async function updateInstallmentParcel(month, parcel, baseDir = process.cwd()) {
  assertMonthString(month);
  assertInstallmentParcel(parcel);

  const filePath = resolveTransactionsMonthPath(month, baseDir);
  const data = await readJsonFile(filePath);
  assertTransactionsData(data, month);

  const index = data.items.findIndex((item) => item && item.id === parcel.id);
  if (index === -1) {
    throw new Error(`Installment parcel not found: ${parcel.id}`);
  }

  const existing = data.items[index];
  if (existing.source?.type !== "installment") {
    throw new Error("Target transaction is not an installment parcel");
  }
  if (existing.installment?.groupId !== parcel.installment.groupId) {
    throw new Error("Installment parcel groupId cannot be changed");
  }
  if (existing.installment?.index !== parcel.installment.index) {
    throw new Error("Installment parcel index cannot be changed");
  }
  if (existing.installment?.mode !== parcel.installment.mode) {
    throw new Error("Installment parcel mode cannot be changed");
  }
  if (existing.installment?.total !== parcel.installment.total) {
    throw new Error("Installment parcel total cannot be changed");
  }

  let closingDay = null;
  if (parcel.installment.mode === "creditCard") {
    const config = await getCreditCardConfig(baseDir);
    closingDay = config.closingDay;
  }

  const parcelMonth = await getTargetMonth(
    parcel.date,
    parcel.installment.mode,
    closingDay
  );
  if (parcelMonth !== month) {
    throw new Error("Installment parcel date must match target month");
  }

  const nextItems = data.items.slice();
  nextItems[index] = { ...parcel, editedManually: true };
  await writeJsonFile(filePath, { month, items: nextItems });

  return nextItems[index];
}

async function deleteInstallmentGroup(
  groupId,
  options = {},
  baseDir = process.cwd()
) {
  if (typeof groupId !== "string" || groupId.length === 0) {
    throw new Error("Installment groupId is required");
  }

  const { filePath, data } = await loadInstallmentsData(baseDir, false);
  const index = data.items.findIndex(
    (item) => item && item.installment?.groupId === groupId
  );
  if (index === -1) {
    throw new Error(`Installment parent not found: ${groupId}`);
  }

  const nextItems = data.items.filter(
    (item) => item && item.installment?.groupId !== groupId
  );
  await writeJsonFile(filePath, { items: nextItems });

  if (!options.deleteParcels) {
    return;
  }

  const transactionFiles = await listTransactionFiles(baseDir);
  for (const filePathItem of transactionFiles) {
    const month = path.basename(filePathItem, ".json");
    assertMonthString(month);
    const dataItem = await readJsonFile(filePathItem);
    assertTransactionsData(dataItem, month);

    const nextItemsForMonth = dataItem.items.filter(
      (item) =>
        !(
          item &&
          item.source?.type === "installment" &&
          item.installment?.groupId === groupId
        )
    );

    if (nextItemsForMonth.length === dataItem.items.length) {
      continue;
    }

    if (nextItemsForMonth.length === 0) {
      await fs.unlink(filePathItem);
      continue;
    }

    await writeJsonFile(filePathItem, { month, items: nextItemsForMonth });
  }
}

module.exports = {
  createInstallmentPlan,
  updateInstallmentParent,
  updateInstallmentParcel,
  deleteInstallmentGroup,
};
