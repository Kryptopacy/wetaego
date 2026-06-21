import '@testing-library/jest-dom'
import { vi } from 'vitest'

process.env.RESEND_API_KEY = 're_test_key_123'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xtplllmegnsozginzpqh.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const localStorageMock = (function () {
  let store: Record<string, string> = {}
  return {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: string) {
      store[key] = value.toString()
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
})

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(global, 'sessionStorage', {
  value: localStorageMock,
})
