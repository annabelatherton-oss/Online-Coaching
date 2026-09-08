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
    allergies,
    dietary_requirements,
    dietary_needs,
    diet,
    meal_preference,
    other_info,
    target_date,
    event_date,
    important_date,
    target_event_name,
    event_name,
    goal_phase,
    phase,
    bulking_cutting_maintaining,
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

  // Exact checkbox wording from the coach's actual Google Form ("Any Allergies?" /
  // "Dietary Requirements" questions) plus the app's own keys (src/lib/allergens.js,
  // src/lib/diets.js) — kept in sync by hand since this edge function is a separate Deno deploy
  // target with no access to src/lib. Includes "seasame" because that's how it's actually spelled
  // on the form.
  const ALLERGEN_ALIASES: Record<string, string[]> = {
    dairy:     ['dairy'],
    gluten:    ['gluten', 'gluten/wheat', 'gluten wheat', 'wheat'],
    nuts:      ['nuts', 'all nuts', 'tree nuts'],
    peanuts:   ['peanuts', 'peanut'],
    shellfish: ['shellfish'],
    fish:      ['fish'],
    eggs:      ['eggs', 'egg'],
    soy:       ['soy', 'soya'],
    sesame:    ['sesame', 'seasame'],
  }
  const DIET_ALIASES: Record<string, string[]> = {
    vegetarian:  ['vegetarian'],
    vegan:       ['vegan'],
    pescatarian: ['pescatarian', 'pescetarian'],
    gluten_free: ['gluten free', 'gluten-free', 'glutenfree'],
    dairy_free:  ['dairy free', 'dairy-free', 'dairyfree'],
  }

  // The form sends a checkbox question as an array or a comma-separated string (e.g. "Peanuts,
  // Gluten/Wheat, Other: kiwi"). Each answer is matched against the known aliases above — an
  // answer that doesn't match anything (like free-text typed into "Other:") is dropped rather
  // than stored as junk, since there's no structured field for an arbitrary allergy.
  function normalizeListField(value: unknown, aliasMap: Record<string, string[]>): string[] {
    if (!value) return []
    const raw = Array.isArray(value) ? value : String(value).split(',')
    const found = new Set<string>()
    for (const item of raw) {
      const v = String(item).trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
      if (!v) continue
      for (const [key, aliases] of Object.entries(aliasMap)) {
        if (aliases.some(a => v === a || v.includes(a))) {
          found.add(key)
          break
        }
      }
    }
    return [...found]
  }

  const allergiesArray = normalizeListField(allergies, ALLERGEN_ALIASES)
  const dietaryRequirementsArray = normalizeListField(
    dietary_requirements ?? dietary_needs ?? diet,
    DIET_ALIASES,
  )

  // Matches the app's own goal_type values (src/lib/calorieSuggestion.js GOAL_LABELS) — same
  // alias-list approach as ALLERGEN_ALIASES/DIET_ALIASES above, so a form label of "Cutting",
  // "Bulking" or "Maintaining" (or close variants) maps onto cut/maintain/bulk.
  const GOAL_PHASE_ALIASES: Record<string, string[]> = {
    cut:      ['cut', 'cutting'],
    maintain: ['maintain', 'maintaining'],
    bulk:     ['bulk', 'bulking'],
  }
  function normalizeGoalPhase(value: unknown): 'cut' | 'maintain' | 'bulk' | null {
    if (typeof value !== 'string') return null
    const v = value.trim().toLowerCase()
    if (!v) return null
    for (const [key, aliases] of Object.entries(GOAL_PHASE_ALIASES)) {
      if (aliases.some(a => v === a || v.includes(a))) return key as 'cut' | 'maintain' | 'bulk'
    }
    return null
  }
  const normalizedGoalPhase = normalizeGoalPhase(goal_phase) ?? normalizeGoalPhase(phase) ?? normalizeGoalPhase(bulking_cutting_maintaining)

  // The form may send a date as ISO (YYYY-MM-DD) or UK format (DD/MM/YYYY) depending on how the
  // middleware passes it through — normalize to ISO for the `date` column. Anything unparseable
  // is dropped rather than stored, since a bad date is worse than no date.
  function normalizeDate(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const v = value.trim()
    if (!v) return null
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
    const uk = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (uk) {
      const [, d, m, y] = uk
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    const parsed = new Date(v)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
  }
  const normalizedTargetDate = normalizeDate(target_date) ?? normalizeDate(event_date) ?? normalizeDate(important_date)
  const normalizedTargetEventName = (target_event_name || event_name || '').trim() || null

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
    // access, training assignments, meal plans, weight history) completely untouched. sex is
    // omitted entirely when this submission didn't have a usable answer (undefined keys are
    // dropped before the request is sent), so a resubmission without a recognised answer can't
    // wipe out a value already recorded.
    await supabase.from('clients').update({
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      height_cm: height_cm ? parseFloat(height_cm) : null,
      goal: goal || null,
      sex: normalizedSex ?? undefined,
      dislikes: dislikesArray,
      allergies: allergiesArray,
      dietary_requirements: dietaryRequirementsArray,
      // Same "don't wipe on a blank resubmission" rule as sex above — a resubmission that
      // doesn't answer these questions shouldn't erase a value already recorded.
      goal_type: normalizedGoalPhase ?? undefined,
      target_date: normalizedTargetDate ?? undefined,
      target_event_name: normalizedTargetEventName ?? undefined,
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
      // Defaults to female unless the form gave a recognised male/female answer — matches the
      // same default applied everywhere else a client's sex is used or displayed.
      sex: normalizedSex ?? 'female',
      activity_level: 'moderate',
      dislikes: dislikesArray,
      allergies: allergiesArray,
      dietary_requirements: dietaryRequirementsArray,
      goal_type: normalizedGoalPhase,
      target_date: normalizedTargetDate,
      target_event_name: normalizedTargetEventName,
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
