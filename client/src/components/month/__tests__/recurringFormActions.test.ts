import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive } from 'vue'
import RecurringForm from '../RecurringForm.vue'
import type {
  RecurringMovement,
  RecurringPeriodParam,
} from '@/types/schema'

type MonthSavingTarget = 'recurrents'

type TargetState<T> = Record<MonthSavingTarget, T>

type MockActions = ReturnType<typeof createMockActions>

let mockActions: MockActions = createMockActions()

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

const period: RecurringPeriodParam = 'pre'

const recurringItems: RecurringMovement[] = [
  {
    id: 'rec-1',
    descricao: 'Streaming',
    valor: -45,
    data: '2024-01-05',
    categoria: 'Lazer',
    tags: ['streaming'],
    serie_id: 'serie-100',
    recorrencia: {
      tipo: 'mensal',
      termina_em: '2024-12',
    },
  },
]

describe('RecurringForm + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('adiciona recorrente propagando payload normalizado e generateFuture', async () => {
    mockActions.addRecurring.mockResolvedValue(undefined)
    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pre', period, items: [] },
    })

    expect(mockActions.isSaving).toHaveBeenCalledWith('recurrents')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('recurrents')

    await findButton(wrapper, 'Nova recorrencia').trigger('click')
    const descriptionInput = wrapper.get('input[required][type="text"]')
    const valueInput = wrapper.get('input[type="number"]')
    const dateInput = wrapper.get('input[type="date"]')
    const categoryInput = wrapper.get('input[placeholder="Opcional"]')
    const tagsInput = wrapper.get('input[placeholder="separe por virgula"]')
    const terminaEmInput = wrapper.get(
      'input[placeholder="YYYY-MM (opcional)"]'
    )

    await descriptionInput.setValue('  Internet fibra  ')
    await valueInput.setValue('150.2')
    await dateInput.setValue('2024-01-10')
    await categoryInput.setValue('  Utilidades ')
    await tagsInput.setValue('internet, casa')
    await terminaEmInput.setValue('2024-06')
    await findCheckbox(wrapper, 'Gerar para meses futuros').setValue(true)

    await wrapper.get('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.addRecurring).toHaveBeenCalledWith(
      period,
      {
        descricao: 'Internet fibra',
        valor: 150.2,
        data: '2024-01-10',
        categoria: 'Utilidades',
        tags: ['internet', 'casa'],
        recorrencia: {
          tipo: 'mensal',
          termina_em: '2024-06',
        },
      },
      { generateFuture: true }
    )
    expect(mockActions.updateRecurring).not.toHaveBeenCalled()
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('Recorrente criado')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('edita recorrente de serie aplicando cascade quando marcado', async () => {
    mockActions.updateRecurring.mockResolvedValue(undefined)
    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pos', period, items: recurringItems },
    })

    await findButton(wrapper, 'Editar').trigger('click')

    const descriptionInput = wrapper.get('input[required][type="text"]')
    const valueInput = wrapper.get('input[type="number"]')
    const dateInput = wrapper.get('input[type="date"]')
    const categoryInput = wrapper.get('input[placeholder="Opcional"]')
    const tagsInput = wrapper.get('input[placeholder="separe por virgula"]')
    const terminaEmInput = wrapper.get(
      'input[placeholder="YYYY-MM (opcional)"]'
    )

    await descriptionInput.setValue('  Streaming familia ')
    await valueInput.setValue('-55')
    await dateInput.setValue('2024-01-12')
    await categoryInput.setValue('  Familia ')
    await tagsInput.setValue('streaming, familia')
    await terminaEmInput.setValue('2024-08')
    await findCheckbox(wrapper, 'Aplicar em toda a serie').setValue(true)

    await wrapper.get('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.updateRecurring).toHaveBeenCalledWith(
      period,
      'rec-1',
      {
        descricao: 'Streaming familia',
        valor: -55,
        data: '2024-01-12',
        categoria: 'Familia',
        tags: ['streaming', 'familia'],
        recorrencia: {
          tipo: 'mensal',
          termina_em: '2024-08',
        },
      },
      { cascade: true }
    )
    expect(mockActions.addRecurring).not.toHaveBeenCalled()
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('Recorrente atualizado')
  })

  it('remove recorrente existente e informa o usuario', async () => {
    mockActions.deleteRecurring.mockResolvedValue(undefined)
    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pre', period, items: recurringItems },
    })

    await findButton(wrapper, 'Excluir').trigger('click')
    await nextTick()

    expect(mockActions.deleteRecurring).toHaveBeenCalledWith(period, 'rec-1')
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('Recorrente removido')
  })

  it('mostra loading/erro vindos do store e bloqueia botoes', async () => {
    mockActions = createMockActions({
      savingOverrides: { recurrents: true },
      errorOverrides: { recurrents: 'falhou recorrentes' },
    })

    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pre', period, items: recurringItems },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('falhou recorrentes')
    expect(
      findButton(wrapper, 'Nova recorrencia').attributes('disabled')
    ).toBeDefined()
    expect(findButton(wrapper, 'Editar').attributes('disabled')).toBeDefined()
  })

  it('reseta formulario e toggles quando onPeriodChange dispara', async () => {
    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pre', period, items: recurringItems },
    })

    expect(mockActions.onPeriodChange).toHaveBeenCalledTimes(1)

    await findButton(wrapper, 'Nova recorrencia').trigger('click')
    await findCheckbox(wrapper, 'Gerar para meses futuros').setValue(true)
    ;(wrapper.vm as any).formError = 'erro local'
    ;(wrapper.vm as any).statusMessage = 'mensagem local'

    mockActions.triggerPeriodChange()
    await nextTick()

    expect(wrapper.find('form').exists()).toBe(false)
    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
    expect((wrapper.vm as any).generateFuture).toBe(false)
    expect((wrapper.vm as any).cascade).toBe(false)

    await findButton(wrapper, 'Editar').trigger('click')
    await findCheckbox(wrapper, 'Aplicar em toda a serie').setValue(true)
    ;(wrapper.vm as any).formError = 'segundo erro'
    ;(wrapper.vm as any).statusMessage = 'segunda mensagem'

    mockActions.triggerPeriodChange()
    await nextTick()

    expect(wrapper.find('form').exists()).toBe(false)
    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
    expect((wrapper.vm as any).cascade).toBe(false)
  })
})

function createMockActions(options?: {
  savingOverrides?: Partial<TargetState<boolean>>
  errorOverrides?: Partial<TargetState<string | null>>
}) {
  const savingState = reactive(createTargetState(false))
  const errorState = reactive(createTargetState<string | null>(null))
  Object.assign(savingState, options?.savingOverrides)
  Object.assign(errorState, options?.errorOverrides)
  const listeners = new Set<() => void>()

  return {
    addRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    deleteRecurring: vi.fn(),
    isSaving: vi.fn((target: MonthSavingTarget) =>
      computed(() => Boolean(savingState[target]))
    ),
    actionErrorFor: vi.fn((target: MonthSavingTarget) =>
      computed(() => errorState[target])
    ),
    onPeriodChange: vi.fn((callback: () => void) => {
      listeners.add(callback)
    }),
    triggerPeriodChange: () => {
      listeners.forEach((listener) => listener())
    },
  }
}

function createTargetState<T>(value: T): TargetState<T> {
  return {
    recurrents: value,
  }
}

function findButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAll('button')
    .find((node) => node.text().trim() === label)
  if (!button) {
    throw new Error(`Button "${label}" not found`)
  }
  return button
}

function findCheckbox(wrapper: ReturnType<typeof mount>, label: string) {
  const checkbox = wrapper
    .findAll('label')
    .find((node) => node.text().includes(label))
    ?.find('input[type="checkbox"]')
  if (!checkbox) {
    throw new Error(`Checkbox "${label}" not found`)
  }
  return checkbox
}
