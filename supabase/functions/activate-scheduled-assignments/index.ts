import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// deno-lint-ignore-file no-explicit-any

// Daily maintenance job (cron-fired, not called from any browser): activates any meal-plan /
// training-block assignment a coach scheduled to start on a specific future Monday (see the
// "Schedule a future Monday" option on the Meal Plan and Training tabs' assign forms) once that
// date has arrived, deactivating whatever was active for that client immediately before it. This
// is what actually makes a block coaches prepared in advance go live on the day, without them
// having to do anything at the time.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function restKind(label: string): 'active_rest' | 'rest' | null {
  const l = (label || '').trim().toLowerCase()
  if (l === 'active rest' || l === 'active rest day') return 'active_rest'
  if (l === 'rest' || l === 'rest day') return 'rest'
  return null
}

// Ports populateWeeklySchedule from CoachClientProfile.jsx's TrainingTab — same logic, run here
// instead of at assign time since a scheduled block's weekly schedule shouldn't touch the
// client's live one until it actually goes live.
async function populateWeeklySchedule(supabase: any, clientId: string, coachId: string, programId: string) {
  await supabase.from('client_schedule_items').delete().eq('client_id', clientId).eq('item_type', 'workout')
  const { data: sessions } = await supabase
    .from('training_sessions').select('id, name, workout_id')
    .eq('program_id', programId).eq('week_number', 1)

  const seenDays = new Set<string>()
  const toInsert: Record<string, unknown>[] = []
  const restDays: string[] = []
  for (const s of (sessions || [])) {
    const day = WEEK_DAYS.find(d => s.name === d || s.name.startsWith(d + ' ') || s.name.startsWith(d + '—') || s.name.startsWith(d + ' —'))
    if (!day || seenDays.has(day)) continue
    seenDays.add(day)
    const label = s.name === day ? day : s.name.slice(day.length).replace(/^[\s–—-]+/, '').trim() || day
    const kind = restKind(label)
    if (kind) {
      restDays.push(day)
      toInsert.push({ client_id: clientId, coach_id: coachId, day_of_week: day, item_type: 'rest', custom_label: kind === 'active_rest' ? 'Active Rest Day' : 'Rest Day', order_index: 0 })
    } else {
      toInsert.push({ client_id: clientId, coach_id: coachId, day_of_week: day, item_type: 'workout', workout_id: s.workout_id || null, custom_label: label, order_index: 0 })
    }
  }
  if (restDays.length > 0) {
    await supabase.from('client_schedule_items').delete().eq('client_id', clientId).eq('item_type', 'rest').in('day_of_week', restDays)
  }
  if (toInsert.length > 0) await supabase.from('client_schedule_items').insert(toInsert)
}

async function activateDue(
  supabase: any,
  table: string,
  extraOnActivate: Record<string, unknown>,
  onActivated?: (row: any) => Promise<void>,
) {
  const today = new Date().toISOString().split('T')[0]

  // scheduled_start=true is the only thing that marks a row as "not yet activated but meant to
  // be" — an ordinary already-replaced assignment is also active=false with a past start_date,
  // but was never marked scheduled_start, so it's never touched here.
  const { data: due } = await supabase
    .from(table)
    .select('*')
    .eq('active', false)
    .eq('scheduled_start', true)
    .lte('start_date', today)
    .order('start_date', { ascending: false })

  if (!due || due.length === 0) return 0

  // In the unlikely case a client has more than one scheduled row due at once, only the latest
  // (by start_date) one actually goes live — the rest are left as-is rather than guessed at.
  const latestByClient = new Map<string, any>()
  for (const row of due) {
    if (!latestByClient.has(row.client_id)) latestByClient.set(row.client_id, row)
  }

  let activated = 0
  for (const [clientId, row] of latestByClient) {
    await supabase.from(table).update({ active: false, ...extraOnActivate }).eq('client_id', clientId).eq('active', true)
    await supabase.from(table).update({ active: true, scheduled_start: false }).eq('id', row.id)
    if (onActivated) await onActivated(row)
    activated++
  }
  return activated
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const plansActivated = await activateDue(supabase, 'client_plan_assignments', { ended_at: new Date().toISOString() }, async row => {
    // Mirrors what the coach's own "Assign Plan" button does immediately for a same-day
    // assignment — keeps clients.current_calories (read directly in a few places, e.g. the
    // Overview tab) in sync with the plan that's now actually live.
    if (row.calorie_target) {
      await supabase.from('clients').update({ current_calories: row.calorie_target }).eq('id', row.client_id)
    }
  })
  const trainingActivated = await activateDue(supabase, 'client_training_assignments', {}, async row => {
    await populateWeeklySchedule(supabase, row.client_id, row.coach_id, row.program_id)
  })

  return new Response(JSON.stringify({ ok: true, plansActivated, trainingActivated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
