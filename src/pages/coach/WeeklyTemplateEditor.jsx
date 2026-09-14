import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { normalizeMealSplit } from '../../lib/calorieSplit'
import {
  normalizeOverrides, hasAnyOverride, applyIngredientOverrides, sumIngredientMacros,
  MacroTargetInfo, MacroBadge, MACRO_META, libraryUnit,
} from '../../components/MealPlanView'

const SLOT_TYPES = [
  { value: 'breakfast1',    label: 'Breakfast',       cat: 'breakfast' },
  { value: 'breakfast2',    label: 'Alt. Breakfast',  cat: 'breakfast' },
  { value: 'lunch1',        label: 'Lunch',           cat: 'lunch' },
  { value: 'lunch2',        label: 'Alt. Lunch',      cat: 'lunch' },
  { value: 'dinner1',       label: 'Dinner',          cat: 'dinner' },
  { value: 'dinner2',       label: 'Alt. Dinner',     cat: 'dinner' },
  { value: 'preworkout',    label: 'Pre-Workout',     cat: 'pre_workout' },
  { value: 'evening_snack', label: 'Evening Snack',   cat: 'evening_snack' },
]

// The client eats one of each interchangeable pair per day, not both — Option 1 is the
// primary day, Option 2 is the alternate day, both sharing the same pre-workout/evening snack.
const OPTION_1_SLOTS = ['breakfast1', 'lunch1', 'dinner1', 'preworkout', 'evening_snack']
const OPTION_2_SLOTS = ['breakfast2', 'lunch2', 'dinner2', 'preworkout', 'evening_snack']
// A slot's sibling — the meal it must stay interchangeable with (e.g. Breakfast ↔ Alt. Breakfast).
// Pre-workout/evening snack are shared by both options, so they have no sibling to compare against.
const SIBLING_SLOT = {
  breakfast1: 'breakfast2', breakfast2: 'breakfast1',
  lunch1: 'lunch2', lunch2: 'lunch1',
  dinner1: 'dinner2', dinner2: 'dinner1',
}
// The day's total should never fall more than 50 kcal below target, or more than 30 kcal above it.
const UNDER_TARGET_TOLERANCE = 50
const OVER_TARGET_TOLERANCE = 30

const MEAL_CATEGORY_ORDER = ['breakfast', 'lunch', 'dinner', 'pre_workout', 'snack', 'evening_snack']

const EMPTY_SLOTS = Object.fromEntries(
  SLOT_TYPES.map(s => [s.value, { meal_id: '', scaled_version_id: '', ingredient_overrides: null }])
)

function round1(n) { return Math.round(n * 10) / 10 }

export default function WeeklyTemplateEditor() {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isNew = templateId === 'new' || !templateId

  const [form, setForm] = useState({ name: '', week_number: '', calorie_target: '' })
  const [slots, setSlots] = useState(EMPTY_SLOTS)
  const [meals, setMeals] = useState([])
  const [mealsById, setMealsById] = useState({})
  const [library, setLibrary] = useState([])
  const [libraryById, setLibraryById] = useState({})
  const [expanded, setExpanded] = useState(null) // slot key currently showing its ingredient editor
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState(false)

  const mealSplit = normalizeMealSplit(profile?.meal_split)

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function setSlot(slotType, field, value) {
    setSlots(prev => ({
      ...prev,
      [slotType]: {
        ...prev[slotType],
        [field]: value,
        // clear version + ingredient edits when the meal itself changes
        ...(field === 'meal_id' ? { scaled_version_id: '', ingredient_overrides: null } : {}),
      },
    }))
  }

  function setSlotOverrides(slotType, overrides) {
    setSlots(prev => ({ ...prev, [slotType]: { ...prev[slotType], ingredient_overrides: overrides } }))
  }

  function updateSlotIngredientQty(slotType, ingId, newQty) {
    const cur = normalizeOverrides(slots[slotType].ingredient_overrides)
    setSlotOverrides(slotType, { ...cur, qty: { ...cur.qty, [ingId]: newQty } })
  }

  async function load() {
    const [mealsRes, libRes] = await Promise.all([
      supabase
        .from('meals')
        .select('id, name, category, meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, unit, ingredient_id, is_static), meal_scaled_versions(id, calorie_target)')
        .eq('coach_id', profile.id)
        .order('name'),
      supabase.from('ingredients').select('*').eq('coach_id', profile.id),
    ])

    const mealData = (mealsRes.data || []).map(m => ({
      ...m,
      _totalCals: Math.round((m.meal_ingredients || []).reduce((s, i) => s + (parseFloat(i.calories) || 0), 0)),
    }))
    setMeals(mealData)
    setMealsById(Object.fromEntries(mealData.map(m => [m.id, m])))
    setLibrary(libRes.data || [])
    setLibraryById(Object.fromEntries((libRes.data || []).map(l => [l.id, l])))

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
              ingredient_overrides: row.ingredient_overrides || null,
            }
          }
        }
        setSlots(rebuilt)
      }
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [templateId])

  // This slot's actual macros: the base meal's ingredients (with any per-week override applied),
  // or just the flat calorie number when a fixed scaled version is picked instead.
  function slotMacros(slotKey) {
    const { meal_id, scaled_version_id, ingredient_overrides } = slots[slotKey]
    if (!meal_id) return null
    const meal = mealsById[meal_id]
    if (!meal) return null
    if (scaled_version_id) {
      const ver = (meal.meal_scaled_versions || []).find(v => v.id === scaled_version_id)
      return ver ? { cal: ver.calorie_target, carb: null, prot: null, fat: null } : null
    }
    return sumIngredientMacros(applyIngredientOverrides(meal.meal_ingredients || [], ingredient_overrides))
  }

  function slotCalories(slotKey) {
    return slotMacros(slotKey)?.cal || null
  }

  // This slot's share of the day's calorie target, from the coach's standard meal-split % —
  // the same "add/remove X kcal" guidance used everywhere else a meal's macros are edited.
  function slotTarget(slotKey) {
    const cat = SLOT_TYPES.find(s => s.value === slotKey)?.cat
    const dayTarget = parseInt(form.calorie_target)
    if (!cat || !dayTarget) return null
    const pct = (mealSplit[cat] || 0) / 100
    return { cal: dayTarget * pct }
  }

  function sumSlots(slotKeys) {
    return slotKeys.reduce((sum, key) => sum + (slotCalories(key) || 0), 0)
  }

  const option1Total = sumSlots(OPTION_1_SLOTS)
  const option2Total = sumSlots(OPTION_2_SLOTS)
  const target = form.calorie_target !== '' ? parseInt(form.calorie_target) : null

  function rangeError(label, total, target) {
    if (target == null) return null
    if (total < target - UNDER_TARGET_TOLERANCE) return `${label} total ${total} kcal — more than ${UNDER_TARGET_TOLERANCE} kcal below the ${target} kcal target.`
    if (total > target + OVER_TARGET_TOLERANCE) return `${label} total ${total} kcal — more than ${OVER_TARGET_TOLERANCE} kcal above the ${target} kcal target.`
    return null
  }

  const option1OutOfRange = option1Total > 0 && rangeError('Option 1 meals', option1Total, target) != null
  const option2OutOfRange = option2Total > 0 && rangeError('Option 2 meals', option2Total, target) != null

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Template name is required.'); return }
    const errors = [
      option1Total > 0 ? rangeError('Option 1 meals', option1Total, target) : null,
      option2Total > 0 ? rangeError('Option 2 meals (Alt. Breakfast/Lunch/Dinner + Pre-Workout + Evening Snack)', option2Total, target) : null,
    ].filter(Boolean)
    if (errors.length > 0) {
      setError(`${errors.join(' ')} Choose different meals, or adjust ingredient amounts, so the day lands within range before saving.`)
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
        ingredient_overrides: hasAnyOverride(slots[s.value].ingredient_overrides) ? slots[s.value].ingredient_overrides : null,
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
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate min-w-0">
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
                type="number" onFocus={e => e.target.select()}
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
                type="number" onFocus={e => e.target.select()}
                min="1"
                value={form.calorie_target}
                onChange={e => setField('calorie_target', e.target.value)}
                placeholder="e.g. 1800"
              />
              <p className="mt-1 text-xs text-gray-400">Used to work out each meal's own share of the day (below)</p>
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
                    target != null && !option1OutOfRange
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
                    <span className={`text-xs font-medium ${option2OutOfRange ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {option2Total} kcal
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
            Option 1 and Option 2 need to stay close to each other as well as to target — a client eats one or the other on any given day, so they need to be interchangeable.
          </p>

          {(option1OutOfRange || option2OutOfRange) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">
                {[
                  option1OutOfRange ? rangeError('Option 1 meals', option1Total, target) : null,
                  option2OutOfRange ? rangeError('Option 2 meals', option2Total, target) : null,
                ].filter(Boolean).join(' ')} Choose different meals, or adjust ingredient amounts, so the day lands within {UNDER_TARGET_TOLERANCE} kcal below / {OVER_TARGET_TOLERANCE} kcal above target.
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
            <div className="space-y-1">
              {SLOT_TYPES.map(slot => {
                const { meal_id, scaled_version_id, ingredient_overrides } = slots[slot.value]
                const selectedMeal = meal_id ? mealsById[meal_id] : null
                const versions = selectedMeal?.meal_scaled_versions || []
                const macros = slotMacros(slot.value)
                const cal = macros?.cal || null
                const slotTgt = slotTarget(slot.value)
                const siblingKey = SIBLING_SLOT[slot.value]
                const siblingMacros = siblingKey ? slotMacros(siblingKey) : null
                const siblingLabel = siblingKey ? SLOT_TYPES.find(s => s.value === siblingKey)?.label : null
                const canEditIngredients = meal_id && !scaled_version_id && (selectedMeal?.meal_ingredients?.length || 0) > 0
                const isExpanded = expanded === slot.value

                // Meals in this slot's own category, closest-to-target first once a target exists —
                // so the best-fitting option is the first thing the coach sees, not buried alphabetically.
                const options = (mealsByCategory.find(g => g.cat === slot.cat)?.meals || meals.filter(m => m.category === slot.cat))
                  .slice()
                  .sort((a, b) => {
                    if (!slotTgt?.cal) return a.name.localeCompare(b.name)
                    return Math.abs(a._totalCals - slotTgt.cal) - Math.abs(b._totalCals - slotTgt.cal)
                  })

                return (
                  <div key={slot.value} className="rounded-xl border border-gray-100 dark:border-gray-800 p-2.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="w-36 flex-shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {slot.label}
                      </span>

                      <select
                        className="input flex-1 text-sm py-1.5"
                        value={meal_id}
                        onChange={e => setSlot(slot.value, 'meal_id', e.target.value)}
                      >
                        <option value="">— No meal —</option>
                        {options.map(m => {
                          const delta = slotTgt?.cal ? Math.round(m._totalCals - slotTgt.cal) : null
                          const deltaLabel = delta == null ? '' : delta === 0 ? ', on target' : delta > 0 ? `, +${delta}` : `, ${delta}`
                          return (
                            <option key={m.id} value={m.id}>
                              {m.name}{m._totalCals ? ` (${m._totalCals} kcal${deltaLabel})` : ''}
                            </option>
                          )
                        })}
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

                    {macros && macros.cal > 0 && macros.carb != null && (
                      <div className="sm:pl-[9.5rem] flex flex-wrap items-center gap-3 text-[11px]">
                        <span className={`flex items-center gap-0.5 ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{Math.round(macros.carb)}g</span>
                        <span className={`flex items-center gap-0.5 ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{Math.round(macros.prot)}g</span>
                        <span className={`flex items-center gap-0.5 ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{Math.round(macros.fat)}g</span>
                        {canEditIngredients && (
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : slot.value)}
                            className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium ml-auto"
                          >
                            {isExpanded ? 'Hide ingredients' : 'Edit ingredients'}
                          </button>
                        )}
                      </div>
                    )}

                    {macros && macros.cal > 0 && (slotTgt || siblingMacros) && (
                      <div className="sm:pl-[9.5rem]">
                        <MacroTargetInfo
                          macros={macros}
                          target={slotTgt}
                          siblingMacros={siblingMacros?.cal > 0 ? siblingMacros : null}
                          siblingLabel={siblingLabel}
                          ingredients={canEditIngredients ? applyIngredientOverrides(selectedMeal.meal_ingredients || [], ingredient_overrides) : null}
                          ingredientLib={libraryById}
                          onAutoFit={canEditIngredients ? (id, qty) => updateSlotIngredientQty(slot.value, id, qty) : undefined}
                        />
                      </div>
                    )}

                    {scaled_version_id && (
                      <p className="sm:pl-[9.5rem] text-[11px] text-gray-400 dark:text-gray-500">
                        Using a fixed scaled version — pick "Base meal" to fine-tune ingredient amounts for this week.
                      </p>
                    )}

                    {isExpanded && canEditIngredients && (
                      <div className="sm:pl-[9.5rem]">
                        <TemplateIngredientEditor
                          meal={selectedMeal}
                          overrides={ingredient_overrides}
                          library={library}
                          libraryById={libraryById}
                          onChange={o => setSlotOverrides(slot.value, o)}
                        />
                      </div>
                    )}
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

// Ingredient-level editing for one slot's occurrence of a meal in this template - changes here
// apply only to this specific week, never to the meal's own shared recipe (stored as
// template_meal_slots.ingredient_overrides, the same override pattern used for a client's own
// per-week adjustments). Lets the coach nudge a meal's amounts to close the gap shown above
// instead of only being able to swap in an entirely different meal.
function TemplateIngredientEditor({ meal, overrides, library, libraryById, onChange }) {
  const [addSearch, setAddSearch] = useState('')

  const baseIngredients = meal.meal_ingredients || []
  const ingredients = applyIngredientOverrides(baseIngredients, overrides)
  const overridden = hasAnyOverride(overrides)

  function patch(partial) {
    onChange({ ...normalizeOverrides(overrides), ...partial })
  }
  function updateQty(id, val) {
    const cur = normalizeOverrides(overrides)
    const qty = { ...cur.qty }
    if (val === '' || val == null) delete qty[id]
    else { const n = parseFloat(val); if (!isNaN(n)) qty[id] = n }
    patch({ qty })
  }
  function removeIng(id) {
    const cur = normalizeOverrides(overrides)
    patch({ removed: [...new Set([...cur.removed, id])] })
  }
  function restoreIng(id) {
    const cur = normalizeOverrides(overrides)
    patch({ removed: cur.removed.filter(x => x !== id) })
  }
  function addIng(lib) {
    const cur = normalizeOverrides(overrides)
    const qty = lib.serving_size || 100
    const f = lib.serving_size > 0 ? qty / lib.serving_size : 0
    patch({
      added: [...cur.added, {
        id: `added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: lib.name, quantity_g: qty, unit: lib.serving_unit || 'g',
        calories: round1(f * lib.calories_per_serving), protein_g: round1(f * lib.protein_per_serving),
        carbs_g: round1(f * lib.carbs_per_serving), fat_g: round1(f * lib.fat_per_serving),
        ingredient_id: lib.id,
      }],
    })
    setAddSearch('')
  }
  function removeAdded(id) {
    const cur = normalizeOverrides(overrides)
    patch({ added: cur.added.filter(a => a.id !== id) })
  }

  const { removed } = normalizeOverrides(overrides)
  const searchMatches = addSearch.length >= 2
    ? library.filter(l => l.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 8)
    : []

  return (
    <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">Ingredients (this week only)</p>
        {overridden && (
          <button type="button" onClick={() => onChange(null)} className="text-[11px] text-gray-400 hover:text-red-500">
            Revert to original
          </button>
        )}
      </div>
      {ingredients.map(ing => {
        const unit = libraryUnit(ing, libraryById) || (ing.unit !== 'g' ? ing.unit : null) || 'g'
        return (
          <div key={ing.id} className="flex items-center gap-2 text-xs">
            <span className="flex-1 min-w-0 truncate text-gray-600 dark:text-gray-400">{ing.name}</span>
            <input
              type="number"
              onFocus={e => e.target.select()}
              disabled={ing.is_static}
              className={`w-16 text-right text-xs py-0.5 px-1 rounded border tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-400 ${
                ing.is_static
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
              }`}
              value={ing.quantity_g}
              onChange={e => !ing.is_static && updateQty(ing.id, e.target.value)}
            />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-6">{unit}</span>
            <span className="tabular-nums w-14 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
            {ing.is_static ? (
              <span className="w-4 flex-shrink-0" />
            ) : (
              <button
                type="button"
                onClick={() => ing._isAdded ? removeAdded(ing.id) : removeIng(ing.id)}
                className="w-4 text-center text-gray-300 hover:text-red-400 flex-shrink-0"
              >
                ×
              </button>
            )}
          </div>
        )
      })}

      {removed.length > 0 && (
        <div className="space-y-0.5">
          {removed.map(id => {
            const orig = baseIngredients.find(i => i.id === id)
            if (!orig) return null
            return (
              <div key={id} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex-1 truncate line-through">{orig.name}</span>
                <button type="button" onClick={() => restoreIng(id)} className="text-brand-500 hover:text-brand-700 font-medium flex-shrink-0">Restore</button>
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-1">
        <input
          type="text"
          placeholder="Add an ingredient…"
          value={addSearch}
          onChange={e => setAddSearch(e.target.value)}
          className="input w-full text-xs py-1"
        />
        {searchMatches.length > 0 && (
          <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
            {searchMatches.map(lib => (
              <button
                key={lib.id}
                type="button"
                onClick={() => addIng(lib)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/10 border-b border-gray-100 dark:border-gray-800 last:border-0 text-xs"
              >
                <span className="font-medium text-gray-900 dark:text-white">{lib.name}</span>
                <span className="text-gray-400 dark:text-gray-500"> — {lib.serving_size || '?'}{lib.serving_unit || 'g'} · {Math.round(lib.calories_per_serving || 0)} kcal</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
