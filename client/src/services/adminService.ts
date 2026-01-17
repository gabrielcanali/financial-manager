import type {
  AdminBootstrapResponse,
  AdminExportResponse,
  AdminImportResponse,
  AdminStatus,
  AdminValidationResult,
  BackupInfo,
  DatabaseSnapshot,
} from '@/types/schema'
import { get, post } from './httpClient'

type BootstrapPayload = {
  config?: DatabaseSnapshot['config']
  year?: string | number
  month?: string | number
}

export async function fetchStatus(): Promise<AdminStatus> {
  return get<AdminStatus>('/admin/status')
}

export async function exportData(): Promise<AdminExportResponse> {
  return get<AdminExportResponse>('/admin/export')
}

export async function validateImport(
  payload: DatabaseSnapshot | Record<string, unknown>
): Promise<AdminValidationResult> {
  return post<AdminValidationResult>('/admin/validate', payload)
}

export async function importData(
  payload: DatabaseSnapshot | Record<string, unknown>,
  options?: { backup?: boolean }
): Promise<AdminImportResponse> {
  return post<AdminImportResponse>(
    '/admin/import',
    payload,
    options?.backup === false ? { backup: false } : undefined
  )
}

export async function bootstrapData(
  payload: BootstrapPayload
): Promise<AdminBootstrapResponse> {
  return post<AdminBootstrapResponse>('/admin/bootstrap', payload)
}

export async function triggerBackup(): Promise<BackupInfo> {
  return post<BackupInfo>('/admin/backup')
}
