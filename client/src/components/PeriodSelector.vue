<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePeriodStore } from '@/stores/periodStore'

const periodStore = usePeriodStore()
const { year, month } = storeToRefs(periodStore)

const localYear = ref(year.value)
const localMonth = ref(month.value)

watch(year, (value) => {
  localYear.value = value
})

watch(month, (value) => {
  localMonth.value = value
})

const isDirty = computed(
  () =>
    localYear.value !== year.value || localMonth.value !== month.value
)

function applyPeriod() {
  periodStore.setPeriod(localYear.value, localMonth.value)
}
</script>

<template>
  <form
    class="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
    @submit.prevent="applyPeriod"
  >
    <div class="flex flex-col">
      <label class="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Ano
      </label>
      <input
        v-model="localYear"
        class="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
        type="text"
        inputmode="numeric"
        maxlength="4"
        required
      />
    </div>
    <div class="flex flex-col">
      <label class="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Mes
      </label>
      <input
        v-model="localMonth"
        class="mt-1 w-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
        type="text"
        inputmode="numeric"
        maxlength="2"
        required
      />
    </div>
    <button
      type="submit"
      class="inline-flex items-center rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      :disabled="!isDirty"
    >
      Aplicar periodo
    </button>
  </form>
</template>
