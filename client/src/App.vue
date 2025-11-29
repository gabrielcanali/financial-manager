
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useFinanceStore } from "./stores/finance";

const store = useFinanceStore();

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

onMounted(() => {
  store.bootstrap();
});

function defaultEntry() {
  return {
    data: `${store.year}-${store.month}-01`,
    descricao: "",
    valor: "",
    parcela: "",
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

async function submitEntry() {
  const payload = {
    data: entryForm.data,
    descricao: entryForm.descricao,
    valor: Number(entryForm.valor),
    parcela: entryForm.parcela ? entryForm.parcela : null,
  };
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
  } catch (err) {
    store.error = err.message;
  }
}

function selectEntry(entry) {
  editingEntryId.value = entry.id || null;
  Object.assign(entryForm, {
    data: entry.data || "",
    descricao: entry.descricao || "",
    valor: entry.valor ?? "",
    parcela: entry.parcela || "",
  });
}

async function removeEntry(entry) {
  if (!entry.id) return;
  await store.deleteEntry(entry.id);
  if (editingEntryId.value === entry.id) resetEntryForm();
}

function resetEntryForm() {
  Object.assign(entryForm, defaultEntry());
  editingEntryId.value = null;
  entryGenerateFuture.value = false;
  entryCascade.value = false;
}

async function submitRecurring() {
  const payload = {
    data: recurringForm.data,
    descricao: recurringForm.descricao,
    valor: Number(recurringForm.valor),
  };

  if (recurringForm.termina_em || recurringForm.tipo) {
    payload.recorrencia = {
      termina_em: recurringForm.termina_em || null,
      tipo: recurringForm.tipo || undefined,
    };
  }

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
  } catch (err) {
    store.error = err.message;
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
  });
}

async function removeRecurring(recurring, period) {
  if (!recurring.id) return;
  await store.deleteRecurring(recurring.id, { period });
  if (editingRecurring.value?.id === recurring.id) resetRecurringForm();
}

function resetRecurringForm() {
  Object.assign(recurringForm, defaultRecurring());
  editingRecurring.value = null;
  recurringGenerateFuture.value = true;
  recurringCascade.value = false;
}

async function submitSaving() {
  const movements = [
    ...store.savingsMovements,
    {
      data: savingsDraft.data,
      descricao: savingsDraft.descricao,
      valor: Number(savingsDraft.valor),
      tipo: savingsDraft.tipo,
    },
  ];
  await store.saveSavings(movements);
  Object.assign(savingsDraft, defaultSaving());
}

async function removeSaving(index) {
  const movements = [...store.savingsMovements];
  movements.splice(index, 1);
  await store.saveSavings(movements);
}

async function submitLoan() {
  const feitos = [...store.loansMade];
  const recebidos = [...store.loansReceived];
  const entry = {
    data: loanDraft.data,
    descricao: loanDraft.descricao,
    valor: Number(loanDraft.valor),
  };

  if (loanDraft.lado === "feito") {
    feitos.push(entry);
  } else {
    recebidos.push(entry);
  }

  await store.saveLoans({ feitos, recebidos });
  Object.assign(loanDraft, defaultLoan());
}

async function removeLoan(index, lado) {
  const feitos = [...store.loansMade];
  const recebidos = [...store.loansReceived];
  if (lado === "feito") {
    feitos.splice(index, 1);
  } else {
    recebidos.splice(index, 1);
  }
  await store.saveLoans({ feitos, recebidos });
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  store.parseImportFile(file);
}
</script>

<template>
  <div class="relative overflow-hidden">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-20 top-14 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div class="absolute right-10 top-0 h-36 w-36 rounded-full bg-accentSoft/20 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(148,163,184,0.07),transparent_20%),radial-gradient(circle_at_80%_10%,rgba(94,234,212,0.08),transparent_22%)]" />
    </div>

    <div class="relative mx-auto max-w-6xl px-6 py-8 space-y-8">
      <header class="glass-panel flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-accent to-accentSoft shadow-card" />
          <div>
            <p class="text-lg font-semibold">Financial Manager</p>
            <p class="text-xs text-slate-400">Vue + Vite + Tailwind + Pinia</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn" @click="store.refreshAll" :disabled="store.loading">
            Recarregar
          </button>
          <button class="btn" @click="store.exportSnapshot" :disabled="store.loading">
            Snapshot local
          </button>
          <button class="btn" @click="store.exportFromApi" :disabled="store.adminLoading">
            Export API
          </button>
          <button class="btn" @click="store.backupServer" :disabled="store.adminLoading">
            Backup servidor
          </button>
        </div>
      </header>

      <section class="glass-panel space-y-4 p-5">
        <div class="grid gap-3 md:grid-cols-4 md:items-end">
          <div>
            <p class="text-xs uppercase text-slate-400">Ano</p>
            <input
              v-model="store.year"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-semibold outline-none focus:border-accent/60"
              maxlength="4"
              @change="handleYearChange"
            />
          </div>
          <div>
            <p class="text-xs uppercase text-slate-400">Mes</p>
            <select
              v-model="store.month"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm font-semibold outline-none focus:border-accent/60"
              @change="handleMonthChange"
            >
              <option
                v-for="m in store.monthsAvailable.length ? store.monthsAvailable : Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))"
                :key="m"
                :value="m"
              >
                {{ m }}
              </option>
            </select>
          </div>
          <div class="md:col-span-2">
            <p class="text-xs uppercase text-slate-400">Status</p>
            <div :class="['pill', statusTone]">
              <span v-if="store.error">Erro: {{ store.error }}</span>
              <span v-else-if="store.loading">Sincronizando...</span>
              <span v-else>OK</span>
              <span class="text-slate-300">{{ store.message }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-slate-400">Meses disponiveis:</span>
          <span
            v-for="m in store.monthsAvailable"
            :key="m"
            :class="['pill', m === store.month ? 'border-accent/50 text-accent' : '']"
          >
            {{ store.year }}-{{ m }}
          </span>
          <span v-if="!store.monthsAvailable.length" class="text-sm text-slate-500">
            Nenhum mes encontrado para {{ store.year }}.
          </span>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm uppercase text-slate-400">Resumo do mes</p>
            <span class="pill bg-white/5"> {{ store.year }}-{{ store.month }} </span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="card in monthCards"
              :key="card.label"
              class="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4 shadow-card"
            >
              <p class="text-xs uppercase text-slate-400">{{ card.label }}</p>
              <p class="text-2xl font-bold text-slate-50">
                {{ formatCurrency(card.value) }}
              </p>
              <p class="text-xs text-slate-500">{{ card.helper }}</p>
            </div>
          </div>
        </div>

        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm uppercase text-slate-400">Resumo anual</p>
            <span class="pill bg-white/5">
              {{ store.yearSummary?.meses?.length || 0 }} meses carregados
            </span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="card in annualCards"
              :key="card.label"
              class="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4 shadow-card"
            >
              <p class="text-xs uppercase text-slate-400">{{ card.label }}</p>
              <p class="text-2xl font-bold text-slate-50">
                {{ formatCurrency(card.value) }}
              </p>
              <p class="text-xs text-slate-500">{{ card.helper }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="glass-panel p-5">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">Entradas e saídas</p>
              <p class="text-xs text-slate-400">
                Total: {{ formatCurrency(store.sum(store.entries)) }}
              </p>
            </div>
            <span class="pill bg-white/5">CRUD de variáveis</span>
          </div>
          <div class="overflow-hidden rounded-xl border border-white/5">
            <table class="w-full text-sm">
              <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="px-3 py-2">Data</th>
                  <th class="px-3 py-2">Descrição</th>
                  <th class="px-3 py-2">Valor</th>
                  <th class="px-3 py-2">Parcela</th>
                  <th class="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in store.entries"
                  :key="entry.id || entry.descricao + entry.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2 text-slate-200">{{ entry.data }}</td>
                  <td class="px-3 py-2 text-slate-100">{{ entry.descricao }}</td>
                  <td
                    class="px-3 py-2 font-semibold"
                    :class="entry.valor >= 0 ? 'text-emerald-300' : 'text-rose-300'"
                  >
                    {{ formatCurrency(entry.valor) }}
                  </td>
                  <td class="px-3 py-2 text-slate-300">{{ entry.parcela || "-" }}</td>
                  <td class="px-3 py-2">
                    <div class="flex gap-2">
                      <button class="btn px-3 py-1 text-xs" @click="selectEntry(entry)">
                        Editar
                      </button>
                      <button
                        class="btn px-3 py-1 text-xs"
                        @click="removeEntry(entry)"
                        :disabled="store.loading"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!store.entries.length">
                  <td colspan="5" class="px-3 py-6 text-center text-slate-500">
                    Sem movimentações variáveis para este mês.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-panel p-5">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">Recorrentes</p>
              <p class="text-xs text-slate-400">
                Pré: {{ store.preRecurrents.length }} | Pós: {{ store.postRecurrents.length }}
              </p>
            </div>
            <span class="pill bg-white/5">CRUD recorrentes</span>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs uppercase text-slate-400">Até fechamento</p>
              <div class="overflow-hidden rounded-xl border border-white/5">
                <table class="w-full text-sm">
                  <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th class="px-3 py-2">Data</th>
                      <th class="px-3 py-2">Descrição</th>
                      <th class="px-3 py-2">Valor</th>
                      <th class="px-3 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in store.preRecurrents"
                      :key="item.id || item.descricao + item.data"
                      class="odd:bg-white/0 even:bg-white/5"
                    >
                      <td class="px-3 py-2">{{ item.data }}</td>
                      <td class="px-3 py-2">{{ item.descricao }}</td>
                      <td class="px-3 py-2 font-semibold text-emerald-200">
                        {{ formatCurrency(item.valor) }}
                      </td>
                      <td class="px-3 py-2">
                        <div class="flex gap-2">
                          <button class="btn px-3 py-1 text-xs" @click="selectRecurring(item, 'pre')">
                            Editar
                          </button>
                          <button
                            class="btn px-3 py-1 text-xs"
                            @click="removeRecurring(item, 'pre')"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!store.preRecurrents.length">
                      <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                        Nenhum recorrente antes do fechamento.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p class="text-xs uppercase text-slate-400">Após fechamento</p>
              <div class="overflow-hidden rounded-xl border border-white/5">
                <table class="w-full text-sm">
                  <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th class="px-3 py-2">Data</th>
                      <th class="px-3 py-2">Descrição</th>
                      <th class="px-3 py-2">Valor</th>
                      <th class="px-3 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in store.postRecurrents"
                      :key="item.id || item.descricao + item.data"
                      class="odd:bg-white/0 even:bg-white/5"
                    >
                      <td class="px-3 py-2">{{ item.data }}</td>
                      <td class="px-3 py-2">{{ item.descricao }}</td>
                      <td class="px-3 py-2 font-semibold text-emerald-200">
                        {{ formatCurrency(item.valor) }}
                      </td>
                      <td class="px-3 py-2">
                        <div class="flex gap-2">
                          <button class="btn px-3 py-1 text-xs" @click="selectRecurring(item, 'pos')">
                            Editar
                          </button>
                          <button
                            class="btn px-3 py-1 text-xs"
                            @click="removeRecurring(item, 'pos')"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!store.postRecurrents.length">
                      <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                        Nenhum recorrente após o fechamento.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">
                Formulário de lançamentos
                <span v-if="editingEntryId" class="text-xs text-accent"> (editando) </span>
              </p>
              <p class="text-xs text-slate-400">
                Gera parcelas futuras ou cascata de edições.
              </p>
            </div>
            <button class="btn" @click="resetEntryForm">Limpar</button>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Data</p>
              <input
                v-model="entryForm.data"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Valor</p>
              <input
                v-model="entryForm.valor"
                type="number"
                step="0.01"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <p class="text-xs uppercase text-slate-400">Descrição</p>
              <input
                v-model="entryForm.descricao"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Parcela (n/m)</p>
              <input
                v-model="entryForm.parcela"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
                placeholder="02/06"
              />
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" v-model="entryGenerateFuture" class="accent-accent" />
                Gerar parcelas futuras
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" v-model="entryCascade" class="accent-accent" />
                Cascata (edição de série)
              </label>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="btn" @click="submitEntry" :disabled="store.loading">
              {{ editingEntryId ? "Salvar edição" : "Adicionar" }}
            </button>
            <button
              v-if="editingEntryId"
              class="btn"
              @click="resetEntryForm"
            >
              Cancelar edição
            </button>
          </div>
        </div>

        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">
                Recorrentes / Série
                <span v-if="editingRecurring" class="text-xs text-accent"> (editando) </span>
              </p>
              <p class="text-xs text-slate-400">
                Pode gerar meses futuros e ajustar série inteira.
              </p>
            </div>
            <button class="btn" @click="resetRecurringForm">Limpar</button>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Período</p>
              <select
                v-model="recurringForm.period"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              >
                <option value="pre">Pré-fechamento</option>
                <option value="pos">Pós-fechamento</option>
              </select>
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Tipo</p>
              <input
                v-model="recurringForm.tipo"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Data</p>
              <input
                v-model="recurringForm.data"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Valor</p>
              <input
                v-model="recurringForm.valor"
                type="number"
                step="0.01"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <p class="text-xs uppercase text-slate-400">Descrição</p>
              <input
                v-model="recurringForm.descricao"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <p class="text-xs uppercase text-slate-400">Termina em (YYYY-MM)</p>
              <input
                v-model="recurringForm.termina_em"
                type="month"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="flex items-center gap-3 md:col-span-2">
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" v-model="recurringGenerateFuture" class="accent-accent" />
                Gerar meses futuros
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" v-model="recurringCascade" class="accent-accent" />
                Cascata na série
              </label>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="btn" @click="submitRecurring" :disabled="store.loading">
              {{ editingRecurring ? 'Salvar recorrente' : 'Adicionar recorrente' }}
            </button>
            <button
              v-if="editingRecurring"
              class="btn"
              @click="resetRecurringForm"
            >
              Cancelar edição
            </button>
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">Poupança</p>
              <p class="text-xs text-slate-400">
                Movimentos: {{ store.savingsMovements.length }}
              </p>
            </div>
            <span class="pill bg-white/5">
              {{ formatCurrency(store.monthSummary?.poupanca?.saldo_mes || 0) }}
            </span>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Data</p>
              <input
                v-model="savingsDraft.data"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Valor</p>
              <input
                v-model="savingsDraft.valor"
                type="number"
                step="0.01"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <p class="text-xs uppercase text-slate-400">Descrição</p>
              <input
                v-model="savingsDraft.descricao"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Tipo</p>
              <select
                v-model="savingsDraft.tipo"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              >
                <option value="aporte">Aporte</option>
                <option value="resgate">Resgate</option>
              </select>
            </div>
            <div class="flex items-end">
              <button class="btn w-full" @click="submitSaving">Adicionar</button>
            </div>
          </div>
          <div class="overflow-hidden rounded-xl border border-white/5">
            <table class="w-full text-sm">
              <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="px-3 py-2">Data</th>
                  <th class="px-3 py-2">Descrição</th>
                  <th class="px-3 py-2">Valor</th>
                  <th class="px-3 py-2">Tipo</th>
                  <th class="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in store.savingsMovements"
                  :key="item.id || item.descricao + item.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2">{{ item.data }}</td>
                  <td class="px-3 py-2">{{ item.descricao }}</td>
                  <td
                    class="px-3 py-2 font-semibold"
                    :class="item.tipo === 'aporte' ? 'text-emerald-200' : 'text-rose-300'"
                  >
                    {{ formatCurrency(item.valor) }}
                  </td>
                  <td class="px-3 py-2">{{ item.tipo }}</td>
                  <td class="px-3 py-2">
                    <button class="btn px-3 py-1 text-xs" @click="removeSaving(idx)">
                      Excluir
                    </button>
                  </td>
                </tr>
                <tr v-if="!store.savingsMovements.length">
                  <td colspan="5" class="px-3 py-6 text-center text-slate-500">
                    Nenhum movimento de poupança.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">Empréstimos</p>
              <p class="text-xs text-slate-400">
                Feitos: {{ store.loansMade.length }} | Recebidos: {{ store.loansReceived.length }}
              </p>
            </div>
            <span class="pill bg-white/5">
              Saldo: {{ formatCurrency(store.monthSummary?.emprestimos?.saldo_mes || 0) }}
            </span>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Lado</p>
              <select
                v-model="loanDraft.lado"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              >
                <option value="feito">Feito</option>
                <option value="recebido">Recebido</option>
              </select>
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Data</p>
              <input
                v-model="loanDraft.data"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1">
              <p class="text-xs uppercase text-slate-400">Valor</p>
              <input
                v-model="loanDraft.valor"
                type="number"
                step="0.01"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="space-y-1 md:col-span-2">
              <p class="text-xs uppercase text-slate-400">Descrição</p>
              <input
                v-model="loanDraft.descricao"
                type="text"
                class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              />
            </div>
            <div class="flex items-end md:col-span-2">
              <button class="btn w-full" @click="submitLoan">Adicionar empréstimo</button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs uppercase text-slate-400">Feitos</p>
              <div class="overflow-hidden rounded-xl border border-white/5">
                <table class="w-full text-sm">
                  <tbody>
                    <tr
                      v-for="(item, idx) in store.loansMade"
                      :key="item.id || item.descricao + item.data"
                      class="odd:bg-white/0 even:bg-white/5"
                    >
                      <td class="px-3 py-2">{{ item.data }}</td>
                      <td class="px-3 py-2">{{ item.descricao }}</td>
                      <td class="px-3 py-2 font-semibold text-rose-300">
                        {{ formatCurrency(item.valor) }}
                      </td>
                      <td class="px-3 py-2">
                        <button class="btn px-3 py-1 text-xs" @click="removeLoan(idx, 'feito')">
                          Excluir
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!store.loansMade.length">
                      <td class="px-3 py-4 text-center text-slate-500">Nenhum empréstimo feito.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p class="text-xs uppercase text-slate-400">Recebidos</p>
              <div class="overflow-hidden rounded-xl border border-white/5">
                <table class="w-full text-sm">
                  <tbody>
                    <tr
                      v-for="(item, idx) in store.loansReceived"
                      :key="item.id || item.descricao + item.data"
                      class="odd:bg-white/0 even:bg-white/5"
                    >
                      <td class="px-3 py-2">{{ item.data }}</td>
                      <td class="px-3 py-2">{{ item.descricao }}</td>
                      <td class="px-3 py-2 font-semibold text-emerald-200">
                        {{ formatCurrency(item.valor) }}
                      </td>
                      <td class="px-3 py-2">
                        <button class="btn px-3 py-1 text-xs" @click="removeLoan(idx, 'recebido')">
                          Excluir
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!store.loansReceived.length">
                      <td class="px-3 py-4 text-center text-slate-500">
                        Nenhum empréstimo recebido.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Módulo apartamento</p>
            <span class="pill bg-white/5">
              {{ store.apartmentEvolution?.combinada?.length || 0 }} pontos
            </span>
          </div>
          <div class="h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
            <svg v-if="apartmentChart.points" viewBox="0 0 420 160" class="h-full w-full">
              <defs>
                <linearGradient id="apt-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#5eead4" />
                  <stop offset="100%" stop-color="#93c5fd" />
                </linearGradient>
              </defs>
              <polyline
                :points="apartmentChart.points"
                fill="none"
                stroke="url(#apt-grad)"
                stroke-width="3"
              />
              <template v-for="(label, idx) in apartmentChart.labels" :key="idx">
                <circle :cx="label.x" :cy="label.y" r="4" fill="#5eead4" />
              </template>
            </svg>
            <div
              v-else
              class="flex h-full items-center justify-center text-sm text-slate-500"
            >
              Sem série de evolução para o ano selecionado.
            </div>
          </div>
          <div class="flex flex-wrap gap-3 text-xs text-slate-300">
            <span
              v-for="(label, idx) in apartmentChart.labels"
              :key="idx"
              class="pill bg-white/5"
            >
              {{ label.ref }} — {{ formatCurrency(label.value) }}
            </span>
          </div>
        </div>

        <div class="glass-panel space-y-4 p-5">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Admin / Operação</p>
            <span class="pill bg-white/5">Import / Export</span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <button class="btn w-full" :disabled="store.adminLoading" @click="store.exportFromApi">
              Exportar base atual
            </button>
            <button class="btn w-full" :disabled="store.adminLoading" @click="store.backupServer">
              Backup rápido
            </button>
            <button class="btn w-full" :disabled="store.loading" @click="store.exportSnapshot">
              Snapshot local (ano)
            </button>
            <label class="btn w-full cursor-pointer justify-between" for="import-file">
              <span>Importar JSON</span>
              <input
                id="import-file"
                ref="importInput"
                type="file"
                accept="application/json"
                class="hidden"
                @change="handleImport"
              />
            </label>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 p-4">
            <p class="text-sm font-semibold">Feedback</p>
            <p class="text-xs text-slate-400">
              {{ store.importFeedback?.message || "Selecione um arquivo para validar antes de enviar para API." }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="store.importFeedback"
                :class="[
                  'tag',
                  store.importFeedback.ok
                    ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-100 border border-rose-500/30',
                ]"
              >
                {{ store.importFeedback.ok ? "JSON validado" : "Falha" }}
              </span>
              <button
                v-if="store.importFeedback?.ok"
                class="btn"
                @click="store.sendImportToApi"
                :disabled="store.adminLoading"
              >
                Enviar para API
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
