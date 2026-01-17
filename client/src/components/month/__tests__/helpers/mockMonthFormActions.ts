import { computed, reactive, ref, watch } from 'vue'
import { vi } from 'vitest'
import type { MonthSavingTarget } from '@/stores/monthStore'

type TargetState<T> = Record<MonthSavingTarget, T>

export interface MonthFormActionsMockOptions {
  savingOverrides?: Partial<TargetState<boolean>>
  errorOverrides?: Partial<TargetState<string | null>>
  autoTriggerPeriodChange?: boolean
}

export function createMonthFormActionsMock(
  options?: MonthFormActionsMockOptions
) {
  const year = ref('2024')
  const month = ref('01')
  const listeners = new Set<() => void>()

  if (options?.autoTriggerPeriodChange) {
    watch([year, month], () => {
      listeners.forEach((callback) => callback())
    })
  }

  const savingState = reactive(createTargetState(false))
  const errorState = reactive(createTargetState<string | null>(null))

  Object.assign(savingState, options?.savingOverrides)
  Object.assign(errorState, options?.errorOverrides)

  return {
    year,
    month,
    saveIncome: vi.fn(),
    saveCalendar: vi.fn(),
    saveSavings: vi.fn(),
    saveLoans: vi.fn(),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    addRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    deleteRecurring: vi.fn(),
    isSaving: vi.fn((target: MonthSavingTarget) =>
      computed(() => Boolean(savingState[target]))
    ),
    actionErrorFor: vi.fn((target: MonthSavingTarget) =>
      computed(() => errorState[target])
    ),
    onPeriodChange: vi.fn((callback: () => void) => {
      listeners.add(callback)
    }),
    triggerPeriodChange: () => {
      listeners.forEach((callback) => callback())
    },
    setSaving(target: MonthSavingTarget, value: boolean) {
      savingState[target] = value
    },
    setError(target: MonthSavingTarget, value: string | null) {
      errorState[target] = value
    },
  }
}

function createTargetState<T>(value: T): TargetState<T> {
  return {
    income: value,
    calendar: value,
    entries: value,
    recurrents: value,
    savings: value,
    loans: value,
  }
}
