import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { mergeMenuIntoTemplate } from '@/utils/excelMerge'

import type { TranslatedMenu } from '@/types/menu'

export function useMenuGeneration(): {
  isGenerating: Ref<boolean>
  error: Ref<string | null>
  canGenerate: ComputedRef<boolean>
  generate: (
    menu: TranslatedMenu,
    templateBuffer: ArrayBuffer,
    fileName: string
  ) => Promise<void>
} {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)
  const menuRef = ref<TranslatedMenu | null>(null)
  const templateRef = ref<ArrayBuffer | null>(null)

  const canGenerate = computed(
    () => menuRef.value !== null && templateRef.value !== null
  )

  function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  async function generate(
    menu: TranslatedMenu,
    templateBuffer: ArrayBuffer,
    fileName: string
  ): Promise<void> {
    isGenerating.value = true
    error.value = null

    try {
      const result = await mergeMenuIntoTemplate(templateBuffer, menu)
      const blob = new Blob([result], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      downloadBlob(blob, fileName)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Неизвестная ошибка'
      console.error('[useMenuGeneration]', err)
    } finally {
      isGenerating.value = false
    }
  }

  return { isGenerating, error, canGenerate, generate }
}
