import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MealCard, RecipeModal, SwapModal, mealMacros, normalizeOverrides } from './MealPlanView'

const DIRECT_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast', cat: 'breakfast' },
  { key: 'lunch1', label: 'Lunch', cat: 'lunch' },
  { key: 'dinner1', label: 'Dinner', cat: 'dinner' },
]
const REQUEST_SLOTS = [
  { key: 'preworkout', label: 'Pre-workout', cat: 'pre_workout' },
  { key: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
]
const ALL_EVERYDAY_SLOTS = [...DIRECT_SLOTS, ...REQUEST_SLOTS]

// MealCard/RecipeModal/SwapModal are the exact components the client already sees their planned
// meals through - reused here unmodified so an everyday meal looks and behaves the same way, with
// its photo, full ingredient list and quantities, and macros. RecipeModal looks up a slot's label
// via ALL_SLOT_DEFS (the main plan's own slot keys, e.g. 'breakfast1' = "Breakfast A") - prefixing
// these keys keeps them from colliding with that lookup, since an everyday meal isn't "Option A".
const prefix = key => `everyday:${key}`
const unprefix = key => key.replace(/^everyday:/, '')

/**
 * A separate, always-available section (not a mode toggle) where a client can pick one fixed
 * breakfast/lunch/dinner to eat every day, straight from the coach's meal database. Pre-workout
 * and evening snack can only be *requested* — the coach approves or declines before it takes
 * effect, since those are more tightly tied to training and the coach wants control over them.
 */
export default function EverydayMealsClient({ clientId, mealMap, mealsByCategory, ingredientLib, tier, dailyMacroTargets, mainPlanSlots }) {
  const [rows, setRows] = useState({}) // slot_type -> row
  const [loading, setLoading] = useState(true)
  const [recipeModal, setRecipeModal] = useState(null) // prefixed slot key
  const [swapModal, setSwapModal] = useState(null) // { slotKey (prefixed), label, cat, mode: 'direct' | 'request' }

  async function load() {
    const { data } = await supabase.from('client_everyday_meals').select('*').eq('client_id', clientId)
    const byType = {}
    for (const r of (data || [])) byType[r.slot_type] = r
    setRows(byType)
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function pickDirect(slotKey, mealId) {
    await supabase.from('client_everyday_meals').upsert(
      { client_id: clientId, slot_type: slotKey, meal_id: mealId || null, ingredient_overrides: {}, needs_coach_review: true, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,slot_type' }
    )
    await load()
  }

  async function sendRequest(slotKey, mealId) {
    await supabase.from('client_everyday_meals').upsert(
      { client_id: clientId, slot_type: slotKey, requested_meal_id: mealId, needs_coach_review: true, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,slot_type' }
    )
    await load()
  }

  async function cancelRequest(slotKey) {
    await supabase.from('client_everyday_meals').update({ requested_meal_id: null, needs_coach_review: false }).eq('client_id', clientId).eq('slot_type', slotKey)
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

  function openSwap(slotKey, label, cat, mode) {
    setSwapModal({ slotKey, label, cat, mode })
  }

  // RecipeModal derives label/cat from the main plan's own slot defs, which don't know about
  // these prefixed keys — recomputed here from our own slot list instead.
  function openSwapFromModal(prefixedKey) {
    const realKey = unprefix(prefixedKey)
    const slotDef = ALL_EVERYDAY_SLOTS.find(s => s.key === realKey)
    if (!slotDef) return
    setRecipeModal(null)
    openSwap(prefixedKey, slotDef.label, slotDef.cat, DIRECT_SLOTS.some(s => s.key === realKey) ? 'direct' : 'request')
  }

  if (loading) return null

  // Shaped like the main plan's editedSlots/templateSlots/ingredientOverrides maps (keyed by the
  // prefixed slot key) so RecipeModal works here unmodified. templateSlots always matches
  // editedSlots — an everyday meal is never "swapped away from a template", it IS the client's own
  // choice, so no "Swapped"/"Revert" affordance ever shows for it.
  const editedSlots = {}, templateSlots = {}, ingredientOverrides = {}
  for (const slot of ALL_EVERYDAY_SLOTS) {
    const e = effectiveEverydayMeal(slot)
    editedSlots[prefix(slot.key)] = e.mealId
    templateSlots[prefix(slot.key)] = e.mealId
    ingredientOverrides[prefix(slot.key)] = e.overrides
  }

  // Pre-workout/evening snack are request-only here — nothing is saved to client_everyday_meals
  // for them until a request is made AND approved, so most clients have nothing set even though
  // they're still eating whatever their actual plan currently has for that slot every day. Falling
  // back to the main plan's current meal for just these two is what makes "remaining" reflect the
  // client's real full day instead of silently treating pre-workout/snack as 0 kcal.
  function effectiveEverydayMeal(slot) {
    const row = rows[slot.key]
    if (row?.meal_id) return { mealId: row.meal_id, overrides: row.ingredient_overrides, tier: null, isFallback: false }
    const fallback = REQUEST_SLOTS.includes(slot) ? mainPlanSlots?.[slot.key] : null
    if (fallback?.mealId) return { mealId: fallback.mealId, overrides: fallback.overrides, tier, isFallback: true }
    return { mealId: null, overrides: null, tier: null, isFallback: false }
  }

  const dailyTotal = ALL_EVERYDAY_SLOTS.reduce((acc, slot) => {
    const e = effectiveEverydayMeal(slot)
    if (!e.mealId) return acc
    const m = mealMacros(e.mealId, mealMap, e.tier, e.overrides) || { cal: 0, prot: 0, carb: 0, fat: 0 }
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Pick a breakfast, lunch and dinner you're happy to have every day instead of following the plan above — your coach can fine-tune the portions once you've chosen. Pre-workout and evening snack can be requested, but your coach needs to approve the change first.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DIRECT_SLOTS.map(slot => {
          const row = rows[slot.key]
          const mealId = row?.meal_id || null
          if (!mealId) {
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => openSwap(prefix(slot.key), slot.label, slot.cat, 'direct')}
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
              onSwap={(slotKey, label, cat) => openSwap(slotKey, label, cat, 'direct')}
              onViewRecipe={setRecipeModal}
              ingredientLib={ingredientLib}
            />
          )
        })}
      </div>

      <div className="space-y-3">
        {REQUEST_SLOTS.map(slot => {
          const row = rows[slot.key]
          const effective = effectiveEverydayMeal(slot)
          const requestedMeal = row?.requested_meal_id ? mealMap[row.requested_meal_id] : null
          return (
            <div key={slot.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {slot.label}{effective.isFallback && <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal normal-case italic">(from your plan)</span>}
                </span>
                {!requestedMeal && (
                  <button
                    onClick={() => openSwap(prefix(slot.key), slot.label, slot.cat, 'request')}
                    className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 flex-shrink-0 whitespace-nowrap"
                  >
                    {effective.mealId ? 'Request a different one' : 'Request a meal'}
                  </button>
                )}
              </div>
              {requestedMeal && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1.5">
                  <p className="text-xs text-amber-700 dark:text-amber-400">Requested: <span className="font-medium">{requestedMeal.name}</span> — waiting on your coach</p>
                  <button onClick={() => cancelRequest(slot.key)} className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0">Cancel</button>
                </div>
              )}
              {effective.mealId ? (
                <MealCard
                  slotKey={prefix(slot.key)}
                  label={slot.label}
                  cat={slot.cat}
                  mealId={effective.mealId}
                  templateMealId={effective.mealId}
                  mealMap={mealMap}
                  mealsByCategory={mealsByCategory}
                  tier={effective.tier}
                  overrides={effective.overrides}
                  onSwap={(slotKey, label, cat) => openSwap(slotKey, label, cat, 'request')}
                  onViewRecipe={setRecipeModal}
                  ingredientLib={ingredientLib}
                />
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">Not set yet</p>
              )}
            </div>
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
          onSelect={(slotKey, mealId) => {
            const realKey = unprefix(slotKey)
            if (swapModal.mode === 'request') sendRequest(realKey, mealId)
            else pickDirect(realKey, mealId)
            setSwapModal(null)
          }}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  )
}
