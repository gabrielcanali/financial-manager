<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  formError?: string
  actionError?: string | null
  statusMessage?: string
  testId?: string
}>()

const message = computed(() => {
  return props.formError || props.actionError || props.statusMessage || ''
})

const toneClass = computed(() => {
  if (props.formError) {
    return 'text-amber-700'
  }
  if (props.actionError) {
    return 'text-rose-600'
  }
  if (props.statusMessage) {
    return 'text-mint-700'
  }
  return ''
})
</script>

<template>
  <div
    v-if="props.formError || props.actionError || props.statusMessage"
    class="text-xs font-semibold"
    :class="toneClass"
    :data-testid="props.testId"
  >
    {{ message }}
  </div>
</template>
