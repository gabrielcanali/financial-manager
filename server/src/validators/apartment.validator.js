import { validateYearMonth } from "./months.validator.js";

const MAX_INSTALLMENT_VALUE = 1_000_000;
const MAX_DEBT_VALUE = 10_000_000;

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

export { validateYearMonth, validateApartmentPayload };
