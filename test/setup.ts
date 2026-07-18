import '@testing-library/jest-dom'
import { vi } from 'vitest'

process.env.RESEND_API_KEY = 're_test_key_123'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xtplllmegnsozginzpqh.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
    setAll: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Mock idb-keyval
vi.mock('idb-keyval', () => {
  const store = new Map()
  return {
    get: vi.fn((key) => Promise.resolve(store.get(key))),
    set: vi.fn((key, val) => Promise.resolve(store.set(key, val))),
    del: vi.fn((key) => Promise.resolve(store.delete(key))),
    clear: vi.fn(() => Promise.resolve(store.clear())),
    keys: vi.fn(() => Promise.resolve(Array.from(store.keys()))),
  }
})

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
