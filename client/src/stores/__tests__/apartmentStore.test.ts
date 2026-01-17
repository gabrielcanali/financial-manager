import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useApartmentStore } from '../apartmentStore'
import { usePeriodStore } from '@/stores/periodStore'
import * as apartmentService from '@/services/apartmentService'
import { createApartmentSnapshot } from '@/tests/apartmentFixtures'
import type { ApartmentPayload } from '@/types/schema'

vi.mock('@/services/apartmentService', () => ({
  fetchApartmentEvolution: vi.fn(),
  fetchApartmentMonth: vi.fn(),
  updateApartmentMonth: vi.fn(),
  saveApartmentSeriesEntry: vi.fn(),
}))

const service = vi.mocked(apartmentService)

describe('apartmentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('normaliza ano/mes ao salvar parcelas e mantem snapshot alinhado ao periodo atual', async () => {
    const store = useApartmentStore()
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '05')

    const snapshotAtual = createApartmentSnapshot({
      referencia: '2024-05',
    })
    service.saveApartmentSeriesEntry.mockResolvedValueOnce(snapshotAtual)

    await store.saveSeriesInstallment({
      series: 'financiamento_caixa',
      year: '2024',
      month: '5',
      installment: {
        ano: '2024',
        mes: '5',
        valor_parcela: 1500,
        saldo_devedor: 1000,
      },
    })

    expect(service.saveApartmentSeriesEntry).toHaveBeenCalledWith(
      '2024',
      '05',
      'financiamento_caixa',
      expect.objectContaining({
        ano: '2024',
        mes: '05',
      })
    )
    expect(store.month).toEqual(snapshotAtual)

    const snapshotOutro = createApartmentSnapshot({
      referencia: '2023-11',
    })
    service.saveApartmentSeriesEntry.mockResolvedValueOnce(snapshotOutro)

    await store.saveSeriesInstallment({
      series: 'financiamento_caixa',
      year: '2023',
      month: '11',
      installment: null,
    })

    expect(store.month).toEqual(snapshotAtual)
  })

  it('exibe o getter isSnapshotCurrent para detectar snapshots defasados', () => {
    const store = useApartmentStore()
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '05')

    expect(store.isSnapshotCurrent).toBe(true)

    store.month = createApartmentSnapshot({
      referencia: '2023-12',
    })
    expect(store.isSnapshotCurrent).toBe(false)

    store.month = createApartmentSnapshot({
      referencia: '2024-05',
    })
    expect(store.isSnapshotCurrent).toBe(true)

    store.month = null
    expect(store.isSnapshotCurrent).toBe(true)
  })

  it('permite controlar sincronizacao e propaga erros de saveSeriesInstallment', async () => {
    const store = useApartmentStore()
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '05')
    const snapshotAtual = createApartmentSnapshot({
      referencia: '2024-05',
    })
    store.month = snapshotAtual

    const snapshotAtualizado = createApartmentSnapshot({
      referencia: '2024-05',
      totais: {
        parcelas: 999,
        saldo_devedor: 123,
      },
    })
    service.saveApartmentSeriesEntry.mockResolvedValueOnce(snapshotAtualizado)

    await store.saveSeriesInstallment({
      series: 'financiamento_caixa',
      year: '2024',
      month: '05',
      installment: {
        ano: '2024',
        mes: '05',
        valor_parcela: 2000,
        saldo_devedor: 90000,
      },
      syncSnapshot: false,
    })

    expect(store.month).toEqual(snapshotAtual)

    const rejection = new Error('Falhou geral')
    service.saveApartmentSeriesEntry.mockRejectedValueOnce(rejection)

    await expect(
      store.saveSeriesInstallment({
        series: 'entrada_construtora',
        year: '2024',
        month: '05',
        installment: null,
      })
    ).rejects.toThrow('Falhou geral')
    expect(store.error).toBe('Falhou geral')
  })

  it('atualiza snapshot ao salvar o periodo atual e ignora periodos diferentes', async () => {
    const store = useApartmentStore()
    const periodStore = usePeriodStore()
    periodStore.setPeriod('2024', '05')
    const emptyPayload: ApartmentPayload = {
      financiamento_caixa: null,
      entrada_construtora: null,
    }

    const snapshotAtual = createApartmentSnapshot({
      referencia: '2024-05',
    })
    service.updateApartmentMonth.mockResolvedValueOnce(snapshotAtual)

    await store.saveMonth('2024', '05', emptyPayload)

    expect(service.updateApartmentMonth).toHaveBeenCalledWith(
      '2024',
      '05',
      emptyPayload
    )
    expect(store.month).toEqual(snapshotAtual)

    const snapshotOutro = createApartmentSnapshot({
      referencia: '2023-11',
    })
    service.updateApartmentMonth.mockResolvedValueOnce(snapshotOutro)

    await store.saveMonth('2023', '11', emptyPayload)

    expect(store.month).toEqual(snapshotAtual)
  })
})
