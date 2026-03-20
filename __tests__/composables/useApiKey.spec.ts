import { describe, it, expect, beforeEach } from 'vitest'

import { useApiKey } from '@/composables/useApiKey'
import { LOCAL_STORAGE_API_KEY } from '@/constants/menu'

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initializes with empty string when no key stored', () => {
    const { apiKey, hasApiKey } = useApiKey()
    expect(apiKey.value).toBe('')
    expect(hasApiKey.value).toBe(false)
  })

  it('reads existing key from localStorage', () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-test-123')
    const { apiKey, hasApiKey } = useApiKey()
    expect(apiKey.value).toBe('sk-test-123')
    expect(hasApiKey.value).toBe(true)
  })

  it('saves key to ref and localStorage', () => {
    const { apiKey, hasApiKey, saveApiKey } = useApiKey()
    saveApiKey('sk-new-key')

    expect(apiKey.value).toBe('sk-new-key')
    expect(hasApiKey.value).toBe(true)
    expect(localStorage.getItem(LOCAL_STORAGE_API_KEY)).toBe('sk-new-key')
  })

  it('clears key from ref and localStorage', () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, 'sk-existing')
    const { apiKey, hasApiKey, clearApiKey } = useApiKey()

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
