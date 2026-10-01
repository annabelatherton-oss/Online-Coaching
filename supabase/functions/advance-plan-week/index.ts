import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// deno-lint-ignore-file no-explicit-any

// Advances every plan group's "current week" pointer by one, once a week, so a coach never has to
// remember to click the arrow in the Plan Group editor. This is purely the shared default that a
// check-in response or the Meal Plan tab proposes next — clients never see anything different
// until the coach actually delivers to them, so moving this pointer ahead of the weekend's check-ins
// coming in is exactly the point, not a risk.
//
// Deliberately does NOT touch plan_week_sends — that's what drives a week's "approved"/locked
// state (see the Approve button in PlanGroupEditor.jsx), and approval is a judgment call only the
// coach can make once they're happy with a week's combination for a tier. It must never happen
// automatically just because the calendar moved on, or a week the coach hasn't actually reviewed
// yet would show as approved.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: groups, error: groupsErr } = await supabase.from('plan_groups').select('id, current_week')
  if (groupsErr) {
    return new Response(JSON.stringify({ error: groupsErr.message }), { status: 500 })
  }

  const results: any[] = []

  for (const group of (groups ?? [])) {
    const outgoingWeek = group.current_week
    if (outgoingWeek == null) { results.push({ group: group.id, skipped: 'no current_week' }); continue }

    const { data: standardWeeks } = await supabase
      .from('weekly_templates').select('week_number').eq('plan_group_id', group.id).is('calorie_tier', null)

    const maxWeek = (standardWeeks ?? []).reduce((max, w) => Math.max(max, w.week_number), 0)
    if (maxWeek === 0) { results.push({ group: group.id, skipped: 'no weeks built yet' }); continue }
    const nextWeek = outgoingWeek < maxWeek ? outgoingWeek + 1 : 1

    const { error: updateErr } = await supabase.from('plan_groups').update({ current_week: nextWeek }).eq('id', group.id)
    results.push(updateErr ? { group: group.id, error: updateErr.message } : { group: group.id, from: outgoingWeek, to: nextWeek })
  }

  console.log(`Advanced ${results.filter(r => r.to).length}/${results.length} plan groups`)

  return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } })
})
