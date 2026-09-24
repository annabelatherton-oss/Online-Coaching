import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Permanently deletes a client's login (auth.users), not just their coaching data — the regular
// "Delete" button on the Clients list only removes the `clients` row (and everything that
// cascades from it: meal plans, check-ins, weight history, etc), deliberately leaving their login
// intact per its own confirmation text. This is the stronger "delete them fully" option: it
// deletes the auth.users row, which cascades (auth.users -> profiles -> clients -> everything
// else, each on delete cascade) and removes all of it in one step, including the login itself, so
// there is no way back for this client short of signing up fresh. Needs the service-role auth
// admin API, so it has to run server-side rather than from the browser.

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

  let body: { clientId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  const { clientId } = body
  if (!clientId) {
    return json({ error: 'clientId is required' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Only this client's own coach may delete their account.
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, coach_id, profile_id')
    .eq('id', clientId)
    .maybeSingle()
  if (clientError || !client || client.coach_id !== user.id) {
    return json({ error: 'Not found' }, 404)
  }

  if (client.profile_id) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(client.profile_id)
    if (deleteError) {
      return json({ error: deleteError.message }, 500)
    }
  } else {
    // No linked login at all — just remove the client record itself directly.
    await supabase.from('clients').delete().eq('id', clientId)
  }

  return json({ ok: true })
})
