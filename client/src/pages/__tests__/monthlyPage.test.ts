import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import MonthlyPage from '../MonthlyPage.vue'
import { useMonthStore } from '@/stores/monthStore'
import { usePeriodStore } from '@/stores/periodStore'
import type { MonthData } from '@/types/schema'
import * as monthsService from '@/services/monthsService'

vi.mock('@/services/monthsService', () => ({
  fetchMonth: vi.fn(),
  updateMonthData: vi.fn(),
  updateMonthCalendar: vi.fn(),
  setMonthSavings: vi.fn(),
  setMonthLoans: vi.fn(),
  addEntry: vi.fn(),
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
  addRecurring: vi.fn(),
  updateRecurring: vi.fn(),
  deleteRecurring: vi.fn(),
}))

const service = vi.mocked(monthsService)

const defaultYear = '2024'
const defaultMonth = '05'

function createPropsStub(testId: string, propKeys: string[] = []) {
  return defineComponent({
    name: `${testId}Stub`,
    props: propKeys,
    setup(props: Record<string, unknown>) {
      return () => h('div', { 'data-testid': testId }, JSON.stringify(props))
    },
  })
}

vi.mock('@/components/PeriodSelector.vue', () => ({
  default: createPropsStub('period-selector-stub'),
}))

vi.mock('@/components/month/MonthDataForm.vue', () => ({
  default: createPropsStub('month-data-form', ['income']),
}))

vi.mock('@/components/month/CalendarForm.vue', () => ({
  default: createPropsStub('calendar-form', ['calendar']),
}))

vi.mock('@/components/month/EntriesTable.vue', () => ({
  default: createPropsStub('entries-table', ['entries']),
}))

vi.mock('@/components/month/SavingsForm.vue', () => ({
  default: createPropsStub('savings-form', ['movements']),
}))

vi.mock('@/components/month/LoansForm.vue', () => ({
  default: createPropsStub('loans-form', ['feitos', 'recebidos']),
}))

function createMonthData(overrides?: Partial<MonthData>): MonthData {
  return {
    dados: {
      adiantamento: 0,
      pagamento: 0,
      total_liquido: 0,
      ...(overrides?.dados ?? {}),
    },
    calendario: {
      pagamentos: [],
      fechamento_fatura: null,
      ...(overrides?.calendario ?? {}),
    },
    entradas_saidas: overrides?.entradas_saidas ?? [],
    contas_recorrentes_pre_fatura:
      overrides?.contas_recorrentes_pre_fatura ?? [],
    contas_recorrentes_pos_fatura:
      overrides?.contas_recorrentes_pos_fatura ?? [],
    poupanca: overrides?.poupanca ?? { movimentos: [] },
    emprestimos:
      overrides?.emprestimos ?? { feitos: [], recebidos: [] },
  }
}

function mountMonthlyPage(pinia: Pinia) {
  return mount(MonthlyPage, { global: { plugins: [pinia] } })
}

type MonthlyPageWrapper = ReturnType<typeof mountMonthlyPage>

function readStubProps(wrapper: MonthlyPageWrapper, testId: string) {
  const target = wrapper.get(`[data-testid="${testId}"]`)
  return JSON.parse(target.text() || '{}')
}

describe('MonthlyPage', () => {
  let pinia: Pinia
  let periodStore: ReturnType<typeof usePeriodStore>
  let monthStore: ReturnType<typeof useMonthStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()

    periodStore = usePeriodStore()
    periodStore.setPeriod(defaultYear, defaultMonth)

    monthStore = useMonthStore()
    monthStore.$reset()

    service.fetchMonth.mockResolvedValue(createMonthData())
  })

  it('fetches month data on mount and whenever the year or month changes', async () => {
    const fetchSpy = vi.spyOn(monthStore, 'fetchMonth')
    mountMonthlyPage(pinia)
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(defaultYear, defaultMonth)

    fetchSpy.mockClear()
    periodStore.setYear('2025')
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2025', defaultMonth)

    fetchSpy.mockClear()
    periodStore.setMonth('08')
    await flushPromises()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2025', '08')
  })

  it('reloads the month on demand and disables the button while loading', async () => {
    const fetchSpy = vi.spyOn(monthStore, 'fetchMonth')
    const wrapper = mountMonthlyPage(pinia)
    await flushPromises()

    fetchSpy.mockClear()
    const reloadButton = wrapper.get('button')

    await reloadButton.trigger('click')
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(defaultYear, defaultMonth)

    monthStore.loading = true
    await nextTick()
    expect((reloadButton.element as HTMLButtonElement).disabled).toBe(true)

    monthStore.loading = false
    await nextTick()
    expect((reloadButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('renders error, loading and empty states', async () => {
    const wrapper = mountMonthlyPage(pinia)
    await flushPromises()

    monthStore.error = 'erro geral do mes'
    await nextTick()
    expect(wrapper.text()).toContain('erro geral do mes')

    monthStore.error = null
    monthStore.loading = true
    await nextTick()
    expect(wrapper.text()).toContain('Carregando dados reais do mes...')

    monthStore.loading = false
    monthStore.month = null
    await nextTick()
    expect(wrapper.text()).toContain('Nenhum dado retornado para o periodo')
  })

  it('forwards month data to every editable block and shows the recurrents notice', async () => {
    const wrapper = mountMonthlyPage(pinia)
    await flushPromises()

    const monthData = createMonthData({
      dados: { adiantamento: 200, pagamento: 800, total_liquido: 1000 },
      calendario: {
        pagamentos: ['2024-05-05'],
        fechamento_fatura: '2024-05-20',
      },
      entradas_saidas: [
        {
          id: 'mov-1',
          data: '2024-05-02',
          valor: -50,
          descricao: 'Mercado',
          categoria: 'Casa',
          tags: ['essencial'],
          parcela: null,
        },
      ],
      poupanca: {
        movimentos: [
          {
            id: 'sav-1',
            data: '2024-05-03',
            valor: 150,
            descricao: 'Aporte',
            tipo: 'aporte',
          },
        ],
      },
      emprestimos: {
        feitos: [
          {
            id: 'loan-1',
            data: '2024-05-04',
            valor: 300,
            descricao: 'Emprestimo feito',
          },
        ],
        recebidos: [
          {
            id: 'loan-2',
            data: '2024-05-10',
            valor: 200,
            descricao: 'Emprestimo recebido',
          },
        ],
      },
    })

    monthStore.month = monthData
    await nextTick()

    expect(readStubProps(wrapper, 'month-data-form').income).toEqual(
      monthData.dados
    )
    expect(readStubProps(wrapper, 'calendar-form').calendar).toEqual(
      monthData.calendario
    )
    expect(readStubProps(wrapper, 'entries-table').entries).toEqual(
      monthData.entradas_saidas
    )
    expect(readStubProps(wrapper, 'savings-form').movements).toEqual(
      monthData.poupanca.movimentos
    )
    expect(readStubProps(wrapper, 'loans-form').feitos).toEqual(
      monthData.emprestimos.feitos
    )
    expect(readStubProps(wrapper, 'loans-form').recebidos).toEqual(
      monthData.emprestimos.recebidos
    )
    expect(wrapper.text()).toContain('Recorrentes')
  })

  it('updates the derived lists whenever the month reference changes', async () => {
    const wrapper = mountMonthlyPage(pinia)
    await flushPromises()

    const firstData = createMonthData({
      entradas_saidas: [
        {
          id: 'mov-a',
          data: '2024-05-01',
          valor: 100,
          descricao: 'Pagamento',
          categoria: null,
          tags: [],
          parcela: null,
        },
      ],
      poupanca: {
        movimentos: [
          {
            id: 'sav-a',
            data: '2024-05-02',
            valor: 50,
            descricao: 'Aporte inicial',
            tipo: 'aporte',
          },
        ],
      },
      emprestimos: {
        feitos: [
          {
            id: 'loan-a',
            data: '2024-05-03',
            valor: 75,
            descricao: 'Emprestimo curto',
          },
        ],
        recebidos: [],
      },
    })

    const updatedData = createMonthData({
      entradas_saidas: [
        {
          id: 'mov-b',
          data: '2024-06-01',
          valor: -25,
          descricao: 'Conta',
          categoria: null,
          tags: [],
          parcela: null,
        },
        {
          id: 'mov-c',
          data: '2024-06-02',
          valor: 300,
          descricao: 'Bonus',
          categoria: null,
          tags: [],
          parcela: null,
        },
      ],
      poupanca: {
        movimentos: [
          {
            id: 'sav-b',
            data: '2024-06-05',
            valor: 200,
            descricao: 'Aporte maior',
            tipo: 'aporte',
          },
          {
            id: 'sav-c',
            data: '2024-06-10',
            valor: -100,
            descricao: 'Resgate',
            tipo: 'resgate',
          },
        ],
      },
      emprestimos: {
        feitos: [],
        recebidos: [
          {
            id: 'loan-b',
            data: '2024-06-07',
            valor: 120,
            descricao: 'Emprestimo recebido',
          },
        ],
      },
    })

    monthStore.month = firstData
    await nextTick()
    expect(readStubProps(wrapper, 'entries-table').entries).toEqual(
      firstData.entradas_saidas
    )
    expect(readStubProps(wrapper, 'savings-form').movements).toEqual(
      firstData.poupanca.movimentos
    )
    expect(readStubProps(wrapper, 'loans-form').feitos).toEqual(
      firstData.emprestimos.feitos
    )
    expect(readStubProps(wrapper, 'loans-form').recebidos).toEqual(
      firstData.emprestimos.recebidos
    )

    monthStore.month = updatedData
    await nextTick()

    expect(readStubProps(wrapper, 'entries-table').entries).toEqual(
      updatedData.entradas_saidas
    )
    expect(readStubProps(wrapper, 'savings-form').movements).toEqual(
      updatedData.poupanca.movimentos
    )
    expect(readStubProps(wrapper, 'loans-form').feitos).toEqual(
      updatedData.emprestimos.feitos
    )
    expect(readStubProps(wrapper, 'loans-form').recebidos).toEqual(
      updatedData.emprestimos.recebidos
    )
  })
})

