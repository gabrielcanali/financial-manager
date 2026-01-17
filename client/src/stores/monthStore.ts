import { defineStore } from 'pinia'
import * as monthsService from '@/services/monthsService'
import type {
  EntryUpdatePayload,
  RecurringUpdatePayload,
} from '@/services/monthsService'
import {
  createErrorState,
  createMonthAction,
  createSavingState,
  normalizeError,
  type TargetStateMap,
} from '@/stores/helpers/monthSavingHelpers'
export type { MonthSavingTarget } from '@/stores/helpers/monthSavingHelpers'
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
interface MonthState {
  month: MonthData | null
  loading: boolean
  error: string | null
  refreshAfterSuccessTick: number
  savingByTarget: TargetStateMap<boolean>
  errorsByTarget: TargetStateMap<string | null>
}

export const useMonthStore = defineStore('month', {
  state: (): MonthState => ({
    month: null,
    loading: false,
    error: null,
    refreshAfterSuccessTick: 0,
    savingByTarget: createSavingState(),
    errorsByTarget: createErrorState(),
  }),
  actions: {
    refreshAfterSuccess() {
      this.refreshAfterSuccessTick += 1
    },
    async fetchMonth(year: string, month: string) {
      this.loading = true
      this.error = null
      this.errorsByTarget = createErrorState()
      try {
        const result = await monthsService.fetchMonth(year, month)
        this.month = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao carregar o mes')
        throw err
      } finally {
        this.loading = false
      }
    },
    saveMonthData: createMonthAction<[MonthIncomeData], MonthData>({
      target: 'income',
      fallbackMessage: 'Erro ao atualizar dados do mes',
      run: ({ year, month }, payload) =>
        monthsService.updateMonthData(year, month, payload),
    }),
    saveCalendar: createMonthAction<[MonthCalendar], MonthData>({
      target: 'calendar',
      fallbackMessage: 'Erro ao atualizar calendario',
      run: ({ year, month }, payload) =>
        monthsService.updateMonthCalendar(year, month, payload),
    }),
    saveSavings: createMonthAction<[SavingsPayload], MonthData>({
      target: 'savings',
      fallbackMessage: 'Erro ao atualizar poupanca',
      run: ({ year, month }, payload) =>
        monthsService.setMonthSavings(year, month, payload),
    }),
    saveLoans: createMonthAction<[LoansPayload], MonthData>({
      target: 'loans',
      fallbackMessage: 'Erro ao atualizar emprestimos',
      run: ({ year, month }, payload) =>
        monthsService.setMonthLoans(year, month, payload),
    }),
    addEntry: createMonthAction<
      [MovementPayload, { generateFuture?: boolean } | undefined],
      MonthData
    >({
      target: 'entries',
      fallbackMessage: 'Erro ao adicionar lancamento',
      run: ({ year, month }, payload, options) =>
        monthsService.addEntry(year, month, payload, {
          generateFuture: options?.generateFuture,
        }),
    }),
    updateEntry: createMonthAction<
      [string, EntryUpdatePayload, { cascade?: boolean } | undefined],
      MonthData
    >({
      target: 'entries',
      fallbackMessage: 'Erro ao atualizar lancamento',
      run: ({ year, month }, entryId, payload, options) =>
        monthsService.updateEntry(year, month, entryId, payload, {
          cascade: options?.cascade,
        }),
    }),
    deleteEntry: createMonthAction<[string], void>({
      target: 'entries',
      fallbackMessage: 'Erro ao remover lancamento',
      run: ({ year, month }, entryId) =>
        monthsService.deleteEntry(year, month, entryId),
      refreshAfterSuccess: true,
    }),
    addRecurring: createMonthAction<
      [RecurringPeriodParam, RecurringMovementPayload, { generateFuture?: boolean } | undefined],
      MonthData
    >({
      target: 'recurrents',
      fallbackMessage: 'Erro ao adicionar recorrente',
      run: ({ year, month }, period, payload, options) =>
        monthsService.addRecurring(year, month, period, payload, {
          generateFuture: options?.generateFuture,
        }),
    }),
    updateRecurring: createMonthAction<
      [
        RecurringPeriodParam,
        string,
        RecurringUpdatePayload,
        { cascade?: boolean } | undefined
      ],
      MonthData
    >({
      target: 'recurrents',
      fallbackMessage: 'Erro ao atualizar recorrente',
      run: ({ year, month }, period, recurringId, payload, options) =>
        monthsService.updateRecurring(year, month, period, recurringId, payload, {
          cascade: options?.cascade,
        }),
    }),
    deleteRecurring: createMonthAction<[RecurringPeriodParam, string], void>({
      target: 'recurrents',
      fallbackMessage: 'Erro ao remover recorrente',
      run: ({ year, month }, period, recurringId) =>
        monthsService.deleteRecurring(year, month, period, recurringId),
      refreshAfterSuccess: true,
    }),
  },
})
