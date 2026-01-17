<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { MovementPayload } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'

const { year, month, addEntry, isSaving } = useMonthFormActions()
const savingEntries = isSaving('entries')

const feedback = ref<string | null>(null)
const localError = ref<string | null>(null)
const form = reactive({
  descricao: '',
  data: '',
  valor: '',
  parcela: '',
  categoria: 'Despesa rapida',
})

const reference = computed(() =>
  year.value && month.value ? `${year.value}-${month.value}` : 'Selecione periodo'
)

watch(
  [year, month],
  () => {
    if (!year.value || !month.value) return
    const lastDay = new Date(Number(year.value), Number(month.value), 0).getDate()
    const safeDay = Math.min(10, lastDay)
    form.data = `${year.value}-${month.value}-${String(safeDay).padStart(2, '0')}`
  },
  { immediate: true }
)

async function submitQuickExpense() {
  feedback.value = null
  localError.value = null

  if (!year.value || !month.value) {
    localError.value = 'Selecione ano e mes para registrar a fatura rapida.'
    return
  }

  if (!form.descricao.trim()) {
    localError.value = 'Descricao obrigatoria.'
    return
  }

  const valorNum = Number(form.valor)
  if (!Number.isFinite(valorNum) || valorNum === 0) {
    localError.value = 'Informe um valor numerico diferente de zero.'
    return
  }

  if (!form.data) {
    localError.value = 'Data obrigatoria.'
    return
  }

  const parcela = form.parcela.trim()
  const payload: MovementPayload = {
    data: form.data,
    valor: -Math.abs(valorNum),
    descricao: form.descricao.trim(),
    categoria: form.categoria?.trim() || null,
    parcela: parcela || null,
    tags: ['rapido'],
  }

  try {
    await addEntry(payload, { generateFuture: Boolean(parcela) })
    feedback.value = 'Lancamento rapido salvo como despesa.'
    form.descricao = ''
    form.valor = ''
    form.parcela = ''
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar lancamento rapido.'
    localError.value = message
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Quick actions
        </p>
        <h2 class="text-lg font-semibold text-ink-900">Fatura rapida</h2>
        <p class="text-xs text-ink-500">
          Valor e salvo como saida negativa. Opcional: informar parcela para gerar as demais.
        </p>
      </div>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-600">
        {{ reference }}
      </span>
    </div>

    <form class="mt-4 space-y-3" @submit.prevent="submitQuickExpense">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block text-sm font-medium text-ink-700">
          Descricao
          <input
            v-model="form.descricao"
            type="text"
            name="descricao"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Ex.: Cartao rapido"
          />
        </label>
        <label class="block text-sm font-medium text-ink-700">
          Categoria (opcional)
          <input
            v-model="form.categoria"
            type="text"
            name="categoria"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Despesa rapida"
          />
        </label>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <label class="block text-sm font-medium text-ink-700">
          Data
          <input
            v-model="form.data"
            type="date"
            name="data"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </label>
        <label class="block text-sm font-medium text-ink-700">
          Valor
          <input
            v-model="form.valor"
            type="number"
            step="0.01"
            name="valor"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Ex.: 120.50"
          />
        </label>
        <label class="block text-sm font-medium text-ink-700">
          Parcela (opcional)
          <input
            v-model="form.parcela"
            type="text"
            name="parcela"
            class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            placeholder="Ex.: 1/3"
          />
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-ink-500">
          A opcao de gerar parcelas futuras e ativada automaticamente quando uma parcela e informada.
        </p>
        <button
          type="submit"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="savingEntries"
        >
          {{ savingEntries ? 'Salvando...' : 'Registrar despesa rapida' }}
        </button>
      </div>
    </form>

    <p v-if="localError" class="mt-3 text-sm text-rose-600">
      {{ localError }}
    </p>
    <p v-else-if="feedback" class="mt-3 text-sm text-mint-700">
      {{ feedback }}
    </p>
  </div>
</template>
