import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import MonthDataForm from '../MonthDataForm.vue'
import CalendarForm from '../CalendarForm.vue'
import {
  createMonthFormActionsMock,
  type MonthFormActionsMockOptions,
} from './helpers/mockMonthFormActions'
import type { MonthCalendar, MonthIncomeData } from '@/types/schema'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

const incomeSample: MonthIncomeData = {
  adiantamento: 100,
  pagamento: 900,
  total_liquido: 1000,
}

const calendarSample: MonthCalendar = {
  pagamentos: ['2024-01-05'],
  fechamento_fatura: '2024-01-15',
}

const emptyCalendar: MonthCalendar = {
  pagamentos: [],
  fechamento_fatura: null,
}

let mockActions: MockActions = createMockActions()

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

beforeEach(() => {
  mockActions = createMockActions()
})

describe('MonthDataForm validation', () => {
  it('valida campos obrigatorios e impede submissao quando vazios ou invalidos', async () => {
    const wrapper = mount(MonthDataForm, {
      props: { income: incomeSample },
    })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('')
    await inputs[1].setValue('-10')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.saveIncome).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Informe um valor numerico')
    expect(wrapper.text()).toContain('Valor precisa ser maior ou igual a zero')
    const feedback = wrapper.get('[data-testid="month-data-feedback"]')
    expect(feedback.text()).toContain(
      'Revise os campos destacados antes de salvar'
    )
    expect(feedback.text()).not.toContain('Salarios atualizados com sucesso')
  })

  it('normaliza payload ao salvar e exibe mensagem de sucesso', async () => {
    mockActions.saveIncome.mockResolvedValue(undefined)
    const wrapper = mount(MonthDataForm, {
      props: { income: incomeSample },
    })
    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('850.55')
    await inputs[1].setValue('950.2')
    await inputs[2].setValue('2000')

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.saveIncome).toHaveBeenCalledWith({
      adiantamento: 850.55,
      pagamento: 950.2,
      total_liquido: 2000,
    })
    const feedback = wrapper.get('[data-testid="month-data-feedback"]')
    expect(feedback.text()).toContain('Salarios atualizados com sucesso')
  })

  it('honra estados de saving/actionError e atualiza valores ao sincronizar props', async () => {
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
    const submitButton = wrapper.get('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()

    await wrapper.setProps({
      income: { ...incomeSample, adiantamento: 200 },
    })
    await nextTick()

    expect(
      (wrapper.find('input[type="number"]').element as HTMLInputElement).value
    ).toBe('200')
  })

  it('clears validation feedback when the selected period changes', async () => {
    const wrapper = mount(MonthDataForm, {
      props: { income: incomeSample },
    })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    expect(wrapper.text()).toContain('Informe um valor numerico')

    mockActions.triggerPeriodChange()
    await nextTick()

    expect(wrapper.text()).not.toContain('Informe um valor numerico')
    expect(wrapper.find('[data-testid="month-data-feedback"]').exists()).toBe(
      false
    )
  })
})

describe('CalendarForm validation', () => {
  it('validates closing date format and blocks invalid submissions', async () => {
    const wrapper = mount(CalendarForm, {
      props: { calendar: calendarSample },
    })

    ;(wrapper.vm as any).form.fechamento_fatura = '2024/01/15'
    await nextTick()
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(mockActions.saveCalendar).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Use data no formato YYYY-MM-DD')
  })

  it('requires at least one payment and enforces ISO format when adding new dates', async () => {
    const wrapper = mount(CalendarForm, {
      props: { calendar: emptyCalendar },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    expect(wrapper.text()).toContain('Adicione ao menos uma data de pagamento')

    ;(wrapper.vm as any).newPayment = '20240105'
    ;(wrapper.vm as any).addPayment()
    await nextTick()
    expect(wrapper.text()).toContain('Use datas ISO (YYYY-MM-DD)')

    ;(wrapper.vm as any).newPayment = '2024-01-05'
    ;(wrapper.vm as any).addPayment()
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toContain(
      'Data adicionada. Clique em salvar para persistir.'
    )
  })

  it('detects duplicate payment dates during validation', async () => {
    const wrapper = mount(CalendarForm, {
      props: {
        calendar: {
          pagamentos: ['2024-01-05', '2024-01-05'],
          fechamento_fatura: null,
        },
      },
    })

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(wrapper.text()).toContain(
      'Existem datas de pagamento duplicadas'
    )
    expect(wrapper.text()).toContain('Data duplicada na lista')
    expect(mockActions.saveCalendar).not.toHaveBeenCalled()
  })

  it('salva payload ordenado, exibe sucesso e usa flags saving/actionError', async () => {
    mockActions.saveCalendar.mockResolvedValue(undefined)
    const wrapper = mount(CalendarForm, {
      props: { calendar: calendarSample },
    })
    const newPaymentInput = wrapper.findAll('input[type="date"]')[1]
    const addButton = findButton(wrapper, 'Adicionar')

    await newPaymentInput.setValue('2024-01-02')
    await addButton.trigger('click')
    await nextTick()

    ;(wrapper.vm as any).form.fechamento_fatura = null
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockActions.saveCalendar).toHaveBeenCalledWith({
      pagamentos: ['2024-01-05', '2024-01-02'],
      fechamento_fatura: null,
    })
    const feedback = wrapper.get('[data-testid="calendar-feedback"]')
    expect(feedback.text()).toContain('Calendario salvo com sucesso')
    expect(mockActions.isSaving).toHaveBeenCalledWith('calendar')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('calendar')
  })

  it('exibe erros do store e reseta feedback ao trocar periodo', async () => {
    mockActions = createMockActions({
      savingOverrides: { calendar: true },
      errorOverrides: { calendar: 'falhou calendario' },
    })
    const wrapper = mount(CalendarForm, {
      props: { calendar: calendarSample },
    })
    await nextTick()

    const feedback = wrapper.get('[data-testid="calendar-feedback"]')
    expect(feedback.text()).toContain('falhou calendario')
    expect(wrapper.text()).toContain('Salvando...')

    mockActions.triggerPeriodChange()
    await nextTick()

    expect((wrapper.vm as any).newPayment).toBe('')
  })
})

function createMockActions(options?: MonthFormActionsMockOptions) {
  return createMonthFormActionsMock(options)
}

function findButton(wrapper: ReturnType<typeof mount>, label: string) {
  const button = wrapper
    .findAll('button')
    .find((node) => node.text().includes(label))
  if (!button) {
    throw new Error(`Button "${label}" not found`)
  }
  return button
}
