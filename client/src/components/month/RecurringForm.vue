<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
  RecurringMovement,
  RecurringMovementPayload,
  RecurringPeriodParam,
} from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import { formatCurrency } from '@/utils/formatters'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  title: string
  period: RecurringPeriodParam
  items: RecurringMovement[]
}>()

interface RecurringFormState {
  descricao: string
  valor: number | null
  data: string
  categoria: string | null
  tagsText: string
  terminaEm: string | null
}

interface RecurringFieldErrors {
  descricao?: string
  valor?: string
  data?: string
  categoria?: string
  tagsText?: string
  terminaEm?: string
  generateFuture?: string
  cascade?: string
}

const defaultForm = (): RecurringFormState => ({
  descricao: '',
  valor: null,
  data: '',
  categoria: null,
  tagsText: '',
  terminaEm: null,
})

const form = reactive<RecurringFormState>(defaultForm())
const showForm = ref(false)
const editingId = ref<string | null>(null)
const generateFuture = ref(false)
const cascade = ref(false)
const formError = ref('')
const statusMessage = ref('')
const fieldErrors = reactive<RecurringFieldErrors>({})

const {
  addRecurring,
  updateRecurring,
  deleteRecurring,
  isSaving,
  actionErrorFor,
  onPeriodChange,
} = useMonthFormActions()
const saving = isSaving('recurrents')
const actionError = actionErrorFor('recurrents')

const editingItem = computed(() =>
  props.items.find((item) => item.id === editingId.value)
)

watch(
  () => props.items,
  () => {
    formError.value = ''
    if (editingId.value) {
      editingId.value = null
      showForm.value = false
    }
    clearFieldErrors()
  },
  { deep: true }
)

watch(
  () => showForm.value,
  () => {
    formError.value = ''
    if (!showForm.value) {
      clearFieldErrors()
    }
  }
)

onPeriodChange(() => {
  formError.value = ''
  statusMessage.value = ''
  showForm.value = false
  editingId.value = null
  generateFuture.value = false
  cascade.value = false
  clearFieldErrors()
})

function parseTags(text: string | null | undefined): string[] | undefined {
  if (!text) return undefined
  const tags = text
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.length ? tags : undefined
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

function openEdit(item: RecurringMovement) {
  form.descricao = item.descricao
  form.valor = item.valor
  form.data = item.data
  form.categoria = item.categoria ?? null
  form.tagsText = item.tags?.join(', ') ?? ''
  form.terminaEm = item.recorrencia?.termina_em ?? null
  editingId.value = item.id
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
  generateFuture.value = false
  cascade.value = false
  formError.value = ''
  clearFieldErrors()
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isYearMonth(value: string) {
  return /^\d{4}-\d{2}$/.test(value)
}

function clearFieldErrors() {
  ;(Object.keys(fieldErrors) as (keyof RecurringFieldErrors)[]).forEach(
    (key) => {
      delete fieldErrors[key]
    }
  )
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
    fieldErrors.valor = 'Informe um valor numerico valido'
    return false
  }
  delete fieldErrors.valor
  return true
}

function ensureData() {
  if (!form.data || !isIsoDate(form.data)) {
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

function ensureTagsLimit() {
  const tags = parseTags(form.tagsText) ?? []
  if (tags.length > 8) {
    fieldErrors.tagsText = 'Use no maximo 8 tags separadas por virgula'
    return false
  }
  delete fieldErrors.tagsText
  return true
}

function ensureTerminaEm() {
  const terminaValue = form.terminaEm?.trim() ?? ''
  if (terminaValue && !isYearMonth(terminaValue)) {
    fieldErrors.terminaEm = 'Termina em deve seguir YYYY-MM'
    return { valid: false, value: terminaValue }
  }
  delete fieldErrors.terminaEm
  return { valid: true, value: terminaValue }
}

function ensureGenerateFuture(terminaValue?: string) {
  const normalized = terminaValue ?? form.terminaEm?.trim() ?? ''
  if (!editingId.value && generateFuture.value && !normalized) {
    fieldErrors.generateFuture =
      'Defina termina em (YYYY-MM) para gerar meses futuros'
    return false
  }
  delete fieldErrors.generateFuture
  return true
}

function ensureCascadeAllowed() {
  if (cascade.value && !editingItem.value?.serie_id) {
    fieldErrors.cascade = 'Cascade disponivel apenas para series ativas'
    return false
  }
  delete fieldErrors.cascade
  return true
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
  () => form.tagsText,
  () => {
    ensureTagsLimit()
  }
)

watch(
  () => form.terminaEm,
  () => {
    const { value } = ensureTerminaEm()
    ensureGenerateFuture(value)
  }
)

watch(
  () => generateFuture.value,
  () => {
    ensureGenerateFuture()
  }
)

watch(
  () => cascade.value,
  () => {
    ensureCascadeAllowed()
  }
)

watch(
  () => editingItem.value,
  () => {
    ensureCascadeAllowed()
  }
)

function validateRecurring(): boolean {
  const checks = [
    ensureDescricao(),
    ensureValor(),
    ensureData(),
    ensureCategoria(),
    ensureTagsLimit(),
  ]
  const terminaResult = ensureTerminaEm()
  checks.push(terminaResult.valid)
  checks.push(ensureGenerateFuture(terminaResult.value))
  checks.push(ensureCascadeAllowed())
  return checks.every(Boolean)
}

async function submit() {
  formError.value = ''
  statusMessage.value = ''
  const isValid = validateRecurring()
  if (!isValid) {
    formError.value = 'Revise os campos destacados para continuar'
    return
  }
  const payload: RecurringMovementPayload = {
    descricao: form.descricao.trim(),
    valor: Number(form.valor ?? 0),
    data: form.data,
    categoria: form.categoria?.trim() || null,
    tags: parseTags(form.tagsText) ?? [],
    recorrencia: {
      tipo: 'mensal',
      termina_em: form.terminaEm?.trim() || null,
    },
  }

  if (editingId.value) {
    try {
      await updateRecurring(
        props.period,
        editingId.value,
        payload,
        cascade.value && editingItem.value?.serie_id
          ? { cascade: true }
          : undefined
      )
      statusMessage.value = 'Recorrente atualizado'
      cancelForm()
    } catch {
      // erro tratado no store
    }
  } else {
    try {
      await addRecurring(props.period, payload, {
        generateFuture: generateFuture.value ? true : undefined,
      })
      statusMessage.value = 'Recorrente criado'
      cancelForm()
    } catch {
      // erro tratado no store
    }
  }
}

async function handleDelete(itemId: string) {
  formError.value = ''
  statusMessage.value = ''
  try {
    await deleteRecurring(props.period, itemId)
    statusMessage.value = 'Recorrente removido'
  } catch {
    // erro tratado no store
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-ink-500">{{ title }}</p>
        <p class="text-xs text-ink-500">{{ items.length }} itens</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
        <button
          class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving"
          @click="openCreate"
        >
          Nova recorrencia
        </button>
      </div>
    </div>

    <MonthActionFeedback
      class="mt-2"
      test-id="recurring-feedback"
      :form-error="formError"
      :action-error="actionError"
      :status-message="statusMessage"
    />

    <div v-if="items.length" class="mt-4 space-y-3">
      <article
        v-for="rec in items"
        :key="rec.id"
        class="rounded-lg border border-slate-200 p-3 text-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-ink-900">{{ rec.descricao }}</p>
            <p class="text-xs text-ink-500">
              {{ rec.data }} | {{ rec.categoria ?? 'Sem categoria' }}
            </p>
            <p v-if="rec.tags?.length" class="text-xs text-ink-500">
              Tags: {{ rec.tags.join(', ') }}
            </p>
            <p v-if="rec.recorrencia" class="text-xs text-ink-500">
              Termina em: {{ rec.recorrencia.termina_em ?? 'indefinido' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span
              :class="rec.valor >= 0 ? 'text-mint-600' : 'text-rose-600'"
              class="text-sm font-semibold"
            >
              {{ formatCurrency(rec.valor) }}
            </span>
            <button
              class="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed"
              type="button"
              :disabled="saving"
              @click="openEdit(rec)"
            >
              Editar
            </button>
            <button
              class="rounded border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed"
              type="button"
              :disabled="saving"
              @click="handleDelete(rec.id)"
            >
              Excluir
            </button>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="mt-4 text-sm text-ink-500">
      Nenhum recorrente cadastrado.
    </p>

    <div
      v-if="showForm"
      class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm font-semibold text-ink-900">
          {{ editingId ? 'Editar recorrencia' : 'Nova recorrencia' }}
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
          <span>Data (dia no mes)</span>
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
          <span>Tags</span>
          <input
            v-model="form.tagsText"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.tagsText
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            placeholder="separe por virgula"
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.tagsText" class="text-xs text-rose-600">
            {{ fieldErrors.tagsText }}
          </p>
        </label>

        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Recorrencia termina em</span>
          <input
            v-model="form.terminaEm"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.terminaEm
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            placeholder="YYYY-MM (opcional)"
            type="text"
            :disabled="saving"
          />
          <p v-if="fieldErrors.terminaEm" class="text-xs text-rose-600">
            {{ fieldErrors.terminaEm }}
          </p>
        </label>

        <div
          v-if="!editingId || editingItem?.serie_id"
          class="flex flex-wrap items-center gap-4 text-xs text-ink-600 md:col-span-2"
        >
          <label
            v-if="!editingId"
            class="flex items-center gap-2 font-semibold text-ink-700"
          >
            <input v-model="generateFuture" type="checkbox" :disabled="saving" />
            <span>Gerar para meses futuros</span>
          </label>
          <label
            v-else-if="editingItem?.serie_id"
            class="flex items-center gap-2 font-semibold text-ink-700"
          >
            <input v-model="cascade" type="checkbox" :disabled="saving" />
            <span>Aplicar em toda a serie</span>
          </label>
        </div>
        <p
          v-if="fieldErrors.generateFuture"
          class="text-xs text-rose-600 md:col-span-2"
        >
          {{ fieldErrors.generateFuture }}
        </p>
        <p v-if="fieldErrors.cascade" class="text-xs text-rose-600 md:col-span-2">
          {{ fieldErrors.cascade }}
        </p>

        <div class="flex items-center gap-3 md:col-span-2">
          <button
            class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            :disabled="saving"
          >
            {{ editingId ? 'Salvar edicao' : 'Adicionar recorrencia' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
