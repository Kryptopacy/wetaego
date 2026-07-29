import { create } from 'zustand'
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from './idb'

// Custom IndexedDB storage engine for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export type OfflineActionType = 
  | 'completeOrder' 
  | 'claimOrder' 
  | 'cancelOrder'
  | 'toggleStock' 
  | 'resolveServiceRequest' 
  | 'markOrderPaid'
  | 'sendPaymentLink'

export interface QueuedAction {
  id: string
  type: OfflineActionType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any
  timestamp: number
  retryCount?: number
}

interface OfflineQueueState {
  queue: QueuedAction[]
  enqueueAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => void
  dequeueAction: (id: string) => void
  incrementRetryCount: (id: string) => void
  clearQueue: () => void
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueueAction: (action) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...action,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),
      dequeueAction: (id) =>
        set((state) => ({
          queue: state.queue.filter((a) => a.id !== id),
        })),
      incrementRetryCount: (id) =>
        set((state) => ({
          queue: state.queue.map((a) => 
            a.id === id ? { ...a, retryCount: (a.retryCount || 0) + 1 } : a
          )
        })),
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'ourmenu-offline-queue',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)
