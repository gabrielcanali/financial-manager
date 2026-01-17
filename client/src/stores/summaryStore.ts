import { defineStore } from 'pinia'
import { fetchMonthSummary, fetchYearSummary } from '@/services/summaryService'
import type { MonthSummary, YearSummary } from '@/types/schema'

interface SummaryState {
  monthSummary: MonthSummary | null
  yearSummary: YearSummary | null
  loadingMonth: boolean
  loadingYear: boolean
  error: string | null
}

function normalizeError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export const useSummaryStore = defineStore('summary', {
  state: (): SummaryState => ({
    monthSummary: null,
    yearSummary: null,
    loadingMonth: false,
    loadingYear: false,
    error: null,
  }),
  actions: {
    async loadMonthSummary(year: string, month: string) {
      this.loadingMonth = true
      this.error = null
      try {
        const result = await fetchMonthSummary(year, month)
        this.monthSummary = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao carregar resumo mensal')
        throw err
      } finally {
        this.loadingMonth = false
      }
    },
    async loadYearSummary(year: string) {
      this.loadingYear = true
      this.error = null
      try {
        const result = await fetchYearSummary(year)
        this.yearSummary = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao carregar resumo anual')
        throw err
      } finally {
        this.loadingYear = false
      }
    },
    clearSummaries() {
      this.monthSummary = null
      this.yearSummary = null
      this.error = null
    },
  },
})

