import {
  validateYear,
  validateYearMonth,
  validateDados,
  validateCalendar,
  validateMovement,
  validateSavings,
  validateLoans,
} from "./months.validator.js";
import { validateApartmentSeries } from "./apartment.validator.js";
import { validateConfig, DEFAULT_CONFIG } from "./config.validator.js";

function normalizeYear(value) {
  return String(value ?? "").padStart(4, "0");
}

function normalizeMonth(value) {
  return String(value ?? "").padStart(2, "0");
}

function validateMonthBlock(year, month, rawMonth, accumulator) {
  const path = `anos.${year}.meses.${month}`;
  if (!rawMonth || typeof rawMonth !== "object" || Array.isArray(rawMonth)) {
    accumulator.errors.push(`${path} deve ser um objeto com os blocos do mes.`);
    return;
  }

  const yearMonthErrors = validateYearMonth(year, month);
  yearMonthErrors.forEach((err) => accumulator.errors.push(`${path}: ${err}`));

  const dadosInput = {
    adiantamento: rawMonth.dados?.adiantamento ?? 0,
    pagamento: rawMonth.dados?.pagamento ?? 0,
  };
  const dadosValidation = validateDados(dadosInput, { partial: false });
  dadosValidation.errors.forEach((err) =>
    accumulator.errors.push(`${path}.dados: ${err}`)
  );

  const calendarInput = {
    pagamentos: rawMonth.calendario?.pagamentos ?? [],
    fechamento_fatura: rawMonth.calendario?.fechamento_fatura ?? null,
  };
  const calendarValidation = validateCalendar(calendarInput, {
    partial: false,
    expectedYear: year,
    expectedMonth: month,
  });
  calendarValidation.errors.forEach((err) =>
    accumulator.errors.push(`${path}.calendario: ${err}`)
  );

  const entries = Array.isArray(rawMonth.entradas_saidas)
    ? rawMonth.entradas_saidas
    : [];
  const normalizedEntries = [];
  entries.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      accumulator.errors.push(
        `${path}.entradas_saidas[${index}] deve ser um objeto`
      );
      return;
    }
    const validation = validateMovement(entry, {
      allowParcela: true,
      expectedYear: year,
      expectedMonth: month,
    });
    validation.errors.forEach((err) =>
      accumulator.errors.push(`${path}.entradas_saidas[${index}]: ${err}`)
    );
    if (!validation.errors.length) {
      normalizedEntries.push(entry);
    }
  });

  const normalizeRecurring = (list, key) => {
    const normalized = [];
    if (!Array.isArray(list)) {
      accumulator.errors.push(`${path}.${key} deve ser uma lista`);
      return normalized;
    }

    list.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        accumulator.errors.push(`${path}.${key}[${index}] deve ser um objeto`);
        return;
      }
      const validation = validateMovement(entry, {
        allowParcela: false,
        allowRecorrencia: true,
        expectedYear: year,
        expectedMonth: month,
        minYearMonth: `${year}-${month}`,
      });
      validation.errors.forEach((err) =>
        accumulator.errors.push(`${path}.${key}[${index}]: ${err}`)
      );
      if (!validation.errors.length) {
        normalized.push(entry);
      }
    });

    return normalized;
  };

  const savingsValidation = validateSavings(
    { movimentos: rawMonth.poupanca?.movimentos ?? [] },
    { expectedYear: year, expectedMonth: month }
  );
  savingsValidation.errors.forEach((err) =>
    accumulator.errors.push(`${path}.poupanca: ${err}`)
  );

  const loansValidation = validateLoans(rawMonth.emprestimos ?? {}, {
    expectedYear: year,
    expectedMonth: month,
  });
  loansValidation.errors.forEach((err) =>
    accumulator.errors.push(`${path}.emprestimos: ${err}`)
  );

  accumulator.normalized.anos[year] ??= { meses: {} };
  accumulator.normalized.anos[year].meses[month] = {
    dados: {
      adiantamento: dadosInput.adiantamento,
      pagamento: dadosInput.pagamento,
      total_liquido: Number(rawMonth.dados?.total_liquido ?? 0),
    },
    calendario: calendarValidation.value,
    entradas_saidas: normalizedEntries,
    contas_recorrentes_pre_fatura: normalizeRecurring(
      rawMonth.contas_recorrentes_pre_fatura,
      "contas_recorrentes_pre_fatura"
    ),
    contas_recorrentes_pos_fatura: normalizeRecurring(
      rawMonth.contas_recorrentes_pos_fatura,
      "contas_recorrentes_pos_fatura"
    ),
    poupanca: {
      movimentos: Array.isArray(rawMonth.poupanca?.movimentos)
        ? rawMonth.poupanca.movimentos
        : [],
    },
    emprestimos: {
      feitos: Array.isArray(rawMonth.emprestimos?.feitos)
        ? rawMonth.emprestimos.feitos
        : [],
      recebidos: Array.isArray(rawMonth.emprestimos?.recebidos)
        ? rawMonth.emprestimos.recebidos
        : [],
    },
  };
}

function buildSummary(normalized) {
  const years = Object.keys(normalized.anos || {});
  let months = 0;
  years.forEach((year) => {
    const yearMonths = normalized.anos[year]?.meses || {};
    months += Object.keys(yearMonths).length;
  });

  return { years: years.length, months };
}

function validateDbPayload(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Payload deve ser um objeto JSON na raiz.");
    return { errors, warnings, normalized: null, summary: null };
  }

  const { errors: configErrors, warnings: configWarnings, value: configValue } =
    validateConfig(payload.config, { allowMissing: true });
  errors.push(...configErrors);
  warnings.push(...configWarnings);

  const normalized = {
    config: configValue ?? { ...DEFAULT_CONFIG },
    anos: {},
    apartamento: {
      financiamento_caixa: [],
      entrada_construtora: [],
    },
  };

  if (payload.anos === undefined) {
    warnings.push("Campo 'anos' ausente; nenhum mes encontrado.");
  } else if (!payload.anos || typeof payload.anos !== "object" || Array.isArray(payload.anos)) {
    errors.push("Campo 'anos' deve ser um objeto com chaves YYYY.");
  } else {
    Object.entries(payload.anos).forEach(([yearKey, yearData]) => {
      const year = normalizeYear(yearKey);
      const yearErrors = validateYear(year);
      if (yearErrors.length) {
        yearErrors.forEach((err) =>
          errors.push(`anos.${yearKey}: ${err}`)
        );
        return;
      }

      if (!yearData || typeof yearData !== "object" || Array.isArray(yearData)) {
        errors.push(`anos.${year}: deve ser um objeto com meses.`);
        return;
      }

      if (!yearData.meses || typeof yearData.meses !== "object" || Array.isArray(yearData.meses)) {
        errors.push(`anos.${year}.meses deve ser um objeto com chaves MM.`);
        return;
      }

      Object.entries(yearData.meses).forEach(([monthKey, monthData]) => {
        const month = normalizeMonth(monthKey);
        validateMonthBlock(year, month, monthData, {
          errors,
          normalized,
        });
      });
    });
  }

  if (payload.apartamento === undefined) {
    warnings.push("Bloco 'apartamento' ausente; iniciado vazio.");
  } else if (
    !payload.apartamento ||
    typeof payload.apartamento !== "object" ||
    Array.isArray(payload.apartamento)
  ) {
    errors.push("Campo 'apartamento' deve ser um objeto.");
  } else {
    const caixa = validateApartmentSeries(
      payload.apartamento.financiamento_caixa ?? [],
      "apartamento.financiamento_caixa"
    );
    const construtora = validateApartmentSeries(
      payload.apartamento.entrada_construtora ?? [],
      "apartamento.entrada_construtora"
    );
    errors.push(...caixa.errors, ...construtora.errors);
    normalized.apartamento = {
      financiamento_caixa: caixa.value,
      entrada_construtora: construtora.value,
    };
  }

  const summary = buildSummary(normalized);
  return { errors, warnings, normalized, summary };
}

export { validateDbPayload };
