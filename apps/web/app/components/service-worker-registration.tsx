'use client'

import { useEffect } from 'react'

/**
 * Registers the OurMenu service worker and requests push notification permission
 * for logged-in business dashboard users.
 *
 * Drop this into the dashboard layout so it only activates for authenticated users.
 * It will not run on the public-facing /m/[slug] pages.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Register the SW
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        console.log('[OurMenu SW] Registered:', registration.scope)

        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            await subscribeToPush(registration)
          }
        } else if (Notification.permission === 'granted') {
          // Already granted — make sure subscription is current
          await subscribeToPush(registration)
        }
      })
      .catch((err) => {
        console.warn('[OurMenu SW] Registration failed:', err)
      })
  }, [])

  return null
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.warn('[OurMenu Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')
      return
    }

    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      // Already subscribed — sync to server in case it changed
      await syncSubscription(existing)
      return
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
    })

    await syncSubscription(subscription)
  } catch (err) {
    console.warn('[OurMenu Push] Subscription failed:', err)
  }
}

async function syncSubscription(subscription: PushSubscription) {
  try {
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceName: getDeviceName(),
      }),
    })
  } catch (err) {
    console.warn('[OurMenu Push] Sync failed:', err)
  }
}

function getDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'Browser'
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
}
