import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive, ref } from 'vue'
import PeriodSelector from '../PeriodSelector.vue'

const normalizeYear = (value: string | number) =>
  String(value).padStart(4, '0')
const normalizeMonth = (value: string | number) =>
  String(value).padStart(2, '0')

let activeStore: any = null

vi.mock('@/stores/periodStore', () => ({
  usePeriodStore: () => {
    if (!activeStore) {
      throw new Error('Mocked period store was not initialized')
    }
    return activeStore
  },
}))

function createMockStore(year = '2024', month = '01') {
  const yearRef = ref(normalizeYear(year))
  const monthRef = ref(normalizeMonth(month))

  const setYear = vi.fn((value: string | number) => {
    yearRef.value = normalizeYear(value)
  })
  const setMonth = vi.fn((value: string | number) => {
    monthRef.value = normalizeMonth(value)
  })
  const setPeriod = vi.fn(
    (yearValue: string | number, monthValue: string | number) => {
      setYear(yearValue)
      setMonth(monthValue)
    }
  )

  activeStore = reactive({
    year: yearRef,
    month: monthRef,
    setYear,
    setMonth,
    setPeriod,
  })

  return { yearRef, monthRef, setYear, setMonth, setPeriod }
}

describe('PeriodSelector', () => {
  beforeEach(() => {
    activeStore = null
    vi.clearAllMocks()
  })

  it('initializes inputs with the global period and reflects external updates', async () => {
    const { yearRef, monthRef } = createMockStore('2023', '05')
    const wrapper = mount(PeriodSelector)
    const inputs = wrapper.findAll('input')

    expect(inputs[0].element.value).toBe('2023')
    expect(inputs[1].element.value).toBe('05')

    yearRef.value = '2026'
    monthRef.value = '07'
    await nextTick()

    expect(inputs[0].element.value).toBe('2026')
    expect(inputs[1].element.value).toBe('07')

    wrapper.unmount()
  })

  it('only enables the submit button while the local snapshot is dirty', async () => {
    createMockStore('2022', '11')
    const wrapper = mount(PeriodSelector)
    const inputs = wrapper.findAll('input')
    const submitButton = wrapper.get('button[type="submit"]')

    expect(submitButton.attributes('disabled')).toBe('')

    await inputs[0].setValue('2021')
    expect(submitButton.attributes('disabled')).toBeUndefined()

    await inputs[0].setValue('2022')
    await nextTick()
    expect(submitButton.attributes('disabled')).toBe('')

    await inputs[1].setValue('12')
    expect(submitButton.attributes('disabled')).toBeUndefined()

    await inputs[1].setValue('11')
    await nextTick()
    expect(submitButton.attributes('disabled')).toBe('')

    wrapper.unmount()
  })

  it('submits the normalized period through setPeriod and clears the dirty state', async () => {
    const { setPeriod } = createMockStore('2001', '09')
    const wrapper = mount(PeriodSelector)
    const form = wrapper.get('form')
    const [yearInput, monthInput] = wrapper.findAll('input')
    const submitButton = wrapper.get('button[type="submit"]')

    await yearInput.setValue('27')
    await monthInput.setValue('8')
    expect(submitButton.attributes('disabled')).toBeUndefined()

    await form.trigger('submit.prevent')

    expect(setPeriod).toHaveBeenCalledTimes(1)
    expect(setPeriod).toHaveBeenCalledWith('27', '8')

    await nextTick()
    expect(yearInput.element.value).toBe('0027')
    expect(monthInput.element.value).toBe('08')
    expect(submitButton.attributes('disabled')).toBe('')

    wrapper.unmount()
  })

  it('tracks year/month edits independently without overwriting the untouched field', async () => {
    createMockStore('2030', '12')
    const wrapper = mount(PeriodSelector)
    const [yearInput, monthInput] = wrapper.findAll('input')

    await yearInput.setValue('2031')
    expect(yearInput.element.value).toBe('2031')
    expect(monthInput.element.value).toBe('12')

    await monthInput.setValue('07')
    expect(yearInput.element.value).toBe('2031')
    expect(monthInput.element.value).toBe('07')

    await yearInput.setValue('2040')
    await monthInput.setValue('04')
    expect(yearInput.element.value).toBe('2040')
    expect(monthInput.element.value).toBe('04')

    wrapper.unmount()
  })

  it('resets the local snapshot when the store period changes elsewhere', async () => {
    const { yearRef, monthRef } = createMockStore('2020', '10')
    const wrapper = mount(PeriodSelector)
    const [yearInput, monthInput] = wrapper.findAll('input')
    const submitButton = wrapper.get('button[type="submit"]')

    await yearInput.setValue('2015')
    await monthInput.setValue('03')
    expect(submitButton.attributes('disabled')).toBeUndefined()

    yearRef.value = '2017'
    monthRef.value = '06'
    await nextTick()

    expect(yearInput.element.value).toBe('2017')
    expect(monthInput.element.value).toBe('06')
    expect(submitButton.attributes('disabled')).toBe('')

    wrapper.unmount()
  })
})
