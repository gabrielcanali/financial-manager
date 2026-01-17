import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, type ComponentPublicInstance } from 'vue'
import MonthDataForm from '../MonthDataForm.vue'
import CalendarForm from '../CalendarForm.vue'
import EntriesTable from '../EntriesTable.vue'
import SavingsForm from '../SavingsForm.vue'
import LoansForm from '../LoansForm.vue'
import RecurringForm from '../RecurringForm.vue'
import { createMonthFormActionsMock } from './helpers/mockMonthFormActions'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

function createMockActions() {
  return createMonthFormActionsMock({ autoTriggerPeriodChange: true })
}

let mockActions: MockActions = createMockActions()

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

function mountComponent(
  component: unknown,
  props?: Record<string, unknown>
) {
  const container = document.createElement('div')
  const app = createApp(component as any, props)
  const vm = app.mount(container) as ComponentPublicInstance & {
    [key: string]: any
  }
  const state = (vm.$ as unknown as { setupState: Record<string, any> })
    .setupState
  const mountedProps = vm.$props as Record<string, any>
  return {
    vm,
    state,
    props: mountedProps,
    unmount: () => app.unmount(),
  }
}

const incomePayload = {
  adiantamento: 150,
  pagamento: 850,
  total_liquido: 1000,
}

const calendarPayload = {
  pagamentos: ['2024-01-05', '2024-01-15'],
  fechamento_fatura: '2024-01-20',
}

const entriesPayload = [
  {
    id: 'ent-1',
    descricao: 'Mercado',
    valor: -120.5,
    data: '2024-01-03',
    categoria: 'Casa',
    parcela: null,
    tags: ['mercado'],
  },
  {
    id: 'ent-2',
    descricao: 'Bonus',
    valor: 500,
    data: '2024-01-10',
    categoria: 'Renda',
    parcela: null,
    tags: [],
  },
]

const savingsPayload = [
  {
    id: 'sav-1',
    descricao: 'Reserva',
    valor: 200,
    data: '2024-01-08',
    tipo: 'aporte' as const,
  },
]

const loansPayload = {
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

const recurringItems = [
  {
    id: 'rec-1',
    descricao: 'Academia',
    valor: -99.9,
    data: '2024-01-05',
    categoria: 'Saude',
    tags: ['fitness'],
    serie_id: 'serie-1',
    recorrencia: {
      tipo: 'mensal',
      termina_em: null,
    },
  },
]

beforeEach(() => {
  mockActions = createMockActions()
})

describe('MonthDataForm period watcher', () => {
  it('resets feedback refs whenever the selected period changes', async () => {
    const { state, unmount } = mountComponent(MonthDataForm, {
      income: incomePayload,
    })
    await nextTick()

    state.statusMessage = 'alguma mensagem'
    state.validationError = 'tem erro'
    state.fieldErrors.adiantamento = 'erro no campo'

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.statusMessage).toBe('')
    expect(state.validationError).toBe('')
    expect(state.fieldErrors.adiantamento).toBeUndefined()

    state.statusMessage = 'outro estado'
    state.validationError = 'outro erro'
    state.fieldErrors.pagamento = 'outro erro campo'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.statusMessage).toBe('')
    expect(state.validationError).toBe('')
    expect(state.fieldErrors.pagamento).toBeUndefined()

    unmount()
  })
})

describe('EntriesTable period watcher', () => {
  it('clears messages, toggles and editing state without mutating entries', async () => {
    const { state, props, unmount } = mountComponent(EntriesTable, {
      entries: entriesPayload,
    })
    await nextTick()
    const expectedEntries = [...(props.entries as typeof entriesPayload)]

    state.showForm = true
    state.editingId = entriesPayload[0].id
    state.generateFuture = true
    state.cascade = true
    state.formError = 'erro entradas'
    state.statusMessage = 'mensagem entradas'

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.showForm).toBe(false)
    expect(state.editingId).toBeNull()
    expect(state.generateFuture).toBe(false)
    expect(state.cascade).toBe(false)
    expect(props.entries).toEqual(expectedEntries)

    state.showForm = true
    state.editingId = entriesPayload[1].id
    state.generateFuture = true
    state.cascade = true
    state.formError = 'segundo erro entradas'
    state.statusMessage = 'segunda mensagem entradas'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.showForm).toBe(false)
    expect(state.editingId).toBeNull()
    expect(state.generateFuture).toBe(false)
    expect(state.cascade).toBe(false)
    expect(props.entries).toEqual(expectedEntries)

    unmount()
  })
})

describe('SavingsForm period watcher', () => {
  it('resets feedback while keeping local movements intact', async () => {
    const { state, unmount } = mountComponent(SavingsForm, {
      movements: savingsPayload,
    })
    await nextTick()
    state.addBlankMovement()
    state.formError = 'erro poupanca'
    state.statusMessage = 'mensagem poupanca'
    const expectedMovements = [...state.localMovements]

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.localMovements).toEqual(expectedMovements)

    state.formError = 'novo erro poupanca'
    state.statusMessage = 'nova mensagem poupanca'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.localMovements).toEqual(expectedMovements)

    unmount()
  })
})

describe('LoansForm period watcher', () => {
  it('clears feedback without dropping local loan edits', async () => {
    const { state, unmount } = mountComponent(LoansForm, loansPayload)
    await nextTick()
    state.addLoan('feitos')
    state.addLoan('recebidos')
    state.formError = 'erro emprestimos'
    state.statusMessage = 'mensagem emprestimos'
    const expectedLoans = {
      feitos: [...state.localLoans.feitos],
      recebidos: [...state.localLoans.recebidos],
    }

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.localLoans.feitos).toEqual(expectedLoans.feitos)
    expect(state.localLoans.recebidos).toEqual(expectedLoans.recebidos)

    state.formError = 'segundo erro emprestimos'
    state.statusMessage = 'segunda mensagem emprestimos'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.localLoans.feitos).toEqual(expectedLoans.feitos)
    expect(state.localLoans.recebidos).toEqual(expectedLoans.recebidos)

    unmount()
  })
})

describe('RecurringForm period watcher', () => {
  it('closes form and resets toggles without mutating loaded recurrents', async () => {
    const { state, props, unmount } = mountComponent(RecurringForm, {
      title: 'Recorrentes pre',
      period: 'pre',
      items: recurringItems,
    })
    await nextTick()
    const expectedItems = [...(props.items as typeof recurringItems)]

    state.openEdit((props.items as typeof recurringItems)[0])
    await nextTick()
    state.generateFuture = true
    state.cascade = true
    state.formError = 'erro recorrente'
    state.statusMessage = 'mensagem recorrente'

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.showForm).toBe(false)
    expect(state.editingId).toBeNull()
    expect(state.generateFuture).toBe(false)
    expect(state.cascade).toBe(false)
    expect(props.items).toEqual(expectedItems)

    state.openCreate()
    await nextTick()
    state.generateFuture = true
    state.cascade = true
    state.formError = 'segundo erro recorrente'
    state.statusMessage = 'segunda mensagem recorrente'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.formError).toBe('')
    expect(state.statusMessage).toBe('')
    expect(state.showForm).toBe(false)
    expect(state.editingId).toBeNull()
    expect(state.generateFuture).toBe(false)
    expect(state.cascade).toBe(false)
    expect(props.items).toEqual(expectedItems)

    unmount()
  })
})
describe('CalendarForm period watcher', () => {
  it('clears feedback refs and newPayment without mutating loaded payments', async () => {
    const { state, unmount } = mountComponent(CalendarForm, {
      calendar: calendarPayload,
    })
    await nextTick()
    state.form.pagamentos.push('2024-02-10')
    const expectedPayments = [...state.form.pagamentos]

    state.statusMessage = 'salvou calendario'
    state.validationError = 'erro calendario'
    state.newPayment = '2024-03-01'
    state.fieldErrors.newPayment = 'erro novo pagamento'
    state.paymentErrors['custom'] = 'erro pagamento'

    mockActions.year.value = '2025'
    await nextTick()

    expect(state.statusMessage).toBe('')
    expect(state.validationError).toBe('')
    expect(state.newPayment).toBe('')
    expect(state.fieldErrors.newPayment).toBeUndefined()
    expect(state.paymentErrors.custom).toBeUndefined()
    expect(state.form.pagamentos).toEqual(expectedPayments)

    state.statusMessage = 'segundo estado'
    state.validationError = 'segundo erro'

    state.newPayment = '2024-04-01'
    state.fieldErrors.pagamentos = 'erro lista'

    mockActions.month.value = '02'
    await nextTick()

    expect(state.statusMessage).toBe('')
    expect(state.validationError).toBe('')
    expect(state.newPayment).toBe('')
    expect(state.fieldErrors.pagamentos).toBeUndefined()
    expect(state.form.pagamentos).toEqual(expectedPayments)

    unmount()
  })
})
