<script setup>
import { computed } from "vue";
import { getCategoryMeta } from "../constants/categories";

const props = defineProps({
  value: { type: String, default: "" },
  minimal: { type: Boolean, default: false },
});

const meta = computed(() => getCategoryMeta(props.value));
</script>

<template>
  <span
    v-if="meta"
    :class="[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
      meta.classes,
      minimal ? 'uppercase tracking-wide' : '',
    ]"
  >
    <span class="h-2 w-2 rounded-full" :class="meta.dotClass"></span>
    <span>{{ meta.label }}</span>
  </span>
</template>
