import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import EntriesTable from '../EntriesTable.vue'
import type { Movement } from '@/types/schema'
import {
  createMonthFormActionsMock,
  type MonthFormActionsMockOptions,
} from './helpers/mockMonthFormActions'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

let mockActions: MockActions

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

const sampleEntries: Movement[] = [
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

const seriesEntry: Movement = {
  id: 'entry-serie',
  descricao: 'Academia',
  valor: -80,
  data: '2024-01-04',
  categoria: 'Saude',
  parcela: '1/6',
  tags: ['fitness'],
  serie_id: 'serie-77',
}

beforeEach(() => {
  mockActions = createMockActions()
})

describe('EntriesTable form flows', () => {
  it('cria lancamentos sanitizando payload, validando parcelamento e propagando generateFuture', async () => {
    mockActions.addEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: [] },
    })

    expect(mockActions.isSaving).toHaveBeenCalledWith('entries')
    expect(mockActions.actionErrorFor).toHaveBeenCalledWith('entries')

    await findButton(wrapper, 'Novo lancamento').trigger('click')
    await nextTick()

    const form = wrapper.get('form')
    const descriptionInput = form.get('input[required][type="text"]')
    const valueInput = form.get('input[type="number"]')
    const dateInput = form.get('input[type="date"]')
    const categoryInput = form.get('input[placeholder="Opcional"]')
    const parcelaInput = form.get('input[placeholder="Ex: 1/10"]')
    const tagsInput = form.get('input[placeholder="ex: fixo, cartao"]')

    await descriptionInput.setValue('  Compra mercado ')
    await valueInput.setValue('150.5')
    await dateInput.setValue('2024-02-10')
    await categoryInput.setValue('  Casa ')
    await tagsInput.setValue(' mercado , casa ')

    await findCheckbox(wrapper, 'Gerar meses futuros').setValue(true)
    await nextTick()

    expect(wrapper.text()).toContain(
      'Informe a parcela n/m antes de gerar meses futuros'
    )

    await form.trigger('submit.prevent')
    await nextTick()
    expect(mockActions.addEntry).not.toHaveBeenCalled()
    expect(
      wrapper.get('[data-testid="entries-feedback"]').text()
    ).toContain('Revise os campos destacados para continuar')

    await parcelaInput.setValue(' 2/4 ')
    await form.trigger('submit.prevent')
    await nextTick()

    expect(mockActions.addEntry).toHaveBeenCalledWith(
      {
        descricao: 'Compra mercado',
        valor: 150.5,
        data: '2024-02-10',
        categoria: 'Casa',
        parcela: '2/4',
        tags: ['mercado', 'casa'],
      },
      { generateFuture: true }
    )

    await nextTick()
    const vm = wrapper.vm as any
    expect(wrapper.find('form').exists()).toBe(false)
    expect(vm.showForm).toBe(false)
    expect(vm.generateFuture).toBe(false)
    expect(vm.form.descricao).toBe('')
  })

  it('edita lancamento com serie aplicando cascade e mantendo payload limpo', async () => {
    mockActions.updateEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: [seriesEntry] },
    })

    await findButton(wrapper, 'Editar').trigger('click')
    await nextTick()

    expect(() => findCheckbox(wrapper, 'Gerar meses futuros')).toThrow()
    const cascadeCheckbox = findCheckbox(wrapper, 'Aplicar em cascata')
    await cascadeCheckbox.setValue(true)

    const form = wrapper.get('form')
    const valueInput = form.get('input[type="number"]')
    const tagsInput = form.get('input[placeholder="ex: fixo, cartao"]')

    await valueInput.setValue('-75.95')
    await tagsInput.setValue(' treino , saude ')

    await form.trigger('submit.prevent')
    await nextTick()

    expect(mockActions.updateEntry).toHaveBeenCalledWith(
      'entry-serie',
      {
        descricao: 'Academia',
        valor: -75.95,
        data: '2024-01-04',
        categoria: 'Saude',
        parcela: '1/6',
        tags: ['treino', 'saude'],
      },
      { cascade: true }
    )
    expect(mockActions.addEntry).not.toHaveBeenCalled()
    await nextTick()
    const vm = wrapper.vm as any
    expect(wrapper.find('form').exists()).toBe(false)
    expect(vm.showForm).toBe(false)
    expect(vm.cascade).toBe(false)
    expect(vm.form.descricao).toBe('')
  })

  it('remove lancamento mostrando mensagem padrao de sucesso', async () => {
    mockActions.deleteEntry.mockResolvedValue(undefined)
    const wrapper = mount(EntriesTable, {
      props: { entries: sampleEntries },
    })

    await findButton(wrapper, 'Excluir').trigger('click')
    await nextTick()

    expect(mockActions.deleteEntry).toHaveBeenCalledWith('entry-01')
    expect(
      wrapper.get('[data-testid="entries-feedback"]').text()
    ).toContain('Lancamento removido')
  })

  it('exibe erro do store e mantem botoes desabilitados enquanto salvando', async () => {
    mockActions = createMockActions({
      savingOverrides: { entries: true },
      errorOverrides: { entries: 'falhou entradas' },
    })
    const wrapper = mount(EntriesTable, {
      props: { entries: sampleEntries },
    })
    await nextTick()

    expect(wrapper.text()).toContain('Salvando...')
    expect(
      wrapper.get('[data-testid="entries-feedback"]').text()
    ).toContain('falhou entradas')
    expect(findButton(wrapper, 'Novo lancamento').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'Editar').attributes('disabled')).toBeDefined()
    expect(findButton(wrapper, 'Excluir').attributes('disabled')).toBeDefined()
  })

  it('reseta formulario e feedback quando periodo muda via helper', async () => {
    const wrapper = mount(EntriesTable, {
      props: { entries: [seriesEntry] },
    })

    expect(mockActions.onPeriodChange).toHaveBeenCalledTimes(1)

    await findButton(wrapper, 'Novo lancamento').trigger('click')
    await nextTick()
    await findCheckbox(wrapper, 'Gerar meses futuros').setValue(true)
    ;(wrapper.vm as any).form.descricao = 'Fluxo create'
    ;(wrapper.vm as any).statusMessage = 'mensagem create'
    ;(wrapper.vm as any).formError = 'erro create'

    mockActions.triggerPeriodChange()
    await nextTick()

    let vm = wrapper.vm as any
    expect(wrapper.find('form').exists()).toBe(false)
    expect(vm.generateFuture).toBe(false)
    expect(vm.formError).toBe('')
    expect(vm.statusMessage).toBe('')

    await findButton(wrapper, 'Editar').trigger('click')
    await nextTick()
    const cascadeCheckbox = findCheckbox(wrapper, 'Aplicar em cascata')
    await cascadeCheckbox.setValue(true)
    vm.form.descricao = 'Fluxo edit'

    mockActions.triggerPeriodChange()
    await nextTick()

    vm = wrapper.vm as any
    expect(wrapper.find('form').exists()).toBe(false)
    expect(vm.cascade).toBe(false)
    expect(vm.editingId).toBeNull()
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
