import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useMenuTranslation } from '@/composables/useMenuTranslation'
import * as claudeService from '@/services/claudeService'
import { LOCAL_STORAGE_API_KEY } from '@/constants/menu'
import type { TranslatedMenu } from '@/types/menu'

vi.mock('@/services/claudeService')

/** Create a File with a working .text() method for jsdom */
function createTextFile(content: string, name: string): File {
  const blob = new Blob([content], { type: 'text/plain' })
  const file = new File([blob], name, { type: 'text/plain' })
  if (typeof file.text !== 'function') {
    file.text = () => Promise.resolve(content)
  }
  return file
}

const emptyDay = {
  'Сок': [] as string[],
  'Завтрак': [] as string[],
  'Суп': [] as string[],
  'Горячее': [] as string[],
  'Гарнир': [] as string[],
  'Салат': [] as string[],
  'Десерт': [] as string[],
}

const mockMenu: TranslatedMenu = {
  'Понедельник': { ...emptyDay, 'Завтрак': ['Омлет / Omlet'] },
  'Вторник': { ...emptyDay },
  'Среда': { ...emptyDay },
  'Четверг': { ...emptyDay },
  'Пятница': { ...emptyDay },
}

describe('useMenuTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sets error when API key is not set', async () => {
    const { error, translateFile } = useMenuTranslation()
    const file = createTextFile('menu', 'menu.txt')

    await translateFile(file)

    expect(error.value).toBe('API-ключ не задан')
  })

  it('sets isLoading during translation and clears after', async () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-test')
    vi.mocked(claudeService.translateMenu).mockResolvedValue(mockMenu)

    const { isLoading, translateFile } = useMenuTranslation()
    const file = createTextFile('menu', 'menu.txt')

    const promise = translateFile(file)
    expect(isLoading.value).toBe(true)

    await promise
    expect(isLoading.value).toBe(false)
  })

  it('populates translatedMenu on success', async () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-test')
    vi.mocked(claudeService.translateMenu).mockResolvedValue(mockMenu)

    const { translatedMenu, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)

    expect(translatedMenu.value).toEqual(mockMenu)
  })

  it('sets error on service failure', async () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-test')
    vi.mocked(claudeService.translateMenu).mockRejectedValue(
      new Error('Неверный API-ключ')
    )

    const { error, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)

    expect(error.value).toBe('Неверный API-ключ')
  })

  it('resets state correctly', async () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-test')
    vi.mocked(claudeService.translateMenu).mockResolvedValue(mockMenu)

    const { translatedMenu, error, reset, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)
    expect(translatedMenu.value).not.toBeNull()

    reset()
    expect(translatedMenu.value).toBeNull()
    expect(error.value).toBeNull()
  })
})
