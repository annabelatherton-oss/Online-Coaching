import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MEAL_SPLIT_CATEGORIES, MEAL_SPLIT_LABELS, DEFAULT_MEAL_SPLIT, normalizeMealSplit } from '../../lib/calorieSplit'
import { regenerateAllTiersForMeal } from '../../lib/calorieTierScaling'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function CoachSettings() {
  const { profile, refetchProfile } = useAuth()

  // ── Meal calorie split (existing) ─────────────────────────────────────────
  const [split, setSplit] = useState(normalizeMealSplit(profile.meal_split))
  const [savingSplit, setSavingSplit] = useState(false)
  const [savedSplit, setSavedSplit] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcProgress, setRecalcProgress] = useState(null)
  const [recalcMsg, setRecalcMsg] = useState(false)

  const totalPct = MEAL_SPLIT_CATEGORIES.reduce((s, cat) => s + (Number(split[cat]) || 0), 0)
  const savedSplitValues = normalizeMealSplit(profile.meal_split)
  const isSplitDirty = MEAL_SPLIT_CATEGORIES.some(cat => Number(split[cat]) !== savedSplitValues[cat])

  function setPct(cat, value) {
    setSplit(prev => ({ ...prev, [cat]: value === '' ? '' : Number(value) }))
    setSavedSplit(false)
    setRecalcMsg(false)
  }

  function resetToDefault() {
    setSplit({ ...DEFAULT_MEAL_SPLIT })
    setSavedSplit(false)
    setRecalcMsg(false)
  }

  async function handleSaveSplit(e) {
    e.preventDefault()
    setSavingSplit(true)
    const { error } = await supabase.from('profiles').update({ meal_split: split }).eq('id', profile.id)
    setSavingSplit(false)
    if (error) { alert('Could not save: ' + error.message); return }
    await refetchProfile()
    setSavedSplit(true)
  }

  async function handleRecalculateAll() {
    setRecalculating(true)
    setRecalcMsg(false)
    const [{ data: meals, error }, { data: library }] = await Promise.all([
      supabase
        .from('meals')
        .select('id, name, category, meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id, scaling_type, unit, alternative_ingredient_ids, is_static)')
        .eq('coach_id', profile.id),
      supabase.from('ingredients').select('*').eq('coach_id', profile.id),
    ])
    if (error) { setRecalculating(false); alert('Could not load meals: ' + error.message); return }

    const targets = (meals || []).filter(m => m.category && (m.meal_ingredients || []).length > 0)
    setRecalcProgress({ done: 0, total: targets.length })
    const failed = []
    for (const meal of targets) {
      try {
        const baseIngs = (meal.meal_ingredients || []).map(ing => ({
          ...ing,
          alternatives: (ing.alternative_ingredient_ids || []).map(id => ({ ingredient_id: id })),
        }))
        await regenerateAllTiersForMeal(meal.id, meal.category, baseIngs, library || [], savedSplitValues)
      } catch (err) {
        console.error(`Failed to regenerate calorie tiers for "${meal.name}":`, err)
        failed.push(meal.name)
      }
      setRecalcProgress(p => ({ done: p.done + 1, total: p.total }))
    }
    setRecalculating(false)
    setRecalcProgress(null)
    if (failed.length > 0) {
      alert(`Recalculated tiers for ${targets.length - failed.length} of ${targets.length} meals.\n\nFailed: ${failed.join(', ')}\n\nCheck the browser console for error details.`)
    } else {
      setRecalcMsg(true)
    }
  }

  // ── General coach settings ────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    default_access_weeks:  profile.default_access_weeks  ?? 12,
    allow_holiday_breaks:  profile.allow_holiday_breaks  ?? true,
    checkin_days:          profile.checkin_days          ?? ['Monday'],
    calorie_tolerance:     profile.calorie_tolerance     ?? 50,
    protein_tolerance_g:   profile.protein_tolerance_g   ?? 5,
    carbs_tolerance_g:     profile.carbs_tolerance_g     ?? 10,
    fat_tolerance_g:       profile.fat_tolerance_g       ?? 5,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [savedSettings, setSavedSettings] = useState(false)

  function setSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSavedSettings(false)
  }

  function toggleDay(day) {
    const current = settings.checkin_days
    setSetting(
      'checkin_days',
      current.includes(day) ? current.filter(d => d !== day) : [...current, day]
    )
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    if (settings.checkin_days.length === 0) {
      alert('Select at least one check-in day.')
      return
    }
    setSavingSettings(true)
    const { error } = await supabase.from('profiles').update({
      default_access_weeks: Number(settings.default_access_weeks),
      allow_holiday_breaks: settings.allow_holiday_breaks,
      checkin_days:         settings.checkin_days,
      calorie_tolerance:    Number(settings.calorie_tolerance),
      protein_tolerance_g:  Number(settings.protein_tolerance_g),
      carbs_tolerance_g:    Number(settings.carbs_tolerance_g),
      fat_tolerance_g:      Number(settings.fat_tolerance_g),
    }).eq('id', profile.id)
    setSavingSettings(false)
    if (error) { alert('Could not save: ' + error.message); return }
    await refetchProfile()
    setSavedSettings(true)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your coach-wide defaults</p>
      </div>

      {/* ── General settings ── */}
      <form onSubmit={handleSaveSettings} className="space-y-4">

        {/* Client defaults */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Client Defaults</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default plan length (weeks)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={520}
                value={settings.default_access_weeks}
                onChange={e => setSetting('default_access_weeks', e.target.value)}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Applied to new clients when they join.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="holiday_breaks"
              type="checkbox"
              checked={settings.allow_holiday_breaks}
              onChange={e => setSetting('allow_holiday_breaks', e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="holiday_breaks" className="text-sm text-gray-700 dark:text-gray-300">
              Allow clients to take holiday breaks (pause their plan)
            </label>
          </div>
        </div>

        {/* Check-in days */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Check-in Days</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Which days of the week clients are expected to check in.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => {
              const active = settings.checkin_days.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              )
            })}
          </div>
          {settings.checkin_days.length === 0 && (
            <p className="text-xs text-amber-500">Select at least one day.</p>
          )}
        </div>

        {/* Meal matching tolerances */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Meal Matching Tolerances</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              How far off a meal can be from a client's targets and still count as a match.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Calories (± kcal)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={500}
                value={settings.calorie_tolerance}
                onChange={e => setSetting('calorie_tolerance', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Protein (± g)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={settings.protein_tolerance_g}
                onChange={e => setSetting('protein_tolerance_g', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Carbs (± g)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={200}
                value={settings.carbs_tolerance_g}
                onChange={e => setSetting('carbs_tolerance_g', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fat (± g)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={settings.fat_tolerance_g}
                onChange={e => setSetting('fat_tolerance_g', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={savingSettings || settings.checkin_days.length === 0}
            className="btn-primary"
          >
            {savingSettings ? 'Saving…' : 'Save settings'}
          </button>
          {savedSettings && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>

      {/* ── Calorie split (existing) ── */}
      <form onSubmit={handleSaveSplit} className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Daily Calorie Split</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Every calorie-tier version generated in your Meal Library apportions that tier's total calories across these 5 categories using this split, so each meal's category gets its own slice of the day.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MEAL_SPLIT_CATEGORIES.map(cat => (
            <div key={cat}>
              <label className="label">{MEAL_SPLIT_LABELS[cat]} %</label>
              <input className="input" type="number" min={0} max={100} value={split[cat]} onChange={e => setPct(cat, e.target.value)} />
            </div>
          ))}
        </div>

        {totalPct !== 100 && (
          <p className="text-xs text-amber-500">Split totals {totalPct}% — adjust so all 5 add up to 100%.</p>
        )}

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 p-3 space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Changing this won't update calorie tiers you've already generated — save your new split, then use "Recalculate all calorie tiers" below to rebuild every meal's tiers with it.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRecalculateAll}
              disabled={recalculating || isSplitDirty || totalPct !== 100}
              className="btn-secondary"
              title={isSplitDirty ? 'Save your changes above first' : 'Rebuild every calorie-tier version in your Meal Library using the saved split'}
            >
              {recalculating
                ? `Recalculating… ${recalcProgress?.done ?? 0}/${recalcProgress?.total ?? 0}`
                : 'Recalculate all calorie tiers'}
            </button>
            {isSplitDirty && <span className="text-xs text-amber-600 dark:text-amber-400">Save your changes first</span>}
            {recalcMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Tiers recalculated</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={savingSplit || totalPct !== 100} className="btn-primary">{savingSplit ? 'Saving…' : 'Save split'}</button>
          <button type="button" onClick={resetToDefault} className="btn-secondary">
            Reset to standard ({DEFAULT_MEAL_SPLIT.pre_workout}/{DEFAULT_MEAL_SPLIT.breakfast}/{DEFAULT_MEAL_SPLIT.lunch}/{DEFAULT_MEAL_SPLIT.dinner}/{DEFAULT_MEAL_SPLIT.evening_snack})
          </button>
          {savedSplit && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  )
}
