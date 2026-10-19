import { supabase } from './supabase'
import { hasValidServingSize, macrosForQty } from './ingredientMacros'

/**
 * Allergen/dislike conflict detection and swap resolution — shared by the
 * client's own meal plan, the coach's check-in delivery panel, and the coach's
 * per-client meal editor, so a disliked/allergenic ingredient is handled the
 * same way everywhere instead of only inside the coach's manual editor.
 */

export const ALLERGEN_KEYWORDS = {
  dairy:     ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'whey', 'casein',
               'lactose', 'cheddar', 'mozzarella', 'feta', 'brie', 'ricotta', 'mascarpone',
               'skyr', 'creme', 'crème', 'quark', 'fromage', 'parmesan', 'halloumi', 'philadelphia'],
  gluten:    ['wheat', 'flour', 'bread', 'pasta', 'oat', 'oats', 'barley', 'rye', 'semolina',
               'spelt', 'couscous', 'bulgur', 'wrap', 'tortilla', 'bagel', 'sourdough',
               'naan', 'pita', 'cracker', 'biscuit', 'malt', 'noodle', 'lasagne', 'spaghetti',
               'macaroni', 'linguine', 'tagliatelle', 'rigatoni', 'fusilli', 'orzo', 'penne',
               'panko', 'breadcrumb', 'bun', 'ciabatta', 'cibatta', 'crumpet', 'bap', 'panini',
               'weetabix', 'hovis', 'warb'],
  nuts:      ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'brazil nut',
               'macadamia', 'pine nut', 'mixed nuts', 'tree nut', 'nutella'],
  peanuts:   ['peanut', 'peanut butter', 'groundnut'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster',
               'crayfish', 'langoustine', 'squid', 'octopus'],
  fish:      ['salmon', 'tuna', 'cod', 'haddock', 'tilapia', 'sea bass', 'mackerel', 'trout',
               'anchovy', 'sardine', 'halibut', 'basa', 'pollock', 'plaice', 'herring'],
  eggs:      ['egg', 'mayo'],
  soy:       ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'],
  sesame:    ['sesame', 'tahini'],
}

// Named products that would otherwise trip a keyword by coincidence — "Corn Flour" contains
// "flour" without containing gluten, "Gluten Free X" and "Vegan X" products are explicitly safe
// for the very restriction their name's keyword would suggest, and a plant milk contains "milk"
// without containing dairy. Checked before the keyword scan below.
const RESTRICTION_SAFE_EXCEPTIONS = {
  gluten: [/corn\s*flour/, /gluten[\s-]?free/],
  dairy:  [/^vegan\b/, /\b(oat|almond|soy|soya|coconut|rice|cashew)\s*milk\b/],
  eggs:   [/^vegan\b/],
}

export function ingredientMatchesRestriction(ingName, restriction) {
  const lower = ingName.toLowerCase()
  const exceptions = RESTRICTION_SAFE_EXCEPTIONS[restriction]
  if (exceptions && exceptions.some(re => re.test(lower))) return false
  const keywords = ALLERGEN_KEYWORDS[restriction] || [restriction.toLowerCase()]
  return keywords.some(kw => lower.includes(kw))
}

export function getMealConflicts(meal, tier, allergies, dislikes) {
  if (!meal) return { allergens: [], dislikes: [] }
  const tierVersion = tier ? meal.meal_tier_versions?.find(v => v.calorie_tier === tier) : null
  const displayIngs = tierVersion?.meal_tier_ingredients || meal.meal_ingredients || []
  const baseIngs    = meal.meal_ingredients || []

  const allergenHits = [], dislikeHits = []

  for (const ing of displayIngs) {
    const base = baseIngs.find(b =>
      b.name === ing.name ||
      (b.ingredient_id && ing.ingredient_id && b.ingredient_id === ing.ingredient_id)
    )
    const removeId = base?.id ?? ing.id
    const alternativeIds = base?.alternative_ingredient_ids || []
    const quantity_g = ing.quantity_g ?? base?.quantity_g ?? 0

    for (const allergen of (allergies || [])) {
      if (ingredientMatchesRestriction(ing.name, allergen)) {
        if (!allergenHits.find(h => h.allergen === allergen && h.ingredientName === ing.name)) {
          allergenHits.push({ allergen, ingredientName: ing.name, removeId, quantity_g, alternativeIds })
        }
      }
    }
    for (const dislike of (dislikes || [])) {
      if (dislike && ing.name.toLowerCase().includes(dislike.toLowerCase())) {
        if (!dislikeHits.find(h => h.dislike === dislike && h.ingredientName === ing.name)) {
          dislikeHits.push({ dislike, ingredientName: ing.name, removeId, quantity_g, alternativeIds })
        }
      }
    }
  }

  return { allergens: allergenHits, dislikes: dislikeHits }
}

// dietFilter is an optional (meal) => boolean predicate — pass mealQualifiesForDiets bound to the
// client's own diets so an auto-suggested "safe" replacement for an allergy/dislike conflict never
// substitutes in a meal that isn't eligible for this client's diet (e.g. a Standard client getting
// a meal that's had "Standard eligible" unchecked, purely because it happens to avoid the
// allergen). Not imported directly from src/lib/diets.js here since diets.js itself imports
// ALLERGEN_KEYWORDS from this file — passing it in avoids a circular import.
export function findSafeMeal(category, excludeId, allergies, dislikes, mealMap, mealsByCategory, tier, dietFilter) {
  const options = mealsByCategory[category] || []
  return options.find(m => {
    if (m.id === excludeId) return false
    if (dietFilter && !dietFilter(m)) return false
    const { allergens, dislikes: dl } = getMealConflicts(m, tier, allergies, dislikes)
    return allergens.length === 0 && dl.length === 0
  }) || null
}

export function findSafeAlternative(hit, allergies, dislikes, library) {
  for (const altId of (hit.alternativeIds || [])) {
    const libIng = library.find(l => l.id === altId)
    // An alternative with no valid serving size can't be scaled to a gram amount at all — skip it
    // rather than offer a swap that would read 0 kcal, and let a later alternative (or the manual
    // ingredient picker) cover it once the Ingredients Library entry itself is fixed.
    if (!libIng || !hasValidServingSize(libIng)) continue
    const clashes =
      (allergies || []).some(a => ingredientMatchesRestriction(libIng.name, a)) ||
      (dislikes  || []).some(d => d && libIng.name.toLowerCase().includes(d.toLowerCase()))
    if (!clashes) return libIng
  }
  return null
}

// Build a replacement ingredient row scaled to keep the same gram amount, using
// the replacement's per-serving macros — same math as the coach's manual
// "swap ingredient" action, so a saved rule behaves identically to a one-off fix.
export function scaledSwapIngredient(originalQty, libIng) {
  return {
    id: `swap-${libIng.id}`,
    name: libIng.name,
    quantity_g: originalQty,
    unit: libIng.serving_unit || 'g',
    ingredient_id: libIng.id,
    ...macrosForQty(libIng, originalQty),
  }
}

// Given a meal's already-resolved ingredient list (tier + per-client overrides already applied)
// plus a client's dislikes AND allergies and their saved swap rules, return the list with every
// resolvable restriction swapped out, and report what happened so the caller can persist a "this
// meal changed" notification. A meal-specific rule (mealSwapOptions) always wins over a global
// ingredient-level rule, since it's the coach's deliberate, meal-aware fix (e.g. "tuna + potato" ->
// "beans + potato" rather than just substituting tuna 1-for-1).
//
// A dislike matches by plain substring (whatever free text the client typed); an allergy matches
// the shared ALLERGEN_KEYWORDS list (same as getMealConflicts) so it catches every name variant of
// that allergen, not just an exact string match — an allergy is safety-critical, so it can't rely
// on the ingredient happening to be named exactly what the client typed.
export function applyDislikeSwaps(ingredients, dislikes, allergies, mealId, ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike) {
  let result = ingredients
  const applied = []
  const unresolved = []

  const restrictions = [
    ...(dislikes || []).filter(Boolean).map(key => ({ key, test: ing => ing.name.toLowerCase().includes(key.toLowerCase()) })),
    ...(allergies || []).filter(Boolean).map(key => ({ key, test: ing => ingredientMatchesRestriction(ing.name, key) })),
  ]

  for (const { key, test } of restrictions) {
    const hitIdx = result.findIndex(test)
    if (hitIdx === -1) continue

    const mealOption = mealSwapOptionsByMealAndDislike?.[mealId]?.[key]
    if (mealOption) {
      result = mealOption.ingredients
      applied.push({ dislike_name: key, resolution: 'meal_swap' })
      continue
    }

    const rule = ingredientSwapsByDislike?.[key]
    if (rule) {
      const hit = result[hitIdx]
      const replacement = scaledSwapIngredient(parseFloat(hit.quantity_g) || 0, rule)
      result = result.map((ing, i) => i === hitIdx ? replacement : ing)
      applied.push({ dislike_name: key, resolution: 'ingredient_swap' })
      continue
    }

    unresolved.push({ dislike_name: key, ingredientName: result[hitIdx].name })
  }

  return { ingredients: result, applied, unresolved }
}

// Keeps the coach-notification table in sync with what actually happened for this meal: a
// resolved dislike (swapped automatically) or one still needing a rule. Safe to call on every
// page load — only writes rows whose resolution actually changed, so an already-acknowledged
// notification doesn't get reset to unread just because the client reopened their plan.
//
// Also clears out any row for this meal that no longer applies at all — the ingredient was
// swapped, the meal's recipe changed, or the client's own dislike/allergy list changed — so a
// fixed conflict stops showing up on the dashboard without the coach having to dismiss it by
// hand. (A meal swapped OUT of the plan entirely, so this never gets called for its old meal_id
// again, is cleaned up separately — see the per-client sweep in ClientMealPlan.jsx.)
export async function syncMealSwapStatus(clientId, mealId, applied, unresolved) {
  const entries = [
    ...(applied || []).map(a => ({ dislike_name: a.dislike_name, resolution: a.resolution })),
    ...(unresolved || []).map(u => ({ dislike_name: u.dislike_name, resolution: 'needs_review' })),
  ]
  const { data: existing } = await supabase.from('client_meal_swap_acks')
    .select('id, dislike_name, resolution')
    .eq('client_id', clientId).eq('meal_id', mealId)
  const existingByDislike = Object.fromEntries((existing || []).map(r => [r.dislike_name, r]))
  const currentNames = new Set(entries.map(e => e.dislike_name))

  const stale = (existing || []).filter(r => !currentNames.has(r.dislike_name))
  if (stale.length) await supabase.from('client_meal_swap_acks').delete().in('id', stale.map(r => r.id))

  const toUpsert = entries.filter(e => existingByDislike[e.dislike_name]?.resolution !== e.resolution)
  if (!toUpsert.length) return
  await supabase.from('client_meal_swap_acks').upsert(
    toUpsert.map(e => ({ client_id: clientId, meal_id: mealId, dislike_name: e.dislike_name, resolution: e.resolution, acknowledged: false })),
    { onConflict: 'client_id,meal_id,dislike_name' }
  )
}

// Removes any coach-notification row left over from a meal that's no longer assigned anywhere in
// this client's current week at all — e.g. the coach (or an earlier auto-swap) replaced it with a
// different meal, so syncMealSwapStatus never runs against its old meal_id again and its row would
// otherwise sit there flagged forever. Safe to call even when the client has no dislikes/allergies
// at all: it only ever deletes rows that already exist for meals no longer in currentMealIds.
export async function clearOrphanedMealSwapAcks(clientId, currentMealIds) {
  const { data: existing } = await supabase.from('client_meal_swap_acks').select('id, meal_id').eq('client_id', clientId)
  if (!existing?.length) return
  const keep = new Set(currentMealIds.filter(Boolean))
  const orphaned = existing.filter(r => !keep.has(r.meal_id))
  if (orphaned.length) await supabase.from('client_meal_swap_acks').delete().in('id', orphaned.map(r => r.id))
}

// Loads this client's global swap rules and any meal-specific standard swaps
// relevant to their current dislikes, keyed for fast lookup by applyDislikeSwaps.
export async function loadSwapContext(clientId, dislikes) {
  const cleanDislikes = (dislikes || []).filter(Boolean)
  if (!cleanDislikes.length) return { ingredientSwapsByDislike: {}, mealSwapOptionsByMealAndDislike: {} }

  const [{ data: swapRows }, { data: optionRows }] = await Promise.all([
    supabase.from('client_ingredient_swaps').select('dislike_name, to_ingredient:to_ingredient_id(*)').eq('client_id', clientId).in('dislike_name', cleanDislikes),
    supabase.from('meal_swap_options').select('meal_id, dislike_name, label, ingredients').in('dislike_name', cleanDislikes),
  ])

  const ingredientSwapsByDislike = {}
  for (const row of (swapRows || [])) {
    if (row.to_ingredient) ingredientSwapsByDislike[row.dislike_name] = row.to_ingredient
  }

  const mealSwapOptionsByMealAndDislike = {}
  for (const row of (optionRows || [])) {
    (mealSwapOptionsByMealAndDislike[row.meal_id] ||= {})[row.dislike_name] = row
  }

  return { ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike }
}
