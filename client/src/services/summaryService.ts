import type { MonthSummary, YearSummary } from '@/types/schema'
import { get } from './httpClient'

export async function fetchMonthSummary(
  year: string,
  month: string
): Promise<MonthSummary> {
  return get<MonthSummary>(`/months/${year}/${month}/summary`)
}

export async function fetchYearSummary(year: string): Promise<YearSummary> {
  return get<YearSummary>(`/years/${year}/summary`)
}

