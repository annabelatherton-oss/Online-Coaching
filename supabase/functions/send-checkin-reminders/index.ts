import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// deno-lint-ignore-file no-explicit-any

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '' // base64url raw private key (JWK d)
const VAPID_PRIVATE_KEY_X = Deno.env.get('VAPID_PUBLIC_KEY_X') ?? '' // base64url x from public key
const VAPID_PRIVATE_KEY_Y = Deno.env.get('VAPID_PUBLIC_KEY_Y') ?? '' // base64url y from public key
const VAPID_SUBJECT = 'mailto:annabelatherton@gmail.com'

// ─── VAPID helpers ─────────────────────────────────────────────────────────────

function toB64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function strToB64url(str: string): string {
  return toB64url(new TextEncoder().encode(str))
}

async function createVapidJWT(audience: string): Promise<string> {
  const header = strToB64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))
  const payload = strToB64url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200, // 12 hours
    sub: VAPID_SUBJECT,
  }))
  const signingInput = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: VAPID_PRIVATE_KEY, x: VAPID_PRIVATE_KEY_X, y: VAPID_PRIVATE_KEY_Y },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  )

  return `${signingInput}.${toB64url(sig)}`
}

async function sendPush(sub: any): Promise<{ status: number; ok: boolean }> {
  const endpoint: string = sub.endpoint
  const origin = new URL(endpoint)
  const audience = `${origin.protocol}//${origin.host}`
  const jwt = await createVapidJWT(audience)

  const notification = JSON.stringify({
    title: 'Weekly Check-in',
    body: "It's Friday — time to log your check-in! 💪",
    url: '/client/checkin',
  })

  // Encrypt payload using ece (RFC 8291)
  // For simplicity, send without payload — service worker shows fixed notification
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      TTL: '86400',
      Urgency: 'normal',
      // Sending the notification as plain text via content-type
      // NOTE: For encrypted payloads, use ece. Here we skip encryption by omitting body.
    },
  })

  return { status: res.status, ok: res.ok }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: allSubscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('client_id, subscription')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  // Skip anyone who doesn't yet have a full week's grace since their first
  // plan was assigned — a client onboarded this week shouldn't be nagged to
  // check in before they've had a chance to follow the plan for a week.
  const clientIds = (allSubscriptions ?? []).map(row => row.client_id)
  const { data: assignments } = clientIds.length
    ? await supabase
        .from('client_plan_assignments')
        .select('client_id, created_at')
        .in('client_id', clientIds)
    : { data: [] }

  const firstPlanAt: Record<string, number> = {}
  ;(assignments ?? []).forEach(a => {
    const t = new Date(a.created_at).getTime()
    if (!(a.client_id in firstPlanAt) || t < firstPlanAt[a.client_id]) firstPlanAt[a.client_id] = t
  })

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const subscriptions = (allSubscriptions ?? []).filter(row => {
    const first = firstPlanAt[row.client_id]
    return first != null && first <= oneWeekAgo
  })

  const results = await Promise.all(
    (subscriptions ?? []).map(async row => {
      try {
        const result = await sendPush(row.subscription)
        // 410 Gone = subscription expired; clean it up
        if (result.status === 410) {
          await supabase.from('push_subscriptions').delete().eq('client_id', row.client_id)
        }
        return { client_id: row.client_id, ...result }
      } catch (err: any) {
        return { client_id: row.client_id, status: 0, ok: false, error: err.message }
      }
    })
  )

  const sent = results.filter(r => r.ok).length
  console.log(`Sent ${sent}/${results.length} push notifications`)

  return new Response(JSON.stringify({ sent, total: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
