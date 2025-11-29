import fs from "node:fs/promises";
import path from "node:path";
import jsonStorage from "../lib/jsonStorage.js";
import { validateDbPayload } from "../validators/import.validator.js";
import { validateConfig, DEFAULT_CONFIG } from "../validators/config.validator.js";

function nowIso() {
  return new Date().toISOString();
}

function getBackupDir() {
  const dbFile = jsonStorage.getDbFilePath();
  return path.join(path.dirname(dbFile), "backups");
}

function padYear(year) {
  return String(year ?? "").padStart(4, "0");
}

function padMonth(month) {
  return String(month ?? "").padStart(2, "0");
}

function safeDayInMonth(year, month, day) {
  if (day === null || day === undefined) return null;
  const numeric = Number(day);
  if (!Number.isFinite(numeric)) return null;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const safe = Math.min(Math.max(1, Math.trunc(numeric)), lastDay);
  return safe;
}

function logAdmin(action, meta = {}) {
  const payload = JSON.stringify({ action, at: nowIso(), ...meta });
  console.info(`[admin] ${payload}`);
}

function buildBaseMonth(year, month, config) {
  const closingDay = safeDayInMonth(
    year,
    month,
    config?.fechamento_fatura_dia
  );
  const adiantamento = config?.adiantamento_salario || DEFAULT_CONFIG.adiantamento_salario;
  const payments = [];

  if (adiantamento.habilitado && adiantamento.dia) {
    const adjusted = safeDayInMonth(year, month, adiantamento.dia);
    if (adjusted) {
      payments.push(`${year}-${month}-${String(adjusted).padStart(2, "0")}`);
    }
  }

  return {
    dados: {
      adiantamento: 0,
      pagamento: 0,
      total_liquido: 0,
    },
    calendario: {
      pagamentos: payments,
      fechamento_fatura: closingDay
        ? `${year}-${month}-${String(closingDay).padStart(2, "0")}`
        : null,
    },
    entradas_saidas: [],
    contas_recorrentes_pre_fatura: [],
    contas_recorrentes_pos_fatura: [],
    poupanca: { movimentos: [] },
    emprestimos: { feitos: [], recebidos: [] },
  };
}

async function exportData() {
  const db = await jsonStorage.read();
  logAdmin("export", {
    size_bytes: Buffer.byteLength(JSON.stringify(db)),
  });
  return {
    exported_at: nowIso(),
    db,
  };
}

async function getStatus() {
  const db = await jsonStorage.read();
  const years = Object.keys(db.anos || {}).sort();
  const lastYear = years.length ? years[years.length - 1] : null;
  const lastMonth = lastYear
    ? Object.keys(db.anos?.[lastYear]?.meses || {}).sort().pop() || null
    : null;

  return {
    has_data: years.length > 0,
    years,
    last_year: lastYear,
    last_month: lastMonth,
    config: db.config ?? null,
    db_path: jsonStorage.getDbFilePath(),
  };
}

async function validateImport(payload) {
  const result = validateDbPayload(payload);
  if ((result.summary?.months || 0) === 0) {
    result.warnings.push(
      "Nenhum mes encontrado no JSON; confirme se deseja importar mesmo assim."
    );
  }
  logAdmin("validate", {
    errors: result.errors.length,
    warnings: result.warnings.length,
    months: result.summary?.months || 0,
    years: result.summary?.years || 0,
  });
  return result;
}

async function importData(payload, { backup = false } = {}) {
  const { errors, warnings, normalized, summary } = validateDbPayload(payload);
  if (errors.length) {
    return { errors, warnings, result: null, summary };
  }

  if ((summary?.months || 0) === 0) {
    warnings.push(
      "Nenhum mes encontrado no JSON; a base sera sobrescrita com um arquivo vazio."
    );
  }

  let backupInfo = null;
  if (backup) {
    const current = await jsonStorage.read();
    if (Object.keys(current).length) {
      backupInfo = await backupData({ reason: "import" });
    }
  }

  await jsonStorage.write(normalized);
  logAdmin("import", {
    months: summary?.months || 0,
    years: summary?.years || 0,
    backup_created: Boolean(backupInfo),
  });
  return {
    errors: [],
    warnings,
    summary,
    result: {
      imported_at: nowIso(),
      status: "ok",
      size_bytes: Buffer.byteLength(JSON.stringify(normalized)),
      config: normalized.config,
      backup: backupInfo,
    },
  };
}

async function bootstrapData({ config, year, month } = {}) {
  const current = await jsonStorage.read();
  if (Object.keys(current).length) {
    return {
      errors: ["Ja existe uma base carregada. Use /admin/import para substituir."],
      warnings: [],
      result: null,
    };
  }

  const {
    errors: configErrors,
    warnings,
    value: validatedConfig,
  } = validateConfig(config, { allowMissing: true });
  if (configErrors.length) {
    return { errors: configErrors, warnings, result: null };
  }

  const now = new Date();
  const targetYear = padYear(year ?? now.getFullYear());
  const targetMonth = padMonth(month ?? now.getMonth() + 1);
  const baseConfig = {
    ...DEFAULT_CONFIG,
    ...validatedConfig,
    adiantamento_salario: {
      ...DEFAULT_CONFIG.adiantamento_salario,
      ...validatedConfig.adiantamento_salario,
    },
    criado_em: nowIso(),
    atualizado_em: nowIso(),
  };

  const db = {
    config: baseConfig,
    anos: {
      [targetYear]: {
        meses: {
          [targetMonth]: buildBaseMonth(targetYear, targetMonth, baseConfig),
        },
      },
    },
    apartamento: {
      financiamento_caixa: [],
      entrada_construtora: [],
    },
  };

  await jsonStorage.write(db);
  logAdmin("bootstrap", { year: targetYear, month: targetMonth });
  return {
    errors: [],
    warnings,
    result: {
      created_at: nowIso(),
      status: "ok",
      year: targetYear,
      month: targetMonth,
      config: baseConfig,
    },
  };
}

async function backupData({ reason, skipLog = false } = {}) {
  const backupDir = getBackupDir();
  await fs.mkdir(backupDir, { recursive: true });
  const db = await jsonStorage.read();
  const serialized = JSON.stringify(db, null, 2);
  const timestamp = nowIso().replace(/[:.]/g, "-");
  const filename = `financeiro-${timestamp}.json`;
  const dest = path.join(backupDir, filename);
  await fs.writeFile(dest, serialized, "utf-8");

  const result = {
    backup_at: nowIso(),
    file: dest,
    size_bytes: Buffer.byteLength(serialized),
    reason: reason || "manual",
  };
  if (!skipLog) {
    logAdmin("backup", {
      file: dest,
      size_bytes: result.size_bytes,
      reason: result.reason,
    });
  }
  return result;
}

export default {
  exportData,
  importData,
  validateImport,
  bootstrapData,
  getStatus,
  backupData,
};
