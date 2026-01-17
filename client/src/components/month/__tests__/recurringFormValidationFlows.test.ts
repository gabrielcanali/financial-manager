import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import RecurringForm from '../RecurringForm.vue'
import type { RecurringMovement } from '@/types/schema'
import {
  createMonthFormActionsMock,
  type MonthFormActionsMockOptions,
} from './helpers/mockMonthFormActions'

type MockActions = ReturnType<typeof createMonthFormActionsMock>

let mockActions: MockActions

vi.mock('@/composables/useMonthFormActions', () => ({
  useMonthFormActions: () => mockActions,
}))

const serieRecurring: RecurringMovement = {
  id: 'rec-serie',
  descricao: 'Internet',
  valor: -120,
  data: '2024-01-05',
  categoria: 'Casa',
  tags: ['casa', 'internet'],
  serie_id: 'serie-90',
  recorrencia: {
    tipo: 'mensal',
    termina_em: null,
  },
}

const regularRecurring: RecurringMovement = {
  id: 'rec-regular',
  descricao: 'Academia',
  valor: -80,
  data: '2024-01-10',
  categoria: 'Saude',
  tags: ['fitness'],
  recorrencia: {
    tipo: 'mensal',
    termina_em: '2024-12',
  },
}

beforeEach(() => {
  mockActions = createMockActions()
})

describe('RecurringForm validation flows', () => {
  it('exige campos obrigatorios, valida terminaEm + generateFuture e normaliza payload no create', async () => {
    mockActions.addRecurring.mockResolvedValue(undefined)
    const wrapper = mount(RecurringForm, {
      props: { title: 'Recorrentes pre', period: 'pre', items: [] },
    })

    await findButton(wrapper, 'Nova recorrencia').trigger('click')
    await nextTick()

    await findCheckbox(wrapper, 'Gerar para meses futuros').setValue(true)
    let form = wrapper.get('form')
    await form.trigger('submit.prevent')
    await nextTick()

    expect((wrapper.vm as any).formError).toBe(
      'Revise os campos destacados para continuar'
    )
    expect(wrapper.text()).toContain('Descricao obrigatoria')
    expect(wrapper.text()).toContain('Use datas no formato YYYY-MM-DD')
    expect(wrapper.text()).toContain('Informe um valor numerico valido')
    expect(wrapper.text()).toContain(
      'Defina termina em (YYYY-MM) para gerar meses futuros'
    )

    const descriptionInput = wrapper.get('input[required][type="text"]')
    const valueInput = wrapper.get('input[type="number"]')
    const dateInput = wrapper.get('input[type="date"]')
    const categoryInput = wrapper.get('input[placeholder="Opcional"]')
    const tagsInput = wrapper.get('input[placeholder="separe por virgula"]')
    const terminaInput = wrapper.get('input[placeholder="YYYY-MM (opcional)"]')

    await descriptionInput.setValue('  Assinatura streaming ')
    await valueInput.setValue('-55.5')
    await dateInput.setValue('2024-02-08')
    await categoryInput.setValue('  Lazer ')
    await tagsInput.setValue(' streaming , familia ')
    await terminaInput.setValue('2024/06')
    await nextTick()
    expect(wrapper.text()).toContain('Termina em deve seguir YYYY-MM')

    await terminaInput.setValue('2024-06')
    await nextTick()

    form = wrapper.get('form')
    await form.trigger('submit.prevent')
    await nextTick()

    expect(mockActions.addRecurring).toHaveBeenCalledWith(
      'pre',
      {
        descricao: 'Assinatura streaming',
        valor: -55.5,
        data: '2024-02-08',
        categoria: 'Lazer',
        tags: ['streaming', 'familia'],
        recorrencia: {
          tipo: 'mensal',
          termina_em: '2024-06',
        },
      },
      { generateFuture: true }
    )
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('Recorrente criado')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(mockActions.updateRecurring).not.toHaveBeenCalled()
  })

  it('aplica cascade somente para series e propaga payload limpo ao editar', async () => {
    mockActions.updateRecurring.mockResolvedValue(undefined)
    const wrapper = mount(RecurringForm, {
      props: {
        title: 'Recorrentes pos',
        period: 'pos',
        items: [serieRecurring],
      },
    })

    await findButton(wrapper, 'Editar').trigger('click')
    await nextTick()
    const cascadeCheckbox = findCheckbox(wrapper, 'Aplicar em toda a serie')
    await cascadeCheckbox.setValue(true)

    const descriptionInput = wrapper.get('input[required][type="text"]')
    const valueInput = wrapper.get('input[type="number"]')
    const dateInput = wrapper.get('input[type="date"]')
    const categoryInput = wrapper.get('input[placeholder="Opcional"]')
    const tagsInput = wrapper.get('input[placeholder="separe por virgula"]')
    const terminaInput = wrapper.get('input[placeholder="YYYY-MM (opcional)"]')

    await descriptionInput.setValue('  Internet fibra ')
    await valueInput.setValue('-130')
    await dateInput.setValue('2024-01-15')
    await categoryInput.setValue('  Casa ')
    await tagsInput.setValue('internet, casa')
    await terminaInput.setValue('2025-01')

    const form = wrapper.get('form')
    await form.trigger('submit.prevent')
    await nextTick()

    expect(mockActions.updateRecurring).toHaveBeenCalledWith(
      'pos',
      'rec-serie',
      {
        descricao: 'Internet fibra',
        valor: -130,
        data: '2024-01-15',
        categoria: 'Casa',
        tags: ['internet', 'casa'],
        recorrencia: {
          tipo: 'mensal',
          termina_em: '2025-01',
        },
      },
      { cascade: true }
    )
    expect(
      wrapper.get('[data-testid="recurring-feedback"]').text()
    ).toContain('Recorrente atualizado')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(mockActions.addRecurring).not.toHaveBeenCalled()
  })

  it('oculta toggle cascade para itens sem serie e reseta estado ao atualizar items/periodo', async () => {
    const wrapper = mount(RecurringForm, {
      props: {
        title: 'Recorrentes pre',
        period: 'pre',
        items: [regularRecurring],
      },
    })

    await findButton(wrapper, 'Editar').trigger('click')
    await nextTick()
    expect(() => findCheckbox(wrapper, 'Aplicar em toda a serie')).toThrow()

    ;(wrapper.vm as any).formError = 'erro manual'
    ;(wrapper.vm as any).statusMessage = 'mensagem manual'
    await wrapper.setProps({
      items: [
        { ...regularRecurring, descricao: 'Academia atualizada' },
        serieRecurring,
      ],
    })
    await nextTick()

    const vmAfterProps = wrapper.vm as any
    expect(vmAfterProps.showForm).toBe(false)
    expect(vmAfterProps.editingId).toBeNull()
    expect(vmAfterProps.formError).toBe('')
    expect(vmAfterProps.statusMessage).toBe('mensagem manual')

    await findButton(wrapper, 'Nova recorrencia').trigger('click')
    await nextTick()
    await findCheckbox(wrapper, 'Gerar para meses futuros').setValue(true)
    ;(wrapper.vm as any).form.descricao = 'Teste'
    ;(wrapper.vm as any).form.data = '2024-03-10'
    ;(wrapper.vm as any).form.valor = 10
    ;(wrapper.vm as any).form.terminaEm = ''
    mockActions.triggerPeriodChange()
    await nextTick()

    const vmAfterPeriod = wrapper.vm as any
    expect(vmAfterPeriod.showForm).toBe(false)
    expect(vmAfterPeriod.generateFuture).toBe(false)
    expect(vmAfterPeriod.formError).toBe('')
    expect(vmAfterPeriod.statusMessage).toBe('')
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
