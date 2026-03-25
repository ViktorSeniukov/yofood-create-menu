import { describe, it, expect, vi, beforeEach } from 'vitest'

import { useMenuTranslation } from '@/composables/useMenuTranslation'
import { useApiKey } from '@/composables/useApiKey'
import * as claudeService from '@/services/claudeService'
import * as splitUtil from '@/utils/splitMenuByDay'
import type { DayMenu, DayOfWeek, TranslatedMenu } from '@/types/menu'

vi.mock('@/services/claudeService')
vi.mock('@/utils/splitMenuByDay')

/** Create a File with a working .text() method for jsdom */
function createTextFile(content: string, name: string): File {
  const blob = new Blob([content], { type: 'text/plain' })
  const file = new File([blob], name, { type: 'text/plain' })
  if (typeof file.text !== 'function') {
    file.text = () => Promise.resolve(content)
  }
  return file
}

const emptyDay: DayMenu = {
  'Сок': [],
  'Завтрак': [],
  'Суп': [],
  'Горячее': [],
  'Гарнир': [],
  'Салат': [],
  'Десерт': [],
}

const mockMenu: TranslatedMenu = {
  'Понедельник': { ...emptyDay, 'Завтрак': ['Омлет / Omlet'] },
  'Вторник': { ...emptyDay },
  'Среда': { ...emptyDay },
  'Четверг': { ...emptyDay },
  'Пятница': { ...emptyDay },
}

const DAYS: DayOfWeek[] = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница',
]

function mockSplitAndTranslate(): void {
  vi.mocked(splitUtil.splitMenuByDay).mockReturnValue(
    DAYS.map((day) => ({ day, text: `text for ${day}` }))
  )
  vi.mocked(claudeService.translateDayMenu).mockImplementation(
    async (_text: string, day: DayOfWeek) =>
      mockMenu[day]
  )
}

describe('useMenuTranslation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    const { reset } = useMenuTranslation()
    const { clearApiKey } = useApiKey()
    reset()
    clearApiKey()
  })

  it('sets error when API key is not set', async () => {
    const { error, translateFile } = useMenuTranslation()
    const file = createTextFile('menu', 'menu.txt')

    await translateFile(file)

    expect(error.value).toBe('API-ключ не задан')
  })

  it('sets isLoading during translation and clears after', async () => {
    useApiKey().saveApiKey('sk-test')
    mockSplitAndTranslate()

    const { isLoading, translateFile } = useMenuTranslation()
    const file = createTextFile('menu', 'menu.txt')

    const promise = translateFile(file)
    expect(isLoading.value).toBe(true)

    await promise
    expect(isLoading.value).toBe(false)
  })

  it('populates translatedMenu on success', async () => {
    useApiKey().saveApiKey('sk-test')
    mockSplitAndTranslate()

    const { translatedMenu, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)

    expect(translatedMenu.value).toEqual(mockMenu)
  })

  it('sets error on service failure', async () => {
    useApiKey().saveApiKey('sk-test')
    vi.mocked(splitUtil.splitMenuByDay).mockReturnValue(
      DAYS.map((day) => ({ day, text: `text for ${day}` }))
    )
    vi.mocked(claudeService.translateDayMenu).mockRejectedValue(
      new Error('Неверный API-ключ')
    )

    const { error, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)

    expect(error.value).toBe('Неверный API-ключ')
  })

  it('resets state correctly', async () => {
    useApiKey().saveApiKey('sk-test')
    mockSplitAndTranslate()

    const {
      translatedMenu, error, dayProgress, reset, translateFile,
    } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)
    expect(translatedMenu.value).not.toBeNull()

    reset()
    expect(translatedMenu.value).toBeNull()
    expect(error.value).toBeNull()
    expect(dayProgress['Понедельник']).toBe('pending')
  })

  it('updates dayProgress per day during translation', async () => {
    useApiKey().saveApiKey('sk-test')
    mockSplitAndTranslate()

    const { dayProgress, translateFile } = useMenuTranslation()
    const file = createTextFile('content', 'menu.txt')

    await translateFile(file)

    for (const day of DAYS) {
      expect(dayProgress[day]).toBe('done')
    }
  })
})
