import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  defineComponent,
  h,
  nextTick,
  type PropType,
} from 'vue'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import RecurrentsPage from '../RecurrentsPage.vue'
import { formatCurrency } from '@/utils/formatters'
import { useMonthStore } from '@/stores/monthStore'
import { usePeriodStore } from '@/stores/periodStore'
import type { MonthData, RecurringMovement } from '@/types/schema'
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

vi.mock('@/components/PeriodSelector.vue', () => ({
  default: defineComponent({
    name: 'PeriodSelectorStub',
    setup() {
      return () =>
        h('div', { 'data-testid': 'period-selector-stub' }, 'Period selector')
    },
  }),
}))

vi.mock('@/components/month/RecurringForm.vue', () => ({
  default: defineComponent({
    name: 'RecurringFormStub',
    props: {
      title: { type: String, required: true },
      period: { type: String, required: true },
      items: {
        type: Array as PropType<RecurringMovement[]>,
        required: true,
      },
    },
    setup(props) {
      return () =>
        h(
          'section',
          {
            class: 'recurring-form-stub',
            'data-testid': `recurring-form-${props.period}`,
          },
          [
            h('h3', props.title),
            h('p', props.period),
            h(
              'ul',
              props.items.map((item) =>
                h('li', { class: 'recurring-item' }, item.descricao)
              )
            ),
          ]
        )
    },
  }),
}))

function mountRecurrentsPage(pinia: Pinia) {
  return mount(RecurrentsPage, { global: { plugins: [pinia] } })
}

function createRecurringMovement(
  id: string,
  descricao: string,
  valor: number
): RecurringMovement {
  return {
    id,
    descricao,
    valor,
    data: '2024-01-05',
    categoria: null,
    tags: [],
    recorrencia: null,
  }
}

function createMonthData(overrides?: Partial<MonthData>): MonthData {
  return {
    dados: { adiantamento: 0, pagamento: 0, total_liquido: 0 },
    calendario: { pagamentos: [], fechamento_fatura: null },
    entradas_saidas: [],
    contas_recorrentes_pre_fatura: [],
    contas_recorrentes_pos_fatura: [],
    poupanca: { movimentos: [] },
    emprestimos: { feitos: [], recebidos: [] },
    ...overrides,
  }
}

describe('RecurrentsPage', () => {
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

  it('fetches month on mount and whenever the year or month changes', async () => {
    const fetchSpy = vi.spyOn(monthStore, 'fetchMonth')
    mountRecurrentsPage(pinia)
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

  it('allows manual refreshes and disables the button when loading', async () => {
    const fetchSpy = vi.spyOn(monthStore, 'fetchMonth')
    const wrapper = mountRecurrentsPage(pinia)
    await flushPromises()

    fetchSpy.mockClear()
    const reloadButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Recarregar recorrentes'))
    expect(reloadButton).toBeTruthy()

    await reloadButton!.trigger('click')
    await flushPromises()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith(defaultYear, defaultMonth)

    monthStore.loading = true
    await nextTick()
    expect(reloadButton!.attributes('disabled')).toBeDefined()
  })

  it('renders loading, error and empty states', async () => {
    const wrapper = mountRecurrentsPage(pinia)
    await flushPromises()

    monthStore.month = null
    await nextTick()
    expect(wrapper.text()).toContain('Nenhum retorno foi encontrado')

    monthStore.error = 'falhou recorrentes'
    await nextTick()
    expect(wrapper.text()).toContain('falhou recorrentes')

    monthStore.error = null
    monthStore.loading = true
    await nextTick()
    expect(wrapper.text()).toContain('Sincronizando com')

    monthStore.loading = false
    monthStore.month = null
    await nextTick()
    expect(wrapper.text()).toContain('Nenhum retorno foi encontrado')
  })

  it('shows totals and forwards recurring lists to each RecurringForm', async () => {
    const wrapper = mountRecurrentsPage(pinia)
    await flushPromises()

    monthStore.month = createMonthData({
      contas_recorrentes_pre_fatura: [
        createRecurringMovement('pre-1', 'Mensalidade academia', -80),
        createRecurringMovement('pre-2', 'Bonus', 150),
      ],
      contas_recorrentes_pos_fatura: [
        createRecurringMovement('pos-1', 'Streaming', -500),
        createRecurringMovement('pos-2', 'Cashback', 50),
      ],
    })
    await nextTick()

    expect(wrapper.text()).toContain(formatCurrency(200))
    expect(wrapper.text()).toContain(formatCurrency(-580))
    expect(wrapper.text()).toContain(formatCurrency(-380))

    const preForm = wrapper.get('[data-testid="recurring-form-pre"]')
    expect(preForm.text()).toContain('Recorrentes pre fatura')
    expect(preForm.text()).toContain('Mensalidade academia')
    expect(preForm.text()).toContain('Bonus')

    const posForm = wrapper.get('[data-testid="recurring-form-pos"]')
    expect(posForm.text()).toContain('Recorrentes pos fatura')
    expect(posForm.text()).toContain('Streaming')
    expect(posForm.text()).toContain('Cashback')

    expect(wrapper.text()).not.toContain('Nenhum recorrente foi cadastrado')
  })

  it('shows the empty recurrents notice when month data exists without items', async () => {
    const wrapper = mountRecurrentsPage(pinia)
    await flushPromises()

    monthStore.month = createMonthData()
    await nextTick()

    expect(wrapper.text()).not.toContain('Nenhum retorno foi encontrado')
    expect(wrapper.text()).toContain(
      'Nenhum recorrente foi cadastrado para este mes'
    )
  })
})

