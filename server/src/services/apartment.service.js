import jsonStorage from "../lib/jsonStorage.js";

const SERIES_KEYS = ["financiamento_caixa", "entrada_construtora"];

function normalizeYearMonth(year, month) {
  return {
    year: String(year).padStart(4, "0"),
    month: String(month).padStart(2, "0"),
  };
}

function yearMonthKey(entry) {
  return `${entry.ano}-${entry.mes}`;
}

function compareEntries(a, b) {
  const aKey = yearMonthKey(a);
  const bKey = yearMonthKey(b);
  if (aKey === bKey) return 0;
  return aKey > bKey ? 1 : -1;
}

function ensureApartmentStructure(db) {
  let changed = false;

  if (!db.apartamento || typeof db.apartamento !== "object") {
    db.apartamento = {};
    changed = true;
  }

  SERIES_KEYS.forEach((key) => {
    if (!Array.isArray(db.apartamento[key])) {
      db.apartamento[key] = [];
      changed = true;
    }
  });

  return changed;
}

function sanitizeEntry(rawEntry = {}) {
  const ano = String(rawEntry.ano ?? rawEntry.year ?? "").padStart(4, "0");
  const mes = String(rawEntry.mes ?? rawEntry.month ?? "").padStart(2, "0");

  const normalized = {
    ano,
    mes,
    valor_parcela: Number(rawEntry.valor_parcela ?? rawEntry.valor ?? 0),
  };

  const saldo = rawEntry.saldo_devedor;
  normalized.saldo_devedor =
    saldo === undefined || saldo === null ? null : Number(saldo);

  return normalized;
}

async function readDbWithMigration() {
  const db = await jsonStorage.read();
  let changed = ensureApartmentStructure(db);

  SERIES_KEYS.forEach((key) => {
    const migrated = db.apartamento[key].map((entry) => sanitizeEntry(entry));
    if (migrated.length !== db.apartamento[key].length) {
      changed = true;
    } else {
      migrated.forEach((entry, index) => {
        const original = db.apartamento[key][index];
        if (
          entry.ano !== original.ano ||
          entry.mes !== original.mes ||
          entry.valor_parcela !== original.valor_parcela ||
          entry.saldo_devedor !== original.saldo_devedor
        ) {
          changed = true;
        }
      });
    }
    db.apartamento[key] = migrated;
  });

  if (changed) {
    await jsonStorage.write(db);
  }

  return db;
}

function computeSeriesWithDiff(series = []) {
  const sorted = [...series].sort(compareEntries);
  let previous = null;

  return sorted.map((entry) => {
    const normalized = {
      ...entry,
      referencia: yearMonthKey(entry),
      valor_parcela: Number(entry.valor_parcela.toFixed(2)),
      saldo_devedor:
        entry.saldo_devedor === null
          ? null
          : Number(entry.saldo_devedor.toFixed(2)),
      diferenca_vs_mes_anterior: null,
      saldo_devedor_variacao: null,
    };

    if (previous) {
      normalized.diferenca_vs_mes_anterior = Number(
        (normalized.valor_parcela - previous.valor_parcela).toFixed(2)
      );
      if (
        normalized.saldo_devedor !== null &&
        previous.saldo_devedor !== null
      ) {
        normalized.saldo_devedor_variacao = Number(
          (normalized.saldo_devedor - previous.saldo_devedor).toFixed(2)
        );
      }
    }

    previous = normalized;
    return normalized;
  });
}

function buildSeriesView(db) {
  const series = {};
  SERIES_KEYS.forEach((key) => {
    series[key] = computeSeriesWithDiff(db.apartamento[key]);
  });
  return series;
}

function findEntry(series, year, month) {
  return (
    series.find((entry) => entry.ano === year && entry.mes === month) ?? null
  );
}

function buildMonthView(db, year, month) {
  const { year: normalizedYear, month: normalizedMonth } = normalizeYearMonth(
    year,
    month
  );
  const series = buildSeriesView(db);

  const caixa = findEntry(
    series.financiamento_caixa,
    normalizedYear,
    normalizedMonth
  );
  const construtora = findEntry(
    series.entrada_construtora,
    normalizedYear,
    normalizedMonth
  );

  const hasData = !!(caixa || construtora);
  let totals = null;

  if (hasData) {
    const totalParcelas =
      (caixa?.valor_parcela || 0) + (construtora?.valor_parcela || 0);
    const saldoDevedorTotal =
      caixa?.saldo_devedor !== null || construtora?.saldo_devedor !== null
        ? (caixa?.saldo_devedor ?? 0) + (construtora?.saldo_devedor ?? 0)
        : null;

    totals = {
      parcelas: Number(totalParcelas.toFixed(2)),
      saldo_devedor:
        saldoDevedorTotal === null ? null : Number(saldoDevedorTotal.toFixed(2)),
    };
  }

  return {
    referencia: `${normalizedYear}-${normalizedMonth}`,
    financiamento_caixa: caixa,
    entrada_construtora: construtora,
    totais: totals,
  };
}

function buildEvolution(db, { year } = {}) {
  const filterYear = year ? String(year).padStart(4, "0") : null;
  const filteredDb = { ...db, apartamento: { ...db.apartamento } };

  SERIES_KEYS.forEach((key) => {
    filteredDb.apartamento[key] = db.apartamento[key].filter(
      (entry) => !filterYear || entry.ano === filterYear
    );
  });

  const series = buildSeriesView(filteredDb);
  const references = new Set([
    ...series.financiamento_caixa.map((entry) => entry.referencia),
    ...series.entrada_construtora.map((entry) => entry.referencia),
  ]);

  const sortedRefs = Array.from(references).sort();
  let previousCombined = null;
  const combinada = sortedRefs.map((ref) => {
    const [ano, mes] = ref.split("-");
    const caixa = findEntry(series.financiamento_caixa, ano, mes);
    const construtora = findEntry(series.entrada_construtora, ano, mes);

    const totalParcelas =
      (caixa?.valor_parcela || 0) + (construtora?.valor_parcela || 0);
    const saldoDevedorTotal =
      caixa?.saldo_devedor !== null || construtora?.saldo_devedor !== null
        ? (caixa?.saldo_devedor ?? 0) + (construtora?.saldo_devedor ?? 0)
        : null;

    const combinedEntry = {
      referencia: ref,
      parcelas: Number(totalParcelas.toFixed(2)),
      saldo_devedor:
        saldoDevedorTotal === null ? null : Number(saldoDevedorTotal.toFixed(2)),
      diferenca_vs_mes_anterior: null,
      saldo_devedor_variacao: null,
    };

    if (previousCombined) {
      combinedEntry.diferenca_vs_mes_anterior = Number(
        (combinedEntry.parcelas - previousCombined.parcelas).toFixed(2)
      );
      if (
        combinedEntry.saldo_devedor !== null &&
        previousCombined.saldo_devedor !== null
      ) {
        combinedEntry.saldo_devedor_variacao = Number(
          (combinedEntry.saldo_devedor - previousCombined.saldo_devedor).toFixed(
            2
          )
        );
      }
    }

    previousCombined = combinedEntry;
    return combinedEntry;
  });

  return {
    financiamento_caixa: series.financiamento_caixa,
    entrada_construtora: series.entrada_construtora,
    combinada,
  };
}

async function getMonth(year, month) {
  const db = await readDbWithMigration();
  return buildMonthView(db, year, month);
}

async function setMonthData(year, month, payload) {
  const db = await readDbWithMigration();
  const { year: normalizedYear, month: normalizedMonth } = normalizeYearMonth(
    year,
    month
  );
  let changed = false;

  SERIES_KEYS.forEach((key) => {
    if (payload[key] === undefined) return;
    const series = db.apartamento[key];
    const index = series.findIndex(
      (entry) => entry.ano === normalizedYear && entry.mes === normalizedMonth
    );

    if (payload[key] === null) {
      if (index >= 0) {
        series.splice(index, 1);
        changed = true;
      }
      return;
    }

    const sanitized = sanitizeEntry({
      ...payload[key],
      ano: normalizedYear,
      mes: normalizedMonth,
    });

    if (index >= 0) {
      series[index] = { ...series[index], ...sanitized };
    } else {
      series.push(sanitized);
    }
    changed = true;
  });

  if (changed) {
    await jsonStorage.write(db);
  }

  return buildMonthView(db, year, month);
}

async function getEvolution({ year } = {}) {
  const db = await readDbWithMigration();
  return buildEvolution(db, { year });
}

export default { getMonth, setMonthData, getEvolution };
