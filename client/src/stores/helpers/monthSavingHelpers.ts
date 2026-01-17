import { usePeriodStore } from '@/stores/periodStore'
import type { MonthData } from '@/types/schema'

export type MonthSavingTarget =
  | 'income'
  | 'calendar'
  | 'entries'
  | 'recurrents'
  | 'savings'
  | 'loans'

const MONTH_TARGETS: readonly MonthSavingTarget[] = [
  'income',
  'calendar',
  'entries',
  'recurrents',
  'savings',
  'loans',
] as const

export type TargetStateMap<T> = Record<MonthSavingTarget, T>

export function createTargetState<T>(value: T): TargetStateMap<T> {
  return MONTH_TARGETS.reduce((acc, target) => {
    acc[target] = value
    return acc
  }, {} as TargetStateMap<T>)
}

export const createSavingState = () => createTargetState(false)
export const createErrorState = () => createTargetState<string | null>(null)

export type PeriodParams = {
  year: string
  month: string
}

export interface MonthSavingState {
  savingByTarget: TargetStateMap<boolean>
  errorsByTarget: TargetStateMap<string | null>
  error: string | null
}

export type MonthStoreActionContext = MonthSavingState & {
  month: MonthData | null
  refreshAfterSuccess(): void
  fetchMonth(year: string, month: string): Promise<MonthData>
}

export function normalizeError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export function ensureSelectedPeriod(reference: string | undefined): PeriodParams {
  const [year, month] = (reference ?? '').split('-')
  if (!year || !month) {
    throw new Error('Periodo nao selecionado')
  }
  return { year, month }
}

export function resolveCurrentPeriod(): PeriodParams {
  const periodStore = usePeriodStore()
  return ensureSelectedPeriod(periodStore.reference)
}

export async function runSavingAction<TResult>(
  store: MonthSavingState,
  target: MonthSavingTarget,
  fallbackMessage: string,
  operation: () => Promise<TResult>
): Promise<TResult> {
  store.savingByTarget[target] = true
  store.error = null
  store.errorsByTarget[target] = null
  try {
    return await operation()
  } catch (err) {
    const message = normalizeError(err, fallbackMessage)
    store.error = message
    store.errorsByTarget[target] = message
    throw err
  } finally {
    store.savingByTarget[target] = false
  }
}

type MonthActionOptions<TArgs extends unknown[], TResult> = {
  target: MonthSavingTarget
  fallbackMessage: string
  run: (period: PeriodParams, ...args: TArgs) => Promise<TResult>
  onSuccess?: (
    store: MonthStoreActionContext,
    result: TResult,
    period: PeriodParams
  ) => Promise<void> | void
  refreshAfterSuccess?: boolean
}

export function createMonthAction<TArgs extends unknown[], TResult>(
  options: MonthActionOptions<TArgs, TResult>
) {
  return async function (
    this: MonthStoreActionContext,
    ...args: TArgs
  ): Promise<TResult> {
    const period = resolveCurrentPeriod()
    const onSuccess =
      options.refreshAfterSuccess
        ? (store: MonthStoreActionContext) => {
            store.refreshAfterSuccess()
          }
        : options.onSuccess ??
          ((store: MonthStoreActionContext, result: TResult) => {
            store.month = result as unknown as MonthData
          })

    return runSavingAction(
      this,
      options.target,
      options.fallbackMessage,
      async () => {
        const result = await options.run(period, ...args)
        await onSuccess(this, result, period)
        return result
      }
    )
  }
}
