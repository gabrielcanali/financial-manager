<script setup>
import { inject } from "vue";
import CategoryBadge from "../components/CategoryBadge.vue";

const ui = inject("financeUi");
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Contas recorrentes</p>
        <h2 class="text-xl font-semibold text-slate-50">Series pre e pos-fechamento</h2>
        <p class="text-xs text-slate-400">
          Atualize recorrentes com cascata opcional, gerando meses futuros ou encerrando a serie.
        </p>
      </div>
      <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/monthly">
        Voltar para mensal
      </RouterLink>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold">Saldo de recorrentes</p>
            <p class="text-xs text-slate-400">Entradas x saidas consolidadas (pre e pos).</p>
          </div>
          <span
            class="pill"
            :class="ui.recurringStatus.totals.net >= 0 ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-100 border border-rose-500/20'"
          >
            {{ ui.formatCurrency(ui.recurringStatus.totals.net) }}
          </span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <p class="text-[11px] uppercase text-slate-400">Pre-fechamento</p>
            <p class="text-sm font-semibold text-rose-200">
              {{ ui.formatCurrency(-ui.recurringStatus.pre.expense) }}
            </p>
            <p class="text-[11px] text-slate-400">
              Entradas {{ ui.formatCurrency(ui.recurringStatus.pre.income) }}
            </p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            <p class="text-[11px] uppercase text-slate-400">Pos-fechamento</p>
            <p class="text-sm font-semibold text-rose-200">
              {{ ui.formatCurrency(-ui.recurringStatus.pos.expense) }}
            </p>
            <p class="text-[11px] text-slate-400">
              Entradas {{ ui.formatCurrency(ui.recurringStatus.pos.income) }}
            </p>
          </div>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Fatura ate fechamento</span>
            <span class="text-slate-100 font-semibold">
              {{ ui.recurringStatus.invoiceProgress }}%
            </span>
          </div>
          <div class="h-2 rounded-full bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-accent to-accentSoft"
              :style="{ width: `${ui.recurringStatus.invoiceProgress}%` }"
            ></div>
          </div>
          <p class="text-[11px] text-slate-400">
            {{ ui.formatCurrency(-ui.recurringStatus.pre.expense) }} dos recorrentes estao previstos antes do fechamento (dia
            {{ ui.recurringStatus.closingDay || '??' }}).
          </p>
        </div>
      </div>

      <div class="glass-panel space-y-3 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Timeline de recorrentes</p>
          <span class="pill bg-white/5">{{ ui.recurringTimeline.length }} itens</span>
        </div>
        <ul
          v-if="ui.recurringTimeline.length"
          class="space-y-2 text-sm text-slate-200"
        >
          <li
            v-for="item in ui.recurringTimeline.slice(0, 8)"
            :key="item.data + item.descricao + item.period"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2"
            >
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>{{ item.data }}</span>
                <span class="rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                  {{ item.period === 'pre' ? 'pre' : 'pos' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <p class="text-slate-200">{{ item.descricao }}</p>
                <span
                  class="text-sm font-semibold"
                  :class="item.valor >= 0 ? 'text-emerald-200' : 'text-rose-200'"
                >
                  {{ ui.formatCurrency(item.valor) }}
                </span>
              </div>
              <div class="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                <CategoryBadge :value="item.categoria || ''" minimal />
                <span
                  v-for="tag in item.tags || []"
                  :key="tag"
                  class="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-wide"
                >
                  #{{ tag }}
                </span>
              </div>
            </li>
        </ul>
        <p v-else class="text-sm text-slate-500">
          Nenhum recorrente carregado para este mes.
        </p>
      </div>
    </section>

    <section class="glass-panel p-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Recorrentes</p>
          <p class="text-xs text-slate-400">
            Pre: {{ ui.store.preRecurrents.length }} | Pos: {{ ui.store.postRecurrents.length }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="pill bg-white/5">
            Saldo: {{ ui.formatCurrency(ui.recurringStatus.totals.net) }}
          </span>
          <span class="pill bg-white/5">
            Compromisso: {{ ui.recurringStatus.commitment }}%
          </span>
        </div>
      </div>
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <input
            v-model="ui.recurringFilters.search"
            type="text"
            placeholder="Buscar descricao"
            class="w-full max-w-xs rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
          <select
            v-model="ui.recurringFilters.category"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Todas categorias</option>
            <option value="">Sem categoria</option>
            <option v-for="cat in ui.categoryPresets" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
          <select
            v-model="ui.recurringFilters.flow"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Entradas e saidas</option>
            <option value="income">Somente entradas</option>
            <option value="expense">Somente saidas</option>
          </select>
          <select
            v-model="ui.recurringFilters.tag"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Todas tags</option>
            <option
              v-for="tag in ui.recurringAvailableTags"
              :key="tag"
              :value="tag.toLowerCase()"
            >
              {{ tag }}
            </option>
          </select>
          <select
            v-model="ui.recurringFilters.period"
            class="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="all">Pre e pos</option>
            <option value="pre">Somente pre</option>
            <option value="pos">Somente pos</option>
          </select>
          <button class="btn px-3 py-2 text-xs" @click="ui.resetRecurringFilters">
            Limpar filtros
          </button>
        </div>
        <p class="text-[11px] text-slate-500">
          {{ ui.filteredPreRecurrents.length + ui.filteredPostRecurrents.length }} itens visiveis
        </p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <p class="text-xs uppercase text-slate-400">Ate fechamento</p>
          <div class="overflow-hidden rounded-xl border border-white/5">
            <table class="w-full text-sm">
              <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="px-3 py-2">Data</th>
                  <th class="px-3 py-2">Descricao</th>
                  <th class="px-3 py-2">Valor</th>
                  <th class="px-3 py-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in ui.filteredPreRecurrents"
                  :key="item.id || item.descricao + item.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2">{{ item.data }}</td>
                  <td class="px-3 py-2">
                    {{ item.descricao }}
                    <div class="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                      <CategoryBadge :value="item.categoria || ''" />
                      <span
                        v-for="tag in item.tags || []"
                        :key="tag"
                        class="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-wide"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2 font-semibold text-emerald-200">
                    {{ ui.formatCurrency(item.valor) }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex gap-2">
                      <button class="btn px-3 py-1 text-xs" @click="ui.selectRecurring(item, 'pre')">
                        Editar
                      </button>
                      <button
                        class="btn px-3 py-1 text-xs"
                        @click="ui.removeRecurring(item, 'pre')"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!ui.filteredPreRecurrents.length">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                    {{
                      ui.recurringFilters.period === "pos"
                        ? "Filtros ocultaram os recorrentes pre."
                        : "Nenhum recorrente antes do fechamento."
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <p class="text-xs uppercase text-slate-400">Apos fechamento</p>
          <div class="overflow-hidden rounded-xl border border-white/5">
            <table class="w-full text-sm">
              <thead class="bg-white/5 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th class="px-3 py-2">Data</th>
                  <th class="px-3 py-2">Descricao</th>
                  <th class="px-3 py-2">Valor</th>
                  <th class="px-3 py-2">Acoes</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in ui.filteredPostRecurrents"
                  :key="item.id || item.descricao + item.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2">{{ item.data }}</td>
                  <td class="px-3 py-2">
                    {{ item.descricao }}
                    <div class="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                      <CategoryBadge :value="item.categoria || ''" />
                      <span
                        v-for="tag in item.tags || []"
                        :key="tag"
                        class="rounded-full bg-white/5 px-2 py-0.5 uppercase tracking-wide"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2 font-semibold text-emerald-200">
                    {{ ui.formatCurrency(item.valor) }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex gap-2">
                      <button class="btn px-3 py-1 text-xs" @click="ui.selectRecurring(item, 'pos')">
                        Editar
                      </button>
                      <button
                        class="btn px-3 py-1 text-xs"
                        @click="ui.removeRecurring(item, 'pos')"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!ui.filteredPostRecurrents.length">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                    {{
                      ui.recurringFilters.period === "pre"
                        ? "Filtros ocultaram os recorrentes pos."
                        : "Nenhum recorrente apos o fechamento."
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <section class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">
            Recorrentes / Serie
            <span v-if="ui.editingRecurring" class="text-xs text-accent"> (editando) </span>
          </p>
          <p class="text-xs text-slate-400">
            Pode gerar meses futuros e ajustar serie inteira.
          </p>
        </div>
        <button class="btn" @click="ui.resetRecurringForm">Limpar</button>
      </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Periodo</p>
            <select
              v-model="ui.recurringForm.period"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            >
              <option value="pre">Pre-fechamento</option>
              <option value="pos">Pos-fechamento</option>
            </select>
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Tipo</p>
            <input
              v-model="ui.recurringForm.tipo"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Data</p>
          <input
            v-model="ui.recurringForm.data"
            type="date"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Valor</p>
          <input
            v-model="ui.recurringForm.valor"
            type="number"
            step="0.01"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
          <div class="space-y-1 md:col-span-2">
            <p class="text-xs uppercase text-slate-400">Descricao</p>
            <input
              v-model="ui.recurringForm.descricao"
              type="text"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Categoria</p>
            <select
              v-model="ui.recurringForm.categoria"
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            >
              <option value="">Sem categoria</option>
              <option v-for="cat in ui.categoryPresets" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <p class="text-xs uppercase text-slate-400">Tags</p>
            <input
              v-model="ui.recurringForm.tagsInput"
              type="text"
              placeholder="internet, cartao..."
              class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
          </div>
          <div class="space-y-1 md:col-span-2">
            <p class="text-xs uppercase text-slate-400">Termina em (YYYY-MM)</p>
            <input
              v-model="ui.recurringForm.termina_em"
              type="month"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="flex items-center gap-3 md:col-span-2">
          <label class="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" v-model="ui.recurringGenerateFuture" class="accent-accent" />
            Gerar meses futuros
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" v-model="ui.recurringCascade" class="accent-accent" />
            Cascata na serie
          </label>
        </div>
      </div>
      <div
        v-if="ui.recurringErrors.length"
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-50"
      >
        <p class="font-semibold">Revise o recorrente:</p>
        <ul class="list-disc pl-4">
          <li v-for="err in ui.recurringErrors" :key="err">{{ err }}</li>
        </ul>
      </div>
      <div class="flex gap-3">
        <button class="btn" @click="ui.submitRecurring" :disabled="ui.store.loading">
          {{ ui.editingRecurring ? 'Salvar recorrente' : 'Adicionar recorrente' }}
        </button>
        <button
          v-if="ui.editingRecurring"
          class="btn"
          @click="ui.resetRecurringForm"
        >
          Cancelar edicao
        </button>
      </div>
    </section>
  </div>
</template>
