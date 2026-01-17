<script setup lang="ts">
import { reactive, watch, ref } from 'vue'
import type { LoanMovement, LoanMovementBase } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import { formatCurrency } from '@/utils/formatters'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  feitos: LoanMovement[]
  recebidos: LoanMovement[]
}>()

interface LocalLoanMovement extends LoanMovementBase {
  __localId: string
}

interface LoanFieldErrors {
  descricao?: string
  valor?: string
  data?: string
}

const localLoans = reactive<{
  feitos: LocalLoanMovement[]
  recebidos: LocalLoanMovement[]
}>({
  feitos: [],
  recebidos: [],
})

const formError = ref('')
const statusMessage = ref('')
const loanErrors = reactive<Record<string, LoanFieldErrors>>({})
const { saveLoans, isSaving, actionErrorFor, onPeriodChange } =
  useMonthFormActions()
const saving = isSaving('loans')
const actionError = actionErrorFor('loans')

function createLoanLocalId(seed?: string) {
  if (seed) return seed
  return `loan-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function pruneLoanErrors() {
  const activeIds = new Set(
    [...localLoans.feitos, ...localLoans.recebidos].map(
      (loan) => loan.__localId
    )
  )
  Object.keys(loanErrors).forEach((key) => {
    if (!activeIds.has(key)) {
      delete loanErrors[key]
    }
  })
}

function syncLoans(feitos: LoanMovement[], recebidos: LoanMovement[]) {
  localLoans.feitos = feitos.map((loan) => ({
    ...loan,
    __localId: createLoanLocalId(loan.id),
  }))
  localLoans.recebidos = recebidos.map((loan) => ({
    ...loan,
    __localId: createLoanLocalId(loan.id),
  }))
  pruneLoanErrors()
  formError.value = ''
}

watch(
  () => [props.feitos, props.recebidos],
  ([feitos, recebidos]) => syncLoans(feitos, recebidos),
  { immediate: true, deep: true }
)

onPeriodChange(() => {
  formError.value = ''
  statusMessage.value = ''
})

function addLoan(type: 'feitos' | 'recebidos') {
  formError.value = ''
  statusMessage.value = 'Novo emprestimo adicionado. Salve para registrar'
  localLoans[type].push({
    __localId: createLoanLocalId(),
    descricao: '',
    valor: 0,
    data: '',
  })
}

function removeLoan(type: 'feitos' | 'recebidos', index: number) {
  if (saving.value) return
  const [removed] = localLoans[type].splice(index, 1)
  if (removed) {
    delete loanErrors[removed.__localId]
  }
  statusMessage.value = 'Item removido. Salve para confirmar'
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function ensureLoanErrorContainer(key: string) {
  if (!loanErrors[key]) {
    loanErrors[key] = {}
  }
  return loanErrors[key]
}

function setLoanFieldError(
  key: string,
  field: keyof LoanFieldErrors,
  message: string
) {
  const container = ensureLoanErrorContainer(key)
  container[field] = message
}

function clearLoanFieldError(key: string, field: keyof LoanFieldErrors) {
  if (loanErrors[key]) {
    delete loanErrors[key][field]
    if (!Object.keys(loanErrors[key]).length) {
      delete loanErrors[key]
    }
  }
}

function validateLoan(loan: LocalLoanMovement) {
  const key = loan.__localId
  let valid = true
  if (!loan.descricao.trim()) {
    setLoanFieldError(key, 'descricao', 'Descricao obrigatoria')
    valid = false
  } else {
    clearLoanFieldError(key, 'descricao')
  }
  if (!loan.data || !isIsoDate(loan.data)) {
    setLoanFieldError(key, 'data', 'Data deve seguir YYYY-MM-DD')
    valid = false
  } else {
    clearLoanFieldError(key, 'data')
  }
  const numericValue =
    loan.valor === null ? NaN : Number.parseFloat(String(loan.valor))
  if (Number.isNaN(numericValue)) {
    setLoanFieldError(
      key,
      'valor',
      'Informe um valor numerico para o emprestimo'
    )
    valid = false
  } else if (numericValue <= 0) {
    setLoanFieldError(key, 'valor', 'Valor deve ser maior que zero')
    valid = false
  } else {
    clearLoanFieldError(key, 'valor')
  }
  return valid
}

function validateLoans(): boolean {
  const allLoans = [...localLoans.feitos, ...localLoans.recebidos]
  let totalValid = true
  for (const loan of allLoans) {
    const valid = validateLoan(loan)
    if (!valid) {
      totalValid = false
    }
  }
  return totalValid
}

watch(
  () => [localLoans.feitos, localLoans.recebidos],
  () => {
    const allLoans = [...localLoans.feitos, ...localLoans.recebidos]
    allLoans.forEach((loan) => {
      if (loanErrors[loan.__localId]) {
        validateLoan(loan)
      }
    })
  },
  { deep: true }
)

async function submit() {
  formError.value = ''
  statusMessage.value = ''
  const isValid = validateLoans()
  if (!isValid) {
    formError.value = 'Revise os emprestimos destacados antes de salvar'
    return
  }
  try {
    await saveLoans({
      feitos: localLoans.feitos.map((loan) => {
        const { __localId, ...rest } = loan
        return {
          ...rest,
          descricao: rest.descricao.trim(),
          valor: Number(rest.valor ?? 0),
        }
      }),
      recebidos: localLoans.recebidos.map((loan) => {
        const { __localId, ...rest } = loan
        return {
          ...rest,
          descricao: rest.descricao.trim(),
          valor: Number(rest.valor ?? 0),
        }
      }),
    })
    statusMessage.value = 'Emprestimos salvos com sucesso'
  } catch {
    // erro tratado no store
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs uppercase tracking-wide text-ink-500">Emprestimos</p>
      <div class="flex items-center gap-2">
        <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
        <button
          class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving"
          @click="addLoan('feitos')"
        >
          + Feito
        </button>
        <button
          class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving"
          @click="addLoan('recebidos')"
        >
          + Recebido
        </button>
      </div>
    </div>

    <MonthActionFeedback
      class="mt-2"
      test-id="loans-feedback"
      :form-error="formError"
      :action-error="actionError"
      :status-message="statusMessage"
    />

    <div class="mt-3 grid gap-3 md:grid-cols-2">
      <div class="rounded-lg border border-slate-200 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Feitos
        </p>
        <div
          v-for="(loan, index) in localLoans.feitos"
          :key="loan.__localId"
          class="mt-2 rounded border border-slate-200 p-2 text-xs"
        >
          <div class="flex items-center justify-between">
            <span class="font-semibold text-ink-900">
              {{ loan.descricao || 'Novo emprestimo' }}
            </span>
            <span>{{ formatCurrency(loan.valor) }}</span>
          </div>
          <div class="mt-2 grid gap-2">
            <input
              v-model="loan.descricao"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.descricao
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Descricao"
              required
              type="text"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.descricao"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.descricao }}
            </span>
            <input
              v-model.number="loan.valor"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.valor
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Valor"
              step="0.01"
              required
              type="number"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.valor"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.valor }}
            </span>
            <input
              v-model="loan.data"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.data
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Data"
              required
              type="date"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.data"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.data }}
            </span>
            <button
              class="self-start text-rose-600"
              type="button"
              :disabled="saving"
              @click="removeLoan('feitos', index)"
            >
              Remover
            </button>
          </div>
        </div>
        <p v-if="!localLoans.feitos.length" class="mt-2 text-xs text-ink-500">
          Nenhum emprestimo feito.
        </p>
      </div>

      <div class="rounded-lg border border-slate-200 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Recebidos
        </p>
        <div
          v-for="(loan, index) in localLoans.recebidos"
          :key="loan.__localId"
          class="mt-2 rounded border border-slate-200 p-2 text-xs"
        >
          <div class="flex items-center justify-between">
            <span class="font-semibold text-ink-900">
              {{ loan.descricao || 'Novo emprestimo' }}
            </span>
            <span>{{ formatCurrency(loan.valor) }}</span>
          </div>
          <div class="mt-2 grid gap-2">
            <input
              v-model="loan.descricao"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.descricao
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Descricao"
              required
              type="text"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.descricao"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.descricao }}
            </span>
            <input
              v-model.number="loan.valor"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.valor
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Valor"
              step="0.01"
              required
              type="number"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.valor"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.valor }}
            </span>
            <input
              v-model="loan.data"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                loanErrors[loan.__localId]?.data
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              placeholder="Data"
              required
              type="date"
              :disabled="saving"
            />
            <span
              v-if="loanErrors[loan.__localId]?.data"
              class="text-xs text-rose-600"
            >
              {{ loanErrors[loan.__localId]?.data }}
            </span>
            <button
              class="self-start text-rose-600"
              type="button"
              :disabled="saving"
              @click="removeLoan('recebidos', index)"
            >
              Remover
            </button>
          </div>
        </div>
        <p
          v-if="!localLoans.recebidos.length"
          class="mt-2 text-xs text-ink-500"
        >
          Nenhum emprestimo recebido.
        </p>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-3">
      <button
        class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        :disabled="saving"
        @click="submit"
      >
        Salvar emprestimos
      </button>
    </div>
  </div>
</template>
