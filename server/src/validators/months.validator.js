const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PARCELA_REGEX = /^\d+\/\d+$/;
const YEAR_REGEX = /^\d{4}$/;
const MONTH_REGEX = /^(0[1-9]|1[0-2])$/;
const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/;

const MAX_INSTALLMENTS = 36;
const MAX_ABS_VALUE = 1_000_000;

function isIsoDate(value) {
  return typeof value === "string" && ISO_DATE_REGEX.test(value);
}

function compareYearMonthStr(a, b) {
  const [aYear, aMonth] = a.split("-");
  const [bYear, bMonth] = b.split("-");
  if (aYear === bYear && aMonth === bMonth) return 0;
  return aYear !== bYear
    ? (aYear > bYear ? 1 : -1)
    : aMonth > bMonth
    ? 1
    : -1;
}

function validateYearMonth(year, month) {
  const errors = [];

  if (!YEAR_REGEX.test(String(year))) {
    errors.push("year deve ser string com formato YYYY");
  }

  if (!MONTH_REGEX.test(String(month))) {
    errors.push("month deve ser string com formato MM (01-12)");
  }

  return errors;
}

function validateDados(payload = {}, { partial = false } = {}) {
  const errors = [];
  const result = {};

  if (payload.adiantamento !== undefined) {
    const num = Number(payload.adiantamento);
    if (!Number.isFinite(num)) {
      errors.push("adiantamento deve ser numerico");
    } else {
      result.adiantamento = num;
    }
  } else if (!partial) {
    errors.push("adiantamento obrigatorio");
  }

  if (payload.pagamento !== undefined) {
    const num = Number(payload.pagamento);
    if (!Number.isFinite(num)) {
      errors.push("pagamento deve ser numerico");
    } else {
      result.pagamento = num;
    }
  } else if (!partial) {
    errors.push("pagamento obrigatorio");
  }

  if (partial && Object.keys(result).length === 0) {
    errors.push("nenhum campo enviado para atualizar dados");
  }

  return { errors, value: result };
}

function validateCalendar(payload = {}, { partial = false } = {}) {
  const errors = [];
  const result = {};

  if (payload.pagamentos !== undefined) {
    if (!Array.isArray(payload.pagamentos)) {
      errors.push("pagamentos deve ser uma lista de datas ISO");
    } else {
      const invalid = payload.pagamentos.filter((d) => !isIsoDate(d));
      if (invalid.length) {
        errors.push("pagamentos contem datas invalidas (usar YYYY-MM-DD)");
      } else {
        result.pagamentos = payload.pagamentos;
      }
    }
  } else if (!partial) {
    result.pagamentos = [];
  }

  if (payload.fechamento_fatura !== undefined) {
    if (
      payload.fechamento_fatura !== null &&
      !isIsoDate(payload.fechamento_fatura)
    ) {
      errors.push("fechamento_fatura deve ser data ISO ou null");
    } else {
      result.fechamento_fatura = payload.fechamento_fatura;
    }
  } else if (!partial) {
    result.fechamento_fatura = null;
  }

  if (partial && Object.keys(result).length === 0) {
    errors.push("nenhum campo enviado para atualizar calendario");
  }

  return { errors, value: result };
}

function validateMovement(
  payload = {},
  {
    allowParcela = true,
    allowRecorrencia = false,
    partial = false,
    expectedYear,
    expectedMonth,
    maxValor = MAX_ABS_VALUE,
    maxParcelas = MAX_INSTALLMENTS,
    minYearMonth,
  } = {}
) {
  const errors = [];
  const result = {};

  if (payload.data !== undefined) {
    if (!isIsoDate(payload.data)) {
      errors.push("data deve estar no formato YYYY-MM-DD");
    } else {
      result.data = payload.data;
      if (expectedYear && expectedMonth) {
        const [yyyy, mm] = payload.data.split("-");
        if (yyyy !== String(expectedYear) || mm !== String(expectedMonth)) {
          errors.push("data deve estar dentro do mes informado");
        }
      }
    }
  } else if (!partial) {
    errors.push("data obrigatoria");
  }

  if (payload.valor !== undefined) {
    const num = Number(payload.valor);
    if (!Number.isFinite(num)) {
      errors.push("valor deve ser numerico");
    } else if (Math.abs(num) > maxValor) {
      errors.push(`valor deve estar entre -${maxValor} e ${maxValor}`);
    } else {
      result.valor = num;
    }
  } else if (!partial) {
    errors.push("valor obrigatorio");
  }

  if (payload.descricao !== undefined) {
    const desc = String(payload.descricao).trim();
    if (!desc) {
      errors.push("descricao deve ser string nao vazia");
    } else {
      result.descricao = desc;
    }
  } else if (!partial) {
    errors.push("descricao obrigatoria");
  }

  if (allowParcela) {
    if (payload.parcela !== undefined) {
      if (
        payload.parcela !== null &&
        (typeof payload.parcela !== "string" || !PARCELA_REGEX.test(payload.parcela))
      ) {
        errors.push('parcela deve estar no formato "n/m" ou ser null');
      } else {
        const [currentStr, totalStr] = (payload.parcela || "").split("/");
        const current = Number(currentStr);
        const total = Number(totalStr);

        if (payload.parcela !== null) {
          if (!Number.isInteger(current) || !Number.isInteger(total)) {
            errors.push("parcela deve conter numeros inteiros");
          } else if (total > maxParcelas) {
            errors.push(`parcela nao pode ultrapassar ${maxParcelas} unidades`);
          } else if (current < 1 || current > total) {
            errors.push('parcela deve seguir o formato "n/m" onde 1 <= n <= m');
          } else {
            result.parcela = `${current}/${total}`;
          }
        } else {
          result.parcela = null;
        }
      }
    } else if (!partial) {
      result.parcela = null;
    }
  } else if (payload.parcela !== undefined && payload.parcela !== null) {
    errors.push("parcela nao e permitido em recorrentes");
  }

  if (payload.recorrencia !== undefined) {
    if (!allowRecorrencia) {
      errors.push("recorrencia nao permitida neste recurso");
    } else if (payload.recorrencia !== null && typeof payload.recorrencia !== "object") {
      errors.push("recorrencia deve ser objeto ou null");
    } else if (payload.recorrencia) {
      const { tipo, termina_em } = payload.recorrencia;
      if (tipo !== undefined && typeof tipo !== "string") {
        errors.push("recorrencia.tipo deve ser string");
      } else if (tipo) {
        result.recorrencia = { ...(result.recorrencia || {}), tipo: tipo.trim() };
      }
      if (termina_em !== undefined) {
        if (termina_em !== null && !YEAR_MONTH_REGEX.test(termina_em)) {
          errors.push('recorrencia.termina_em deve ser "YYYY-MM" ou null');
        } else if (termina_em && minYearMonth && compareYearMonthStr(termina_em, minYearMonth) < 0) {
          errors.push("recorrencia.termina_em nao pode ser anterior ao mes informado");
        } else {
          result.recorrencia = {
            ...(result.recorrencia || {}),
            termina_em,
          };
        }
      }
    } else if (payload.recorrencia === null) {
      result.recorrencia = null;
    }
  }

  if (partial && Object.keys(result).length === 0) {
    errors.push("nenhum campo enviado para atualizar lancamento");
  }

  return { errors, value: result };
}

function resolveRecurringKey(period) {
  const normalized = String(period || "").toLowerCase();
  if (normalized === "pre" || normalized === "pre_fatura" || normalized === "prefatura") {
    return "contas_recorrentes_pre_fatura";
  }
  if (normalized === "post" || normalized === "pos" || normalized === "pos_fatura" || normalized === "posfatura") {
    return "contas_recorrentes_pos_fatura";
  }
  return null;
}

export {
  validateYearMonth,
  validateDados,
  validateCalendar,
  validateMovement,
  resolveRecurringKey,
  MAX_INSTALLMENTS,
};
