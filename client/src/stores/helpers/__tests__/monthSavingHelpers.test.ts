import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureSelectedPeriod,
  resolveCurrentPeriod,
  runSavingAction,
  createMonthAction,
  createSavingState,
  createErrorState,
  type MonthSavingState,
  type MonthStoreActionContext,
} from '../monthSavingHelpers'
import type { MonthData, MonthIncomeData } from '@/types/schema'
import * as periodStore from '@/stores/periodStore'
import * as monthsService from '@/services/monthsService'

const usePeriodStoreSpy = vi.spyOn(periodStore, 'usePeriodStore')
const updateMonthDataSpy = vi.spyOn(monthsService, 'updateMonthData')

type PeriodStoreInstance = ReturnType<typeof periodStore.usePeriodStore>

const defaultPeriod = { year: '2024', month: '05' } as const

const incomePayload: MonthIncomeData = {
  adiantamento: 100,
  pagamento: 900,
  total_liquido: 1000,
}

beforeEach(() => {
  vi.clearAllMocks()
  updateMonthDataSpy.mockReset()
  usePeriodStoreSpy.mockReturnValue({
    reference: `${defaultPeriod.year}-${defaultPeriod.month}`,
  } as PeriodStoreInstance)
})

describe('ensureSelectedPeriod', () => {
  it('retorna ano e mes quando referencia eh valida', () => {
    expect(ensureSelectedPeriod('2025-12')).toEqual({
      year: '2025',
      month: '12',
    })
  })

  it('lanca erro quando referencia esta vazia ou incompleta', () => {
    expect(() => ensureSelectedPeriod(undefined)).toThrow(
      'Periodo nao selecionado'
    )
    expect(() => ensureSelectedPeriod('2025')).toThrow(
      'Periodo nao selecionado'
    )
  })
})

describe('resolveCurrentPeriod', () => {
  it('usa reference do periodStore para montar parametros', () => {
    usePeriodStoreSpy.mockReturnValue({
      reference: '2031-07',
    } as PeriodStoreInstance)

    expect(resolveCurrentPeriod()).toEqual({ year: '2031', month: '07' })
    expect(usePeriodStoreSpy).toHaveBeenCalledTimes(1)
  })
})

describe('runSavingAction', () => {
  it('limpa erros antes de executar e reseta flag apos sucesso', async () => {
    const store = buildSavingState({
      error: 'erro antigo',
    })
    store.errorsByTarget.entries = 'erro pendente'

    const operation = vi.fn(async () => {
      expect(store.savingByTarget.entries).toBe(true)
      expect(store.error).toBeNull()
      expect(store.errorsByTarget.entries).toBeNull()
      return 'ok'
    })

    await expect(
      runSavingAction(store, 'entries', 'erro generico', operation)
    ).resolves.toBe('ok')

    expect(operation).toHaveBeenCalledTimes(1)
    expect(store.savingByTarget.entries).toBe(false)
    expect(store.error).toBeNull()
    expect(store.errorsByTarget.entries).toBeNull()
  })

  it('propaga erro e aplica mensagem fallback para erros desconhecidos', async () => {
    const store = buildSavingState({
      error: 'erro antigo',
    })
    store.errorsByTarget.entries = 'erro antigo'

    await expect(
      runSavingAction(store, 'entries', 'falhou salvar', async () => {
        throw 'raw failure'
      })
    ).rejects.toBe('raw failure')

    expect(store.savingByTarget.entries).toBe(false)
    expect(store.error).toBe('falhou salvar')
    expect(store.errorsByTarget.entries).toBe('falhou salvar')
  })
})

describe('createMonthAction', () => {
  it('resolve periodo atual, chama mesesService e atualiza mes por padrao', async () => {
    usePeriodStoreSpy.mockReturnValue({
      reference: '2026-11',
    } as PeriodStoreInstance)
    const updatedMonth = buildMonthData({
      dados: { adiantamento: 200, pagamento: 800, total_liquido: 1000 },
    })
    updateMonthDataSpy.mockResolvedValue(updatedMonth)
    const store = buildActionContext({
      error: 'erro global',
    })
    store.errorsByTarget.income = 'falha antiga'

    const action = createMonthAction({
      target: 'income',
      fallbackMessage: 'falhou salvar dados',
      run: (period, payload: MonthIncomeData) =>
        monthsService.updateMonthData(period.year, period.month, payload),
    })

    await expect(action.call(store, incomePayload)).resolves.toEqual(
      updatedMonth
    )

    expect(updateMonthDataSpy).toHaveBeenCalledWith(
      '2026',
      '11',
      incomePayload
    )
    expect(store.month).toEqual(updatedMonth)
    expect(store.error).toBeNull()
    expect(store.errorsByTarget.income).toBeNull()
    expect(store.savingByTarget.income).toBe(false)
  })

  it('aguarda onSuccess customizado e reaproveita fetchMonth', async () => {
    const refreshedMonth = buildMonthData({
      dados: { adiantamento: 999, pagamento: 1, total_liquido: 1000 },
    })
    const serviceResponse = buildMonthData({
      dados: { adiantamento: 150, pagamento: 850, total_liquido: 1000 },
    })
    updateMonthDataSpy.mockResolvedValue(serviceResponse)
    const store = buildActionContext({
      fetchMonth: vi.fn(async () => refreshedMonth) as MonthStoreActionContext['fetchMonth'],
    })
    const onSuccess = vi.fn(async (ctx: MonthStoreActionContext, result) => {
      expect(result).toEqual(serviceResponse)
      const reloaded = await ctx.fetchMonth(
        defaultPeriod.year,
        defaultPeriod.month
      )
      ctx.month = reloaded
    })

    const action = createMonthAction({
      target: 'income',
      fallbackMessage: 'falhou salvar dados',
      run: (period, payload: MonthIncomeData) =>
        monthsService.updateMonthData(period.year, period.month, payload),
      onSuccess,
    })

    await expect(action.call(store, incomePayload)).resolves.toEqual(
      serviceResponse
    )

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(store.fetchMonth).toHaveBeenCalledWith(
      defaultPeriod.year,
      defaultPeriod.month
    )
    expect(store.month).toEqual(refreshedMonth)
  })

  it('propaga erros do mesesService e mantem estado consistente', async () => {
    const store = buildActionContext({
      month: buildMonthData(),
    })
    store.errorsByTarget.income = 'erro anterior'
    const serviceError = new Error('servico indisponivel')
    updateMonthDataSpy.mockRejectedValue(serviceError)

    const action = createMonthAction({
      target: 'income',
      fallbackMessage: 'falhou salvar dados',
      run: (period, payload: MonthIncomeData) =>
        monthsService.updateMonthData(period.year, period.month, payload),
    })

    await expect(action.call(store, incomePayload)).rejects.toThrow(
      'servico indisponivel'
    )

    expect(updateMonthDataSpy).toHaveBeenCalledWith(
      defaultPeriod.year,
      defaultPeriod.month,
      incomePayload
    )
    expect(store.savingByTarget.income).toBe(false)
    expect(store.error).toBe('servico indisponivel')
    expect(store.errorsByTarget.income).toBe('servico indisponivel')
    expect(store.month).not.toBeNull()
  })
})

function buildSavingState(
  overrides: Partial<MonthSavingState> = {}
): MonthSavingState {
  return {
    savingByTarget: overrides.savingByTarget ?? createSavingState(),
    errorsByTarget: overrides.errorsByTarget ?? createErrorState(),
    error: overrides.error ?? null,
  }
}

function buildActionContext(
  overrides: Partial<MonthStoreActionContext> = {}
): MonthStoreActionContext {
  const baseState = buildSavingState(overrides)
  return {
    ...baseState,
    month: overrides.month ?? null,
    refreshAfterSuccess: overrides.refreshAfterSuccess ?? vi.fn(),
    fetchMonth:
      overrides.fetchMonth ??
      (vi.fn(
        async () => buildMonthData()
      ) as MonthStoreActionContext['fetchMonth']),
  }
}

function buildMonthData(overrides: Partial<MonthData> = {}): MonthData {
  return {
    dados: {
      adiantamento: 0,
      pagamento: 0,
      total_liquido: 0,
      ...(overrides.dados ?? {}),
    },
    calendario: {
      pagamentos: [],
      fechamento_fatura: null,
      ...(overrides.calendario ?? {}),
    },
    entradas_saidas: overrides.entradas_saidas ?? [],
    contas_recorrentes_pre_fatura:
      overrides.contas_recorrentes_pre_fatura ?? [],
    contas_recorrentes_pos_fatura:
      overrides.contas_recorrentes_pos_fatura ?? [],
    poupanca: overrides.poupanca ?? { movimentos: [] },
    emprestimos: overrides.emprestimos ?? { feitos: [], recebidos: [] },
  }
}
