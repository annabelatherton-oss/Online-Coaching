import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

// Pass exactly one of { clientId } or { coachId } — push_subscriptions has one row per
// owner, keyed by whichever id is set (see coach-push-subscriptions-migration.sql). Each role
// registers its own service worker at its own scope (/client/ or /coach/) rather than sharing
// one — the app doesn't implement encrypted Web Push payloads, so every push arrives with no
// data, and a separate SW per scope is what lets each role's default notification text/link
// differ (see public/sw.js vs public/coach-sw.js) without that encryption.
export async function registerPushNotifications({ clientId, coachId } = {}) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (!VAPID_PUBLIC_KEY) return false

  try {
    const reg = coachId
      ? await navigator.serviceWorker.register('/coach-sw.js', { scope: '/coach/' })
      : await navigator.serviceWorker.register('/sw.js', { scope: '/client/' })
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const existing = await reg.pushManager.getSubscription()
    const subscription = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const subJson = subscription.toJSON()

    // Upsert subscription — one row per owner (overwrite if key changes)
    const row = coachId ? { coach_id: coachId, subscription: subJson } : { client_id: clientId, subscription: subJson }
    await supabase.from('push_subscriptions').upsert(row, { onConflict: coachId ? 'coach_id' : 'client_id' })

    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}

export async function unregisterPushNotifications({ clientId, coachId } = {}) {
  try {
    const reg = await navigator.serviceWorker.getRegistration(coachId ? '/coach/' : '/client/')
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    if (coachId) await supabase.from('push_subscriptions').delete().eq('coach_id', coachId)
    else if (clientId) await supabase.from('push_subscriptions').delete().eq('client_id', clientId)
  } catch (err) {
    console.error('Push unsubscribe failed:', err)
  }
}

// One-off push straight from the coach to one client (e.g. "your meal plan changed"), unlike the
// two scheduled Friday reminders — those send no payload at all and rely on a fixed notification
// baked into the service worker, but a coach-authored message needs its own real text/link to
// reach the device, so the send-client-notification Edge Function encrypts a proper Web Push
// payload for this one (see supabase/functions/_shared/webpush.ts). Returns why nothing was sent
// (e.g. the client has never turned push on) so the caller can show a clear message instead of a
// silent no-op.
export async function notifyClient({ clientId, title, body, url }) {
  const { data, error } = await supabase.functions.invoke('send-client-notification', {
    body: { clientId, title, body, url },
  })
  if (error) return { sent: false, reason: error.message }
  return data
}
