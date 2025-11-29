<script setup>
import { useFinanceUi } from "../composables/useFinanceUi";

const ui = useFinanceUi();
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Emprestimos</p>
        <h2 class="text-xl font-semibold text-slate-50">Feitos e recebidos</h2>
        <p class="text-xs text-slate-400">
          Controle de emprestimos do mes com saldo consolidado no resumo mensal.
        </p>
      </div>
      <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/dashboard">
        Voltar ao dashboard
      </RouterLink>
    </section>

    <section class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold">Registrar emprestimo</p>
          <p class="text-xs text-slate-400">
            Feitos: {{ ui.store.loansMade.length }} | Recebidos: {{ ui.store.loansReceived.length }}
          </p>
        </div>
        <span class="pill bg-white/5">
          Saldo: {{ ui.formatCurrency(ui.store.monthSummary?.emprestimos?.saldo_mes || 0) }}
        </span>
      </div>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Lado</p>
          <select
            v-model="ui.loanDraft.lado"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="feito">Feito</option>
            <option value="recebido">Recebido</option>
          </select>
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Data</p>
          <input
            v-model="ui.loanDraft.data"
            type="date"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Valor</p>
          <input
            v-model="ui.loanDraft.valor"
            type="number"
            step="0.01"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1 md:col-span-2">
          <p class="text-xs uppercase text-slate-400">Descricao</p>
          <input
            v-model="ui.loanDraft.descricao"
            type="text"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="flex items-end md:col-span-2">
          <button class="btn w-full" @click="ui.submitLoan">Adicionar emprestimo</button>
        </div>
      </div>

      <div
        v-if="ui.loanErrors.length"
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-50"
      >
        <p class="font-semibold">Revise o emprestimo:</p>
        <ul class="list-disc pl-4">
          <li v-for="err in ui.loanErrors" :key="err">{{ err }}</li>
        </ul>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="glass-panel p-5">
        <p class="text-xs uppercase text-slate-400">Feitos</p>
        <div class="overflow-hidden rounded-xl border border-white/5">
          <table class="w-full text-sm">
            <tbody>
              <tr
                v-for="(item, idx) in ui.store.loansMade"
                :key="item.id || item.descricao + item.data"
                class="odd:bg-white/0 even:bg-white/5"
              >
                <td class="px-3 py-2">{{ item.data }}</td>
                <td class="px-3 py-2">{{ item.descricao }}</td>
                <td class="px-3 py-2 font-semibold text-rose-300">
                  {{ ui.formatCurrency(item.valor) }}
                </td>
                <td class="px-3 py-2">
                  <button class="btn px-3 py-1 text-xs" @click="ui.removeLoan(idx, 'feito')">
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="!ui.store.loansMade.length">
                <td class="px-3 py-4 text-center text-slate-500">Nenhum emprestimo feito.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="glass-panel p-5">
        <p class="text-xs uppercase text-slate-400">Recebidos</p>
        <div class="overflow-hidden rounded-xl border border-white/5">
          <table class="w-full text-sm">
            <tbody>
              <tr
                v-for="(item, idx) in ui.store.loansReceived"
                :key="item.id || item.descricao + item.data"
                class="odd:bg-white/0 even:bg-white/5"
              >
                <td class="px-3 py-2">{{ item.data }}</td>
                <td class="px-3 py-2">{{ item.descricao }}</td>
                <td class="px-3 py-2 font-semibold text-emerald-200">
                  {{ ui.formatCurrency(item.valor) }}
                </td>
                <td class="px-3 py-2">
                  <button class="btn px-3 py-1 text-xs" @click="ui.removeLoan(idx, 'recebido')">
                    Excluir
                  </button>
                </td>
              </tr>
              <tr v-if="!ui.store.loansReceived.length">
                <td class="px-3 py-4 text-center text-slate-500">
                  Nenhum emprestimo recebido.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
