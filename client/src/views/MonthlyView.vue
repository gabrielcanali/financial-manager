<script setup>
import CategoryBadge from "../components/CategoryBadge.vue";
import SimpleLineChart from "../components/SimpleLineChart.vue";
import { useFinanceUi } from "../composables/useFinanceUi";

const ui = useFinanceUi();
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Visualizacao mensal</p>
        <h2 class="text-xl font-semibold text-slate-50">Movimentacoes variaveis e poupanca</h2>
        <p class="text-xs text-slate-400">
          Consuma, edite e cadastre lancamentos do mes atual, com calendario e progresso da fatura.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="pill bg-white/5">
          Variaveis: {{ ui.formatCurrency(ui.variableStatus.net) }}
        </span>
        <span class="pill bg-white/5">
          Recorrentes: {{ ui.formatCurrency(ui.recurringStatus.totals.net) }}
        </span>
        <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/recurrents">
          Abrir recorrentes
        </RouterLink>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-3">
      <div class="glass-panel space-y-4 p-5 xl:col-span-2">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">Resumo do mes</p>
            <p class="text-xs text-slate-400">Saldo atual: {{ ui.formatCurrency(ui.store.monthSummary?.resultado?.saldo_disponivel || 0) }}</p>
          </div>
          <span class="pill bg-white/5">{{ ui.store.year }}-{{ ui.store.month }}</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="card in ui.monthCards"
            :key="card.label"
            class="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4 shadow-card"
          >
            <p class="text-xs uppercase text-slate-400">{{ card.label }}</p>
            <p class="text-2xl font-bold text-slate-50">
              {{ ui.formatCurrency(card.value) }}
            </p>
            <p class="text-xs text-slate-500">{{ card.helper }}</p>
          </div>
        </div>
      </div>
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Recorrentes e fatura</p>
          <span class="pill bg-white/5">
            Fecha dia {{ ui.recurringStatus.closingDay || "??" }}
          </span>
        </div>
        <div class="space-y-2 text-xs text-slate-300">
          <div class="flex items-center justify-between">
            <span>Saldo recorrentes</span>
            <span
              class="font-semibold"
              :class="ui.recurringStatus.totals.net >= 0 ? 'text-emerald-200' : 'text-rose-200'"
            >
              {{ ui.formatCurrency(ui.recurringStatus.totals.net) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-slate-400">
            <span>Compromisso vs receitas</span>
            <span class="text-slate-100 font-semibold">
              {{ ui.recurringStatus.commitment }}%
            </span>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Progresso da fatura</span>
            <span class="text-slate-100 font-semibold">
              {{ ui.recurringStatus.invoiceProgress }}%
            </span>
          </div>
          <div class="h-2 w-full rounded-full bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-accent to-accentSoft transition-all"
              :style="{ width: `${ui.recurringStatus.invoiceProgress}%` }"
            ></div>
          </div>
          <p class="text-[11px] text-slate-400">
            {{ ui.recurringStatus.invoiceProgress }}% das saidas recorrentes estao previstas antes do fechamento.
          </p>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div class="flex items-center justify-between">
            <span>Pre-fechamento</span>
            <span class="font-semibold text-rose-200">
              {{ ui.formatCurrency(-ui.recurringStatus.pre.expense) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Pos-fechamento</span>
            <span class="font-semibold text-rose-200">
              {{ ui.formatCurrency(-ui.recurringStatus.pos.expense) }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span>Entradas recorrentes</span>
            <span class="font-semibold text-emerald-200">
              {{ ui.formatCurrency(ui.recurringStatus.totals.income) }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <div class="glass-panel space-y-3 p-5 lg:col-span-2">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">Calendario de lancamentos</p>
            <p class="text-xs text-slate-400">
              Variaveis + recorrentes, agrupados por dia.
            </p>
          </div>
          <span class="pill bg-white/5">{{ ui.calendarGrid.length }} dias</span>
        </div>
        <div class="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="day in ui.calendarGrid"
            :key="day.date"
            class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300"
          >
            <div class="flex items-center justify-between text-[11px] uppercase text-slate-400">
              <span>Dia {{ String(day.day).padStart(2, '0') }}</span>
              <span
                class="font-semibold"
                :class="day.total >= 0 ? 'text-emerald-200' : 'text-rose-200'"
              >
                {{ ui.formatCurrency(day.total) }}
              </span>
            </div>
            <ul class="mt-2 space-y-1">
              <li
                v-for="event in day.items.slice(0, 3)"
                :key="event.descricao + event.valor + event.kind"
                class="rounded-md bg-slate-900/60 px-2 py-1"
              >
                <div class="flex items-center justify-between">
                  <span class="text-slate-200">{{ event.descricao }}</span>
                  <span class="text-[10px] uppercase text-slate-500">{{ event.kind }}</span>
                </div>
                <p
                  class="text-[11px] font-semibold"
                  :class="event.valor >= 0 ? 'text-emerald-200' : 'text-rose-200'"
                >
                  {{ ui.formatCurrency(event.valor) }}
                </p>
              </li>
              <li v-if="day.items.length > 3" class="text-[10px] text-slate-500">
                + {{ day.items.length - 3 }} itens
              </li>
              <li v-if="!day.items.length" class="text-[11px] text-slate-600">
                Livre / sem registros
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Fluxo diario</p>
          <span class="pill bg-white/5">{{ ui.store.year }}-{{ ui.store.month }}</span>
        </div>
        <SimpleLineChart
          gradient-id="flow-grad-monthly"
          :points="ui.dailyFlowChart.points"
          :labels="ui.dailyFlowChart.labels"
          container-class="h-48 w-full"
          from-color="#c084fc"
          to-color="#38bdf8"
          dot-color="#38bdf8"
          empty-message="Sem movimentacoes para plotar."
        />
        <div class="flex flex-wrap gap-3 text-xs text-slate-300">
          <span
            v-for="(label, idx) in ui.dailyFlowChart.labels"
            :key="idx"
            class="pill bg-white/5"
          >
            {{ label.ref }} - {{ ui.formatCurrency(label.value) }}
          </span>
        </div>
      </div>
    </section>

    <section class="glass-panel p-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Entradas e saidas</p>
          <p class="text-xs text-slate-400">
            Entradas: {{ ui.formatCurrency(ui.variableStatus.income) }} | Saidas:
            {{ ui.formatCurrency(-ui.variableStatus.expense) }} | Liquido:
            {{ ui.formatCurrency(ui.variableStatus.net) }}
          </p>
        </div>
        <span class="pill bg-white/5">CRUD de variaveis</span>
      </div>
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <input
            v-model="ui.entryFilters.search"
            type="text"
            placeholder="Buscar descricao ou tag"
            class="w-full max-w-xs rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
          <select
            v-model="ui.entryFilters.category"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Todas categorias</option>
            <option value="">Sem categoria</option>
            <option v-for="cat in ui.categoryPresets" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <select
            v-model="ui.entryFilters.flow"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Entradas e saidas</option>
            <option value="income">Somente entradas</option>
            <option value="expense">Somente saidas</option>
          </select>
          <select
            v-model="ui.entryFilters.tag"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Todas tags</option>
            <option v-for="tag in ui.entryAvailableTags" :key="tag" :value="tag.toLowerCase()">
              {{ tag }}
            </option>
          </select>
          <button class="btn px-3 py-2 text-xs" @click="ui.resetEntryFilters">
            Limpar filtros
          </button>
        </div>
        <p class="text-[11px] text-slate-500">
          {{ ui.filteredEntries.length }} itens visiveis de {{ ui.store.entries.length }}
        </p>
      </div>
      <div class="overflow-hidden rounded-xl border border-white/5">
        <table class="w-full text-sm">
          <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
            <tr>
              <th class="px-3 py-2">Data</th>
              <th class="px-3 py-2">Descricao</th>
              <th class="px-3 py-2">Valor</th>
              <th class="px-3 py-2">Parcela</th>
              <th class="px-3 py-2">Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in ui.filteredEntries"
              :key="entry.id || entry.descricao + entry.data"
              class="odd:bg-white/0 even:bg-white/5"
            >
              <td class="px-3 py-2 text-slate-200">{{ entry.data }}</td>
              <td class="px-3 py-2 text-slate-100">
                {{ entry.descricao }}
                <div class="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                  <CategoryBadge :value="entry.categoria || ''" />
                  <span
                    v-for="tag in entry.tags || []"
                    :key="tag"
                    class="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-wide"
                  >
                    #{{ tag }}
                  </span>
                </div>
              </td>
              <td
                class="px-3 py-2 font-semibold"
                :class="entry.valor >= 0 ? 'text-emerald-300' : 'text-rose-300'"
              >
                {{ ui.formatCurrency(entry.valor) }}
              </td>
              <td class="px-3 py-2 text-slate-300">{{ entry.parcela || '-' }}</td>
              <td class="px-3 py-2">
                <div class="flex gap-2">
                  <button class="btn px-3 py-1 text-xs" @click="ui.selectEntry(entry)">
                    Editar
                  </button>
                  <button
                    class="btn px-3 py-1 text-xs"
                    @click="ui.removeEntry(entry)"
                    :disabled="ui.store.loading"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!ui.filteredEntries.length">
              <td colspan="5" class="px-3 py-6 text-center text-slate-500">
                {{
                  ui.store.entries.length
                    ? "Nenhuma movimentacao encontrada para os filtros atuais."
                    : "Sem movimentacoes variaveis para este mes."
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">
              Formulario de lancamentos
              <span v-if="ui.editingEntryId" class="text-xs text-accent"> (editando) </span>
            </p>
            <p class="text-xs text-slate-400">
              Gera parcelas futuras ou cascata de edicoes.
            </p>
          </div>
          <button class="btn" @click="ui.resetEntryForm">Limpar</button>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Data</p>
            <input
              v-model="ui.entryForm.data"
              type="date"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Valor</p>
            <input
              v-model="ui.entryForm.valor"
              type="number"
              step="0.01"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1 md:col-span-2">
            <p class="text-xs uppercase text-slate-400">Descricao</p>
            <input
              v-model="ui.entryForm.descricao"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Categoria</p>
            <select
              v-model="ui.entryForm.categoria"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            >
              <option value="">Sem categoria</option>
              <option v-for="cat in ui.categoryPresets" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Tags (separe por ,)</p>
            <input
              v-model="ui.entryForm.tagsInput"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              placeholder="cartao, fixo"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Parcela (n/m)</p>
            <input
              v-model="ui.entryForm.parcela"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
              placeholder="02/06"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" v-model="ui.entryGenerateFuture" class="accent-accent" />
              Gerar parcelas futuras
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" v-model="ui.entryCascade" class="accent-accent" />
              Cascata (edicao de serie)
            </label>
          </div>
        </div>
        <div
          v-if="ui.entryErrors.length"
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-50"
        >
          <p class="font-semibold">Revise antes de salvar:</p>
          <ul class="list-disc pl-4">
            <li v-for="err in ui.entryErrors" :key="err">{{ err }}</li>
          </ul>
        </div>
        <div class="flex gap-3">
          <button class="btn" @click="ui.submitEntry" :disabled="ui.store.loading">
            {{ ui.editingEntryId ? "Salvar edicao" : "Adicionar" }}
          </button>
          <button
            v-if="ui.editingEntryId"
            class="btn"
            @click="ui.resetEntryForm"
          >
            Cancelar edicao
          </button>
        </div>
      </div>

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">Poupanca</p>
            <p class="text-xs text-slate-400">
              Movimentos: {{ ui.store.savingsMovements.length }}
            </p>
          </div>
          <span class="pill bg-white/5">
            {{ ui.formatCurrency(ui.store.monthSummary?.poupanca?.saldo_mes || 0) }}
          </span>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Data</p>
            <input
              v-model="ui.savingsDraft.data"
              type="date"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Valor</p>
            <input
              v-model="ui.savingsDraft.valor"
              type="number"
              step="0.01"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1 md:col-span-2">
            <p class="text-xs uppercase text-slate-400">Descricao</p>
            <input
              v-model="ui.savingsDraft.descricao"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Tipo</p>
            <select
              v-model="ui.savingsDraft.tipo"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            >
              <option value="aporte">Aporte</option>
              <option value="resgate">Resgate</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn w-full" @click="ui.submitSaving">Adicionar</button>
          </div>
        </div>
        <div
          v-if="ui.savingsErrors.length"
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-50"
        >
          <p class="font-semibold">Revise a poupanca:</p>
          <ul class="list-disc pl-4">
            <li v-for="err in ui.savingsErrors" :key="err">{{ err }}</li>
          </ul>
        </div>
        <div class="overflow-hidden rounded-xl border border-white/5">
          <table class="w-full text-sm">
            <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
              <tr>
                <th class="px-3 py-2">Data</th>
                <th class="px-3 py-2">Descricao</th>
                <th class="px-3 py-2">Valor</th>
                <th class="px-3 py-2">Tipo</th>
                <th class="px-3 py-2">Acoes</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, idx) in ui.store.savingsMovements"
                :key="item.id || item.descricao + item.data"
                class="odd:bg-white/0 even:bg-white/5"
              >
                <td class="px-3 py-2">{{ item.data }}</td>
                <td class="px-3 py-2">{{ item.descricao }}</td>
                <td
                  class="px-3 py-2 font-semibold"
                  :class="item.tipo === 'aporte' ? 'text-emerald-200' : 'text-rose-300'"
                >
                  {{ ui.formatCurrency(item.valor) }}
                </td>
                <td class="px-3 py-2">{{ item.tipo }}</td>
                <td class="px-3 py-2">
                  <button class="btn px-3 py-1 text-xs" @click="ui.removeSaving(idx)">
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="!ui.store.savingsMovements.length">
                <td colspan="5" class="px-3 py-6 text-center text-slate-500">
                  Nenhum movimento de poupanca.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
