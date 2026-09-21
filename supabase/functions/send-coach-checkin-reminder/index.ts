import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// deno-lint-ignore-file no-explicit-any

// Sends the coach their own Friday 7am "check-ins are due" push reminder — a separate
// notification from send-checkin-reminders, which nudges CLIENTS to submit their check-in.
// Same VAPID/web-push mechanics as that function; kept as its own function since the
// audience (push_subscriptions.coach_id, not client_id), message and schedule all differ.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '' // base64url raw private key (JWK d)
const VAPID_PRIVATE_KEY_X = Deno.env.get('VAPID_PUBLIC_KEY_X') ?? '' // base64url x from public key
const VAPID_PRIVATE_KEY_Y = Deno.env.get('VAPID_PUBLIC_KEY_Y') ?? '' // base64url y from public key
const VAPID_SUBJECT = 'mailto:annabelatherton@gmail.com'

// ─── VAPID helpers (identical to send-checkin-reminders) ───────────────────────

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

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      TTL: '86400',
      Urgency: 'normal',
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

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('coach_id, subscription')
    .not('coach_id', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = await Promise.all(
    (subscriptions ?? []).map(async row => {
      try {
        const result = await sendPush(row.subscription)
        // 410 Gone = subscription expired; clean it up
        if (result.status === 410) {
          await supabase.from('push_subscriptions').delete().eq('coach_id', row.coach_id)
        }
        return { coach_id: row.coach_id, ...result }
      } catch (err: any) {
        return { coach_id: row.coach_id, status: 0, ok: false, error: err.message }
      }
    })
  )

  const sent = results.filter(r => r.ok).length
  console.log(`Sent ${sent}/${results.length} coach push notifications`)

  return new Response(JSON.stringify({ sent, total: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
