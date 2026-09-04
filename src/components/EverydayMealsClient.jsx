import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getIngredients, mealMacros, formatAmount } from './MealPlanView'

const DIRECT_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast', cat: 'breakfast' },
  { key: 'lunch1', label: 'Lunch', cat: 'lunch' },
  { key: 'dinner1', label: 'Dinner', cat: 'dinner' },
]
const REQUEST_SLOTS = [
  { key: 'preworkout', label: 'Pre-workout', cat: 'pre_workout' },
  { key: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
]

/**
 * A separate, always-available section (not a mode toggle) where a client can pick one fixed
 * breakfast/lunch/dinner to eat every day, straight from the coach's meal database. Pre-workout
 * and evening snack can only be *requested* — the coach approves or declines before it takes
 * effect, since those are more tightly tied to training and the coach wants control over them.
 */
export default function EverydayMealsClient({ clientId, mealMap, mealsByCategory, ingredientLib, tier }) {
  const [rows, setRows] = useState({}) // slot_type -> row
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null) // slot key currently showing its ingredient list
  const [requesting, setRequesting] = useState(null) // slot key currently showing the "request" picker
  const [requestPick, setRequestPick] = useState('')
  const [saving, setSaving] = useState('')

  async function load() {
    const { data } = await supabase.from('client_everyday_meals').select('*').eq('client_id', clientId)
    const byType = {}
    for (const r of (data || [])) byType[r.slot_type] = r
    setRows(byType)
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function pickDirect(slotKey, mealId) {
    setSaving(slotKey)
    await supabase.from('client_everyday_meals').upsert(
      { client_id: clientId, slot_type: slotKey, meal_id: mealId || null, needs_coach_review: true, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,slot_type' }
    )
    await load()
    setSaving('')
  }

  async function sendRequest(slotKey) {
    if (!requestPick) return
    setSaving(slotKey)
    await supabase.from('client_everyday_meals').upsert(
      { client_id: clientId, slot_type: slotKey, requested_meal_id: requestPick, needs_coach_review: true, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,slot_type' }
    )
    setRequesting(null); setRequestPick('')
    await load()
    setSaving('')
  }

  async function cancelRequest(slotKey) {
    setSaving(slotKey)
    await supabase.from('client_everyday_meals').update({ requested_meal_id: null, needs_coach_review: false }).eq('client_id', clientId).eq('slot_type', slotKey)
    await load()
    setSaving('')
  }

  if (loading) return null

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Meals I eat every day</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Pick a breakfast, lunch and dinner you're happy to have every day instead of following the plan above — your coach can fine-tune the portions once you've chosen. Pre-workout and evening snack can be requested, but your coach needs to approve the change first.
        </p>
      </div>

      <div className="space-y-3">
        {DIRECT_SLOTS.map(slot => {
          const row = rows[slot.key]
          const mealId = row?.meal_id || ''
          const options = mealsByCategory[slot.cat] || []
          const macros = mealId ? mealMacros(mealId, mealMap, tier, row?.ingredient_overrides) : null
          const ingredients = mealId ? getIngredients(mealMap[mealId], tier, row?.ingredient_overrides) : []
          const isExpanded = expanded === slot.key
          return (
            <div key={slot.key} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-20 flex-shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{slot.label}</span>
                <select
                  className="flex-1 min-w-0 w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5"
                  value={mealId}
                  disabled={saving === slot.key}
                  onChange={e => pickDirect(slot.key, e.target.value)}
                >
                  <option value="">— Choose a meal —</option>
                  {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              {mealId && (
                <div className="sm:pl-[5.75rem] flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  {macros && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums min-w-0 break-words">
                      {Math.round(macros.cal)} kcal · {Math.round(macros.carb)}g C · {Math.round(macros.prot)}g P · {Math.round(macros.fat)}g F
                    </p>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : slot.key)} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 flex-shrink-0">
                    {isExpanded ? 'Hide ingredients' : 'View ingredients'}
                  </button>
                </div>
              )}
              {isExpanded && (
                <div className="sm:pl-[5.75rem] space-y-1">
                  {ingredients.map((ing, i) => (
                    <div key={ing.id || i} className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="text-gray-600 dark:text-gray-400 min-w-0 break-words">{ing.name}</span>
                      <span className="text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">{formatAmount(ing, ingredientLib)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {REQUEST_SLOTS.map(slot => {
          const row = rows[slot.key]
          const currentMeal = row?.meal_id ? mealMap[row.meal_id] : null
          const requestedMeal = row?.requested_meal_id ? mealMap[row.requested_meal_id] : null
          const options = mealsByCategory[slot.cat] || []
          return (
            <div key={slot.key} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{slot.label}</span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{currentMeal ? currentMeal.name : <span className="text-gray-400 italic">Not set yet</span>}</p>
                </div>
                {!requestedMeal && requesting !== slot.key && (
                  <button onClick={() => { setRequesting(slot.key); setRequestPick('') }} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 flex-shrink-0 whitespace-nowrap">
                    {currentMeal ? 'Request a different one' : 'Request a meal'}
                  </button>
                )}
              </div>
              {requestedMeal && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1.5">
                  <p className="text-xs text-amber-700 dark:text-amber-400">Requested: <span className="font-medium">{requestedMeal.name}</span> — waiting on your coach</p>
                  <button onClick={() => cancelRequest(slot.key)} disabled={saving === slot.key} className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex-shrink-0">Cancel</button>
                </div>
              )}
              {requesting === slot.key && (
                <div className="flex items-center gap-2 min-w-0">
                  <select className="flex-1 min-w-0 w-full text-sm text-gray-800 dark:text-gray-200 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5" value={requestPick} onChange={e => setRequestPick(e.target.value)}>
                    <option value="">— Choose a meal —</option>
                    {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button onClick={() => sendRequest(slot.key)} disabled={!requestPick || saving === slot.key} className="btn-primary py-1.5 px-3 text-xs flex-shrink-0">Send</button>
                  <button onClick={() => setRequesting(null)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
