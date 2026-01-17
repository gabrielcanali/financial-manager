const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PARCELA_REGEX = /^\d+\/\d+$/;
const YEAR_REGEX = /^\d{4}$/;
const MONTH_REGEX = /^(0[1-9]|1[0-2])$/;
const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/;
const SAVINGS_TYPES = ["aporte", "resgate"];

const MAX_INSTALLMENTS = 36;
const MAX_ABS_VALUE = 1_000_000;
const MAX_CATEGORY_LENGTH = 40;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;
const RECURRING_FIELDS = ["tipo", "termina_em"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

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

function validateYear(year) {
  return YEAR_REGEX.test(String(year))
    ? []
    : ["year deve ser string com formato YYYY"];
}

function validateDados(payload = {}, { partial = false } = {}) {
  const errors = [];
  const result = {};

  if (!isPlainObject(payload)) {
    errors.push("dados deve ser um objeto");
    return { errors, value: result };
  }

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

function validateCalendar(
  payload = {},
  { partial = false, expectedYear, expectedMonth } = {}
) {
  const errors = [];
  const result = {};
  const expectedYearStr =
    expectedYear !== undefined ? String(expectedYear).padStart(4, "0") : null;
  const expectedMonthStr =
    expectedMonth !== undefined ? String(expectedMonth).padStart(2, "0") : null;

  if (!isPlainObject(payload)) {
    errors.push("calendario deve ser um objeto");
    return { errors, value: result };
  }

  if (payload.pagamentos !== undefined) {
    if (!Array.isArray(payload.pagamentos)) {
      errors.push("pagamentos deve ser uma lista de datas ISO");
    } else {
      const invalid = payload.pagamentos.filter((d) => !isIsoDate(d));
      if (invalid.length) {
        errors.push("pagamentos contem datas invalidas (usar YYYY-MM-DD)");
      } else {
        const sanitized = payload.pagamentos;
        if (expectedYearStr && expectedMonthStr) {
          const outOfRange = sanitized
            .map((d, index) => ({ d, index }))
            .filter(({ d }) => {
              const [yyyy, mm] = d.split("-");
              return yyyy !== expectedYearStr || mm !== expectedMonthStr;
            });
          if (outOfRange.length) {
            const { index } = outOfRange[0];
            errors.push(
              `pagamentos[${index}] deve estar no mes ${expectedYearStr}-${expectedMonthStr}`
            );
          } else {
            result.pagamentos = sanitized;
          }
        } else {
          result.pagamentos = sanitized;
        }
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
    } else if (expectedYearStr && expectedMonthStr && payload.fechamento_fatura) {
      const [yyyy, mm] = payload.fechamento_fatura.split("-");
      if (yyyy !== expectedYearStr || mm !== expectedMonthStr) {
        errors.push(
          `fechamento_fatura deve estar no mes ${expectedYearStr}-${expectedMonthStr}`
        );
      } else {
        result.fechamento_fatura = payload.fechamento_fatura;
      }
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

function validateSavings(payload = {}, { partial = false, expectedYear, expectedMonth } = {}) {
  const errors = [];
  const result = {};

  if (!isPlainObject(payload)) {
    errors.push("poupanca deve ser um objeto");
    return { errors, value: result };
  }

  const validateMovement = (movement, index) => {
    const movementErrors = [];
    const normalized = {};

    if (!isIsoDate(movement.data)) {
      movementErrors.push(`movimentos[${index}].data deve estar no formato YYYY-MM-DD`);
    } else {
      normalized.data = movement.data;
      if (expectedYear && expectedMonth) {
        const [yyyy, mm] = movement.data.split("-");
        if (yyyy !== String(expectedYear) || mm !== String(expectedMonth)) {
          movementErrors.push(`movimentos[${index}].data deve estar no mes informado`);
        }
      }
    }

    const valor = Number(movement.valor);
    if (!Number.isFinite(valor)) {
      movementErrors.push(`movimentos[${index}].valor deve ser numerico`);
    } else if (valor <= 0) {
      movementErrors.push(`movimentos[${index}].valor deve ser maior que zero`);
    } else {
      normalized.valor = valor;
    }

    if (movement.descricao === undefined) {
      movementErrors.push(`movimentos[${index}].descricao obrigatoria`);
    } else {
      const desc = String(movement.descricao).trim();
      if (!desc) {
        movementErrors.push(`movimentos[${index}].descricao deve ser nao vazia`);
      } else {
        normalized.descricao = desc;
      }
    }

    const tipo = String(movement.tipo || "").toLowerCase();
    if (!SAVINGS_TYPES.includes(tipo)) {
      movementErrors.push(`movimentos[${index}].tipo deve ser "aporte" ou "resgate"`);
    } else {
      normalized.tipo = tipo;
    }

    if (movementErrors.length) {
      errors.push(...movementErrors);
      return null;
    }
    return normalized;
  };

  if (payload.movimentos !== undefined) {
    if (!Array.isArray(payload.movimentos)) {
      errors.push("movimentos deve ser uma lista");
    } else {
      const sanitized = payload.movimentos
        .map((movement, index) => validateMovement(movement || {}, index))
        .filter((item) => item !== null);
      result.movimentos = sanitized;
    }
  } else if (!partial) {
    result.movimentos = [];
  }

  if (partial && Object.keys(result).length === 0) {
    errors.push("nenhum campo enviado para poupanca");
  }

  return { errors, value: result };
}

function validateLoans(payload = {}, { partial = false, expectedYear, expectedMonth } = {}) {
  const errors = [];
  const result = {};

  if (!isPlainObject(payload)) {
    errors.push("emprestimos deve ser um objeto");
    return { errors, value: result };
  }

  const validateList = (list, key) => {
    if (!Array.isArray(list)) {
      errors.push(`${key} deve ser uma lista`);
      return [];
    }

    return list
      .map((item, index) => {
        const entryErrors = [];
        const normalized = {};

        if (!isIsoDate(item.data)) {
          entryErrors.push(`${key}[${index}].data deve estar no formato YYYY-MM-DD`);
        } else {
          normalized.data = item.data;
          if (expectedYear && expectedMonth) {
            const [yyyy, mm] = item.data.split("-");
            if (yyyy !== String(expectedYear) || mm !== String(expectedMonth)) {
              entryErrors.push(`${key}[${index}].data deve estar no mes informado`);
            }
          }
        }

        const valor = Number(item.valor);
        if (!Number.isFinite(valor)) {
          entryErrors.push(`${key}[${index}].valor deve ser numerico`);
        } else if (valor <= 0) {
          entryErrors.push(`${key}[${index}].valor deve ser maior que zero`);
        } else {
          normalized.valor = valor;
        }

        if (item.descricao === undefined) {
          entryErrors.push(`${key}[${index}].descricao obrigatoria`);
        } else {
          const desc = String(item.descricao).trim();
          if (!desc) {
            entryErrors.push(`${key}[${index}].descricao deve ser nao vazia`);
          } else {
            normalized.descricao = desc;
          }
        }

        if (entryErrors.length) {
          errors.push(...entryErrors);
          return null;
        }
        return normalized;
      })
      .filter((item) => item !== null);
  };

  if (payload.feitos !== undefined) {
    result.feitos = validateList(payload.feitos, "feitos");
  } else if (!partial) {
    result.feitos = [];
  }

  if (payload.recebidos !== undefined) {
    result.recebidos = validateList(payload.recebidos, "recebidos");
  } else if (!partial) {
    result.recebidos = [];
  }

  if (partial && Object.keys(result).length === 0) {
    errors.push("nenhum campo enviado para emprestimos");
  }

  return { errors, value: result };
}

function isEmptyRecorrencia(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (!keys.length) return true;
  return keys.every((key) => {
    if (!RECURRING_FIELDS.includes(key)) return false;
    const raw = value[key];
    if (raw === null || raw === undefined) return true;
    return typeof raw === "string" ? !raw.trim() : false;
  });
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

  if (!isPlainObject(payload)) {
    errors.push("lancamento deve ser um objeto");
    return { errors, value: result };
  }

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

  if (payload.categoria !== undefined) {
    if (payload.categoria === null || payload.categoria === "") {
      result.categoria = null;
    } else if (typeof payload.categoria !== "string") {
      errors.push("categoria deve ser string ou null");
    } else {
      const normalized = payload.categoria.trim();
      if (!normalized) {
        result.categoria = null;
      } else if (normalized.length > MAX_CATEGORY_LENGTH) {
        errors.push(`categoria deve ter no maximo ${MAX_CATEGORY_LENGTH} caracteres`);
      } else {
        result.categoria = normalized;
      }
    }
  } else if (!partial) {
    result.categoria = null;
  }

  if (payload.tags !== undefined) {
    const list = Array.isArray(payload.tags)
      ? payload.tags
      : typeof payload.tags === "string"
      ? payload.tags.split(",")
      : null;
    if (!list) {
      errors.push("tags deve ser lista de strings ou string separada por virgulas");
    } else {
      const sanitized = [];
      list.forEach((tag, index) => {
        if (sanitized.length >= MAX_TAGS) {
          return;
        }
        const normalized = String(tag ?? "")
          .trim()
          .slice(0, MAX_TAG_LENGTH);
        if (!normalized) return;
        const exists = sanitized.some(
          (current) => current.toLowerCase() === normalized.toLowerCase()
        );
        if (exists) return;
        sanitized.push(normalized);
      });
      result.tags = sanitized;
    }
  } else if (!partial) {
    result.tags = [];
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
    if (payload.recorrencia === null) {
      result.recorrencia = null;
    } else if (!allowRecorrencia) {
      if (isEmptyRecorrencia(payload.recorrencia)) {
        result.recorrencia = null;
      } else {
        errors.push("recorrencia nao permitida neste recurso");
      }
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
  validateYear,
  validateDados,
  validateCalendar,
  validateMovement,
  validateSavings,
  validateLoans,
  resolveRecurringKey,
  MAX_INSTALLMENTS,
};
