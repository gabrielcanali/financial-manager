<script setup>
const props = defineProps({
  points: { type: String, default: "" },
  labels: { type: Array, default: () => [] },
  gradientId: { type: String, required: true },
  height: { type: Number, default: 180 },
  width: { type: Number, default: 420 },
  containerClass: { type: String, default: "h-48 w-full" },
  fromColor: { type: String, default: "#c084fc" },
  toColor: { type: String, default: "#38bdf8" },
  dotColor: { type: String, default: "#38bdf8" },
  emptyMessage: { type: String, default: "Sem dados para plotar." },
  showDots: { type: Boolean, default: true },
  strokeWidth: { type: Number, default: 3 },
  dotRadius: { type: Number, default: 4 },
});
</script>

<template>
  <div
    :class="[
      'overflow-hidden rounded-xl border border-white/10 bg-slate-900/60',
      containerClass,
    ]"
  >
    <svg
      v-if="points"
      :viewBox="`0 0 ${width} ${height}`"
      class="h-full w-full"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" :stop-color="fromColor" />
          <stop offset="100%" :stop-color="toColor" />
        </linearGradient>
      </defs>
      <polyline
        :points="points"
        fill="none"
        :stroke="`url(#${gradientId})`"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <template v-if="showDots">
        <circle
          v-for="(label, idx) in labels"
          :key="idx"
          :cx="label.x"
          :cy="label.y"
          :r="dotRadius"
          :fill="dotColor"
        />
      </template>
    </svg>
    <div v-else class="flex h-full items-center justify-center text-sm text-slate-500">
      {{ emptyMessage }}
    </div>
  </div>
</template>
