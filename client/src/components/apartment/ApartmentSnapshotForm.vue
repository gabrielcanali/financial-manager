<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import MonthActionFeedback from '@/components/month/MonthActionFeedback.vue'
import { useApartmentStore } from '@/stores/apartmentStore'
import { usePeriodStore } from '@/stores/periodStore'
import type {
  ApartmentInstallment,
  ApartmentInstallmentInput,
  ApartmentMonthSnapshot,
  ApartmentPayload,
} from '@/types/schema'
import { formatCurrency } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    snapshot: ApartmentMonthSnapshot | null
    staleSnapshot?: boolean
  }>(),
  {
    staleSnapshot: false,
  }
)

type InstallmentKey = 'caixa' | 'construtora'

interface InstallmentFormState {
  enabled: boolean
  valor_parcela: number | null
  saldo_devedor: number | null
}

interface InstallmentFieldErrors {
  valor_parcela?: string
  saldo_devedor?: string
}

type InstallmentStateMap = Record<InstallmentKey, InstallmentFormState>
type FieldErrorState = Record<InstallmentKey, InstallmentFieldErrors>

const apartmentStore = useApartmentStore()
const periodStore = usePeriodStore()
const { year, month } = storeToRefs(periodStore)
const isSnapshotCurrent = computed(() => {
  const rawValue = apartmentStore.isSnapshotCurrent as unknown
  if (typeof rawValue === 'boolean') {
    return rawValue
  }
  if (
    rawValue &&
    typeof rawValue === 'object' &&
    'value' in (rawValue as Record<string, unknown>)
  ) {
    return Boolean((rawValue as { value: unknown }).value)
  }
  return Boolean(rawValue)
})

const form = reactive<InstallmentStateMap>({
  caixa: createInstallmentState(null),
  construtora: createInstallmentState(null),
})

const fieldErrors = reactive<FieldErrorState>({
  caixa: {},
  construtora: {},
})

const initialState = ref<InstallmentStateMap>(captureState())

const statusMessage = ref('')
const validationError = ref('')
const actionError = ref('')
const saving = ref(false)

const totals = computed(() => props.snapshot?.totais ?? null)
const isEditingLocked = computed(() => !isSnapshotCurrent.value)
const staleSnapshot = computed(() => Boolean(props.staleSnapshot))

const hasChanges = computed(() => {
  const baseline = initialState.value
  return (
    !isSameInstallment(form.caixa, baseline.caixa) ||
    !isSameInstallment(form.construtora, baseline.construtora)
  )
})
const showUnsavedChangesHint = computed(
  () => hasChanges.value && !isEditingLocked.value
)

watch(
  () => props.snapshot,
  (snapshot) => {
    setInstallment('caixa', snapshot?.financiamento_caixa ?? null)
    setInstallment('construtora', snapshot?.entrada_construtora ?? null)
    initialState.value = captureState()
    resetAllFeedback()
    clearAllFieldErrors()
  },
  { immediate: true }
)

watch(
  () => [
    form.caixa.enabled,
    form.caixa.valor_parcela,
    form.caixa.saldo_devedor,
    form.construtora.enabled,
    form.construtora.valor_parcela,
    form.construtora.saldo_devedor,
  ],
  () => {
    clearLocalMessages()
    resolveFieldRevalidation('caixa')
    resolveFieldRevalidation('construtora')
  }
)

watch([year, month], () => {
  resetAllFeedback()
  clearAllFieldErrors()
})

watch(isEditingLocked, (locked) => {
  if (locked) {
    resetToSnapshot()
    resetAllFeedback()
    clearAllFieldErrors()
  }
})

function createInstallmentState(
  installment: ApartmentInstallment | null
): InstallmentFormState {
  return {
    enabled: Boolean(installment),
    valor_parcela: installment?.valor_parcela ?? null,
    saldo_devedor: installment?.saldo_devedor ?? null,
  }
}

function captureState(): InstallmentStateMap {
  return {
    caixa: { ...form.caixa },
    construtora: { ...form.construtora },
  }
}

function setInstallment(
  target: InstallmentKey,
  installment: ApartmentInstallment | null
) {
  Object.assign(form[target], createInstallmentState(installment))
}

function isSameInstallment(
  current: InstallmentFormState,
  baseline: InstallmentFormState
) {
  return (
    current.enabled === baseline.enabled &&
    normalizeNullableNumber(current.valor_parcela) ===
      normalizeNullableNumber(baseline.valor_parcela) &&
    normalizeNullableNumber(current.saldo_devedor) ===
      normalizeNullableNumber(baseline.saldo_devedor)
  )
}

function normalizeNullableNumber(
  value: number | null | undefined
): number | null {
  return value === null || value === undefined ? null : Number(value)
}

function clearLocalMessages() {
  validationError.value = ''
  statusMessage.value = ''
}

function resetAllFeedback() {
  clearLocalMessages()
  actionError.value = ''
}

function clearFieldErrors(target: InstallmentKey) {
  fieldErrors[target].valor_parcela = undefined
  fieldErrors[target].saldo_devedor = undefined
}

function clearAllFieldErrors() {
  clearFieldErrors('caixa')
  clearFieldErrors('construtora')
}

function resolveFieldRevalidation(target: InstallmentKey) {
  if (!form[target].enabled) {
    clearFieldErrors(target)
    return
  }
  if (fieldErrors[target].valor_parcela) {
    validateInstallmentField(target, 'valor_parcela')
  }
  if (fieldErrors[target].saldo_devedor) {
    validateInstallmentField(target, 'saldo_devedor')
  }
}

function validateInstallmentField(
  target: InstallmentKey,
  field: keyof InstallmentFieldErrors
) {
  if (!form[target].enabled) {
    return true
  }
  const value = form[target][field]
  if (field === 'valor_parcela') {
    if (
      value === null ||
      Number.isNaN(Number(value)) ||
      Number(value) <= 0
    ) {
      fieldErrors[target][field] =
        'Informe um valor de parcela maior que zero'
      return false
    }
    fieldErrors[target][field] = undefined
    return true
  }
  if (
    value !== null &&
    (Number.isNaN(Number(value)) || Number(value) < 0)
  ) {
    fieldErrors[target][field] =
      'Saldo deve ser maior ou igual a zero ou deixe em branco'
    return false
  }
  fieldErrors[target][field] = undefined
  return true
}

function validateInstallment(target: InstallmentKey) {
  if (!form[target].enabled) {
    return true
  }
  const hasValidValue = validateInstallmentField(
    target,
    'valor_parcela'
  )
  const hasValidBalance = validateInstallmentField(
    target,
    'saldo_devedor'
  )
  return hasValidValue && hasValidBalance
}

function validateForm() {
  const caixaValid = validateInstallment('caixa')
  const construtoraValid = validateInstallment('construtora')
  if (!caixaValid || !construtoraValid) {
    validationError.value = 'Revise os campos destacados antes de salvar'
  }
  return caixaValid && construtoraValid
}

function resetToSnapshot() {
  Object.assign(form.caixa, initialState.value.caixa)
  Object.assign(form.construtora, initialState.value.construtora)
  resetAllFeedback()
  clearAllFieldErrors()
}

function normalizeInstallmentPayload(
  target: InstallmentKey
): ApartmentInstallmentInput | null {
  if (!form[target].enabled) {
    return null
  }
  return {
    ano: year.value,
    mes: month.value,
    valor_parcela: Number(form[target].valor_parcela),
    saldo_devedor: normalizeNullableNumber(
      form[target].saldo_devedor
    ),
  }
}

function buildPayload(): ApartmentPayload {
  return {
    financiamento_caixa: normalizeInstallmentPayload('caixa'),
    entrada_construtora: normalizeInstallmentPayload('construtora'),
  }
}

async function submitForm() {
  clearLocalMessages()
  actionError.value = ''
  if (isEditingLocked.value) {
    return
  }
  if (!hasChanges.value) {
    return
  }
  if (!validateForm()) {
    return
  }
  if (!year.value || !month.value) {
    validationError.value = 'Selecione um periodo valido antes de salvar'
    return
  }
  saving.value = true
  try {
    await apartmentStore.saveMonth(year.value, month.value, buildPayload(), {
      syncSnapshot: true,
    })
    statusMessage.value = 'Snapshot do apartamento salvo com sucesso'
    initialState.value = captureState()
  } catch (err) {
    actionError.value =
      (err instanceof Error && err.message) ||
      apartmentStore.error ||
      'Erro ao salvar dados do apartamento'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-ink-500">
          Snapshot editavel
        </p>
        <p class="text-xs text-ink-500">
          Ajuste as parcelas da Caixa e Construtora conforme o contrato.
        </p>
      </div>
      <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
    </div>

    <div
      v-if="isEditingLocked"
      data-testid="snapshot-form-locked-alert"
      class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p class="font-semibold uppercase tracking-wide text-amber-700 text-xs">
        Edicoes bloqueadas
      </p>
      <p class="mt-1">
        O snapshot corresponde a um periodo diferente do selecionado. Recarregue o apartamento para editar novamente.
      </p>
      <p
        v-if="staleSnapshot"
        data-testid="snapshot-form-stale-hint"
        class="mt-2 text-xs font-semibold text-amber-700"
      >
        O aviso global indica que o snapshot esta desatualizado. Utilize o botao "Recarregar apartamento" para liberar as edicoes.
      </p>
    </div>

    <form class="mt-4 space-y-4" @submit.prevent="submitForm">
      <div class="grid gap-4 lg:grid-cols-3">
        <fieldset class="rounded-lg border border-slate-200 p-4">
          <div class="flex items-center justify-between gap-3">
            <legend class="text-sm font-semibold text-ink-800">
              Financiamento Caixa
            </legend>
            <label class="flex items-center gap-2 text-xs text-ink-600">
              <input
                v-model="form.caixa.enabled"
                class="h-4 w-4 rounded border-slate-300 text-mint-600 focus:ring-2 focus:ring-mint-200"
                type="checkbox"
                :disabled="saving || isEditingLocked"
              />
              Registrar
            </label>
          </div>

          <div
            v-if="form.caixa.enabled"
            class="mt-3 space-y-3 text-sm text-ink-700"
          >
            <label class="flex flex-col gap-1">
              <span>Valor da parcela</span>
              <input
                v-model.number="form.caixa.valor_parcela"
                :class="[
                  'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                  fieldErrors.caixa.valor_parcela
                    ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                    : '',
                ]"
                type="number"
                step="0.01"
                min="0"
                :disabled="saving || isEditingLocked"
              />
              <span
                v-if="fieldErrors.caixa.valor_parcela"
                class="text-xs text-rose-600"
              >
                {{ fieldErrors.caixa.valor_parcela }}
              </span>
              <span class="text-xs text-ink-500">
                Atual: {{ formatCurrency(props.snapshot?.financiamento_caixa?.valor_parcela ?? null) }}
              </span>
            </label>
            <label class="flex flex-col gap-1">
              <span>Saldo devedor</span>
              <input
                v-model.number="form.caixa.saldo_devedor"
                :class="[
                  'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                  fieldErrors.caixa.saldo_devedor
                    ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                    : '',
                ]"
                type="number"
                step="0.01"
                min="0"
                :disabled="saving || isEditingLocked"
              />
              <span
                v-if="fieldErrors.caixa.saldo_devedor"
                class="text-xs text-rose-600"
              >
                {{ fieldErrors.caixa.saldo_devedor }}
              </span>
              <span class="text-xs text-ink-500">
                Atual: {{ formatCurrency(props.snapshot?.financiamento_caixa?.saldo_devedor ?? null) }}
              </span>
            </label>
          </div>
          <p v-else class="mt-3 text-sm text-ink-500">
            Marque "Registrar" para informar a parcela do financiamento.
          </p>
        </fieldset>

        <fieldset class="rounded-lg border border-slate-200 p-4">
          <div class="flex items-center justify-between gap-3">
            <legend class="text-sm font-semibold text-ink-800">
              Entrada Construtora
            </legend>
            <label class="flex items-center gap-2 text-xs text-ink-600">
              <input
                v-model="form.construtora.enabled"
                class="h-4 w-4 rounded border-slate-300 text-mint-600 focus:ring-2 focus:ring-mint-200"
                type="checkbox"
                :disabled="saving || isEditingLocked"
              />
              Registrar
            </label>
          </div>

          <div
            v-if="form.construtora.enabled"
            class="mt-3 space-y-3 text-sm text-ink-700"
          >
            <label class="flex flex-col gap-1">
              <span>Valor da parcela</span>
              <input
                v-model.number="form.construtora.valor_parcela"
                :class="[
                  'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                  fieldErrors.construtora.valor_parcela
                    ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                    : '',
                ]"
                type="number"
                step="0.01"
                min="0"
                :disabled="saving || isEditingLocked"
              />
              <span
                v-if="fieldErrors.construtora.valor_parcela"
                class="text-xs text-rose-600"
              >
                {{ fieldErrors.construtora.valor_parcela }}
              </span>
              <span class="text-xs text-ink-500">
                Atual: {{ formatCurrency(props.snapshot?.entrada_construtora?.valor_parcela ?? null) }}
              </span>
            </label>
            <label class="flex flex-col gap-1">
              <span>Saldo devedor</span>
              <input
                v-model.number="form.construtora.saldo_devedor"
                :class="[
                  'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                  fieldErrors.construtora.saldo_devedor
                    ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                    : '',
                ]"
                type="number"
                step="0.01"
                min="0"
                :disabled="saving || isEditingLocked"
              />
              <span
                v-if="fieldErrors.construtora.saldo_devedor"
                class="text-xs text-rose-600"
              >
                {{ fieldErrors.construtora.saldo_devedor }}
              </span>
              <span class="text-xs text-ink-500">
                Atual: {{ formatCurrency(props.snapshot?.entrada_construtora?.saldo_devedor ?? null) }}
              </span>
            </label>
          </div>
          <p v-else class="mt-3 text-sm text-ink-500">
            Marque "Registrar" para informar a parcela da construtora.
          </p>
        </fieldset>

        <article class="rounded-lg border border-slate-200 p-4">
          <p class="text-xs uppercase tracking-wide text-ink-500">
            Totais atuais
          </p>
          <div v-if="totals" class="mt-3 space-y-2 text-sm text-ink-800">
            <div class="flex items-center justify-between">
              <span>Parcelas combinadas</span>
              <span>{{ formatCurrency(totals.parcelas) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Saldo devedor total</span>
              <span>{{ formatCurrency(totals.saldo_devedor) }}</span>
            </div>
            <p class="text-xs text-ink-500">
              Valores retornam automaticamente da API.
            </p>
          </div>
          <p v-else class="mt-3 text-sm text-ink-500">
            Nenhum total foi calculado para este periodo.
          </p>
        </article>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <MonthActionFeedback
          :form-error="validationError"
          :action-error="actionError"
          :status-message="statusMessage"
        />
        <p v-if="showUnsavedChangesHint" class="text-xs text-amber-700">
          Existem alteracoes nao salvas. Clique em salvar para registrar.
        </p>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button
            class="rounded-md bg-ink-50 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:opacity-60"
            type="button"
            :disabled="saving || !hasChanges || isEditingLocked"
            @click="resetToSnapshot"
          >
            Voltar para valores atuais
          </button>
          <button
            class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            :disabled="saving || !hasChanges || isEditingLocked"
          >
            Salvar snapshot
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
