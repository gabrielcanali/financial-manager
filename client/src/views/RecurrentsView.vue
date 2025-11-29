<script setup>
import { inject } from "vue";

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

    <section class="glass-panel p-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Recorrentes</p>
          <p class="text-xs text-slate-400">
            Pre: {{ ui.store.preRecurrents.length }} | Pos: {{ ui.store.postRecurrents.length }}
          </p>
        </div>
        <span class="pill bg-white/5">CRUD recorrentes</span>
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
                  v-for="item in ui.store.preRecurrents"
                  :key="item.id || item.descricao + item.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2">{{ item.data }}</td>
                  <td class="px-3 py-2">{{ item.descricao }}</td>
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
                <tr v-if="!ui.store.preRecurrents.length">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                    Nenhum recorrente antes do fechamento.
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
                  v-for="item in ui.store.postRecurrents"
                  :key="item.id || item.descricao + item.data"
                  class="odd:bg-white/0 even:bg-white/5"
                >
                  <td class="px-3 py-2">{{ item.data }}</td>
                  <td class="px-3 py-2">{{ item.descricao }}</td>
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
                <tr v-if="!ui.store.postRecurrents.length">
                  <td colspan="4" class="px-3 py-6 text-center text-slate-500">
                    Nenhum recorrente apos o fechamento.
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
