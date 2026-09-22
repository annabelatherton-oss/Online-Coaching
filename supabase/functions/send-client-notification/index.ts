import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPush, vapidKeysConfigured } from '../_shared/webpush.ts'

// A coach clicking "Notify client" (see CoachClientProfile.jsx's Meal Plan / Everyday Meals
// tabs) hits this directly from the browser — unlike the cron-fired reminder functions, this one
// has to check the caller is actually that client's own coach before sending anything on their
// behalf, since the service-role client below bypasses RLS entirely.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  if (!vapidKeysConfigured()) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: authError } = await authed.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  let body: { clientId?: string; title?: string; body?: string; url?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }
  const { clientId, title, body: messageBody, url } = body
  if (!clientId || !title || !messageBody) {
    return new Response(JSON.stringify({ error: 'clientId, title and body are required' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Only this client's own coach may notify them.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, coach_id')
    .eq('id', clientId)
    .maybeSingle()
  if (clientError || !client || client.coach_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  const { data: subRow } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('client_id', clientId)
    .maybeSingle()

  if (!subRow) {
    return new Response(JSON.stringify({ sent: false, reason: 'not_subscribed' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await sendPush(subRow.subscription, { title, body: messageBody, url: url || '/client/meals' })
    if (result.status === 410) {
      await supabase.from('push_subscriptions').delete().eq('client_id', clientId)
      return new Response(JSON.stringify({ sent: false, reason: 'subscription_expired' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ sent: result.ok, status: result.status }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ sent: false, error: (err as Error).message }), { status: 500 })
  }
})
