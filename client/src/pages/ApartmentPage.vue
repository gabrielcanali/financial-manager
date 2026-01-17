<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PeriodSelector from '@/components/PeriodSelector.vue'
import ApartmentSnapshotForm from '@/components/apartment/ApartmentSnapshotForm.vue'
import ApartmentSeriesManager from '@/components/apartment/ApartmentSeriesManager.vue'
import { usePeriodStore } from '@/stores/periodStore'
import { useApartmentStore } from '@/stores/apartmentStore'
import { formatCurrency } from '@/utils/formatters'

const periodStore = usePeriodStore()
const apartmentStore = useApartmentStore()

const { year, month } = storeToRefs(periodStore)
const {
  month: apartmentMonth,
  evolution,
  loadingMonth,
  loadingEvolution,
  error,
  isSnapshotCurrent,
} = storeToRefs(apartmentStore)

async function loadMonthSnapshot() {
  if (!year.value || !month.value) {
    return
  }
  try {
    await apartmentStore.loadMonth(year.value, month.value)
  } catch {
    // erro centralizado no store
  }
}

async function loadEvolutionData() {
  if (!year.value) {
    return
  }
  try {
    await apartmentStore.loadEvolution({ year: year.value })
  } catch {
    // erro centralizado no store
  }
}

watch(
  [year, month],
  () => {
    loadMonthSnapshot()
  },
  { immediate: true }
)

watch(
  year,
  () => {
    loadEvolutionData()
  },
  { immediate: true }
)

function refreshApartmentData() {
  loadMonthSnapshot()
  loadEvolutionData()
}

function handleSeriesUpdated() {
  refreshApartmentData()
}

const periodReference = computed(() => periodStore.reference)
const shouldShowStaleWarning = computed(
  () => Boolean(apartmentMonth.value?.referencia && !isSnapshotCurrent.value)
)
const hasSnapshot = computed(() => Boolean(apartmentMonth.value))
const hasEvolution = computed(() => Boolean(evolution.value))

const caixaInstallment = computed(
  () => apartmentMonth.value?.financiamento_caixa ?? null
)
const construtoraInstallment = computed(
  () => apartmentMonth.value?.entrada_construtora ?? null
)
const monthTotals = computed(() => apartmentMonth.value?.totais ?? null)

const caixaEvolution = computed(
  () => evolution.value?.financiamento_caixa ?? []
)
const construtoraEvolution = computed(
  () => evolution.value?.entrada_construtora ?? []
)
const combinedEvolution = computed(() => evolution.value?.combinada ?? [])
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-mint-600">
        Fase 3 - Apartamento conectado
      </p>
      <h1 class="text-2xl font-semibold text-ink-900">Apartamento</h1>
      <p class="text-sm text-ink-600">
        Os dados sao carregados das rotas
        <code class="rounded bg-slate-100 px-1">/api/apartment/:year/:month</code>
        e
        <code class="rounded bg-slate-100 px-1">/api/apartment/evolution</code>
        utilizando o <code class="rounded bg-slate-100 px-1">useApartmentStore</code>.
      </p>
    </div>

    <PeriodSelector />

    <div
      v-if="shouldShowStaleWarning"
      data-testid="apartment-snapshot-warning"
      class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p class="text-sm font-semibold uppercase tracking-wide text-amber-700">
        Snapshot desatualizado
      </p>
      <p class="mt-1 text-sm">
        O snapshot exibido corresponde a
        <span class="font-semibold">{{ apartmentMonth?.referencia }}</span>,
        mas o periodo selecionado e
        <span class="font-semibold">{{ periodReference }}</span>.
        Clique em
        <span class="font-semibold">Recarregar apartamento</span> para alinhar os dados.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Periodo atual</p>
          <h2 class="text-lg font-semibold text-ink-900">{{ year }} / {{ month }}</h2>
          <p class="text-xs text-ink-500">
            As mesmas referencias alimentam os resumos do dashboard.
          </p>
        </div>
        <button
          data-testid="reload-apartment-button"
          :class="[
            'rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            shouldShowStaleWarning
              ? 'bg-mint-600 text-white shadow hover:bg-mint-500 focus-visible:ring-mint-200 focus-visible:ring-offset-white'
              : 'border border-slate-200 text-ink-700 hover:bg-slate-100 focus-visible:ring-slate-200 focus-visible:ring-offset-white',
          ]"
          type="button"
          :disabled="loadingMonth || loadingEvolution"
          @click="refreshApartmentData"
        >
          <span class="flex items-center gap-2">
            <svg
              v-if="shouldShowStaleWarning"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M10 3.5a6.5 6.5 0 1 1-4.6 1.9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M5.4 3.5H9v3.6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M10 9v3"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
            </svg>
            Recarregar apartamento
          </span>
        </button>
      </div>
      <p
        v-if="shouldShowStaleWarning"
        data-testid="reload-helper-text"
        class="mt-2 flex items-center gap-2 text-xs font-semibold text-amber-700"
      >
        <span aria-hidden="true">!</span>
        Recarregar o apartamento alinha o snapshot e libera novas edicoes.
      </p>

      <div v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <div v-if="loadingMonth" class="mt-4 text-sm text-ink-500">
        Consultando o snapshot do mes selecionado...
      </div>

      <div v-if="loadingEvolution" class="mt-2 text-sm text-ink-500">
        Buscando evolucao acumulada de {{ year }}...
      </div>
    </div>

    <ApartmentSnapshotForm :snapshot="apartmentMonth" :stale-snapshot="shouldShowStaleWarning" />

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-ink-500">Snapshot do mes</p>
          <p class="text-xs text-ink-500">
            Dados do contrato original conforme schema oficial.
          </p>
        </div>
        <p class="text-xs text-ink-500" v-if="apartmentMonth?.referencia">
          Referencia: <span class="font-semibold text-ink-700">{{ apartmentMonth.referencia }}</span>
        </p>
      </div>

      <div v-if="hasSnapshot" class="mt-4 grid gap-4 lg:grid-cols-3">
        <article class="rounded-lg border border-slate-200 p-4 text-sm">
          <p class="text-xs uppercase tracking-wide text-ink-500">Financiamento Caixa</p>
          <p class="mt-2 text-xl font-semibold text-ink-900">{{ formatCurrency(caixaInstallment?.valor_parcela ?? null) }}</p>
          <dl class="mt-3 space-y-2 text-xs text-ink-500">
            <div class="flex items-center justify-between">
              <dt>Saldo devedor</dt>
              <dd>{{ formatCurrency(caixaInstallment?.saldo_devedor ?? null) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Dif. vs mes anterior</dt>
              <dd>{{ formatCurrency(caixaInstallment?.diferenca_vs_mes_anterior ?? null) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Variacao saldo</dt>
              <dd>{{ formatCurrency(caixaInstallment?.saldo_devedor_variacao ?? null) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-lg border border-slate-200 p-4 text-sm">
          <p class="text-xs uppercase tracking-wide text-ink-500">Entrada Construtora</p>
          <p class="mt-2 text-xl font-semibold text-ink-900">{{ formatCurrency(construtoraInstallment?.valor_parcela ?? null) }}</p>
          <dl class="mt-3 space-y-2 text-xs text-ink-500">
            <div class="flex items-center justify-between">
              <dt>Saldo devedor</dt>
              <dd>{{ formatCurrency(construtoraInstallment?.saldo_devedor ?? null) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Dif. vs mes anterior</dt>
              <dd>{{ formatCurrency(construtoraInstallment?.diferenca_vs_mes_anterior ?? null) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Variacao saldo</dt>
              <dd>{{ formatCurrency(construtoraInstallment?.saldo_devedor_variacao ?? null) }}</dd>
            </div>
          </dl>
        </article>

        <article class="rounded-lg border border-slate-200 p-4 text-sm">
          <p class="text-xs uppercase tracking-wide text-ink-500">Totais</p>
          <dl class="mt-3 space-y-3 text-sm text-ink-900">
            <div class="flex items-center justify-between">
              <dt>Parcelas do mes</dt>
              <dd>{{ formatCurrency(monthTotals?.parcelas ?? null) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo devedor total</dt>
              <dd>{{ formatCurrency(monthTotals?.saldo_devedor ?? null) }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-xs text-ink-500">
            Valores calculados no backend somando Caixa + Construtora.
          </p>
        </article>
      </div>

      <p v-else class="mt-4 text-sm text-ink-500">
        Nenhum snapshot foi retornado para o periodo informado.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-ink-500">Evolucao combinada</p>
          <p class="text-xs text-ink-500">
            Origem direta de <code class="rounded bg-slate-100 px-1">/api/apartment/evolution</code> filtrando por ano.
          </p>
        </div>
        <p class="text-xs text-ink-500">Ano selecionado: {{ year }}</p>
      </div>

      <div v-if="hasEvolution" class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-ink-500">
              <th class="px-3 py-2">Referencia</th>
              <th class="px-3 py-2">Parcelas</th>
              <th class="px-3 py-2">Saldo</th>
              <th class="px-3 py-2">Dif. mes anterior</th>
              <th class="px-3 py-2">Variacao saldo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-ink-800">
            <tr v-for="entry in combinedEvolution" :key="entry.referencia">
              <td class="px-3 py-2 font-semibold">{{ entry.referencia }}</td>
              <td class="px-3 py-2">{{ formatCurrency(entry.parcelas) }}</td>
              <td class="px-3 py-2">{{ formatCurrency(entry.saldo_devedor) }}</td>
              <td class="px-3 py-2">{{ formatCurrency(entry.diferenca_vs_mes_anterior) }}</td>
              <td class="px-3 py-2">{{ formatCurrency(entry.saldo_devedor_variacao) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!combinedEvolution.length" class="text-sm text-ink-500">Nenhum dado acumulado para este ano.</p>
      </div>

      <p v-else class="mt-4 text-sm text-ink-500">
        Nenhuma evolucao encontrada para o ano selecionado.
      </p>
    </div>

    <div v-if="hasEvolution" class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-ink-500">Historico Caixa</p>
        <div v-if="caixaEvolution.length" class="mt-3 space-y-2 text-sm">
          <article v-for="entry in caixaEvolution" :key="entry.referencia" class="rounded-lg border border-slate-200 p-3">
            <p class="font-semibold text-ink-900">{{ entry.referencia }}</p>
            <p class="text-xs text-ink-500">Parcela: {{ formatCurrency(entry.valor_parcela) }}</p>
            <p class="text-xs text-ink-500">Saldo devedor: {{ formatCurrency(entry.saldo_devedor) }}</p>
            <p class="text-xs text-ink-500">
              Dif. vs anterior: {{ formatCurrency(entry.diferenca_vs_mes_anterior) }}
            </p>
          </article>
        </div>
        <p v-else class="mt-3 text-sm text-ink-500">Sem registros neste ano.</p>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <p class="text-xs uppercase tracking-wide text-ink-500">Historico Construtora</p>
        <div v-if="construtoraEvolution.length" class="mt-3 space-y-2 text-sm">
          <article
            v-for="entry in construtoraEvolution"
            :key="entry.referencia"
            class="rounded-lg border border-slate-200 p-3"
          >
            <p class="font-semibold text-ink-900">{{ entry.referencia }}</p>
            <p class="text-xs text-ink-500">Parcela: {{ formatCurrency(entry.valor_parcela) }}</p>
            <p class="text-xs text-ink-500">Saldo devedor: {{ formatCurrency(entry.saldo_devedor) }}</p>
            <p class="text-xs text-ink-500">
              Dif. vs anterior: {{ formatCurrency(entry.diferenca_vs_mes_anterior) }}
            </p>
          </article>
        </div>
        <p v-else class="mt-3 text-sm text-ink-500">Sem registros neste ano.</p>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-ink-500">
          Manutencao da evolucao
        </p>
        <p class="text-sm text-ink-500">
          Adicione, edite ou remova parcelas da Caixa e da Construtora. As alteracoes atualizam o snapshot e a evolucao automaticamente.
        </p>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <ApartmentSeriesManager
          title="Financiamento Caixa"
          :entries="caixaEvolution"
          series-key="financiamento_caixa"
          empty-message="Nenhuma parcela registrada para o periodo filtrado."
          :stale-snapshot="shouldShowStaleWarning"
          @updated="handleSeriesUpdated"
        />
        <ApartmentSeriesManager
          title="Entrada Construtora"
          :entries="construtoraEvolution"
          series-key="entrada_construtora"
          empty-message="Nenhuma parcela registrada para o periodo filtrado."
          :stale-snapshot="shouldShowStaleWarning"
          @updated="handleSeriesUpdated"
        />
      </div>
    </div>
  </section>
</template>
