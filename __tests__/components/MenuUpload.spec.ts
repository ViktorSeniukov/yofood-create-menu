import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import MenuUpload from '@/components/MenuUpload.vue'
import * as useMenuTranslationModule from '@/composables/useMenuTranslation'

import type { Ref } from 'vue'
import { ref } from 'vue'
import type { TranslatedMenu } from '@/types/menu'

vi.mock('@/composables/useMenuTranslation')

function createMockComposable(overrides: {
  translatedMenu?: Ref<TranslatedMenu | null>
  isLoading?: Ref<boolean>
  error?: Ref<string | null>
} = {}): ReturnType<typeof useMenuTranslationModule.useMenuTranslation> {
  return {
    translatedMenu: overrides.translatedMenu ?? ref(null),
    isLoading: overrides.isLoading ?? ref(false),
    error: overrides.error ?? ref(null),
    translateFile: vi.fn(),
    reset: vi.fn(),
  }
}

describe('MenuUpload', () => {
  it('renders upload dragger in initial state', () => {
    const mock = createMockComposable()
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.text()).toContain('Перетащите файл меню сюда')
  })

  it('shows spinner when loading', () => {
    const mock = createMockComposable({ isLoading: ref(true) })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.find('.ant-spin').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Перетащите файл меню сюда')
  })

  it('shows error alert when error occurs', () => {
    const mock = createMockComposable({ error: ref('Неверный API-ключ') })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.text()).toContain('Неверный API-ключ')
  })

  it('shows reset link when menu is loaded', () => {
    const mockMenu: TranslatedMenu = {
      'Понедельник': { 'Завтрак': [], 'Суп': [], 'Горячее': [], 'Гарнир': [], 'Салат': [], 'Десерт': [] },
      'Вторник': { 'Завтрак': [], 'Суп': [], 'Горячее': [], 'Гарнир': [], 'Салат': [], 'Десерт': [] },
      'Среда': { 'Завтрак': [], 'Суп': [], 'Горячее': [], 'Гарнир': [], 'Салат': [], 'Десерт': [] },
      'Четверг': { 'Завтрак': [], 'Суп': [], 'Горячее': [], 'Гарнир': [], 'Салат': [], 'Десерт': [] },
      'Пятница': { 'Завтрак': [], 'Суп': [], 'Горячее': [], 'Гарнир': [], 'Салат': [], 'Десерт': [] },
    }
    const mock = createMockComposable({ translatedMenu: ref(mockMenu) })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.text()).toContain('Загрузить другой файл')
  })
})
