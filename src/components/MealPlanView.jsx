import { useState } from 'react'
import { applyDislikeSwaps } from '../lib/mealSwaps'
import { selectOnFocus } from '../lib/formUtils'

/**
 * Shared meal-plan display components and helpers.
 * Used by ClientMealPlan.jsx (client view) and the coach DeliveryPanel.
 */

// ─── Layout groups ────────────────────────────────────────────────────────────

export const MEAL_GROUPS = [
  {
    label: 'Breakfast',
    slots: [
      { key: 'breakfast1', label: 'Breakfast A', optionLabel: 'Option A', cat: 'breakfast' },
      { key: 'breakfast2', label: 'Breakfast B', optionLabel: 'Option B', cat: 'breakfast' },
    ],
  },
  {
    label: 'Lunch',
    slots: [
      { key: 'lunch1', label: 'Lunch A', optionLabel: 'Option A', cat: 'lunch' },
      { key: 'lunch2', label: 'Lunch B', optionLabel: 'Option B', cat: 'lunch' },
    ],
  },
  {
    label: 'Pre-workout',
    slots: [{ key: 'preworkout', label: 'Pre-workout', optionLabel: null, cat: 'pre_workout' }],
  },
  {
    label: 'Dinner',
    slots: [
      { key: 'dinner1', label: 'Dinner A', optionLabel: 'Option A', cat: 'dinner' },
      { key: 'dinner2', label: 'Dinner B', optionLabel: 'Option B', cat: 'dinner' },
    ],
  },
  {
    label: 'Evening Snack',
    slots: [{ key: 'evening_snack', label: 'Evening snack', optionLabel: null, cat: 'evening_snack' }],
  },
]

export const ALL_SLOT_DEFS = MEAL_GROUPS.flatMap(g => g.slots)
export const OPTION_1_KEYS = ['breakfast1', 'lunch1', 'dinner1']
export const OPTION_2_KEYS = ['breakfast2', 'lunch2', 'dinner2']
export const SWAP_CALORIE_TOLERANCE = 75
export const SWAP_PROTEIN_TOLERANCE = 10
export const SWAP_CARB_TOLERANCE = 15
export const SWAP_FAT_TOLERANCE = 8

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round1(n) { return Math.round(n * 10) / 10 }

// Fixed colour + letter for each macro, used everywhere one is shown so carbs/protein/fat are
// identifiable at a glance without reading the label - always in this order: calories, carbs,
// protein, fat.
export const MACRO_META = {
  carb: { letter: 'C', name: 'Carbs',   dot: 'bg-amber-400 dark:bg-amber-500',  text: 'text-amber-600 dark:text-amber-400' },
  prot: { letter: 'P', name: 'Protein', dot: 'bg-rose-400 dark:bg-rose-500',    text: 'text-rose-600 dark:text-rose-400' },
  fat:  { letter: 'F', name: 'Fat',     dot: 'bg-violet-400 dark:bg-violet-500', text: 'text-violet-600 dark:text-violet-400' },
}

// Small coloured letter badge - the "icon" for a macro, same colour everywhere it appears.
export function MacroBadge({ type, className = '' }) {
  const meta = MACRO_META[type]
  if (!meta) return null
  return (
    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold leading-none text-white flex-shrink-0 ${meta.dot} ${className}`}>
      {meta.letter}
    </span>
  )
}

// Percentage a meal's calories are off from some reference (its target share of the day, or its
// sibling option's calories) - direction doesn't matter, only distance.
export function deviationPct(actualCal, referenceCal) {
  if (!referenceCal) return null
  return Math.round(Math.abs(actualCal - referenceCal) / Math.abs(referenceCal) * 100)
}

// Same three bands wherever a meal's macros are compared against something, so the colour always
// means the same thing: within 10% is yellow, 11-20% is orange, anything beyond that is red -
// whether the meal is over or under makes no difference to the banding.
export function deviationColor(actualCal, referenceCal) {
  const pct = deviationPct(actualCal, referenceCal)
  if (pct == null) return 'text-gray-400 dark:text-gray-500'
  if (pct <= 10) return 'text-yellow-600 dark:text-yellow-500'
  if (pct <= 20) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}

// "Add ~141 kcal" / "Remove ~56 kcal" / "On target" - always phrased as the action still needed,
// never as a restatement of the raw reference number.
function actionText(actualCal, referenceCal) {
  const diff = Math.round(referenceCal - actualCal)
  if (diff === 0) return 'On target'
  return diff > 0 ? `Add ~${diff} kcal` : `Remove ~${Math.abs(diff)} kcal`
}

// Compact signed delta for a single macro, e.g. "+12g" (add) or "−8g" (remove) - paired with a
// MacroBadge for which macro it is, rather than a text label.
function macroDiff(actualG, referenceG) {
  const diff = Math.round(referenceG - actualG)
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '±'
  return `${sign}${Math.abs(diff)}g`
}

// Suggests changing the amount of one editable ingredient to close the gap to a reference (the
// target, or the sibling option) - mirrors what a coach or client would naturally do by hand.
// Rounds to whole units for anything counted in whole items (eggs, scoops, slices, …), nearest
// 5g/ml otherwise, and only offers a suggestion when some ingredient can close the gap without an
// unreasonably large change to its own amount (more than 1.5x its current quantity either way) - a
// spice or garnish that would need to jump tenfold to close the gap is never suggested, since the
// huge calorie-per-gram mismatch rules it out itself.
//
// Never touches an ingredient the coach has marked "Fixed" in the Meal Editor (scaling_type) - the
// same flag the calorie-tier generator already respects for exactly this reason: a Fixed ingredient
// is one the coach has deliberately said shouldn't move (the protein portion that defines the
// recipe, a seasoning that would throw off the dish if it doubled), regardless of what the maths
// says. "Optional" and "flexible" ingredients stay eligible.
//
// Solves for calories (the dominant, most visible lever - closing it is what the rounded quantity
// is chosen to do) but SELECTS among candidates by whichever leaves the whole macro picture
// closest afterwards, not just calories - so when actualMacros/referenceMacros carry carbs/
// protein/fat too, an ingredient whose own macro make-up happens to run the same direction as the
// carb/protein/fat gap (not just the calorie one) is preferred, since changing it only fixes
// calories while quietly making a macro worse otherwise. A small, fine-grained tweak (+30ml milk,
// +5g oats) that nails a small leftover gap exactly is a more sensible suggestion than a big
// whole-unit jump (a whole extra egg) that overshoots it by 3x just because that egg's own
// quantity barely moved. Whole-unit ingredients still win when their own portion genuinely fits
// the gap closely (2 eggs -> 3 for a ~56kcal gap), since that's the tightest fit available.
//
// actualMacros/referenceMacros: { cal, carb, prot, fat } - carb/prot/fat are optional (e.g. a
// calorie-only target still works), in which case only calories drive the scoring.
export function suggestAutoFit(ingredients, actualMacros, referenceMacros, ingredientLib) {
  const referenceCal = referenceMacros?.cal
  const actualCal = actualMacros?.cal
  if (!referenceCal || actualCal == null) return null
  const gapCal = referenceCal - actualCal
  if (Math.abs(gapCal) < Math.max(15, referenceCal * 0.03)) return null // already close enough

  const hasMacros = referenceMacros.carb != null && referenceMacros.prot != null && referenceMacros.fat != null
  const WEIGHTS = { cal: 4, carb: 1, prot: 1, fat: 1 }

  let best = null
  for (const ing of ingredients || []) {
    if (ing.is_static || ing.scaling_type === 'fixed') continue
    const qty = parseFloat(ing.quantity_g) || 0
    const cal = parseFloat(ing.calories) || 0
    if (qty <= 0 || cal <= 0) continue

    const calPerUnit = cal / qty
    const rawNewQty = qty + gapCal / calPerUnit
    if (rawNewQty <= 0) continue

    const unit = libraryUnit(ing, ingredientLib) || (ing.unit !== 'g' ? ing.unit : null)
    const isCounted = unit && unit !== 'g' && unit !== 'ml'
    const newQty = isCounted ? Math.round(rawNewQty) : Math.max(5, Math.round(rawNewQty / 5) * 5)
    if (newQty <= 0 || newQty === qty) continue

    const relChange = Math.abs(newQty - qty) / qty
    if (relChange > 1.5) continue // too drastic a change to be a sensible suggestion

    const ratio = newQty / qty
    const newCal = cal * ratio
    const leftoverCal = referenceCal - (actualCal - cal + newCal)

    // Weighted leftover across every dimension we have targets for - calories dominate (as the
    // primary lever this function solves for), macros are secondary, exactly like the calorie-tier
    // generator's own weighting (calorieTierScaling.js).
    let score = WEIGHTS.cal * leftoverCal * leftoverCal
    if (hasMacros) {
      const carb = parseFloat(ing.carbs_g) || 0, prot = parseFloat(ing.protein_g) || 0, fat = parseFloat(ing.fat_g) || 0
      const leftoverCarb = referenceMacros.carb - ((actualMacros.carb ?? 0) - carb + carb * ratio)
      const leftoverProt = referenceMacros.prot - ((actualMacros.prot ?? 0) - prot + prot * ratio)
      const leftoverFat  = referenceMacros.fat  - ((actualMacros.fat  ?? 0) - fat  + fat  * ratio)
      score += WEIGHTS.carb * leftoverCarb * leftoverCarb + WEIGHTS.prot * leftoverProt * leftoverProt + WEIGHTS.fat * leftoverFat * leftoverFat
    }

    if (!best || score < best.score - 0.01 || (Math.abs(score - best.score) <= 0.01 && relChange < best.relChange)) {
      best = {
        id: ing._tempId || ing.id,
        name: ing.name,
        oldQty: qty,
        newQty,
        unit: unit || 'g',
        deltaCal: Math.round(newCal - cal),
        relChange,
        score,
      }
    }
  }
  return best
}

function fmtQty(qty, unit) {
  if (unit && unit !== 'g' && unit !== 'ml') return `${Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10} ${unit}`
  return `${Math.round(qty)}${unit || 'g'}`
}

// The standard "where am I now, and what do I add or remove to fix it" block, shown wherever a
// meal's ingredients can be edited so it reads the same everywhere. Two clearly separate rows -
// never a restatement of the raw target/sibling figures, always the gap still to close:
//  - target: this slot's share of the day's targets (from the coach's meal-split % and the
//    client's calorie/macro targets) - omit if there's no client target to compare against.
//  - siblingMacros: the meal's other, fully interchangeable option (e.g. Breakfast A's sibling is
//    B - either can be eaten on any given day, so keeping them close together matters as much as
//    hitting the target itself) - omit for slots with only one option (pre-workout, evening snack).
// When ingredients/ingredientLib/onAutoFit are all given, a one-tap suggestion for closing the
// target gap (the biggest lever) appears under the target row - see suggestAutoFit above.
export function MacroTargetInfo({ macros, target, siblingMacros, siblingLabel = 'other option', ingredients, ingredientLib, onAutoFit }) {
  if (!macros || macros.cal <= 0) return null
  const suggestion = (target && target.cal > 0 && onAutoFit) ? suggestAutoFit(ingredients, macros, target, ingredientLib) : null
  return (
    <div className="space-y-1.5">
      {target && target.cal > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xs font-semibold ${deviationColor(macros.cal, target.cal)}`}>
            {actionText(macros.cal, target.cal)} to hit target
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            <span className="flex items-center gap-0.5"><MacroBadge type="carb" />{macroDiff(macros.carb, target.carb)}</span>
            <span className="flex items-center gap-0.5"><MacroBadge type="prot" />{macroDiff(macros.prot, target.prot)}</span>
            <span className="flex items-center gap-0.5"><MacroBadge type="fat" />{macroDiff(macros.fat, target.fat)}</span>
          </span>
        </div>
      )}
      {suggestion && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[11px] text-brand-600 dark:text-brand-400">
            Try {suggestion.name}: {fmtQty(suggestion.oldQty, suggestion.unit)} → {fmtQty(suggestion.newQty, suggestion.unit)}
            {' '}({suggestion.deltaCal > 0 ? '+' : ''}{suggestion.deltaCal} kcal)
          </span>
          <button
            type="button"
            onClick={() => onAutoFit(suggestion.id, suggestion.newQty)}
            className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline flex-shrink-0"
          >
            Apply
          </button>
        </div>
      )}
      {siblingMacros && siblingMacros.cal > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-xs font-semibold ${deviationColor(macros.cal, siblingMacros.cal)}`}>
            {macros.cal === siblingMacros.cal ? `Matches ${siblingLabel}` : `${actionText(macros.cal, siblingMacros.cal)} to match ${siblingLabel}`}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            <span className="flex items-center gap-0.5"><MacroBadge type="carb" />{macroDiff(macros.carb, siblingMacros.carb)}</span>
            <span className="flex items-center gap-0.5"><MacroBadge type="prot" />{macroDiff(macros.prot, siblingMacros.prot)}</span>
            <span className="flex items-center gap-0.5"><MacroBadge type="fat" />{macroDiff(macros.fat, siblingMacros.fat)}</span>
          </span>
        </div>
      )}
    </div>
  )
}

export function normalizeOverrides(raw) {
  if (!raw) return { qty: {}, removed: [], added: [] }
  if (raw.qty || raw.removed || raw.added) return { qty: raw.qty || {}, removed: raw.removed || [], added: raw.added || [] }
  return { qty: { ...raw }, removed: [], added: [] }
}

export function hasAnyOverride(raw) {
  const { qty, removed, added } = normalizeOverrides(raw)
  return Object.keys(qty).length > 0 || removed.length > 0 || added.length > 0
}

export function applyIngredientOverrides(ingredients, overridesForSlot) {
  const { qty, removed, added } = normalizeOverrides(overridesForSlot)
  const visible = removed.length ? ingredients.filter(ing => ing.is_static || !removed.includes(ing.id)) : ingredients
  const withQty = visible.map(ing => {
    if (ing.is_static) return ing
    const override = qty[ing.id]
    if (override == null) return ing
    const origQty = parseFloat(ing.quantity_g) || 0
    const ratio = origQty > 0 ? override / origQty : 1
    return {
      ...ing, quantity_g: override,
      calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
    }
  })
  return added.length ? [...withQty, ...added.map(a => ({ ...a, _isAdded: true }))] : withQty
}

export function sumIngredientMacros(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({ cal: acc.cal + (parseFloat(ing.calories) || 0), prot: acc.prot + (parseFloat(ing.protein_g) || 0), carb: acc.carb + (parseFloat(ing.carbs_g) || 0), fat: acc.fat + (parseFloat(ing.fat_g) || 0) }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

// swapCtx (optional): { dislikes, ingredientSwapsByDislike, mealSwapOptionsByMealAndDislike } — when
// given, any disliked ingredient this client has a saved swap rule for is substituted before macros
// are summed, so the client's own plan and the coach's delivery panel never show something they
// dislike once a rule for it exists (previously only the coach's per-client editor knew about dislikes
// at all, and only there could a coach fix them one at a time by hand).
export function mealMacros(mealId, mealMap, tier, overridesForSlot, swapCtx) {
  if (!mealId || !mealMap[mealId]) return null
  const meal = mealMap[mealId]
  // Always sum the actual ingredient rows rather than trusting a meal_tier_versions row's own
  // cached calories/protein_g/carbs_g/fat_g columns — those can drift out of sync with its
  // meal_tier_ingredients (e.g. after a direct ingredient edit that didn't also re-save the
  // version's aggregate), which silently showed a meal as 0 kcal despite real ingredients underneath.
  return sumIngredientMacros(getIngredients(meal, tier, overridesForSlot, swapCtx))
}

export function getIngredients(meal, tier, overrides, swapCtx) {
  if (!meal) return []
  let base = meal.meal_ingredients || []
  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) base = v.meal_tier_ingredients || []
  }
  let ingredients = applyIngredientOverrides(base, overrides)
  if (swapCtx?.dislikes?.length) {
    const { ingredients: swapped } = applyDislikeSwaps(
      ingredients, swapCtx.dislikes, meal.id, swapCtx.ingredientSwapsByDislike, swapCtx.mealSwapOptionsByMealAndDislike
    )
    ingredients = swapped
  }
  return ingredients
}

export function addMacros(a, b) {
  const az = a || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const bz = b || { cal: 0, prot: 0, carb: 0, fat: 0 }
  return { cal: az.cal + bz.cal, prot: az.prot + bz.prot, carb: az.carb + bz.carb, fat: az.fat + bz.fat }
}

// Looks up the real-world unit ("unit", "tbsp", …) for an ingredient row. Prefers the linked
// library ingredient; falls back to matching by name, since older/free-typed rows often have no
// ingredient_id even though a library entry with the same name (and correct unit) exists.
export function libraryUnit(ing, ingredientLib) {
  if (!ingredientLib) return null
  if (ing.ingredient_id && ingredientLib[ing.ingredient_id]) return ingredientLib[ing.ingredient_id].serving_unit || null
  const nameLower = (ing.name || '').trim().toLowerCase()
  if (!nameLower) return null
  for (const lib of Object.values(ingredientLib)) {
    if ((lib.name || '').trim().toLowerCase() === nameLower) return lib.serving_unit || null
  }
  return null
}

export function formatAmount(ing, ingredientLib) {
  const qty = parseFloat(ing.quantity_g)
  const libUnit = libraryUnit(ing, ingredientLib)
  const unit = (ing.unit && ing.unit !== 'g') ? ing.unit : (libUnit && libUnit !== 'g') ? libUnit : ing.unit
  if (unit && unit !== 'g') {
    const n = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10
    return `${n} ${unit}`
  }
  return `${Math.round(qty)}g`
}

// ─── Meal card ────────────────────────────────────────────────────────────────

export function MealCard({ slotKey, label, optionLabel, cat, mealId, templateMealId, mealMap, mealsByCategory, tier, overrides, onSwap, onViewRecipe, ingredientLib, onRevert, onRemove, swapCtx }) {
  const meal = mealId ? mealMap[mealId] : null
  const ingredients = meal ? getIngredients(meal, tier, overrides, swapCtx) : []
  const macros = mealMacros(mealId, mealMap, tier, overrides, swapCtx)
  const isCustom = (mealId || null) !== (templateMealId || null)

  return (
    <div
      data-tour={meal ? 'meal-card' : undefined}
      className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer active:opacity-90"
      onClick={() => meal && onViewRecipe(slotKey)}
    >
      {/* Photo */}
      <div className="relative w-full aspect-[16/9] sm:w-32 sm:aspect-square bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        {meal?.photo_url ? (
          <img src={meal.photo_url} alt={meal.name} className="w-full h-full object-cover" style={{ objectPosition: meal.photo_position || '50% 50%' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {optionLabel && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
            {optionLabel}
          </span>
        )}
        {isCustom && (
          <span className="absolute top-2 right-2 text-xs font-semibold bg-brand-500 text-white px-2 py-0.5 rounded-full shadow-sm">
            Swapped
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 flex flex-col gap-2 flex-1 min-w-0">
        {meal ? (
          <>
            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">{meal.name}</p>

            <div className="flex-1 space-y-0.5">
              {ingredients.slice(0, 5).map((ing, i) => (
                <div key={ing.id || i} className="flex items-baseline gap-1">
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                    {formatAmount(ing, ingredientLib)}
                  </span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight truncate">{ing.name}</span>
                </div>
              ))}
              {ingredients.length > 5 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">+{ingredients.length - 5} more</p>
              )}
            </div>

            {macros && (
              <div className="grid grid-cols-4 gap-0.5 text-center pt-2 border-t border-gray-100 dark:border-gray-800 mt-auto">
                {[
                  { val: Math.round(macros.cal), lbl: 'kcal', type: null },
                  { val: Math.round(macros.carb) + 'g', lbl: 'carbs', type: 'carb' },
                  { val: Math.round(macros.prot) + 'g', lbl: 'prot', type: 'prot' },
                  { val: Math.round(macros.fat) + 'g', lbl: 'fat', type: 'fat' },
                ].map(({ val, lbl, type }) => (
                  <div key={lbl}>
                    <p className={`text-[10px] font-bold tabular-nums ${type ? MACRO_META[type].text : 'text-gray-900 dark:text-white'}`}>{val}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-0.5">
                      {type && <MacroBadge type={type} />}{lbl}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">No meal set</p>
        )}

        {mealId && (
          <div className="flex items-center gap-3 self-start">
            <button
              data-tour="meal-swap-button"
              onClick={e => { e.stopPropagation(); onSwap(slotKey, label, cat) }}
              className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-brand-500 flex items-center gap-1"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap
            </button>
            {isCustom && onRevert && (
              <button
                onClick={e => { e.stopPropagation(); onRevert(slotKey) }}
                className="text-[10px] text-orange-400 dark:text-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
              >
                Revert
              </button>
            )}
            {onRemove && (
              <button
                onClick={e => { e.stopPropagation(); onRemove(slotKey) }}
                className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Recipe detail modal ──────────────────────────────────────────────────────

export function RecipeModal({ slotKey, mealMap, editedSlots, tier, ingredientOverrides, templateSlots, mealsByCategory, ingredientLib, onClose, onSwap, onRevert, onUpdateIngredient, onRevertIngredients, onRemoveIngredient, onAddIngredient, onToggleStatic, onRemove, swapCtx, target, siblingMacros, siblingLabel }) {
  const [showAddIngredient, setShowAddIngredient] = useState(false)
  const [ingSearch, setIngSearch] = useState('')
  const [prepDays, setPrepDays] = useState(null)

  const mealId = editedSlots[slotKey]
  const meal = mealId ? mealMap[mealId] : null
  const overrides = ingredientOverrides[slotKey]
  const ingredients = meal ? getIngredients(meal, tier, overrides, swapCtx) : []
  const macros = mealMacros(mealId, mealMap, tier, overrides, swapCtx)
  const isCustom = (mealId || null) !== ((templateSlots[slotKey]) || null)
  const slotDef = ALL_SLOT_DEFS.find(s => s.key === slotKey)

  const ingSearchResults = ingSearch.length >= 2
    ? Object.values(ingredientLib || {})
        .filter(lib => lib.name && lib.name.toLowerCase().includes(ingSearch.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="relative">
            {meal?.photo_url ? (
              <img src={meal.photo_url} alt={meal.name} className="w-full aspect-square object-cover" style={{ objectPosition: meal.photo_position || '50% 50%' }} />
            ) : (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-800" />
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              {slotDef?.optionLabel && (
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">{slotDef.label} — {slotDef.optionLabel}</p>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meal?.name}</h2>
              {macros && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                  <span className="font-bold text-gray-900 dark:text-white">{Math.round(macros.cal)} kcal</span>
                  <span className={`flex items-center gap-1 font-medium ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{Math.round(macros.carb)}g carbs</span>
                  <span className={`flex items-center gap-1 font-medium ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{Math.round(macros.prot)}g protein</span>
                  <span className={`flex items-center gap-1 font-medium ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{Math.round(macros.fat)}g fat</span>
                </div>
              )}
              {macros && (target || siblingMacros) && (
                <div className="mt-2">
                  <MacroTargetInfo
                    macros={macros}
                    target={target}
                    siblingMacros={siblingMacros}
                    siblingLabel={siblingLabel}
                    ingredients={ingredients}
                    ingredientLib={ingredientLib}
                    onAutoFit={onUpdateIngredient ? (id, qty) => onUpdateIngredient(slotKey, id, qty) : undefined}
                  />
                </div>
              )}
            </div>

            {ingredients.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pt-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ingredients</h3>
                  <div className="flex items-center gap-3">
                    {onRevertIngredients && hasAnyOverride(overrides) && (
                      <button
                        onClick={() => onRevertIngredients(slotKey)}
                        className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                      >
                        Revert to original
                      </button>
                    )}
                    <button
                      onClick={() => setPrepDays(d => d === null ? 1 : null)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                        prepDays !== null
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'border-brand-300 text-brand-600 dark:text-brand-400 dark:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                      }`}
                    >
                      Meal prep
                    </button>
                  </div>
                </div>

                {prepDays !== null && (
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">Days to prep:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPrepDays(d => Math.max(1, d - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-base"
                        >−</button>
                        <span className="text-lg font-bold text-gray-900 dark:text-white w-6 text-center tabular-nums">{prepDays}</span>
                        <button
                          onClick={() => setPrepDays(d => Math.min(14, d + 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-base"
                        >+</button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-brand-100 dark:border-brand-900/40 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                      <div className="px-3 py-2 bg-brand-50/60 dark:bg-brand-900/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide">Shopping list — {prepDays} day{prepDays !== 1 ? 's' : ''}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(macros.cal * prepDays)} kcal total</span>
                      </div>
                      {ingredients.map((ing, i) => {
                        const qty = parseFloat(ing.quantity_g) || 0
                        const totalQty = qty * prepDays
                        const libUnit = libraryUnit(ing, ingredientLib)
                        const unit = (ing.unit && ing.unit !== 'g') ? ing.unit : (libUnit && libUnit !== 'g') ? libUnit : 'g'
                        const displayQty = unit !== 'g'
                          ? (Number.isInteger(totalQty) ? totalQty : Math.round(totalQty * 10) / 10)
                          : Math.round(totalQty)
                        return (
                          <div key={ing.id || i} className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-gray-800 dark:text-gray-200">{ing.name}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">{displayQty}{unit}</span>
                          </div>
                        )
                      })}
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <span className={`flex items-center gap-0.5 ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{Math.round(macros.carb * prepDays)}g</span>
                          <span className={`flex items-center gap-0.5 ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{Math.round(macros.prot * prepDays)}g</span>
                          <span className={`flex items-center gap-0.5 ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{Math.round(macros.fat * prepDays)}g</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {ingredients.map((ing, i) => {
                    const libUnit = libraryUnit(ing, ingredientLib)
                    const unit = (ing.unit && ing.unit !== 'g') ? ing.unit : (libUnit && libUnit !== 'g') ? libUnit : 'g'
                    const isStatic = ing.is_static && !ing._isAdded
                    return (
                      <div key={ing._tempId || ing.id || i} className="flex items-center gap-2">
                        {onRemoveIngredient && !isStatic && (
                          <button
                            onClick={e => { e.stopPropagation(); onRemoveIngredient(slotKey, ing) }}
                            className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        {onRemoveIngredient && isStatic && (
                          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-amber-400" title="Static ingredient — cannot be removed">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{ing.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0 tabular-nums">
                          {onUpdateIngredient ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number" onFocus={e => e.target.select()}
                                min="0"
                                step="1"
                                disabled={isStatic}
                                value={Math.round((parseFloat(ing.quantity_g) || 0) * 10) / 10}
                                onChange={e => !isStatic && onUpdateIngredient(slotKey, ing._tempId || ing.id, parseFloat(e.target.value) || 0)}
                                onClick={e => e.stopPropagation()}
                                {...selectOnFocus}
                                className={`w-16 text-sm text-right border rounded-lg px-2 py-0.5 focus:outline-none tabular-nums ${
                                  isStatic
                                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 cursor-not-allowed'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-brand-400'
                                }`}
                              />
                              <span className="text-xs text-gray-400 dark:text-gray-500 w-6">{unit}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatAmount(ing, ingredientLib)}</span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
                          <span className="hidden sm:flex items-center gap-1.5 text-xs">
                            <span className={`flex items-center gap-0.5 ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{Math.round(parseFloat(ing.carbs_g) || 0)}</span>
                            <span className={`flex items-center gap-0.5 ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{Math.round(parseFloat(ing.protein_g) || 0)}</span>
                            <span className={`flex items-center gap-0.5 ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{Math.round(parseFloat(ing.fat_g) || 0)}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {onAddIngredient && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                    {showAddIngredient ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search ingredients…"
                            value={ingSearch}
                            onChange={e => setIngSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            className="input flex-1 text-sm py-1.5"
                          />
                          <button
                            onClick={() => { setShowAddIngredient(false); setIngSearch('') }}
                            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1.5 flex-shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                        {ingSearchResults.length > 0 ? (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            {ingSearchResults.map(lib => (
                              <button
                                key={lib.id}
                                onClick={() => { onAddIngredient(slotKey, lib); setIngSearch(''); setShowAddIngredient(false) }}
                                className="w-full text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-900/10 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                              >
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{lib.name}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {lib.serving_size || '?'}{lib.serving_unit || 'g'} · {Math.round(lib.calories_per_serving || 0)} kcal · {Math.round(lib.protein_per_serving || 0)}g P
                                </p>
                              </button>
                            ))}
                          </div>
                        ) : ingSearch.length >= 2 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No ingredients found</p>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddIngredient(true)}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add ingredient
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {meal?.instructions && (
              <div className="mt-4 pt-1">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">How to make it</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{meal.instructions.trim()}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 pb-2">
              <button
                onClick={() => { onSwap(slotKey, slotDef?.label || '', slotDef?.cat || ''); onClose() }}
                className="btn-primary flex-1"
              >
                Swap meal
              </button>
              {isCustom && onRevert && (
                <button onClick={() => { onRevert(slotKey); onClose() }} className="btn-secondary">
                  Revert
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => { onRemove(slotKey); onClose() }}
                  className="text-sm font-medium text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 px-3"
                >
                  Remove meal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Swap modal ───────────────────────────────────────────────────────────────

export function SwapModal({ slotKey, label, category, currentMealId, mealMap, mealsByCategory, tier, onSelect, onClose }) {
  const [search, setSearch] = useState('')

  const currentMacros = mealMacros(currentMealId, mealMap, tier, null) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const { cal: curCal, prot: curProt, carb: curCarb, fat: curFat } = currentMacros

  // Only offer meals from the same slot category — a breakfast slot should only ever swap to
  // another breakfast, never a lunch or dinner. Falls back to every meal only if this modal is
  // ever opened without a category (shouldn't happen from any current call site).
  const pool = category ? (mealsByCategory?.[category] || []) : Object.values(mealMap)

  const scored = pool
    .filter(m => m.id !== currentMealId)
    .map(m => {
      const mac = mealMacros(m.id, mealMap, tier, null) || { cal: 0, prot: 0, carb: 0, fat: 0 }
      const score = Math.abs(mac.cal - curCal) + Math.abs(mac.prot - curProt) * 4 + Math.abs(mac.carb - curCarb) * 2 + Math.abs(mac.fat - curFat) * 3
      return { ...m, macros: mac, score }
    })
    .sort((a, b) => a.score - b.score)

  const visible = search
    ? scored.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
    : scored

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Swap {label}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Sorted by closest macros</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            placeholder="Search meals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {visible.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No meals found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {visible.map(m => (
                <button key={m.id} onClick={() => onSelect(slotKey, m.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 flex-1 min-w-0 break-words">{m.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5 capitalize">{(m.category || '').replace('_', ' ')}</span>
                  </div>
                  {m.macros && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5 tabular-nums">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{Math.round(m.macros.cal)} kcal</span>
                      <span className="flex items-center gap-1.5">
                        <span className={`flex items-center gap-0.5 ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{Math.round(m.macros.carb)}g</span>
                        <span className={`flex items-center gap-0.5 ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{Math.round(m.macros.prot)}g</span>
                        <span className={`flex items-center gap-0.5 ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{Math.round(m.macros.fat)}g</span>
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
