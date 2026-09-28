import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatSigned } from './MealPlanView'
import { lookupBarcode } from '../lib/barcodeLookup'
import BarcodeScanner from './BarcodeScanner'

const EMPTY_MACROS = { cal: 0, prot: 0, carb: 0, fat: 0 }
const UNIT_OPTIONS = ['g', 'ml', 'unit', 'bar', 'tin', 'slice', 'scoop', 'cup']
const EMPTY_ADD_FORM = { title: '', brand: '', servingSize: '1', servingUnit: 'g', customUnit: '', calories: '', protein: '', carbs: '', fat: '' }

function addMacros(a, b) {
  return { cal: a.cal + b.cal, prot: a.prot + b.prot, carb: a.carb + b.carb, fat: a.fat + b.fat }
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// [start, end) ISO bounds for one calendar date (YYYY-MM-DD), so a treat logged on any given day —
// not just today — is found regardless of what time of day it happened.
function dayBounds(dateStr) {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(start); end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Lets a client log an "off plan" treat/snack (a chocolate bar, a drink, etc.) so it's tracked
 * against their day rather than just left out of the picture. Kept as its own always-available
 * card, same pattern as EverydayMealsClient — logs save immediately, no separate Save button.
 * `date` (YYYY-MM-DD, defaults to today) scopes which day's treats are shown/logged against, so
 * this works from the My Daily Plan page's own day navigation, not just "today". `planDailyTotal`
 * is the client's current totals from their actual meals for that day so "remaining" here reflects
 * what's actually left once both the day's meals AND its treats are accounted for — the whole point
 * being to see whether a treat still fits, not just how big the treat itself is.
 */
export default function ClientTreatLog({ clientId, coachId, ingredientLib, dailyMacroTargets, planDailyTotal, date }) {
  const dateStr = date || todayISO()
  const [treats, setTreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // ingredient id
  const [servings, setServings] = useState(1)
  const [saving, setSaving] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannedIng, setScannedIng] = useState(null) // ingredient-shaped object from a barcode lookup or manual add
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const [addFoodOpen, setAddFoodOpen] = useState(false)
  const [addForm, setAddForm] = useState({ ...EMPTY_ADD_FORM })
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  const [recentIds, setRecentIds] = useState([]) // this client's own most-recently-logged ingredient ids, deduped

  async function load() {
    const { start, end } = dayBounds(dateStr)
    const { data } = await supabase
      .from('client_treat_logs')
      .select('*')
      .eq('client_id', clientId)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: false })
    setTreats(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId, dateStr])

  // This client's own recent history (not scoped to `dateStr` — spans every day they've logged
  // anything) so the picker opens on what THEY actually reach for, rather than an arbitrary
  // alphabetical slice of the whole library that looked like suggested examples.
  useEffect(() => {
    if (!clientId) return
    supabase
      .from('client_treat_logs')
      .select('ingredient_id, logged_at')
      .eq('client_id', clientId)
      .not('ingredient_id', 'is', null)
      .order('logged_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const seen = new Set()
        const ids = []
        for (const row of (data || [])) {
          if (seen.has(row.ingredient_id)) continue
          seen.add(row.ingredient_id)
          ids.push(row.ingredient_id)
          if (ids.length >= 10) break
        }
        setRecentIds(ids)
      })
  }, [clientId])

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

  const recentIngredients = useMemo(
    () => recentIds.map(id => ingredientLib[id]).filter(Boolean),
    [recentIds, ingredientLib],
  )

  // Nothing shows until the client actually searches, other than their own recent adds — the
  // point being not to greet them with an arbitrary slice of the whole library that reads like
  // suggested examples.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return recentIngredients
    return ingredientList.filter(i => i.name.toLowerCase().includes(q)).slice(0, 25)
  }, [ingredientList, recentIngredients, search])

  const selectedIng = selected ? ingredientLib[selected] : null
  // Whichever way the client got here — searching the library, or scanning a barcode — the
  // "confirm quantity and log it" step below works off whichever one is actually populated.
  const confirmIng = selectedIng || scannedIng

  function closePicker() {
    setPickerOpen(false)
    setSearch('')
    setSelected(null)
    setServings(1)
    setScannedIng(null)
    setScanError('')
    setAddFoodOpen(false)
    setAddForm({ ...EMPTY_ADD_FORM })
    setAddError('')
  }

  function setAddField(field, value) { setAddForm(f => ({ ...f, [field]: value })) }

  const addFormValid = addForm.title.trim() && addForm.brand.trim()
    && parseFloat(addForm.servingSize) > 0 && addForm.servingUnit
    && addForm.calories !== '' && addForm.protein !== '' && addForm.carbs !== '' && addForm.fat !== ''

  // Goes straight into the coach's shared library as `pending_approval` — visible only to this
  // client (see client-submitted-foods-migration.sql's read policy) until the coach approves it,
  // at which point every other client of theirs can find and log it too. Logging it for today
  // doesn't wait on that: it's usable for this client's own log the moment it's saved.
  async function handleAddFood(e) {
    e.preventDefault()
    if (!addFormValid) { setAddError('Please fill in every field.'); return }
    setAddSaving(true)
    setAddError('')
    const { data: newIng, error } = await supabase.from('ingredients').insert({
      coach_id: coachId,
      name: addForm.title.trim(),
      product_brand: addForm.brand.trim(),
      category: 'snacks',
      serving_size: parseFloat(addForm.servingSize),
      serving_unit: addForm.servingUnit,
      calories_per_serving: parseFloat(addForm.calories) || 0,
      protein_per_serving: parseFloat(addForm.protein) || 0,
      carbs_per_serving: parseFloat(addForm.carbs) || 0,
      fat_per_serving: parseFloat(addForm.fat) || 0,
      pending_approval: true,
      submitted_by_client_id: clientId,
    }).select().single()
    setAddSaving(false)
    if (error) { setAddError('Could not save that. Please try again.'); return }
    setAddFoodOpen(false)
    setScannedIng({ ...newIng, name: `${newIng.name} (${newIng.product_brand})` })
  }

  async function handleBarcodeDetected(barcode) {
    setScannerOpen(false)
    setScanLoading(true)
    setScanError('')
    const ing = await lookupBarcode(barcode, coachId)
    setScanLoading(false)
    if (!ing) {
      setScanError("Couldn't find that product — try searching for it below instead.")
      setPickerOpen(true)
      return
    }
    setScannedIng(ing)
    setPickerOpen(true)
  }

  async function handleLog() {
    if (!confirmIng) return
    setSaving(true)
    const ratio = parseFloat(servings) || 0
    const row = {
      client_id: clientId,
      coach_id: coachId,
      ingredient_id: confirmIng.id || null,
      name: confirmIng.name,
      servings: ratio,
      calories: Math.round((confirmIng.calories_per_serving || 0) * ratio * 10) / 10,
      protein_g: Math.round((confirmIng.protein_per_serving || 0) * ratio * 10) / 10,
      carbs_g: Math.round((confirmIng.carbs_per_serving || 0) * ratio * 10) / 10,
      fat_g: Math.round((confirmIng.fat_per_serving || 0) * ratio * 10) / 10,
      // Logging against today uses the exact moment; logging against a different day (browsing
      // back/forward on My Daily Plan) has no "now" of its own, so it just lands at midday there.
      logged_at: dateStr === todayISO() ? new Date().toISOString() : `${dateStr}T12:00:00.000Z`,
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
              title="Scan a barcode"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m10-14h2a1 1 0 011 1v2m-3 12h2a1 1 0 001-1v-2M7 8v8m3-8v8m4-8v8m3-8v8" /></svg>
              Scan
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              + Log a treat
            </button>
          </div>
        )}
      </div>

      {scanLoading && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-1">Looking that up…</p>
      )}

      {pickerOpen && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-3 space-y-3">
          {!confirmIng ? (addFoodOpen ? (
            <form onSubmit={handleAddFood} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Add a food</p>
                <button type="button" onClick={() => setAddFoodOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Back to search</button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Your coach reviews new foods before they're added to the shared list — it still counts towards today either way.</p>
              <input type="text" value={addForm.title} onChange={e => setAddField('title', e.target.value)} placeholder="Title, e.g. Protein Bar" className="input-field text-sm" />
              <input type="text" value={addForm.brand} onChange={e => setAddField('brand', e.target.value)} placeholder="Brand, e.g. Grenade" className="input-field text-sm" />
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0.01" step="0.01"
                  value={addForm.servingSize}
                  onChange={e => setAddField('servingSize', e.target.value)}
                  placeholder="1"
                  className="input-field text-sm w-20"
                />
                <select value={addForm.servingUnit} onChange={e => setAddField('servingUnit', e.target.value)} className="input-field text-sm flex-1">
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">size these macros are for</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" step="1" value={addForm.calories} onChange={e => setAddField('calories', e.target.value)} placeholder="Calories" className="input-field text-sm" />
                <input type="number" min="0" step="0.1" value={addForm.protein} onChange={e => setAddField('protein', e.target.value)} placeholder="Protein (g)" className="input-field text-sm" />
                <input type="number" min="0" step="0.1" value={addForm.carbs} onChange={e => setAddField('carbs', e.target.value)} placeholder="Carbs (g)" className="input-field text-sm" />
                <input type="number" min="0" step="0.1" value={addForm.fat} onChange={e => setAddField('fat', e.target.value)} placeholder="Fat (g)" className="input-field text-sm" />
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <div className="flex items-center gap-2">
                <button type="submit" disabled={addSaving || !addFormValid} className="btn-primary py-1.5 px-4 text-sm disabled:opacity-50">{addSaving ? 'Saving…' : 'Add & log it'}</button>
                <button type="button" onClick={closePicker} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              {scanError && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{scanError}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search to add extra"
                  className="input-field text-sm"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
                  title="Scan a barcode"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m10-14h2a1 1 0 011 1v2m-3 12h2a1 1 0 001-1v-2M7 8v8m3-8v8m4-8v8m3-8v8" /></svg>
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {!search.trim() && filtered.length > 0 && (
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 pt-1">Recently added</p>
                )}
                {filtered.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">
                    {search.trim() ? 'No matches' : 'Search to find something to add'}
                  </p>
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
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setAddFoodOpen(true)} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">Can't find it? + Add a food</button>
                <button type="button" onClick={closePicker} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              </div>
            </>
          )) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{confirmIng.name}</p>
                <button type="button" onClick={() => { setSelected(null); setScannedIng(null) }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Change</button>
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
                <span className="text-xs text-gray-400 dark:text-gray-500">× {confirmIng.serving_size}{confirmIng.serving_unit}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((confirmIng.calories_per_serving || 0) * (parseFloat(servings) || 0))} kcal ·{' '}
                {Math.round((confirmIng.carbs_per_serving || 0) * (parseFloat(servings) || 0))}g C ·{' '}
                {Math.round((confirmIng.protein_per_serving || 0) * (parseFloat(servings) || 0))}g P ·{' '}
                {Math.round((confirmIng.fat_per_serving || 0) * (parseFloat(servings) || 0))}g F
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

      {(treatsTotal.cal > 0 || remaining) && (
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          {treatsTotal.cal > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Treats today</span>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Math.round(treatsTotal.cal)} kcal</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{Math.round(treatsTotal.carb)}g C · {Math.round(treatsTotal.prot)}g P · {Math.round(treatsTotal.fat)}g F</p>
              </div>
            </div>
          )}
          {remaining && (
            <>
              {treatsTotal.cal > 0 && <div className="border-t border-gray-100 dark:border-gray-800" />}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Remaining today{treatsTotal.cal > 0 ? ' (plan + treats)' : ''}</span>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${remaining.cal < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{formatSigned(remaining.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{formatSigned(remaining.carb)}g C · {formatSigned(remaining.prot)}g P · {formatSigned(remaining.fat)}g F</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
