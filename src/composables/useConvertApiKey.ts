import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { LOCAL_STORAGE_CONVERT_API_KEY } from '@/constants/menu'

const convertApiKey = ref(
  localStorage.getItem(LOCAL_STORAGE_CONVERT_API_KEY) ?? ''
)
const hasConvertApiKey = computed(() => convertApiKey.value.length > 0)

export function useConvertApiKey(): {
  convertApiKey: Ref<string>
  hasConvertApiKey: ComputedRef<boolean>
  saveConvertApiKey: (key: string) => void
  clearConvertApiKey: () => void
} {
  function saveConvertApiKey(key: string): void {
    convertApiKey.value = key
    localStorage.setItem(LOCAL_STORAGE_CONVERT_API_KEY, key)
  }

  function clearConvertApiKey(): void {
    convertApiKey.value = ''
    localStorage.removeItem(LOCAL_STORAGE_CONVERT_API_KEY)
  }

  return {
    convertApiKey,
    hasConvertApiKey,
    saveConvertApiKey,
    clearConvertApiKey,
  }
}
