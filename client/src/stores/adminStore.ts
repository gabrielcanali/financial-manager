import { defineStore } from 'pinia'
import {
  bootstrapData,
  exportData,
  fetchStatus,
  importData,
  triggerBackup,
  validateImport,
} from '@/services/adminService'
import type {
  AdminExportResponse,
  AdminImportResponse,
  AdminStatus,
  AdminValidationResult,
  BackupInfo,
  DatabaseSnapshot,
} from '@/types/schema'

interface AdminState {
  status: AdminStatus | null
  lastExport: AdminExportResponse | null
  lastValidation: AdminValidationResult | null
  lastImport: AdminImportResponse | null
  lastBackup: BackupInfo | null
  loading: boolean
  error: string | null
}

function normalizeError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    status: null,
    lastExport: null,
    lastValidation: null,
    lastImport: null,
    lastBackup: null,
    loading: false,
    error: null,
  }),
  actions: {
    async loadStatus() {
      this.loading = true
      this.error = null
      try {
        const result = await fetchStatus()
        this.status = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao consultar status da base')
        throw err
      } finally {
        this.loading = false
      }
    },
    async runExport() {
      this.loading = true
      this.error = null
      try {
        const result = await exportData()
        this.lastExport = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao exportar base')
        throw err
      } finally {
        this.loading = false
      }
    },
    async runValidation(
      payload: DatabaseSnapshot | Record<string, unknown>
    ) {
      this.loading = true
      this.error = null
      try {
        const result = await validateImport(payload)
        this.lastValidation = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao validar importacao')
        throw err
      } finally {
        this.loading = false
      }
    },
    async runImport(
      payload: DatabaseSnapshot | Record<string, unknown>,
      options?: { backup?: boolean }
    ) {
      this.loading = true
      this.error = null
      try {
        const result = await importData(payload, options)
        this.lastImport = result
        await this.loadStatus()
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao importar base')
        throw err
      } finally {
        this.loading = false
      }
    },
    async runBootstrap(
      payload: Partial<DatabaseSnapshot> & { year?: string | number; month?: string | number }
    ) {
      this.loading = true
      this.error = null
      try {
        const result = await bootstrapData(payload)
        await this.loadStatus()
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao criar base inicial')
        throw err
      } finally {
        this.loading = false
      }
    },
    async runBackup() {
      this.loading = true
      this.error = null
      try {
        const result = await triggerBackup()
        this.lastBackup = result
        return result
      } catch (err) {
        this.error = normalizeError(err, 'Erro ao gerar backup')
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})
