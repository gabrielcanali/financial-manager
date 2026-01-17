import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import EntriesTable from '../EntriesTable.vue'
import { useMonthDataLoader } from '@/composables/useMonthDataLoader'
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

function buildMonthData(overrides?: Partial<MonthData>): MonthData {
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

describe('EntriesTable refreshAfterSuccess flow', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    usePeriodStore().setPeriod('2024', '01')
  })

  it('recarrega o mes via loader apos excluir um lancamento', async () => {
    const initialMonth = buildMonthData({
      entradas_saidas: [
        {
          id: 'e1',
          descricao: 'Mercado',
          valor: -10,
          data: '2024-01-02',
          categoria: null,
          parcela: null,
          tags: [],
        },
      ],
    })
    const refreshedMonth = buildMonthData({ entradas_saidas: [] })

    service.fetchMonth.mockResolvedValueOnce(initialMonth)
    service.deleteEntry.mockResolvedValueOnce(undefined)
    service.fetchMonth.mockResolvedValueOnce(refreshedMonth)

    const Wrapper = defineComponent({
      name: 'EntriesTableRefreshWrapper',
      setup() {
        const loader = useMonthDataLoader()
        const entries = computed(
          () => loader.monthData.value?.entradas_saidas ?? []
        )
        return () => h(EntriesTable, { entries: entries.value })
      },
    })

    const wrapper = mount(Wrapper, {
      global: { plugins: [pinia] },
    })

    await flushPromises()
    expect(service.fetchMonth).toHaveBeenCalledTimes(1)
    expect(service.fetchMonth).toHaveBeenCalledWith('2024', '01')
    expect(wrapper.text()).toContain('Mercado')

    const deleteButton = wrapper
      .findAll('button')
      .find((node) => node.text() === 'Excluir')
    expect(deleteButton).toBeTruthy()

    await deleteButton!.trigger('click')
    await flushPromises()
    await nextTick()

    expect(service.deleteEntry).toHaveBeenCalledTimes(1)
    expect(service.deleteEntry).toHaveBeenCalledWith('2024', '01', 'e1')
    expect(service.fetchMonth).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('Mercado')
  })
})
