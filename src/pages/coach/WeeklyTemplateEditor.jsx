import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const SLOT_TYPES = [
  { value: 'breakfast1',    label: 'Breakfast' },
  { value: 'breakfast2',    label: 'Alt. Breakfast' },
  { value: 'lunch1',        label: 'Lunch' },
  { value: 'lunch2',        label: 'Alt. Lunch' },
  { value: 'dinner1',       label: 'Dinner' },
  { value: 'dinner2',       label: 'Alt. Dinner' },
  { value: 'preworkout',    label: 'Pre-Workout' },
  { value: 'evening_snack', label: 'Evening Snack' },
]

// The client eats one of each interchangeable pair per day, not both — Option 1 is the
// primary day, Option 2 is the alternate day, both sharing the same pre-workout/evening snack.
const OPTION_1_SLOTS = ['breakfast1', 'lunch1', 'dinner1', 'preworkout', 'evening_snack']
const OPTION_2_SLOTS = ['breakfast2', 'lunch2', 'dinner2', 'preworkout', 'evening_snack']
const OVER_TARGET_TOLERANCE = 50

const MEAL_CATEGORY_ORDER = ['breakfast', 'lunch', 'dinner', 'pre_workout', 'snack', 'evening_snack']

const EMPTY_SLOTS = Object.fromEntries(
  SLOT_TYPES.map(s => [s.value, { meal_id: '', scaled_version_id: '' }])
)

export default function WeeklyTemplateEditor() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isNew = templateId === 'new' || !templateId

  const [form, setForm] = useState({ name: '', week_number: '', calorie_target: '' })
  const [slots, setSlots] = useState(EMPTY_SLOTS)
  const [meals, setMeals] = useState([])
  const [mealsById, setMealsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setSlot(slotType, field, value) {
    setSlots(prev => ({
      ...prev,
      [slotType]: {
        ...prev[slotType],
        [field]: value,
        // clear version when meal changes
        ...(field === 'meal_id' ? { scaled_version_id: '' } : {}),
      },
    }))
  }

  async function load() {
    const mealsRes = await supabase
      .from('meals')
      .select('id, name, category, meal_ingredients(calories), meal_scaled_versions(id, calorie_target)')
      .eq('coach_id', profile.id)
      .order('name')

    const mealData = (mealsRes.data || []).map(m => ({
      ...m,
      _totalCals: Math.round((m.meal_ingredients || []).reduce((s, i) => s + (parseFloat(i.calories) || 0), 0)),
    }))
    setMeals(mealData)
    const byId = Object.fromEntries(mealData.map(m => [m.id, m]))
    setMealsById(byId)

    if (!isNew) {
      const [tmplRes, slotsRes] = await Promise.all([
        supabase.from('weekly_templates').select('*').eq('id', templateId).single(),
        supabase.from('template_meal_slots').select('*').eq('template_id', templateId),
      ])
      if (tmplRes.data) {
        setForm({
          name: tmplRes.data.name,
          week_number: tmplRes.data.week_number != null ? String(tmplRes.data.week_number) : '',
          calorie_target: tmplRes.data.calorie_target != null ? String(tmplRes.data.calorie_target) : '',
        })
      }
      if (slotsRes.data) {
        const rebuilt = { ...EMPTY_SLOTS }
        for (const row of slotsRes.data) {
          if (rebuilt[row.slot_type] !== undefined) {
            rebuilt[row.slot_type] = {
              meal_id: row.meal_id || '',
              scaled_version_id: row.scaled_version_id || '',
            }
          }
        }
        setSlots(rebuilt)
      }
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [templateId])

  function slotCalories(slotKey) {
    const { meal_id, scaled_version_id } = slots[slotKey]
    if (!meal_id) return null
    const meal = mealsById[meal_id]
    if (!meal) return null
    if (scaled_version_id) {
      const ver = (meal.meal_scaled_versions || []).find(v => v.id === scaled_version_id)
      return ver?.calorie_target ?? null
    }
    return meal._totalCals || null
  }

  function sumSlots(slotKeys) {
    return slotKeys.reduce((sum, key) => sum + (slotCalories(key) || 0), 0)
  }

  const option1Total = sumSlots(OPTION_1_SLOTS)
  const option2Total = sumSlots(OPTION_2_SLOTS)
  const target = form.calorie_target !== '' ? parseInt(form.calorie_target) : null
  const option2OverTarget = target != null && option2Total > target + OVER_TARGET_TOLERANCE

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Template name is required.'); return }
    if (option2OverTarget) {
      setError(`Option 2 meals (Alt. Breakfast/Lunch/Dinner + Pre-Workout + Evening Snack) total ${option2Total} kcal — more than ${OVER_TARGET_TOLERANCE} kcal above the ${target} kcal target. Choose lighter alternates before saving.`)
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      week_number: form.week_number !== '' ? parseInt(form.week_number) : null,
      calorie_target: form.calorie_target !== '' ? parseInt(form.calorie_target) : null,
    }

    let savedId = templateId

    if (isNew) {
      const { data, error: err } = await supabase
        .from('weekly_templates')
        .insert({ ...payload, coach_id: profile.id })
        .select('id')
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      savedId = data.id
    } else {
      const { error: err } = await supabase
        .from('weekly_templates')
        .update(payload)
        .eq('id', templateId)
      if (err) { setError(err.message); setSaving(false); return }
    }

    // Replace all slots
    await supabase.from('template_meal_slots').delete().eq('template_id', savedId)

    const slotRows = SLOT_TYPES
      .filter(s => slots[s.value]?.meal_id)
      .map(s => ({
        template_id: savedId,
        slot_type: s.value,
        meal_id: slots[s.value].meal_id,
        scaled_version_id: slots[s.value].scaled_version_id || null,
      }))

    if (slotRows.length > 0) {
      const { error: slotErr } = await supabase.from('template_meal_slots').insert(slotRows)
      if (slotErr) { setError(slotErr.message); setSaving(false); return }
    }

    setSaving(false)
    if (isNew) {
      navigate(`/coach/meal-templates/${savedId}`, { replace: true })
    } else {
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 2500)
    }
  }

  const mealsByCategory = MEAL_CATEGORY_ORDER.reduce((acc, cat) => {
    const group = meals.filter(m => m.category === cat)
    if (group.length) acc.push({ cat, meals: group })
    return acc
  }, [])
  const uncategorised = meals.filter(m => !MEAL_CATEGORY_ORDER.includes(m.category))
  if (uncategorised.length) mealsByCategory.push({ cat: 'other', meals: uncategorised })

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/coach/meal-templates')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'New Template' : form.name || 'Edit Template'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Details */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Template Details</h2>

          <div>
            <label className="label">Name <span className="text-red-400">*</span></label>
            <input
              className="input"
              type="text"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="e.g. Cut Phase — Week 1, Maintenance Plan"
              autoFocus={isNew}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Week number</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.week_number}
                onChange={e => setField('week_number', e.target.value)}
                placeholder="e.g. 1"
              />
              <p className="mt-1 text-xs text-gray-400">Optional — for labelling phases</p>
            </div>
            <div>
              <label className="label">Daily calorie target</label>
              <input
                className="input"
                type="number"
                min="1"
                value={form.calorie_target}
                onChange={e => setField('calorie_target', e.target.value)}
                placeholder="e.g. 1800"
              />
              <p className="mt-1 text-xs text-gray-400">Reference target for this template</p>
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Meal Plan</h2>
            {option1Total > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Option 1:</span>
                  <span className={`font-semibold text-sm ${
                    target != null && Math.abs(option1Total - target) <= OVER_TARGET_TOLERANCE
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {option1Total} kcal
                  </span>
                  {target != null && <span className="text-xs text-gray-400">/ {target} target</span>}
                </div>
                {option2Total > 0 && (
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className="text-xs text-gray-400">Option 2:</span>
                    <span className={`text-xs font-medium ${option2OverTarget ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {option2Total} kcal
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {option2OverTarget && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">
                Option 2 meals total {option2Total} kcal — more than {OVER_TARGET_TOLERANCE} kcal above the {target} kcal target.
                Choose lighter Alt. Breakfast/Lunch/Dinner meals so these can be paired interchangeably with Option 1.
              </p>
            </div>
          )}

          {meals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-2">No meals in your library yet.</p>
              <a href="/coach/meals" className="text-sm text-brand-500 hover:text-brand-700 underline">
                Build some meals first
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {SLOT_TYPES.map(slot => {
                const { meal_id, scaled_version_id } = slots[slot.value]
                const selectedMeal = meal_id ? mealsById[meal_id] : null
                const versions = selectedMeal?.meal_scaled_versions || []
                const cal = slotCalories(slot.value)

                return (
                  <div key={slot.value} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="w-36 flex-shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {slot.label}
                    </span>

                    <select
                      className="input flex-1 text-sm py-1.5"
                      value={meal_id}
                      onChange={e => setSlot(slot.value, 'meal_id', e.target.value)}
                    >
                      <option value="">— No meal —</option>
                      {mealsByCategory.map(({ cat, meals: group }) => (
                        <optgroup key={cat} label={cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}>
                          {group.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}{m._totalCals ? ` (${m._totalCals} kcal)` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    {meal_id && versions.length > 0 && (
                      <select
                        className="input w-44 text-sm py-1.5 flex-shrink-0"
                        value={scaled_version_id}
                        onChange={e => setSlot(slot.value, 'scaled_version_id', e.target.value)}
                      >
                        <option value="">Base meal</option>
                        {versions
                          .sort((a, b) => a.calorie_target - b.calorie_target)
                          .map(v => (
                            <option key={v.id} value={v.id}>{v.calorie_target} kcal version</option>
                          ))
                        }
                      </select>
                    )}

                    {meal_id && versions.length === 0 && (
                      <span className="w-44 flex-shrink-0" />
                    )}

                    <span className={`w-16 text-right text-sm flex-shrink-0 ${cal ? 'text-gray-600 dark:text-gray-400 font-medium' : 'text-gray-300 dark:text-gray-600'}`}>
                      {cal ? `${cal} kcal` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isNew ? 'Create Template' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate('/coach/meal-templates')} className="btn-secondary">
            Cancel
          </button>
          {savedMsg && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>
          )}
        </div>
      </form>
    </div>
  )
}
