import { supabase } from './supabase'
import { CALORIE_TIERS } from './calorieTiers'
import { MACRO_SPLIT, calcMacrosFromSplit } from './macros'

export { CALORIE_TIERS }

export function missingTiers(existingTiers) {
  return CALORIE_TIERS.filter(t => !existingTiers.has(t))
}

// A meal with no flexible ingredients can't be scaled at all — its tier versions are just its
// base recipe at every tier, so it will drift from a tier's target as soon as that tier's number
// differs from whatever the base recipe happens to add up to.
export function allIngredientsFixed(baseIngredients) {
  return baseIngredients.length > 0 && baseIngredients.every(i => (i.scaling_type || 'flexible') === 'fixed')
}

function round1(n) {
  return Math.round(parseFloat(n || 0) * 10) / 10
}

export function snapToConstraints(amount, libIng) {
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

export function calcTotals(ingredients) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const ing of ingredients) {
    t.calories  += parseFloat(ing.calories)  || 0
    t.protein_g += parseFloat(ing.protein_g) || 0
    t.carbs_g   += parseFloat(ing.carbs_g)   || 0
    t.fat_g     += parseFloat(ing.fat_g)     || 0
  }
  return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g) }
}

// A meal's calorie sub-target for a tier is its category's share (the coach's standard split) of
// that tier's total — macro sub-targets apportion the same overall split (MACRO_SPLIT) across it.
export function tierTargetsForCategory(tier, category, mealSplit) {
  const pct = mealSplit?.[category] || 0
  const calories = round1(tier * pct / 100)
  const macros = calcMacrosFromSplit(calories, MACRO_SPLIT)
  return { calories, protein_g: macros.protein_g, carbs_g: macros.carbs_g, fat_g: macros.fat_g }
}

function buildRow(ing, library) {
  const libIng = ing.ingredient_id ? library.find(l => l.id === ing.ingredient_id) || null : null
  const origQty = parseFloat(ing.quantity_g) || 0
  let calPerG, protPerG, carbPerG, fatPerG
  if (libIng && libIng.serving_size > 0) {
    calPerG  = libIng.calories_per_serving / libIng.serving_size
    protPerG = libIng.protein_per_serving  / libIng.serving_size
    carbPerG = libIng.carbs_per_serving    / libIng.serving_size
    fatPerG  = libIng.fat_per_serving      / libIng.serving_size
  } else {
    calPerG  = origQty > 0 ? (parseFloat(ing.calories)  || 0) / origQty : 0
    protPerG = origQty > 0 ? (parseFloat(ing.protein_g) || 0) / origQty : 0
    carbPerG = origQty > 0 ? (parseFloat(ing.carbs_g)   || 0) / origQty : 0
    fatPerG  = origQty > 0 ? (parseFloat(ing.fat_g)     || 0) / origQty : 0
  }
  return {
    name: ing.name, unit: ing.unit || 'g', scaling_type: ing.scaling_type || 'flexible',
    ingredient_id: ing.ingredient_id || null, libIng, origQty,
    calPerG, protPerG, carbPerG, fatPerG,
    cal: origQty * calPerG, prot: origQty * protPerG, carb: origQty * carbPerG, fat: origQty * fatPerG,
  }
}

function finalizeQty(row, qty) {
  let snapped = round1(qty)
  if (row.libIng) snapped = snapToConstraints(snapped, row.libIng) ?? snapped
  return {
    quantity_g: snapped,
    calories:  round1(snapped * row.calPerG),
    protein_g: round1(snapped * row.protPerG),
    carbs_g:   round1(snapped * row.carbPerG),
    fat_g:     round1(snapped * row.fatPerG),
  }
}

function finalizeRow(row, qty) {
  const f = finalizeQty(row, qty)
  return {
    name: row.name, quantity_g: f.quantity_g, unit: row.unit,
    calories: f.calories, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g,
    scaling_type: row.scaling_type, ingredient_id: row.ingredient_id,
  }
}

// Solves A·f = b via Gauss-Jordan elimination with partial pivoting (no external dependency needed
// for an n-by-n system this small — n is a meal's flexible-ingredient count, rarely above ~10).
function gaussianSolve(A, b) {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r
    }
    if (pivot !== col) { const tmp = M[col]; M[col] = M[pivot]; M[pivot] = tmp }
    const pv = M[col][col]
    if (Math.abs(pv) < 1e-9) continue
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = M[r][col] / pv
      if (factor === 0) continue
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c]
    }
  }
  return M.map((row, i) => Math.abs(row[i]) > 1e-9 ? row[n] / row[i] : 1)
}

const DIMS = ['cal', 'prot', 'carb', 'fat']
// Calories are a hard requirement (the -50/+20 band); macros are taken into account but weighted
// more softly, and a ridge term (λ) keeps factors anchored near 1 so a meal's ingredients stay in
// roughly the same proportion to each other instead of the solver trading one off against another
// (e.g. doubling the bagel while zeroing out the honey) to chase an exact macro fit.
const WEIGHTS = { cal: 4, prot: 1, carb: 1, fat: 1 }
// Scaled relative to each ingredient's own row magnitude rather than a flat constant — a flat λ is
// negligible next to real calorie/macro values (hundreds, squared) and so provided no real anchor
// in practice, which is what let factors drift to unrealistic, "random-looking" quantities.
const LAMBDA_REL = 0.5

function solveFactors(flexRows, fixedTotals, targets) {
  const n = flexRows.length
  if (n === 0) return []
  const A = Array.from({ length: n }, () => new Array(n).fill(0))
  const b = new Array(n).fill(0)
  const rowMagnitude = flexRows.map(row => {
    let sum = 0
    for (const d of DIMS) sum += WEIGHTS[d] * row[d] * row[d]
    return sum
  })
  for (let j = 0; j < n; j++) {
    const ridge = LAMBDA_REL * rowMagnitude[j]
    for (let k = 0; k < n; k++) {
      let sum = 0
      for (const d of DIMS) sum += WEIGHTS[d] * flexRows[j][d] * flexRows[k][d]
      if (j === k) sum += ridge
      A[j][k] = sum
    }
    let bj = 0
    for (const d of DIMS) bj += WEIGHTS[d] * flexRows[j][d] * (targets[d] - fixedTotals[d])
    bj += ridge * 1
    b[j] = bj
  }
  return gaussianSolve(A, b)
}

// Scales a meal's flexible ingredients (fixed ones stay put) to hit `targets` as closely as
// possible, weighting calories hardest and macros softly, then snaps to each ingredient's serving
// step/minimum and iterates to converge tightly on the target — a meal's category share of a
// tier is only one of several that get added together into a client's day total, so drift here
// compounds across meals; landing close on every individual meal is what keeps any combination of
// a tier's meals close to that tier's actual daily number.
const TIER_CONVERGENCE_KCAL = 5

export function generateTierIngredients(baseIngredients, library, targets) {
  const rows = baseIngredients.map(ing => buildRow(ing, library))
  const flexRows = rows.filter(r => r.scaling_type !== 'fixed')
  const fixedRows = rows.filter(r => r.scaling_type === 'fixed')
  const fixedTotals = {
    cal:  fixedRows.reduce((s, r) => s + r.cal,  0),
    prot: fixedRows.reduce((s, r) => s + r.prot, 0),
    carb: fixedRows.reduce((s, r) => s + r.carb, 0),
    fat:  fixedRows.reduce((s, r) => s + r.fat,  0),
  }
  const targetVec = { cal: targets.calories, prot: targets.protein_g, carb: targets.carbs_g, fat: targets.fat_g }

  let qtyByRow = rows.map(r => r.origQty)

  if (flexRows.length > 0) {
    let factors = solveFactors(flexRows, fixedTotals, targetVec)
    factors = factors.map(f => Math.min(3, Math.max(0.1, f)))
    let flexIdx = 0
    qtyByRow = rows.map(r => r.scaling_type === 'fixed' ? r.origQty : r.origQty * factors[flexIdx++])

    let bestQty = qtyByRow
    let bestAbsDiff = Infinity
    // Landing a few kcal under target is fine; landing over never is unless physically forced
    // (e.g. an ingredient's serving minimum alone exceeds the target) — track the closest
    // at-or-under result separately so it's always preferred over a closer-but-over one.
    let bestUnderQty = null
    let bestUnderDiff = Infinity

    for (let iter = 0; iter < 10; iter++) {
      const snapped = rows.map((r, i) => finalizeQty(r, qtyByRow[i]))
      const achievedCal = snapped.reduce((s, r) => s + r.calories, 0)
      const diff = targetVec.cal - achievedCal // > 0 = under target, < 0 = over target
      if (Math.abs(diff) < bestAbsDiff) { bestAbsDiff = Math.abs(diff); bestQty = qtyByRow }
      if (diff >= 0 && diff < bestUnderDiff) { bestUnderDiff = diff; bestUnderQty = qtyByRow }
      if (Math.abs(diff) <= TIER_CONVERGENCE_KCAL) break
      const flexAchievedCal = snapped.reduce((s, r, i) => s + (rows[i].scaling_type === 'fixed' ? 0 : r.calories), 0)
      if (flexAchievedCal <= 0) break
      const desiredFlexCal = targetVec.cal - fixedTotals.cal
      const corr = Math.min(2, Math.max(0.3, desiredFlexCal / flexAchievedCal))
      qtyByRow = qtyByRow.map((q, i) => rows[i].scaling_type === 'fixed' ? q : q * corr)
    }
    qtyByRow = bestUnderQty || bestQty
  }

  return rows.map((r, i) => finalizeRow(r, qtyByRow[i]))
}

export async function insertTierVersion(mealId, tier, ingredients) {
  const totals = calcTotals(ingredients)
  const { data: version, error } = await supabase
    .from('meal_tier_versions')
    .insert({ meal_id: mealId, calorie_tier: tier, ...totals })
    .select('id')
    .single()
  if (error) throw error
  if (ingredients.length > 0) {
    await supabase.from('meal_tier_ingredients').insert(ingredients.map(ing => ({ ...ing, tier_version_id: version.id })))
  }
}

// Rebuilds every calorie-tier version from the current base ingredients, overwriting whatever was
// there before — used whenever a meal's base recipe is saved, so tiers never drift out of sync.
export async function regenerateAllTiersForMeal(mealId, category, baseIngredients, library, mealSplit) {
  const { data: existing } = await supabase.from('meal_tier_versions').select('id').eq('meal_id', mealId)
  if (existing?.length) {
    await supabase.from('meal_tier_versions').delete().in('id', existing.map(v => v.id))
  }
  for (const tier of CALORIE_TIERS) {
    const targets = tierTargetsForCategory(tier, category, mealSplit)
    await insertTierVersion(mealId, tier, generateTierIngredients(baseIngredients, library, targets))
  }
}

// Creates every tier a meal doesn't already have yet. Leaves existing tiers (including any manual
// coach edits) untouched, so it's safe to run repeatedly across the whole library.
export async function createMissingTiersForMeal(mealId, category, baseIngredients, library, mealSplit, existingTiers) {
  for (const tier of CALORIE_TIERS) {
    if (existingTiers.has(tier)) continue
    const targets = tierTargetsForCategory(tier, category, mealSplit)
    await insertTierVersion(mealId, tier, generateTierIngredients(baseIngredients, library, targets))
  }
}

// When a library ingredient's macros or constraints change, every meal_ingredient and
// meal_tier_ingredient linked to it has stale numbers baked in at whatever quantity was saved —
// re-snap each to the new constraints, recompute its macros, then roll the updated tier ingredient
// totals back up into their meal_tier_versions row.
export async function propagateIngredientRuleChange(ingredientId, libIng) {
  const [{ data: baseRows }, { data: tierRows }] = await Promise.all([
    supabase.from('meal_ingredients').select('id, quantity_g').eq('ingredient_id', ingredientId),
    supabase.from('meal_tier_ingredients').select('id, tier_version_id, quantity_g').eq('ingredient_id', ingredientId),
  ])

  function macrosAt(qty) {
    const snapped = snapToConstraints(qty, libIng) ?? qty
    const f = libIng.serving_size > 0 ? snapped / libIng.serving_size : 0
    return {
      quantity_g: snapped,
      calories:  round1(f * libIng.calories_per_serving),
      protein_g: round1(f * libIng.protein_per_serving),
      carbs_g:   round1(f * libIng.carbs_per_serving),
      fat_g:     round1(f * libIng.fat_per_serving),
    }
  }

  for (const row of (baseRows || [])) {
    await supabase.from('meal_ingredients').update(macrosAt(row.quantity_g)).eq('id', row.id)
  }

  const touchedVersionIds = new Set()
  for (const row of (tierRows || [])) {
    await supabase.from('meal_tier_ingredients').update(macrosAt(row.quantity_g)).eq('id', row.id)
    touchedVersionIds.add(row.tier_version_id)
  }

  for (const versionId of touchedVersionIds) {
    const { data: ings } = await supabase.from('meal_tier_ingredients').select('calories, protein_g, carbs_g, fat_g').eq('tier_version_id', versionId)
    await supabase.from('meal_tier_versions').update(calcTotals(ings || [])).eq('id', versionId)
  }
}
