import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendPush, vapidKeysConfigured } from '../_shared/webpush.ts'

// Called by a client's own browser (ClientMealPlan.jsx) right after they save a week with an
// active meal swap — pushes the coach a heads-up to go check the swap's quantities/macros. The
// coach to notify is looked up server-side from the CALLER's own client row rather than taken as
// input, so there's nothing a client request could spoof to reach a coach that isn't theirs.

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

  let body: { weekNumber?: number }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const [{ data: client }, { data: callerProfile }] = await Promise.all([
    supabase.from('clients').select('id, coach_id').eq('profile_id', user.id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ])
  if (!client?.coach_id) {
    return new Response(JSON.stringify({ error: 'No linked coach found for this account' }), { status: 404 })
  }

  const { data: subRow } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('coach_id', client.coach_id)
    .maybeSingle()

  if (!subRow) {
    return new Response(JSON.stringify({ sent: false, reason: 'not_subscribed' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const clientName = callerProfile?.full_name || 'A client'
  const weekText = body.weekNumber ? ` (week ${body.weekNumber})` : ''

  try {
    const result = await sendPush(subRow.subscription, {
      title: 'Meal swapped',
      body: `${clientName} swapped a meal for this week${weekText} — check the quantities.`,
      url: `/coach/clients/${client.id}?tab=${encodeURIComponent('Meal Plan')}`,
    })
    if (result.status === 410) {
      await supabase.from('push_subscriptions').delete().eq('coach_id', client.coach_id)
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
