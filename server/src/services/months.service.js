import { randomUUID } from "node:crypto";
import jsonStorage from "../lib/jsonStorage.js";

function ensureMonthStructure(db, year, month) {
  if (!db.anos) db.anos = {};
  if (!db.anos[year]) db.anos[year] = { meses: {} };

  if (!db.anos[year].meses[month]) {
    db.anos[year].meses[month] = {
      dados: {
        adiantamento: 0,
        pagamento: 0,
        total_liquido: 0,
      },
      calendario: {
        pagamentos: [],
        fechamento_fatura: null,
      },
      entradas_saidas: [],
      contas_recorrentes_pre_fatura: [],
      contas_recorrentes_pos_fatura: [],
    };
  }

  return db.anos[year].meses[month];
}

function recalcMonthTotals(monthRef) {
  const sum = (list = []) =>
    list.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const adiantamento = Number(monthRef.dados.adiantamento || 0);
  const pagamento = Number(monthRef.dados.pagamento || 0);
  const total =
    adiantamento +
    pagamento +
    sum(monthRef.entradas_saidas) +
    sum(monthRef.contas_recorrentes_pre_fatura) +
    sum(monthRef.contas_recorrentes_pos_fatura);

  monthRef.dados.total_liquido = Number(total.toFixed(2));
}

function getRecurringList(monthRef, recurringKey) {
  if (recurringKey === "contas_recorrentes_pre_fatura") {
    return monthRef.contas_recorrentes_pre_fatura;
  }
  if (recurringKey === "contas_recorrentes_pos_fatura") {
    return monthRef.contas_recorrentes_pos_fatura;
  }
  return null;
}

async function getMonth(year, month) {
  const db = await jsonStorage.read();
  return db.anos?.[year]?.meses?.[month] ?? null;
}

async function setMonthData(year, month, dados) {
  const db = await jsonStorage.read();
  const monthRef = ensureMonthStructure(db, year, month);

  if (dados.adiantamento !== undefined) {
    monthRef.dados.adiantamento = dados.adiantamento;
  }
  if (dados.pagamento !== undefined) {
    monthRef.dados.pagamento = dados.pagamento;
  }

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function setMonthCalendar(year, month, calendar) {
  const db = await jsonStorage.read();
  const monthRef = ensureMonthStructure(db, year, month);

  if (calendar.pagamentos !== undefined) {
    monthRef.calendario.pagamentos = calendar.pagamentos;
  }
  if (calendar.fechamento_fatura !== undefined) {
    monthRef.calendario.fechamento_fatura = calendar.fechamento_fatura;
  }

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function addEntry(year, month, entry) {
  const db = await jsonStorage.read();
  const monthRef = ensureMonthStructure(db, year, month);

  const newEntry = {
    ...entry,
    parcela: entry.parcela ?? null,
    id: randomUUID(),
  };

  monthRef.entradas_saidas.push(newEntry);
  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);

  return monthRef;
}

async function updateEntry(year, month, entryId, changes) {
  const db = await jsonStorage.read();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const target = monthRef.entradas_saidas.find((item) => item.id === entryId);
  if (!target) return null;

  Object.entries(changes).forEach(([key, value]) => {
    target[key] = value;
  });

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function deleteEntry(year, month, entryId) {
  const db = await jsonStorage.read();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const originalLength = monthRef.entradas_saidas.length;
  monthRef.entradas_saidas = monthRef.entradas_saidas.filter(
    (item) => item.id !== entryId
  );

  if (monthRef.entradas_saidas.length === originalLength) {
    return null;
  }

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function addRecurring(year, month, recurringKey, item) {
  const db = await jsonStorage.read();
  const monthRef = ensureMonthStructure(db, year, month);
  const list = getRecurringList(monthRef, recurringKey);
  if (!list) return null;

  const newItem = { ...item, id: randomUUID() };
  list.push(newItem);

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function updateRecurring(year, month, recurringKey, itemId, changes) {
  const db = await jsonStorage.read();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const list = getRecurringList(monthRef, recurringKey);
  if (!list) return null;

  const target = list.find((item) => item.id === itemId);
  if (!target) return null;

  Object.entries(changes).forEach(([key, value]) => {
    target[key] = value;
  });

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function deleteRecurring(year, month, recurringKey, itemId) {
  const db = await jsonStorage.read();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const list = getRecurringList(monthRef, recurringKey);
  if (!list) return null;

  const originalLength = list.length;
  const filtered = list.filter((item) => item.id !== itemId);

  if (filtered.length === originalLength) {
    return null;
  }

  if (recurringKey === "contas_recorrentes_pre_fatura") {
    monthRef.contas_recorrentes_pre_fatura = filtered;
  } else {
    monthRef.contas_recorrentes_pos_fatura = filtered;
  }

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

export default {
  getMonth,
  setMonthData,
  setMonthCalendar,
  addEntry,
  updateEntry,
  deleteEntry,
  addRecurring,
  updateRecurring,
  deleteRecurring,
};
