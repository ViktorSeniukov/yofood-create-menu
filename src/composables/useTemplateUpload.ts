import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

const templateBuffer = ref<ArrayBuffer | null>(null)
const templateFileName = ref('')
const hasTemplate = computed(() => templateBuffer.value !== null)

export function useTemplateUpload(): {
  templateBuffer: Ref<ArrayBuffer | null>
  templateFileName: Ref<string>
  hasTemplate: ComputedRef<boolean>
  uploadTemplate: (file: File) => Promise<void>
  reset: () => void
} {

  async function uploadTemplate(file: File): Promise<void> {
    templateBuffer.value = await file.arrayBuffer()
    templateFileName.value = file.name
  }

  function reset(): void {
    templateBuffer.value = null
    templateFileName.value = ''
  }

  return {
    templateBuffer,
    templateFileName,
    hasTemplate,
    uploadTemplate,
    reset,
  }
}
