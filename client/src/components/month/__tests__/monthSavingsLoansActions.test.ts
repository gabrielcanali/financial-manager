import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, reactive } from 'vue'
import SavingsForm from '../SavingsForm.vue'
import LoansForm from '../LoansForm.vue'
import type { LoanMovement, SavingsMovement } from '@/types/schema'

type MonthSavingTarget =
  | 'income'
  | 'calendar'
  | 'entries'
  | 'recurrents'
  | 'savings'
  | 'loans'

type TargetState<T> = Record<MonthSavingTarget, T>

type MockActions = ReturnType<typeof createMockActions>

let mockActions: MockActions = createMockActions()

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

const savingsSample: SavingsMovement[] = [
  {
    id: 'sav-1',
    descricao: 'Reserva',
    data: '2024-01-05',
    valor: 200,
    tipo: 'aporte',
  },
]

const loansSample: { feitos: LoanMovement[]; recebidos: LoanMovement[] } = {
  feitos: [
    {
      id: 'loan-1',
      descricao: 'Emprestimo amigo',
      valor: 300,
      data: '2024-01-12',
    },
  ],
  recebidos: [
    {
      id: 'loan-2',
      descricao: 'Emprestimo recebido',
      valor: 150,
      data: '2024-01-15',
    },
  ],
}

describe('SavingsForm + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('salva lista convertendo payload e exibe feedback', async () => {
    mockActions.saveSavings.mockResolvedValue(undefined)
    const wrapper = mount(SavingsForm, {
      props: { movements: savingsSample },
    })

    const descriptionInput = wrapper.get('input[required][type="text"]')
    const dateInput = wrapper.get('input[type="date"]')
    const valueInput = wrapper.get('input[type="number"]')
    const typeSelect = wrapper.get('select')
    await descriptionInput.setValue('  Reserva atualizada ')
    await dateInput.setValue('2024-02-01')
    await valueInput.setValue('350')
    await typeSelect.setValue('resgate')

    await findButton(wrapper, 'Salvar lista de poupanca').trigger('click')
    await nextTick()

    expect(mockActions.saveSavings).toHaveBeenCalledWith({
      movimentos: [
        {
          descricao: 'Reserva atualizada',
          data: '2024-02-01',
          valor: 350,
          tipo: 'resgate',
          id: 'sav-1',
        },
      ],
    })
    const feedback = wrapper.get('[data-testid="savings-feedback"]')
    expect(feedback.text()).toContain('Lista de poupanca salva')
    expect(mockActions.isSaving).toHaveBeenCalledWith('savings')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('savings')
  })

  it('mostra loading/erro e bloqueia botoes ao salvar', async () => {
    mockActions = createMockActions({
      savingOverrides: { savings: true },
      errorOverrides: { savings: 'falhou poupanca' },
    })

    const wrapper = mount(SavingsForm, {
      props: { movements: savingsSample },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    const feedback = wrapper.get('[data-testid="savings-feedback"]')
    expect(feedback.text()).toContain('falhou poupanca')
    expect(
      findButton(wrapper, 'Adicionar movimento').attributes('disabled')
    ).toBeDefined()
    expect(
      findButton(wrapper, 'Salvar lista de poupanca').attributes('disabled')
    ).toBeDefined()
  })

  it('reseta mensagens e needsSave quando periodo muda', async () => {
    const wrapper = mount(SavingsForm, {
      props: { movements: savingsSample },
    })

    await findButton(wrapper, 'Adicionar movimento').trigger('click')
    await nextTick()
    expect((wrapper.vm as any).needsSave).toBe(true)
    expect((wrapper.vm as any).statusMessage).toContain('Novo movimento')

    mockActions.triggerPeriodChange()
    await nextTick()

    expect((wrapper.vm as any).needsSave).toBe(false)
    expect((wrapper.vm as any).statusMessage).toBe('')
    expect((wrapper.vm as any).formError).toBe('')
  })
})

describe('LoansForm + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('salva emprestimos propagando payload normalizado', async () => {
    mockActions.saveLoans.mockResolvedValue(undefined)
    const wrapper = mount(LoansForm, {
      props: loansSample,
    })

    const firstLoan = wrapper.findAll('input[placeholder="Descricao"]')[0]
    const firstLoanValue = wrapper.findAll('input[placeholder="Valor"]')[0]
    const firstLoanDate = wrapper.findAll('input[placeholder="Data"]')[0]
    await firstLoan.setValue('  Emprestimo ajustado ')
    await firstLoanValue.setValue('420')
    await firstLoanDate.setValue('2024-02-10')

    const receivedLoan = wrapper.findAll('input[placeholder="Descricao"]')[1]
    await receivedLoan.setValue('  Recebido revisado ')

    await findButton(wrapper, 'Salvar emprestimos').trigger('click')
    await nextTick()

    expect(mockActions.saveLoans).toHaveBeenCalledWith({
      feitos: [
        {
          id: 'loan-1',
          descricao: 'Emprestimo ajustado',
          valor: 420,
          data: '2024-02-10',
        },
      ],
      recebidos: [
        {
          id: 'loan-2',
          descricao: 'Recebido revisado',
          valor: 150,
          data: '2024-01-15',
        },
      ],
    })
    const feedback = wrapper.get('[data-testid="loans-feedback"]')
    expect(feedback.text()).toContain('Emprestimos salvos com sucesso')
    expect(mockActions.isSaving).toHaveBeenCalledWith('loans')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('loans')
  })

  it('exibe feedback de salvamento em andamento e erros do store', async () => {
    mockActions = createMockActions({
      savingOverrides: { loans: true },
      errorOverrides: { loans: 'falhou emprestimos' },
    })

    const wrapper = mount(LoansForm, {
      props: loansSample,
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    const feedback = wrapper.get('[data-testid="loans-feedback"]')
    expect(feedback.text()).toContain('falhou emprestimos')
    expect(
      findButton(wrapper, 'Salvar emprestimos').attributes('disabled')
    ).toBeDefined()
  })

  it('limpa mensagens e erros quando onPeriodChange dispara', async () => {
    const wrapper = mount(LoansForm, {
      props: loansSample,
    })

    await findButton(wrapper, '+ Feito').trigger('click')
    ;(wrapper.vm as any).formError = 'erro loans'
    ;(wrapper.vm as any).statusMessage = 'mensagem loans'
    await nextTick()

    mockActions.triggerPeriodChange()
    await nextTick()

    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
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
    saveIncome: vi.fn(),
    saveCalendar: vi.fn(),
    saveSavings: vi.fn(),
    saveLoans: vi.fn(),
    addEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
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
      listeners.forEach((callback) => callback())
    },
  }
}

function createTargetState<T>(value: T): TargetState<T> {
  return {
    income: value,
    calendar: value,
    entries: value,
    recurrents: value,
    savings: value,
    loans: value,
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
