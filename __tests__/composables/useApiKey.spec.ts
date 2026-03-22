import { describe, it, expect, beforeEach } from 'vitest'

import { useApiKey } from '@/composables/useApiKey'
import { LOCAL_STORAGE_API_KEY } from '@/constants/menu'

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear()
    const { clearApiKey } = useApiKey()
    clearApiKey()
  })

  it('returns empty key and false hasApiKey after clear', () => {
    const { apiKey, hasApiKey } = useApiKey()
    expect(apiKey.value).toBe('')
    expect(hasApiKey.value).toBe(false)
  })

  it('shares state across multiple calls', () => {
    const a = useApiKey()
    const b = useApiKey()
    a.saveApiKey('sk-shared')
    expect(b.apiKey.value).toBe('sk-shared')
    expect(b.hasApiKey.value).toBe(true)
  })

  it('saves key to ref and localStorage', () => {
    const { apiKey, hasApiKey, saveApiKey } = useApiKey()
    saveApiKey('sk-new-key')

    expect(apiKey.value).toBe('sk-new-key')
    expect(hasApiKey.value).toBe(true)
    expect(localStorage.getItem(LOCAL_STORAGE_API_KEY)).toBe('sk-new-key')
  })

  it('clears key from ref and localStorage', () => {
    const { apiKey, hasApiKey, saveApiKey, clearApiKey } = useApiKey()
    saveApiKey('sk-existing')

    clearApiKey()

    expect(apiKey.value).toBe('')
    expect(hasApiKey.value).toBe(false)
    expect(localStorage.getItem(LOCAL_STORAGE_API_KEY)).toBeNull()
  })

  it('overwrites existing key on save', () => {
    const { apiKey, saveApiKey } = useApiKey()
    saveApiKey('first')
    saveApiKey('second')

    expect(apiKey.value).toBe('second')
    expect(localStorage.getItem(LOCAL_STORAGE_API_KEY)).toBe('second')
  })
})
