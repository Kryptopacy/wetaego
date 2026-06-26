// A lightweight, zero-dependency IndexedDB wrapper based on idb-keyval
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ourmenu-keyval-store', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('keyval')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function get<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keyval', 'readonly')
    const store = tx.objectStore('keyval')
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function set(key: string, value: any): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keyval', 'readwrite')
    const store = tx.objectStore('keyval')
    const request = store.put(value, key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function del(key: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keyval', 'readwrite')
    const store = tx.objectStore('keyval')
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
