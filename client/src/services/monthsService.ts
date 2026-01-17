import type {
  LoansPayload,
  MonthCalendar,
  MonthData,
  MonthIncomeData,
  MovementPayload,
  RecurringMovementPayload,
  RecurringPeriodParam,
  SavingsPayload,
} from '@/types/schema'
import { del, get, post, put } from './httpClient'

const BASE_PATH = '/months'

export type EntryUpdatePayload = Partial<MovementPayload>
export type RecurringUpdatePayload = Partial<RecurringMovementPayload>

export async function fetchMonth(
  year: string,
  month: string
): Promise<MonthData> {
  return get<MonthData>(`${BASE_PATH}/${year}/${month}`)
}

export async function updateMonthData(
  year: string,
  month: string,
  payload: MonthIncomeData
): Promise<MonthData> {
  return put<MonthData>(`${BASE_PATH}/${year}/${month}/data`, payload)
}

export async function updateMonthCalendar(
  year: string,
  month: string,
  payload: MonthCalendar
): Promise<MonthData> {
  return put<MonthData>(`${BASE_PATH}/${year}/${month}/calendar`, payload)
}

export async function setMonthSavings(
  year: string,
  month: string,
  payload: SavingsPayload
): Promise<MonthData> {
  return put<MonthData>(`${BASE_PATH}/${year}/${month}/savings`, payload)
}

export async function setMonthLoans(
  year: string,
  month: string,
  payload: LoansPayload
): Promise<MonthData> {
  return put<MonthData>(`${BASE_PATH}/${year}/${month}/loans`, payload)
}

export async function addEntry(
  year: string,
  month: string,
  payload: MovementPayload,
  options?: { generateFuture?: boolean }
): Promise<MonthData> {
  return post<MonthData>(
    `${BASE_PATH}/${year}/${month}/entries`,
    payload,
    { generateFuture: options?.generateFuture }
  )
}

export async function updateEntry(
  year: string,
  month: string,
  entryId: string,
  payload: EntryUpdatePayload,
  options?: { cascade?: boolean }
): Promise<MonthData> {
  return put<MonthData>(
    `${BASE_PATH}/${year}/${month}/entries/${entryId}`,
    payload,
    { cascade: options?.cascade }
  )
}

export async function deleteEntry(
  year: string,
  month: string,
  entryId: string
): Promise<void> {
  await del<void>(`${BASE_PATH}/${year}/${month}/entries/${entryId}`)
}

export async function addRecurring(
  year: string,
  month: string,
  period: RecurringPeriodParam,
  payload: RecurringMovementPayload,
  options?: { generateFuture?: boolean }
): Promise<MonthData> {
  return post<MonthData>(
    `${BASE_PATH}/${year}/${month}/recurrents/${period}`,
    payload,
    { generateFuture: options?.generateFuture }
  )
}

export async function updateRecurring(
  year: string,
  month: string,
  period: RecurringPeriodParam,
  recurringId: string,
  payload: RecurringUpdatePayload,
  options?: { cascade?: boolean }
): Promise<MonthData> {
  return put<MonthData>(
    `${BASE_PATH}/${year}/${month}/recurrents/${period}/${recurringId}`,
    payload,
    { cascade: options?.cascade }
  )
}

export async function deleteRecurring(
  year: string,
  month: string,
  period: RecurringPeriodParam,
  recurringId: string
): Promise<void> {
  await del<void>(
    `${BASE_PATH}/${year}/${month}/recurrents/${period}/${recurringId}`
  )
}

