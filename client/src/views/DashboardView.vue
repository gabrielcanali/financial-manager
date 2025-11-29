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
          Resumos mensal e anual, atalhos para rotas e operacoes de admin em um so lugar.
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
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm uppercase text-slate-400">Resumo do mes</p>
          <span class="pill bg-white/5"> {{ ui.store.year }}-{{ ui.store.month }} </span>
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

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm uppercase text-slate-400">Resumo anual</p>
          <span class="pill bg-white/5">
            {{ ui.store.yearSummary?.meses?.length || 0 }} meses carregados
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
          <p class="text-sm font-semibold">Meu apartamento</p>
          <span class="pill bg-white/5">
            {{ ui.store.apartmentEvolution?.combinada?.length || 0 }} pontos
          </span>
        </div>
        <div class="h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
          <svg v-if="ui.apartmentChart.points" viewBox="0 0 420 160" class="h-full w-full">
            <defs>
              <linearGradient id="apt-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#5eead4" />
                <stop offset="100%" stop-color="#93c5fd" />
              </linearGradient>
            </defs>
            <polyline
              :points="ui.apartmentChart.points"
              fill="none"
              stroke="url(#apt-grad)"
              stroke-width="3"
            />
            <template v-for="(label, idx) in ui.apartmentChart.labels" :key="idx">
              <circle :cx="label.x" :cy="label.y" r="4" fill="#5eead4" />
            </template>
          </svg>
          <div
            v-else
            class="flex h-full items-center justify-center text-sm text-slate-500"
          >
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

      <div class="glass-panel space-y-4 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold">Admin / Operacao</p>
          <span class="pill bg-white/5">Import / Export</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <button class="btn w-full" :disabled="ui.store.adminLoading" @click="ui.store.exportFromApi">
            Exportar base atual
          </button>
          <button class="btn w-full" :disabled="ui.store.adminLoading" @click="ui.store.backupServer">
            Backup rapido
          </button>
          <button class="btn w-full" :disabled="ui.store.loading" @click="ui.store.exportSnapshot">
            Snapshot local (ano)
          </button>
          <label class="btn w-full cursor-pointer justify-between" for="import-file-dashboard">
            <span>Importar JSON</span>
            <input
              id="import-file-dashboard"
              ref="ui.importInput"
              type="file"
              accept="application/json"
              class="hidden"
              @change="ui.handleImport"
            />
          </label>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" v-model="ui.importWithBackup" class="accent-accent" />
          Backup automatico antes de importar
        </div>
        <div class="rounded-lg border border-white/10 bg-white/5 p-4">
          <p class="text-sm font-semibold">Feedback</p>
          <p class="text-xs text-slate-400">
            {{ ui.store.importFeedback?.message || "Selecione um arquivo para validar antes de enviar para API." }}
          </p>
          <ul
            v-if="ui.store.importFeedback?.warnings?.length"
            class="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-200"
          >
            <li v-for="warn in ui.store.importFeedback.warnings" :key="warn">
              {{ warn }}
            </li>
          </ul>
          <ul
            v-if="ui.store.importFeedback?.errors?.length"
            class="mt-2 list-disc space-y-1 pl-4 text-xs text-rose-200"
          >
            <li v-for="err in ui.store.importFeedback.errors" :key="err">
              {{ err }}
            </li>
          </ul>
          <div class="mt-3 flex flex-wrap gap-2">
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
        </div>
      </div>
    </section>
  </div>
</template>
