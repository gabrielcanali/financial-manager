<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/monthly', label: 'Visao mensal' },
  { to: '/recurrents', label: 'Recorrentes' },
  { to: '/apartment', label: 'Apartamento' },
  { to: '/onboarding', label: 'Onboarding' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-ink-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-200 text-base font-semibold text-mint-500">
            FM
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide text-ink-500">Financial Manager</p>
            <p class="text-lg font-semibold">Frontend em reconstruccao</p>
          </div>
        </div>
        <div class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-500">
          Fase 3 - Telas conectadas
        </div>
      </div>
    </header>

    <div class="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
      <nav class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">Navegacao</p>
        <ul class="space-y-2">
          <li v-for="link in navLinks" :key="link.to">
            <RouterLink
              :to="link.to"
              class="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-mint-200/70"
              active-class="bg-mint-200/80 text-ink-900"
            >
              <span>{{ link.label }}</span>
              <span class="text-[10px] uppercase tracking-wide text-ink-500">beta</span>
            </RouterLink>
          </li>
        </ul>
      </nav>

      <main class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <RouterView />
      </main>
    </div>
  </div>
</template>

