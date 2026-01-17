<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '@/stores/adminStore'
import { formatPlainNumber } from '@/utils/formatters'

const adminStore = useAdminStore()
const { status, lastExport, lastValidation, lastBackup, loading, error } =
  storeToRefs(adminStore)

const info = ref<string | null>(null)
const uploadName = ref<string>('')
const uploadPayload = ref<Record<string, unknown> | null>(null)
const backupBeforeImport = ref(true)
const localError = ref<string | null>(null)

const validationErrors = computed(() => lastValidation.value?.errors ?? [])
const validationWarnings = computed(() => lastValidation.value?.warnings ?? [])

onMounted(() => {
  adminStore.loadStatus().catch(() => {
    // erros ficam no store
  })
})

function setInfo(message: string) {
  info.value = message
  setTimeout(() => {
    if (info.value === message) {
      info.value = null
    }
  }, 4000)
}

async function refreshStatus() {
  localError.value = null
  try {
    await adminStore.loadStatus()
    setInfo('Status atualizado')
  } catch {
    // erro fica no store
  }
}

async function runBackup() {
  localError.value = null
  try {
    const result = await adminStore.runBackup()
    setInfo(`Backup gerado em ${result.file}`)
  } catch {
    // erro fica no store
  }
}

function triggerDownload(filename: string, payload: unknown) {
  const serialized = JSON.stringify(payload, null, 2)
  const blob = new Blob([serialized], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function runExport() {
  localError.value = null
  try {
    const result = await adminStore.runExport()
    const safeName = (result.exported_at || 'export')
      .replace(/[:]/g, '-')
      .replace(/\..+$/, '')
    triggerDownload(`financeiro-${safeName}.json`, result.db)
    setInfo('Export concluido (arquivo baixado)')
  } catch {
    // erro fica no store
  }
}

async function validateCurrentBase() {
  localError.value = null
  try {
    const exported = await adminStore.runExport()
    await adminStore.runValidation(exported.db)
    setInfo('Validacao da base atual concluida')
  } catch {
    // erro fica no store
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  localError.value = null
  uploadPayload.value = null
  uploadName.value = file.name
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    uploadPayload.value = parsed
    await adminStore.runValidation(parsed)
    setInfo('Arquivo validado. Revise alertas antes de importar.')
  } catch (err) {
    uploadPayload.value = null
    const message =
      err instanceof Error ? err.message : 'Falha ao ler/validar o arquivo.'
    localError.value = message
  }
}

async function importValidated() {
  if (!uploadPayload.value) {
    localError.value = 'Envie e valide um JSON antes de importar.'
    return
  }

  localError.value = null
  try {
    const result = await adminStore.runImport(uploadPayload.value, {
      backup: backupBeforeImport.value,
    })
    setInfo(`Import concluido (${result.summary.months} meses)`)
    await adminStore.loadStatus()
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Erro ao importar o arquivo.'
    localError.value = message
  }
}
</script>

<template>
  <div class="rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex items-center justify-between gap-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Admin
        </p>
        <h2 class="text-lg font-semibold text-ink-900">Operacoes rapidas</h2>
        <p class="text-xs text-ink-500">
          Backup, exportacao, validacao e importacao controlada da base local.
        </p>
      </div>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-600">
        {{ status?.db_path ?? 'Status pendente' }}
      </span>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="space-y-2 rounded-lg border border-slate-200 p-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-ink-800">Status</p>
          <button
            type="button"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            :disabled="loading"
            @click="refreshStatus"
          >
            Recarregar
          </button>
        </div>
        <p class="text-xs text-ink-500">
          Anos: {{ status?.years?.join(', ') || 'n/d' }} |
          Ultimo mes: {{ status?.last_year }}-{{ status?.last_month }}
        </p>
        <p class="text-xs text-ink-500">
          Fechamento fatura: {{ status?.config?.fechamento_fatura_dia ?? 'n/d' }}
        </p>
        <p class="text-xs text-ink-500">
          Adiantamento: dia {{ status?.config?.adiantamento_salario?.dia ?? 'n/d' }}
          - {{ formatPlainNumber(status?.config?.adiantamento_salario?.percentual ?? 0) }}%
        </p>
      </div>

      <div class="space-y-2 rounded-lg border border-slate-200 p-3">
        <p class="text-sm font-semibold text-ink-800">Export / Backup</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="runBackup"
          >
            {{ loading ? 'Processando...' : 'Backup rapido' }}
          </button>
          <button
            type="button"
            class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="runExport"
          >
            {{ loading ? 'Processando...' : 'Exportar base' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
            @click="validateCurrentBase"
          >
            {{ loading ? 'Processando...' : 'Validar base atual' }}
          </button>
        </div>
        <p v-if="lastBackup" class="text-xs text-ink-500">
          Ultimo backup: {{ lastBackup.backup_at }} ({{ lastBackup.file }})
        </p>
        <p v-if="lastExport" class="text-xs text-ink-500">
          Ultima exportacao: {{ lastExport.exported_at }}
        </p>
      </div>
    </div>

    <div class="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
      <p class="text-sm font-semibold text-ink-800">Validar / Importar JSON</p>
      <div class="flex flex-wrap items-center gap-3">
        <label class="block text-xs font-semibold uppercase tracking-wide text-ink-600">
          Selecionar arquivo
          <input
            type="file"
            accept="application/json"
            class="mt-1 block text-xs text-ink-700"
            :disabled="loading"
            @change="handleFileChange"
          />
        </label>
        <div class="flex items-center gap-2">
          <input
            id="backup-before-import"
            v-model="backupBeforeImport"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label for="backup-before-import" class="text-xs text-ink-600">
            Fazer backup antes de importar
          </label>
        </div>
        <button
          type="button"
          class="rounded-md bg-mint-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-mint-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading || !uploadPayload"
          @click="importValidated"
        >
          {{ loading ? 'Processando...' : 'Importar JSON validado' }}
        </button>
      </div>
      <p class="text-xs text-ink-500">
        {{ uploadName || 'Nenhum arquivo selecionado' }}
      </p>

      <div v-if="validationWarnings.length" class="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
        <p class="font-semibold">Avisos ({{ validationWarnings.length }}):</p>
        <ul class="list-disc pl-4">
          <li v-for="item in validationWarnings" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div v-if="validationErrors.length" class="rounded-md bg-rose-50 p-2 text-xs text-rose-700">
        <p class="font-semibold">Erros ({{ validationErrors.length }}):</p>
        <ul class="list-disc pl-4">
          <li v-for="item in validationErrors" :key="item">{{ item }}</li>
        </ul>
      </div>
      <p v-else-if="lastValidation" class="text-xs text-mint-700">
        JSON validado: {{ lastValidation.summary?.months ?? 0 }} meses / {{ lastValidation.summary?.years ?? 0 }} anos.
      </p>
    </div>

    <p v-if="localError || error" class="mt-3 text-sm text-rose-600">
      {{ localError || error }}
    </p>
    <p v-else-if="info" class="mt-3 text-sm text-mint-700">
      {{ info }}
    </p>
  </div>
</template>
