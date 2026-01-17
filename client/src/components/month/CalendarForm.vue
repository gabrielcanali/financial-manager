<script setup lang="ts">
import { reactive, watch, computed, ref, nextTick } from 'vue'
import type { MonthCalendar } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  calendar: MonthCalendar | null
}>()

interface CalendarFieldErrors {
  fechamento_fatura?: string
  newPayment?: string
  pagamentos?: string
}

const form = reactive<MonthCalendar>({
  pagamentos: props.calendar?.pagamentos ? [...props.calendar.pagamentos] : [],
  fechamento_fatura: props.calendar?.fechamento_fatura ?? null,
})

const newPayment = ref('')
const statusMessage = ref('')
const validationError = ref('')
const fieldErrors = reactive<CalendarFieldErrors>({})
const paymentErrors = reactive<Record<string, string>>({})
const { saveCalendar, isSaving, actionErrorFor, onPeriodChange } =
  useMonthFormActions()
const saving = isSaving('calendar')
const actionError = actionErrorFor('calendar')
const paymentKey = (payment: string, index: number) =>
  `${payment}-${index}`

function clearFieldError(field: keyof CalendarFieldErrors) {
  delete fieldErrors[field]
}

function clearPaymentErrors() {
  Object.keys(paymentErrors).forEach((key) => {
    delete paymentErrors[key]
  })
}

function resetValidationFeedback() {
  validationError.value = ''
  statusMessage.value = ''
  clearFieldError('newPayment')
}

watch(
  () => props.calendar,
  (calendar) => {
    form.pagamentos = calendar?.pagamentos ? [...calendar.pagamentos] : []
    form.fechamento_fatura = calendar?.fechamento_fatura ?? null
    statusMessage.value = ''
    validationError.value = ''
    clearPaymentErrors()
    Object.keys(fieldErrors).forEach((key) => {
      delete fieldErrors[key as keyof CalendarFieldErrors]
    })
    newPayment.value = ''
  }
)

watch(
  () => [form.fechamento_fatura, form.pagamentos.join(',')],
  () => {
    validationError.value = ''
    statusMessage.value = ''
    if (fieldErrors.fechamento_fatura) {
      validateClosingDate()
    }
    if (fieldErrors.pagamentos || Object.keys(paymentErrors).length) {
      validatePaymentsList()
    }
  }
)

onPeriodChange(() => {
  validationError.value = ''
  statusMessage.value = ''
  newPayment.value = ''
  clearPaymentErrors()
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key as keyof CalendarFieldErrors]
  })
})

watch(newPayment, () => {
  validationError.value = ''
  statusMessage.value = ''
  if (
    fieldErrors.newPayment &&
    (!newPayment.value || isIsoDate(newPayment.value))
  ) {
    clearFieldError('newPayment')
  }
})

const isDirty = computed(() => {
  const basePayments = props.calendar?.pagamentos ?? []
  const paymentsChanged =
    form.pagamentos.join(',') !== basePayments.join(',')
  return (
    paymentsChanged ||
    form.fechamento_fatura !== (props.calendar?.fechamento_fatura ?? null)
  )
})

function isIsoDate(value: string | null | undefined) {
  if (!value) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function addPayment() {
  resetValidationFeedback()
  if (!newPayment.value) {
    fieldErrors.newPayment = 'Informe uma data para adicionar'
    return
  }
  if (!isIsoDate(newPayment.value)) {
    fieldErrors.newPayment = 'Use datas ISO (YYYY-MM-DD) para pagamentos'
    return
  }
  if (form.pagamentos.includes(newPayment.value)) {
    fieldErrors.newPayment = 'Data ja adicionada na lista'
    return
  }
  form.pagamentos.push(newPayment.value)
  newPayment.value = ''
  validatePaymentsList()
  nextTick(() => {
    statusMessage.value = 'Data adicionada. Clique em salvar para persistir.'
  })
}

function removePayment(payment: string) {
  form.pagamentos = form.pagamentos.filter((p) => p !== payment)
  validatePaymentsList()
  nextTick(() => {
    statusMessage.value = 'Data removida. Clique em salvar para confirmar.'
  })
}

function validateClosingDate() {
  if (form.fechamento_fatura && !isIsoDate(form.fechamento_fatura)) {
    fieldErrors.fechamento_fatura = 'Use data no formato YYYY-MM-DD'
    return false
  }
  clearFieldError('fechamento_fatura')
  return true
}

function validatePaymentsList() {
  clearPaymentErrors()
  clearFieldError('pagamentos')

  let valid = true
  if (!form.pagamentos.length) {
    fieldErrors.pagamentos = 'Adicione ao menos uma data de pagamento'
    valid = false
  }

  const occurrences = new Map<string, number[]>()

  form.pagamentos.forEach((payment, index) => {
    const key = paymentKey(payment, index)
    if (!isIsoDate(payment)) {
      paymentErrors[key] = 'Use datas no formato YYYY-MM-DD'
      valid = false
    }
    const list = occurrences.get(payment) ?? []
    list.push(index)
    occurrences.set(payment, list)
  })

  const duplicateIndices: number[] = []
  occurrences.forEach((indices, payment) => {
    if (indices.length > 1) {
      duplicateIndices.push(...indices)
      fieldErrors.pagamentos = 'Existem datas de pagamento duplicadas'
      valid = false
      indices.forEach((idx) => {
        const dupKey = paymentKey(payment, idx)
        paymentErrors[dupKey] = 'Data duplicada na lista'
      })
    }
  })

  return valid && !duplicateIndices.length && !Object.keys(paymentErrors).length
}

async function submit() {
  validationError.value = ''
  statusMessage.value = ''
  const validClosing = validateClosingDate()
  const validPayments = validatePaymentsList()
  if (!validClosing || !validPayments) {
    validationError.value = 'Revise os campos destacados antes de salvar'
    return
  }
  try {
    await saveCalendar({
      pagamentos: [...form.pagamentos],
      fechamento_fatura: form.fechamento_fatura || null,
    })
    statusMessage.value = 'Calendario salvo com sucesso'
    clearPaymentErrors()
  } catch {
    // erro tratado no store
  }
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 p-4">
    <div class="flex items-center justify-between">
      <p class="text-xs uppercase tracking-wide text-ink-500">Calendario</p>
      <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
    </div>

    <form class="mt-3 space-y-3" @submit.prevent="submit">
      <label class="flex flex-col gap-1 text-sm text-ink-700">
        <span>Fechamento da fatura</span>
        <input
          v-model="form.fechamento_fatura"
          :class="[
            'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
            fieldErrors.fechamento_fatura
              ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
              : '',
          ]"
          type="date"
          :disabled="saving"
        />
        <span
          v-if="fieldErrors.fechamento_fatura"
          class="text-xs text-rose-600"
        >
          {{ fieldErrors.fechamento_fatura }}
        </span>
        <span class="text-xs text-ink-500">
          Atual: {{ props.calendar?.fechamento_fatura ?? 'Sem data' }}
        </span>
      </label>

      <div class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm font-semibold text-ink-700">Pagamentos</span>
          <div class="flex items-center gap-2">
            <input
              v-model="newPayment"
              :class="[
                'w-40 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                fieldErrors.newPayment
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="date"
              :disabled="saving"
            />
            <span
              v-if="fieldErrors.newPayment"
              class="text-xs text-rose-600"
            >
              {{ fieldErrors.newPayment }}
            </span>
            <button
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100"
              type="button"
              :disabled="!newPayment || saving"
              @click="addPayment"
            >
              Adicionar
            </button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="(payment, index) in form.pagamentos"
            :key="paymentKey(payment, index)"
            class="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-ink-700"
            :class="paymentErrors[paymentKey(payment, index)] ? 'border border-rose-200 bg-rose-50' : ''"
          >
            {{ payment }}
            <button
              class="text-[10px] text-rose-500"
              type="button"
              :disabled="saving"
              @click="removePayment(payment)"
            >
              remover
            </button>
            <span
              v-if="paymentErrors[paymentKey(payment, index)]"
              class="text-[10px] text-rose-600"
            >
              {{ paymentErrors[paymentKey(payment, index)] }}
            </span>
          </span>
          <p v-if="!form.pagamentos.length" class="text-xs text-ink-500">
            Nenhuma data adicionada.
          </p>
          <p v-if="fieldErrors.pagamentos" class="text-xs text-rose-600">
            {{ fieldErrors.pagamentos }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <MonthActionFeedback
          test-id="calendar-feedback"
          :form-error="validationError"
          :action-error="actionError"
          :status-message="statusMessage"
        />
        <p v-if="isDirty" class="text-xs text-amber-700">
          Existem alteracoes nao salvas. Clique em salvar para persistir.
        </p>
        <button
          class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          :disabled="saving || !isDirty"
        >
          Salvar calendario
        </button>
      </div>
    </form>
  </div>
</template>
