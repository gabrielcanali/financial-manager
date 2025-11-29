<script setup>
defineProps({
  label: { type: String, required: true },
  helper: { type: String, default: "" },
});
</script>

<template>
  <div class="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-4 shadow-card">
    <p class="text-xs uppercase text-slate-400">{{ label }}</p>
    <p class="text-2xl font-bold text-slate-50">
      <slot name="value">
        <slot />
      </slot>
    </p>
    <p v-if="helper" class="text-xs text-slate-500">{{ helper }}</p>
  </div>
</template>
