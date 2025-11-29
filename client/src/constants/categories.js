const CATEGORY_PRESETS = [
  {
    value: "moradia",
    label: "Moradia",
    color: "emerald",
    keywords: ["aluguel", "condominio", "iptu", "luz", "agua", "energia"],
  },
  {
    value: "alimentacao",
    label: "Alimentacao",
    color: "amber",
    keywords: ["mercado", "supermercado", "ifood", "restaurante", "comida", "refeicao"],
  },
  {
    value: "transporte",
    label: "Transporte",
    color: "sky",
    keywords: ["uber", "combustivel", "gasolina", "onibus", "metrô", "metr�", "metro", "estacionamento"],
  },
  {
    value: "saude",
    label: "Saude",
    color: "rose",
    keywords: ["consulta", "medico", "plano", "farmacia", "remedio", "exame"],
  },
  {
    value: "lazer",
    label: "Lazer",
    color: "violet",
    keywords: ["netflix", "spotify", "cinema", "viagem", "passeio", "show"],
  },
  {
    value: "educacao",
    label: "Educacao",
    color: "cyan",
    keywords: ["curso", "faculdade", "escola", "livro", "assinatura"],
  },
  {
    value: "servicos",
    label: "Servicos",
    color: "indigo",
    keywords: ["internet", "claro", "vivo", "tim", "spotify", "cloud", "alura"],
  },
  {
    value: "investimentos",
    label: "Investimentos",
    color: "lime",
    keywords: ["aporte", "acao", "tesouro", "cdb", "poupanca"],
  },
  {
    value: "outros",
    label: "Outros",
    color: "slate",
    keywords: [],
  },
];

const CATEGORY_COLOR_MAP = {
  emerald: {
    badge: "bg-emerald-500/15 text-emerald-100 border border-emerald-500/30",
    dot: "bg-emerald-300",
  },
  amber: {
    badge: "bg-amber-500/15 text-amber-100 border border-amber-500/30",
    dot: "bg-amber-300",
  },
  sky: {
    badge: "bg-sky-500/15 text-sky-100 border border-sky-500/30",
    dot: "bg-sky-300",
  },
  rose: {
    badge: "bg-rose-500/15 text-rose-100 border border-rose-500/30",
    dot: "bg-rose-300",
  },
  violet: {
    badge: "bg-violet-500/15 text-violet-100 border border-violet-500/30",
    dot: "bg-violet-300",
  },
  cyan: {
    badge: "bg-cyan-500/15 text-cyan-100 border border-cyan-500/30",
    dot: "bg-cyan-300",
  },
  indigo: {
    badge: "bg-indigo-500/15 text-indigo-100 border border-indigo-500/30",
    dot: "bg-indigo-300",
  },
  lime: {
    badge: "bg-lime-500/15 text-lime-100 border border-lime-500/30",
    dot: "bg-lime-300",
  },
  slate: {
    badge: "bg-slate-500/15 text-slate-100 border border-slate-500/30",
    dot: "bg-slate-300",
  },
};

const DEFAULT_CATEGORY_META = {
  value: null,
  label: "Sem categoria",
  classes: "bg-white/10 text-slate-200 border border-white/15",
  dotClass: "bg-slate-500",
};

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;

const keywordIndex = CATEGORY_PRESETS.flatMap((preset) =>
  preset.keywords.map((kw) => ({
    keyword: kw.toLowerCase(),
    category: preset.value,
  }))
);

function normalizeCategory(value) {
  if (!value && value !== 0) return "";
  const normalized = String(value).trim();
  return normalized.slice(0, 40);
}

function parseTags(rawValue) {
  const list = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === "string"
    ? rawValue.split(/[,;#]/)
    : [];

  const sanitized = [];
  list.forEach((tag) => {
    if (sanitized.length >= MAX_TAGS) return;
    const normalized = String(tag ?? "")
      .trim()
      .slice(0, MAX_TAG_LENGTH);
    if (!normalized) return;
    const exists = sanitized.some(
      (current) => current.toLowerCase() === normalized.toLowerCase()
    );
    if (!exists) sanitized.push(normalized);
  });
  return sanitized;
}

function tagsToInput(tokens = []) {
  if (!Array.isArray(tokens) || !tokens.length) return "";
  return tokens.join(", ");
}

function getCategoryMeta(value) {
  const normalized = String(value || "").toLowerCase();
  if (!normalized) return DEFAULT_CATEGORY_META;
  const preset = CATEGORY_PRESETS.find((item) => item.value === normalized);
  if (preset) {
    const palette = CATEGORY_COLOR_MAP[preset.color] || CATEGORY_COLOR_MAP.slate;
    return {
      value: preset.value,
      label: preset.label,
      classes: palette.badge,
      dotClass: palette.dot,
    };
  }
  const palette = CATEGORY_COLOR_MAP.slate;
  return {
    value: normalized,
    label: value || DEFAULT_CATEGORY_META.label,
    classes: palette.badge,
    dotClass: palette.dot,
  };
}

function guessCategory(description = "") {
  const normalized = String(description || "").toLowerCase();
  if (!normalized) return "";
  const match = keywordIndex.find(({ keyword }) => normalized.includes(keyword));
  return match?.category || "";
}

function collectTags(items = []) {
  const unique = new Map();
  items.forEach((item) => {
    (item?.tags || []).forEach((tag) => {
      const key = String(tag).toLowerCase();
      if (!key || unique.has(key)) return;
      unique.set(key, tag);
    });
  });
  return Array.from(unique.values());
}

export {
  CATEGORY_PRESETS,
  DEFAULT_CATEGORY_META,
  getCategoryMeta,
  guessCategory,
  normalizeCategory,
  parseTags,
  tagsToInput,
  collectTags,
  MAX_TAGS,
};
