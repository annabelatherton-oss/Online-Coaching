import { supabase } from './supabase'

// A client's calorie target is really the same number in two places: client_plan_assignments
// .calorie_target (what actually sizes their meal plan, shopping list and everyday meals) and
// clients.current_calories (what their own task checklist and profile page read). Every screen
// a coach can change it from — Overview, the Meal Plan tab, check-in responses — calls this so
// both stay identical, regardless of which one they edited it from.
export async function writeCalorieTarget({ clientId, assignmentId, value }) {
  const writes = []
  if (clientId) writes.push(supabase.from('clients').update({ current_calories: value }).eq('id', clientId))
  if (assignmentId) writes.push(supabase.from('client_plan_assignments').update({ calorie_target: value }).eq('id', assignmentId))
  await Promise.all(writes)
}
