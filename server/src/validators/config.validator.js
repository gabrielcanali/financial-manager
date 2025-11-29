const DAY_MIN = 1;
const DAY_MAX = 31;
const PERCENT_MAX = 100;

const DEFAULT_CONFIG = {
  fechamento_fatura_dia: 5,
  adiantamento_salario: {
    habilitado: false,
    dia: null,
    percentual: null,
  },
};

function normalizeDay(value) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : null;
}

function validateConfig(payload, { allowMissing = false } = {}) {
  const errors = [];
  const warnings = [];

  if (payload === undefined) {
    if (allowMissing) {
      warnings.push(
        "Bloco de configuracao ausente; usando defaults (fechamento_fatura_dia=5, adiantamento desabilitado)."
      );
      return { errors, warnings, value: { ...DEFAULT_CONFIG } };
    }
    errors.push("config obrigatorio com fechamento_fatura_dia e adiantamento_salario.");
    return { errors, warnings, value: null };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("config deve ser um objeto.");
    return { errors, warnings, value: null };
  }

  const normalized = {
    fechamento_fatura_dia:
      payload.fechamento_fatura_dia ?? DEFAULT_CONFIG.fechamento_fatura_dia,
    adiantamento_salario: {
      ...DEFAULT_CONFIG.adiantamento_salario,
      ...(payload.adiantamento_salario || {}),
    },
  };

  const closingDay = normalizeDay(normalized.fechamento_fatura_dia);
  if (closingDay === null) {
    errors.push("config.fechamento_fatura_dia deve ser numerico.");
  } else if (closingDay < DAY_MIN || closingDay > DAY_MAX) {
    errors.push("config.fechamento_fatura_dia deve estar entre 1 e 31.");
  } else {
    normalized.fechamento_fatura_dia = closingDay;
  }

  const salario = normalized.adiantamento_salario;
  if (salario.habilitado !== undefined) {
    salario.habilitado = Boolean(salario.habilitado);
  } else {
    salario.habilitado = false;
  }

  const dia = salario.dia === null ? null : normalizeDay(salario.dia);
  const percentual =
    salario.percentual === null ? null : Number(salario.percentual);

  if (salario.habilitado) {
    if (dia === null) {
      errors.push("config.adiantamento_salario.dia obrigatorio quando habilitado.");
    } else if (dia < DAY_MIN || dia > DAY_MAX) {
      errors.push("config.adiantamento_salario.dia deve estar entre 1 e 31.");
    } else {
      salario.dia = dia;
    }

    if (!Number.isFinite(percentual)) {
      errors.push("config.adiantamento_salario.percentual obrigatorio e numerico quando habilitado.");
    } else if (percentual <= 0 || percentual > PERCENT_MAX) {
      errors.push(
        `config.adiantamento_salario.percentual deve ser maior que 0 e ate ${PERCENT_MAX}.`
      );
    } else {
      salario.percentual = Number(percentual.toFixed(2));
    }
  } else {
    if (dia !== null && (dia < DAY_MIN || dia > DAY_MAX)) {
      errors.push("config.adiantamento_salario.dia deve estar entre 1 e 31 quando informado.");
    } else {
      salario.dia = dia;
    }

    if (percentual !== null) {
      if (!Number.isFinite(percentual)) {
        errors.push("config.adiantamento_salario.percentual deve ser numerico.");
      } else if (percentual <= 0 || percentual > PERCENT_MAX) {
        errors.push(
          `config.adiantamento_salario.percentual deve ser maior que 0 e ate ${PERCENT_MAX} quando informado.`
        );
      } else {
        salario.percentual = Number(percentual.toFixed(2));
      }
    }
  }

  return { errors, warnings, value: normalized };
}

export { validateConfig, DEFAULT_CONFIG };

