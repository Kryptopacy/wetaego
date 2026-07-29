import { useEffect, useState, useCallback, useRef } from 'react'
import { useOfflineQueueStore, QueuedAction } from '@/lib/stores/offline-queue-store'
import { toast } from 'sonner'

export interface SyncResult {
  success: boolean;
  retryable?: boolean;
}

const MAX_RETRIES = 5;

export function useOfflineSync(onSyncAction: (action: QueuedAction) => Promise<SyncResult>) {
  const [isOnline, setIsOnline] = useState(true)
  const { queue, enqueueAction, dequeueAction, incrementRetryCount } = useOfflineQueueStore()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Only show success toast if we have things to sync, otherwise it's spammy on flaky connections
      if (useOfflineQueueStore.getState().queue.length > 0) {
        toast.success('Connection restored! Syncing offline actions...')
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      // Only show warning if we didn't just show it recently to avoid spam
      if (!sessionStorage.getItem('offline_warning_shown')) {
        toast.warning('You are offline. Actions will be saved and synced later.')
        sessionStorage.setItem('offline_warning_shown', 'true')
        setTimeout(() => sessionStorage.removeItem('offline_warning_shown'), 10000)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const isSyncing = useRef(false)

  // Background sync processor
  useEffect(() => {
    if (!isOnline || queue.length === 0) return

    const processQueue = async () => {
      if (isSyncing.current) return
      isSyncing.current = true

      // Create a copy of the queue so we don't mutate during iteration
      const currentQueue = [...queue]

      for (const action of currentQueue) {
        try {
          const retries = action.retryCount || 0
          
          // Exponential backoff wait (if it's not the first try)
          if (retries > 0) {
             const waitTime = Math.pow(2, retries - 1) * 1000;
             await new Promise(r => setTimeout(r, waitTime));
          }
          
          const result = await onSyncAction(action)
          if (result.success) {
            dequeueAction(action.id)
          } else {
            // Failed to sync
            if (result.retryable === false || retries >= MAX_RETRIES) {
              // Permanent failure or max retries reached
              console.error('Action failed permanently or exceeded max retries', action)
              dequeueAction(action.id)
              toast.error('An offline action failed to sync permanently.')
            } else {
              // Transient failure, increment retry and stop processing queue to preserve order
              console.warn(`Action failed, retrying later (attempt ${retries + 1}/${MAX_RETRIES})`, action)
              incrementRetryCount(action.id)
              break
            }
          }
        } catch (error) {
          console.error('Sync error exception', error)
          const retries = action.retryCount || 0
          if (retries >= MAX_RETRIES) {
             dequeueAction(action.id)
             toast.error('An offline action failed to sync after multiple attempts.')
          } else {
             incrementRetryCount(action.id)
             break
          }
        }
      }

      isSyncing.current = false
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
           // We assume serverActionCallback returns false only for network/transient failures.
           // If it was a permanent validation failure, it should have been handled or returned as success=false with no queueing intended.
           // To be safe, if we get a false without throwing, we queue it as fallback.
           throw new Error('Server action failed')
        }
      } catch (error: any) {
        // Only queue if it's likely a network error. 
        // If it's a known validation error we should probably throw it back, but our current pattern queues it.
        console.warn('Action failed while online, queueing as offline fallback', error)
        enqueueAction(action)
      }
    },
    [enqueueAction]
  )

  return { isOnline, pendingCount: queue.length, executeOrQueue }
}
