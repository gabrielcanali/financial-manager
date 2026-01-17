import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMonthStore } from '../monthStore'
import { usePeriodStore } from '@/stores/periodStore'
import * as monthsService from '@/services/monthsService'
import type {
  LoansPayload,
  MonthCalendar,
  MonthData,
  MonthIncomeData,
  MovementPayload,
  RecurringMovementPayload,
  SavingsPayload,
} from '@/types/schema'

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

const incomePayload: MonthIncomeData = {
  adiantamento: 100,
  pagamento: 900,
  total_liquido: 1000,
}

const calendarPayload: MonthCalendar = {
  pagamentos: ['2024-01-05'],
  fechamento_fatura: '2024-01-10',
}

const savingsPayload: SavingsPayload = {
  movimentos: [
    { data: '2024-01-01', valor: 200, descricao: 'Aporte', tipo: 'aporte' },
  ],
}

const loansPayload: LoansPayload = {
  feitos: [{ data: '2024-01-02', valor: 500, descricao: 'Emprestimo' }],
  recebidos: [],
}

const movementPayload: MovementPayload = {
  descricao: 'Compra',
  valor: 150,
  data: '2024-01-03',
  categoria: 'Mercado',
  parcela: '1/3',
  tags: ['casa'],
}

const recurringPayload: RecurringMovementPayload = {
  descricao: 'Academia',
  valor: -80,
  data: '2024-01-04',
  categoria: 'Saude',
  tags: ['fixo'],
  recorrencia: { tipo: 'mensal', termina_em: '2024-12' },
}

function buildMonthData(overrides?: Partial<MonthData>): MonthData {
  return {
    dados: {
      adiantamento: 10,
      pagamento: 100,
      total_liquido: 110,
    },
    calendario: { pagamentos: [], fechamento_fatura: null },
    entradas_saidas: [],
    contas_recorrentes_pre_fatura: [],
    contas_recorrentes_pos_fatura: [],
    poupanca: { movimentos: [] },
    emprestimos: { feitos: [], recebidos: [] },
    ...overrides,
  }
}

const defaultYear = '2024'
const defaultMonth = '01'

describe('monthStore saving actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const periodStore = usePeriodStore()
    periodStore.setPeriod(defaultYear, defaultMonth)
  })

  it('salva dados mensais e reseta flags em caso de sucesso', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      dados: { adiantamento: 200, pagamento: 800, total_liquido: 1000 },
    })
    service.updateMonthData.mockResolvedValue(updatedMonth)

    const promise = store.saveMonthData(incomePayload)
    expect(store.savingByTarget.income).toBe(true)
    expect(store.errorsByTarget.income).toBeNull()

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.updateMonthData).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      incomePayload
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.error).toBeNull()
    expect(store.errorsByTarget.income).toBeNull()
    expect(store.savingByTarget.income).toBe(false)
  })

  it('marca erro ao falhar ao salvar dados mensais', async () => {
    const store = useMonthStore()
    service.updateMonthData.mockRejectedValue(new Error('falhou dados'))

    const promise = store.saveMonthData(incomePayload)
    expect(store.savingByTarget.income).toBe(true)

    await expect(promise).rejects.toThrow('falhou dados')
    expect(store.savingByTarget.income).toBe(false)
    expect(store.error).toBe('falhou dados')
    expect(store.errorsByTarget.income).toBe('falhou dados')
    expect(store.month).toBeNull()
  })

  it('atualiza calendario com sucesso', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({ calendario: calendarPayload })
    service.updateMonthCalendar.mockResolvedValue(updatedMonth)

    const promise = store.saveCalendar(calendarPayload)
    expect(store.savingByTarget.calendar).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.updateMonthCalendar).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      calendarPayload
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.calendar).toBeNull()
    expect(store.savingByTarget.calendar).toBe(false)
  })

  it('marca erro ao salvar calendario', async () => {
    const store = useMonthStore()
    service.updateMonthCalendar.mockRejectedValue(new Error('falhou calendario'))

    const promise = store.saveCalendar(calendarPayload)
    expect(store.savingByTarget.calendar).toBe(true)

    await expect(promise).rejects.toThrow('falhou calendario')
    expect(store.savingByTarget.calendar).toBe(false)
    expect(store.error).toBe('falhou calendario')
    expect(store.errorsByTarget.calendar).toBe('falhou calendario')
  })

  it('atualiza poupanca e limpa erros', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      poupanca: { movimentos: [{ id: 's1', ...savingsPayload.movimentos[0] }] },
    })
    service.setMonthSavings.mockResolvedValue(updatedMonth)

    const promise = store.saveSavings(savingsPayload)
    expect(store.savingByTarget.savings).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.setMonthSavings).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      savingsPayload
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.savings).toBeNull()
    expect(store.savingByTarget.savings).toBe(false)
  })

  it('marca alvo ao falhar ao salvar poupanca', async () => {
    const store = useMonthStore()
    service.setMonthSavings.mockRejectedValue(new Error('falhou poupanca'))

    const promise = store.saveSavings(savingsPayload)
    expect(store.savingByTarget.savings).toBe(true)

    await expect(promise).rejects.toThrow('falhou poupanca')
    expect(store.savingByTarget.savings).toBe(false)
    expect(store.error).toBe('falhou poupanca')
    expect(store.errorsByTarget.savings).toBe('falhou poupanca')
  })

  it('atualiza emprestimos e reseta flags', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      emprestimos: {
        feitos: [{ id: 'l1', ...loansPayload.feitos[0] }],
        recebidos: [],
      },
    })
    service.setMonthLoans.mockResolvedValue(updatedMonth)

    const promise = store.saveLoans(loansPayload)
    expect(store.savingByTarget.loans).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.setMonthLoans).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      loansPayload
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.loans).toBeNull()
    expect(store.savingByTarget.loans).toBe(false)
  })

  it('marca erro ao falhar ao salvar emprestimos', async () => {
    const store = useMonthStore()
    service.setMonthLoans.mockRejectedValue(new Error('falhou emprestimos'))

    const promise = store.saveLoans(loansPayload)
    expect(store.savingByTarget.loans).toBe(true)

    await expect(promise).rejects.toThrow('falhou emprestimos')
    expect(store.savingByTarget.loans).toBe(false)
    expect(store.error).toBe('falhou emprestimos')
    expect(store.errorsByTarget.loans).toBe('falhou emprestimos')
  })

  it('adiciona lancamento e atualiza mes', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      entradas_saidas: [
        {
          id: 'e1',
          ...movementPayload,
          categoria: movementPayload.categoria ?? null,
          parcela: movementPayload.parcela ?? null,
          tags: movementPayload.tags ?? [],
        },
      ],
    })
    service.addEntry.mockResolvedValue(updatedMonth)

    const promise = store.addEntry(movementPayload, {
      generateFuture: true,
    })
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.addEntry).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      movementPayload,
      { generateFuture: true }
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.entries).toBeNull()
    expect(store.savingByTarget.entries).toBe(false)
  })

  it('marca erro ao falhar ao adicionar lancamento', async () => {
    const store = useMonthStore()
    service.addEntry.mockRejectedValue(new Error('falhou add'))

    const promise = store.addEntry(movementPayload, undefined)
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).rejects.toThrow('falhou add')
    expect(store.savingByTarget.entries).toBe(false)
    expect(store.error).toBe('falhou add')
    expect(store.errorsByTarget.entries).toBe('falhou add')
  })

  it('atualiza lancamento e mes com cascade opcional', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      entradas_saidas: [
        {
          id: 'e1',
          ...movementPayload,
          valor: 99,
          categoria: movementPayload.categoria ?? null,
          parcela: movementPayload.parcela ?? null,
          tags: movementPayload.tags ?? [],
        },
      ],
    })
    service.updateEntry.mockResolvedValue(updatedMonth)

    const promise = store.updateEntry('e1', movementPayload, {
      cascade: true,
    })
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.updateEntry).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      'e1',
      movementPayload,
      { cascade: true }
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.entries).toBeNull()
    expect(store.savingByTarget.entries).toBe(false)
  })

  it('marca erro ao falhar ao atualizar lancamento', async () => {
    const store = useMonthStore()
    service.updateEntry.mockRejectedValue(new Error('falhou update entrada'))

    const promise = store.updateEntry('e1', movementPayload, undefined)
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).rejects.toThrow('falhou update entrada')
    expect(store.savingByTarget.entries).toBe(false)
    expect(store.error).toBe('falhou update entrada')
    expect(store.errorsByTarget.entries).toBe('falhou update entrada')
  })

  it('remove lancamento e recarrega mes', async () => {
    const store = useMonthStore()
    service.deleteEntry.mockResolvedValue(undefined)
    expect(store.refreshAfterSuccessTick).toBe(0)

    const promise = store.deleteEntry('e1')
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).resolves.toBeUndefined()
    expect(service.deleteEntry).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      'e1'
    )
    expect(service.fetchMonth).not.toHaveBeenCalled()
    expect(store.refreshAfterSuccessTick).toBe(1)
    expect(store.errorsByTarget.entries).toBeNull()
    expect(store.savingByTarget.entries).toBe(false)
  })

  it('marca erro ao falhar na remocao de lancamento', async () => {
    const store = useMonthStore()
    service.deleteEntry.mockRejectedValue(new Error('falhou remover entrada'))
    expect(store.refreshAfterSuccessTick).toBe(0)

    const promise = store.deleteEntry('e1')
    expect(store.savingByTarget.entries).toBe(true)

    await expect(promise).rejects.toThrow('falhou remover entrada')
    expect(service.fetchMonth).not.toHaveBeenCalled()
    expect(store.refreshAfterSuccessTick).toBe(0)
    expect(store.savingByTarget.entries).toBe(false)
    expect(store.error).toBe('falhou remover entrada')
    expect(store.errorsByTarget.entries).toBe('falhou remover entrada')
  })

  it('adiciona recorrente e atualiza mes', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      contas_recorrentes_pre_fatura: [
        {
          id: 'r1',
          ...recurringPayload,
          categoria: recurringPayload.categoria ?? null,
          tags: recurringPayload.tags ?? [],
          recorrencia: recurringPayload.recorrencia ?? null,
        },
      ],
    })
    service.addRecurring.mockResolvedValue(updatedMonth)

    const promise = store.addRecurring('pre', recurringPayload, {
      generateFuture: true,
    })
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.addRecurring).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      'pre',
      recurringPayload,
      { generateFuture: true }
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.recurrents).toBeNull()
    expect(store.savingByTarget.recurrents).toBe(false)
  })

  it('marca erro ao falhar ao adicionar recorrente', async () => {
    const store = useMonthStore()
    service.addRecurring.mockRejectedValue(new Error('falhou add recorrente'))

    const promise = store.addRecurring('pre', recurringPayload, undefined)
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).rejects.toThrow('falhou add recorrente')
    expect(store.savingByTarget.recurrents).toBe(false)
    expect(store.error).toBe('falhou add recorrente')
    expect(store.errorsByTarget.recurrents).toBe('falhou add recorrente')
  })

  it('atualiza recorrente respeitando cascade', async () => {
    const store = useMonthStore()
    const updatedMonth = buildMonthData({
      contas_recorrentes_pos_fatura: [
        {
          id: 'r1',
          ...recurringPayload,
          valor: -120,
          categoria: recurringPayload.categoria ?? null,
          tags: recurringPayload.tags ?? [],
          recorrencia: recurringPayload.recorrencia ?? null,
        },
      ],
    })
    service.updateRecurring.mockResolvedValue(updatedMonth)

    const promise = store.updateRecurring('pos', 'r1', recurringPayload, {
      cascade: true,
    })
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).resolves.toEqual(updatedMonth)
    expect(service.updateRecurring).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      'pos',
      'r1',
      recurringPayload,
      { cascade: true }
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.errorsByTarget.recurrents).toBeNull()
    expect(store.savingByTarget.recurrents).toBe(false)
  })

  it('marca erro ao falhar ao atualizar recorrente', async () => {
    const store = useMonthStore()
    service.updateRecurring.mockRejectedValue(
      new Error('falhou update recorrente')
    )

    const promise = store.updateRecurring('pos', 'r1', recurringPayload, undefined)
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).rejects.toThrow('falhou update recorrente')
    expect(store.savingByTarget.recurrents).toBe(false)
    expect(store.error).toBe('falhou update recorrente')
    expect(store.errorsByTarget.recurrents).toBe('falhou update recorrente')
  })

  it('remove recorrente e recarrega mes', async () => {
    const store = useMonthStore()
    service.deleteRecurring.mockResolvedValue(undefined)
    expect(store.refreshAfterSuccessTick).toBe(0)

    const promise = store.deleteRecurring('pre', 'r1')
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).resolves.toBeUndefined()
    expect(service.deleteRecurring).toHaveBeenCalledWith(
      defaultYear,
      defaultMonth,
      'pre',
      'r1'
    )
    expect(service.fetchMonth).not.toHaveBeenCalled()
    expect(store.refreshAfterSuccessTick).toBe(1)
    expect(store.errorsByTarget.recurrents).toBeNull()
    expect(store.savingByTarget.recurrents).toBe(false)
  })

  it('marca erro ao falhar na remocao de recorrente', async () => {
    const store = useMonthStore()
    service.deleteRecurring.mockRejectedValue(
      new Error('falhou remover recorrente')
    )
    expect(store.refreshAfterSuccessTick).toBe(0)

    const promise = store.deleteRecurring('pre', 'r1')
    expect(store.savingByTarget.recurrents).toBe(true)

    await expect(promise).rejects.toThrow('falhou remover recorrente')
    expect(service.fetchMonth).not.toHaveBeenCalled()
    expect(store.refreshAfterSuccessTick).toBe(0)
    expect(store.savingByTarget.recurrents).toBe(false)
    expect(store.error).toBe('falhou remover recorrente')
    expect(store.errorsByTarget.recurrents).toBe('falhou remover recorrente')
  })

  it('lanca erro quando periodo nao esta selecionado', async () => {
    const store = useMonthStore()
    const periodStore = usePeriodStore()
    periodStore.$patch({ year: '', month: '' })
    service.updateMonthData.mockResolvedValue(buildMonthData())

    await expect(store.saveMonthData(incomePayload)).rejects.toThrow(
      'Periodo nao selecionado'
    )
    expect(service.updateMonthData).not.toHaveBeenCalled()
    expect(store.savingByTarget.income).toBe(false)
  })

  describe('fetchMonth', () => {
    it('atualiza loading, month e flags ao buscar com sucesso', async () => {
      const store = useMonthStore()
      store.error = 'erro anterior'
      store.errorsByTarget.entries = 'erro pendente'
      const fetchedMonth = buildMonthData({
        dados: { adiantamento: 300, pagamento: 700, total_liquido: 1000 },
      })
      service.fetchMonth.mockResolvedValue(fetchedMonth)

      const promise = store.fetchMonth('2025', '02')
      expect(store.loading).toBe(true)
      expect(store.error).toBeNull()
      expect(store.errorsByTarget.entries).toBeNull()

      await expect(promise).resolves.toEqual(fetchedMonth)
      expect(service.fetchMonth).toHaveBeenCalledWith('2025', '02')
      expect(store.month).toEqual(fetchedMonth)
      expect(store.loading).toBe(false)
    })

    it('propaga erro ao falhar e preserva mes atual', async () => {
      const store = useMonthStore()
      const previousMonth = buildMonthData({
        dados: { adiantamento: 50, pagamento: 950, total_liquido: 1000 },
      })
      store.month = previousMonth
      service.fetchMonth.mockRejectedValue(new Error('falhou fetch mes'))

      const promise = store.fetchMonth('2025', '03')
      expect(store.loading).toBe(true)

      await expect(promise).rejects.toThrow('falhou fetch mes')
      expect(store.loading).toBe(false)
      expect(store.error).toBe('falhou fetch mes')
      expect(store.month).toEqual(previousMonth)
    })
  })

  describe('parametros opcionais de entradas e recorrentes', () => {
    it('propaga generateFuture=false ao adicionar lancamento', async () => {
      const store = useMonthStore()
      store.error = 'erro antigo'
      store.errorsByTarget.entries = 'erro antigo'
      const updatedMonth = buildMonthData({
        entradas_saidas: [
          {
            id: 'e2',
            ...movementPayload,
            categoria: movementPayload.categoria ?? null,
            parcela: movementPayload.parcela ?? null,
            tags: movementPayload.tags ?? [],
          },
        ],
      })
      service.addEntry.mockResolvedValue(updatedMonth)

      const promise = store.addEntry(movementPayload, {
        generateFuture: false,
      })
      expect(store.savingByTarget.entries).toBe(true)

      await expect(promise).resolves.toEqual(updatedMonth)
      expect(service.addEntry).toHaveBeenCalledWith(
        defaultYear,
        defaultMonth,
        movementPayload,
        { generateFuture: false }
      )
      expect(store.month).toEqual(updatedMonth)
      expect(store.errorsByTarget.entries).toBeNull()
      expect(store.savingByTarget.entries).toBe(false)
    })

    it('propaga generateFuture=false ao adicionar recorrente', async () => {
      const store = useMonthStore()
      store.errorsByTarget.recurrents = 'erro recorrente antigo'
      const updatedMonth = buildMonthData({
        contas_recorrentes_pre_fatura: [
          {
            id: 'r2',
            ...recurringPayload,
            categoria: recurringPayload.categoria ?? null,
            tags: recurringPayload.tags ?? [],
            recorrencia: recurringPayload.recorrencia ?? null,
          },
        ],
      })
      service.addRecurring.mockResolvedValue(updatedMonth)

      const promise = store.addRecurring('pre', recurringPayload, {
        generateFuture: false,
      })
      expect(store.savingByTarget.recurrents).toBe(true)

      await expect(promise).resolves.toEqual(updatedMonth)
      expect(service.addRecurring).toHaveBeenCalledWith(
        defaultYear,
        defaultMonth,
        'pre',
        recurringPayload,
        { generateFuture: false }
      )
      expect(store.month).toEqual(updatedMonth)
      expect(store.errorsByTarget.recurrents).toBeNull()
      expect(store.savingByTarget.recurrents).toBe(false)
    })

    it('propaga cascade=false ao atualizar lancamento', async () => {
      const store = useMonthStore()
      store.errorsByTarget.entries = 'erro update antigo'
      const updatedMonth = buildMonthData({
        entradas_saidas: [
          {
            id: 'e3',
            ...movementPayload,
            valor: 321,
            categoria: movementPayload.categoria ?? null,
            parcela: movementPayload.parcela ?? null,
            tags: movementPayload.tags ?? [],
          },
        ],
      })
      service.updateEntry.mockResolvedValue(updatedMonth)

      const promise = store.updateEntry('e3', movementPayload, {
        cascade: false,
      })
      expect(store.savingByTarget.entries).toBe(true)

      await expect(promise).resolves.toEqual(updatedMonth)
      expect(service.updateEntry).toHaveBeenCalledWith(
        defaultYear,
        defaultMonth,
        'e3',
        movementPayload,
        { cascade: false }
      )
      expect(store.month).toEqual(updatedMonth)
      expect(store.errorsByTarget.entries).toBeNull()
      expect(store.savingByTarget.entries).toBe(false)
    })

    it('propaga cascade=false ao atualizar recorrente', async () => {
      const store = useMonthStore()
      store.errorsByTarget.recurrents = 'erro update recorrente'
      const updatedMonth = buildMonthData({
        contas_recorrentes_pos_fatura: [
          {
            id: 'r3',
            ...recurringPayload,
            valor: -33,
            categoria: recurringPayload.categoria ?? null,
            tags: recurringPayload.tags ?? [],
            recorrencia: recurringPayload.recorrencia ?? null,
          },
        ],
      })
      service.updateRecurring.mockResolvedValue(updatedMonth)

      const promise = store.updateRecurring('pos', 'r3', recurringPayload, {
        cascade: false,
      })
      expect(store.savingByTarget.recurrents).toBe(true)

      await expect(promise).resolves.toEqual(updatedMonth)
      expect(service.updateRecurring).toHaveBeenCalledWith(
        defaultYear,
        defaultMonth,
        'pos',
        'r3',
        recurringPayload,
        { cascade: false }
      )
      expect(store.month).toEqual(updatedMonth)
      expect(store.errorsByTarget.recurrents).toBeNull()
      expect(store.savingByTarget.recurrents).toBe(false)
    })
  })

  it('mantem erros isolados por alvo mesmo quando outras acoes falham', async () => {
    const store = useMonthStore()
    service.addEntry.mockRejectedValue(new Error('erro unico entradas'))

    await expect(
      store.addEntry(movementPayload, undefined)
    ).rejects.toThrow(
      'erro unico entradas'
    )
    expect(store.errorsByTarget.entries).toBe('erro unico entradas')
    expect(store.errorsByTarget.recurrents).toBeNull()

    service.addRecurring.mockRejectedValue(
      new Error('erro unico recorrentes')
    )
    await expect(
      store.addRecurring('pre', recurringPayload, undefined)
    ).rejects.toThrow(
      'erro unico recorrentes'
    )
    expect(store.errorsByTarget.recurrents).toBe('erro unico recorrentes')
    expect(store.errorsByTarget.entries).toBe('erro unico entradas')
  })
})
