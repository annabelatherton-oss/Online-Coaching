import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MEAL_SPLIT_CATEGORIES, MEAL_SPLIT_LABELS, DEFAULT_MEAL_SPLIT, normalizeMealSplit } from '../../lib/calorieSplit'
import { regenerateAllTiersForMeal } from '../../lib/calorieTierScaling'

export default function CoachSettings() {
  const { profile, refetchProfile } = useAuth()
  const [split, setSplit] = useState(normalizeMealSplit(profile.meal_split))
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcProgress, setRecalcProgress] = useState(null)
  const [recalcMsg, setRecalcMsg] = useState(false)

  const totalPct = MEAL_SPLIT_CATEGORIES.reduce((s, cat) => s + (Number(split[cat]) || 0), 0)
  const savedSplit = normalizeMealSplit(profile.meal_split)
  const isDirty = MEAL_SPLIT_CATEGORIES.some(cat => Number(split[cat]) !== savedSplit[cat])

  function setPct(cat, value) {
    setSplit(prev => ({ ...prev, [cat]: value === '' ? '' : Number(value) }))
    setSavedMsg(false)
    setRecalcMsg(false)
  }

  function resetToDefault() {
    setSplit({ ...DEFAULT_MEAL_SPLIT })
    setSavedMsg(false)
    setRecalcMsg(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ meal_split: split }).eq('id', profile.id)
    setSaving(false)
    if (error) { alert('Could not save: ' + error.message); return }
    await refetchProfile()
    setSavedMsg(true)
  }

  async function handleRecalculateAll() {
    setRecalculating(true)
    setRecalcMsg(false)
    const [{ data: meals, error }, { data: library }] = await Promise.all([
      supabase
        .from('meals')
        .select('id, name, category, meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id, scaling_type, unit, alternative_ingredient_ids)')
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
        await regenerateAllTiersForMeal(meal.id, meal.category, baseIngs, library || [], savedSplit)
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your coach-wide defaults</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
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
              disabled={recalculating || isDirty || totalPct !== 100}
              className="btn-secondary"
              title={isDirty ? 'Save your changes above first' : 'Rebuild every calorie-tier version in your Meal Library using the saved split'}
            >
              {recalculating
                ? `Recalculating… ${recalcProgress?.done ?? 0}/${recalcProgress?.total ?? 0}`
                : 'Recalculate all calorie tiers'}
            </button>
            {isDirty && <span className="text-xs text-amber-600 dark:text-amber-400">Save your changes first</span>}
            {recalcMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Tiers recalculated</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || totalPct !== 100} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={resetToDefault} className="btn-secondary">
            Reset to standard ({DEFAULT_MEAL_SPLIT.pre_workout}/{DEFAULT_MEAL_SPLIT.breakfast}/{DEFAULT_MEAL_SPLIT.lunch}/{DEFAULT_MEAL_SPLIT.dinner}/{DEFAULT_MEAL_SPLIT.evening_snack})
          </button>
          {savedMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  )
}
