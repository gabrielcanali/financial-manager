<script setup lang="ts">
import { computed } from 'vue'
import PeriodSelector from '@/components/PeriodSelector.vue'
import MonthDataForm from '@/components/month/MonthDataForm.vue'
import CalendarForm from '@/components/month/CalendarForm.vue'
import EntriesTable from '@/components/month/EntriesTable.vue'
import SavingsForm from '@/components/month/SavingsForm.vue'
import LoansForm from '@/components/month/LoansForm.vue'
import { useMonthDataLoader } from '@/composables/useMonthDataLoader'

const { monthData, loading, error, refreshCurrentMonth, year, month } =
  useMonthDataLoader()

function refreshMonth() {
  refreshCurrentMonth()
}

const hasMonthData = computed(() => Boolean(monthData.value))
const entries = computed(() => monthData.value?.entradas_saidas ?? [])
const savingsMoves = computed(() => monthData.value?.poupanca.movimentos ?? [])
const loansFeitos = computed(() => monthData.value?.emprestimos.feitos ?? [])
const loansRecebidos = computed(
  () => monthData.value?.emprestimos.recebidos ?? []
)
const calendar = computed(() => monthData.value?.calendario ?? null)
const incomeData = computed(() => monthData.value?.dados ?? null)
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Fase 4 - Formularios base
      </p>
      <h1 class="text-2xl font-semibold text-ink-900">Visao mensal</h1>
      <p class="text-sm text-ink-600">
        Os formularios desta pagina ja conectam com o <code class="rounded bg-slate-100 px-1">useMonthStore</code>
        usando o periodo global antes de gravar cada bloco.
      </p>
    </div>

    <PeriodSelector />

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Mes atual</p>
          <h2 class="text-lg font-semibold text-ink-900">{{ year }} / {{ month }}</h2>
          <p class="text-xs text-ink-500">
            Referencia compartilhada com as demais telas via store de periodo.
          </p>
        </div>
        <button
          class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="loading"
          @click="refreshMonth"
        >
          Recarregar mes
        </button>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <div v-if="loading" class="mt-4 text-sm text-ink-500">
        Carregando dados reais do mes...
      </div>

      <div v-else-if="hasMonthData" class="mt-4 space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <MonthDataForm :income="incomeData" />
          <CalendarForm :calendar="calendar" />
        </div>

        <EntriesTable :entries="entries" />

        <div class="grid gap-4 lg:grid-cols-2">
          <SavingsForm :movements="savingsMoves" />
          <LoansForm :feitos="loansFeitos" :recebidos="loansRecebidos" />
        </div>

        <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-ink-700">
          Edicoes de recorrentes ficam concentradas na pagina "Recorrentes", reaproveitando o mesmo estado carregado aqui.
        </div>
      </div>

      <p v-else class="mt-4 text-sm text-ink-500">
        Nenhum dado retornado para o periodo informado.
      </p>
    </div>
  </section>
</template>
