import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { LOCAL_STORAGE_API_KEY } from '@/constants/menu'

const apiKey = ref(localStorage.getItem(LOCAL_STORAGE_API_KEY) ?? '')
const hasApiKey = computed(() => apiKey.value.length > 0)

export function useApiKey(): {
  apiKey: Ref<string>
  hasApiKey: ComputedRef<boolean>
  saveApiKey: (key: string) => void
  clearApiKey: () => void
} {
  function saveApiKey(key: string): void {
    apiKey.value = key
    localStorage.setItem(LOCAL_STORAGE_API_KEY, key)
  }

  function clearApiKey(): void {
    apiKey.value = ''
    localStorage.removeItem(LOCAL_STORAGE_API_KEY)
  }

  return { apiKey, hasApiKey, saveApiKey, clearApiKey }
}
