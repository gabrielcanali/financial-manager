import { validateYearMonth } from "./months.validator.js";

const MAX_INSTALLMENT_VALUE = 1_000_000;
const MAX_DEBT_VALUE = 10_000_000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateInstallment(entry, key) {
  const errors = [];
  if (entry === null) return { errors, value: null };

  if (!entry || typeof entry !== "object") {
    errors.push(`${key} deve ser um objeto ou null`);
    return { errors, value: null };
  }

  const normalized = {};

  if (entry.valor_parcela !== undefined) {
    const valor = Number(entry.valor_parcela);
    if (!Number.isFinite(valor)) {
      errors.push(`${key}.valor_parcela deve ser numerico`);
    } else if (valor <= 0) {
      errors.push(`${key}.valor_parcela deve ser maior que zero`);
    } else if (valor > MAX_INSTALLMENT_VALUE) {
      errors.push(
        `${key}.valor_parcela nao pode ultrapassar ${MAX_INSTALLMENT_VALUE}`
      );
    } else {
      normalized.valor_parcela = valor;
    }
  } else {
    errors.push(`${key}.valor_parcela obrigatorio`);
  }

  if (entry.saldo_devedor !== undefined) {
    if (entry.saldo_devedor === null) {
      normalized.saldo_devedor = null;
    } else {
      const saldo = Number(entry.saldo_devedor);
      if (!Number.isFinite(saldo)) {
        errors.push(`${key}.saldo_devedor deve ser numerico`);
      } else if (saldo < 0) {
        errors.push(`${key}.saldo_devedor deve ser maior ou igual a zero`);
      } else if (saldo > MAX_DEBT_VALUE) {
        errors.push(
          `${key}.saldo_devedor nao pode ultrapassar ${MAX_DEBT_VALUE}`
        );
      } else {
        normalized.saldo_devedor = saldo;
      }
    }
  }

  return { errors, value: normalized };
}

function validateApartmentPayload(payload = {}) {
  const errors = [];
  const result = {};

  if (!isPlainObject(payload)) {
    errors.push(
      "payload deve ser um objeto com financiamento_caixa e/ou entrada_construtora"
    );
    return { errors, value: result };
  }

  ["financiamento_caixa", "entrada_construtora"].forEach((key) => {
    if (payload[key] === undefined) return;
    const { errors: entryErrors, value } = validateInstallment(
      payload[key],
      key
    );
    errors.push(...entryErrors);
    result[key] = value;
  });

  if (Object.keys(result).length === 0) {
    errors.push("enviar financiamento_caixa e/ou entrada_construtora");
  }

  return { errors, value: result };
}

function validateApartmentSeries(list, key) {
  const errors = [];
  const value = [];

  if (!Array.isArray(list)) {
    errors.push(`${key} deve ser uma lista`);
    return { errors, value };
  }

  list.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      errors.push(`${key}[${index}] deve ser um objeto`);
      return;
    }

    const ano = String(entry.ano ?? entry.year ?? "").padStart(4, "0");
    const mes = String(entry.mes ?? entry.month ?? "").padStart(2, "0");
    const ymErrors = validateYearMonth(ano, mes);
    ymErrors.forEach((err) => errors.push(`${key}[${index}]: ${err}`));

    const { errors: entryErrors, value: normalized } = validateInstallment(
      entry,
      `${key}[${index}]`
    );
    errors.push(...entryErrors);

    if (!entryErrors.length && !ymErrors.length) {
      value.push({
        ...normalized,
        ano,
        mes,
      });
    }
  });

  return { errors, value };
}

export {
  validateYearMonth,
  validateApartmentPayload,
  validateApartmentSeries,
  MAX_DEBT_VALUE,
  MAX_INSTALLMENT_VALUE,
};
