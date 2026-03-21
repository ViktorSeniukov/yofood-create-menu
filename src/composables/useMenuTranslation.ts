import { ref } from 'vue'
import type { Ref } from 'vue'

import mammoth from 'mammoth'

import { useApiKey } from './useApiKey'

import { translateMenu } from '@/services/claudeService'
import mockMenu from '@/fixtures/mockMenu.json'

import type { TranslatedMenu } from '@/types/menu'

const USE_MOCK = false

const SUPPORTED_EXTENSIONS = ['txt', 'docx']

const translatedMenu = ref<TranslatedMenu | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useMenuTranslation(): {
  translatedMenu: Ref<TranslatedMenu | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  translateFile: (file: File) => Promise<void>
  reset: () => void
} {
  const { apiKey, hasApiKey } = useApiKey()

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

    try {
      const text = await extractText(file)
      translatedMenu.value = await translateMenu(text, apiKey.value)
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
  }

  return { translatedMenu, isLoading, error, translateFile, reset }
}
