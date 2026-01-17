<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Movement, MovementPayload } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import { formatCurrency } from '@/utils/formatters'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  entries: Movement[]
}>()

interface EntryFormState {
  descricao: string
  valor: number | null
  data: string
  categoria: string | null
  parcela: string | null
  tagsText: string
}

interface EntryFieldErrors {
  descricao?: string
  valor?: string
  data?: string
  categoria?: string
  parcela?: string
  tagsText?: string
  generateFuture?: string
}

const defaultForm = (): EntryFormState => ({
  descricao: '',
  valor: null,
  data: '',
  categoria: null,
  parcela: null,
  tagsText: '',
})

const form = reactive<EntryFormState>(defaultForm())
const showForm = ref(false)
const editingId = ref<string | null>(null)
const generateFuture = ref(false)
const cascade = ref(false)
const formError = ref('')
const statusMessage = ref('')
const fieldErrors = reactive<EntryFieldErrors>({})
const {
  addEntry,
  updateEntry,
  deleteEntry,
  isSaving,
  actionErrorFor,
  onPeriodChange,
} = useMonthFormActions()
const saving = isSaving('entries')
const actionError = actionErrorFor('entries')

const editingEntry = computed(() =>
  props.entries.find((entry) => entry.id === editingId.value)
)

watch(
  () => props.entries,
  () => {
    formError.value = ''
    showForm.value = false
    editingId.value = null
    clearFieldErrors()
  },
  { deep: true }
)

watch(
  () => showForm.value,
  () => {
    formError.value = ''
    statusMessage.value = ''
    if (!showForm.value) {
      clearFieldErrors()
    }
  }
)

const totals = computed(() =>
  props.entries.reduce<{ entradas: number; saidas: number; saldo: number }>(
    (acc, item) => {
      if (item.valor >= 0) {
        acc.entradas += item.valor
      } else {
        acc.saidas += item.valor
      }
      acc.saldo += item.valor
      return acc
    },
    { entradas: 0, saidas: 0, saldo: 0 }
  )
)

function clearFieldErrors() {
  ;(Object.keys(fieldErrors) as (keyof EntryFieldErrors)[]).forEach((key) => {
    delete fieldErrors[key]
  })
}

function parseTags(text: string | null | undefined): string[] {
  if (!text) return []
  const tags = text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags
}

function ensureDescricao() {
  if (!form.descricao.trim()) {
    fieldErrors.descricao = 'Descricao obrigatoria'
    return false
  }
  delete fieldErrors.descricao
  return true
}

function ensureValor() {
  if (form.valor === null || Number.isNaN(Number(form.valor))) {
    fieldErrors.valor = 'Informe um valor numerico valido (positivo ou negativo)'
    return false
  }
  delete fieldErrors.valor
  return true
}

function ensureData() {
  if (!form.data || !/^\d{4}-\d{2}-\d{2}$/.test(form.data)) {
    fieldErrors.data = 'Use datas no formato YYYY-MM-DD'
    return false
  }
  delete fieldErrors.data
  return true
}

function ensureCategoria() {
  if (form.categoria && form.categoria.trim().length > 40) {
    fieldErrors.categoria = 'Categoria deve ter no maximo 40 caracteres'
    return false
  }
  delete fieldErrors.categoria
  return true
}

function getParcelaError(value: string | null): string | null {
  if (!value?.trim()) return null
  const [current, total] = value.split('/').map((part) => Number(part))
  if (
    !current ||
    !total ||
    Number.isNaN(current) ||
    Number.isNaN(total) ||
    current < 1 ||
    total < 1 ||
    current > total ||
    total > 36
  ) {
    return 'Parcela deve seguir n/m com limite 36'
  }
  return null
}

function ensureParcelaField() {
  const error = getParcelaError(form.parcela)
  if (error) {
    fieldErrors.parcela = error
    return false
  }
  delete fieldErrors.parcela
  return true
}

function ensureTagsLimit() {
  const tags = parseTags(form.tagsText)
  if (tags.length > 8) {
    fieldErrors.tagsText = 'Use no maximo 8 tags separadas por virgula'
    return false
  }
  delete fieldErrors.tagsText
  return true
}

function ensureGenerateFuture() {
  if (!editingId.value && generateFuture.value && !form.parcela?.trim()) {
    fieldErrors.generateFuture =
      'Informe a parcela n/m antes de gerar meses futuros'
    return false
  }
  delete fieldErrors.generateFuture
  return true
}

function openCreate() {
  Object.assign(form, defaultForm())
  editingId.value = null
  showForm.value = true
  generateFuture.value = false
  cascade.value = false
  statusMessage.value = ''
  clearFieldErrors()
}

function openEdit(entry: Movement) {
  form.descricao = entry.descricao
  form.valor = entry.valor
  form.data = entry.data
  form.categoria = entry.categoria ?? null
  form.parcela = entry.parcela ?? null
  form.tagsText = entry.tags?.join(', ') ?? ''
  editingId.value = entry.id
  showForm.value = true
  generateFuture.value = false
  cascade.value = false
  statusMessage.value = ''
  clearFieldErrors()
}

function cancelForm() {
  showForm.value = false
  editingId.value = null
  Object.assign(form, defaultForm())
  cascade.value = false
  generateFuture.value = false
  formError.value = ''
  clearFieldErrors()
}

watch(
  () => form.descricao,
  () => {
    if (fieldErrors.descricao) {
      ensureDescricao()
    }
  }
)

watch(
  () => form.valor,
  () => {
    if (fieldErrors.valor) {
      ensureValor()
    }
  }
)

watch(
  () => form.data,
  () => {
    if (fieldErrors.data) {
      ensureData()
    }
  }
)

watch(
  () => form.categoria,
  () => {
    ensureCategoria()
  }
)

watch(
  () => form.parcela,
  () => {
    ensureParcelaField()
    ensureGenerateFuture()
  }
)

watch(
  () => form.tagsText,
  () => {
    ensureTagsLimit()
  }
)

watch(
  () => generateFuture.value,
  () => {
    ensureGenerateFuture()
  }
)

onPeriodChange(() => {
  formError.value = ''
  statusMessage.value = ''
  showForm.value = false
  editingId.value = null
  cascade.value = false
  generateFuture.value = false
  clearFieldErrors()
})

function validateEntry(): boolean {
  const checks = [
    ensureDescricao(),
    ensureValor(),
    ensureData(),
    ensureCategoria(),
    ensureParcelaField(),
    ensureGenerateFuture(),
    ensureTagsLimit(),
  ]
  return checks.every(Boolean)
}

async function submit() {
  formError.value = ''
  statusMessage.value = ''
  const isValid = validateEntry()
  if (!isValid) {
    formError.value = 'Revise os campos destacados para continuar'
    return
  }
  const tags = parseTags(form.tagsText)
  const payload: MovementPayload = {
    descricao: form.descricao.trim(),
    valor: Number(form.valor ?? 0),
    data: form.data,
    categoria: form.categoria?.trim() || null,
    parcela: form.parcela?.trim() || null,
    tags,
  }

  if (editingId.value) {
    try {
      await updateEntry(editingId.value, payload, {
        cascade:
          editingEntry.value?.serie_id && cascade.value ? true : undefined,
      })
      statusMessage.value = 'Lancamento atualizado'
      cancelForm()
    } catch {
      // erro tratado no store
    }
  } else {
    try {
      await addEntry(payload, {
        generateFuture: generateFuture.value ? true : undefined,
      })
      statusMessage.value = 'Lancamento adicionado'
      cancelForm()
    } catch {
      // erro tratado no store
    }
  }
}

async function handleDelete(entryId: string) {
  formError.value = ''
  statusMessage.value = ''
  try {
    await deleteEntry(entryId)
    statusMessage.value = 'Lancamento removido'
  } catch {
    // erro tratado no store
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-ink-500">
          Entradas e saidas
        </p>
        <p class="text-xs text-ink-500">{{ entries.length }} lancamentos</p>
        <p class="text-xs text-ink-500">
          Entradas:
          <span class="font-semibold text-mint-600">{{
            formatCurrency(totals.entradas)
          }}</span>
          <span class="mx-1">|</span>
          Saidas:
          <span class="font-semibold text-rose-600">{{
            formatCurrency(totals.saidas)
          }}</span>
          <span class="mx-1">|</span>
          Saldo:
          <span class="font-semibold">{{ formatCurrency(totals.saldo) }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
        <button
          class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving"
          @click="openCreate"
        >
          Novo lancamento
        </button>
      </div>
    </div>

    <MonthActionFeedback
      class="mt-2"
      test-id="entries-feedback"
      :form-error="formError"
      :action-error="actionError"
      :status-message="statusMessage"
    />

    <div v-if="entries.length" class="mt-4 grid gap-3">
      <article
        v-for="movement in entries"
        :key="movement.id"
        class="rounded-lg border border-slate-200 p-3 text-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="font-semibold text-ink-900">{{ movement.descricao }}</p>
            <div class="mt-1 text-xs text-ink-500">
              {{ movement.data }}
              <span class="mx-1">|</span>
              Categoria: {{ movement.categoria ?? 'Sem categoria' }}
              <template v-if="movement.parcela">
                <span class="mx-1">|</span>
                Parcela {{ movement.parcela }}
              </template>
            </div>
            <div v-if="movement.tags?.length" class="text-xs text-ink-500">
              Tags: {{ movement.tags.join(', ') }}
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span
              :class="movement.valor >= 0 ? 'text-mint-600' : 'text-rose-600'"
              class="text-sm font-semibold"
            >
              {{ formatCurrency(movement.valor) }}
            </span>
            <button
              class="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
              type="button"
              :disabled="saving"
              @click="openEdit(movement)"
            >
              Editar
            </button>
            <button
              class="rounded border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed"
              type="button"
              :disabled="saving"
              @click="handleDelete(movement.id)"
            >
              Excluir
            </button>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="mt-4 text-sm text-ink-500">
      Nenhum lancamento registrado.
    </p>

    <div
      v-if="showForm"
      class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink-900">
          {{ editingId ? 'Editar lancamento' : 'Novo lancamento' }}
        </p>
        <button
          class="text-xs text-ink-500 hover:text-ink-700"
          type="button"
          @click="cancelForm"
        >
          Fechar
        </button>
      </div>

      <form class="mt-3 grid gap-3 md:grid-cols-2" @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Descricao</span>
          <input
            v-model="form.descricao"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.descricao
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            required
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.descricao" class="text-xs text-rose-600">
            {{ fieldErrors.descricao }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Valor</span>
          <input
            v-model.number="form.valor"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.valor
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            type="number"
            step="0.01"
            required
            :disabled="saving"
          />
          <p v-if="fieldErrors.valor" class="text-xs text-rose-600">
            {{ fieldErrors.valor }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Data</span>
          <input
            v-model="form.data"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.data
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            type="date"
            required
            :disabled="saving"
          />
          <p v-if="fieldErrors.data" class="text-xs text-rose-600">
            {{ fieldErrors.data }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Categoria</span>
          <input
            v-model="form.categoria"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.categoria
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            placeholder="Opcional"
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.categoria" class="text-xs text-rose-600">
            {{ fieldErrors.categoria }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Parcela</span>
          <input
            v-model="form.parcela"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.parcela
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            placeholder="Ex: 1/10"
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.parcela" class="text-xs text-rose-600">
            {{ fieldErrors.parcela }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Tags (separadas por virgula)</span>
          <input
            v-model="form.tagsText"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.tagsText
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            placeholder="ex: fixo, cartao"
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.tagsText" class="text-xs text-rose-600">
            {{ fieldErrors.tagsText }}
          </p>
        </label>

        <div
          v-if="!editingId || editingEntry?.serie_id"
          class="flex flex-wrap items-center gap-4 text-xs text-ink-600 md:col-span-2"
        >
          <label
            v-if="!editingId"
            class="flex items-center gap-2 font-semibold text-ink-700"
          >
            <input v-model="generateFuture" type="checkbox" :disabled="saving" />
            <span>Gerar meses futuros (quando aplicavel)</span>
          </label>
          <label
            v-else-if="editingEntry?.serie_id"
            class="flex items-center gap-2 font-semibold text-ink-700"
          >
            <input v-model="cascade" type="checkbox" :disabled="saving" />
            <span>Aplicar em cascata (serie ativa)</span>
          </label>
        </div>
        <p
          v-if="fieldErrors.generateFuture"
          class="text-xs text-rose-600 md:col-span-2"
        >
          {{ fieldErrors.generateFuture }}
        </p>

        <div class="flex items-center gap-3 md:col-span-2">
          <button
            class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            :disabled="saving"
          >
            {{ editingId ? 'Salvar edicao' : 'Adicionar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
