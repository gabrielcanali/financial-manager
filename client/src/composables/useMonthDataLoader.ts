import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMonthStore } from '@/stores/monthStore'
import { usePeriodStore } from '@/stores/periodStore'

type MonthLoaderOptions = {
  immediate?: boolean
}

export function useMonthDataLoader(options?: MonthLoaderOptions) {
  const monthStore = useMonthStore()
  const periodStore = usePeriodStore()
  const { year, month } = storeToRefs(periodStore)
  const {
    month: monthData,
    loading,
    error,
    refreshAfterSuccessTick,
  } = storeToRefs(monthStore)
  const shouldTriggerImmediately = options?.immediate ?? true

  async function loadCurrentPeriod() {
    if (!year.value || !month.value) {
      return
    }
    try {
      await monthStore.fetchMonth(year.value, month.value)
    } catch {
      // erros sao tratados e armazenados no store
    }
  }

  watch(
    [year, month],
    () => {
      loadCurrentPeriod()
    },
    { immediate: shouldTriggerImmediately }
  )

  watch(refreshAfterSuccessTick, () => {
    loadCurrentPeriod()
  })

  return {
    refreshCurrentMonth: loadCurrentPeriod,
    monthData,
    loading,
    error,
    year,
    month,
  }
}
