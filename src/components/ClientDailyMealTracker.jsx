import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadDailyMealOptions } from '../lib/dailyMealOptions'
import { addMacros, getIngredients, sumIngredientMacros, normalizeOverrides, RecipeModal } from './MealPlanView'
import ClientTreatLog from './ClientTreatLog'

const EMPTY_MACROS = { cal: 0, prot: 0, carb: 0, fat: 0 }
const MEAL_CATS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
]

function findSlot(list, key) { return list.find(s => s.key === key) }

// A ticked slot's macros, with its day-only ingredient tweak (if any) applied on top of the
// already-resolved (tier + template + standing-week) ingredient list it was loaded with.
function effectiveMacros(slot, dayOverride) {
  if (!dayOverride) return slot.macros
  return sumIngredientMacros(getIngredients({ id: slot.key, meal_ingredients: slot.resolvedIngredients }, null, dayOverride))
}

function TickRow({ checked, label, name, cal, onToggle, onEdit }) {
  return (
    <div className={`flex items-center gap-1 rounded-lg transition-colors ${checked ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
      <button type="button" onClick={onToggle} className="flex-1 flex items-center justify-between gap-2 px-2 py-1.5 text-left min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            checked ? 'bg-brand-500 border-brand-500' : 'border-gray-300 dark:border-gray-600'
          }`}>
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{name}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{Math.round(cal)} kcal</span>
      </button>
      {checked && (
        <button type="button" onClick={onEdit} className="p-1.5 mr-1 text-gray-400 hover:text-brand-500 flex-shrink-0" title="Edit ingredients for today">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      )}
    </div>
  )
}

/**
 * The meal-tracking half of My Daily Plan. Option A and Option B meals are ticked individually —
 * a client might have Breakfast A but Lunch B — as are pre-workout and evening snack (shared
 * regardless of A/B), while the fixed Everyday meals set is ticked as a single whole-day toggle
 * since it's eaten as a standing unit rather than a per-meal choice. Once a meal is ticked, its
 * ingredients can be tweaked for that day only (an added side, a dropped item) without ever
 * touching the standing weekly plan or client_everyday_meals. `dateISO` drives everything here,
 * including which day's treats show below, so browsing to a different day on the week strip shows
 * and edits that day, not always today.
 */
export default function ClientDailyMealTracker({ clientId, dateISO }) {
  const [options, setOptions] = useState(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [ticks, setTicks] = useState({}) // slot_key -> eaten boolean
  const [overrides, setOverrides] = useState({}) // slot_key -> {qty, removed, added} | undefined
  const [dayLoading, setDayLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState(null) // { key, slot } | null

  useEffect(() => {
    if (!clientId) return
    loadDailyMealOptions(clientId).then(data => { setOptions(data); setOptionsLoading(false) })
  }, [clientId])

  useEffect(() => {
    if (!clientId || !dateISO) return
    setDayLoading(true)
    supabase.from('client_daily_meal_log').select('slot_key, eaten, ingredient_overrides').eq('client_id', clientId).eq('log_date', dateISO)
      .then(({ data }) => {
        const t = {}, o = {}
        for (const row of (data || [])) { t[row.slot_key] = row.eaten; if (row.ingredient_overrides) o[row.slot_key] = row.ingredient_overrides }
        setTicks(t)
        setOverrides(o)
        setDayLoading(false)
      })
  }, [clientId, dateISO])

  async function toggle(slotKey) {
    const next = !(ticks[slotKey] ?? false)
    setTicks(prev => ({ ...prev, [slotKey]: next }))
    await supabase.from('client_daily_meal_log').upsert(
      { client_id: clientId, log_date: dateISO, slot_key: slotKey, eaten: next, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,log_date,slot_key' },
    )
  }

  function saveOverride(slotKey, nextOverride) {
    setOverrides(prev => ({ ...prev, [slotKey]: nextOverride }))
    supabase.from('client_daily_meal_log').upsert(
      { client_id: clientId, log_date: dateISO, slot_key: slotKey, eaten: true, ingredient_overrides: nextOverride, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,log_date,slot_key' },
    )
  }

  function updateIngredient(slotKey, ingKey, newQty) {
    const existing = normalizeOverrides(overrides[slotKey])
    if (newQty <= 0) {
      if (existing.added.some(a => a._tempId === ingKey)) {
        saveOverride(slotKey, { ...existing, added: existing.added.filter(a => a._tempId !== ingKey) })
      } else {
        const qty = { ...existing.qty }; delete qty[ingKey]
        saveOverride(slotKey, { ...existing, qty, removed: [...new Set([...existing.removed, ingKey])] })
      }
      return
    }
    const matchAdded = existing.added.find(a => a._tempId === ingKey)
    if (matchAdded) {
      const origQty = parseFloat(matchAdded.quantity_g) || 0
      const ratio = origQty > 0 ? newQty / origQty : 1
      const updatedAdded = existing.added.map(a => a._tempId !== ingKey ? a : {
        ...a, quantity_g: newQty,
        calories:  Math.round((parseFloat(a.calories)  || 0) * ratio * 10) / 10,
        protein_g: Math.round((parseFloat(a.protein_g) || 0) * ratio * 10) / 10,
        carbs_g:   Math.round((parseFloat(a.carbs_g)   || 0) * ratio * 10) / 10,
        fat_g:     Math.round((parseFloat(a.fat_g)     || 0) * ratio * 10) / 10,
      })
      saveOverride(slotKey, { ...existing, added: updatedAdded })
      return
    }
    saveOverride(slotKey, { ...existing, qty: { ...existing.qty, [ingKey]: newQty } })
  }

  function removeIngredient(slotKey, ing) {
    const existing = normalizeOverrides(overrides[slotKey])
    const key = ing._tempId || ing.id
    if (ing._isAdded && existing.added.some(a => (a._tempId || a.id) === key)) {
      saveOverride(slotKey, { ...existing, added: existing.added.filter(a => (a._tempId || a.id) !== key) })
      return
    }
    saveOverride(slotKey, { ...existing, removed: [...existing.removed, ing.id] })
  }

  function addIngredient(slotKey, libIng) {
    const existing = normalizeOverrides(overrides[slotKey])
    const newIng = {
      _tempId: `added-${libIng.id}-${Date.now()}`,
      id: libIng.id,
      name: libIng.name,
      quantity_g: libIng.serving_size || 100,
      unit: libIng.serving_unit || 'g',
      calories:  libIng.calories_per_serving  || 0,
      protein_g: libIng.protein_per_serving   || 0,
      carbs_g:   libIng.carbs_per_serving     || 0,
      fat_g:     libIng.fat_per_serving       || 0,
      _isAdded: true,
    }
    saveOverride(slotKey, { ...existing, added: [...existing.added, newIng] })
  }

  function revertIngredients(slotKey) {
    saveOverride(slotKey, null)
  }

  if (optionsLoading || dayLoading) return null
  if (!options) return null // no active plan assignment yet

  let actualTotal = EMPTY_MACROS
  if (ticks.everyday) {
    for (const s of options.everyday) {
      actualTotal = addMacros(actualTotal, effectiveMacros(s, overrides[`everyday:${s.key}`]))
    }
  }
  for (const s of options.shared) {
    if (ticks[s.key]) actualTotal = addMacros(actualTotal, effectiveMacros(s, overrides[s.key]))
  }
  for (const cat of MEAL_CATS) {
    const aSlot = findSlot(options.optionA, cat.key)
    const bSlot = findSlot(options.optionB, cat.key)
    if (aSlot && ticks[`a:${cat.key}`]) actualTotal = addMacros(actualTotal, effectiveMacros(aSlot, overrides[`a:${cat.key}`]))
    if (bSlot && ticks[`b:${cat.key}`]) actualTotal = addMacros(actualTotal, effectiveMacros(bSlot, overrides[`b:${cat.key}`]))
  }

  const anyPlan = options.optionA.length > 0 || options.optionB.length > 0

  // Builds the synthetic single-meal map RecipeModal needs: its "meal" is just this slot's own
  // already-resolved ingredient list, so the day override is the only layer left to apply — the
  // exact same mechanism getIngredientsLayered itself uses to stack a client layer under a
  // template layer, just done here by hand for a third (day) layer.
  function openEditor(tickKey, slot) { setEditingSlot({ key: tickKey, slot }) }

  return (
    <div className="space-y-4">
      <div data-tour="daily-meals" className="card space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Meals</h2>

        {anyPlan && (
          <div className="space-y-3">
            {MEAL_CATS.map(cat => {
              const aSlot = findSlot(options.optionA, cat.key)
              const bSlot = findSlot(options.optionB, cat.key)
              if (!aSlot && !bSlot) return null
              return (
                <div key={cat.key} className="space-y-1">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2">{cat.label}</p>
                  {aSlot && (
                    <TickRow
                      checked={!!ticks[`a:${cat.key}`]}
                      label={`${cat.label} A`}
                      name={aSlot.name}
                      cal={effectiveMacros(aSlot, overrides[`a:${cat.key}`]).cal}
                      onToggle={() => toggle(`a:${cat.key}`)}
                      onEdit={() => openEditor(`a:${cat.key}`, aSlot)}
                    />
                  )}
                  {bSlot && (
                    <TickRow
                      checked={!!ticks[`b:${cat.key}`]}
                      label={`${cat.label} B`}
                      name={bSlot.name}
                      cal={effectiveMacros(bSlot, overrides[`b:${cat.key}`]).cal}
                      onToggle={() => toggle(`b:${cat.key}`)}
                      onEdit={() => openEditor(`b:${cat.key}`, bSlot)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {options.shared.length > 0 && (
          <div className="space-y-1">
            {options.shared.map(s => (
              <TickRow
                key={s.key}
                checked={!!ticks[s.key]}
                label={s.label}
                name={s.name}
                cal={effectiveMacros(s, overrides[s.key]).cal}
                onToggle={() => toggle(s.key)}
                onEdit={() => openEditor(s.key, s)}
              />
            ))}
          </div>
        )}

        {options.everyday.length > 0 && (
          <div className={`rounded-xl border p-3 space-y-2 ${ticks.everyday ? 'border-brand-400 dark:border-brand-600 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
            <button type="button" onClick={() => toggle('everyday')} className="w-full flex items-center gap-2.5 text-left">
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                ticks.everyday ? 'bg-brand-500 border-brand-500' : 'border-gray-300 dark:border-gray-600'
              }`}>
                {ticks.everyday && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                )}
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Everyday meals</p>
            </button>
            <div className="space-y-1 pl-[1.875rem]">
              {options.everyday.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-300 truncate">
                    <span className="text-gray-400 dark:text-gray-500">{s.label}: </span>{s.name}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(effectiveMacros(s, overrides[`everyday:${s.key}`]).cal)} kcal</span>
                    {ticks.everyday && (
                      <button type="button" onClick={() => openEditor(`everyday:${s.key}`, s)} className="p-1 text-gray-400 hover:text-brand-500" title="Edit ingredients for today">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!anyPlan && options.shared.length === 0 && options.everyday.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-2">No meal plan set up yet.</p>
        )}
      </div>

      <ClientTreatLog
        clientId={clientId}
        coachId={options.coachId}
        ingredientLib={options.ingredientLib}
        dailyMacroTargets={options.dailyMacroTargets}
        planDailyTotal={actualTotal}
        date={dateISO}
      />

      {editingSlot && (
        <RecipeModal
          slotKey={editingSlot.key}
          mealMap={{ [editingSlot.key]: {
            id: editingSlot.key,
            name: editingSlot.slot.name,
            category: editingSlot.slot.category,
            photo_url: editingSlot.slot.photoUrl,
            photo_position: editingSlot.slot.photoPosition,
            meal_ingredients: editingSlot.slot.resolvedIngredients,
          } }}
          editedSlots={{ [editingSlot.key]: editingSlot.key }}
          templateSlots={{ [editingSlot.key]: editingSlot.key }}
          tier={null}
          ingredientOverrides={{ [editingSlot.key]: overrides[editingSlot.key] }}
          mealsByCategory={{}}
          ingredientLib={options.ingredientLib}
          onClose={() => setEditingSlot(null)}
          onUpdateIngredient={updateIngredient}
          onRemoveIngredient={removeIngredient}
          onAddIngredient={addIngredient}
          onRevertIngredients={revertIngredients}
        />
      )}
    </div>
  )
}
