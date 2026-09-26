import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_MACROS = { cal: 0, prot: 0, carb: 0, fat: 0 }

function addMacros(a, b) {
  return { cal: a.cal + b.cal, prot: a.prot + b.prot, carb: a.carb + b.carb, fat: a.fat + b.fat }
}

function startOfTodayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Lets a client log an "off plan" treat/snack (a chocolate bar, a drink, etc.) so it's tracked
 * against their day rather than just left out of the picture. Kept as its own always-available
 * card, same pattern as EverydayMealsClient — logs save immediately, no separate Save button.
 * `planDailyTotal` is the client's current totals from their actual meal plan for today
 * (see ClientMealPlan.jsx's currentDailyTotal) so "remaining" here reflects what's actually left
 * once both the plan AND today's treats are accounted for — the whole point being to see whether
 * a treat still fits, not just how big the treat itself is.
 */
export default function ClientTreatLog({ clientId, coachId, ingredientLib, dailyMacroTargets, planDailyTotal }) {
  const [treats, setTreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // ingredient id
  const [servings, setServings] = useState(1)
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('client_treat_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('logged_at', startOfTodayISO())
      .order('logged_at', { ascending: false })
    setTreats(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  const ingredientList = useMemo(() => {
    const all = Object.values(ingredientLib || {})
    // Treats/snacks first, then everything else alphabetically — a client can still log anything
    // in the library (a treat isn't always officially tagged "snacks"), just not front and centre.
    return all.sort((a, b) => {
      const aSnack = a.category === 'snacks' ? 0 : 1
      const bSnack = b.category === 'snacks' ? 0 : 1
      if (aSnack !== bSnack) return aSnack - bSnack
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [ingredientLib])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q ? ingredientList.filter(i => i.name.toLowerCase().includes(q)) : ingredientList
    return base.slice(0, 25)
  }, [ingredientList, search])

  const selectedIng = selected ? ingredientLib[selected] : null

  function closePicker() {
    setPickerOpen(false)
    setSearch('')
    setSelected(null)
    setServings(1)
  }

  async function handleLog() {
    if (!selectedIng) return
    setSaving(true)
    const ratio = parseFloat(servings) || 0
    const row = {
      client_id: clientId,
      coach_id: coachId,
      ingredient_id: selectedIng.id,
      name: selectedIng.name,
      servings: ratio,
      calories: Math.round((selectedIng.calories_per_serving || 0) * ratio * 10) / 10,
      protein_g: Math.round((selectedIng.protein_per_serving || 0) * ratio * 10) / 10,
      carbs_g: Math.round((selectedIng.carbs_per_serving || 0) * ratio * 10) / 10,
      fat_g: Math.round((selectedIng.fat_per_serving || 0) * ratio * 10) / 10,
      logged_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('client_treat_logs').insert(row).select().single()
    setSaving(false)
    if (error) { window.alert('Could not log that treat. Please try again.'); return }
    setTreats(prev => [data, ...prev])
    closePicker()
  }

  async function handleRemove(id) {
    setTreats(prev => prev.filter(t => t.id !== id))
    await supabase.from('client_treat_logs').delete().eq('id', id)
  }

  if (loading) return null

  const treatsTotal = treats.reduce((acc, t) => addMacros(acc, {
    cal: t.calories || 0, prot: t.protein_g || 0, carb: t.carbs_g || 0, fat: t.fat_g || 0,
  }), EMPTY_MACROS)

  const remaining = dailyMacroTargets && planDailyTotal ? {
    cal:  Math.round(dailyMacroTargets.cal        - planDailyTotal.cal  - treatsTotal.cal),
    prot: Math.round(dailyMacroTargets.protein_g  - planDailyTotal.prot - treatsTotal.prot),
    carb: Math.round(dailyMacroTargets.carbs_g    - planDailyTotal.carb - treatsTotal.carb),
    fat:  Math.round(dailyMacroTargets.fat_g      - planDailyTotal.fat  - treatsTotal.fat),
  } : null

  return (
    <div data-tour="treat-log" className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Treats & extras</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Log anything off-plan so it still counts towards today.</p>
        </div>
        {!pickerOpen && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="btn-secondary py-1.5 px-3 text-xs flex-shrink-0"
          >
            + Log a treat
          </button>
        )}
      </div>

      {pickerOpen && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
          {!selectedIng ? (
            <>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search for a chocolate bar, drink, snack…"
                className="input-field text-sm"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">No matches</p>
                )}
                {filtered.map(ing => (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => setSelected(ing.id)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-gray-800 dark:text-gray-200">{ing.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{Math.round(ing.calories_per_serving || 0)} kcal / {ing.serving_size}{ing.serving_unit}</span>
                  </button>
                ))}
              </div>
              <button type="button" onClick={closePicker} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedIng.name}</p>
                <button type="button" onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Change</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-500 dark:text-gray-400">Quantity</label>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={servings}
                  onChange={e => setServings(e.target.value)}
                  className="input-field text-sm w-20 py-1"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500">× {selectedIng.serving_size}{selectedIng.serving_unit}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((selectedIng.calories_per_serving || 0) * (parseFloat(servings) || 0))} kcal ·{' '}
                {Math.round((selectedIng.carbs_per_serving || 0) * (parseFloat(servings) || 0))}g C ·{' '}
                {Math.round((selectedIng.protein_per_serving || 0) * (parseFloat(servings) || 0))}g P ·{' '}
                {Math.round((selectedIng.fat_per_serving || 0) * (parseFloat(servings) || 0))}g F
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleLog} disabled={saving} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Logging…' : 'Log it'}</button>
                <button type="button" onClick={closePicker} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {treats.length > 0 && (
        <div className="space-y-1.5">
          {treats.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <div>
                <span className="text-gray-800 dark:text-gray-200">{t.name}</span>
                {t.servings !== 1 && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">×{t.servings}</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(t.calories)} kcal</span>
                <button type="button" onClick={() => handleRemove(t.id)} className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {treatsTotal.cal > 0 && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Treats today</span>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(treatsTotal.cal)} kcal</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(treatsTotal.carb)}g C · {Math.round(treatsTotal.prot)}g P · {Math.round(treatsTotal.fat)}g F</p>
            </div>
          </div>
          {remaining && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Remaining today (plan + treats)</span>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${remaining.cal < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{remaining.cal} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{remaining.carb}g C · {remaining.prot}g P · {remaining.fat}g F</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
