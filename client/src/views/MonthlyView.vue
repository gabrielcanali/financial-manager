<script setup>
import { inject } from "vue";

const ui = inject("financeUi");
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Visualizacao mensal</p>
        <h2 class="text-xl font-semibold text-slate-50">Movimentacoes variaveis e poupanca</h2>
        <p class="text-xs text-slate-400">
          Consuma, edite e cadastre lancamentos do mes atual. Use o atalho para recorrentes quando precisar da serie.
        </p>
      </div>
      <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/recurrents">
        Abrir recorrentes
      </RouterLink>
    </section>

    <section class="glass-panel p-5">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Entradas e saidas</p>
          <p class="text-xs text-slate-400">
            Total: {{ ui.formatCurrency(ui.store.sum(ui.store.entries)) }}
          </p>
        </div>
        <span class="pill bg-white/5">CRUD de variaveis</span>
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
              v-for="entry in ui.store.entries"
              :key="entry.id || entry.descricao + entry.data"
              class="odd:bg-white/0 even:bg-white/5"
            >
              <td class="px-3 py-2 text-slate-200">{{ entry.data }}</td>
              <td class="px-3 py-2 text-slate-100">{{ entry.descricao }}</td>
              <td
                class="px-3 py-2 font-semibold"
                :class="entry.valor >= 0 ? 'text-emerald-300' : 'text-rose-300'"
              >
                {{ ui.formatCurrency(entry.valor) }}
              </td>
              <td class="px-3 py-2 text-slate-300">{{ entry.parcela || "-" }}</td>
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
            <tr v-if="!ui.store.entries.length">
              <td colspan="5" class="px-3 py-6 text-center text-slate-500">
                Sem movimentacoes variaveis para este mes.
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
