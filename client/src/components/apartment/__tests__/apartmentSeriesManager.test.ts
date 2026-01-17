import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ApartmentSeriesManager from '../ApartmentSeriesManager.vue'
import { createApartmentInstallment } from '@/tests/apartmentFixtures'

const periodState = {
  year: ref('2024'),
  month: ref('05'),
}

const saveSeriesInstallment = vi.fn()
const apartmentStore = {
  saveSeriesInstallment,
  isSnapshotCurrent: ref(true),
}

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => periodState,
}))

vi.mock('@/stores/apartmentStore', () => ({
  useApartmentStore: () => apartmentStore,
}))

function mountManager(
  entries = [createApartmentInstallment()],
  extraProps: Record<string, unknown> = {}
) {
  return mount(ApartmentSeriesManager, {
    props: {
      title: 'Financiamento Caixa',
      seriesKey: 'financiamento_caixa',
      emptyMessage: 'Nenhum dado',
      entries,
      ...extraProps,
    },
  })
}

describe('ApartmentSeriesManager', () => {
  beforeEach(() => {
    periodState.year.value = '2024'
    periodState.month.value = '05'
    apartmentStore.isSnapshotCurrent.value = true
    saveSeriesInstallment.mockReset()
    saveSeriesInstallment.mockResolvedValue(undefined)
  })

  it('abre o formulario e envia payload normalizado para salvar nova parcela', async () => {
    const wrapper = mountManager([])
    const openButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Nova parcela'))
    await openButton?.trigger('click')

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('2024')
    await inputs[1].setValue('6')
    await inputs[2].setValue('1500.5')
    await inputs[3].setValue('')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveSeriesInstallment).toHaveBeenCalledWith({
      series: 'financiamento_caixa',
      year: '2024',
      month: '06',
      installment: {
        ano: '2024',
        mes: '06',
        valor_parcela: 1500.5,
        saldo_devedor: null,
      },
      syncSnapshot: false,
    })
    const updatedEvents = wrapper.emitted('updated')
    expect(updatedEvents).toBeTruthy()
    expect(updatedEvents?.[0][0]).toEqual({
      reference: '2024-06',
      syncedWithCurrentPeriod: false,
    })
    expect(wrapper.text()).toContain(
      'Snapshot atual (2024-05) permanece inalterado ate voce recarregar.'
    )
  })

  it('bloqueia referencias duplicadas e exibe validacoes detalhadas', async () => {
    const entry = createApartmentInstallment({ referencia: '2024-05' })
    const wrapper = mountManager([entry])

    const openButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Nova parcela'))
    await openButton?.trigger('click')
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('2024')
    await inputs[1].setValue('05')
    await inputs[2].setValue('')
    await inputs[3].setValue('-1')

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(saveSeriesInstallment).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ja existe uma parcela registrada')
    expect(wrapper.text()).toContain('Valor da parcela deve ser maior que zero')
    expect(wrapper.text()).toContain('Saldo precisa ser maior ou igual a zero')
  })

  it('preenche dados ao editar e remove parcelas quando solicitado', async () => {
    const entry = createApartmentInstallment({
      referencia: '2024-04',
      ano: '2024',
      mes: '04',
      valor_parcela: 1800,
      saldo_devedor: 190000,
    })
    const wrapper = mountManager([entry])

    const editButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Editar'))
    await editButton?.trigger('click')
    const inputs = wrapper.findAll('input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('2024')
    expect((inputs[1].element as HTMLInputElement).value).toBe('04')
    await inputs[2].setValue('1850')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveSeriesInstallment).toHaveBeenCalledWith({
      series: 'financiamento_caixa',
      year: '2024',
      month: '04',
      installment: {
        ano: '2024',
        mes: '04',
        valor_parcela: 1850,
        saldo_devedor: 190000,
      },
      syncSnapshot: false,
    })

    const removeButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Remover'))
    await removeButton?.trigger('click')
    await flushPromises()

    expect(saveSeriesInstallment).toHaveBeenLastCalledWith({
      series: 'financiamento_caixa',
      year: '2024',
      month: '04',
      installment: null,
      syncSnapshot: false,
    })
  })

  it('sincroniza snapshot quando periodo corresponde e remove aviso extra', async () => {
    const entry = createApartmentInstallment({
      referencia: '2024-05',
      ano: '2024',
      mes: '05',
    })
    periodState.month.value = '05'
    const wrapper = mountManager([entry])

    const editButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Editar'))
    await editButton?.trigger('click')
    const inputs = wrapper.findAll('input')
    await inputs[2].setValue('2000')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveSeriesInstallment).toHaveBeenCalledWith({
      series: 'financiamento_caixa',
      year: '2024',
      month: '05',
      installment: expect.objectContaining({
        valor_parcela: 2000,
      }),
      syncSnapshot: true,
    })
    expect(wrapper.text()).toContain(
      'Parcela atualizada com sucesso em 2024-05'
    )
    expect(wrapper.text()).not.toContain(
      'Snapshot atual (2024-05) permanece inalterado'
    )
  })

  it('limpa feedback quando o periodo global muda', async () => {
    const wrapper = mountManager([])
    const openButton = wrapper
      .findAll('button')
      .find((node) => node.text().includes('Nova parcela'))
    await openButton?.trigger('click')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    expect(wrapper.text()).toContain('Revise os campos destacados')

    periodState.year.value = '2025'
    await nextTick()
    expect(wrapper.text()).not.toContain('Revise os campos destacados')
  })

  it('desabilita interacoes quando snapshot esta desatualizado', async () => {
    apartmentStore.isSnapshotCurrent.value = false
    const wrapper = mountManager()
    await nextTick()

    const warning = wrapper.find('[data-testid="series-manager-locked-alert"]')
    expect(warning.exists()).toBe(true)

    const openButton = findButton(wrapper, 'Nova parcela')
    expect(
      (openButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    const editButton = findButton(wrapper, 'Editar')
    expect(
      (editButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    await openButton.trigger('click')
    await nextTick()
    expect(wrapper.find('form').exists()).toBe(false)

    apartmentStore.isSnapshotCurrent.value = true
    await nextTick()
    expect(wrapper.find('[data-testid="series-manager-locked-alert"]').exists()).toBe(false)
    expect(
      (openButton.element as HTMLButtonElement).disabled
    ).toBe(false)
  })

  it('fecha formularios em andamento ao detectar snapshot defasado', async () => {
    const wrapper = mountManager([])
    const openButton = findButton(wrapper, 'Nova parcela')
    await openButton.trigger('click')
    await nextTick()
    expect(wrapper.find('form').exists()).toBe(true)

    apartmentStore.isSnapshotCurrent.value = false
    await nextTick()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('exibe orientacao contextual quando recebe staleSnapshot do componente pai', async () => {
    apartmentStore.isSnapshotCurrent.value = false
    const wrapper = mountManager([], { staleSnapshot: true })
    await nextTick()

    const helper = wrapper.get('[data-testid="series-manager-stale-hint"]')
    expect(helper.text()).toContain('Recarregue o apartamento')
  })
})

function findButton(
  wrapper: ReturnType<typeof mount>,
  label: string
) {
  const button = wrapper
    .findAll('button')
    .find((node) => node.text().includes(label))
  if (!button) {
    throw new Error(`Button "${label}" not found`)
  }
  return button
}
