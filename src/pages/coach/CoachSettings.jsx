import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MEAL_SPLIT_CATEGORIES, MEAL_SPLIT_LABELS, DEFAULT_MEAL_SPLIT, normalizeMealSplit } from '../../lib/calorieSplit'

export default function CoachSettings() {
  const { profile, refetchProfile } = useAuth()
  const [split, setSplit] = useState(normalizeMealSplit(profile.meal_split))
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  const totalPct = MEAL_SPLIT_CATEGORIES.reduce((s, cat) => s + (Number(split[cat]) || 0), 0)

  function setPct(cat, value) {
    setSplit(prev => ({ ...prev, [cat]: value === '' ? '' : Number(value) }))
    setSavedMsg(false)
  }

  function resetToDefault() {
    setSplit({ ...DEFAULT_MEAL_SPLIT })
    setSavedMsg(false)
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

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Changing this won't update calorie tiers you've already generated. Afterwards, regenerate a meal's tiers from its Calorie Tiers tab (or run "Create missing tiers" in the Meal Library) to apply the new split.
          </p>
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
