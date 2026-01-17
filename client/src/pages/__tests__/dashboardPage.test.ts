import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import DashboardPage from '../DashboardPage.vue'
import { formatCurrency, formatPlainNumber } from '@/utils/formatters'
import type { MonthSummary, YearSummary } from '@/types/schema'

const defaultYear = '2024'
const defaultMonth = '05'

const periodState = {
  year: ref(defaultYear),
  month: ref(defaultMonth),
}

const summaryState = {
  monthSummary: ref<MonthSummary | null>(null),
  yearSummary: ref<YearSummary | null>(null),
  loadingMonth: ref(false),
  loadingYear: ref(false),
  error: ref<string | null>(null),
}

const loadMonthSummary = vi.fn(() => Promise.resolve(undefined))
const loadYearSummary = vi.fn(() => Promise.resolve(undefined))

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => periodState,
}))

vi.mock('@/stores/summaryStore', () => ({
  useSummaryStore: () => ({
    ...summaryState,
    loadMonthSummary,
    loadYearSummary,
  }),
}))

vi.mock('@/components/PeriodSelector.vue', () => ({
  default: defineComponent({
    name: 'PeriodSelectorStub',
    setup() {
      return () =>
        h(
          'div',
          { 'data-testid': 'period-selector-stub' },
          'Period selector'
        )
    },
  }),
}))

function resetStores() {
  periodState.year.value = defaultYear
  periodState.month.value = defaultMonth
  summaryState.monthSummary.value = null
  summaryState.yearSummary.value = null
  summaryState.loadingMonth.value = false
  summaryState.loadingYear.value = false
  summaryState.error.value = null
  loadMonthSummary.mockReset()
  loadYearSummary.mockReset()
  loadMonthSummary.mockResolvedValue(undefined)
  loadYearSummary.mockResolvedValue(undefined)
}

function mountDashboardPage() {
  return mount(DashboardPage)
}

function createMonthSummary(
  overrides?: Partial<MonthSummary>
): MonthSummary {
  const base: MonthSummary = {
    referencia: '2024-05',
    salarios: {
      adiantamento: 500,
      pagamento: 2000,
      bruto: 2500,
    },
    variaveis: {
      entradas: 800,
      saidas: 300,
      saldo: 500,
    },
    recorrentes: {
      pre_fatura: {
        total: 200,
        entradas: 300,
        saidas: 100,
      },
      pos_fatura: {
        total: -150,
        entradas: 100,
        saidas: 250,
      },
    },
    resultado: {
      receitas: 5000,
      despesas: 3200,
      liquido: 1800,
      saldo_disponivel: 1200,
    },
    poupanca: {
      aportes: 600,
      resgates: 100,
      saldo_mes: 500,
      saldo_acumulado: 5000,
    },
    emprestimos: {
      feitos: 200,
      recebidos: 400,
      saldo_mes: 200,
      saldo_acumulado: -1000,
    },
    apartamento: {
      referencia: '2024-05',
      financiamento_caixa: {
        referencia: '2024-05',
        ano: '2024',
        mes: '05',
        valor_parcela: 900,
        saldo_devedor: 200000,
        diferenca_vs_mes_anterior: null,
        saldo_devedor_variacao: null,
      },
      entrada_construtora: null,
      totais: {
        parcelas: 900,
        saldo_devedor: 180000,
      },
    },
  }

  return {
    ...base,
    ...overrides,
    salarios: overrides?.salarios ?? base.salarios,
    variaveis: overrides?.variaveis ?? base.variaveis,
    recorrentes: overrides?.recorrentes ?? base.recorrentes,
    resultado: overrides?.resultado ?? base.resultado,
    poupanca: overrides?.poupanca ?? base.poupanca,
    emprestimos: overrides?.emprestimos ?? base.emprestimos,
    apartamento: overrides?.apartamento ?? base.apartamento,
  }
}

function createYearSummary(
  overrides?: Partial<YearSummary>
): YearSummary {
  const base: YearSummary = {
    ano: defaultYear,
    meses_disponiveis: ['01', '05'],
    totais: {
      salarios: {
        adiantamento: 1000,
        pagamento: 4000,
        bruto: 5000,
      },
      variaveis: {
        entradas: 9000,
        saidas: 7000,
        saldo: 2000,
      },
      recorrentes: {
        pre_fatura: 500,
        pos_fatura: 400,
      },
      resultado: {
        receitas: 20000,
        despesas: 13000,
        liquido: 7000,
        saldo_disponivel: 4500,
      },
      poupanca: {
        aportes: 4000,
        resgates: 500,
        saldo_final: 12000,
      },
      emprestimos: {
        feitos: 600,
        recebidos: 300,
        saldo_final: -300,
      },
      apartamento: {
        parcelas: {
          caixa: 1100,
          construtora: 800,
          total: 1900,
        },
        saldo_devedor_final: {
          caixa: 150000,
          construtora: 50000,
          total: 200000,
        },
      },
    },
    medias: {
      liquido: 1200,
      saldo_disponivel: 800,
    },
    meses: [],
  }

  return {
    ...base,
    ...overrides,
    meses_disponiveis:
      overrides?.meses_disponiveis ?? base.meses_disponiveis,
    totais: overrides?.totais ?? base.totais,
    medias: overrides?.medias ?? base.medias,
    meses: overrides?.meses ?? base.meses,
  }
}

describe('DashboardPage', () => {
  beforeEach(() => {
    resetStores()
  })

  it('loads both summaries on mount and whenever the period changes', async () => {
    mountDashboardPage()
    await flushPromises()

    expect(loadMonthSummary).toHaveBeenCalledTimes(1)
    expect(loadMonthSummary).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth
    )
    expect(loadYearSummary).toHaveBeenCalledTimes(1)
    expect(loadYearSummary).toHaveBeenCalledWith(defaultYear)

    loadMonthSummary.mockClear()
    loadYearSummary.mockClear()
    periodState.year.value = '2025'
    await flushPromises()

    expect(loadMonthSummary).toHaveBeenCalledTimes(1)
    expect(loadMonthSummary).toHaveBeenCalledWith('2025', defaultMonth)
    expect(loadYearSummary).toHaveBeenCalledTimes(1)
    expect(loadYearSummary).toHaveBeenCalledWith('2025')

    loadMonthSummary.mockClear()
    loadYearSummary.mockClear()
    periodState.month.value = '08'
    await flushPromises()

    expect(loadMonthSummary).toHaveBeenCalledTimes(1)
    expect(loadMonthSummary).toHaveBeenCalledWith('2025', '08')
    expect(loadYearSummary).toHaveBeenCalledTimes(1)
    expect(loadYearSummary).toHaveBeenCalledWith('2025')
  })

  it('allows manual refreshes and disables the button while loading', async () => {
    const wrapper = mountDashboardPage()
    await flushPromises()

    loadMonthSummary.mockClear()
    loadYearSummary.mockClear()

    const reloadButton = wrapper.get('button[type="button"]')

    await reloadButton.trigger('click')
    await flushPromises()

    expect(loadMonthSummary).toHaveBeenCalledTimes(1)
    expect(loadMonthSummary).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth
    )
    expect(loadYearSummary).toHaveBeenCalledTimes(1)
    expect(loadYearSummary).toHaveBeenCalledWith(defaultYear)

    summaryState.loadingMonth.value = true
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    summaryState.loadingMonth.value = false
    summaryState.loadingYear.value = true
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    summaryState.loadingYear.value = false
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('renders error, loading and empty states', async () => {
    const wrapper = mountDashboardPage()
    await flushPromises()

    summaryState.error.value = 'falhou dashboard'
    await nextTick()
    expect(wrapper.text()).toContain('falhou dashboard')

    summaryState.error.value = null
    summaryState.loadingMonth.value = true
    await nextTick()
    expect(wrapper.text()).toContain('Carregando resumos...')

    summaryState.loadingMonth.value = false
    summaryState.loadingYear.value = true
    await nextTick()
    expect(wrapper.text()).toContain('Carregando resumos...')

    summaryState.loadingYear.value = false
    await nextTick()
    expect(wrapper.text()).toContain('Nenhum resumo mensal carregado.')
    expect(wrapper.text()).toContain('Nenhum resumo anual carregado.')
  })

  it('falls back to the current period reference when no month summary is available', async () => {
    const wrapper = mountDashboardPage()
    await flushPromises()

    expect(wrapper.text()).toContain('Referencia 2024-05')

    summaryState.monthSummary.value = createMonthSummary({
      referencia: '2024-09',
    })
    await nextTick()

    expect(wrapper.text()).toContain('Referencia 2024-09')
  })

  it('renders month and year summaries plus available months data', async () => {
    const wrapper = mountDashboardPage()
    await flushPromises()

    summaryState.monthSummary.value = createMonthSummary({
      referencia: '2024-07',
      salarios: {
        adiantamento: 750,
        pagamento: 3500,
        bruto: 4250,
      },
      variaveis: {
        entradas: 1500,
        saidas: 500,
        saldo: 1000,
      },
      resultado: {
        receitas: 8000,
        despesas: 5000,
        liquido: 3000,
        saldo_disponivel: 1750,
      },
      recorrentes: {
        pre_fatura: {
          total: 450,
          entradas: 500,
          saidas: 50,
        },
        pos_fatura: {
          total: -200,
          entradas: 120,
          saidas: 320,
        },
      },
    })

    summaryState.yearSummary.value = createYearSummary({
      meses_disponiveis: ['03', '07', '10'],
      totais: {
        salarios: {
          adiantamento: 1800,
          pagamento: 6200,
          bruto: 8000,
        },
        variaveis: {
          entradas: 12000,
          saidas: 7000,
          saldo: 5000,
        },
        recorrentes: {
          pre_fatura: 900,
          pos_fatura: 300,
        },
        resultado: {
          receitas: 25000,
          despesas: 14000,
          liquido: 11000,
          saldo_disponivel: 6000,
        },
        poupanca: {
          aportes: 5000,
          resgates: 800,
          saldo_final: 18000,
        },
        emprestimos: {
          feitos: 700,
          recebidos: 1000,
          saldo_final: 300,
        },
        apartamento: {
          parcelas: {
            caixa: 1500,
            construtora: 900,
            total: 2400,
          },
          saldo_devedor_final: {
            caixa: 145000,
            construtora: 52000,
            total: 197000,
          },
        },
      },
      medias: {
        liquido: 2000,
        saldo_disponivel: 1500,
      },
    })

    await nextTick()

    expect(wrapper.text()).toContain('Meses disponiveis em 2024: 03, 07, 10')
    expect(wrapper.text()).toContain(
      formatCurrency(summaryState.monthSummary.value!.salarios.bruto)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(summaryState.monthSummary.value!.variaveis.saldo)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(
        summaryState.monthSummary.value!.resultado.saldo_disponivel
      )
    )
    expect(wrapper.text()).toContain(
      formatCurrency(
        summaryState.yearSummary.value!.totais.salarios.bruto
      )
    )
    expect(wrapper.text()).toContain(
      formatCurrency(
        summaryState.yearSummary.value!.totais.recorrentes.pre_fatura +
          summaryState.yearSummary.value!.totais.recorrentes.pos_fatura
      )
    )
    expect(wrapper.text()).toContain(
      formatPlainNumber(
        summaryState.yearSummary.value!.meses_disponiveis.length
      )
    )
  })
})
