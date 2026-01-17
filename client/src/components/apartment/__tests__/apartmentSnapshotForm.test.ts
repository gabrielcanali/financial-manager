import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import ApartmentSnapshotForm from '../ApartmentSnapshotForm.vue'
import {
  createApartmentInstallment,
  createApartmentSnapshot,
} from '@/tests/apartmentFixtures'
import type { ApartmentMonthSnapshot } from '@/types/schema'

const periodState = {
  year: ref('2024'),
  month: ref('05'),
}

const saveMonth = vi.fn<
  (
    year: string,
    month: string,
    payload: unknown,
    options?: { syncSnapshot?: boolean }
  ) => Promise<ApartmentMonthSnapshot>
>()

const apartmentStore = {
  saveMonth,
  error: null as string | null,
  isSnapshotCurrent: ref(true),
}

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => periodState,
}))

vi.mock('@/stores/apartmentStore', () => ({
  useApartmentStore: () => apartmentStore,
}))

describe('ApartmentSnapshotForm', () => {
  beforeEach(() => {
    periodState.year.value = '2024'
    periodState.month.value = '05'
    apartmentStore.error = null
    apartmentStore.isSnapshotCurrent.value = true
    saveMonth.mockReset()
  })

  it('prefills fields from snapshot and reacts to prop updates', async () => {
    const snapshot = createApartmentSnapshot()
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    await nextTick()

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const inputs = wrapper.findAll('input[type="number"]')

    expect(
      (checkboxes[0].element as HTMLInputElement).checked
    ).toBe(true)
    expect(
      (checkboxes[1].element as HTMLInputElement).checked
    ).toBe(true)
    expect((inputs[0].element as HTMLInputElement).value).toBe(
      snapshot.financiamento_caixa!.valor_parcela.toString()
    )

    const nextSnapshot = createApartmentSnapshot({
      financiamento_caixa: createApartmentInstallment({
        valor_parcela: 999.5,
      }),
      entrada_construtora: null,
    })
    await wrapper.setProps({ snapshot: nextSnapshot })
    await nextTick()

    expect((inputs[0].element as HTMLInputElement).value).toBe(
      '999.5'
    )
    expect(
      (checkboxes[1].element as HTMLInputElement).checked
    ).toBe(false)
  })

  it('bloqueia o formulario quando o snapshot nao esta alinhado ao periodo', async () => {
    apartmentStore.isSnapshotCurrent.value = false
    const snapshot = createApartmentSnapshot()
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    await nextTick()

    const warning = wrapper.find('[data-testid="snapshot-form-locked-alert"]')
    expect(warning.exists()).toBe(true)
    expect(warning.text()).toContain('Edicoes bloqueadas')

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(
      (checkboxes[0].element as HTMLInputElement).disabled
    ).toBe(true)
    const submitButton = wrapper.get('button[type="submit"]')
    expect(
      (submitButton.element as HTMLButtonElement).disabled
    ).toBe(true)

    apartmentStore.isSnapshotCurrent.value = true
    await nextTick()
    expect(wrapper.find('[data-testid="snapshot-form-locked-alert"]').exists()).toBe(false)
    expect(
      (checkboxes[0].element as HTMLInputElement).disabled
    ).toBe(false)
  })

  it('orienta o usuario a usar o refresh global quando recebe prop de snapshot desatualizado', async () => {
    apartmentStore.isSnapshotCurrent.value = false
    const snapshot = createApartmentSnapshot()
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot, staleSnapshot: true },
    })
    await nextTick()

    const helper = wrapper.get('[data-testid="snapshot-form-stale-hint"]')
    expect(helper.text()).toContain('Recarregar apartamento')
  })

  it('validates required fields before allowing submission', async () => {
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot: null },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[0].setValue(true)
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(saveMonth).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'Informe um valor de parcela maior que zero'
    )
    expect(wrapper.text()).toContain(
      'Revise os campos destacados antes de salvar'
    )
  })

  it('sends normalized payload when saving edited values', async () => {
    const snapshot = createApartmentSnapshot()
    saveMonth.mockResolvedValue(snapshot)
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('2150.35')
    await inputs[1].setValue('190000')
    await inputs[2].setValue('925')
    await inputs[3].setValue('42000')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveMonth).toHaveBeenCalledWith(
      '2024',
      '05',
      expect.objectContaining({
        financiamento_caixa: {
          ano: '2024',
          mes: '05',
          valor_parcela: 2150.35,
          saldo_devedor: 190000,
        },
        entrada_construtora: {
          ano: '2024',
          mes: '05',
          valor_parcela: 925,
          saldo_devedor: 42000,
        },
      }),
      { syncSnapshot: true }
    )
    expect(wrapper.text()).toContain(
      'Snapshot do apartamento salvo com sucesso'
    )
  })

  it('allows disabling sections, sends null payload and clears feedback on period change', async () => {
    const snapshot = createApartmentSnapshot()
    saveMonth.mockResolvedValue(snapshot)
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[1].setValue(false)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveMonth).toHaveBeenCalledWith(
      '2024',
      '05',
      expect.objectContaining({
        entrada_construtora: null,
      }),
      { syncSnapshot: true }
    )
    expect(wrapper.text()).toContain(
      'Snapshot do apartamento salvo com sucesso'
    )

    periodState.year.value = '2025'
    await nextTick()
    expect(
      wrapper.text().includes('Snapshot do apartamento salvo com sucesso')
    ).toBe(false)
  })

  it('restores initial values when clicking reset', async () => {
    const snapshot = createApartmentSnapshot()
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('1234')
    expect(
      (inputs[0].element as HTMLInputElement).value
    ).toBe('1234')

    const resetButton = findButton(wrapper, 'Voltar para valores atuais')
    await resetButton.trigger('click')
    await nextTick()

    expect(
      (inputs[0].element as HTMLInputElement).value
    ).toBe(
      snapshot.financiamento_caixa!.valor_parcela.toString()
    )
  })

  it('indicates saving state and shows backend errors', async () => {
    const snapshot = createApartmentSnapshot()
    let resolveSave!: () => void
    saveMonth.mockImplementation(
      () =>
        new Promise<ApartmentMonthSnapshot>((resolve) => {
          resolveSave = () => resolve(snapshot)
        })
    )
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot },
    })
    const inputs = wrapper.findAll('input[type="number"]')

    await inputs[0].setValue('2300')
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    expect(
      wrapper.get('button[type="submit"]').attributes('disabled')
    ).toBeDefined()

    expect(typeof resolveSave).toBe('function')
    resolveSave()
    await flushPromises()
    expect(wrapper.text()).not.toContain('Salvando...')

    saveMonth.mockRejectedValueOnce(new Error('Falhou update'))
    apartmentStore.error = 'Erro ao atualizar apartamento'
    await inputs[0].setValue('2400')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Falhou update')
  })

  it('cria payloads novos quando nao ha snapshot inicial', async () => {
    const wrapper = mount(ApartmentSnapshotForm, {
      props: { snapshot: null },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[0].setValue(true)
    await nextTick()

    const inputs = wrapper.findAll('input[type="number"]')
    await inputs[0].setValue('1500')
    await inputs[1].setValue('180000')

    saveMonth.mockResolvedValue(createApartmentSnapshot())
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(saveMonth).toHaveBeenCalledWith(
      '2024',
      '05',
      expect.objectContaining({
        financiamento_caixa: {
          ano: '2024',
          mes: '05',
          valor_parcela: 1500,
          saldo_devedor: 180000,
        },
      }),
      { syncSnapshot: true }
    )
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
