import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import {
  extractGoogleSheetId,
  getExportSpreadsheetLink,
} from '@/utils/googleSheets'

type TemplateSource = 'file' | 'google-sheets'

const templateBuffer = ref<ArrayBuffer | null>(null)
const templateFileName = ref('')
const templateSource = ref<TemplateSource | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const hasTemplate = computed(() => templateBuffer.value !== null)

export function useTemplateUpload(): {
  templateBuffer: Ref<ArrayBuffer | null>
  templateFileName: Ref<string>
  templateSource: Ref<TemplateSource | null>
  hasTemplate: ComputedRef<boolean>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  uploadTemplate: (file: File) => Promise<void>
  fetchFromGoogleSheets: (url: string) => Promise<void>
  reset: () => void
} {

  async function uploadTemplate(file: File): Promise<void> {
    templateBuffer.value = await file.arrayBuffer()
    templateFileName.value = file.name
    templateSource.value = 'file'
    error.value = null
  }

  async function fetchFromGoogleSheets(url: string): Promise<void> {
    const sheetId = extractGoogleSheetId(url)
    if (!sheetId) {
      error.value = 'Неверная ссылка на Google Sheets'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const exportUrl = getExportSpreadsheetLink(sheetId)
      const response = await fetch(exportUrl)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          error.value =
            'Нет доступа. Убедитесь, что таблица доступна по ссылке'
        } else if (response.status === 404) {
          error.value = 'Таблица не найдена. Проверьте ссылку'
        } else {
          error.value = `Ошибка загрузки таблицы (${response.status})`
        }
        return
      }

      templateBuffer.value = await response.arrayBuffer()
      templateFileName.value = 'Google Sheets'
      templateSource.value = 'google-sheets'
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Не удалось загрузить таблицу'
      console.error('[fetchFromGoogleSheets]', err)
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    templateBuffer.value = null
    templateFileName.value = ''
    templateSource.value = null
    error.value = null
  }

  return {
    templateBuffer,
    templateFileName,
    templateSource,
    hasTemplate,
    isLoading,
    error,
    uploadTemplate,
    fetchFromGoogleSheets,
    reset,
  }
}
