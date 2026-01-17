import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMonthStore, type MonthSavingTarget } from '@/stores/monthStore'
import { usePeriodStore } from '@/stores/periodStore'
import type {
  LoansPayload,
  MonthCalendar,
  MonthIncomeData,
  MovementPayload,
  RecurringMovementPayload,
  RecurringPeriodParam,
  SavingsPayload,
} from '@/types/schema'
import type {
  EntryUpdatePayload,
  RecurringUpdatePayload,
} from '@/services/monthsService'

export function useMonthFormActions() {
  const monthStore = useMonthStore()
  const periodStore = usePeriodStore()
  const { year, month } = storeToRefs(periodStore)

  const savingState = computed(() => monthStore.savingByTarget)
  const errorState = computed(() => monthStore.errorsByTarget)

  function isSaving(target: MonthSavingTarget) {
    return computed(() => Boolean(savingState.value[target]))
  }

  function actionErrorFor(target: MonthSavingTarget) {
    return computed(() => errorState.value[target])
  }

  function onPeriodChange(callback: () => void) {
    watch([year, month], () => {
      callback()
    })
  }

  async function saveIncome(payload: MonthIncomeData) {
    return monthStore.saveMonthData(payload)
  }

  async function saveCalendar(payload: MonthCalendar) {
    return monthStore.saveCalendar(payload)
  }

  async function saveSavings(payload: SavingsPayload) {
    return monthStore.saveSavings(payload)
  }

  async function saveLoans(payload: LoansPayload) {
    return monthStore.saveLoans(payload)
  }

  async function addEntry(
    payload: MovementPayload,
    options?: { generateFuture?: boolean }
  ) {
    return monthStore.addEntry(payload, options)
  }

  async function updateEntry(
    entryId: string,
    payload: EntryUpdatePayload,
    options?: { cascade?: boolean }
  ) {
    return monthStore.updateEntry(entryId, payload, options)
  }

  async function deleteEntry(entryId: string) {
    return monthStore.deleteEntry(entryId)
  }

  async function addRecurring(
    period: RecurringPeriodParam,
    payload: RecurringMovementPayload,
    options?: { generateFuture?: boolean }
  ) {
    return monthStore.addRecurring(period, payload, options)
  }

  async function updateRecurring(
    period: RecurringPeriodParam,
    recurringId: string,
    payload: RecurringUpdatePayload,
    options?: { cascade?: boolean }
  ) {
    return monthStore.updateRecurring(period, recurringId, payload, options)
  }

  async function deleteRecurring(
    period: RecurringPeriodParam,
    recurringId: string
  ) {
    return monthStore.deleteRecurring(period, recurringId)
  }

  return {
    year,
    month,
    actionErrorFor,
    isSaving,
    onPeriodChange,
    saveIncome,
    saveCalendar,
    saveSavings,
    saveLoans,
    addEntry,
    updateEntry,
    deleteEntry,
    addRecurring,
    updateRecurring,
    deleteRecurring,
  }
}
