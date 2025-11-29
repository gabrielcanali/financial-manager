import { randomUUID } from "node:crypto";
import jsonStorage from "../lib/jsonStorage.js";

const MAX_INSTALLMENTS = 36;
const DEFAULT_RECURRING_MONTHS = 12;

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
      poupanca: {
        movimentos: [],
      },
      emprestimos: {
        feitos: [],
        recebidos: [],
      },
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

function parseParcela(parcela) {
  if (!parcela || typeof parcela !== "string") return null;
  const [currentStr, totalStr] = parcela.split("/");
  const current = Number(currentStr);
  const total = Number(totalStr);
  if (
    !Number.isInteger(current) ||
    !Number.isInteger(total) ||
    current < 1 ||
    total < 1
  ) {
    return null;
  }
  return { current, total };
}

function addMonthsToYearMonth(year, month, offset) {
  let y = Number(year);
  let m = Number(month);
  m += offset;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return {
    year: String(y).padStart(4, "0"),
    month: String(m).padStart(2, "0"),
  };
}

function shiftDateByMonths(dateStr, offset) {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const { year, month } = addMonthsToYearMonth(yearStr, monthStr, offset);
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const day = Math.min(Number(dayStr), lastDay);
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function adjustDateDay(currentDate, referenceDate) {
  const [refDay] = referenceDate.split("-");
  const [year, month] = currentDate.split("-");
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const safeDay = Math.min(Number(refDay), lastDay);
  return `${year}-${month}-${String(safeDay).padStart(2, "0")}`;
}

function migrateMovement(item, { allowParcela }) {
  let changed = false;
  const migrated = { ...item };

  if (!migrated.id) {
    migrated.id = randomUUID();
    changed = true;
  }

  if (allowParcela) {
    if (migrated.parcela === undefined) {
      migrated.parcela = null;
      changed = true;
    }
    if (migrated.parcela !== null) {
      const parsed = parseParcela(migrated.parcela);
      if (!parsed) {
        migrated.parcela = null;
        changed = true;
      } else if (!migrated.serie_id) {
        migrated.serie_id = randomUUID();
        changed = true;
      }
    }
  } else if (migrated.parcela !== undefined && migrated.parcela !== null) {
    migrated.parcela = null;
    changed = true;
  }

  if (migrated.recorrencia === undefined) {
    migrated.recorrencia = null;
  }

  if (migrated.categoria === undefined) {
    migrated.categoria = null;
    changed = true;
  }

  if (!Array.isArray(migrated.tags)) {
    const list =
      typeof migrated.tags === "string"
        ? migrated.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
    migrated.tags = list;
    changed = true;
  }

  return { migrated, changed };
}

function migrateMonth(monthRef) {
  let changed = false;

  if (!monthRef.dados) {
    monthRef.dados = { adiantamento: 0, pagamento: 0, total_liquido: 0 };
    changed = true;
  }
  if (!monthRef.calendario) {
    monthRef.calendario = { pagamentos: [], fechamento_fatura: null };
    changed = true;
  }
  if (!Array.isArray(monthRef.entradas_saidas)) {
    monthRef.entradas_saidas = [];
    changed = true;
  }
  if (!Array.isArray(monthRef.contas_recorrentes_pre_fatura)) {
    monthRef.contas_recorrentes_pre_fatura = [];
    changed = true;
  }
  if (!Array.isArray(monthRef.contas_recorrentes_pos_fatura)) {
    monthRef.contas_recorrentes_pos_fatura = [];
    changed = true;
  }
  if (!monthRef.poupanca || typeof monthRef.poupanca !== "object") {
    monthRef.poupanca = { movimentos: [] };
    changed = true;
  }
  if (!Array.isArray(monthRef.poupanca.movimentos)) {
    monthRef.poupanca.movimentos = [];
    changed = true;
  }
  if (!monthRef.emprestimos || typeof monthRef.emprestimos !== "object") {
    monthRef.emprestimos = { feitos: [], recebidos: [] };
    changed = true;
  }
  if (!Array.isArray(monthRef.emprestimos.feitos)) {
    monthRef.emprestimos.feitos = [];
    changed = true;
  }
  if (!Array.isArray(monthRef.emprestimos.recebidos)) {
    monthRef.emprestimos.recebidos = [];
    changed = true;
  }

  const addIdsToList = (list) =>
    list.map((item) => {
      if (item.id) return item;
      changed = true;
      return { ...item, id: randomUUID() };
    });

  const migrateList = (list, allowParcela) =>
    list.map((item) => {
      const { migrated, changed: itemChanged } = migrateMovement(item, {
        allowParcela,
      });
      changed = changed || itemChanged;
      return migrated;
    });

  monthRef.entradas_saidas = migrateList(
    monthRef.entradas_saidas,
    true
  );
  monthRef.contas_recorrentes_pre_fatura = migrateList(
    monthRef.contas_recorrentes_pre_fatura,
    false
  );
  monthRef.contas_recorrentes_pos_fatura = migrateList(
    monthRef.contas_recorrentes_pos_fatura,
    false
  );
  monthRef.poupanca.movimentos = addIdsToList(monthRef.poupanca.movimentos);
  monthRef.emprestimos.feitos = addIdsToList(monthRef.emprestimos.feitos);
  monthRef.emprestimos.recebidos = addIdsToList(monthRef.emprestimos.recebidos);

  const previousTotal = monthRef.dados.total_liquido;
  recalcMonthTotals(monthRef);
  if (monthRef.dados.total_liquido !== previousTotal) {
    changed = true;
  }
  return changed;
}

function normalizeListWithIds(list = []) {
  return list.map((item) => ({
    ...item,
    id: item.id ?? randomUUID(),
    valor: Number(item.valor),
  }));
}

async function readDbWithMigration() {
  const db = await jsonStorage.read();
  let changed = false;

  if (db.anos) {
    Object.values(db.anos).forEach((yearData) => {
      if (!yearData.meses) return;
      Object.values(yearData.meses).forEach((monthRef) => {
        const monthChanged = migrateMonth(monthRef);
        changed = changed || monthChanged;
      });
    });
  }

  if (changed) {
    await jsonStorage.write(db);
  }

  return db;
}

function createFutureInstallments(db, year, month, entry) {
  const parsed = parseParcela(entry.parcela);
  if (!parsed) return;

  const total = Math.min(parsed.total, MAX_INSTALLMENTS);
  for (let next = parsed.current + 1; next <= total; next += 1) {
    const { year: targetYear, month: targetMonth } = addMonthsToYearMonth(
      year,
      month,
      next - parsed.current
    );
    const monthRef = ensureMonthStructure(db, targetYear, targetMonth);
    const parcelaStr = `${next}/${parsed.total}`;

    const duplicated = monthRef.entradas_saidas.some(
      (item) =>
        item.serie_id === entry.serie_id &&
        item.parcela === parcelaStr
    );
    if (duplicated) {
      continue;
    }

    const cloned = {
      ...entry,
      id: randomUUID(),
      parcela: parcelaStr,
      data: shiftDateByMonths(entry.data, next - parsed.current),
    };

    monthRef.entradas_saidas.push(cloned);
    recalcMonthTotals(monthRef);
  }
}

function cascadeUpdateInstallments(db, targetEntry, parsedParcela, changes) {
  const allowedKeys = ["valor", "descricao", "data"];
  const filteredChanges = Object.fromEntries(
    Object.entries(changes).filter(([key]) => allowedKeys.includes(key))
  );
  if (!Object.keys(filteredChanges).length) return;

  Object.values(db.anos || {}).forEach((yearData) => {
    Object.entries(yearData.meses || {}).forEach(([monthKey, monthRef]) => {
      let touched = false;
      monthRef.entradas_saidas.forEach((item) => {
        if (item.serie_id !== targetEntry.serie_id) return;
        const parsed = parseParcela(item.parcela);
        if (!parsed || parsed.current < parsedParcela.current) return;

        if (filteredChanges.valor !== undefined) {
          item.valor = filteredChanges.valor;
          touched = true;
        }
        if (filteredChanges.descricao !== undefined) {
          item.descricao = filteredChanges.descricao;
          touched = true;
        }
        if (filteredChanges.data !== undefined) {
          item.data = adjustDateDay(item.data, filteredChanges.data);
          touched = true;
        }
      });

      if (touched) {
        recalcMonthTotals(monthRef);
      }
    });
  });
}

function yearMonthKey(year, month) {
  return `${year}-${month}`;
}

function compareYearMonth(a, b) {
  const aKey = yearMonthKey(a.year, a.month);
  const bKey = yearMonthKey(b.year, b.month);
  if (aKey === bKey) return 0;
  return aKey > bKey ? 1 : -1;
}

function generateFutureRecurrings(db, recurringKey, baseItem, startYear, startMonth) {
  if (!baseItem.recorrencia) return;
  const terminaEm = baseItem.recorrencia.termina_em;

  const end = terminaEm
    ? {
        year: terminaEm.split("-")[0],
        month: terminaEm.split("-")[1],
      }
    : addMonthsToYearMonth(startYear, startMonth, DEFAULT_RECURRING_MONTHS - 1);

  let offset = 1;
  let current = addMonthsToYearMonth(startYear, startMonth, offset);

  while (compareYearMonth(current, end) <= 0) {
    const monthRef = ensureMonthStructure(db, current.year, current.month);
    const list = getRecurringList(monthRef, recurringKey);
    if (!list) break;

    const alreadyExists = list.some(
      (item) =>
        item.serie_id === baseItem.serie_id &&
        item.descricao === baseItem.descricao &&
        item.valor === baseItem.valor
    );

    if (!alreadyExists) {
      const cloned = {
        ...baseItem,
        id: randomUUID(),
        data: shiftDateByMonths(baseItem.data, offset),
      };
      list.push(cloned);
      recalcMonthTotals(monthRef);
    }

    offset += 1;
    current = addMonthsToYearMonth(startYear, startMonth, offset);
  }
}

function cascadeUpdateRecurring(db, recurringKey, baseItem, fromYear, fromMonth, changes) {
  const allowedKeys = ["valor", "descricao", "data", "recorrencia"];
  const filteredChanges = Object.fromEntries(
    Object.entries(changes).filter(([key]) => allowedKeys.includes(key))
  );
  if (!Object.keys(filteredChanges).length) return;

  Object.entries(db.anos || {}).forEach(([year, yearData]) => {
    Object.entries(yearData.meses || {}).forEach(([month, monthRef]) => {
      if (compareYearMonth({ year, month }, { year: fromYear, month: fromMonth }) < 0) {
        return;
      }

      const list = getRecurringList(monthRef, recurringKey);
      if (!list) return;

      let touched = false;
      list.forEach((item) => {
        if (item.serie_id !== baseItem.serie_id) return;

        if (filteredChanges.valor !== undefined) {
          item.valor = filteredChanges.valor;
          touched = true;
        }
        if (filteredChanges.descricao !== undefined) {
          item.descricao = filteredChanges.descricao;
          touched = true;
        }
        if (filteredChanges.data !== undefined) {
          item.data = adjustDateDay(item.data, filteredChanges.data);
          touched = true;
        }
        if (filteredChanges.recorrencia !== undefined) {
          item.recorrencia = filteredChanges.recorrencia;
          touched = true;
        }
      });

      if (touched) {
        recalcMonthTotals(monthRef);
      }
    });
  });
}

async function getMonth(year, month) {
  const db = await readDbWithMigration();
  return db.anos?.[year]?.meses?.[month] ?? null;
}

async function setMonthData(year, month, dados) {
  const db = await readDbWithMigration();
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
  const db = await readDbWithMigration();
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

async function setMonthSavings(year, month, savings) {
  const db = await readDbWithMigration();
  const monthRef = ensureMonthStructure(db, year, month);

  monthRef.poupanca.movimentos = normalizeListWithIds(
    savings.movimentos || []
  ).map((item) => ({
    ...item,
    descricao: item.descricao,
    tipo: item.tipo,
  }));

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function setMonthLoans(year, month, loans) {
  const db = await readDbWithMigration();
  const monthRef = ensureMonthStructure(db, year, month);

  monthRef.emprestimos = {
    feitos: normalizeListWithIds(loans.feitos || []).map((item) => ({
      ...item,
      descricao: item.descricao,
    })),
    recebidos: normalizeListWithIds(loans.recebidos || []).map((item) => ({
      ...item,
      descricao: item.descricao,
    })),
  };

  recalcMonthTotals(monthRef);
  await jsonStorage.write(db);
  return monthRef;
}

async function addEntry(year, month, entry, { generateFutureInstallments = false } = {}) {
  const db = await readDbWithMigration();
  const monthRef = ensureMonthStructure(db, year, month);

  const serieId = entry.parcela ? entry.serie_id ?? randomUUID() : entry.serie_id;
  const newEntry = {
    ...entry,
    parcela: entry.parcela ?? null,
    id: randomUUID(),
  };

  if (serieId) {
    newEntry.serie_id = serieId;
  }

  monthRef.entradas_saidas.push(newEntry);
  recalcMonthTotals(monthRef);

  if (generateFutureInstallments && newEntry.parcela) {
    createFutureInstallments(db, year, month, newEntry);
  }

  await jsonStorage.write(db);
  return monthRef;
}

async function updateEntry(year, month, entryId, changes, { cascade = false } = {}) {
  const db = await readDbWithMigration();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const target = monthRef.entradas_saidas.find((item) => item.id === entryId);
  if (!target) return null;

  Object.entries(changes).forEach(([key, value]) => {
    target[key] = value;
  });

  const parsed = parseParcela(target.parcela);
  if (cascade && target.serie_id && parsed) {
    cascadeUpdateInstallments(db, target, parsed, changes);
  } else {
    recalcMonthTotals(monthRef);
  }

  await jsonStorage.write(db);
  return monthRef;
}

async function deleteEntry(year, month, entryId) {
  const db = await readDbWithMigration();
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

async function addRecurring(
  year,
  month,
  recurringKey,
  item,
  { generateFutureRecurring = false } = {}
) {
  const db = await readDbWithMigration();
  const monthRef = ensureMonthStructure(db, year, month);
  const list = getRecurringList(monthRef, recurringKey);
  if (!list) return null;

  const newItem = { ...item, id: randomUUID(), serie_id: item.serie_id ?? randomUUID() };
  list.push(newItem);

  recalcMonthTotals(monthRef);

  if (generateFutureRecurring && newItem.recorrencia) {
    generateFutureRecurrings(db, recurringKey, newItem, year, month);
  }

  await jsonStorage.write(db);
  return monthRef;
}

async function updateRecurring(
  year,
  month,
  recurringKey,
  itemId,
  changes,
  { cascade = false } = {}
) {
  const db = await readDbWithMigration();
  const monthRef = db.anos?.[year]?.meses?.[month];
  if (!monthRef) return null;

  const list = getRecurringList(monthRef, recurringKey);
  if (!list) return null;

  const target = list.find((item) => item.id === itemId);
  if (!target) return null;

  Object.entries(changes).forEach(([key, value]) => {
    target[key] = value;
  });

  if (cascade && target.serie_id) {
    cascadeUpdateRecurring(db, recurringKey, target, year, month, changes);
  } else {
    recalcMonthTotals(monthRef);
  }

  await jsonStorage.write(db);
  return monthRef;
}

async function deleteRecurring(year, month, recurringKey, itemId) {
  const db = await readDbWithMigration();
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
  setMonthSavings,
  setMonthLoans,
  addEntry,
  updateEntry,
  deleteEntry,
  addRecurring,
  updateRecurring,
  deleteRecurring,
};
