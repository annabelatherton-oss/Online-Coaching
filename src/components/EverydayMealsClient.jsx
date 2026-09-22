import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MealCard, RecipeModal, SwapModal, mealMacros, normalizeOverrides } from './MealPlanView'

// All 5 slots behave identically — the client can pick any of them directly, no coach approval
// needed. Same order the main plan shows its 5 meal categories in.
const ALL_EVERYDAY_SLOTS = [
  { key: 'breakfast1',    label: 'Breakfast',     cat: 'breakfast' },
  { key: 'lunch1',        label: 'Lunch',         cat: 'lunch' },
  { key: 'preworkout',    label: 'Pre-workout',   cat: 'pre_workout' },
  { key: 'dinner1',       label: 'Dinner',        cat: 'dinner' },
  { key: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
]

// MealCard/RecipeModal/SwapModal are the exact components the client already sees their planned
// meals through - reused here unmodified so an everyday meal looks and behaves the same way, with
// its photo, full ingredient list and quantities, and macros. RecipeModal looks up a slot's label
// via ALL_SLOT_DEFS (the main plan's own slot keys, e.g. 'breakfast1' = "Breakfast A") - prefixing
// these keys keeps them from colliding with that lookup, since an everyday meal isn't "Option A".
const prefix = key => `everyday:${key}`
const unprefix = key => key.replace(/^everyday:/, '')

/**
 * A separate, always-available section (not a mode toggle) where a client can pick one fixed
 * breakfast/lunch/pre-workout/dinner/evening-snack to eat every day, straight from the coach's
 * meal database — every slot picks and applies immediately, same as the main plan's own swap.
 */
export default function EverydayMealsClient({ clientId, mealMap, mealsByCategory, ingredientLib, tier, dailyMacroTargets, dietKeys }) {
  const [rows, setRows] = useState({}) // slot_type -> row
  const [loading, setLoading] = useState(true)
  const [recipeModal, setRecipeModal] = useState(null) // prefixed slot key
  const [swapModal, setSwapModal] = useState(null) // { slotKey (prefixed), label, cat }

  async function load() {
    const { data } = await supabase.from('client_everyday_meals').select('*').eq('client_id', clientId)
    const byType = {}
    for (const r of (data || [])) byType[r.slot_type] = r
    setRows(byType)
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function pickMeal(slotKey, mealId) {
    await supabase.from('client_everyday_meals').upsert(
      { client_id: clientId, slot_type: slotKey, meal_id: mealId || null, ingredient_overrides: {}, needs_coach_review: true, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,slot_type' }
    )
    await load()
  }

  async function persistOverrides(slotKey, overrides) {
    const row = rows[slotKey]
    if (!row?.id) return
    await supabase.from('client_everyday_meals').update({ ingredient_overrides: overrides }).eq('id', row.id)
  }

  function updateRowOverrides(slotKey, updater) {
    setRows(prev => {
      const row = prev[slotKey]
      if (!row) return prev
      const nextOverrides = updater(normalizeOverrides(row.ingredient_overrides))
      persistOverrides(slotKey, nextOverrides)
      return { ...prev, [slotKey]: { ...row, ingredient_overrides: nextOverrides } }
    })
  }

  // Lets a client tweak the ingredients/quantities within an everyday meal, same mechanism (and
  // same override shape) as their own planned meals — see handleUpdateIngredient etc. in
  // ClientMealPlan.jsx — just persisted straight to client_everyday_meals instead of a draft state
  // with its own Save button, since everything else in this section already saves immediately.
  function handleUpdateIngredient(prefixedKey, ingKey, newQty) {
    updateRowOverrides(unprefix(prefixedKey), existing => {
      const matchAdded = existing.added.find(a => a._tempId === ingKey)
      if (matchAdded) {
        const origQty = parseFloat(matchAdded.quantity_g) || 0
        const ratio = origQty > 0 ? newQty / origQty : 1
        const updatedAdded = existing.added.map(a => a._tempId !== ingKey ? a : {
          ...a,
          quantity_g: newQty,
          calories:  Math.round((parseFloat(a.calories)  || 0) * ratio * 10) / 10,
          protein_g: Math.round((parseFloat(a.protein_g) || 0) * ratio * 10) / 10,
          carbs_g:   Math.round((parseFloat(a.carbs_g)   || 0) * ratio * 10) / 10,
          fat_g:     Math.round((parseFloat(a.fat_g)     || 0) * ratio * 10) / 10,
        })
        return { ...existing, added: updatedAdded }
      }
      return { ...existing, qty: { ...existing.qty, [ingKey]: newQty } }
    })
  }

  function handleRemoveIngredient(prefixedKey, ing) {
    updateRowOverrides(unprefix(prefixedKey), existing => ing._isAdded
      ? { ...existing, added: existing.added.filter(a => a._tempId !== ing._tempId) }
      : { ...existing, removed: [...existing.removed, ing.id] })
  }

  function handleAddIngredient(prefixedKey, libIng) {
    const newIng = {
      _tempId: `added-${libIng.id}-${Date.now()}`,
      id: libIng.id,
      name: libIng.name,
      quantity_g: libIng.serving_size || 100,
      unit: libIng.serving_unit || 'g',
      calories:  libIng.calories_per_serving || 0,
      protein_g: libIng.protein_per_serving  || 0,
      carbs_g:   libIng.carbs_per_serving    || 0,
      fat_g:     libIng.fat_per_serving      || 0,
      _isAdded: true,
    }
    updateRowOverrides(unprefix(prefixedKey), existing => ({ ...existing, added: [...existing.added, newIng] }))
  }

  function handleRevertIngredients(prefixedKey) {
    updateRowOverrides(unprefix(prefixedKey), () => ({ qty: {}, removed: [], added: [] }))
  }

  function openSwap(slotKey, label, cat) {
    setSwapModal({ slotKey, label, cat })
  }

  // RecipeModal derives label/cat from the main plan's own slot defs, which don't know about
  // these prefixed keys — recomputed here from our own slot list instead.
  function openSwapFromModal(prefixedKey) {
    const realKey = unprefix(prefixedKey)
    const slotDef = ALL_EVERYDAY_SLOTS.find(s => s.key === realKey)
    if (!slotDef) return
    setRecipeModal(null)
    openSwap(prefixedKey, slotDef.label, slotDef.cat)
  }

  if (loading) return null

  // Shaped like the main plan's editedSlots/templateSlots/ingredientOverrides maps (keyed by the
  // prefixed slot key) so RecipeModal works here unmodified. templateSlots always matches
  // editedSlots — an everyday meal is never "swapped away from a template", it IS the client's own
  // choice, so no "Swapped"/"Revert" affordance ever shows for it.
  const editedSlots = {}, templateSlots = {}, ingredientOverrides = {}
  for (const slot of ALL_EVERYDAY_SLOTS) {
    const mealId = rows[slot.key]?.meal_id || null
    editedSlots[prefix(slot.key)] = mealId
    templateSlots[prefix(slot.key)] = mealId
    ingredientOverrides[prefix(slot.key)] = rows[slot.key]?.ingredient_overrides || null
  }

  const dailyTotal = ALL_EVERYDAY_SLOTS.reduce((acc, slot) => {
    const row = rows[slot.key]
    if (!row?.meal_id) return acc
    const m = mealMacros(row.meal_id, mealMap, null, row.ingredient_overrides) || { cal: 0, prot: 0, carb: 0, fat: 0 }
    return { cal: acc.cal + m.cal, prot: acc.prot + m.prot, carb: acc.carb + m.carb, fat: acc.fat + m.fat }
  }, { cal: 0, prot: 0, carb: 0, fat: 0 })

  const remaining = dailyMacroTargets ? {
    cal:  Math.round(dailyMacroTargets.cal - dailyTotal.cal),
    prot: Math.round(dailyMacroTargets.protein_g - dailyTotal.prot),
    carb: Math.round(dailyMacroTargets.carbs_g - dailyTotal.carb),
    fat:  Math.round(dailyMacroTargets.fat_g - dailyTotal.fat),
  } : null

  return (
    <div data-tour="everyday-meals" className="card space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Meals I eat every day</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fixed meals instead of the plan above.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_EVERYDAY_SLOTS.map(slot => {
          const row = rows[slot.key]
          const mealId = row?.meal_id || null
          if (!mealId) {
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => openSwap(prefix(slot.key), slot.label, slot.cat)}
                className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 py-6 text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">{slot.label}</span>
                <span className="text-xs">+ Choose a meal</span>
              </button>
            )
          }
          return (
            <MealCard
              key={slot.key}
              slotKey={prefix(slot.key)}
              label={slot.label}
              cat={slot.cat}
              mealId={mealId}
              templateMealId={mealId}
              mealMap={mealMap}
              mealsByCategory={mealsByCategory}
              tier={tier}
              overrides={row.ingredient_overrides}
              onSwap={(slotKey, label, cat) => openSwap(slotKey, label, cat)}
              onViewRecipe={setRecipeModal}
              ingredientLib={ingredientLib}
            />
          )
        })}
      </div>

      {dailyTotal.cal > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Daily total</span>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(dailyTotal.cal)} kcal</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(dailyTotal.carb)}g C · {Math.round(dailyTotal.prot)}g P · {Math.round(dailyTotal.fat)}g F</p>
            </div>
          </div>
          {remaining && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Remaining to target</span>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${remaining.cal < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{remaining.cal} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{remaining.carb}g C · {remaining.prot}g P · {remaining.fat}g F</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {recipeModal && (
        <RecipeModal
          slotKey={recipeModal}
          mealMap={mealMap}
          editedSlots={editedSlots}
          tier={tier}
          ingredientOverrides={ingredientOverrides}
          templateSlots={templateSlots}
          mealsByCategory={mealsByCategory}
          ingredientLib={ingredientLib}
          onClose={() => setRecipeModal(null)}
          onSwap={(slotKey) => openSwapFromModal(slotKey)}
          onUpdateIngredient={handleUpdateIngredient}
          onRemoveIngredient={handleRemoveIngredient}
          onAddIngredient={handleAddIngredient}
          onRevertIngredients={handleRevertIngredients}
        />
      )}

      {swapModal && (
        <SwapModal
          slotKey={swapModal.slotKey}
          label={swapModal.label}
          category={swapModal.cat}
          currentMealId={editedSlots[swapModal.slotKey]}
          mealMap={mealMap}
          mealsByCategory={mealsByCategory}
          tier={tier}
          dietKeys={dietKeys}
          onSelect={(slotKey, mealId) => {
            pickMeal(unprefix(slotKey), mealId)
            setSwapModal(null)
          }}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  )
}
