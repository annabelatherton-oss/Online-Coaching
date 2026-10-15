import { supabase } from './supabase'

// A client's calorie target is really the same number in two places: client_plan_assignments
// .calorie_target (what actually sizes their meal plan, shopping list and everyday meals) and
// clients.current_calories (what their own task checklist and profile page read). Every screen
// a coach can change it from — Overview, the Meal Plan tab, check-in responses — calls this so
// both stay identical, regardless of which one they edited it from.
//
// Also the single place a change gets logged to client_calorie_history, so "how long were they on
// how many calories" has one reliable source regardless of which screen made the change — rather
// than guessing from scattered update() calls, some of which wouldn't have known to log it.
export async function writeCalorieTarget({ clientId, assignmentId, value }) {
  const writes = []
  if (clientId) writes.push(supabase.from('clients').update({ current_calories: value }).eq('id', clientId))
  if (assignmentId) writes.push(supabase.from('client_plan_assignments').update({ calorie_target: value }).eq('id', assignmentId))
  await Promise.all(writes)

  if (clientId) {
    const { data: last } = await supabase.from('client_calorie_history')
      .select('calorie_target').eq('client_id', clientId).order('changed_at', { ascending: false }).limit(1).maybeSingle()
    if (last?.calorie_target !== value) {
      await supabase.from('client_calorie_history').insert({ client_id: clientId, calorie_target: value })
    }
  }
}
