'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        Promise.resolve().then(() => Promise.resolve().then(() => setStoredValue(JSON.parse(item))))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isHydrated] as const
}
