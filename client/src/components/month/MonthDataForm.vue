<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import type { MonthIncomeData } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import { formatCurrency } from '@/utils/formatters'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  income: MonthIncomeData | null
}>()

interface IncomeFieldErrors {
  adiantamento?: string
  pagamento?: string
  total_liquido?: string
}

const form = reactive<MonthIncomeData>({
  adiantamento: props.income?.adiantamento ?? 0,
  pagamento: props.income?.pagamento ?? 0,
  total_liquido: props.income?.total_liquido ?? 0,
})

const statusMessage = ref('')
const validationError = ref('')
const fieldErrors = reactive<IncomeFieldErrors>({})
const { saveIncome, isSaving, actionErrorFor, onPeriodChange } =
  useMonthFormActions()
const saving = isSaving('income')
const actionError = actionErrorFor('income')

function clearFieldErrors() {
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key as keyof IncomeFieldErrors]
  })
}

function setFieldError(
  field: keyof IncomeFieldErrors,
  message: string
) {
  fieldErrors[field] = message
}

function clearFieldError(field: keyof IncomeFieldErrors) {
  delete fieldErrors[field]
}

watch(
  () => props.income,
  (income) => {
    form.adiantamento = income?.adiantamento ?? 0
    form.pagamento = income?.pagamento ?? 0
    form.total_liquido = income?.total_liquido ?? 0
    statusMessage.value = ''
    validationError.value = ''
    clearFieldErrors()
  }
)

watch(
  () => [form.adiantamento, form.pagamento, form.total_liquido],
  () => {
    validationError.value = ''
    statusMessage.value = ''
    if (fieldErrors.adiantamento) {
      validateField('adiantamento')
    }
    if (fieldErrors.pagamento) {
      validateField('pagamento')
    }
    if (fieldErrors.total_liquido) {
      validateField('total_liquido')
    }
  }
)

onPeriodChange(() => {
  validationError.value = ''
  statusMessage.value = ''
  clearFieldErrors()
})

const hasChanges = computed(() => {
  if (!props.income) {
    return true
  }
  return (
    props.income.adiantamento !== form.adiantamento ||
    props.income.pagamento !== form.pagamento ||
    (props.income.total_liquido ?? 0) !== (form.total_liquido ?? 0)
  )
})

function validateField(field: keyof IncomeFieldErrors) {
  const rawValue = form[field as keyof MonthIncomeData] as
    | number
    | string
    | null
    | undefined
  const numericValue =
    rawValue === null || rawValue === undefined || rawValue === ''
      ? NaN
      : Number(rawValue)

  if (Number.isNaN(numericValue)) {
    setFieldError(
      field,
      field === 'total_liquido'
        ? 'Informe um total liquido numerico (negativos sao permitidos)'
        : 'Informe um valor numerico'
    )
    return false
  }

  if ((field === 'adiantamento' || field === 'pagamento') && numericValue < 0) {
    setFieldError(field, 'Valor precisa ser maior ou igual a zero')
    return false
  }

  clearFieldError(field)
  return true
}

function validateIncome(): boolean {
  const validAdiantamento = validateField('adiantamento')
  const validPagamento = validateField('pagamento')
  const validTotal = validateField('total_liquido')

  const isValid = validAdiantamento && validPagamento && validTotal
  if (!isValid) {
    validationError.value = 'Revise os campos destacados antes de salvar'
  }
  return isValid
}

function resetToIncome() {
  validationError.value = ''
  statusMessage.value = ''
  clearFieldErrors()
  form.adiantamento = props.income?.adiantamento ?? 0
  form.pagamento = props.income?.pagamento ?? 0
  form.total_liquido = props.income?.total_liquido ?? 0
}

async function submit() {
  validationError.value = ''
  statusMessage.value = ''
  const isValid = validateIncome()
  if (!isValid) {
    return
  }
  try {
    await saveIncome({ ...form })
    statusMessage.value = 'Salarios atualizados com sucesso'
    clearFieldErrors()
  } catch {
    // erro tratado no store e exibido abaixo
  }
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 p-4">
    <div class="flex items-center justify-between">
      <p class="text-xs uppercase tracking-wide text-ink-500">Salarios</p>
      <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
    </div>

    <form class="mt-3 space-y-3" @submit.prevent="submit">
      <div class="grid gap-3 md:grid-cols-3">
        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Adiantamento</span>
          <input
            v-model.number="form.adiantamento"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.adiantamento
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            type="number"
            step="0.01"
            min="0"
            required
            :disabled="saving"
          />
          <span
            v-if="fieldErrors.adiantamento"
            class="text-xs text-rose-600"
          >
            {{ fieldErrors.adiantamento }}
          </span>
          <span class="text-xs text-ink-500">
            Atual: {{ formatCurrency(props.income?.adiantamento ?? null) }}
          </span>
        </label>
        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Pagamento</span>
          <input
            v-model.number="form.pagamento"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.pagamento
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            type="number"
            step="0.01"
            min="0"
            required
            :disabled="saving"
          />
          <span v-if="fieldErrors.pagamento" class="text-xs text-rose-600">
            {{ fieldErrors.pagamento }}
          </span>
          <span class="text-xs text-ink-500">
            Atual: {{ formatCurrency(props.income?.pagamento ?? null) }}
          </span>
        </label>
        <label class="flex flex-col gap-1 text-sm text-ink-700">
          <span>Total liquido</span>
          <input
            v-model.number="form.total_liquido"
            :class="[
              'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
              fieldErrors.total_liquido
                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                : '',
            ]"
            type="number"
            step="0.01"
            required
            :disabled="saving"
          />
          <span
            v-if="fieldErrors.total_liquido"
            class="text-xs text-rose-600"
          >
            {{ fieldErrors.total_liquido }}
          </span>
          <span class="text-xs text-ink-500">
            Atual: {{ formatCurrency(props.income?.total_liquido ?? null) }}
          </span>
        </label>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <MonthActionFeedback
          test-id="month-data-feedback"
          :form-error="validationError"
          :action-error="actionError"
          :status-message="statusMessage"
        />
        <p v-if="hasChanges" class="text-xs text-amber-700">
          Existem alteracoes nao salvas. Clique em salvar para registrar.
        </p>
        <button
          class="rounded-md bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving || !hasChanges"
          @click="resetToIncome"
        >
          Voltar para valores atuais
        </button>
        <button
          class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          :disabled="saving || !hasChanges"
        >
          Salvar salarios
        </button>
      </div>
    </form>
  </div>
</template>
