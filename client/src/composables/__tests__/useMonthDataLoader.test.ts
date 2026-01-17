import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick } from 'vue'
import { useMonthDataLoader } from '../useMonthDataLoader'
import { useMonthStore } from '@/stores/monthStore'
import { usePeriodStore } from '@/stores/periodStore'
import type { MonthData } from '@/types/schema'

function buildMonthData(overrides?: Partial<MonthData>): MonthData {
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

describe('useMonthDataLoader', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('carrega o mes atual imediatamente e reage a mudancas de periodo', async () => {
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '05')
    const monthStore = useMonthStore()
    const fetchSpy = vi
      .spyOn(monthStore, 'fetchMonth')
      .mockResolvedValue(buildMonthData())

    const scope = effectScope()
    const loader = scope.run(() => useMonthDataLoader())

    await nextTick()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2024', '05')

    fetchSpy.mockClear()
    periodStore.setYear('2025')
    await nextTick()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2025', '05')

    fetchSpy.mockClear()
    periodStore.setMonth('08')
    await nextTick()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2025', '08')

    fetchSpy.mockClear()
    await loader?.refreshCurrentMonth()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2025', '08')

    scope.stop()
  })

  it('recarrega o periodo atual quando o store dispara refreshAfterSuccess', async () => {
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '03')
    const monthStore = useMonthStore()
    const fetchSpy = vi
      .spyOn(monthStore, 'fetchMonth')
      .mockResolvedValue(buildMonthData())

    const scope = effectScope()
    scope.run(() => useMonthDataLoader())

    await nextTick()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    fetchSpy.mockClear()

    monthStore.refreshAfterSuccess()
    await nextTick()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2024', '03')

    scope.stop()
  })

  it('permite desativar o carregamento imediato e so executa quando chamado', async () => {
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '03')
    const monthStore = useMonthStore()
    const fetchSpy = vi
      .spyOn(monthStore, 'fetchMonth')
      .mockResolvedValue(buildMonthData())

    const scope = effectScope()
    const loader = scope.run(() =>
      useMonthDataLoader({ immediate: false })
    )

    await nextTick()
    expect(fetchSpy).not.toHaveBeenCalled()

    await loader?.refreshCurrentMonth()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2024', '03')

    fetchSpy.mockClear()
    periodStore.setMonth('04')
    await nextTick()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledWith('2024', '04')

    scope.stop()
  })
})
