import { supabase } from './supabase'

/**
 * Allergen/dislike conflict detection and swap resolution — shared by the
 * client's own meal plan, the coach's check-in delivery panel, and the coach's
 * per-client meal editor, so a disliked/allergenic ingredient is handled the
 * same way everywhere instead of only inside the coach's manual editor.
 */

export const ALLERGEN_KEYWORDS = {
  dairy:     ['milk', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'whey', 'casein',
               'lactose', 'cheddar', 'mozzarella', 'feta', 'brie', 'ricotta', 'mascarpone',
               'skyr', 'creme', 'crème', 'quark', 'fromage'],
  gluten:    ['wheat', 'flour', 'bread', 'pasta', 'oat', 'oats', 'barley', 'rye', 'semolina',
               'spelt', 'couscous', 'bulgur', 'wrap', 'tortilla', 'bagel', 'sourdough',
               'naan', 'pita', 'cracker', 'biscuit', 'malt'],
  nuts:      ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'brazil nut',
               'macadamia', 'pine nut', 'mixed nuts', 'tree nut'],
  peanuts:   ['peanut', 'peanut butter', 'groundnut'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster',
               'crayfish', 'langoustine', 'squid', 'octopus'],
  fish:      ['salmon', 'tuna', 'cod', 'haddock', 'tilapia', 'sea bass', 'mackerel', 'trout',
               'anchovy', 'sardine', 'halibut', 'basa', 'pollock', 'plaice', 'herring'],
  eggs:      ['egg'],
  soy:       ['soy', 'soya', 'tofu', 'edamame', 'tempeh', 'miso'],
  sesame:    ['sesame', 'tahini'],
}

export function ingredientMatchesRestriction(ingName, restriction) {
  const lower = ingName.toLowerCase()
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

export function findSafeMeal(category, excludeId, allergies, dislikes, mealMap, mealsByCategory, tier) {
  const options = mealsByCategory[category] || []
  return options.find(m => {
    if (m.id === excludeId) return false
    const { allergens, dislikes: dl } = getMealConflicts(m, tier, allergies, dislikes)
    return allergens.length === 0 && dl.length === 0
  }) || null
}

export function findSafeAlternative(hit, allergies, dislikes, library) {
  for (const altId of (hit.alternativeIds || [])) {
    const libIng = library.find(l => l.id === altId)
    if (!libIng) continue
    const clashes =
      (allergies || []).some(a => ingredientMatchesRestriction(libIng.name, a)) ||
      (dislikes  || []).some(d => d && libIng.name.toLowerCase().includes(d.toLowerCase()))
    if (!clashes) return libIng
  }
  return null
}

function round1(n) { return Math.round(n * 10) / 10 }

// Build a replacement ingredient row scaled to keep the same gram amount, using
// the replacement's per-serving macros — same math as the coach's manual
// "swap ingredient" action, so a saved rule behaves identically to a one-off fix.
export function scaledSwapIngredient(originalQty, libIng) {
  const f = libIng.serving_size > 0 ? originalQty / libIng.serving_size : 0
  return {
    id: `swap-${libIng.id}`,
    name: libIng.name,
    quantity_g: originalQty,
    unit: libIng.serving_unit || 'g',
    calories:  round1(f * libIng.calories_per_serving),
    protein_g: round1(f * libIng.protein_per_serving),
    carbs_g:   round1(f * libIng.carbs_per_serving),
    fat_g:     round1(f * libIng.fat_per_serving),
    ingredient_id: libIng.id,
  }
}

// Given a meal's already-resolved ingredient list (tier + per-client overrides
// already applied) plus a client's dislikes and their saved swap rules, return
// the list with every resolvable dislike swapped out, and report what happened
// so the caller can persist a "this meal changed" notification. A meal-specific
// rule (mealSwapOptions) always wins over a global ingredient-level rule, since
// it's the coach's deliberate, meal-aware fix (e.g. "tuna + potato" -> "beans +
// potato" rather than just substituting tuna 1-for-1).
export function applyDislikeSwaps(ingredients, dislikes, mealId, ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike) {
  let result = ingredients
  const applied = []
  const unresolved = []

  for (const dislike of (dislikes || [])) {
    if (!dislike) continue
    const hitIdx = result.findIndex(ing => ing.name.toLowerCase().includes(dislike.toLowerCase()))
    if (hitIdx === -1) continue

    const mealOption = mealSwapOptionsByMealAndDislike?.[mealId]?.[dislike]
    if (mealOption) {
      result = mealOption.ingredients
      applied.push({ dislike_name: dislike, resolution: 'meal_swap' })
      continue
    }

    const rule = ingredientSwapsByDislike?.[dislike]
    if (rule) {
      const hit = result[hitIdx]
      const replacement = scaledSwapIngredient(parseFloat(hit.quantity_g) || 0, rule)
      result = result.map((ing, i) => i === hitIdx ? replacement : ing)
      applied.push({ dislike_name: dislike, resolution: 'ingredient_swap' })
      continue
    }

    unresolved.push({ dislike_name: dislike, ingredientName: result[hitIdx].name })
  }

  return { ingredients: result, applied, unresolved }
}

// Keeps the coach-notification table in sync with what actually happened for this meal: a
// resolved dislike (swapped automatically) or one still needing a rule. Safe to call on every
// page load — only writes rows whose resolution actually changed, so an already-acknowledged
// notification doesn't get reset to unread just because the client reopened their plan.
export async function syncMealSwapStatus(clientId, mealId, applied, unresolved) {
  const entries = [
    ...(applied || []).map(a => ({ dislike_name: a.dislike_name, resolution: a.resolution })),
    ...(unresolved || []).map(u => ({ dislike_name: u.dislike_name, resolution: 'needs_review' })),
  ]
  if (!entries.length) return
  const { data: existing } = await supabase.from('client_meal_swap_acks')
    .select('dislike_name, resolution')
    .eq('client_id', clientId).eq('meal_id', mealId)
  const existingByDislike = Object.fromEntries((existing || []).map(r => [r.dislike_name, r.resolution]))
  const toUpsert = entries.filter(e => existingByDislike[e.dislike_name] !== e.resolution)
  if (!toUpsert.length) return
  await supabase.from('client_meal_swap_acks').upsert(
    toUpsert.map(e => ({ client_id: clientId, meal_id: mealId, dislike_name: e.dislike_name, resolution: e.resolution, acknowledged: false })),
    { onConflict: 'client_id,meal_id,dislike_name' }
  )
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
