import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function registerPushNotifications(clientId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (!VAPID_PUBLIC_KEY) return false

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const existing = await reg.pushManager.getSubscription()
    const subscription = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const subJson = subscription.toJSON()

    // Upsert subscription — one row per client (overwrite if key changes)
    await supabase.from('push_subscriptions').upsert(
      { client_id: clientId, subscription: subJson },
      { onConflict: 'client_id' }
    )

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

export async function unregisterPushNotifications(clientId) {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    if (clientId) await supabase.from('push_subscriptions').delete().eq('client_id', clientId)
  } catch (err) {
    console.error('Push unsubscribe failed:', err)
  }
}
