<script setup>
import { inject } from "vue";

const ui = inject("financeUi");
</script>

<template>
  <div class="space-y-6">
    <section class="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs uppercase text-slate-400">Panorama</p>
        <h2 class="text-xl font-semibold text-slate-50">Dashboard</h2>
        <p class="text-xs text-slate-400">
          Resumos mensal e anual, fluxo diario e atalhos para import/export e cadastros.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/monthly">
          Ir para mensal
        </RouterLink>
        <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/recurrents">
          Recorrentes
        </RouterLink>
        <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/loans">
          Emprestimos
        </RouterLink>
        <RouterLink class="pill bg-white/5 text-slate-200 hover:border-accent/50 hover:text-accent" to="/apartment">
          Meu apartamento
        </RouterLink>
      </div>
    </section>

    <section class="glass-panel space-y-4 p-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm uppercase text-slate-400">Quick actions</p>
          <p class="text-xs text-slate-400">Registrar a fatura do mes e acessar operacoes de admin.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn" :disabled="ui.store.adminLoading" @click="ui.store.exportFromApi">
            Exportar base
          </button>
          <button class="btn" :disabled="ui.store.adminLoading" @click="ui.store.backupServer">
            Backup rapido
          </button>
          <button class="btn" :disabled="ui.store.loading" @click="ui.store.exportSnapshot">
            Snapshot (ano)
          </button>
          <label class="btn cursor-pointer justify-between" for="import-file-dashboard">
            <span>Importar JSON</span>
            <input
              id="import-file-dashboard"
              type="file"
              accept="application/json"
              class="hidden"
              @change="ui.handleImport"
            />
          </label>
        </div>
      </div>
      <div class="grid gap-3 md:grid-cols-5">
        <div class="space-y-1 md:col-span-2">
          <p class="text-xs uppercase text-slate-400">Descricao</p>
          <input
            v-model="ui.invoiceDraft.descricao"
            type="text"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Data</p>
          <input
            v-model="ui.invoiceDraft.data"
            type="date"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Valor</p>
          <input
            v-model="ui.invoiceDraft.valor"
            type="number"
            step="0.01"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="space-y-1">
          <p class="text-xs uppercase text-slate-400">Parcela (n/m)</p>
          <input
            v-model="ui.invoiceDraft.parcela"
            type="text"
            placeholder="02/06"
            class="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
        </div>
        <div class="flex items-end">
          <button class="btn w-full" @click="ui.submitInvoice" :disabled="ui.store.loading">
            Registrar fatura
          </button>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="ui.importWithBackup" class="accent-accent" />
          Backup automatico antes de importar
        </label>
        <button class="btn px-3 py-2" @click="ui.resetInvoiceDraft">Limpar fatura rapida</button>
      </div>
      <div
        v-if="ui.invoiceErrors.length"
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-50"
      >
        <p class="font-semibold">Ajuste a fatura:</p>
        <ul class="list-disc pl-4">
          <li v-for="err in ui.invoiceErrors" :key="err">{{ err }}</li>
        </ul>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm uppercase text-slate-400">Resumo do mes</p>
          <span class="pill bg-white/5">{{ ui.store.year }}-{{ ui.store.month }}</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
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

      <div class="glass-panel space-y-3 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm uppercase text-slate-400">Quanto posso gastar</p>
          <span class="pill bg-white/5">Fecha dia {{ ui.spendingAdvice.closesAt }}</span>
        </div>
        <p class="text-3xl font-bold text-slate-50">
          {{ ui.formatCurrency(ui.spendingAdvice.perDay) }} / dia
        </p>
        <p class="text-xs text-slate-400">
          Disponivel: {{ ui.formatCurrency(ui.spendingAdvice.available) }} | {{ ui.spendingAdvice.daysRemaining }} dias restantes
        </p>
        <div class="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <p class="font-semibold text-slate-100">Proximas faturas</p>
          <ul class="mt-2 space-y-2">
            <li
              v-for="item in ui.nextInvoices"
              :key="item.data + item.descricao"
              class="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2"
            >
              <div>
                <p class="text-xs text-slate-200">{{ item.data }}</p>
                <p class="text-[11px] text-slate-400">{{ item.descricao }}</p>
              </div>
              <span class="text-sm font-semibold text-rose-200">
                {{ ui.formatCurrency(item.valor) }}
              </span>
            </li>
            <li v-if="!ui.nextInvoices.length" class="text-xs text-slate-500">
              Sem contas negativas registradas para este mes.
            </li>
          </ul>
        </div>
      </div>

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm uppercase text-slate-400">Resumo anual</p>
          <span class="pill bg-white/5">
            {{ ui.store.yearSummary?.meses_disponiveis?.length || 0 }} meses
          </span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="card in ui.annualCards"
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
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Fluxo de caixa diario</p>
          <span class="pill bg-white/5">{{ ui.store.year }}-{{ ui.store.month }}</span>
        </div>
        <div class="h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
          <svg v-if="ui.dailyFlowChart.points" viewBox="0 0 420 180" class="h-full w-full">
            <defs>
              <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#c084fc" />
                <stop offset="100%" stop-color="#38bdf8" />
              </linearGradient>
            </defs>
            <polyline
              :points="ui.dailyFlowChart.points"
              fill="none"
              stroke="url(#flow-grad)"
              stroke-width="3"
            />
            <template v-for="(label, idx) in ui.dailyFlowChart.labels" :key="idx">
              <circle :cx="label.x" :cy="label.y" r="4" fill="#38bdf8" />
            </template>
          </svg>
          <div v-else class="flex h-full items-center justify-center text-sm text-slate-500">
            Sem movimentacoes para plotar.
          </div>
        </div>
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

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Meu apartamento</p>
          <span class="pill bg-white/5">
            {{ ui.store.apartmentEvolution?.combinada?.length || 0 }} pontos
          </span>
        </div>
        <div class="h-48 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
          <svg v-if="ui.apartmentChart.points" viewBox="0 0 420 180" class="h-full w-full">
            <defs>
              <linearGradient id="apt-grad-dashboard" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5eead4" />
                <stop offset="100%" stop-color="#93c5fd" />
              </linearGradient>
            </defs>
            <polyline
              :points="ui.apartmentChart.points"
              fill="none"
              stroke="url(#apt-grad-dashboard)"
              stroke-width="3"
            />
            <template v-for="(label, idx) in ui.apartmentChart.labels" :key="idx">
              <circle :cx="label.x" :cy="label.y" r="4" fill="#5eead4" />
            </template>
          </svg>
          <div v-else class="flex h-full items-center justify-center text-sm text-slate-500">
            Sem serie de evolucao para o ano selecionado.
          </div>
        </div>
        <div class="flex flex-wrap gap-3 text-xs text-slate-300">
          <span
            v-for="(label, idx) in ui.apartmentChart.labels"
            :key="idx"
            class="pill bg-white/5"
          >
            {{ label.ref }} - {{ ui.formatCurrency(label.value) }}
          </span>
        </div>
      </div>
    </section>

    <section class="glass-panel space-y-4 p-5">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold">Admin / Operacao</p>
        <span class="pill bg-white/5">Import / Export</span>
      </div>
      <p class="text-xs text-slate-400">
        {{ ui.store.importFeedback?.message || "Selecione um JSON para validar antes de enviar para API." }}
      </p>
      <ul
        v-if="ui.store.importFeedback?.warnings?.length"
        class="list-disc space-y-1 pl-4 text-xs text-amber-200"
      >
        <li v-for="warn in ui.store.importFeedback.warnings" :key="warn">
          {{ warn }}
        </li>
      </ul>
      <ul
        v-if="ui.store.importFeedback?.errors?.length"
        class="list-disc space-y-1 pl-4 text-xs text-rose-200"
      >
        <li v-for="err in ui.store.importFeedback.errors" :key="err">
          {{ err }}
        </li>
      </ul>
      <div class="flex flex-wrap gap-2">
        <span
          v-if="ui.store.importFeedback"
          :class="[
            'tag',
            ui.store.importFeedback.ok
              ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-100 border border-rose-500/30',
          ]"
        >
          {{ ui.store.importFeedback.ok ? "JSON validado" : "Falha" }}
        </span>
        <button
          v-if="ui.store.importFeedback?.ok"
          class="btn"
          @click="ui.runImportToApi"
          :disabled="ui.store.adminLoading"
        >
          Enviar para API
        </button>
      </div>
    </section>
  </div>
</template>
