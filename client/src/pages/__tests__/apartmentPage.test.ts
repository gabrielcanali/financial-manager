import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import ApartmentPage from '../ApartmentPage.vue'
import { formatCurrency } from '@/utils/formatters'
import type {
  ApartmentEvolution,
  ApartmentMonthSnapshot,
} from '@/types/schema'
import {
  createApartmentEvolution,
  createApartmentInstallment,
  createApartmentSnapshot,
} from '@/tests/apartmentFixtures'

const defaultYear = '2024'
const defaultMonth = '05'

const periodState = {
  year: ref(defaultYear),
  month: ref(defaultMonth),
  get reference() {
    return `${this.year.value}-${this.month.value}`
  },
}

const apartmentState = {
  month: ref<ApartmentMonthSnapshot | null>(null),
  evolution: ref<ApartmentEvolution | null>(null),
  loadingMonth: ref(false),
  loadingEvolution: ref(false),
  error: ref<string | null>(null),
  isSnapshotCurrent: ref(true),
}

const loadMonth = vi.fn(() => Promise.resolve(undefined))
const loadEvolution = vi.fn(() => Promise.resolve(undefined))

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => periodState,
}))

vi.mock('@/stores/apartmentStore', () => ({
  useApartmentStore: () => ({
    ...apartmentState,
    loadMonth,
    loadEvolution,
  }),
}))

vi.mock('@/components/PeriodSelector.vue', () => ({
  default: defineComponent({
    name: 'PeriodSelectorStub',
    setup() {
      return () =>
        h(
          'div',
          { 'data-testid': 'period-selector-stub' },
          'Period selector'
        )
    },
  }),
}))

vi.mock('@/components/apartment/ApartmentSnapshotForm.vue', () => ({
  default: defineComponent({
    name: 'ApartmentSnapshotFormStub',
    props: {
      snapshot: {
        type: Object,
        default: null,
      },
      staleSnapshot: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      return () =>
        h(
          'div',
          {
            'data-testid': 'apartment-snapshot-form-stub',
            'data-stale': String(props.staleSnapshot),
          },
          props.snapshot ? 'Snapshot form' : 'Snapshot form vazio'
        )
    },
  }),
}))

vi.mock('@/components/apartment/ApartmentSeriesManager.vue', () => ({
  default: defineComponent({
    name: 'ApartmentSeriesManagerStub',
    props: {
      title: {
        type: String,
        required: true,
      },
      staleSnapshot: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['updated'],
    setup(props, { emit }) {
      return () =>
        h(
          'div',
          {
            'data-testid': `series-${props.title}`,
            'data-stale': String(props.staleSnapshot),
            onClick: () =>
              emit('updated', {
                reference: '2024-05',
                syncedWithCurrentPeriod: true,
              }),
          },
          `Series ${props.title}`
        )
    },
  }),
}))

function resetStores() {
  periodState.year.value = defaultYear
  periodState.month.value = defaultMonth
  apartmentState.month.value = null
  apartmentState.evolution.value = null
  apartmentState.loadingMonth.value = false
  apartmentState.loadingEvolution.value = false
  apartmentState.error.value = null
  apartmentState.isSnapshotCurrent.value = true
  loadMonth.mockReset()
  loadEvolution.mockReset()
  loadMonth.mockResolvedValue(undefined)
  loadEvolution.mockResolvedValue(undefined)
}

function mountApartmentPage() {
  return mount(ApartmentPage)
}

describe('ApartmentPage', () => {
  beforeEach(() => {
    resetStores()
  })

  it('loads snapshot and evolution on mount and reacts to period updates', async () => {
    mountApartmentPage()
    await flushPromises()

    expect(loadMonth).toHaveBeenCalledTimes(1)
    expect(loadMonth).toHaveBeenCalledWith(defaultYear, defaultMonth)
    expect(loadEvolution).toHaveBeenCalledTimes(1)
    expect(loadEvolution).toHaveBeenCalledWith({ year: defaultYear })

    loadMonth.mockClear()
    loadEvolution.mockClear()
    periodState.month.value = '06'
    await flushPromises()

    expect(loadMonth).toHaveBeenCalledTimes(1)
    expect(loadMonth).toHaveBeenCalledWith(defaultYear, '06')
    expect(loadEvolution).not.toHaveBeenCalled()

    loadMonth.mockClear()
    loadEvolution.mockClear()
    periodState.year.value = '2025'
    await flushPromises()

    expect(loadMonth).toHaveBeenCalledTimes(1)
    expect(loadMonth).toHaveBeenCalledWith('2025', '06')
    expect(loadEvolution).toHaveBeenCalledTimes(1)
    expect(loadEvolution).toHaveBeenCalledWith({ year: '2025' })
  })

  it('exibe um aviso claro quando o snapshot nao corresponde ao periodo atual', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    apartmentState.month.value = createApartmentSnapshot({
      referencia: '2024-03',
    })
    apartmentState.isSnapshotCurrent.value = false
    await nextTick()

    const warning = wrapper.find('[data-testid="apartment-snapshot-warning"]')
    expect(warning.exists()).toBe(true)
    expect(warning.text()).toContain('2024-03')
    expect(warning.text()).toContain(`${defaultYear}-${defaultMonth}`)

    apartmentState.isSnapshotCurrent.value = true
    await nextTick()
    expect(wrapper.find('[data-testid="apartment-snapshot-warning"]').exists()).toBe(false)
  })

  it('allows manual refresh and disables the button while loading either request', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    loadMonth.mockClear()
    loadEvolution.mockClear()
    const reloadButton = wrapper.get('[data-testid="reload-apartment-button"]')

    await reloadButton.trigger('click')
    await flushPromises()

    expect(loadMonth).toHaveBeenCalledTimes(1)
    expect(loadMonth).toHaveBeenCalledWith(defaultYear, defaultMonth)
    expect(loadEvolution).toHaveBeenCalledTimes(1)
    expect(loadEvolution).toHaveBeenCalledWith({ year: defaultYear })

    apartmentState.loadingMonth.value = true
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    apartmentState.loadingMonth.value = false
    apartmentState.loadingEvolution.value = true
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    apartmentState.loadingEvolution.value = false
    await nextTick()
    expect(
      (reloadButton.element as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('renders error, loading and empty states', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    apartmentState.error.value = 'Erro ao carregar apartamento'
    await nextTick()
    expect(wrapper.text()).toContain('Erro ao carregar apartamento')

    apartmentState.error.value = null
    apartmentState.loadingMonth.value = true
    await nextTick()
    expect(wrapper.text()).toContain(
      'Consultando o snapshot do mes selecionado...'
    )

    apartmentState.loadingMonth.value = false
    apartmentState.loadingEvolution.value = true
    await nextTick()
    expect(wrapper.text()).toContain(
      `Buscando evolucao acumulada de ${defaultYear}...`
    )

    apartmentState.loadingEvolution.value = false
    await nextTick()
    expect(wrapper.text()).toContain(
      'Nenhum snapshot foi retornado para o periodo informado.'
    )
    expect(wrapper.text()).toContain(
      'Nenhuma evolucao encontrada para o ano selecionado.'
    )
  })

  it('renders the monthly snapshot cards with data from the store', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    const snapshot = createApartmentSnapshot({
      referencia: '2024-08',
      financiamento_caixa: createApartmentInstallment({
        referencia: '2024-08',
        valor_parcela: 2100,
        saldo_devedor: 188000,
      }),
      entrada_construtora: createApartmentInstallment({
        referencia: '2024-08',
        valor_parcela: 950,
        saldo_devedor: 42000,
      }),
      totais: {
        parcelas: 3050,
        saldo_devedor: 230000,
      },
    })

    apartmentState.month.value = snapshot
    await nextTick()

    expect(wrapper.text()).toContain('Referencia: 2024-08')
    expect(wrapper.text()).toContain(
      formatCurrency(snapshot.financiamento_caixa!.valor_parcela)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(snapshot.financiamento_caixa!.saldo_devedor)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(snapshot.entrada_construtora!.valor_parcela)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(snapshot.totais!.parcelas)
    )
    expect(
      wrapper
        .text()
        .includes('Nenhum snapshot foi retornado para o periodo informado.')
    ).toBe(false)
  })

  it('shows evolution table, combined data and histories when evolution is available', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    const evolution = createApartmentEvolution({
      combinada: [
        {
          referencia: '2024-01',
          parcelas: 2500,
          saldo_devedor: 240000,
          diferenca_vs_mes_anterior: -400,
          saldo_devedor_variacao: -1500,
        },
        {
          referencia: '2024-02',
          parcelas: 2450,
          saldo_devedor: 238000,
          diferenca_vs_mes_anterior: -50,
          saldo_devedor_variacao: -2000,
        },
      ],
    })

    apartmentState.evolution.value = evolution
    await nextTick()

    expect(wrapper.text()).toContain('Ano selecionado: 2024')
    expect(wrapper.text()).toContain(
      formatCurrency(evolution.combinada[0].parcelas)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(evolution.combinada[1].saldo_devedor)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(evolution.financiamento_caixa[0].valor_parcela)
    )
    expect(wrapper.text()).toContain(
      formatCurrency(evolution.entrada_construtora[0].saldo_devedor)
    )
    expect(wrapper.text()).not.toContain(
      'Nenhuma evolucao encontrada para o ano selecionado.'
    )
    expect(wrapper.text()).not.toContain('Sem registros neste ano.')
  })

  it('shows fallback evolution messages when payload arrays are empty', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    apartmentState.evolution.value = {
      financiamento_caixa: [],
      entrada_construtora: [],
      combinada: [],
    }
    await nextTick()

    expect(wrapper.text()).toContain('Nenhum dado acumulado para este ano.')
    const historyMessages = wrapper
      .text()
      .match(/Sem registros neste ano\./g)
    expect(historyMessages?.length).toBe(2)
  })

  it('recarrega dados quando os gerenciadores da evolucao emitem atualizacoes', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()
    loadMonth.mockClear()
    loadEvolution.mockClear()

    await wrapper
      .get('[data-testid="series-Financiamento Caixa"]')
      .trigger('click')
    await flushPromises()

    expect(loadMonth).toHaveBeenCalledTimes(1)
    expect(loadEvolution).toHaveBeenCalledTimes(1)
  })

  it('destaca botao de recarga e informa os filhos sobre snapshot desatualizado', async () => {
    const wrapper = mountApartmentPage()
    await flushPromises()

    apartmentState.month.value = createApartmentSnapshot({
      referencia: '2024-03',
    })
    apartmentState.isSnapshotCurrent.value = false
    await nextTick()

    const reloadButton = wrapper.get('[data-testid="reload-apartment-button"]')
    expect(reloadButton.classes()).toContain('bg-mint-600')
    expect(reloadButton.text()).toContain('Recarregar apartamento')

    const helper = wrapper.get('[data-testid="reload-helper-text"]')
    expect(helper.text()).toContain('libera novas edicoes')

    const formStub = wrapper.get('[data-testid="apartment-snapshot-form-stub"]')
    expect(formStub.attributes('data-stale')).toBe('true')

    const caixaSeries = wrapper.get(
      '[data-testid="series-Financiamento Caixa"]'
    )
    const construtoraSeries = wrapper.get(
      '[data-testid="series-Entrada Construtora"]'
    )
    expect(caixaSeries.attributes('data-stale')).toBe('true')
    expect(construtoraSeries.attributes('data-stale')).toBe('true')

    apartmentState.isSnapshotCurrent.value = true
    await nextTick()

    expect(
      wrapper.find('[data-testid="reload-helper-text"]').exists()
    ).toBe(false)
    expect(
      wrapper.get('[data-testid="apartment-snapshot-form-stub"]').attributes(
        'data-stale'
      )
    ).toBe('false')
  })
})
