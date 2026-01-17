import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import OnboardingPage from '../OnboardingPage.vue'
import type {
  AdminExportResponse,
  AdminImportResponse,
  AdminStatus,
  AdminValidationResult,
  AppConfig,
  BackupInfo,
} from '@/types/schema'

const defaultYear = '2024'
const defaultMonth = '05'

const periodState = {
  year: ref(defaultYear),
  month: ref(defaultMonth),
}

const adminState = {
  status: ref<AdminStatus | null>(null),
  loading: ref(false),
  error: ref<string | null>(null),
  lastExport: ref<AdminExportResponse | null>(null),
  lastValidation: ref<AdminValidationResult | null>(null),
  lastImport: ref<AdminImportResponse | null>(null),
  lastBackup: ref<BackupInfo | null>(null),
}

const configState = {
  config: ref<AppConfig | null>(null),
  loading: ref(false),
  error: ref<string | null>(null),
}

const loadStatus = vi.fn(() => Promise.resolve(undefined))
const loadConfig = vi.fn(() => Promise.resolve(undefined))
const runValidation = vi.fn(() => Promise.resolve(undefined))
const runImport = vi.fn(() => Promise.resolve(undefined))
const runExport = vi.fn(() => Promise.resolve(undefined))
const runBootstrap = vi.fn(() => Promise.resolve(undefined))

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => periodState,
}))

vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => ({
    ...adminState,
    loadStatus,
    runValidation,
    runImport,
    runExport,
    runBootstrap,
  }),
}))

vi.mock('@/stores/configStore', () => ({
  useConfigStore: () => ({
    ...configState,
    loadConfig,
  }),
}))

function resetStores() {
  periodState.year.value = defaultYear
  periodState.month.value = defaultMonth
  adminState.status.value = null
  adminState.loading.value = false
  adminState.error.value = null
  adminState.lastExport.value = null
  adminState.lastValidation.value = null
  adminState.lastImport.value = null
  adminState.lastBackup.value = null
  configState.config.value = null
  configState.loading.value = false
  configState.error.value = null
  loadStatus.mockReset()
  loadConfig.mockReset()
  runValidation.mockReset()
  runImport.mockReset()
  runExport.mockReset()
  runBootstrap.mockReset()
  loadStatus.mockResolvedValue(undefined)
  loadConfig.mockResolvedValue(undefined)
  runValidation.mockResolvedValue(undefined)
  runImport.mockResolvedValue(undefined)
  runExport.mockResolvedValue(undefined)
  runBootstrap.mockResolvedValue(undefined)
}

function mountOnboardingPage() {
  return mount(OnboardingPage)
}

function getBootstrapInputs(wrapper: ReturnType<typeof mountOnboardingPage>) {
  const inputs = wrapper.findAll('input[inputmode="numeric"]')
  if (inputs.length < 2) {
    throw new Error('Bootstrap inputs not found')
  }
  return inputs
}

function findButton(wrapper: ReturnType<typeof mountOnboardingPage>, label: string) {
  const button = wrapper
    .findAll('button')
    .find((node) => node.text().trim().includes(label))
  if (!button) {
    throw new Error(`Button "${label}" not found`)
  }
  return button
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    resetStores()
  })

  it('refreshes admin/config status on mount and syncs bootstrap inputs with the global period', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    expect(loadStatus).toHaveBeenCalledTimes(1)
    expect(loadConfig).toHaveBeenCalledTimes(1)

    const [yearInput, monthInput] = getBootstrapInputs(wrapper)
    expect((yearInput.element as HTMLInputElement).value).toBe(defaultYear)
    expect((monthInput.element as HTMLInputElement).value).toBe(defaultMonth)

    periodState.year.value = '2025'
    periodState.month.value = '07'
    await nextTick()

    expect((yearInput.element as HTMLInputElement).value).toBe('2025')
    expect((monthInput.element as HTMLInputElement).value).toBe('07')
  })

  it('re-runs refreshStatus manually and disables the reload button when busy', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    loadStatus.mockClear()
    loadConfig.mockClear()
    const reloadButton = findButton(wrapper, 'Recarregar')

    await reloadButton.trigger('click')
    await flushPromises()

    expect(loadStatus).toHaveBeenCalledTimes(1)
    expect(loadConfig).toHaveBeenCalledTimes(1)

    adminState.loading.value = true
    await nextTick()
    expect(reloadButton.attributes('disabled')).toBeDefined()

    adminState.loading.value = false
    configState.loading.value = true
    await nextTick()
    expect(reloadButton.attributes('disabled')).toBeDefined()

    configState.loading.value = false
    await nextTick()
    expect(reloadButton.attributes('disabled')).toBeUndefined()
  })

  it('prioritizes store errors over local messages and shows success feedback when operations finish', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    adminState.error.value = 'falhou status'
    await nextTick()
    expect(wrapper.text()).toContain('falhou status')

    adminState.error.value = null
    configState.error.value = 'falhou config'
    await nextTick()
    expect(wrapper.text()).toContain('falhou config')

    configState.error.value = null
    const exportButton = findButton(wrapper, 'Exportar base')
    await exportButton.trigger('click')
    await flushPromises()

    expect(runExport).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Exportacao concluida')
  })

  it('validates JSON input before calling admin actions and refreshes after import', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    const textarea = wrapper.get('textarea')

    await textarea.setValue('   ')
    const validateButton = findButton(wrapper, 'Validar JSON')
    await validateButton.trigger('click')
    await nextTick()
    expect(runValidation).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Cole um JSON valido antes de continuar')

    await textarea.setValue('invalid')
    await validateButton.trigger('click')
    await nextTick()
    expect(runValidation).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('JSON invalido')

    await textarea.setValue('{"foo":"bar"}')

    await validateButton.trigger('click')
    await flushPromises()
    expect(runValidation).toHaveBeenCalledWith({ foo: 'bar' })
    expect(wrapper.text()).toContain('Validacao concluida com sucesso')

    loadStatus.mockClear()
    loadConfig.mockClear()

    const importButton = findButton(wrapper, 'Importar JSON')
    await importButton.trigger('click')
    await flushPromises()

    expect(runImport).toHaveBeenCalledWith({ foo: 'bar' })
    expect(loadStatus).toHaveBeenCalledTimes(1)
    expect(loadConfig).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Importacao concluida')
  })

  it('enforces bootstrap requirements and refreshes data after running', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    const bootstrapButton = findButton(wrapper, 'Executar bootstrap')
    const [yearInput, monthInput] = getBootstrapInputs(wrapper)

    await yearInput.setValue('')
    await monthInput.setValue('')
    await bootstrapButton.trigger('click')
    await nextTick()
    expect(runBootstrap).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Informe ano e mes para criar a base')

    await yearInput.setValue('2026')
    await monthInput.setValue('11')
    const previousStatusCalls = loadStatus.mock.calls.length
    const previousConfigCalls = loadConfig.mock.calls.length

    await bootstrapButton.trigger('click')
    await flushPromises()

    expect(runBootstrap).toHaveBeenCalledWith({
      year: '2026',
      month: '11',
    })
    expect(loadStatus.mock.calls.length).toBe(previousStatusCalls + 1)
    expect(loadConfig.mock.calls.length).toBe(previousConfigCalls + 1)
    expect(wrapper.text()).toContain('Bootstrap executado')

    configState.loading.value = true
    await nextTick()
    expect(bootstrapButton.attributes('disabled')).toBeDefined()
    configState.loading.value = false
    await nextTick()
    expect(bootstrapButton.attributes('disabled')).toBeUndefined()
  })

  it('renders status, config and history data coming from the stores', async () => {
    const wrapper = mountOnboardingPage()
    await flushPromises()

    const appConfig: AppConfig = {
      fechamento_fatura_dia: 20,
      adiantamento_salario: {
        habilitado: true,
        dia: 10,
        percentual: 30,
      },
    }
    configState.config.value = appConfig
    adminState.status.value = {
      has_data: true,
      years: ['2023', '2024'],
      last_year: '2024',
      last_month: '05',
      config: appConfig,
      db_path: '/tmp/db.json',
    }
    adminState.lastValidation.value = {
      errors: [],
      warnings: ['aviso'],
      normalized: null,
      summary: { years: 2, months: 24 },
    }
    adminState.lastImport.value = {
      status: 'ok',
      imported_at: '2024-05-01',
      size_bytes: 0,
      config: appConfig,
      warnings: [],
      backup: null,
      summary: { years: 2, months: 24 },
    }
    adminState.lastExport.value = {
      exported_at: '2024-05-02',
      db: {
        config: appConfig,
        anos: {},
        apartamento: { financiamento_caixa: [], entrada_construtora: [] },
      },
    }
    adminState.lastBackup.value = {
      backup_at: '2024-05-03',
      file: 'backup.zip',
      size_bytes: 0,
      reason: 'manual',
    }

    await nextTick()

    const text = wrapper.text()
    expect(text).toContain('Base pronta')
    expect(text).toContain('Sim')
    expect(text).toContain('Anos carregados')
    expect(text).toContain('2')
    expect(text).toContain('Arquivo JSON')
    expect(text).toContain('/tmp/db.json')
    expect(text).toContain('Fechamento da fatura')
    expect(text).toContain('20')
    expect(text).toContain('Adiantamento de salario')
    expect(text).toContain('Sim')
    expect(text).toContain('2 anos / 24 meses')
    expect(text).toContain('Warnings: aviso')
    expect(text).toContain('ok em 2024-05-01')
    expect(text).toContain('Arquivo gerado em 2024-05-02')
    expect(text).toContain('backup.zip em 2024-05-03')
  })
})
