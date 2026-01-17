import { defineStore } from 'pinia'
import {
  fetchApartmentEvolution,
  fetchApartmentMonth,
  updateApartmentMonth,
  saveApartmentSeriesEntry,
} from '@/services/apartmentService'
import { usePeriodStore } from '@/stores/periodStore'
import type {
  ApartmentEvolution,
  ApartmentMonthSnapshot,
  ApartmentPayload,
  ApartmentSeriesKey,
  ApartmentInstallmentInput,
} from '@/types/schema'

interface ApartmentState {
  month: ApartmentMonthSnapshot | null
  evolution: ApartmentEvolution | null
  loadingMonth: boolean
  loadingEvolution: boolean
  error: string | null
}

function normalizeError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

function normalizeYear(value: string | number): string {
  return String(value).padStart(4, '0')
}

function normalizeMonth(value: string | number): string {
  return String(value).padStart(2, '0')
}

function buildReference(year: string, month: string): string {
  return `${normalizeYear(year)}-${normalizeMonth(month)}`
}

function shouldSyncSnapshot(
  year: string,
  month: string,
  syncSnapshot?: boolean
): boolean {
  if (typeof syncSnapshot === 'boolean') {
    return syncSnapshot
  }
  const periodStore = usePeriodStore()
  return periodStore.reference === buildReference(year, month)
}

export const useApartmentStore = defineStore('apartment', {
  state: (): ApartmentState => ({
    month: null,
    evolution: null,
    loadingMonth: false,
    loadingEvolution: false,
    error: null,
  }),
  getters: {
    snapshotReference(state): string | null {
      return state.month?.referencia ?? null
    },
    isSnapshotCurrent(): boolean {
      const snapshotReference = this.snapshotReference
      if (!snapshotReference) {
        return true
      }
      const periodStore = usePeriodStore()
      return snapshotReference === periodStore.reference
    },
  },
  actions: {
    async loadMonth(year: string, month: string) {
      this.loadingMonth = true
      this.error = null
      try {
        const result = await fetchApartmentMonth(year, month)
        this.month = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao carregar apartamento (mes)')
        throw err
      } finally {
        this.loadingMonth = false
      }
    },
    async saveMonth(
      year: string,
      month: string,
      payload: ApartmentPayload,
      options?: { syncSnapshot?: boolean }
    ) {
      this.error = null
      try {
        const result = await updateApartmentMonth(year, month, payload)
        if (shouldSyncSnapshot(year, month, options?.syncSnapshot)) {
          this.month = result
        }
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao atualizar dados do apartamento')
        throw err
      }
    },
    async saveSeriesInstallment(params: {
      series: ApartmentSeriesKey
      year: string
      month: string
      installment: ApartmentInstallmentInput | null
      syncSnapshot?: boolean
    }) {
      this.error = null
      const normalizedYear = normalizeYear(params.year)
      const normalizedMonth = normalizeMonth(params.month)
      try {
        const result = await saveApartmentSeriesEntry(
          normalizedYear,
          normalizedMonth,
          params.series,
          params.installment
            ? {
                ...params.installment,
                ano: normalizedYear,
                mes: normalizedMonth,
              }
            : null
        )
        if (shouldSyncSnapshot(normalizedYear, normalizedMonth, params.syncSnapshot)) {
          this.month = result
        }
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao atualizar dados do apartamento')
        throw err
      }
    },
    async loadEvolution(params?: { year?: string | number }) {
      this.loadingEvolution = true
      this.error = null
      try {
        const result = await fetchApartmentEvolution(params)
        this.evolution = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao carregar evolucao do apartamento')
        throw err
      } finally {
        this.loadingEvolution = false
      }
    },
  },
})
