import { ref } from 'vue'
import type { Ref } from 'vue'

import mammoth from 'mammoth'

import { useApiKey } from './useApiKey'
import { useConvertApiKey } from './useConvertApiKey'

import { translateMenu } from '@/services/claudeService'
import { convertDocToText } from '@/services/convertApiService'
import mockMenu from '@/fixtures/mockMenu.json'

import type { TranslatedMenu } from '@/types/menu'

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

const translatedMenu = ref<TranslatedMenu | null>(loadCachedMenu())
const isLoading = ref(false)
const error = ref<string | null>(null)
const fileName = ref(localStorage.getItem(LS_FILE_KEY) ?? '')
const isFromCache = ref(translatedMenu.value !== null)

export function useMenuTranslation(): {
  translatedMenu: Ref<TranslatedMenu | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  fileName: Ref<string>
  isFromCache: Ref<boolean>
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
          'Для конвертации .doc файлов укажите ConvertAPI ключ'
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

    try {
      const text = await extractText(file)
      const result = await translateMenu(text, apiKey.value)
      translatedMenu.value = result
      isFromCache.value = false
      localStorage.setItem(LS_MENU_KEY, JSON.stringify(result))
      localStorage.setItem(LS_FILE_KEY, file.name)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      console.error('[useMenuTranslation]', err)
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    translatedMenu.value = null
    isLoading.value = false
    error.value = null
    fileName.value = ''
    isFromCache.value = false
    localStorage.removeItem(LS_MENU_KEY)
    localStorage.removeItem(LS_FILE_KEY)
  }

  return {
    translatedMenu, isLoading, error, fileName,
    isFromCache, translateFile, reset,
  }
}
