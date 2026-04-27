import { reactive, ref } from 'vue'
import type { Ref } from 'vue'

import mammoth from 'mammoth'

import { useApiKey } from './useApiKey'
import { useConvertApiKey } from './useConvertApiKey'

import { translateDayMenu } from '@/services/claudeService'
import { convertDocToText } from '@/services/cloudConvertService'
import { DAYS_OF_WEEK } from '@/constants/menu'
import { splitMenuByDay } from '@/utils/splitMenuByDay'
import mockMenu from '@/fixtures/mockMenu.json'

import type {
  DayTranslationStatus,
  TranslatedMenu,
  TranslationProgress,
} from '@/types/menu'

const USE_MOCK = false

const SUPPORTED_EXTENSIONS = ['txt', 'docx', 'doc']

const LS_MENU_KEY = 'translated_menu'
const LS_FILE_KEY = 'translated_menu_file'

function loadCachedMenu(): TranslatedMenu | null {
  try {
    const raw = localStorage.getItem(LS_MENU_KEY)
    return raw ? JSON.parse(raw) as TranslatedMenu : null
  } catch {
    return null
  }
}

function createEmptyProgress(): TranslationProgress {
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [day, 'pending' as DayTranslationStatus])
  ) as TranslationProgress
}

function createAllDoneProgress(): TranslationProgress {
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [day, 'done' as DayTranslationStatus])
  ) as TranslationProgress
}

const translatedMenu = ref<TranslatedMenu | null>(loadCachedMenu())
const isLoading = ref(false)
const error = ref<string | null>(null)
const fileName = ref(localStorage.getItem(LS_FILE_KEY) ?? '')
const isFromCache = ref(translatedMenu.value !== null)
let abortController: AbortController | null = null
const dayProgress = reactive<TranslationProgress>(
  translatedMenu.value !== null
    ? createAllDoneProgress()
    : createEmptyProgress()
)

export function useMenuTranslation(): {
  translatedMenu: Ref<TranslatedMenu | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  fileName: Ref<string>
  isFromCache: Ref<boolean>
  dayProgress: TranslationProgress
  translateFile: (file: File) => Promise<void>
  reset: () => void
} {
  const { apiKey, hasApiKey } = useApiKey()
  const { convertApiKey, hasConvertApiKey } = useConvertApiKey()

  async function extractText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'txt') {
      return file.text()
    }

    if (extension === 'docx') {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    }

    if (extension === 'doc') {
      if (!hasConvertApiKey.value) {
        throw new Error(
          'Для конвертации .doc файлов укажите CloudConvert ключ'
          + ' в настройках'
        )
      }
      return convertDocToText(file, convertApiKey.value)
    }

    throw new Error(
      `Поддерживаются только файлы: ${SUPPORTED_EXTENSIONS.join(', ')}`
    )
  }

  async function translateFile(file: File): Promise<void> {
    if (USE_MOCK) {
      translatedMenu.value = mockMenu as TranslatedMenu
      Object.assign(dayProgress, createAllDoneProgress())
      return
    }

    if (!hasApiKey.value) {
      error.value = 'API-ключ не задан'
      return
    }

    isLoading.value = true
    error.value = null
    translatedMenu.value = null
    fileName.value = file.name
    Object.assign(dayProgress, createEmptyProgress())

    abortController = new AbortController()
    const { signal } = abortController

    try {
      const text = await extractText(file)
      const chunks = splitMenuByDay(text)

      // Build partial menu object to fill progressively
      const partial = {} as Record<string, unknown>

      // Launch all 5 day translations in parallel
      const promises = chunks.map(async ({ day, text: dayText }) => {
        dayProgress[day] = 'translating'
        try {
          const dayMenu = await translateDayMenu(
            dayText, day, apiKey.value, signal
          )
          partial[day] = dayMenu
          dayProgress[day] = 'done'

          // Update translatedMenu progressively after each completed day
          translatedMenu.value = { ...partial } as TranslatedMenu
        } catch (err) {
          dayProgress[day] = 'error'
          throw err
        }
      })

      await Promise.all(promises)

      // Final assignment (safety net)
      translatedMenu.value = partial as TranslatedMenu
      isFromCache.value = false
      localStorage.setItem(
        LS_MENU_KEY, JSON.stringify(translatedMenu.value)
      )
      localStorage.setItem(LS_FILE_KEY, file.name)
    } catch (err) {
      // Ignore abort — user cancelled intentionally
      if (err instanceof Error && err.name === 'AbortError') return
      error.value =
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      console.error('[useMenuTranslation]', err)
    } finally {
      isLoading.value = false
      abortController = null
    }
  }

  function reset(): void {
    abortController?.abort()
    abortController = null
    translatedMenu.value = null
    isLoading.value = false
    error.value = null
    fileName.value = ''
    isFromCache.value = false
    Object.assign(dayProgress, createEmptyProgress())
    localStorage.removeItem(LS_MENU_KEY)
    localStorage.removeItem(LS_FILE_KEY)
  }

  return {
    translatedMenu, isLoading, error, fileName,
    isFromCache, dayProgress, translateFile, reset,
  }
}
