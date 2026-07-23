import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { MEAL_SPLIT_CATEGORIES, MEAL_SPLIT_LABELS, DEFAULT_MEAL_SPLIT, normalizeMealSplit } from '../../lib/calorieSplit'
import { regenerateAllTiersForMeal } from '../../lib/calorieTierScaling'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Section({ title, description, children }) {
  return (
    <div className="card space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
      />
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        {label}
        {description && <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</span>}
      </label>
    </div>
  )
}

export default function CoachSettings() {
  const { profile, refetchProfile } = useAuth()

  // ── General settings ──────────────────────────────────────────────────────
  const [s, setS] = useState({
    // Client defaults
    default_access_weeks:        profile.default_access_weeks        ?? 12,
    allow_holiday_breaks:        profile.allow_holiday_breaks        ?? true,
    default_steps_target:        profile.default_steps_target        ?? 10000,
    default_water_target_litres: profile.default_water_target_litres ?? 2.5,
    default_sleep_target_hours:  profile.default_sleep_target_hours  ?? 8,
    // Check-in
    checkin_days:                profile.checkin_days                ?? ['Monday'],
    checkin_overdue_days:        profile.checkin_overdue_days        ?? 8,
    checkin_collect_measurements:profile.checkin_collect_measurements?? false,
    // Training
    default_training_days:       profile.default_training_days       ?? 4,
    deload_every_weeks:          profile.deload_every_weeks          ?? 8,
    // Meal plan
    calorie_tolerance:           profile.calorie_tolerance           ?? 50,
    protein_tolerance_g:         profile.protein_tolerance_g         ?? 5,
    carbs_tolerance_g:           profile.carbs_tolerance_g           ?? 10,
    fat_tolerance_g:             profile.fat_tolerance_g             ?? 5,
    calorie_cycling_enabled:     profile.calorie_cycling_enabled     ?? false,
    calorie_cycling_rest_pct:    profile.calorie_cycling_rest_pct    ?? 20,
    // Permissions
    clients_can_see_macros:      profile.clients_can_see_macros      ?? true,
    // Display
    unit_weight:                 profile.unit_weight                 ?? 'kg',
    unit_distance:               profile.unit_distance               ?? 'km',
    // Communication
    welcome_message:             profile.welcome_message             ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key, value) {
    setS(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleDay(day) {
    const current = s.checkin_days
    set('checkin_days', current.includes(day) ? current.filter(d => d !== day) : [...current, day])
  }

  async function handleSave(e) {
    e.preventDefault()
    if (s.checkin_days.length === 0) { alert('Select at least one check-in day.'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      default_access_weeks:         Number(s.default_access_weeks),
      allow_holiday_breaks:         s.allow_holiday_breaks,
      default_steps_target:         Number(s.default_steps_target),
      default_water_target_litres:  Number(s.default_water_target_litres),
      default_sleep_target_hours:   Number(s.default_sleep_target_hours),
      checkin_days:                 s.checkin_days,
      checkin_overdue_days:         Number(s.checkin_overdue_days),
      checkin_collect_measurements: s.checkin_collect_measurements,
      default_training_days:        Number(s.default_training_days),
      deload_every_weeks:           Number(s.deload_every_weeks),
      calorie_tolerance:            Number(s.calorie_tolerance),
      protein_tolerance_g:          Number(s.protein_tolerance_g),
      carbs_tolerance_g:            Number(s.carbs_tolerance_g),
      fat_tolerance_g:              Number(s.fat_tolerance_g),
      calorie_cycling_enabled:      s.calorie_cycling_enabled,
      calorie_cycling_rest_pct:     Number(s.calorie_cycling_rest_pct),
      clients_can_see_macros:       s.clients_can_see_macros,
      unit_weight:                  s.unit_weight,
      unit_distance:                s.unit_distance,
      welcome_message:              s.welcome_message,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { alert('Could not save: ' + error.message); return }
    await refetchProfile()
    setSaved(true)
  }

  // ── Calorie split (existing) ───────────────────────────────────────────────
  const [split, setSplit] = useState(normalizeMealSplit(profile.meal_split))
  const [savingSplit, setSavingSplit] = useState(false)
  const [savedSplit, setSavedSplit] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [recalcProgress, setRecalcProgress] = useState(null)
  const [recalcMsg, setRecalcMsg] = useState(false)

  const totalPct = MEAL_SPLIT_CATEGORIES.reduce((sum, cat) => sum + (Number(split[cat]) || 0), 0)
  const savedSplitValues = normalizeMealSplit(profile.meal_split)
  const isSplitDirty = MEAL_SPLIT_CATEGORIES.some(cat => Number(split[cat]) !== savedSplitValues[cat])

  function setPct(cat, value) {
    setSplit(prev => ({ ...prev, [cat]: value === '' ? '' : Number(value) }))
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
      alert(`Recalculated tiers for ${targets.length - failed.length} of ${targets.length} meals.\n\nFailed: ${failed.join(', ')}`)
    } else {
      setRecalcMsg(true)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings ✓</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your coaching preferences and defaults</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── New client defaults ── */}
        <Section
          title="New Client Defaults"
          description="Applied automatically when a new client joins via the intake form."
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Default plan length (weeks)">
              <input className="input" type="number" min={1} max={520}
                value={s.default_access_weeks}
                onChange={e => set('default_access_weeks', e.target.value)} />
            </Field>
            <Field label="Daily steps target">
              <input className="input" type="number" min={0} step={500}
                value={s.default_steps_target}
                onChange={e => set('default_steps_target', e.target.value)} />
            </Field>
            <Field label="Daily water target (litres)">
              <input className="input" type="number" min={0} max={10} step={0.25}
                value={s.default_water_target_litres}
                onChange={e => set('default_water_target_litres', e.target.value)} />
            </Field>
            <Field label="Daily sleep target (hours)">
              <input className="input" type="number" min={4} max={12} step={0.5}
                value={s.default_sleep_target_hours}
                onChange={e => set('default_sleep_target_hours', e.target.value)} />
            </Field>
          </div>
          <Toggle
            id="holiday_breaks"
            label="Allow clients to take holiday breaks"
            description="Clients can pause their plan during holidays without losing their remaining weeks."
            checked={s.allow_holiday_breaks}
            onChange={v => set('allow_holiday_breaks', v)}
          />
        </Section>

        {/* ── Check-in preferences ── */}
        <Section
          title="Check-in Preferences"
          description="When and what clients check in with each week."
        >
          <Field label="Expected check-in days">
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map(day => {
                const active = s.checkin_days.includes(day)
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
            {s.checkin_days.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">Select at least one day.</p>
            )}
          </Field>

          <Field label="Mark check-in as overdue after (days)" hint="Clients with no check-in in this many days are flagged on your dashboard.">
            <input className="input" type="number" min={1} max={30}
              value={s.checkin_overdue_days}
              onChange={e => set('checkin_overdue_days', e.target.value)} />
          </Field>

          <Toggle
            id="collect_measurements"
            label="Collect body measurements in check-ins by default"
            description="Adds waist and hips fields to the check-in form for new clients. Can be toggled per client."
            checked={s.checkin_collect_measurements}
            onChange={v => set('checkin_collect_measurements', v)}
          />
        </Section>

        {/* ── Training preferences ── */}
        <Section title="Training Preferences">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Default training days per week">
              <input className="input" type="number" min={1} max={7}
                value={s.default_training_days}
                onChange={e => set('default_training_days', e.target.value)} />
            </Field>
            <Field label="Deload every (weeks)" hint="How often to schedule a deload week in new training programmes.">
              <input className="input" type="number" min={1} max={24}
                value={s.deload_every_weeks}
                onChange={e => set('deload_every_weeks', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* ── Meal plan preferences ── */}
        <Section title="Meal Plan Preferences">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Meal matching tolerances</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">How far off a meal can be from a client's targets and still count as a match.</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Calories (± kcal)">
                <input className="input" type="number" min={0} max={500}
                  value={s.calorie_tolerance}
                  onChange={e => set('calorie_tolerance', e.target.value)} />
              </Field>
              <Field label="Protein (± g)">
                <input className="input" type="number" min={0} max={100}
                  value={s.protein_tolerance_g}
                  onChange={e => set('protein_tolerance_g', e.target.value)} />
              </Field>
              <Field label="Carbs (± g)">
                <input className="input" type="number" min={0} max={200}
                  value={s.carbs_tolerance_g}
                  onChange={e => set('carbs_tolerance_g', e.target.value)} />
              </Field>
              <Field label="Fat (± g)">
                <input className="input" type="number" min={0} max={100}
                  value={s.fat_tolerance_g}
                  onChange={e => set('fat_tolerance_g', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
            <Toggle
              id="calorie_cycling"
              label="Use calorie cycling"
              description="Clients eat fewer calories on rest days than training days."
              checked={s.calorie_cycling_enabled}
              onChange={v => set('calorie_cycling_enabled', v)}
            />
            {s.calorie_cycling_enabled && (
              <Field label="Rest day calorie reduction (%)" hint="e.g. 20 means rest days are 20% lower than training day targets.">
                <input className="input" type="number" min={5} max={50}
                  value={s.calorie_cycling_rest_pct}
                  onChange={e => set('calorie_cycling_rest_pct', e.target.value)} />
              </Field>
            )}
          </div>
        </Section>

        {/* ── Client permissions ── */}
        <Section title="Client Permissions" description="What clients can see in their own dashboard.">
          <Toggle
            id="clients_see_macros"
            label="Show calorie and macro targets to clients"
            description="When off, clients see their meal plan but not the specific numbers behind it."
            checked={s.clients_can_see_macros}
            onChange={v => set('clients_can_see_macros', v)}
          />
        </Section>

        {/* ── Display preferences ── */}
        <Section title="Display Preferences" description="Units used throughout the app.">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weight unit">
              <select className="input" value={s.unit_weight} onChange={e => set('unit_weight', e.target.value)}>
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
            </Field>
            <Field label="Distance unit">
              <select className="input" value={s.unit_distance} onChange={e => set('unit_distance', e.target.value)}>
                <option value="km">Kilometres (km)</option>
                <option value="miles">Miles</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Welcome message ── */}
        <Section
          title="Welcome Message"
          description="Shown to new clients when they first log in to the app."
        >
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="e.g. Welcome to your coaching portal! Here you'll find your meal plan, training programme, and weekly check-in. I'm excited to work with you — let's get started!"
            value={s.welcome_message}
            onChange={e => set('welcome_message', e.target.value)}
          />
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || s.checkin_days.length === 0}
            className="btn-primary"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>

      {/* ── Calorie split ── */}
      <form onSubmit={handleSaveSplit} className="card space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Daily Calorie Split</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            How each day's total calories are distributed across the 5 meal slots when generating calorie-tier versions of your meals.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MEAL_SPLIT_CATEGORIES.map(cat => (
            <div key={cat}>
              <label className="label">{MEAL_SPLIT_LABELS[cat]} %</label>
              <input className="input" type="number" min={0} max={100}
                value={split[cat]}
                onChange={e => setPct(cat, e.target.value)} />
            </div>
          ))}
        </div>

        {totalPct !== 100 && (
          <p className="text-xs text-amber-500">Split totals {totalPct}% — adjust so all 5 add up to 100%.</p>
        )}

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30 p-3 space-y-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Changing this won't update calorie tiers you've already generated — save your new split first, then recalculate below.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleRecalculateAll}
              disabled={recalculating || isSplitDirty || totalPct !== 100}
              className="btn-secondary"
              title={isSplitDirty ? 'Save your changes above first' : undefined}
            >
              {recalculating
                ? `Recalculating… ${recalcProgress?.done ?? 0}/${recalcProgress?.total ?? 0}`
                : 'Recalculate all calorie tiers'}
            </button>
            {isSplitDirty && <span className="text-xs text-amber-600 dark:text-amber-400">Save your changes first</span>}
            {recalcMsg && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Tiers recalculated</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={savingSplit || totalPct !== 100} className="btn-primary">
            {savingSplit ? 'Saving…' : 'Save split'}
          </button>
          <button type="button" onClick={() => { setSplit({ ...DEFAULT_MEAL_SPLIT }); setSavedSplit(false) }} className="btn-secondary">
            Reset to standard
          </button>
          {savedSplit && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  )
}
