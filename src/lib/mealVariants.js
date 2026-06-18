import { supabase } from './supabase'

// XS→XL with the default scale factor applied to flexible ingredients when generating variants —
// mirrors the single-meal "Create from base" flow in MealEditor, but can run across every meal
// in the library at once (see MealsList's bulk "Create missing sizes" action).
export const VARIANT_SIZE_FACTORS = [
  { name: 'XS',     factor: 0.60 },
  { name: 'Small',  factor: 0.80 },
  { name: 'Medium', factor: 1.00 },
  { name: 'Large',  factor: 1.25 },
  { name: 'XL',     factor: 1.50 },
]

function round1(n) {
  return Math.round(parseFloat(n || 0) * 10) / 10
}

function snapToConstraints(amount, libIng) {
  let val = parseFloat(amount)
  if (isNaN(val) || val <= 0) return val
  const step = libIng?.serving_step
  const min = libIng?.min_amount
  if (step && step > 0) {
    val = Math.round(val / step) * step
    val = Math.round(val * 10000) / 10000
  }
  if (min != null && val > 0 && val < min) val = min
  return val
}

function calcTotals(ingredients) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const ing of ingredients) {
    t.calories  += parseFloat(ing.calories)  || 0
    t.protein_g += parseFloat(ing.protein_g) || 0
    t.carbs_g   += parseFloat(ing.carbs_g)   || 0
    t.fat_g     += parseFloat(ing.fat_g)     || 0
  }
  return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g) }
}

function scaleIngredients(baseIngredients, factor, library) {
  return baseIngredients.map(ing => {
    const isFixed = ing.scaling_type === 'fixed'
    const scale = isFixed ? 1.0 : factor
    const origQty = parseFloat(ing.quantity_g) || 0
    const libIng = ing.ingredient_id ? library.find(l => l.id === ing.ingredient_id) || null : null

    let qty = round1(origQty * scale)
    if (libIng) qty = snapToConstraints(qty, libIng) || qty

    if (libIng && libIng.serving_size > 0) {
      // Use library serving data for accurate macros at the snapped quantity
      const f = qty / libIng.serving_size
      return {
        name: ing.name, quantity_g: qty, unit: ing.unit || 'g',
        calories:  round1(f * libIng.calories_per_serving),
        protein_g: round1(f * libIng.protein_per_serving),
        carbs_g:   round1(f * libIng.carbs_per_serving),
        fat_g:     round1(f * libIng.fat_per_serving),
        scaling_type: ing.scaling_type || 'flexible',
        ingredient_id: ing.ingredient_id || null,
      }
    }

    // No library link — scale proportionally from base macros
    const ratio = origQty > 0 ? qty / origQty : scale
    return {
      name: ing.name, quantity_g: qty, unit: ing.unit || 'g',
      calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
      scaling_type: ing.scaling_type || 'flexible',
      ingredient_id: ing.ingredient_id || null,
    }
  })
}

export function missingVariantNames(existingVariantNames) {
  return VARIANT_SIZE_FACTORS.map(v => v.name).filter(name => !existingVariantNames.has(name))
}

// Creates every size variant a meal doesn't already have yet, scaled from its base ingredients.
// Leaves existing variants untouched, so it's safe to run repeatedly across the whole library.
export async function createMissingVariantsForMeal(mealId, baseIngredients, library, existingVariantNames) {
  for (const { name, factor } of VARIANT_SIZE_FACTORS) {
    if (existingVariantNames.has(name)) continue
    const scaledIngs = scaleIngredients(baseIngredients, factor, library)
    const totals = calcTotals(scaledIngs)
    const { data: variant, error } = await supabase
      .from('meal_variants')
      .insert({ meal_id: mealId, variant_name: name, ...totals })
      .select('id')
      .single()
    if (error) throw error
    if (scaledIngs.length > 0) {
      await supabase.from('meal_variant_ingredients').insert(scaledIngs.map(ing => ({ ...ing, variant_id: variant.id })))
    }
  }
}
