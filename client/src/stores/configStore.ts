import { defineStore } from 'pinia'
import { fetchStatus } from '@/services/adminService'
import type { AppConfig } from '@/types/schema'

interface ConfigState {
  config: AppConfig | null
  loading: boolean
  error: string | null
  lastLoadedAt: number | null
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    config: null,
    loading: false,
    error: null,
    lastLoadedAt: null,
  }),
  actions: {
    async loadConfig() {
      this.loading = true
      this.error = null
      try {
        const status = await fetchStatus()
        this.config = status.config ?? null
        this.lastLoadedAt = Date.now()
        return this.config
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar configuracoes'
        this.error = message
        throw err
      } finally {
        this.loading = false
      }
    },
  },
})

