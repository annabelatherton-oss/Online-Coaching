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

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: authError } = await authed.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  let body: { clientId?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }
  const { clientId, newPassword } = body
  if (!clientId || !newPassword || newPassword.length < 6) {
    return new Response(JSON.stringify({ error: 'clientId and a newPassword of at least 6 characters are required' }), { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Only this client's own coach may reset their password.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, coach_id, profile_id')
    .eq('id', clientId)
    .maybeSingle()
  if (clientError || !client || client.coach_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }
  if (!client.profile_id) {
    return new Response(JSON.stringify({ error: 'This client has no linked login yet' }), { status: 400 })
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(client.profile_id, {
    password: newPassword,
    email_confirm: true, // this IS the account being verified — no confirmation email needed
  })
  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
})
