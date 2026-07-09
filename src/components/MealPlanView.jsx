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
export const SWAP_CALORIE_TOLERANCE = 50

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round1(n) { return Math.round(n * 10) / 10 }

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
  const visible = removed.length ? ingredients.filter(ing => !removed.includes(ing.id)) : ingredients
  const withQty = visible.map(ing => {
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

export function mealMacros(mealId, mealMap, tier, overridesForSlot) {
  if (!mealId || !mealMap[mealId]) return null
  const meal = mealMap[mealId]
  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      if (!hasAnyOverride(overridesForSlot)) return { cal: parseFloat(v.calories) || 0, prot: parseFloat(v.protein_g) || 0, carb: parseFloat(v.carbs_g) || 0, fat: parseFloat(v.fat_g) || 0 }
      return sumIngredientMacros(applyIngredientOverrides(v.meal_tier_ingredients || [], overridesForSlot))
    }
  }
  return sumIngredientMacros(applyIngredientOverrides(meal.meal_ingredients || [], overridesForSlot))
}

export function getIngredients(meal, tier, overrides) {
  if (!meal) return []
  let base = meal.meal_ingredients || []
  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) base = v.meal_tier_ingredients || []
  }
  return applyIngredientOverrides(base, overrides)
}

export function addMacros(a, b) {
  const az = a || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const bz = b || { cal: 0, prot: 0, carb: 0, fat: 0 }
  return { cal: az.cal + bz.cal, prot: az.prot + bz.prot, carb: az.carb + bz.carb, fat: az.fat + bz.fat }
}

export function formatAmount(ing, ingredientLib) {
  const qty = parseFloat(ing.quantity_g)
  const libUnit = ing.ingredient_id && ingredientLib ? ingredientLib[ing.ingredient_id]?.serving_unit : null
  const unit = (ing.unit && ing.unit !== 'g') ? ing.unit : (libUnit && libUnit !== 'g') ? libUnit : ing.unit
  if (unit && unit !== 'g') {
    const n = Number.isInteger(qty) ? qty : Math.round(qty * 10) / 10
    return `${n} ${unit}`
  }
  return `${Math.round(qty)}g`
}

// ─── Meal card ────────────────────────────────────────────────────────────────

export function MealCard({ slotKey, label, optionLabel, cat, mealId, templateMealId, mealMap, mealsByCategory, tier, overrides, onSwap, onViewRecipe, ingredientLib }) {
  const meal = mealId ? mealMap[mealId] : null
  const ingredients = meal ? getIngredients(meal, tier, overrides) : []
  const macros = mealMacros(mealId, mealMap, tier, overrides)
  const isCustom = (mealId || null) !== (templateMealId || null)

  return (
    <div
      className="flex flex-row rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 cursor-pointer active:opacity-90"
      onClick={() => meal && onViewRecipe(slotKey)}
    >
      {/* Photo */}
      <div className="relative w-32 aspect-square bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
                  { val: Math.round(macros.cal), lbl: 'kcal' },
                  { val: Math.round(macros.carb) + 'g', lbl: 'carbs' },
                  { val: Math.round(macros.prot) + 'g', lbl: 'prot' },
                  { val: Math.round(macros.fat) + 'g', lbl: 'fat' },
                ].map(({ val, lbl }) => (
                  <div key={lbl}>
                    <p className="text-[10px] font-bold text-gray-900 dark:text-white tabular-nums">{val}</p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">{lbl}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">No meal set</p>
        )}

        {mealId && (
          <button
            onClick={e => { e.stopPropagation(); onSwap(slotKey, label, cat) }}
            className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-brand-500 flex items-center gap-1 self-start"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Swap
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Recipe detail modal ──────────────────────────────────────────────────────

export function RecipeModal({ slotKey, mealMap, editedSlots, tier, ingredientOverrides, templateSlots, mealsByCategory, ingredientLib, onClose, onSwap, onRevert }) {
  const mealId = editedSlots[slotKey]
  const meal = mealId ? mealMap[mealId] : null
  const overrides = ingredientOverrides[slotKey]
  const ingredients = meal ? getIngredients(meal, tier, overrides) : []
  const macros = mealMacros(mealId, mealMap, tier, overrides)
  const isCustom = (mealId || null) !== ((templateSlots[slotKey]) || null)
  const slotDef = ALL_SLOT_DEFS.find(s => s.key === slotKey)

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
                  <span className="text-gray-500 dark:text-gray-400">{Math.round(macros.carb)}g carbs</span>
                  <span className="text-gray-500 dark:text-gray-400">{Math.round(macros.prot)}g protein</span>
                  <span className="text-gray-500 dark:text-gray-400">{Math.round(macros.fat)}g fat</span>
                </div>
              )}
            </div>

            {ingredients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ingredients</h3>
                <div className="space-y-2">
                  {ingredients.map((ing, i) => (
                    <div key={ing.id || i} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{ing.name}</span>
                      <div className="flex items-center gap-3 flex-shrink-0 tabular-nums">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatAmount(ing, ingredientLib)}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                          {Math.round(parseFloat(ing.carbs_g) || 0)}c · {Math.round(parseFloat(ing.protein_g) || 0)}p · {Math.round(parseFloat(ing.fat_g) || 0)}f
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meal?.instructions && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">How to make it</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{meal.instructions}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Swap modal ───────────────────────────────────────────────────────────────

export function SwapModal({ slotKey, label, cat, currentMealId, mealMap, mealsByCategory, tier, onSelect, onClose }) {
  const options = mealsByCategory[cat] || []
  const currentMacros = mealMacros(currentMealId, mealMap, tier, null)
  const currentCal = currentMacros?.cal || 0
  const currentProt = currentMacros?.prot || 0

  const eligible = options
    .filter(m => m.id !== currentMealId)
    .map(m => ({ ...m, macros: mealMacros(m.id, mealMap, tier, null) }))
    .filter(m => Math.abs((m.macros?.cal || 0) - currentCal) <= SWAP_CALORIE_TOLERANCE)
    .sort((a, b) => Math.abs((a.macros?.prot || 0) - currentProt) - Math.abs((b.macros?.prot || 0) - currentProt))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Swap {label}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Within ±{SWAP_CALORIE_TOLERANCE} kcal · closest protein first</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {eligible.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No alternatives within ±{SWAP_CALORIE_TOLERANCE} kcal.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {eligible.map(m => (
                <button key={m.id} onClick={() => onSelect(slotKey, m.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors group">
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{m.name}</p>
                  {m.macros && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 tabular-nums">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{Math.round(m.macros.cal)} kcal</span>
                      <span>{Math.round(m.macros.carb)}g C · {Math.round(m.macros.prot)}g P · {Math.round(m.macros.fat)}g F</span>
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
