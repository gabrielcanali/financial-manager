<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import MonthActionFeedback from '@/components/month/MonthActionFeedback.vue'
import { useApartmentStore } from '@/stores/apartmentStore'
import { usePeriodStore } from '@/stores/periodStore'
import type {
  ApartmentInstallment,
  ApartmentInstallmentInput,
  ApartmentSeriesKey,
} from '@/types/schema'
import { formatCurrency } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    title: string
    entries: ApartmentInstallment[]
    seriesKey: ApartmentSeriesKey
    emptyMessage: string
    staleSnapshot?: boolean
  }>(),
  {
    staleSnapshot: false,
  }
)

const emit = defineEmits<{
  (
    event: 'updated',
    payload: { reference: string; syncedWithCurrentPeriod: boolean }
  ): void
}>()

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
const selectedReference = computed(() => {
  if (!year.value || !month.value) {
    return ''
  }
  return `${year.value}-${month.value}`
})
const isSeriesLocked = computed(() => !isSnapshotCurrent.value)

const showForm = ref(false)
const editingRef = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  ano: year.value ?? '',
  mes: month.value ?? '',
  valor_parcela: '',
  saldo_devedor: '',
})

const fieldErrors = reactive<{
  ano?: string
  mes?: string
  valor_parcela?: string
  saldo_devedor?: string
}>({})

const statusMessage = ref('')
const validationError = ref('')
const actionError = ref('')

const hasEntries = computed(() => props.entries.length > 0)
const formTitle = computed(() =>
  editingRef.value
    ? `Editando ${editingRef.value}`
    : `Nova parcela - ${props.title}`
)
const staleSnapshot = computed(() => Boolean(props.staleSnapshot))

watch([year, month], () => {
  resetFeedback()
  if (!editingRef.value) {
    form.ano = year.value ?? ''
    form.mes = month.value ?? ''
  }
})

watch(
  () => [form.ano, form.mes, form.valor_parcela, form.saldo_devedor],
  () => {
    validationError.value = ''
    actionError.value = ''
  }
)

watch(isSeriesLocked, (locked) => {
  if (locked) {
    cancelForm()
  }
})

function resetFeedback() {
  validationError.value = ''
  actionError.value = ''
  statusMessage.value = ''
  clearFieldErrors()
}

function clearFieldErrors() {
  fieldErrors.ano = undefined
  fieldErrors.mes = undefined
  fieldErrors.valor_parcela = undefined
  fieldErrors.saldo_devedor = undefined
}

function openCreateForm() {
  if (isSeriesLocked.value) {
    return
  }
  showForm.value = true
  editingRef.value = null
  resetFeedback()
  form.ano = year.value ?? ''
  form.mes = month.value ?? ''
  form.valor_parcela = ''
  form.saldo_devedor = ''
}

function openEditForm(entry: ApartmentInstallment) {
  if (isSeriesLocked.value) {
    return
  }
  showForm.value = true
  editingRef.value = entry.referencia
  resetFeedback()
  form.ano = entry.ano
  form.mes = entry.mes
  form.valor_parcela = entry.valor_parcela.toString()
  form.saldo_devedor =
    entry.saldo_devedor === null ? '' : entry.saldo_devedor.toString()
}

function cancelForm() {
  showForm.value = false
  editingRef.value = null
  resetFeedback()
}

function normalizeYearValue(value: string) {
  return value.trim().padStart(4, '0')
}

function normalizeMonthValue(value: string) {
  return value.trim().padStart(2, '0')
}

function validateForm() {
  clearFieldErrors()
  let isValid = true
  const normalizedYear = normalizeYearValue(String(form.ano ?? ''))
  const normalizedMonth = normalizeMonthValue(String(form.mes ?? ''))

  if (!/^\d{4}$/.test(normalizedYear)) {
    fieldErrors.ano = 'Informe um ano no formato YYYY'
    isValid = false
  }

  if (!/^\d{2}$/.test(normalizedMonth) || Number(normalizedMonth) < 1 || Number(normalizedMonth) > 12) {
    fieldErrors.mes = 'Informe um mes entre 01 e 12'
    isValid = false
  }

  const valor = Number(form.valor_parcela)
  if (
    !String(form.valor_parcela ?? '').trim() ||
    Number.isNaN(valor) ||
    valor <= 0
  ) {
    fieldErrors.valor_parcela = 'Valor da parcela deve ser maior que zero'
    isValid = false
  }

  const saldoRaw = String(form.saldo_devedor ?? '').trim()
  if (saldoRaw) {
    const saldo = Number(saldoRaw)
    if (Number.isNaN(saldo) || saldo < 0) {
      fieldErrors.saldo_devedor =
        'Saldo precisa ser maior ou igual a zero ou deixe em branco'
      isValid = false
    }
  }

  const ref = `${normalizedYear}-${normalizedMonth}`
  const duplicate = props.entries.some(
    (entry) => entry.referencia === ref && entry.referencia !== editingRef.value
  )
  if (duplicate) {
    validationError.value =
      'Ja existe uma parcela registrada para este periodo. Utilize editar para altera-la.'
    isValid = false
  }

  if (!isValid && !validationError.value) {
    validationError.value = 'Revise os campos destacados antes de salvar'
  }

  return isValid
}

type SeriesPayload = {
  year: string
  month: string
  reference: string
  installment: ApartmentInstallmentInput
}

function composeReference(yearValue: string, monthValue: string) {
  return `${normalizeYearValue(String(yearValue ?? ''))}-${normalizeMonthValue(
    String(monthValue ?? '')
  )}`
}

function buildPayload(): SeriesPayload {
  const yearValue = normalizeYearValue(String(form.ano ?? ''))
  const monthValue = normalizeMonthValue(String(form.mes ?? ''))
  const reference = composeReference(yearValue, monthValue)

  const saldoRaw = String(form.saldo_devedor ?? '').trim()
  const saldo = saldoRaw === '' ? null : Number(saldoRaw)

  return {
    year: yearValue,
    month: monthValue,
    reference,
    installment: {
      ano: yearValue,
      mes: monthValue,
      valor_parcela: Number(form.valor_parcela),
      saldo_devedor: saldo,
    },
  }
}

function buildStatusMessage(params: {
  base: string
  reference: string
  synced: boolean
}) {
  if (params.synced) {
    return `${params.base} em ${params.reference}`
  }
  const currentReference =
    selectedReference.value || 'periodo selecionado'
  return `${params.base} em ${params.reference}. Snapshot atual (${currentReference}) permanece inalterado ate voce recarregar.`
}

async function submitForm() {
  validationError.value = ''
  actionError.value = ''
  statusMessage.value = ''
  if (isSeriesLocked.value) {
    return
  }

  if (!validateForm()) {
    return
  }

  const payload = buildPayload()
  const isCurrentPeriod = selectedReference.value === payload.reference
  saving.value = true
  try {
    await apartmentStore.saveSeriesInstallment({
      series: props.seriesKey,
      year: payload.year,
      month: payload.month,
      installment: payload.installment,
      syncSnapshot: isCurrentPeriod,
    })
    const baseMessage = editingRef.value
      ? 'Parcela atualizada com sucesso'
      : 'Parcela registrada com sucesso'
    statusMessage.value = buildStatusMessage({
      base: baseMessage,
      reference: payload.reference,
      synced: isCurrentPeriod,
    })
    showForm.value = false
    editingRef.value = null
    emit('updated', {
      reference: payload.reference,
      syncedWithCurrentPeriod: isCurrentPeriod,
    })
  } catch (err) {
    actionError.value =
      err instanceof Error
        ? err.message
        : 'Erro ao salvar parcela'
  } finally {
    saving.value = false
  }
}

async function deleteEntry(entry: ApartmentInstallment) {
  validationError.value = ''
  actionError.value = ''
  statusMessage.value = ''
  if (isSeriesLocked.value) {
    return
  }
  saving.value = true
  const entryReference = composeReference(entry.ano, entry.mes)
  const isCurrentPeriod = selectedReference.value === entryReference
  try {
    await apartmentStore.saveSeriesInstallment({
      series: props.seriesKey,
      year: entry.ano,
      month: entry.mes,
      installment: null,
      syncSnapshot: isCurrentPeriod,
    })
    statusMessage.value = buildStatusMessage({
      base: 'Parcela removida com sucesso',
      reference: entryReference,
      synced: isCurrentPeriod,
    })
    if (editingRef.value === entry.referencia) {
      cancelForm()
    }
    emit('updated', {
      reference: entryReference,
      syncedWithCurrentPeriod: isCurrentPeriod,
    })
  } catch (err) {
    actionError.value =
      err instanceof Error
        ? err.message
        : 'Erro ao remover parcela'
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
          {{ title }}
        </p>
        <p class="text-xs text-ink-500">
          Gerencie os registros que alimentam a evolucao anual.
        </p>
      </div>
      <button
        class="rounded-md bg-ink-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
        type="button"
        :disabled="saving || isSeriesLocked"
        @click="openCreateForm"
      >
        Nova parcela
      </button>
    </div>

    <div
      v-if="isSeriesLocked"
      data-testid="series-manager-locked-alert"
      class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Edicoes bloqueadas
      </p>
      <p class="mt-1">
        O snapshot atual nao corresponde ao periodo selecionado. Recarregue o apartamento antes de adicionar ou editar parcelas.
      </p>
      <p
        v-if="staleSnapshot"
        data-testid="series-manager-stale-hint"
        class="mt-2 text-xs font-semibold text-amber-700"
      >
        O aviso global destaca que o snapshot esta desatualizado. Recarregue o apartamento para voltar a registrar parcelas.
      </p>
    </div>

    <div class="mt-3">
      <MonthActionFeedback
        :form-error="validationError"
        :action-error="actionError"
        :status-message="statusMessage"
      />
    </div>

    <div v-if="hasEntries" class="mt-4 overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead>
          <tr class="text-xs uppercase tracking-wide text-ink-500">
            <th class="px-3 py-2">Referencia</th>
            <th class="px-3 py-2">Parcela</th>
            <th class="px-3 py-2">Saldo dev.</th>
            <th class="px-3 py-2">Dif. mes anterior</th>
            <th class="px-3 py-2">Variacao saldo</th>
            <th class="px-3 py-2 text-right">Acoes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-ink-800">
          <tr v-for="entry in entries" :key="entry.referencia">
            <td class="px-3 py-2 font-semibold">
              {{ entry.referencia }}
            </td>
            <td class="px-3 py-2">
              {{ formatCurrency(entry.valor_parcela) }}
            </td>
            <td class="px-3 py-2">
              {{ formatCurrency(entry.saldo_devedor) }}
            </td>
            <td class="px-3 py-2">
              {{ formatCurrency(entry.diferenca_vs_mes_anterior) }}
            </td>
            <td class="px-3 py-2">
              {{ formatCurrency(entry.saldo_devedor_variacao) }}
            </td>
            <td class="px-3 py-2 text-right">
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:opacity-50"
                  type="button"
                  :disabled="saving || isSeriesLocked"
                  @click="openEditForm(entry)"
                >
                  Editar
                </button>
                <button
                  class="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                  type="button"
                  :disabled="saving || isSeriesLocked"
                  @click="deleteEntry(entry)"
                >
                  Remover
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="mt-4 text-sm text-ink-500">
      {{ emptyMessage }}
    </p>

    <div v-if="showForm" class="mt-4 rounded-lg border border-slate-200 p-4">
      <div class="flex items-center justify-between">
        <p class="text-sm font-semibold text-ink-900">{{ formTitle }}</p>
        <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
      </div>
      <form class="mt-3 space-y-3" @submit.prevent="submitForm">
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm text-ink-700">
            <span>Ano (YYYY)</span>
            <input
              v-model.trim="form.ano"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                fieldErrors.ano
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="text"
              inputmode="numeric"
              maxlength="4"
              required
              :disabled="saving || isSeriesLocked"
            />
            <span v-if="fieldErrors.ano" class="text-xs text-rose-600">
              {{ fieldErrors.ano }}
            </span>
          </label>
          <label class="flex flex-col gap-1 text-sm text-ink-700">
            <span>Mes (MM)</span>
            <input
              v-model.trim="form.mes"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                fieldErrors.mes
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="text"
              inputmode="numeric"
              maxlength="2"
              required
              :disabled="saving || isSeriesLocked"
            />
            <span v-if="fieldErrors.mes" class="text-xs text-rose-600">
              {{ fieldErrors.mes }}
            </span>
          </label>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm text-ink-700">
            <span>Valor da parcela</span>
            <input
              v-model.trim="form.valor_parcela"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                fieldErrors.valor_parcela
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="number"
              step="0.01"
              min="0"
              required
              :disabled="saving || isSeriesLocked"
            />
            <span
              v-if="fieldErrors.valor_parcela"
              class="text-xs text-rose-600"
            >
              {{ fieldErrors.valor_parcela }}
            </span>
          </label>
          <label class="flex flex-col gap-1 text-sm text-ink-700">
            <span>Saldo devedor (opcional)</span>
            <input
              v-model.trim="form.saldo_devedor"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                fieldErrors.saldo_devedor
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="number"
              step="0.01"
              min="0"
              :disabled="saving || isSeriesLocked"
            />
            <span
              v-if="fieldErrors.saldo_devedor"
              class="text-xs text-rose-600"
            >
              {{ fieldErrors.saldo_devedor }}
            </span>
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="ml-auto flex flex-wrap gap-2">
            <button
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:opacity-60"
              type="button"
              :disabled="saving || isSeriesLocked"
              @click="cancelForm"
            >
              Cancelar
            </button>
            <button
              class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              :disabled="saving || isSeriesLocked"
            >
              Salvar parcela
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
