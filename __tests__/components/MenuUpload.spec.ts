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
  fileName?: Ref<string>
  isFromCache?: Ref<boolean>
} = {}): ReturnType<typeof useMenuTranslationModule.useMenuTranslation> {
  return {
    translatedMenu: overrides.translatedMenu ?? ref(null),
    isLoading: overrides.isLoading ?? ref(false),
    error: overrides.error ?? ref(null),
    fileName: overrides.fileName ?? ref(''),
    isFromCache: overrides.isFromCache ?? ref(false),
    translateFile: vi.fn(),
    reset: vi.fn(),
  }
}

describe('MenuUpload', () => {
  it('renders upload dragger in initial state', () => {
    const mock = createMockComposable()
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.text()).toContain('Перетащите файл')
  })

  it('shows loading status in file row when translating', () => {
    const mock = createMockComposable({
      isLoading: ref(true),
      fileName: ref('menu.txt'),
    })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.find('.menu-upload__file-status').exists()).toBe(true)
    expect(wrapper.text()).toContain('Переводим меню')
  })

  it('shows error alert when error occurs', () => {
    const mock = createMockComposable({ error: ref('Неверный API-ключ') })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.text()).toContain('Неверный API-ключ')
  })

  it('shows reset link when menu is loaded', () => {
    const emptyDay = {
      'Сок': [] as string[], 'Завтрак': [] as string[], 'Суп': [] as string[],
      'Горячее': [] as string[], 'Гарнир': [] as string[], 'Салат': [] as string[],
      'Десерт': [] as string[],
    }
    const mockMenu: TranslatedMenu = {
      'Понедельник': { ...emptyDay },
      'Вторник': { ...emptyDay },
      'Среда': { ...emptyDay },
      'Четверг': { ...emptyDay },
      'Пятница': { ...emptyDay },
    }
    const mock = createMockComposable({ translatedMenu: ref(mockMenu) })
    vi.mocked(useMenuTranslationModule.useMenuTranslation).mockReturnValue(mock)

    const wrapper = mount(MenuUpload)
    expect(wrapper.find('.menu-upload__file-reset').exists()).toBe(true)
    expect(wrapper.text()).toContain('Загружено')
  })
})
