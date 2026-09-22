import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Lets a coach set a client's password directly, bypassing email entirely — added because
// Supabase's built-in auth email (magic links / signup confirmation) is rate-limited and
// unreliable on the default provider with no custom SMTP configured, and a client who never
// receives that email has no other way in. This is the one place in the app that needs the
// service-role key's auth.admin API, so it has to run server-side rather than from the browser
// (the anon-key "supabaseAdmin" client in src/lib/supabase.js deliberately can't do this).

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Called directly from the coach's browser via supabase.functions.invoke — unlike every
// cron-fired function in this project, a browser call sends a CORS preflight (OPTIONS) request
// first, and the browser silently treats the whole call as failed if the response doesn't carry
// these headers. Every response below (including the OPTIONS one) needs them.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: authError } = await authed.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Not authenticated' }, 401)
  }

  let body: { clientId?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { clientId, newPassword } = body
  if (!clientId || !newPassword || newPassword.length < 6) {
    return json({ error: 'clientId and a newPassword of at least 6 characters are required' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Only this client's own coach may reset their password.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, coach_id, profile_id')
    .eq('id', clientId)
    .maybeSingle()
  if (clientError || !client || client.coach_id !== user.id) {
    return json({ error: 'Not found' }, 404)
  }
  if (!client.profile_id) {
    return json({ error: 'This client has no linked login yet' }, 400)
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(client.profile_id, {
    password: newPassword,
    email_confirm: true, // this IS the account being verified — no confirmation email needed
  })
  if (updateError) {
    return json({ error: updateError.message }, 500)
  }

  return json({ ok: true })
})
