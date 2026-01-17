import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SavingsForm from '../SavingsForm.vue'
import LoansForm from '../LoansForm.vue'
import type { LoanMovement, SavingsMovement } from '@/types/schema'
import {
  createMonthFormActionsMock,
  type MonthFormActionsMockOptions,
} from './helpers/mockMonthFormActions'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

let mockActions: MockActions

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

beforeEach(() => {
  mockActions = createMockActions()
})

describe('SavingsForm validation flows', () => {
  it('bloqueia salvamento com movimento invalido ate corrigir e normaliza payload', async () => {
    mockActions.saveSavings.mockResolvedValue(undefined)
    const wrapper = mount(SavingsForm, {
      props: { movements: [] },
    })

    await findButton(wrapper, 'Adicionar movimento').trigger('click')
    await nextTick()

    expect((wrapper.vm as any).needsSave).toBe(true)

    await findButton(wrapper, 'Salvar lista de poupanca').trigger('click')
    await nextTick()

    expect(mockActions.saveSavings).not.toHaveBeenCalled()
    const feedback = wrapper.get('[data-testid="savings-feedback"]')
    expect(feedback.text()).toContain(
      'Corrija os movimentos destacados antes de salvar'
    )
    expect(wrapper.text()).toContain('Descricao obrigatoria')
    expect(wrapper.text()).toContain('Data deve seguir YYYY-MM-DD')
    expect(wrapper.text()).toContain('Valor deve ser maior que zero')

    await wrapper.get('input[required][type="text"]').setValue('  Reserva mensal ')
    await wrapper.get('input[type="date"]').setValue('2024-03-05')
    await wrapper.get('input[type="number"]').setValue('250.75')
    await wrapper.get('select').setValue('resgate')
    await nextTick()

    expect(wrapper.text()).not.toContain('Descricao obrigatoria')
    expect(wrapper.text()).not.toContain('Data deve seguir YYYY-MM-DD')
    expect(wrapper.text()).not.toContain('Valor deve ser maior que zero')

    await findButton(wrapper, 'Salvar lista de poupanca').trigger('click')
    await nextTick()

    expect(mockActions.saveSavings).toHaveBeenCalledWith({
      movimentos: [
        {
          descricao: 'Reserva mensal',
          data: '2024-03-05',
          valor: 250.75,
          tipo: 'resgate',
        },
      ],
    })
    expect(
      wrapper.get('[data-testid="savings-feedback"]').text()
    ).toContain('Lista de poupanca salva')
    expect((wrapper.vm as any).needsSave).toBe(false)
  })

  it('mantem needsSave enquanto ha edicoes locais e limpa erros ao remover movimento', async () => {
    const wrapper = mount(SavingsForm, {
      props: { movements: savingsSample },
    })
    await nextTick()

    const descriptionInput = wrapper.get('input[required][type="text"]')
    await descriptionInput.setValue('Reserva ajustada')
    await nextTick()
    expect((wrapper.vm as any).needsSave).toBe(true)

    await findButton(wrapper, 'Adicionar movimento').trigger('click')
    await nextTick()

    await findButton(wrapper, 'Salvar lista de poupanca').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Descricao obrigatoria')

    const removeButtons = findAllButtons(wrapper, 'Remover')
    await removeButtons[removeButtons.length - 1].trigger('click')
    await nextTick()

    expect(wrapper.text()).not.toContain('Descricao obrigatoria')
    const vm = wrapper.vm as any
    expect(vm.statusMessage).toBe(
      'Movimento removido. Clique em salvar para confirmar.'
    )
    expect(vm.needsSave).toBe(true)

    await wrapper.setProps({
      movements: [
        {
          ...savingsSample[0],
          descricao: 'Servidor sincronizado',
        },
      ],
    })
    await nextTick()

    expect(vm.needsSave).toBe(false)
    expect(vm.statusMessage).toBe('')
    expect(vm.formError).toBe('')
  })

  it('reseta mensagens, needsSave e erros quando o periodo muda', async () => {
    const wrapper = mount(SavingsForm, {
      props: { movements: savingsSample },
    })

    await findButton(wrapper, 'Adicionar movimento').trigger('click')
    await nextTick()

    ;(wrapper.vm as any).formError = 'erro local'
    ;(wrapper.vm as any).statusMessage = 'mensagem local'
    ;(wrapper.vm as any).needsSave = true

    mockActions.triggerPeriodChange()
    await nextTick()

    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
    expect((wrapper.vm as any).needsSave).toBe(false)
  })
})

describe('LoansForm validation flows', () => {
  it('impede salvar emprestimos invalidos ate correcao e envia payload sanitizado', async () => {
    mockActions.saveLoans.mockResolvedValue(undefined)
    const wrapper = mount(LoansForm, {
      props: createLoansProps(),
    })

    const descriptionInput = wrapper.findAll('input[placeholder="Descricao"]')[0]
    const valueInput = wrapper.findAll('input[placeholder="Valor"]')[0]
    const dateInput = wrapper.findAll('input[placeholder="Data"]')[0]
    await descriptionInput.setValue('   ')
    await valueInput.setValue('-50')
    await dateInput.setValue('')

    await findButton(wrapper, 'Salvar emprestimos').trigger('click')
    await nextTick()

    expect(mockActions.saveLoans).not.toHaveBeenCalled()
    const feedback = wrapper.get('[data-testid="loans-feedback"]')
    expect(feedback.text()).toContain(
      'Revise os emprestimos destacados antes de salvar'
    )
    expect(wrapper.text()).toContain('Descricao obrigatoria')
    expect(wrapper.text()).toContain('Valor deve ser maior que zero')
    expect(wrapper.text()).toContain('Data deve seguir YYYY-MM-DD')

    await descriptionInput.setValue('  Emprestimo corrigido ')
    await valueInput.setValue('530.55')
    await dateInput.setValue('2024-04-01')
    const receivedDescription =
      wrapper.findAll('input[placeholder="Descricao"]')[1]
    await receivedDescription.setValue(' Recebido ajustado ')
    await nextTick()

    await findButton(wrapper, 'Salvar emprestimos').trigger('click')
    await nextTick()

    expect(mockActions.saveLoans).toHaveBeenCalledWith({
      feitos: [
        {
          id: 'loan-1',
          descricao: 'Emprestimo corrigido',
          valor: 530.55,
          data: '2024-04-01',
        },
      ],
      recebidos: [
        {
          id: 'loan-2',
          descricao: 'Recebido ajustado',
          valor: 150,
          data: '2024-01-15',
        },
      ],
    })
    expect(
      wrapper.get('[data-testid="loans-feedback"]').text()
    ).toContain('Emprestimos salvos com sucesso')
  })

  it('exibe mensagens de adicao/remocao e limpa erros ao descartar itens criados', async () => {
    const wrapper = mount(LoansForm, {
      props: createLoansProps(),
    })

    await findButton(wrapper, '+ Feito').trigger('click')
    await nextTick()
    expect(
      wrapper.get('[data-testid="loans-feedback"]').text()
    ).toContain('Novo emprestimo adicionado. Salve para registrar')

    await findButton(wrapper, 'Salvar emprestimos').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Descricao obrigatoria')

    const vm = wrapper.vm as any
    vm.removeLoan('feitos', vm.localLoans.feitos.length - 1)
    await nextTick()

    expect(
      wrapper.get('[data-testid="loans-feedback"]').text()
    ).not.toContain('Novo emprestimo')
    expect(Object.keys(vm.loanErrors)).toHaveLength(0)
    expect(vm.statusMessage).toBe('Item removido. Salve para confirmar')
  })

  it('limpa mensagens e erros quando onPeriodChange dispara', async () => {
    const wrapper = mount(LoansForm, {
      props: createLoansProps(),
    })

    const firstDescription = wrapper.findAll('input[placeholder="Descricao"]')[0]
    await firstDescription.setValue('')
    await findButton(wrapper, 'Salvar emprestimos').trigger('click')
    await nextTick()
    expect(
      wrapper.get('[data-testid="loans-feedback"]').text()
    ).toContain('Revise os emprestimos destacados antes de salvar')

    mockActions.triggerPeriodChange()
    await nextTick()

    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
  })
})

function createMockActions(options?: MonthFormActionsMockOptions) {
  return createMonthFormActionsMock(options)
}

function createLoansProps() {
  return {
    feitos: loansSample.feitos.map((loan) => ({ ...loan })),
    recebidos: loansSample.recebidos.map((loan) => ({ ...loan })),
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

function findAllButtons(wrapper: ReturnType<typeof mount>, label: string) {
  const buttons = wrapper
    .findAll('button')
    .filter((node) => node.text().trim() === label)
  if (!buttons.length) {
    throw new Error(`Buttons "${label}" not found`)
  }
  return buttons
}
