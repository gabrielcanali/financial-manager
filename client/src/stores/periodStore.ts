import { defineStore } from 'pinia'

function normalizeYear(year: string | number): string {
  return String(year).padStart(4, '0')
}

function normalizeMonth(month: string | number): string {
  return String(month).padStart(2, '0')
}

const now = new Date()
const defaultYear = normalizeYear(now.getFullYear())
const defaultMonth = normalizeMonth(now.getMonth() + 1)

export const usePeriodStore = defineStore('period', {
  state: () => ({
    year: defaultYear,
    month: defaultMonth,
  }),
  getters: {
    reference(state) {
      return `${state.year}-${state.month}`
    },
  },
  actions: {
    setYear(year: string | number) {
      this.year = normalizeYear(year)
    },
    setMonth(month: string | number) {
      this.month = normalizeMonth(month)
    },
    setPeriod(year: string | number, month: string | number) {
      this.setYear(year)
      this.setMonth(month)
    },
    setFromReference(reference: string) {
      const [year, month] = reference.split('-')
      if (year) this.setYear(year)
      if (month) this.setMonth(month)
    },
  },
})

