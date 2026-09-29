import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// deno-lint-ignore-file no-explicit-any

// Advances every plan group's "current week" pointer by one, once a week, so a coach never has to
// remember to click the arrow in the Plan Group editor — the shared rotation just keeps moving on
// its own. Mirrors updateCurrentWeek() in src/pages/coach/PlanGroupEditor.jsx exactly: before
// moving the pointer forward, it snapshots the outgoing week's meal combination into
// plan_week_sends for every calorie tier that currently has an active client on this plan, which is
// what the "Unchanged since sent" / "Edited since sent" badges compare future edits against.
// Never touches a client's own week_override — a client deliberately pinned to a specific week
// keeps ignoring the shared pointer, exactly as a manual advance would too.

const SLOT_TYPES = ['breakfast1', 'breakfast2', 'lunch1', 'lunch2', 'dinner1', 'dinner2', 'preworkout', 'evening_snack']

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

    const [{ data: standardWeeks }, { data: activeAssignments }] = await Promise.all([
      supabase.from('weekly_templates').select('week_number').eq('plan_group_id', group.id).is('calorie_tier', null),
      supabase.from('client_plan_assignments').select('calorie_target').eq('plan_group_id', group.id).eq('active', true),
    ])

    const maxWeek = (standardWeeks ?? []).reduce((max, w) => Math.max(max, w.week_number), 0)
    if (maxWeek === 0) { results.push({ group: group.id, skipped: 'no weeks built yet' }); continue }
    const nextWeek = outgoingWeek < maxWeek ? outgoingWeek + 1 : 1

    const tiers = [...new Set((activeAssignments ?? []).map(a => a.calorie_target).filter((t): t is number => t != null))]

    if (tiers.length > 0) {
      const { data: tierTemplates } = await supabase
        .from('weekly_templates')
        .select('calorie_tier, template_meal_slots(slot_type, meal_id)')
        .eq('plan_group_id', group.id)
        .eq('week_number', outgoingWeek)
        .in('calorie_tier', tiers)

      const rows = (tierTemplates ?? []).map(t => {
        const slots: Record<string, string | null> = {}
        for (const s of (t.template_meal_slots ?? [])) slots[s.slot_type] = s.meal_id
        const combination = Object.fromEntries(SLOT_TYPES.map(key => [key, slots[key] ?? null]))
        return { plan_group_id: group.id, calorie_tier: t.calorie_tier, week_number: outgoingWeek, meal_combination: combination }
      })

      if (rows.length > 0) {
        const { error: upsertErr } = await supabase.from('plan_week_sends')
          .upsert(rows, { onConflict: 'plan_group_id,calorie_tier,week_number' })
        if (upsertErr) { results.push({ group: group.id, error: upsertErr.message }); continue }
      }
    }

    const { error: updateErr } = await supabase.from('plan_groups').update({ current_week: nextWeek }).eq('id', group.id)
    results.push(updateErr ? { group: group.id, error: updateErr.message } : { group: group.id, from: outgoingWeek, to: nextWeek })
  }

  console.log(`Advanced ${results.filter(r => r.to).length}/${results.length} plan groups`)

  return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } })
})
