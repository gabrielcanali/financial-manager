import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, reactive } from 'vue'
import { usePeriodStore } from '@/stores/periodStore'
import type {
  LoansPayload,
  MonthCalendar,
  MonthIncomeData,
  MovementPayload,
  RecurringMovementPayload,
  RecurringPeriodParam,
  SavingsPayload,
} from '@/types/schema'
import type {
  EntryUpdatePayload,
  RecurringUpdatePayload,
} from '@/services/monthsService'

type MonthStoreMock = {
  savingByTarget: TargetState<boolean>
  errorsByTarget: TargetState<string | null>
  saveMonthData: ReturnType<typeof vi.fn>
  saveCalendar: ReturnType<typeof vi.fn>
  saveSavings: ReturnType<typeof vi.fn>
  saveLoans: ReturnType<typeof vi.fn>
  addEntry: ReturnType<typeof vi.fn>
  updateEntry: ReturnType<typeof vi.fn>
  deleteEntry: ReturnType<typeof vi.fn>
  addRecurring: ReturnType<typeof vi.fn>
  updateRecurring: ReturnType<typeof vi.fn>
  deleteRecurring: ReturnType<typeof vi.fn>
}

const TARGETS = [
  'income',
  'calendar',
  'entries',
  'recurrents',
  'savings',
  'loans',
] as const

type TargetKey = (typeof TARGETS)[number]
type TargetState<T> = Record<TargetKey, T>

let monthStoreStub: MonthStoreMock

vi.mock('@/stores/monthStore', () => ({
  useMonthStore: () => monthStoreStub,
}))

import { useMonthFormActions } from '../useMonthFormActions'

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

const entryPayload: MovementPayload = {
  descricao: 'Mercado',
  valor: -100,
  data: '2024-01-03',
  categoria: 'Casa',
  parcela: null,
  tags: ['casa'],
}

const entryUpdatePayload: EntryUpdatePayload = {
  descricao: 'Mercado atualizado',
}

const recurringPayload: RecurringMovementPayload = {
  descricao: 'Academia',
  valor: -80,
  data: '2024-01-04',
  categoria: 'Saude',
  tags: ['fixo'],
  recorrencia: { tipo: 'mensal', termina_em: '2024-12' },
}

const recurringUpdatePayload: RecurringUpdatePayload = {
  valor: -90,
}

const recurringPeriod: RecurringPeriodParam = 'pre'

let periodStore: ReturnType<typeof usePeriodStore>

describe('useMonthFormActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    monthStoreStub = createMonthStoreMock()
    periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '01')
    vi.clearAllMocks()
  })

  it('exibe refs year/month sincronizados com o periodStore', async () => {
    const actions = useMonthFormActions()

    expect(actions.year.value).toBe('2024')
    expect(actions.month.value).toBe('01')

    periodStore.setMonth('02')
    await nextTick()
    expect(actions.month.value).toBe('02')
  })

  it('informa o estado de salvamento por alvo via isSaving', async () => {
    const actions = useMonthFormActions()
    const savingEntries = actions.isSaving('entries')

    expect(savingEntries.value).toBe(false)
    monthStoreStub.savingByTarget.entries = true
    await nextTick()
    expect(savingEntries.value).toBe(true)
  })

  it('informa erros segmentados com actionErrorFor', async () => {
    const actions = useMonthFormActions()
    const errorEntries = actions.actionErrorFor('entries')

    expect(errorEntries.value).toBeNull()
    monthStoreStub.errorsByTarget.entries = 'falhou entradas'
    await nextTick()
    expect(errorEntries.value).toBe('falhou entradas')
  })

  it('executa onPeriodChange apenas quando ano/mes mudam', async () => {
    const actions = useMonthFormActions()
    const callback = vi.fn()
    actions.onPeriodChange(callback)

    await nextTick()
    expect(callback).not.toHaveBeenCalled()

    periodStore.setYear('2025')
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)

    periodStore.setYear('2025')
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(1)

    periodStore.setMonth('03')
    await nextTick()
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('encaminha chamadas diretas para os metodos do monthStore', async () => {
    const actions = useMonthFormActions()

    const expectations: Array<{
      trigger: () => Promise<unknown>
      mock: ReturnType<typeof vi.fn>
      args: unknown[]
      label: string
    }> = [
      {
        trigger: () => actions.saveIncome(incomePayload),
        mock: monthStoreStub.saveMonthData,
        args: [incomePayload],
        label: 'saveIncome',
      },
      {
        trigger: () => actions.saveCalendar(calendarPayload),
        mock: monthStoreStub.saveCalendar,
        args: [calendarPayload],
        label: 'saveCalendar',
      },
      {
        trigger: () => actions.saveSavings(savingsPayload),
        mock: monthStoreStub.saveSavings,
        args: [savingsPayload],
        label: 'saveSavings',
      },
      {
        trigger: () => actions.saveLoans(loansPayload),
        mock: monthStoreStub.saveLoans,
        args: [loansPayload],
        label: 'saveLoans',
      },
      {
        trigger: () => actions.deleteEntry('entry-1'),
        mock: monthStoreStub.deleteEntry,
        args: ['entry-1'],
        label: 'deleteEntry',
      },
      {
        trigger: () => actions.deleteRecurring('pos', 'rec-1'),
        mock: monthStoreStub.deleteRecurring,
        args: ['pos', 'rec-1'],
        label: 'deleteRecurring',
      },
    ]

    for (const item of expectations) {
      const result = { handler: item.label }
      item.mock.mockResolvedValue(result)
      await expect(item.trigger()).resolves.toBe(result)
      expect(item.mock).toHaveBeenLastCalledWith(...item.args)
    }
  })

  it('propaga opcoes de entradas e atualizacoes', async () => {
    const actions = useMonthFormActions()
    const entryResult = { handler: 'addEntry' }
    const updateResult = { handler: 'updateEntry' }

    monthStoreStub.addEntry.mockResolvedValue(entryResult)
    await expect(
      actions.addEntry(entryPayload, { generateFuture: true })
    ).resolves.toBe(entryResult)
    expect(monthStoreStub.addEntry).toHaveBeenCalledWith(entryPayload, {
      generateFuture: true,
    })

    monthStoreStub.updateEntry.mockResolvedValue(updateResult)
    await expect(
      actions.updateEntry('entry-2', entryUpdatePayload, { cascade: true })
    ).resolves.toBe(updateResult)
    expect(monthStoreStub.updateEntry).toHaveBeenCalledWith(
      'entry-2',
      entryUpdatePayload,
      { cascade: true }
    )
  })

  it('propaga operacoes de recorrentes com periodos e flags', async () => {
    const actions = useMonthFormActions()
    const addResult = { handler: 'addRecurring' }
    const updateResult = { handler: 'updateRecurring' }

    monthStoreStub.addRecurring.mockResolvedValue(addResult)
    await expect(
      actions.addRecurring(recurringPeriod, recurringPayload, {
        generateFuture: false,
      })
    ).resolves.toBe(addResult)
    expect(monthStoreStub.addRecurring).toHaveBeenCalledWith(
      recurringPeriod,
      recurringPayload,
      { generateFuture: false }
    )

    monthStoreStub.updateRecurring.mockResolvedValue(updateResult)
    await expect(
      actions.updateRecurring(
        'pos',
        'rec-9',
        recurringUpdatePayload,
        { cascade: false }
      )
    ).resolves.toBe(updateResult)
    expect(monthStoreStub.updateRecurring).toHaveBeenCalledWith(
      'pos',
      'rec-9',
      recurringUpdatePayload,
      { cascade: false }
    )
  })
})

function createMonthStoreMock(): MonthStoreMock {
  return {
    savingByTarget: reactive(createTargetState(false)),
    errorsByTarget: reactive(createTargetState<string | null>(null)),
    saveMonthData: vi.fn(),
    saveCalendar: vi.fn(),
    saveSavings: vi.fn(),
    saveLoans: vi.fn(),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    addRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    deleteRecurring: vi.fn(),
  }
}

function createTargetState<T>(value: T): TargetState<T> {
  return TARGETS.reduce((acc, target) => {
    acc[target] = value
    return acc
  }, {} as TargetState<T>)
}
