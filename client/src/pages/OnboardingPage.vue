<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/adminStore'
import { useConfigStore } from '@/stores/configStore'
import { usePeriodStore } from '@/stores/periodStore'
import { formatPlainNumber } from '@/utils/formatters'

const adminStore = useAdminStore()
const configStore = useConfigStore()
const periodStore = usePeriodStore()

const { status, loading, error, lastExport, lastValidation, lastImport, lastBackup } =
  storeToRefs(adminStore)
const { config, loading: configLoading, error: configError } =
  storeToRefs(configStore)
const { year, month } = storeToRefs(periodStore)

const bootstrapYear = ref(year.value)
const bootstrapMonth = ref(month.value)
const jsonInput = ref('')
const localMessage = ref<string | null>(null)

watch(year, (value) => {
  bootstrapYear.value = value
})

watch(month, (value) => {
  bootstrapMonth.value = value
})

const isBusy = computed(() => loading.value || configLoading.value)
const combinedError = computed(() => error.value ?? configError.value)

async function refreshStatus() {
  try {
    await Promise.all([
      adminStore.loadStatus(),
      configStore.loadConfig(),
    ])
  } catch {
    // os stores ja armazenam os erros
  }
}

onMounted(() => {
  refreshStatus()
})

function setMessage(message: string | null) {
  localMessage.value = message
}

function parseJsonInput() {
  if (!jsonInput.value.trim()) {
    throw new Error('Cole um JSON valido antes de continuar')
  }
  try {
    return JSON.parse(jsonInput.value)
  } catch {
    throw new Error('JSON invalido')
  }
}

async function handleValidate() {
  setMessage(null)
  try {
    const payload = parseJsonInput()
    await adminStore.runValidation(payload)
    setMessage('Validacao concluida com sucesso')
  } catch (err) {
    if (err instanceof Error) {
      setMessage(err.message)
    }
  }
}

async function handleImport() {
  setMessage(null)
  try {
    const payload = parseJsonInput()
    await adminStore.runImport(payload)
    setMessage('Importacao concluida')
    await refreshStatus()
  } catch (err) {
    if (err instanceof Error) {
      setMessage(err.message)
    }
  }
}

async function handleExport() {
  setMessage(null)
  try {
    await adminStore.runExport()
    setMessage('Exportacao concluida')
  } catch (err) {
    if (err instanceof Error) {
      setMessage(err.message)
    }
  }
}

async function handleBootstrap() {
  setMessage(null)
  if (!bootstrapYear.value || !bootstrapMonth.value) {
    setMessage('Informe ano e mes para criar a base')
    return
  }
  try {
    await adminStore.runBootstrap({
      year: bootstrapYear.value,
      month: bootstrapMonth.value,
    })
    setMessage('Bootstrap executado')
    await refreshStatus()
  } catch (err) {
    if (err instanceof Error) {
      setMessage(err.message)
    }
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Fase 3 - Onboarding conectado
      </p>
      <h1 class="text-2xl font-semibold text-ink-900">Onboarding</h1>
      <p class="text-sm text-ink-600">
        Esta tela usa somente as rotas de admin descritas em docs/schema.md para preparar a base local.
      </p>
    </div>

    <div v-if="combinedError" class="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
      {{ combinedError }}
    </div>
    <div v-else-if="localMessage" class="rounded-lg border border-mint-200 bg-mint-50 p-3 text-sm text-mint-800">
      {{ localMessage }}
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">/api/admin/status</p>
            <h2 class="text-lg font-semibold text-ink-900">Estado da base</h2>
          </div>
          <button
            class="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-ink-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isBusy"
            type="button"
            @click="refreshStatus"
          >
            Recarregar
          </button>
        </div>
        <div v-if="loading" class="mt-4 text-sm text-ink-500">
          Consultando status...
        </div>
        <dl v-else-if="status" class="mt-4 space-y-2 text-sm text-ink-700">
          <div class="flex items-center justify-between">
            <dt class="font-medium">Base pronta</dt>
            <dd>{{ status.has_data ? 'Sim' : 'Nao' }}</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="font-medium">Ultimo ano/mes</dt>
            <dd>
              <span>{{ status.last_year ?? '--' }}</span>
              <span class="ml-2 text-ink-500">/</span>
              <span class="ml-2">{{ status.last_month ?? '--' }}</span>
            </dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="font-medium">Anos carregados</dt>
            <dd>{{ status.years.length }}</dd>
          </div>
          <div class="flex flex-col">
            <dt class="font-medium">Arquivo JSON</dt>
            <dd class="truncate text-xs text-ink-500">{{ status.db_path }}</dd>
          </div>
        </dl>
        <p v-else class="mt-4 text-sm text-ink-500">
          Nenhuma requisicao de status foi feita ainda.
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">/api/admin/status</p>
            <h2 class="text-lg font-semibold text-ink-900">Configuracao atual</h2>
          </div>
          <span
            class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-500"
          >
            {{ config ? 'Carregada' : 'Aguardando' }}
          </span>
        </div>
        <div v-if="configLoading" class="mt-4 text-sm text-ink-500">
          Buscando configuracao...
        </div>
        <div v-else-if="config" class="mt-4 space-y-2 text-sm text-ink-700">
          <div class="flex items-center justify-between">
            <span class="font-medium">Fechamento da fatura</span>
            <span>{{ config.fechamento_fatura_dia }}</span>
          </div>
          <div class="space-y-1 rounded-lg bg-slate-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Adiantamento de salario
            </p>
            <div class="flex items-center justify-between">
              <span class="text-sm text-ink-600">Habilitado</span>
              <span class="font-medium">{{ config.adiantamento_salario.habilitado ? 'Sim' : 'Nao' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">Dia</span>
              <span>{{ config.adiantamento_salario.dia ?? '--' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">Percentual</span>
              <span>
                {{
                  config.adiantamento_salario.percentual !== null
                    ? formatPlainNumber(config.adiantamento_salario.percentual, { digits: 2 }) + '%'
                    : '--'
                }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="mt-4 text-sm text-ink-500">
          Nenhum config retornado ainda.
        </p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Import/Export</p>
          <h2 class="text-lg font-semibold text-ink-900">Validar ou importar JSON</h2>
          <p class="text-sm text-ink-600">
            Use exatamente o schema descrito em docs/schema.md. Nenhum campo extra sera aceito.
          </p>
        </div>
        <textarea
          v-model="jsonInput"
          class="mt-4 h-44 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-ink-900 shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
          placeholder="Cole o JSON bruto da base local"
        />
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isBusy"
            @click="handleValidate"
          >
            Validar JSON
          </button>
          <button
            class="rounded-md bg-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-mint-600 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isBusy"
            @click="handleImport"
          >
            Importar JSON
          </button>
          <button
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="isBusy"
            @click="handleExport"
          >
            Exportar base
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex flex-col space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Bootstrap</p>
          <h2 class="text-lg font-semibold text-ink-900">Criar base inicial</h2>
          <p class="text-sm text-ink-600">
            Define o ano/mes inicial e opcionalmente reaproveita um config existente.
          </p>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <label class="text-sm font-medium text-ink-700">
            Ano
            <input
              v-model="bootstrapYear"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
              type="text"
              inputmode="numeric"
            />
          </label>
          <label class="text-sm font-medium text-ink-700">
            Mes
            <input
              v-model="bootstrapMonth"
              class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
              type="text"
              inputmode="numeric"
            />
          </label>
        </div>
        <button
          class="mt-4 w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="isBusy"
          @click="handleBootstrap"
        >
          Executar bootstrap
        </button>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">Auditoria rapida</p>
          <h2 class="text-lg font-semibold text-ink-900">Ultimas operacoes</h2>
        </div>
        <span class="text-xs uppercase tracking-wide text-ink-500">
          historico local dos stores
        </span>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-ink-700">
          <p class="font-semibold">Ultima validacao</p>
          <p v-if="lastValidation">
            {{ lastValidation.summary ? `${lastValidation.summary.years} anos / ${lastValidation.summary.months} meses` : 'Sem resumo' }}
          </p>
          <p v-else class="text-ink-500">Nenhuma verificacao ainda.</p>
          <div v-if="lastValidation?.errors.length" class="text-xs text-rose-600">
            Erros: {{ lastValidation.errors.join('; ') }}
          </div>
          <div v-else-if="lastValidation?.warnings.length" class="text-xs text-amber-600">
            Warnings: {{ lastValidation.warnings.join('; ') }}
          </div>
        </div>
        <div class="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-ink-700">
          <p class="font-semibold">Ultima importacao</p>
          <p v-if="lastImport">
            {{ lastImport.status }} em {{ lastImport.imported_at }}
          </p>
          <p v-else class="text-ink-500">Nenhuma importacao registrada.</p>
        </div>
        <div class="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-ink-700">
          <p class="font-semibold">Ultima exportacao</p>
          <p v-if="lastExport">
            Arquivo gerado em {{ lastExport.exported_at }}
          </p>
          <p v-else class="text-ink-500">Sem exportacoes nesta sessao.</p>
        </div>
        <div class="space-y-1 rounded-lg bg-slate-50 p-3 text-sm text-ink-700">
          <p class="font-semibold">Ultimo backup</p>
          <p v-if="lastBackup">
            {{ lastBackup.file }} em {{ lastBackup.backup_at }}
          </p>
          <p v-else class="text-ink-500">Nenhum backup rodado via frontend.</p>
        </div>
      </div>
    </div>
  </section>
</template>
