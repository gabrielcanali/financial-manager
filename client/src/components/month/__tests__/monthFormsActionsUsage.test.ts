import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import MonthDataForm from '../MonthDataForm.vue'
import CalendarForm from '../CalendarForm.vue'
import EntriesTable from '../EntriesTable.vue'
import type {
  MonthCalendar,
  MonthIncomeData,
  Movement,
} from '@/types/schema'
import {
  createMonthFormActionsMock,
  type MonthFormActionsMockOptions,
} from './helpers/mockMonthFormActions'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

let mockActions: MockActions = createMockActions()

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

const incomeSample: MonthIncomeData = {
  adiantamento: 100,
  pagamento: 900,
  total_liquido: 1000,
}

const calendarSample: MonthCalendar = {
  pagamentos: ['2024-01-05'],
  fechamento_fatura: '2024-01-15',
}

const entriesSample: Movement[] = [
  {
    id: 'entry-01',
    descricao: 'Mercado',
    valor: -120.5,
    data: '2024-01-03',
    categoria: 'Casa',
    parcela: null,
    tags: ['mercado'],
  },
  {
    id: 'entry-02',
    descricao: 'Bonus',
    valor: 500,
    data: '2024-01-10',
    categoria: 'Renda',
    parcela: null,
    tags: [],
  },
]

const entryWithSerie: Movement = {
  id: 'entry-serie',
  descricao: 'Academia',
  valor: -80,
  data: '2024-01-04',
  categoria: 'Saude',
  parcela: '1/6',
  tags: ['fitness'],
  serie_id: 'serie-10',
}

describe('MonthDataForm + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('envia payload atualizado e mostra feedback de sucesso', async () => {
    const wrapper = mount(MonthDataForm, {
      props: { income: incomeSample },
    })
    mockActions.saveIncome.mockResolvedValue(undefined)

    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('250')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.saveIncome).toHaveBeenCalledWith({
      adiantamento: 250,
      pagamento: 900,
      total_liquido: 1000,
    })
    const feedback = wrapper.get('[data-testid="month-data-feedback"]')
    expect(feedback.text()).toContain('Salarios atualizados com sucesso')
    expect(mockActions.isSaving).toHaveBeenCalledWith('income')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('income')
  })

  it('exibe spinner e erro vindo do store', async () => {
    mockActions = createMockActions({
      savingOverrides: { income: true },
      errorOverrides: { income: 'falhou salarios' },
    })
    const wrapper = mount(MonthDataForm, {
      props: { income: incomeSample },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    const feedback = wrapper.get('[data-testid="month-data-feedback"]')
    expect(feedback.text()).toContain('falhou salarios')
    expect(
      wrapper.get('button[type="submit"]').attributes('disabled')
    ).toBeDefined()
  })
})

describe('CalendarForm + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('salva calendario com payload normalizado e exibe sucesso', async () => {
    mockActions.saveCalendar.mockResolvedValue(undefined)
    const wrapper = mount(CalendarForm, {
      props: { calendar: calendarSample },
    })
    const closingInput = wrapper.get('input[type="date"]')
    await closingInput.setValue('2024-01-20')

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.saveCalendar).toHaveBeenCalledWith({
      pagamentos: ['2024-01-05'],
      fechamento_fatura: '2024-01-20',
    })
    const feedback = wrapper.get('[data-testid="calendar-feedback"]')
    expect(feedback.text()).toContain('Calendario salvo com sucesso')
    expect(mockActions.isSaving).toHaveBeenCalledWith('calendar')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('calendar')
  })

  it('mostra indicador de salvamento e erro do store', async () => {
    mockActions = createMockActions({
      savingOverrides: { calendar: true },
      errorOverrides: { calendar: 'falhou calendario' },
    })
    const wrapper = mount(CalendarForm, {
      props: { calendar: calendarSample },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    const feedback = wrapper.get('[data-testid="calendar-feedback"]')
    expect(feedback.text()).toContain('falhou calendario')
    expect(
      wrapper.get('button[type="submit"]').attributes('disabled')
    ).toBeDefined()
  })
})

describe('EntriesTable + useMonthFormActions', () => {
  beforeEach(() => {
    mockActions = createMockActions()
  })

  it('adiciona lancamento propagando generateFuture quando marcado', async () => {
    mockActions.addEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: [] },
    })

    await findButton(wrapper, 'Novo lancamento').trigger('click')
    const descriptionInput = wrapper.get('input[required][type="text"]')
    const valueInput = wrapper.get('.mt-4 form input[type="number"]')
    const dateInput = wrapper.get('.mt-4 form input[type="date"]')
    const categoryInput = wrapper.get('input[placeholder="Opcional"]')
    const parcelaInput = wrapper.get('input[placeholder="Ex: 1/10"]')
    const tagsInput = wrapper.get('input[placeholder="ex: fixo, cartao"]')
    await descriptionInput.setValue(' Compra mercado ')
    await valueInput.setValue('150')
    await dateInput.setValue('2024-01-12')
    await categoryInput.setValue(' Casa ')
    await parcelaInput.setValue('1/4')
    await tagsInput.setValue('mercado, casa')

    await findCheckbox(wrapper, 'Gerar meses futuros').setValue(true)
    await wrapper.get('.mt-4 form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.addEntry).toHaveBeenCalledWith(
      {
        descricao: 'Compra mercado',
        valor: 150,
        data: '2024-01-12',
        categoria: 'Casa',
        parcela: '1/4',
        tags: ['mercado', 'casa'],
      },
      { generateFuture: true }
    )
    expect(mockActions.isSaving).toHaveBeenCalledWith('entries')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('entries')
  })

  it('atualiza lancamento de serie respeitando toggle cascade', async () => {
    mockActions.updateEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: [entryWithSerie] },
    })

    await findButton(wrapper, 'Editar').trigger('click')
    const valueInput = wrapper.get('.mt-4 form input[type="number"]')
    await valueInput.setValue('-75')
    await findCheckbox(wrapper, 'Aplicar em cascata').setValue(true)
    await wrapper.get('.mt-4 form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.updateEntry).toHaveBeenCalledWith(
      'entry-serie',
      {
        descricao: 'Academia',
        valor: -75,
        data: '2024-01-04',
        categoria: 'Saude',
        parcela: '1/6',
        tags: ['fitness'],
      },
      { cascade: true }
    )
    expect(mockActions.addEntry).not.toHaveBeenCalled()
  })

  it('remove lancamento e mostra mensagem padrao', async () => {
    mockActions.deleteEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: entriesSample },
    })

    await findButton(wrapper, 'Excluir').trigger('click')
    await nextTick()

    expect(mockActions.deleteEntry).toHaveBeenCalledWith('entry-01')
    const feedback = wrapper.get('[data-testid="entries-feedback"]')
    expect(feedback.text()).toContain('Lancamento removido')
  })

  it('usa actionError/isSaving e reseta formulario via onPeriodChange', async () => {
    mockActions = createMockActions({
      savingOverrides: { entries: true },
      errorOverrides: { entries: 'falhou entradas' },
    })
    const wrapper = mount(EntriesTable, {
      props: { entries: entriesSample },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    const feedback = wrapper.get('[data-testid="entries-feedback"]')
    expect(feedback.text()).toContain('falhou entradas')
    expect(mockActions.onPeriodChange).toHaveBeenCalledTimes(1)

    await findButton(wrapper, 'Novo lancamento').trigger('click')
    ;(wrapper.vm as any).formError = 'erro local'
    ;(wrapper.vm as any).statusMessage = 'msg local'
    await nextTick()

    mockActions.triggerPeriodChange()
    await nextTick()

    expect(wrapper.find('.mt-4 form').exists()).toBe(false)
    expect((wrapper.vm as any).formError).toBe('')
    expect((wrapper.vm as any).statusMessage).toBe('')
    expect((wrapper.vm as any).generateFuture).toBe(false)
    expect((wrapper.vm as any).cascade).toBe(false)
  })
})

function createMockActions(options?: MonthFormActionsMockOptions) {
  return createMonthFormActionsMock(options)
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
