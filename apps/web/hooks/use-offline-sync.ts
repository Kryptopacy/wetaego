import { useEffect, useState, useCallback } from 'react'
import { useOfflineQueueStore, QueuedAction } from '@/lib/stores/offline-queue-store'
import { toast } from 'sonner'

export function useOfflineSync(onSyncAction: (action: QueuedAction) => Promise<boolean>) {
  const [isOnline, setIsOnline] = useState(true)
  const { queue, enqueueAction, dequeueAction } = useOfflineQueueStore()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored! Syncing offline actions...')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline. Actions will be saved and synced later.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Background sync processor
  useEffect(() => {
    if (!isOnline || queue.length === 0) return

    let isSyncing = false

    const processQueue = async () => {
      if (isSyncing) return
      isSyncing = true

      // Create a copy of the queue so we don't mutate during iteration
      const currentQueue = [...queue]

      for (const action of currentQueue) {
        try {
          const success = await onSyncAction(action)
          if (success) {
            dequeueAction(action.id)
          } else {
            // Stop processing if an action fails (to maintain chronological order)
            console.error('Failed to sync action', action)
            break
          }
        } catch (error) {
          console.error('Sync error', error)
          break
        }
      }

      isSyncing = false
    }

    processQueue()
  }, [isOnline, queue, onSyncAction, dequeueAction])

  const executeOrQueue = useCallback(
    async (
      action: Omit<QueuedAction, 'id' | 'timestamp'>,
      optimisticCallback: () => void,
      serverActionCallback: () => Promise<boolean>
    ) => {
      // 1. Optimistic update immediately
      optimisticCallback()

      // 2. If offline, queue it
      if (!navigator.onLine) {
        enqueueAction(action)
        return
      }

      // 3. If online, try server action
      try {
        const success = await serverActionCallback()
        if (!success) {
          throw new Error('Server action failed')
        }
      } catch (error) {
        console.warn('Action failed while online, queueing as offline fallback', error)
        enqueueAction(action)
      }
    },
    [enqueueAction]
  )

  return { isOnline, pendingCount: queue.length, executeOrQueue }
}
