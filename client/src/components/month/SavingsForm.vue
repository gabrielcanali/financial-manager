<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { SavingsMovement, SavingsMovementBase } from '@/types/schema'
import { useMonthFormActions } from '@/composables/useMonthFormActions'
import { formatCurrency } from '@/utils/formatters'
import MonthActionFeedback from './MonthActionFeedback.vue'

const props = defineProps<{
  movements: SavingsMovement[]
}>()

interface LocalSavingsMovement extends SavingsMovementBase {
  __localId: string
}

interface MovementFieldErrors {
  descricao?: string
  data?: string
  valor?: string
  tipo?: string
}

const localMovements = ref<LocalSavingsMovement[]>([])
const formError = ref('')
const statusMessage = ref('')
const needsSave = ref(false)
const movementErrors = reactive<Record<string, MovementFieldErrors>>({})
const { saveSavings, isSaving, actionErrorFor, onPeriodChange } =
  useMonthFormActions()
const saving = isSaving('savings')
const actionError = actionErrorFor('savings')
let syncingMovements = false

function createLocalId(seed?: string) {
  if (seed) return seed
  return `local-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function pruneMovementErrors(keys: string[]) {
  const validKeys = new Set(keys)
  Object.keys(movementErrors).forEach((key) => {
    if (!validKeys.has(key)) {
      delete movementErrors[key]
    }
  })
}

function syncMovements(list: SavingsMovement[]) {
  syncingMovements = true
  localMovements.value = list.map((item) => ({
    ...item,
    __localId: createLocalId(item.id),
  }))
  pruneMovementErrors(localMovements.value.map((movement) => movement.__localId))
  formError.value = ''
  statusMessage.value = ''
  needsSave.value = false
  Promise.resolve().then(() => {
    syncingMovements = false
  })
}

watch(
  () => props.movements,
  (value) => syncMovements(value),
  { immediate: true }
)

onPeriodChange(() => {
  formError.value = ''
  statusMessage.value = ''
  needsSave.value = false
})

function addBlankMovement() {
  formError.value = ''
  statusMessage.value =
    'Novo movimento adicionado. Clique em salvar para registrar.'
  localMovements.value.push({
    __localId: createLocalId(),
    descricao: '',
    data: '',
    valor: 0,
    tipo: 'aporte',
  })
  needsSave.value = true
}

function removeMovement(index: number) {
  if (saving.value) return
  const [removed] = localMovements.value.splice(index, 1)
  if (removed) {
    delete movementErrors[removed.__localId]
  }
  statusMessage.value = 'Movimento removido. Clique em salvar para confirmar.'
  needsSave.value = true
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function ensureMovementErrorsContainer(key: string) {
  if (!movementErrors[key]) {
    movementErrors[key] = {}
  }
  return movementErrors[key]
}

function setMovementFieldError(
  key: string,
  field: keyof MovementFieldErrors,
  message: string
) {
  const container = ensureMovementErrorsContainer(key)
  container[field] = message
}

function clearMovementFieldError(
  key: string,
  field: keyof MovementFieldErrors
) {
  if (movementErrors[key]) {
    delete movementErrors[key][field]
    if (!Object.keys(movementErrors[key]).length) {
      delete movementErrors[key]
    }
  }
}

function validateMovement(movement: LocalSavingsMovement) {
  const key = movement.__localId
  let valid = true
  if (!movement.descricao.trim()) {
    setMovementFieldError(key, 'descricao', 'Descricao obrigatoria')
    valid = false
  } else {
    clearMovementFieldError(key, 'descricao')
  }
  if (!movement.data || !isIsoDate(movement.data)) {
    setMovementFieldError(key, 'data', 'Data deve seguir YYYY-MM-DD')
    valid = false
  } else {
    clearMovementFieldError(key, 'data')
  }
  const numericValue =
    movement.valor === null ? NaN : Number.parseFloat(String(movement.valor))
  if (Number.isNaN(numericValue)) {
    setMovementFieldError(
      key,
      'valor',
      'Informe um valor numerico valido para a poupanca'
    )
    valid = false
  } else if (numericValue <= 0) {
    setMovementFieldError(
      key,
      'valor',
      'Valor deve ser maior que zero'
    )
    valid = false
  } else {
    clearMovementFieldError(key, 'valor')
  }
  if (movement.tipo !== 'aporte' && movement.tipo !== 'resgate') {
    setMovementFieldError(key, 'tipo', 'Tipo invalido, escolha aporte ou resgate')
    valid = false
  } else {
    clearMovementFieldError(key, 'tipo')
  }
  return valid
}

function validateMovements(): boolean {
  let allValid = true
  for (const movement of localMovements.value) {
    const isValid = validateMovement(movement)
    if (!isValid) {
      allValid = false
    }
  }
  return allValid
}

watch(
  localMovements,
  () => {
    if (!syncingMovements) {
      needsSave.value = true
    }
    localMovements.value.forEach((movement) => {
      if (movementErrors[movement.__localId]) {
        validateMovement(movement)
      }
    })
  },
  { deep: true }
)

async function submit() {
  formError.value = ''
  statusMessage.value = ''
  const isValid = validateMovements()
  if (!isValid) {
    formError.value = 'Corrija os movimentos destacados antes de salvar'
    return
  }
  try {
    await saveSavings({
      movimentos: localMovements.value.map((movement) => {
        const { __localId, ...rest } = movement
        return {
          ...rest,
          descricao: rest.descricao.trim(),
          valor: Number(rest.valor ?? 0),
        }
      }),
    })
    statusMessage.value = 'Lista de poupanca salva'
    needsSave.value = false
  } catch {
    // erro tratado no store
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase tracking-wide text-ink-500">Poupanca</p>
        <p class="text-xs text-ink-500">{{ movements.length }} movimentos</p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="saving" class="text-xs text-ink-500">Salvando...</span>
        <button
          class="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100"
          type="button"
          :disabled="saving"
          @click="addBlankMovement"
        >
          Adicionar movimento
        </button>
      </div>
    </div>

    <MonthActionFeedback
      class="mt-2"
      test-id="savings-feedback"
      :form-error="formError"
      :action-error="actionError"
      :status-message="statusMessage"
    />
    <p v-if="needsSave" class="mt-1 text-xs text-amber-700">
      Existem alteracoes nao salvas. Clique em "Salvar lista de poupanca" para
      persistir.
    </p>

    <div class="mt-3 space-y-3">
      <div
        v-for="(movement, index) in localMovements"
        :key="movement.__localId"
        class="rounded-lg border border-slate-200 p-3 text-sm"
      >
        <div class="flex items-center justify-between">
          <p class="font-semibold text-ink-900">
            {{ movement.descricao || 'Novo movimento' }}
          </p>
          <span
            :class="
              movement.tipo === 'aporte' ? 'text-mint-600' : 'text-rose-600'
            "
          >
            {{ formatCurrency(movement.valor) }}
          </span>
        </div>
        <div class="mt-2 grid gap-2 md:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-ink-700">
            <span>Descricao</span>
            <input
              v-model="movement.descricao"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                movementErrors[movement.__localId]?.descricao
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="text"
              required
              :disabled="saving"
            />
            <span
              v-if="movementErrors[movement.__localId]?.descricao"
              class="text-xs text-rose-600"
            >
              {{ movementErrors[movement.__localId]?.descricao }}
            </span>
          </label>
          <label class="flex flex-col gap-1 text-xs text-ink-700">
            <span>Data</span>
            <input
              v-model="movement.data"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                movementErrors[movement.__localId]?.data
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="date"
              required
              :disabled="saving"
            />
            <span
              v-if="movementErrors[movement.__localId]?.data"
              class="text-xs text-rose-600"
            >
              {{ movementErrors[movement.__localId]?.data }}
            </span>
          </label>
          <label class="flex flex-col gap-1 text-xs text-ink-700">
            <span>Valor</span>
            <input
              v-model.number="movement.valor"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                movementErrors[movement.__localId]?.valor
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              type="number"
              step="0.01"
              required
              :disabled="saving"
            />
            <span
              v-if="movementErrors[movement.__localId]?.valor"
              class="text-xs text-rose-600"
            >
              {{ movementErrors[movement.__localId]?.valor }}
            </span>
          </label>
          <label class="flex flex-col gap-1 text-xs text-ink-700">
            <span>Tipo</span>
            <select
              v-model="movement.tipo"
              :class="[
                'rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-mint-400 focus:ring-2 focus:ring-mint-100',
                movementErrors[movement.__localId]?.tipo
                  ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100'
                  : '',
              ]"
              :disabled="saving"
            >
              <option value="aporte">Aporte</option>
              <option value="resgate">Resgate</option>
            </select>
            <span
              v-if="movementErrors[movement.__localId]?.tipo"
              class="text-xs text-rose-600"
            >
              {{ movementErrors[movement.__localId]?.tipo }}
            </span>
          </label>
        </div>
        <div class="mt-2 flex justify-end">
          <button
            class="text-xs text-rose-600"
            type="button"
            :disabled="saving"
            @click="removeMovement(index)"
          >
            Remover
          </button>
        </div>
      </div>
      <p v-if="!localMovements.length" class="text-sm text-ink-500">
        Nenhum movimento cadastrado para este mes.
      </p>
    </div>

    <div class="mt-3 flex items-center gap-3">
      <button
        class="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        :disabled="saving"
        @click="submit"
      >
        Salvar lista de poupanca
      </button>
    </div>
  </div>
</template>
