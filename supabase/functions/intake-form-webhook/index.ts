import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const WEBHOOK_SECRET = Deno.env.get('INTAKE_WEBHOOK_SECRET') ?? ''
const COACH_PROFILE_ID = Deno.env.get('COACH_PROFILE_ID') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app-url.com'

// deno-lint-ignore-file no-explicit-any

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Validate webhook secret
  const token = req.headers.get('x-webhook-token') ?? ''
  if (!WEBHOOK_SECRET || token !== WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const {
    email,
    full_name,
    phone,
    date_of_birth,
    height_cm,
    weight_kg,
    goal,
    gender,
    sex,
    motivators,
    barriers,
    health_history,
    plan_interest,
    current_diet,
    current_training,
    cardio_preferences,
    food_preferences,
    dislikes,
    meal_preference,
    other_info,
  } = body

  // The intake form's gender question may come through as "gender" or "sex", and as
  // "Male"/"Female", "M"/"F", etc. — normalize to the app's own male/female value.
  function normalizeSex(value: unknown): 'male' | 'female' | null {
    if (typeof value !== 'string') return null
    const v = value.trim().toLowerCase()
    if (['male', 'm', 'man'].includes(v)) return 'male'
    if (['female', 'f', 'woman'].includes(v)) return 'female'
    return null
  }
  const normalizedSex = normalizeSex(gender) ?? normalizeSex(sex)

  if (!email || !full_name) {
    return new Response(JSON.stringify({ error: 'email and full_name are required' }), { status: 400 })
  }

  if (!COACH_PROFILE_ID) {
    return new Response(JSON.stringify({ error: 'COACH_PROFILE_ID env var not configured' }), { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Check if a profile with this email already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    // Existing user — update their name, don't re-invite
    userId = existingProfile.id
    await supabase.from('profiles').update({ full_name }).eq('id', userId)
  } else {
    // New user — send magic link invite
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email.toLowerCase().trim(),
      {
        data: { full_name, role: 'client' },
        redirectTo: `${APP_URL}/set-password`,
      },
    )
    if (inviteError || !inviteData?.user) {
      console.error('Invite error:', inviteError)
      return new Response(JSON.stringify({ error: inviteError?.message ?? 'Failed to create user' }), { status: 500 })
    }
    userId = inviteData.user.id
    // Ensure profile row exists with correct role
    await supabase.from('profiles').upsert(
      { id: userId, full_name, email: email.toLowerCase().trim(), role: 'client' },
      { onConflict: 'id' },
    )
  }

  // Build intake_form JSONB — all narrative form answers
  const intakeForm = {
    motivators: motivators || null,
    barriers: barriers || null,
    health_history: health_history || null,
    plan_interest: plan_interest || null,
    current_diet: current_diet || null,
    current_training: current_training || null,
    cardio_preferences: cardio_preferences || null,
    food_preferences: food_preferences || null,
    meal_preference: meal_preference || null,
    other_info: other_info || null,
  }

  const dislikesArray: string[] = dislikes
    ? dislikes.split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  // Check if client record already exists
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()

  if (existingClient) {
    // Re-submission: update intake fields only — leave coach-set fields (calories, macros,
    // access, training assignments, meal plans, weight history) completely untouched
    await supabase.from('clients').update({
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      height_cm: height_cm ? parseFloat(height_cm) : null,
      goal: goal || null,
      sex: normalizedSex,
      dislikes: dislikesArray,
      intake_form: intakeForm,
    }).eq('id', existingClient.id)

    // Add a new weight entry for the re-submission (records their current weight)
    if (weight_kg) {
      await supabase.from('weight_entries').insert({
        client_id: existingClient.id,
        weight_kg: parseFloat(weight_kg),
        recorded_at: new Date().toISOString().split('T')[0],
      })
    }
  } else {
    // New client record
    const { data: newClient, error: clientErr } = await supabase.from('clients').insert({
      profile_id: userId,
      coach_id: COACH_PROFILE_ID,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      height_cm: height_cm ? parseFloat(height_cm) : null,
      goal: goal || null,
      sex: normalizedSex,
      activity_level: 'moderate',
      dislikes: dislikesArray,
      intake_form: intakeForm,
      start_date: new Date().toISOString().split('T')[0],
      access_weeks: 12,
    }).select('id').single()

    if (clientErr) {
      console.error('Client insert error:', clientErr)
      return new Response(JSON.stringify({ error: clientErr.message }), { status: 500 })
    }

    // Log starting weight
    if (newClient && weight_kg) {
      await supabase.from('weight_entries').insert({
        client_id: newClient.id,
        weight_kg: parseFloat(weight_kg),
        recorded_at: new Date().toISOString().split('T')[0],
      })
    }
  }

  console.log(`Intake form processed for ${email} (${existingProfile ? 'existing' : 'new'} user)`)

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
