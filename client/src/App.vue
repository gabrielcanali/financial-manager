
<script setup>
import { computed, onBeforeUnmount, provide, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useFinanceStore } from "./stores/finance";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/;
const PARCELA_REGEX = /^\d+\/\d+$/;
import {
  CATEGORY_PRESETS,
  collectTags,
  guessCategory,
  normalizeCategory,
  parseTags,
  tagsToInput,
} from "./constants/categories";

const store = useFinanceStore();
const route = useRoute();

const toast = ref(null);
let toastTimeout = null;
const importWithBackup = ref(true);
const entryErrors = ref([]);
const recurringErrors = ref([]);
const savingsErrors = ref([]);
const loanErrors = ref([]);
const entryForm = reactive(defaultEntry());
const entryGenerateFuture = ref(false);
const entryCascade = ref(false);
const editingEntryId = ref(null);

const recurringForm = reactive(defaultRecurring());
const recurringGenerateFuture = ref(true);
const recurringCascade = ref(false);
const editingRecurring = ref(null);

const savingsDraft = reactive(defaultSaving());
const loanDraft = reactive(defaultLoan());
const importInput = ref(null);
const onboardingForm = reactive({
  fechamento_fatura_dia: 5,
  adiantamento_habilitado: false,
  adiantamento_dia: "",
  adiantamento_percentual: "",
});
const onboardingErrors = ref([]);
const invoiceDraft = reactive(defaultInvoice());
const invoiceErrors = ref([]);
const entryFilters = reactive(defaultEntryFilters());
const recurringFilters = reactive(defaultRecurringFilters());

const statusTone = computed(() =>
  store.error
    ? "bg-red-500/15 text-red-100"
    : store.loading
    ? "bg-amber-500/20 text-amber-100"
    : "bg-emerald-500/20 text-emerald-100"
);

const monthCards = computed(() => [
  {
    label: "Receitas",
    value: store.monthSummary?.resultado?.receitas ?? 0,
    helper: "Entradas do mes",
  },
  {
    label: "Despesas",
    value: store.monthSummary?.resultado?.despesas ?? 0,
    helper: "Saidas do mes",
  },
  {
    label: "Liquido",
    value: store.monthSummary?.resultado?.liquido ?? 0,
    helper: "Receitas - despesas",
  },
  {
    label: "Saldo disponivel",
    value: store.monthSummary?.resultado?.saldo_disponivel ?? 0,
    helper: "Inclui recorrentes e poupanca",
  },
  {
    label: "Poupanca acumulada",
    value: store.monthSummary?.poupanca?.saldo_acumulado ?? 0,
    helper: "Aportes - resgates",
  },
  {
    label: "Emprestimos acumulados",
    value: store.monthSummary?.emprestimos?.saldo_acumulado ?? 0,
    helper: "Feitos - recebidos",
  },
]);

const annualCards = computed(() => [
  {
    label: "Liquido total",
    value: store.yearSummary?.totais?.resultado?.liquido ?? 0,
    helper: `Media ${formatCurrency(store.yearSummary?.medias?.liquido ?? 0)}`,
  },
  {
    label: "Saldo disponivel",
    value: store.yearSummary?.totais?.resultado?.saldo_disponivel ?? 0,
    helper: `Media ${formatCurrency(store.yearSummary?.medias?.saldo_disponivel ?? 0)}`,
  },
  {
    label: "Poupanca final",
    value: store.yearSummary?.totais?.poupanca?.saldo_final ?? 0,
    helper: "Saldo ao fim do ano",
  },
  {
    label: "Emprestimos finais",
    value: store.yearSummary?.totais?.emprestimos?.saldo_final ?? 0,
    helper: "Posicao final do ano",
  },
]);

const apartmentChart = computed(() => {
  const serie = store.apartmentEvolution?.combinada || [];
  if (!serie.length) return { points: "", labels: [] };

  const maxValue = Math.max(...serie.map((item) => item.parcelas), 1);
  const width = 420;
  const height = 160;
  const padding = 14;
  const step =
    serie.length === 1 ? 0 : (width - padding * 2) / Math.max(serie.length - 1, 1);

  const points = serie
    .map((item, idx) => {
      const x = padding + idx * step;
      const y =
        height -
        padding -
        (item.parcelas / maxValue) * Math.max(height - padding * 2, 1);
      return `${x},${y}`;
    })
    .join(" ");

  const labels = serie.map((item, idx) => {
    const x = padding + idx * step;
    const y =
      height -
      padding -
      (item.parcelas / maxValue) * Math.max(height - padding * 2, 1);
    return { x, y, ref: item.referencia, value: item.parcelas };
  });

  return { points, labels };
});

const spendingAdvice = computed(() => {
  const available = Number(store.monthSummary?.resultado?.saldo_disponivel || 0);
  const closingDay = Number(store.config?.fechamento_fatura_dia || 30);
  const totalDays = daysInMonth(store.year, store.month);
  const now = new Date();
  const selectedMonthIndex = Number(store.month) - 1;
  const isCurrentSelection =
    now.getFullYear() === Number(store.year) && now.getMonth() === selectedMonthIndex;
  const today = isCurrentSelection ? Math.min(now.getDate(), totalDays) : 1;
  const closeAt = Math.min(Math.max(closingDay, 1), totalDays || 30);
  const daysRemaining = Math.max(closeAt - today, 1);

  return {
    available,
    perDay: Number((available / daysRemaining).toFixed(2)),
    daysRemaining,
    closesAt: closeAt,
  };
});

const nextInvoices = computed(() => {
  const pools = [
    ...(store.monthData?.contas_recorrentes_pre_fatura || []),
    ...(store.monthData?.contas_recorrentes_pos_fatura || []),
    ...(store.monthData?.entradas_saidas || []),
  ];

  return pools
    .map((item) => {
      const day = parseDayFromIso(item?.data);
      return {
        day,
        data: item?.data,
        descricao: item?.descricao || "Sem descricao",
        valor: Number(item?.valor || 0),
      };
    })
    .filter((item) => item.day && item.valor < 0)
    .sort((a, b) => a.day - b.day)
    .slice(0, 4);
});

const dailyFlowChart = computed(() => {
  const monthData = store.monthData;
  const totalDays = daysInMonth(store.year, store.month);
  if (!monthData || !totalDays) return { points: "", labels: [], min: 0, max: 0 };

  const dayTotals = new Array(totalDays).fill(0);
  const addValue = (item, value) => {
    const day = parseDayFromIso(item?.data);
    if (!day || day < 1 || day > totalDays) return;
    dayTotals[day - 1] += Number(value || 0);
  };

  (monthData.entradas_saidas || []).forEach((item) => addValue(item, item.valor));
  (monthData.contas_recorrentes_pre_fatura || []).forEach((item) =>
    addValue(item, item.valor)
  );
  (monthData.contas_recorrentes_pos_fatura || []).forEach((item) =>
    addValue(item, item.valor)
  );
  (monthData.poupanca?.movimentos || []).forEach((item) =>
    addValue(item, item.tipo === "resgate" ? -item.valor : item.valor)
  );
  (monthData.emprestimos?.feitos || []).forEach((item) =>
    addValue(item, -Number(item.valor || 0))
  );
  (monthData.emprestimos?.recebidos || []).forEach((item) =>
    addValue(item, Number(item.valor || 0))
  );

  const pointsRaw = [];
  let running = 0;
  let min = 0;
  let max = 0;
  for (let i = 0; i < dayTotals.length; i += 1) {
    running += dayTotals[i];
    min = Math.min(min, running);
    max = Math.max(max, running);
    pointsRaw.push({ day: i + 1, value: Number(running.toFixed(2)) });
  }

  const width = 420;
  const height = 160;
  const padding = 16;
  const step =
    pointsRaw.length <= 1 ? 0 : (width - padding * 2) / Math.max(pointsRaw.length - 1, 1);
  const range = max - min || 1;
  const points = pointsRaw
    .map((point) => {
      const x = padding + (point.day - 1) * step;
      const normalized = (point.value - min) / range;
      const y = height - padding - normalized * Math.max(height - padding * 2, 1);
      return `${x},${y}`;
    })
    .join(" ");

  const sliceEvery = Math.max(Math.ceil(pointsRaw.length / 5), 1);
  const labels = pointsRaw
    .filter((_, idx) => idx % sliceEvery === 0 || idx === pointsRaw.length - 1)
    .map((point) => {
      const x = padding + (point.day - 1) * step;
      const normalized = (point.value - min) / range;
      const y = height - padding - normalized * Math.max(height - padding * 2, 1);
      return {
        x,
        y,
        ref: `${String(point.day).padStart(2, "0")}/${store.month}`,
        value: point.value,
      };
    });

  return { points, labels, min: Number(min.toFixed(2)), max: Number(max.toFixed(2)) };
});

const variableStatus = computed(() => summarizeMovements(store.entries));

const recurringStatus = computed(() => {
  const pre = summarizeMovements(store.preRecurrents);
  const pos = summarizeMovements(store.postRecurrents);
  const totalExpense = pre.expense + pos.expense;
  const totalIncome = pre.income + pos.income;
  const coverage = Number(store.monthSummary?.resultado?.receitas || 0);
  const commitment = coverage
    ? Math.round((totalExpense / coverage) * 100)
    : 0;

  return {
    pre,
    pos,
    totals: {
      income: Number(totalIncome.toFixed(2)),
      expense: Number(totalExpense.toFixed(2)),
      net: Number((pre.net + pos.net).toFixed(2)),
    },
    invoiceProgress: totalExpense ? Math.round((pre.expense / totalExpense) * 100) : 0,
    coverage,
    commitment,
    closingDay: Number(store.config?.fechamento_fatura_dia || 0) || null,
  };
});

const calendarGrid = computed(() => {
  const totalDays = daysInMonth(store.year, store.month);
  if (!totalDays) return [];

  const days = Array.from({ length: totalDays }, (_, idx) => ({
    day: idx + 1,
    date: `${store.year}-${store.month}-${String(idx + 1).padStart(2, "0")}`,
    total: 0,
    items: [],
  }));

  const pushEvents = (list = [], kind) => {
    list.forEach((item) => {
      const day = parseDayFromIso(item?.data);
      if (!day || day < 1 || day > totalDays) return;
      const value = Number(item.valor || 0);
      days[day - 1].items.push({
        descricao: item.descricao || "Sem descricao",
        valor: value,
        kind,
      });
      days[day - 1].total = Number((days[day - 1].total + value).toFixed(2));
    });
  };

  pushEvents(store.entries, "Variavel");
  pushEvents(store.preRecurrents, "Recorrente (pre)");
  pushEvents(store.postRecurrents, "Recorrente (pos)");

  return days;
});

const recurringTimeline = computed(() => {
  const normalize = (list = [], period) =>
    list
      .filter((item) => isIsoDate(item?.data))
      .map((item) => ({
        period,
        data: item.data,
        descricao: item.descricao || "Recorrente",
        valor: Number(item.valor || 0),
        categoria: item.categoria || "",
        tags: item.tags || [],
      }));

  return [...normalize(store.preRecurrents, "pre"), ...normalize(store.postRecurrents, "pos")].sort(
    (a, b) => a.data.localeCompare(b.data)
  );
});

const entryAvailableTags = computed(() => collectTags(store.entries));
const recurringAvailableTags = computed(() =>
  collectTags([...(store.preRecurrents || []), ...(store.postRecurrents || [])])
);
const filteredEntries = computed(() => filterTransactions(store.entries, entryFilters));
const filteredPreRecurrents = computed(() =>
  shouldShowRecurringPeriod("pre") ? filterTransactions(store.preRecurrents, recurringFilters) : []
);
const filteredPostRecurrents = computed(() =>
  shouldShowRecurringPeriod("pos") ? filterTransactions(store.postRecurrents, recurringFilters) : []
);

const isPlainLayout = computed(() => route.meta?.layout === "plain");

watch(
  () => [store.year, store.month, store.config?.fechamento_fatura_dia],
  () => {
    resetInvoiceDraft();
  }
);

watch(
  () => entryForm.descricao,
  (desc) => {
    if (entryForm.categoria) return;
    const suggestion = guessCategory(desc);
    if (suggestion) {
      entryForm.categoria = suggestion;
    }
  }
);

watch(
  () => recurringForm.descricao,
  (desc) => {
    if (recurringForm.categoria) return;
    const suggestion = guessCategory(desc);
    if (suggestion) {
      recurringForm.categoria = suggestion;
    }
  }
);

watch(entryAvailableTags, (tags) => {
  if (entryFilters.tag !== "all" && !tags.includes(entryFilters.tag)) {
    entryFilters.tag = "all";
  }
});

watch(recurringAvailableTags, (tags) => {
  if (recurringFilters.tag !== "all" && !tags.includes(recurringFilters.tag)) {
    recurringFilters.tag = "all";
  }
});

onBeforeUnmount(() => {
  if (toastTimeout) clearTimeout(toastTimeout);
});

function defaultEntry() {
  return {
    data: `${store.year}-${store.month}-01`,
    descricao: "",
    valor: "",
    parcela: "",
    categoria: "",
    tagsInput: "",
  };
}

function defaultRecurring() {
  return {
    period: "pre",
    data: `${store.year}-${store.month}-01`,
    descricao: "",
    valor: "",
    termina_em: "",
    tipo: "mensal",
    categoria: "",
    tagsInput: "",
  };
}

function defaultEntryFilters() {
  return {
    search: "",
    category: "all",
    flow: "all",
    tag: "all",
  };
}

function defaultRecurringFilters() {
  return {
    search: "",
    category: "all",
    flow: "all",
    tag: "all",
    period: "all",
  };
}

function defaultSaving() {
  return {
    data: `${store.year}-${store.month}-05`,
    descricao: "",
    valor: "",
    tipo: "aporte",
  };
}

function defaultLoan() {
  return {
    data: `${store.year}-${store.month}-10`,
    descricao: "",
    valor: "",
    lado: "feito",
  };
}

function defaultInvoice() {
  return {
    data: computeClosingDate(),
    descricao: "Fatura do cartao",
    valor: "",
    parcela: "",
  };
}

function daysInMonth(year, month) {
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);
  if (!Number.isFinite(normalizedYear) || !Number.isFinite(normalizedMonth)) return 30;
  return new Date(normalizedYear, normalizedMonth, 0).getDate();
}

function computeClosingDate() {
  const day = Number(store.config?.fechamento_fatura_dia || 5);
  const maxDay = daysInMonth(store.year, store.month);
  const safeDay = Math.min(Math.max(day, 1), maxDay || day || 1);
  return `${store.year}-${store.month}-${String(safeDay).padStart(2, "0")}`;
}

function isIsoDate(value) {
  return ISO_DATE_REGEX.test(String(value || ""));
}

function parseDayFromIso(value) {
  if (!isIsoDate(value)) return null;
  const [, , day] = String(value).split("-");
  return Number(day);
}

function summarizeMovements(list = []) {
  return list.reduce(
    (acc, item) => {
      const value = Number(item?.valor || 0);
      if (value >= 0) {
        acc.income += value;
      } else {
        acc.expense += Math.abs(value);
      }
      acc.net += value;
      return acc;
    },
    { income: 0, expense: 0, net: 0 }
  );
}

function filterTransactions(list = [], filters = {}) {
  const entries = Array.isArray(list) ? list : [];
  const search = String(filters.search || "").trim().toLowerCase();
  const rawCategory = filters.category ?? "all";
  const category =
    typeof rawCategory === "string" ? rawCategory.toLowerCase() : rawCategory;
  const hasCategoryFilter =
    rawCategory !== undefined && rawCategory !== null && rawCategory !== "all";
  const tag = String(filters.tag || "").toLowerCase();
  const flow = filters.flow || "all";

  return entries.filter((item) => {
    const value = Number(item?.valor || 0);
    if (flow === "income" && value < 0) return false;
    if (flow === "expense" && value >= 0) return false;

    if (hasCategoryFilter) {
      const normalizedCategory = String(item?.categoria || "").toLowerCase();
      if (!category && normalizedCategory) {
        return false;
      }
      if (category && category !== "" && normalizedCategory !== category) {
        return false;
      }
    }

    if (tag && tag !== "all") {
      const normalizedTags = (item?.tags || []).map((current) =>
        String(current || "").toLowerCase()
      );
      if (!normalizedTags.includes(tag)) {
        return false;
      }
    }

    if (search) {
      const haystack = `${item?.descricao || ""} ${(item?.tags || []).join(" ")}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

function shouldShowRecurringPeriod(period) {
  return recurringFilters.period === "all" || recurringFilters.period === period;
}

function pushToast(message, tone = "info") {
  if (!message) return;
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.value = { message, tone };
  toastTimeout = setTimeout(() => {
    toast.value = null;
  }, 4200);
}

function validateEntryForm() {
  const errors = [];
  const value = Number(entryForm.valor);
  const description = String(entryForm.descricao || "").trim();
  const payload = {
    data: entryForm.data,
    descricao: description,
    valor: value,
    parcela: entryForm.parcela ? entryForm.parcela : null,
    categoria: null,
    tags: [],
  };

  if (!isIsoDate(payload.data)) {
    errors.push("Informe uma data valida (YYYY-MM-DD).");
  }

  if (!description) {
    errors.push("Descricao obrigatoria.");
  }

  if (!Number.isFinite(value)) {
    errors.push("Valor deve ser numerico.");
  } else if (value === 0) {
    errors.push("Valor nao pode ser zero.");
  } else if (Math.abs(value) > 1_000_000) {
    errors.push("Valor deve ser menor que 1.000.000 em modulo.");
  }

  if (payload.parcela) {
    if (!PARCELA_REGEX.test(payload.parcela)) {
      errors.push('Parcela deve seguir o formato "n/m".');
    } else {
      const [currentStr, totalStr] = payload.parcela.split("/");
      const current = Number(currentStr);
      const total = Number(totalStr);
      if (!Number.isInteger(current) || !Number.isInteger(total)) {
        errors.push("Parcela deve conter numeros inteiros.");
      } else if (current < 1 || total < 1 || current > total) {
        errors.push("Parcela deve ter n >= 1 e n <= m.");
      } else if (total > 36) {
        errors.push("Parcela total nao pode exceder 36.");
      }
    }
  }

  const normalizedCategory = normalizeCategory(entryForm.categoria);
  payload.categoria = normalizedCategory || null;
  const tags = parseTags(entryForm.tagsInput);
  payload.tags = tags;

  return { errors, payload };
}

function validateInvoiceDraft() {
  const errors = [];
  const description = String(invoiceDraft.descricao || "").trim();
  const rawValue = Number(invoiceDraft.valor);
  const payload = {
    data: invoiceDraft.data,
    descricao: description || "Fatura do cartao",
    valor: -Math.abs(rawValue),
    parcela: invoiceDraft.parcela ? invoiceDraft.parcela : null,
  };

  if (!isIsoDate(payload.data)) {
    errors.push("Data da fatura deve ser YYYY-MM-DD.");
  }
  if (!description) {
    errors.push("Informe uma descricao para a fatura.");
  }
  if (!Number.isFinite(rawValue) || rawValue === 0) {
    errors.push("Valor da fatura deve ser numerico e diferente de zero.");
  } else if (Math.abs(rawValue) > 1_000_000) {
    errors.push("Valor da fatura deve ser menor que 1.000.000 em modulo.");
  }
  if (payload.parcela && !PARCELA_REGEX.test(payload.parcela)) {
    errors.push('Parcela deve seguir o formato "n/m".');
  }

  return { errors, payload };
}

function validateRecurringForm() {
  const errors = [];
  const value = Number(recurringForm.valor);
  const description = String(recurringForm.descricao || "").trim();
  const payload = {
    data: recurringForm.data,
    descricao: description,
    valor: value,
    categoria: null,
    tags: [],
  };

  if (!["pre", "pos"].includes(recurringForm.period)) {
    errors.push("Selecione pre ou pos-fechamento.");
  }

  if (!isIsoDate(payload.data)) {
    errors.push("Informe uma data valida para o recorrente.");
  }

  if (!description) {
    errors.push("Descricao obrigatoria no recorrente.");
  }

  if (!Number.isFinite(value) || value === 0) {
    errors.push("Valor do recorrente deve ser numerico e diferente de zero.");
  } else if (Math.abs(value) > 1_000_000) {
    errors.push("Valor do recorrente deve ser menor que 1.000.000 em modulo.");
  }

  if (recurringForm.termina_em) {
    if (!YEAR_MONTH_REGEX.test(recurringForm.termina_em)) {
      errors.push('Termina em deve seguir o formato "YYYY-MM".');
    } else {
      payload.recorrencia = {
        termina_em: recurringForm.termina_em,
        tipo: recurringForm.tipo || undefined,
      };
    }
  } else if (recurringForm.tipo) {
    payload.recorrencia = { tipo: recurringForm.tipo };
  }

  const normalizedCategory = normalizeCategory(recurringForm.categoria);
  payload.categoria = normalizedCategory || null;
  const tags = parseTags(recurringForm.tagsInput);
  payload.tags = tags;

  return { errors, payload };
}

function validateSavingDraft() {
  const errors = [];
  const value = Number(savingsDraft.valor);
  const description = String(savingsDraft.descricao || "").trim();
  const movement = {
    data: savingsDraft.data,
    descricao: description,
    valor: value,
    tipo: savingsDraft.tipo,
  };

  if (!isIsoDate(movement.data)) {
    errors.push("Data da poupanca deve ser YYYY-MM-DD.");
  }
  if (!description) errors.push("Descricao na poupanca obrigatoria.");
  if (!Number.isFinite(value) || value <= 0) {
    errors.push("Valor da poupanca deve ser maior que zero.");
  }

  return { errors, movement };
}

function validateLoanDraft() {
  const errors = [];
  const value = Number(loanDraft.valor);
  const description = String(loanDraft.descricao || "").trim();
  const entry = {
    data: loanDraft.data,
    descricao: description,
    valor: value,
  };

  if (!isIsoDate(entry.data)) errors.push("Data do emprestimo deve ser YYYY-MM-DD.");
  if (!description) errors.push("Descricao do emprestimo obrigatoria.");
  if (!Number.isFinite(value) || value <= 0) {
    errors.push("Valor do emprestimo deve ser maior que zero.");
  }

  return { errors, entry };
}

function validateOnboardingConfig() {
  const errors = [];
  const closingDay = Number(onboardingForm.fechamento_fatura_dia);
  const config = {
    fechamento_fatura_dia: closingDay,
    adiantamento_salario: {
      habilitado: onboardingForm.adiantamento_habilitado,
      dia: null,
      percentual: null,
    },
  };

  if (!Number.isFinite(closingDay) || closingDay < 1 || closingDay > 31) {
    errors.push("Informe um dia de fechamento entre 1 e 31.");
  }

  if (onboardingForm.adiantamento_habilitado) {
    const rawDay = onboardingForm.adiantamento_dia;
    const rawPercent = onboardingForm.adiantamento_percentual;
    const day = Number(rawDay);
    const percent = Number(rawPercent);

    if (!Number.isFinite(day) || day < 1 || day > 31) {
      errors.push("Dia do adiantamento deve ficar entre 1 e 31.");
    } else {
      config.adiantamento_salario.dia = day;
    }

    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      errors.push("Percentual adiantado deve ser maior que 0 e ate 100.");
    } else {
      config.adiantamento_salario.percentual = percent;
    }
  }

  return { errors, config };
}

function formatCurrency(value) {
  const safe = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(safe);
}

async function handleYearChange() {
  store.setYear(store.year);
  await store.fetchYearSummary(store.year);
}

async function handleMonthChange() {
  store.setMonth(store.month);
  await store.fetchMonth(store.month);
}

async function handleCreateBase() {
  const { errors, config } = validateOnboardingConfig();
  onboardingErrors.value = errors;
  if (errors.length) return;

  try {
    await store.createBase(config);
  } catch (err) {
    onboardingErrors.value = err.payload?.errors || [err.message];
  }
}

async function submitInvoice() {
  const { errors, payload } = validateInvoiceDraft();
  invoiceErrors.value = errors;
  if (errors.length) {
    pushToast("Ajuste a fatura rapida antes de salvar.", "warn");
    return;
  }
  try {
    await store.createEntry(payload);
    resetInvoiceDraft();
    pushToast("Fatura registrada no mes.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

async function submitEntry() {
  const { errors, payload } = validateEntryForm();
  entryErrors.value = errors;
  if (errors.length) {
    pushToast("Revise o lancamento antes de salvar.", "warn");
    return;
  }
  const isEditing = Boolean(editingEntryId.value);
  try {
    if (editingEntryId.value) {
      await store.updateEntry(editingEntryId.value, payload, {
        cascade: entryCascade.value,
      });
    } else {
      await store.createEntry(payload, {
        generateFuture: entryGenerateFuture.value,
      });
    }
    resetEntryForm();
    pushToast(isEditing ? "Lancamento atualizado." : "Lancamento criado.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

function selectEntry(entry) {
  editingEntryId.value = entry.id || null;
  Object.assign(entryForm, {
    data: entry.data || "",
    descricao: entry.descricao || "",
    valor: entry.valor ?? "",
    parcela: entry.parcela || "",
    categoria: entry.categoria || "",
    tagsInput: tagsToInput(entry.tags || []),
  });
}

async function removeEntry(entry) {
  if (!entry.id) return;
  try {
    await store.deleteEntry(entry.id);
    if (editingEntryId.value === entry.id) resetEntryForm();
    pushToast("Lancamento removido.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

function resetEntryForm() {
  Object.assign(entryForm, defaultEntry());
  editingEntryId.value = null;
  entryGenerateFuture.value = false;
  entryCascade.value = false;
  entryErrors.value = [];
}

function resetEntryFilters() {
  Object.assign(entryFilters, defaultEntryFilters());
}

function resetInvoiceDraft() {
  Object.assign(invoiceDraft, defaultInvoice());
  invoiceErrors.value = [];
}

async function submitRecurring() {
  const { errors, payload } = validateRecurringForm();
  recurringErrors.value = errors;
  if (errors.length) {
    pushToast("Revise o recorrente antes de salvar.", "warn");
    return;
  }

  const isEditing = Boolean(editingRecurring.value);

  try {
    if (editingRecurring.value) {
      await store.updateRecurring(
        editingRecurring.value.id,
        payload,
        {
          period: editingRecurring.value.period,
          cascade: recurringCascade.value,
        }
      );
    } else {
      await store.createRecurring(payload, {
        period: recurringForm.period,
        generateFuture: recurringGenerateFuture.value,
      });
    }
    resetRecurringForm();
    pushToast(isEditing ? "Recorrente atualizado." : "Recorrente criado.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

function selectRecurring(recurring, period) {
  editingRecurring.value = { id: recurring.id, period };
  Object.assign(recurringForm, {
    period,
    data: recurring.data || "",
    descricao: recurring.descricao || "",
    valor: recurring.valor ?? "",
    termina_em: recurring.recorrencia?.termina_em || "",
    tipo: recurring.recorrencia?.tipo || "mensal",
    categoria: recurring.categoria || "",
    tagsInput: tagsToInput(recurring.tags || []),
  });
}

async function removeRecurring(recurring, period) {
  if (!recurring.id) return;
  try {
    await store.deleteRecurring(recurring.id, { period });
    if (editingRecurring.value?.id === recurring.id) resetRecurringForm();
    pushToast("Recorrente removido.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

function resetRecurringForm() {
  Object.assign(recurringForm, defaultRecurring());
  editingRecurring.value = null;
  recurringGenerateFuture.value = true;
  recurringCascade.value = false;
  recurringErrors.value = [];
}

function resetRecurringFilters() {
  Object.assign(recurringFilters, defaultRecurringFilters());
}

async function submitSaving() {
  const { errors, movement } = validateSavingDraft();
  savingsErrors.value = errors;
  if (errors.length) {
    pushToast("Corrija a poupanca antes de salvar.", "warn");
    return;
  }
  const movements = [...store.savingsMovements, movement];
  try {
    await store.saveSavings(movements);
    Object.assign(savingsDraft, defaultSaving());
    savingsErrors.value = [];
    pushToast("Movimento de poupanca salvo.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

async function removeSaving(index) {
  const movements = [...store.savingsMovements];
  movements.splice(index, 1);
  try {
    await store.saveSavings(movements);
    pushToast("Movimento removido.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

async function submitLoan() {
  const { errors, entry } = validateLoanDraft();
  loanErrors.value = errors;
  if (errors.length) {
    pushToast("Corrija os campos do emprestimo.", "warn");
    return;
  }

  const feitos = [...store.loansMade];
  const recebidos = [...store.loansReceived];
  const side = loanDraft.lado === "recebido" ? "recebido" : "feito";

  if (side === "feito") {
    feitos.push(entry);
  } else {
    recebidos.push(entry);
  }

  try {
    await store.saveLoans({ feitos, recebidos });
    Object.assign(loanDraft, defaultLoan());
    loanErrors.value = [];
    pushToast("Emprestimo registrado.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

async function removeLoan(index, lado) {
  const feitos = [...store.loansMade];
  const recebidos = [...store.loansReceived];
  if (lado === "feito") {
    feitos.splice(index, 1);
  } else {
    recebidos.splice(index, 1);
  }
  try {
    await store.saveLoans({ feitos, recebidos });
    pushToast("Emprestimo removido.", "success");
  } catch (err) {
    store.error = err.message;
    pushToast(err.message, "error");
  }
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  store.parseImportFile(file);
}

async function runImportToApi() {
  store.error = "";
  await store.sendImportToApi({ backup: importWithBackup.value });
  if (store.error) {
    pushToast(store.error, "error");
  } else {
    pushToast(store.message || "Import concluida.", "success");
  }
}

const ui = {
  store,
  toast,
  formatCurrency,
  statusTone,
  monthCards,
  annualCards,
  apartmentChart,
  dailyFlowChart,
  variableStatus,
  recurringStatus,
  calendarGrid,
  recurringTimeline,
  spendingAdvice,
  nextInvoices,
  categoryPresets: CATEGORY_PRESETS,
  entryFilters,
  recurringFilters,
  entryAvailableTags,
  recurringAvailableTags,
  filteredEntries,
  filteredPreRecurrents,
  filteredPostRecurrents,
  importWithBackup,
  importInput,
  onboardingForm,
  onboardingErrors,
  entryForm,
  entryGenerateFuture,
  entryCascade,
  entryErrors,
  recurringForm,
  recurringGenerateFuture,
  recurringCascade,
  recurringErrors,
  savingsDraft,
  savingsErrors,
  loanDraft,
  loanErrors,
  invoiceDraft,
  invoiceErrors,
  editingEntryId,
  editingRecurring,
  pushToast,
  handleYearChange,
  handleMonthChange,
  handleCreateBase,
  submitInvoice,
  resetInvoiceDraft,
  submitEntry,
  selectEntry,
  removeEntry,
  resetEntryForm,
  resetEntryFilters,
  submitRecurring,
  selectRecurring,
  removeRecurring,
  resetRecurringForm,
  resetRecurringFilters,
  submitSaving,
  removeSaving,
  submitLoan,
  removeLoan,
  handleImport,
  runImportToApi,
};

provide("financeUi", ui);
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-10 top-14 h-36 w-36 rounded-full bg-accent/20 blur-3xl"></div>
      <div class="absolute right-10 top-0 h-32 w-32 rounded-full bg-accentSoft/25 blur-3xl"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(148,163,184,0.07),transparent_20%),radial-gradient(circle_at_80%_10%,rgba(94,234,212,0.08),transparent_22%)]"></div>
    </div>

    <div
      v-if="toast"
      class="fixed right-6 top-6 z-50 max-w-xs rounded-xl border border-white/10 px-4 py-3 shadow-xl backdrop-blur"
      :class="toast.tone === 'error'
        ? 'bg-rose-600/30 text-rose-50'
        : toast.tone === 'success'
        ? 'bg-emerald-600/25 text-emerald-50'
        : 'bg-slate-900/80 text-slate-100'"
    >
      <p class="text-sm font-semibold">{{ toast.message }}</p>
    </div>

    <div class="relative mx-auto flex min-h-screen max-w-7xl gap-6 px-6 py-8">
      <aside
        v-if="!isPlainLayout"
        class="glass-panel sticky top-6 h-fit w-64 space-y-4 p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-slate-50">financial-manager</p>
            <p class="text-xs uppercase text-slate-400">Front V2</p>
          </div>
          <span class="pill bg-white/5 text-xs">v2</span>
        </div>
        <nav class="space-y-2 text-sm text-slate-200">
          <RouterLink
            to="/"
            class="flex items-center justify-between rounded-lg px-3 py-2 transition"
            :class="route.name === 'dashboard' ? 'bg-white/10 text-slate-50' : 'hover:bg-white/5'"
          >
            <span>Dashboard</span>
            <span class="text-[10px] uppercase text-slate-400">home</span>
          </RouterLink>
          <RouterLink
            to="/monthly"
            class="flex items-center justify-between rounded-lg px-3 py-2 transition"
            :class="route.name === 'monthly' ? 'bg-white/10 text-slate-50' : 'hover:bg-white/5'"
          >
            <span>Mensal</span>
            <span class="text-[10px] uppercase text-slate-400">crud</span>
          </RouterLink>
          <RouterLink
            to="/recurrents"
            class="flex items-center justify-between rounded-lg px-3 py-2 transition"
            :class="route.name === 'recurrents' ? 'bg-white/10 text-slate-50' : 'hover:bg-white/5'"
          >
            <span>Recorrentes</span>
            <span class="text-[10px] uppercase text-slate-400">series</span>
          </RouterLink>
          <RouterLink
            to="/loans"
            class="flex items-center justify-between rounded-lg px-3 py-2 transition"
            :class="route.name === 'loans' ? 'bg-white/10 text-slate-50' : 'hover:bg-white/5'"
          >
            <span>Emprestimos</span>
            <span class="text-[10px] uppercase text-slate-400">saldo</span>
          </RouterLink>
          <RouterLink
            to="/apartment"
            class="flex items-center justify-between rounded-lg px-3 py-2 transition"
            :class="route.name === 'apartment' ? 'bg-white/10 text-slate-50' : 'hover:bg-white/5'"
          >
            <span>Meu apartamento</span>
            <span class="text-[10px] uppercase text-slate-400">serie</span>
          </RouterLink>
        </nav>
        <div class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <p class="font-semibold text-slate-100">Status</p>
          <p
            class="mt-1 text-sm font-semibold"
            :class="store.hasBase ? 'text-emerald-200' : 'text-amber-200'"
          >
            {{ store.hasBase ? "JSON carregado" : "Aguardando base" }}
          </p>
          <p class="text-slate-400">{{ store.message }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span :class="['pill text-[11px]', statusTone]">
              {{ store.error ? 'Com alerta' : store.loading ? 'Sincronizando' : 'Pronto' }}
            </span>
            <button class="btn px-3 py-2 text-xs" @click="store.refreshAll" :disabled="store.loading">
              Recarregar
            </button>
          </div>
        </div>
      </aside>

      <main class="relative flex-1 space-y-4">
        <div
          v-if="!store.statusLoaded"
          class="glass-panel flex items-center justify-between p-5"
        >
          <div>
            <p class="text-sm uppercase text-slate-400">Inicializando</p>
            <p class="text-lg font-semibold text-slate-50">Carregando status do JSON...</p>
            <p class="text-xs text-slate-400">{{ store.message }}</p>
          </div>
          <span class="pill bg-white/5">Aguardando API</span>
        </div>

        <template v-else>
          <header
            v-if="!isPlainLayout"
            class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5"
          >
            <div>
              <p class="text-xs uppercase text-slate-400">Dashboard V2</p>
              <h1 class="text-xl font-semibold text-slate-50">Financial manager</h1>
              <p class="text-xs text-slate-400">
                Navegue entre dashboard, visualizacao mensal, recorrentes, apartamento e emprestimos.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex gap-3 text-sm text-slate-200">
                <div class="space-y-1">
                  <p class="text-xs uppercase text-slate-400">Ano</p>
                  <input
                    v-model="store.year"
                    type="text"
                    class="w-24 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
                    @change="handleYearChange"
                  />
                </div>
                <div class="space-y-1">
                  <p class="text-xs uppercase text-slate-400">Mes</p>
                  <select
                    v-model="store.month"
                    class="w-24 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
                    @change="handleMonthChange"
                  >
                    <option v-for="month in store.monthsAvailable" :key="month" :value="month">
                      {{ month }}
                    </option>
                    <option v-if="!store.monthsAvailable.includes(store.month)" :value="store.month">
                      {{ store.month }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="pill bg-white/5">Status: {{ store.message }}</span>
                <span :class="['pill', statusTone]">
                  {{ store.error ? 'Com alerta' : store.loading ? 'Sincronizando' : 'Pronto' }}
                </span>
              </div>
            </div>
          </header>

          <RouterView />
        </template>
      </main>
    </div>
  </div>
</template>
