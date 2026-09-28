import { supabase } from './supabase'
import { CALORIE_TIERS } from './calorieTiers'
import { mealMacrosLayered, mealMacros, getIngredientsLayered, getIngredients, sumIngredientMacros } from '../components/MealPlanView'
import { normalizeGoalMacroSplits, calcBodyweightMacros } from './macros'

// Option A/B pull from the client's actual assigned weekly plan (client_week_meals layered over
// weekly_templates), same source ClientMealPlan.jsx reads — this is a read-only summary (name +
// macros only, no ingredient list), so it skips everything there that's only needed for live
// editing (dislike-swap resolution, ingredient library, swap context).
const OPTION_A_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', slotType: 'breakfast1' },
  { key: 'lunch',     label: 'Lunch',     slotType: 'lunch1' },
  { key: 'dinner',    label: 'Dinner',    slotType: 'dinner1' },
]
const OPTION_B_SLOTS = [
  { key: 'breakfast', label: 'Breakfast', slotType: 'breakfast2' },
  { key: 'lunch',     label: 'Lunch',     slotType: 'lunch2' },
  { key: 'dinner',    label: 'Dinner',    slotType: 'dinner2' },
]
// Everyday pulls from the client's own fixed client_everyday_meals picks instead — a separate,
// standing choice per slot (see EverydayMealsClient.jsx), not part of the weekly plan at all.
const EVERYDAY_SLOTS = [
  { key: 'breakfast',      label: 'Breakfast',     slotType: 'breakfast1' },
  { key: 'lunch',          label: 'Lunch',         slotType: 'lunch1' },
  { key: 'preworkout',     label: 'Pre-workout',   slotType: 'preworkout' },
  { key: 'dinner',         label: 'Dinner',        slotType: 'dinner1' },
  { key: 'evening_snack',  label: 'Evening snack', slotType: 'evening_snack' },
]

/**
 * Loads everything needed to show a client "what does Option A / Option B / Everyday actually
 * look like today" — each as a flat list of { key, label, name, macros }, plus their calorie/macro
 * target. Returns null if the client has no active plan assignment yet.
 */
export async function loadDailyMealOptions(clientId) {
  const { data: clientRow } = await supabase.from('clients').select('id, coach_id, goal_type').eq('id', clientId).single()
  if (!clientRow) return null

  const { data: asgn } = await supabase.from('client_plan_assignments')
    .select('*').eq('client_id', clientId).eq('active', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!asgn) return null

  const [{ data: pg }, { data: coachProfile }, { data: weightRows }, { data: checkinRows }, { data: everydayRows }, { data: libData }] = await Promise.all([
    supabase.from('plan_groups').select('current_week').eq('id', asgn.plan_group_id).single(),
    supabase.from('profiles').select('goal_macro_splits, protein_g_per_kg').eq('id', clientRow.coach_id).single(),
    supabase.from('weight_entries').select('weight_kg, recorded_at').eq('client_id', clientId).order('recorded_at', { ascending: false }).limit(1),
    supabase.from('client_checkins').select('weight_kg').eq('client_id', clientId).not('weight_kg', 'is', null).order('week_number', { ascending: false }).limit(1),
    supabase.from('client_everyday_meals').select('slot_type, meal_id, ingredient_overrides').eq('client_id', clientId),
    supabase.from('ingredients').select('id, name, category, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving').eq('coach_id', clientRow.coach_id),
  ])
  const ingredientLib = {}
  for (const ing of (libData || [])) ingredientLib[ing.id] = ing
  const effectiveWeek = asgn.week_override ?? pg?.current_week ?? 1
  const weightKg = weightRows?.[0]?.weight_kg ?? checkinRows?.[0]?.weight_kg ?? null
  const goalMacroSplits = normalizeGoalMacroSplits(coachProfile?.goal_macro_splits)

  const dailyMacroTargets = asgn.calorie_target && goalMacroSplits
    ? { cal: asgn.calorie_target, ...calcBodyweightMacros(asgn.calorie_target, weightKg, coachProfile?.protein_g_per_kg, clientRow.goal_type, goalMacroSplits) }
    : null

  const tier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
  const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
    tier
      ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).eq('calorie_tier', tier).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', asgn.plan_group_id).eq('week_number', effectiveWeek).is('calorie_tier', null).maybeSingle(),
    supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', asgn.id).eq('week_number', effectiveWeek).maybeSingle(),
  ])
  const tmpl = tierTmpl || stdTmpl
  const templateSlots = {}, templateOverrides = {}
  for (const s of (tmpl?.template_meal_slots || [])) {
    templateSlots[s.slot_type] = s.meal_id
    if (s.ingredient_overrides) templateOverrides[s.slot_type] = s.ingredient_overrides
  }
  if (asgn.preworkout_static && asgn.preworkout_meal_id) templateSlots.preworkout = asgn.preworkout_meal_id
  if (asgn.evening_snack_static && asgn.evening_snack_meal_id) templateSlots.evening_snack = asgn.evening_snack_meal_id
  const finalSlots = { ...templateSlots, ...(cwm?.slots || {}) }
  const clientOverrides = cwm?.ingredient_overrides || {}

  // Only the handful of meals actually in play today (up to 8: breakfast/lunch/dinner A+B,
  // pre-workout, evening snack, plus whatever's picked for Everyday meals) — not the coach's whole
  // library. That full-library fetch (every meal, every ingredient, every calorie-tier version) is
  // what was making this page take upwards of 10 seconds to show anything.
  const neededMealIds = [...new Set([
    ...Object.values(finalSlots),
    ...(everydayRows || []).map(r => r.meal_id),
  ].filter(Boolean))]

  const { data: mealsData } = neededMealIds.length > 0
    ? await supabase.from('meals').select(`
        id, name, category,
        meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static, scaling_type),
        meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
          meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
      `).in('id', neededMealIds)
    : { data: [] }
  const mealMap = {}
  for (const m of (mealsData || [])) mealMap[m.id] = m

  // `resolvedIngredients` is the fully-layered (tier + weekly-schedule template + this client's own
  // standing week edit) ingredient list — already exactly what's actually in the meal, before any
  // per-day tweak. The daily tracker treats this as a synthetic meal's own base ingredients and
  // applies a THIRD, day-only override layer on top of it (see ClientDailyMealTracker.jsx), the
  // same way getIngredientsLayered itself stacks the template layer under the client layer.
  function buildPlanOption(defs) {
    return defs.map(d => {
      const mealId = finalSlots[d.slotType] || null
      const meal = mealId ? mealMap[mealId] : null
      return {
        key: d.key,
        label: d.label,
        name: meal?.name || null,
        category: meal?.category || null,
        photoUrl: meal?.photo_url || null,
        photoPosition: meal?.photo_position || null,
        resolvedIngredients: meal ? getIngredientsLayered(meal, tier, templateOverrides[d.slotType], clientOverrides[d.slotType]) : [],
        macros: mealMacrosLayered(mealId, mealMap, tier, templateOverrides[d.slotType], clientOverrides[d.slotType]) || { cal: 0, prot: 0, carb: 0, fat: 0 },
      }
    }).filter(s => s.name)
  }

  const everydayByType = {}
  for (const r of (everydayRows || [])) everydayByType[r.slot_type] = r
  const everyday = EVERYDAY_SLOTS.map(d => {
    const row = everydayByType[d.slotType]
    const meal = row?.meal_id ? mealMap[row.meal_id] : null
    return {
      key: d.key,
      label: d.label,
      name: meal?.name || null,
      macros: mealMacros(row?.meal_id, mealMap, null, row?.ingredient_overrides) || { cal: 0, prot: 0, carb: 0, fat: 0 },
    }
  }).filter(s => s.name)

  // Pre-workout and evening snack sit outside the A/B choice entirely — same meal either way, per
  // ClientMealPlan.jsx's own preworkoutM/snackM — so they're ticked as their own single items
  // rather than duplicated per option.
  const shared = buildPlanOption([
    { key: 'preworkout',    label: 'Pre-workout',   slotType: 'preworkout' },
    { key: 'evening_snack', label: 'Evening snack', slotType: 'evening_snack' },
  ])

  return {
    coachId: clientRow.coach_id,
    ingredientLib,
    dailyMacroTargets,
    optionA: buildPlanOption(OPTION_A_SLOTS),
    optionB: buildPlanOption(OPTION_B_SLOTS),
    shared,
    everyday,
  }
}
