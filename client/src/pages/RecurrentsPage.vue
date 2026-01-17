<script setup lang="ts">
import { computed } from 'vue'
import PeriodSelector from '@/components/PeriodSelector.vue'
import RecurringForm from '@/components/month/RecurringForm.vue'
import { useMonthDataLoader } from '@/composables/useMonthDataLoader'
import { formatCurrency } from '@/utils/formatters'

const { monthData, loading, error, year, month, refreshCurrentMonth } =
  useMonthDataLoader()

function refreshRecurrents() {
  refreshCurrentMonth()
}

const hasMonthData = computed(() => Boolean(monthData.value))
const recurrentsPre = computed(
  () => monthData.value?.contas_recorrentes_pre_fatura ?? []
)
const recurrentsPos = computed(
  () => monthData.value?.contas_recorrentes_pos_fatura ?? []
)

type RecurringTotals = { entradas: number; saidas: number; saldo: number }

function calculateTotals(list: Array<{ valor: number }>): RecurringTotals {
  return list.reduce<RecurringTotals>(
    (acc, item) => {
      if (item.valor >= 0) {
        acc.entradas += item.valor
      } else {
        acc.saidas += item.valor
      }
      acc.saldo += item.valor
      return acc
    },
    { entradas: 0, saidas: 0, saldo: 0 }
  )
}

const totalsPre = computed(() => calculateTotals(recurrentsPre.value))
const totalsPos = computed(() => calculateTotals(recurrentsPos.value))
const totalsOverall = computed(() => ({
  entradas: totalsPre.value.entradas + totalsPos.value.entradas,
  saidas: totalsPre.value.saidas + totalsPos.value.saidas,
  saldo: totalsPre.value.saldo + totalsPos.value.saldo,
}))

const hasRecurrents = computed(
  () => recurrentsPre.value.length > 0 || recurrentsPos.value.length > 0
)
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-mint-600">
        Fase 4 - CRUD recorrentes
      </p>
      <h1 class="text-2xl font-semibold text-ink-900">Recorrentes</h1>
      <p class="text-sm text-ink-600">
        Os blocos pre/pos fatura sao carregados via <code class="rounded bg-slate-100 px-1">useMonthStore.fetchMonth</code>
        e cada acao de formulario chama os metodos de escrita com o periodo global.
      </p>
    </div>

    <PeriodSelector />

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Periodo atual</p>
          <h2 class="text-lg font-semibold text-ink-900">{{ year }} / {{ month }}</h2>
          <p class="text-xs text-ink-500">
            O mesmo seletor alimenta Dashboard e Visao mensal.
          </p>
        </div>
        <button
          class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="loading"
          @click="refreshRecurrents"
        >
          Recarregar recorrentes
        </button>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <div v-if="loading" class="mt-4 text-sm text-ink-500">
        Sincronizando com <code class="rounded bg-slate-100 px-1">/api/months/{{ year }}/{{ month }}</code>...
      </div>

      <p v-else-if="!hasMonthData" class="mt-4 text-sm text-ink-500">
        Nenhum retorno foi encontrado para o periodo informado.
      </p>

      <div v-else class="mt-4 space-y-4">
        <div class="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p class="text-xs uppercase tracking-wide text-ink-500">Totais consolidados</p>
          <dl class="mt-3 grid gap-4 text-sm text-ink-700 md:grid-cols-3">
            <div>
              <dt class="text-xs uppercase tracking-wide text-ink-500">Entradas</dt>
              <dd class="mt-1 font-semibold text-mint-700">{{ formatCurrency(totalsOverall.entradas) }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-ink-500">Saidas</dt>
              <dd class="mt-1 font-semibold text-rose-600">{{ formatCurrency(totalsOverall.saidas) }}</dd>
            </div>
            <div>
              <dt class="text-xs uppercase tracking-wide text-ink-500">Saldo liquido</dt>
              <dd class="mt-1 font-semibold">{{ formatCurrency(totalsOverall.saldo) }}</dd>
            </div>
          </dl>
          <p class="mt-2 text-xs text-ink-500">
            Totais calculados diretamente a partir dos blocos pre/pos fatura sem nenhum ajuste extra.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <RecurringForm
            title="Recorrentes pre fatura"
            period="pre"
            :items="recurrentsPre"
          />
          <RecurringForm
            title="Recorrentes pos fatura"
            period="pos"
            :items="recurrentsPos"
          />
        </div>
      </div>
    </div>

    <div
      v-if="hasMonthData && !hasRecurrents"
      class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-ink-700"
    >
      Nenhum recorrente foi cadastrado para este mes. Assim que o backend retornar itens nos blocos pre/pos fatura eles aparecerao aqui.
    </div>
  </section>
</template>
