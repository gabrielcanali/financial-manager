<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PeriodSelector from '@/components/PeriodSelector.vue'
import AdminActionsCard from '@/components/AdminActionsCard.vue'
import QuickActionsCard from '@/components/QuickActionsCard.vue'
import { useSummaryStore } from '@/stores/summaryStore'
import { usePeriodStore } from '@/stores/periodStore'
import { formatCurrency, formatPlainNumber } from '@/utils/formatters'

const summaryStore = useSummaryStore()
const periodStore = usePeriodStore()

const { monthSummary, yearSummary, loadingMonth, loadingYear, error } =
  storeToRefs(summaryStore)
const { year, month } = storeToRefs(periodStore)

const isLoading = computed(
  () => loadingMonth.value || loadingYear.value
)

async function loadSummaries() {
  if (!year.value || !month.value) {
    return
  }
  try {
    await Promise.all([
      summaryStore.loadMonthSummary(year.value, month.value),
      summaryStore.loadYearSummary(year.value),
    ])
  } catch {
    // erros sao armazenados no store
  }
}

watch(
  [year, month],
  () => {
    loadSummaries()
  },
  { immediate: true }
)

function refreshData() {
  loadSummaries()
}

const monthReference = computed(
  () => monthSummary.value?.referencia ?? `${year.value}-${month.value}`
)

const availableMonths = computed(
  () => yearSummary.value?.meses_disponiveis ?? []
)
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Fase 3 - Resumos conectados
      </p>
      <h1 class="text-2xl font-semibold text-ink-900">Dashboard</h1>
      <p class="text-sm text-ink-600">
        Os blocos abaixo refletem exatamente as respostas de
        <code class="rounded bg-slate-100 px-1">/api/months/:year/:month/summary</code>
        e
        <code class="rounded bg-slate-100 px-1">/api/years/:year/summary</code>.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex-1">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Periodo em foco
          </p>
          <h2 class="text-lg font-semibold text-ink-900">
            Referencia {{ monthReference }}
          </h2>
          <p class="text-sm text-ink-600">
            Ajuste o ano/mes via store compartilhado de periodo.
          </p>
        </div>
        <div class="flex-1">
          <PeriodSelector />
        </div>
        <button
          class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="isLoading"
          @click="refreshData"
        >
          Recarregar resumos
        </button>
      </div>
      <p v-if="availableMonths.length" class="mt-3 text-xs text-ink-500">
        Meses disponiveis em {{ year }}: {{ availableMonths.join(', ') }}
      </p>
    </div>

    <div v-if="error" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      {{ error }}
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <QuickActionsCard />
      <AdminActionsCard />
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Resumo mensal
          </p>
          <h2 class="text-lg font-semibold text-ink-900">
            {{ monthReference }}
          </h2>
        </div>
        <span class="text-xs uppercase tracking-wide text-ink-500">
          Fonte: /api/months/{{ year }}/{{ month }}/summary
        </span>
      </div>
      <div v-if="isLoading" class="mt-4 text-sm text-ink-500">
        Carregando resumos...
      </div>
      <div v-else-if="monthSummary" class="mt-4 grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Salarios
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Adiantamento</dt>
              <dd>{{ formatCurrency(monthSummary.salarios.adiantamento) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Pagamento</dt>
              <dd>{{ formatCurrency(monthSummary.salarios.pagamento) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Bruto</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.salarios.bruto) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Variaveis
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Entradas</dt>
              <dd>{{ formatCurrency(monthSummary.variaveis.entradas) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saidas</dt>
              <dd>{{ formatCurrency(monthSummary.variaveis.saidas) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.variaveis.saldo) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Recorrentes
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Pre fatura</dt>
              <dd>{{ formatCurrency(monthSummary.recorrentes.pre_fatura.total) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Pos fatura</dt>
              <dd>{{ formatCurrency(monthSummary.recorrentes.pos_fatura.total) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Resultado
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Receitas</dt>
              <dd>{{ formatCurrency(monthSummary.resultado.receitas) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Despesas</dt>
              <dd>{{ formatCurrency(monthSummary.resultado.despesas) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Liquido</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.resultado.liquido) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo disponivel</dt>
              <dd class="font-semibold text-mint-600">
                {{ formatCurrency(monthSummary.resultado.saldo_disponivel) }}
              </dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Poupanca
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Aportes</dt>
              <dd>{{ formatCurrency(monthSummary.poupanca.aportes) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Resgates</dt>
              <dd>{{ formatCurrency(monthSummary.poupanca.resgates) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo no mes</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.poupanca.saldo_mes) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo acumulado</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.poupanca.saldo_acumulado) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Emprestimos
          </h3>
          <dl class="mt-3 space-y-2 text-sm text-ink-700">
            <div class="flex items-center justify-between">
              <dt>Feitos</dt>
              <dd>{{ formatCurrency(monthSummary.emprestimos.feitos) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Recebidos</dt>
              <dd>{{ formatCurrency(monthSummary.emprestimos.recebidos) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo do mes</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.emprestimos.saldo_mes) }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Saldo acumulado</dt>
              <dd class="font-semibold">{{ formatCurrency(monthSummary.emprestimos.saldo_acumulado) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 p-4 lg:col-span-2">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Apartamento (snapshot do mes)
          </h3>
          <div v-if="monthSummary.apartamento" class="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-ink-500">
                Financiamento Caixa
              </p>
              <p class="text-sm text-ink-700">
                Parcela:
                {{
                  formatCurrency(
                    monthSummary.apartamento.financiamento_caixa?.valor_parcela ?? null
                  )
                }}
              </p>
              <p class="text-xs text-ink-500">
                Saldo:
                {{
                  formatCurrency(
                    monthSummary.apartamento.financiamento_caixa?.saldo_devedor ?? null
                  )
                }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-ink-500">
                Entrada Construtora
              </p>
              <p class="text-sm text-ink-700">
                Parcela:
                {{
                  formatCurrency(
                    monthSummary.apartamento.entrada_construtora?.valor_parcela ?? null
                  )
                }}
              </p>
              <p class="text-xs text-ink-500">
                Saldo:
                {{
                  formatCurrency(
                    monthSummary.apartamento.entrada_construtora?.saldo_devedor ?? null
                  )
                }}
              </p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-ink-500">
                Totais
              </p>
              <p class="text-sm text-ink-700">
                Parcelas:
                {{
                  formatCurrency(
                    monthSummary.apartamento.totais?.parcelas ?? null
                  )
                }}
              </p>
              <p class="text-xs text-ink-500">
                Saldo devedor:
                {{
                  formatCurrency(
                    monthSummary.apartamento.totais?.saldo_devedor ?? null
                  )
                }}
              </p>
            </div>
          </div>
          <p v-else class="mt-3 text-sm text-ink-500">
            Sem dados do apartamento para este mes.
          </p>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-ink-500">
        Nenhum resumo mensal carregado.
      </p>
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Resumo anual
          </p>
          <h2 class="text-lg font-semibold text-ink-900">
            Ano {{ year }}
          </h2>
        </div>
        <span class="text-xs uppercase tracking-wide text-ink-500">
          Fonte: /api/years/{{ year }}/summary
        </span>
      </div>
      <div v-if="isLoading" class="mt-4 text-sm text-ink-500">
        Carregando resumos...
      </div>
      <div v-else-if="yearSummary" class="mt-4 space-y-4 text-sm text-ink-700">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Salarios</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.salarios.bruto) }}
            </p>
            <p class="text-xs text-ink-500">
              Adiantamento: {{ formatCurrency(yearSummary.totais.salarios.adiantamento) }}
            </p>
            <p class="text-xs text-ink-500">
              Pagamento: {{ formatCurrency(yearSummary.totais.salarios.pagamento) }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Variaveis</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.variaveis.saldo) }}
            </p>
            <p class="text-xs text-ink-500">
              Entradas: {{ formatCurrency(yearSummary.totais.variaveis.entradas) }}
            </p>
            <p class="text-xs text-ink-500">
              Saidas: {{ formatCurrency(yearSummary.totais.variaveis.saidas) }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Recorrentes</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.recorrentes.pre_fatura + yearSummary.totais.recorrentes.pos_fatura) }}
            </p>
            <p class="text-xs text-ink-500">
              Pre fatura: {{ formatCurrency(yearSummary.totais.recorrentes.pre_fatura) }}
            </p>
            <p class="text-xs text-ink-500">
              Pos fatura: {{ formatCurrency(yearSummary.totais.recorrentes.pos_fatura) }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Resultado</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.resultado.liquido) }}
            </p>
            <p class="text-xs text-ink-500">
              Receita: {{ formatCurrency(yearSummary.totais.resultado.receitas) }}
            </p>
            <p class="text-xs text-ink-500">
              Despesa: {{ formatCurrency(yearSummary.totais.resultado.despesas) }}
            </p>
            <p class="text-xs text-ink-500">
              Saldo disponivel: {{ formatCurrency(yearSummary.totais.resultado.saldo_disponivel) }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Poupanca</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.poupanca.saldo_final) }}
            </p>
            <p class="text-xs text-ink-500">
              Aportes: {{ formatCurrency(yearSummary.totais.poupanca.aportes) }}
            </p>
            <p class="text-xs text-ink-500">
              Resgates: {{ formatCurrency(yearSummary.totais.poupanca.resgates) }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 p-4">
            <p class="text-xs uppercase tracking-wide text-ink-500">Emprestimos</p>
            <p class="mt-2 font-semibold">
              {{ formatCurrency(yearSummary.totais.emprestimos.saldo_final) }}
            </p>
            <p class="text-xs text-ink-500">
              Feitos: {{ formatCurrency(yearSummary.totais.emprestimos.feitos) }}
            </p>
            <p class="text-xs text-ink-500">
              Recebidos: {{ formatCurrency(yearSummary.totais.emprestimos.recebidos) }}
            </p>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-xs uppercase tracking-wide text-ink-500">Apartamento</p>
          <p class="mt-2 font-semibold">
            Parcelas totais:
            {{ formatCurrency(yearSummary.totais.apartamento.parcelas.total) }}
          </p>
          <p class="text-xs text-ink-500">
            Caixa: {{ formatCurrency(yearSummary.totais.apartamento.parcelas.caixa) }}
          </p>
          <p class="text-xs text-ink-500">
            Construtora: {{ formatCurrency(yearSummary.totais.apartamento.parcelas.construtora) }}
          </p>
          <p class="mt-2 text-xs text-ink-500">
            Saldo final total:
            {{ formatCurrency(yearSummary.totais.apartamento.saldo_devedor_final.total ?? null) }}
          </p>
        </div>

        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-xs uppercase tracking-wide text-ink-500">Medias</p>
          <p class="mt-2 text-sm text-ink-700">
            Liquido mensal medio: {{ formatCurrency(yearSummary.medias.liquido) }}
          </p>
          <p class="text-sm text-ink-700">
            Saldo disponivel medio:
            {{ formatCurrency(yearSummary.medias.saldo_disponivel) }}
          </p>
          <p class="mt-2 text-xs text-ink-500">
            Meses contabilizados: {{ formatPlainNumber(availableMonths.length) }}
          </p>
        </div>
      </div>
      <p v-else class="mt-4 text-sm text-ink-500">
        Nenhum resumo anual carregado.
      </p>
    </div>
  </section>
</template>
