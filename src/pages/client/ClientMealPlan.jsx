import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

const EXTRA_SLOTS = [
  { key: 'preworkout',    label: 'Pre-workout',   cat: 'pre_workout' },
  { key: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
]

const OPTION_1_KEYS = ['breakfast1', 'lunch1', 'dinner1']
const OPTION_2_KEYS = ['breakfast2', 'lunch2', 'dinner2']

const SWAP_CALORIE_TOLERANCE = 50

// ─── Macro helpers ────────────────────────────────────────────────────────────

function round1(n) { return Math.round(n * 10) / 10 }

function normalizeOverrides(raw) {
  if (!raw) return { qty: {}, removed: [], added: [] }
  if (raw.qty || raw.removed || raw.added) {
    return { qty: raw.qty || {}, removed: raw.removed || [], added: raw.added || [] }
  }
  return { qty: { ...raw }, removed: [], added: [] }
}

function hasAnyOverride(raw) {
  const { qty, removed, added } = normalizeOverrides(raw)
  return Object.keys(qty).length > 0 || removed.length > 0 || added.length > 0
}

function applyIngredientOverrides(ingredients, overridesForSlot) {
  const { qty, removed, added } = normalizeOverrides(overridesForSlot)
  const visible = removed.length ? ingredients.filter(ing => !removed.includes(ing.id)) : ingredients
  const withQty = visible.map(ing => {
    const override = qty[ing.id]
    if (override == null) return ing
    const origQty = parseFloat(ing.quantity_g) || 0
    const ratio = origQty > 0 ? override / origQty : 1
    return {
      ...ing,
      quantity_g: override,
      calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
    }
  })
  if (!added.length) return withQty
  return [...withQty, ...added.map(a => ({ ...a, _isAdded: true }))]
}

function sumIngredientMacros(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({
      cal:  acc.cal  + (parseFloat(ing.calories)  || 0),
      prot: acc.prot + (parseFloat(ing.protein_g) || 0),
      carb: acc.carb + (parseFloat(ing.carbs_g)   || 0),
      fat:  acc.fat  + (parseFloat(ing.fat_g)     || 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

function mealMacros(mealId, mealMap, tier, overridesForSlot) {
  if (!mealId || !mealMap[mealId]) return null
  const meal = mealMap[mealId]
  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      if (!hasAnyOverride(overridesForSlot)) {
        return { cal: parseFloat(v.calories) || 0, prot: parseFloat(v.protein_g) || 0, carb: parseFloat(v.carbs_g) || 0, fat: parseFloat(v.fat_g) || 0 }
      }
      return sumIngredientMacros(applyIngredientOverrides(v.meal_tier_ingredients || [], overridesForSlot))
    }
  }
  return sumIngredientMacros(applyIngredientOverrides(meal.meal_ingredients || [], overridesForSlot))
}

function getIngredients(meal, tier, overrides) {
  if (!meal) return []
  let base = meal.meal_ingredients || []
  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) base = v.meal_tier_ingredients || []
  }
  return applyIngredientOverrides(base, overrides)
}

function addMacros(a, b) {
  const az = a || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const bz = b || { cal: 0, prot: 0, carb: 0, fat: 0 }
  return { cal: az.cal + bz.cal, prot: az.prot + bz.prot, carb: az.carb + bz.carb, fat: az.fat + bz.fat }
}

// ─── Swap modal ───────────────────────────────────────────────────────────────

function SwapModal({ slotKey, label, cat, currentMealId, mealMap, mealsByCategory, tier, onSelect, onClose }) {
  const options = mealsByCategory[cat] || []
  const currentMacros = mealMacros(currentMealId, mealMap, tier, null)
  const currentCal = currentMacros?.cal || 0
  const currentProt = currentMacros?.prot || 0

  const eligible = options
    .filter(m => m.id !== currentMealId)
    .map(m => ({ ...m, macros: mealMacros(m.id, mealMap, tier, null) }))
    .filter(m => Math.abs((m.macros?.cal || 0) - currentCal) <= SWAP_CALORIE_TOLERANCE)
    .sort((a, b) => Math.abs((a.macros?.prot || 0) - currentProt) - Math.abs((b.macros?.prot || 0) - currentProt))

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Swap {label}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Meals within ±{SWAP_CALORIE_TOLERANCE} kcal · sorted by closest protein
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {eligible.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">No alternatives within ±{SWAP_CALORIE_TOLERANCE} kcal right now.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Contact your coach to add more options.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {eligible.map(m => (
                <button
                  key={m.id}
                  onClick={() => onSelect(slotKey, m.id)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{m.name}</p>
                  {m.macros && (
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{Math.round(m.macros.cal)} kcal</span>
                      <span>{Math.round(m.macros.carb)}g C</span>
                      <span>{Math.round(m.macros.prot)}g P</span>
                      <span>{Math.round(m.macros.fat)}g F</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Meal slot card ───────────────────────────────────────────────────────────

function MealSlotCard({ slotKey, label, mealId, templateMealId, mealMap, mealsByCategory, cat, tier, overrides, onSwap, onRevert }) {
  const [expanded, setExpanded] = useState(false)

  const meal = mealId ? mealMap[mealId] : null
  const macros = mealMacros(mealId, mealMap, tier, overrides)
  const ingredients = meal ? getIngredients(meal, tier, overrides) : []
  const isCustom = (mealId || null) !== (templateMealId || null)
  const hasIngredientEdits = hasAnyOverride(overrides)

  return (
    <div className="border-b border-gray-100 dark:border-gray-800/60 last:border-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
              {isCustom && <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Swapped</span>}
              {hasIngredientEdits && <span className="text-xs text-blue-500">Adjusted</span>}
            </div>

            {meal ? (
              <>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{meal.name}</p>
                {macros && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{Math.round(macros.cal)} kcal</span>
                    <span>{Math.round(macros.carb)}g C</span>
                    <span>{Math.round(macros.prot)}g P</span>
                    <span>{Math.round(macros.fat)}g F</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No meal set</p>
            )}
          </div>

          {/* Swap / revert buttons */}
          {mealId && (
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {isCustom && (
                <button onClick={() => onRevert(slotKey)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  Revert
                </button>
              )}
              <button
                onClick={() => onSwap(slotKey, label, cat)}
                className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swap
              </button>
            </div>
          )}
        </div>

        {/* Ingredient summary — always visible */}
        {ingredients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
            {ingredients.map((ing, i) => (
              <span key={ing.id || i} className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(parseFloat(ing.quantity_g))}g {ing.name}{i < ingredients.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        {meal && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? 'Hide details' : 'View recipe'}
          </button>
        )}
      </div>

      {/* Expanded recipe details */}
      {expanded && meal && (
        <div className="mx-4 mb-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 overflow-hidden">

          {/* Photo */}
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt={meal.name}
              className="w-full max-h-52 object-cover"
            />
          )}

          <div className="p-3 space-y-4">
            {/* Ingredient table with macros */}
            {ingredients.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ingredients</p>
                <div className="space-y-1.5">
                  {ingredients.map((ing, i) => (
                    <div key={ing.id || i} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{ing.name}</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400 w-10 text-right">{Math.round(parseFloat(ing.quantity_g))}g</span>
                      <span className="tabular-nums text-gray-400 dark:text-gray-500 w-14 text-right">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
                      <span className="tabular-nums text-gray-400 dark:text-gray-500 w-8 text-right">{Math.round(parseFloat(ing.carbs_g) || 0)}c</span>
                      <span className="tabular-nums text-gray-400 dark:text-gray-500 w-8 text-right">{Math.round(parseFloat(ing.protein_g) || 0)}p</span>
                      <span className="tabular-nums text-gray-400 dark:text-gray-500 w-8 text-right">{Math.round(parseFloat(ing.fat_g) || 0)}f</span>
                    </div>
                  ))}
                  {/* Totals row */}
                  {macros && (
                    <div className="flex items-center gap-2 text-xs font-semibold border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1">
                      <span className="flex-1 text-gray-700 dark:text-gray-300">Total</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400 w-10 text-right" />
                      <span className="tabular-nums text-gray-700 dark:text-gray-200 w-14 text-right">{Math.round(macros.cal)} kcal</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right">{Math.round(macros.carb)}c</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right">{Math.round(macros.prot)}p</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right">{Math.round(macros.fat)}f</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cooking instructions */}
            {meal.instructions && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">How to make it</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{meal.instructions}</p>
              </div>
            )}

            {!meal.instructions && ingredients.length === 0 && (
              <p className="text-xs text-gray-400 italic">No recipe details added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientMealPlan() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [mealMap, setMealMap] = useState({})
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [slotsDirty, setSlotsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)
  const [swapModal, setSwapModal] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', session.user.id)
        .single()
      if (!clientRow) { setLoading(false); return }
      setClientData(clientRow)

      const { data: asgn } = await supabase
        .from('client_plan_assignments')
        .select('*')
        .eq('client_id', clientRow.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!asgn) { setLoading(false); return }
      setAssignment(asgn)

      const { data: pg } = await supabase
        .from('plan_groups')
        .select('current_week')
        .eq('id', asgn.plan_group_id)
        .single()
      const effectiveWeek = asgn.week_override ?? pg?.current_week ?? 1
      setWeekNumber(effectiveWeek)

      const { data: mealsData } = await supabase.from('meals').select(`
        id, name, category, instructions, photo_url,
        meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id),
        meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
          meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id))
      `).eq('coach_id', clientRow.coach_id).order('name')

      const map = {}, byCat = {}
      for (const m of (mealsData || [])) {
        map[m.id] = m
        ;(byCat[m.category] = byCat[m.category] || []).push(m)
      }
      setMealMap(map)
      setMealsByCategory(byCat)

      const tier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
      const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
        tier
          ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)')
              .eq('plan_group_id', asgn.plan_group_id)
              .eq('week_number', effectiveWeek)
              .eq('calorie_tier', tier)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)')
          .eq('plan_group_id', asgn.plan_group_id)
          .eq('week_number', effectiveWeek)
          .is('calorie_tier', null)
          .maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides')
          .eq('assignment_id', asgn.id)
          .eq('week_number', effectiveWeek)
          .maybeSingle(),
      ])

      const tmpl = tierTmpl || stdTmpl
      const tSlots = {}
      for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
      if (asgn.preworkout_static && asgn.preworkout_meal_id) tSlots.preworkout = asgn.preworkout_meal_id
      if (asgn.evening_snack_static && asgn.evening_snack_meal_id) tSlots.evening_snack = asgn.evening_snack_meal_id

      setTemplateSlots(tSlots)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
      setIngredientOverrides(cwm?.ingredient_overrides || {})
      setSlotsDirty(false)
      setLoading(false)
    }
    load()
  }, [session.user.id])

  const tier = assignment && CALORIE_TIERS.includes(assignment.calorie_target) ? assignment.calorie_target : null

  function sumSlotKeys(keys) {
    return keys.reduce(
      (acc, key) => addMacros(acc, mealMacros(editedSlots[key], mealMap, tier, ingredientOverrides[key])),
      { cal: 0, prot: 0, carb: 0, fat: 0 }
    )
  }

  const preworkoutM = mealMacros(editedSlots.preworkout, mealMap, tier, ingredientOverrides.preworkout) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const snackM      = mealMacros(editedSlots.evening_snack, mealMap, tier, ingredientOverrides.evening_snack) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const opt1Sub     = sumSlotKeys(OPTION_1_KEYS)
  const opt2Sub     = sumSlotKeys(OPTION_2_KEYS)
  const opt1Total   = addMacros(addMacros(opt1Sub, preworkoutM), snackM)
  const opt2Total   = addMacros(addMacros(opt2Sub, preworkoutM), snackM)

  function handleSwapOpen(slotKey, label, cat) {
    setSwapModal({ slotKey, label, cat })
  }

  function handleSwapSelect(slotKey, newMealId) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: newMealId }))
    setIngredientOverrides(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    setSlotsDirty(true)
    setSwapModal(null)
  }

  function handleRevert(slotKey) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: templateSlots[slotKey] || null }))
    setIngredientOverrides(prev => { const n = { ...prev }; delete n[slotKey]; return n })
    setSlotsDirty(true)
  }

  async function handleSave() {
    if (!assignment || weekNumber == null) return
    setSaving(true); setSaveError(''); setSaved(false)
    const { error } = await supabase.from('client_week_meals').upsert(
      {
        client_id: clientData.id,
        coach_id: clientData.coach_id,
        assignment_id: assignment.id,
        week_number: weekNumber,
        slots: editedSlots,
        ingredient_overrides: ingredientOverrides,
      },
      { onConflict: 'assignment_id,week_number' }
    )
    setSaving(false)
    if (error) { setSaveError('Could not save changes. Please try again.'); return }
    setSlotsDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (!assignment) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Meal Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weekly meals and daily targets.</p>
        </div>
        <div className="card text-center py-16 space-y-2">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No meal plan set up yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Your coach will assign your plan soon. Check back shortly.</p>
        </div>
      </div>
    )
  }

  const hasExtraSlots = editedSlots.preworkout || editedSlots.evening_snack

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Meal Plan</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weekly meals and daily targets.</p>
      </div>

      {/* Week banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20">
        <div className="w-14 h-14 rounded-xl bg-brand-500 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white leading-none">{weekNumber}</span>
          <span className="text-xs text-brand-100 uppercase tracking-wide leading-tight">Week</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Week {weekNumber} of your plan</p>
          {assignment.calorie_target && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.calorie_target} kcal/day target</p>
          )}
        </div>
      </div>

      {/* Rotating meals */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This week's meals</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Two options per meal — pick whichever you fancy each day.</p>
        </div>
        {MEAL_SLOTS.map(slot => (
          <MealSlotCard
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            cat={slot.cat}
            mealId={editedSlots[slot.key] || null}
            templateMealId={templateSlots[slot.key] || null}
            mealMap={mealMap}
            mealsByCategory={mealsByCategory}
            tier={tier}
            overrides={ingredientOverrides[slot.key]}
            onSwap={handleSwapOpen}
            onRevert={handleRevert}
          />
        ))}
      </div>

      {/* Pre-workout & snack */}
      {hasExtraSlots && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Pre-workout &amp; Evening snack</h2>
          </div>
          {EXTRA_SLOTS.map(slot =>
            editedSlots[slot.key] ? (
              <MealSlotCard
                key={slot.key}
                slotKey={slot.key}
                label={slot.label}
                cat={slot.cat}
                mealId={editedSlots[slot.key] || null}
                templateMealId={templateSlots[slot.key] || null}
                mealMap={mealMap}
                mealsByCategory={mealsByCategory}
                tier={tier}
                overrides={ingredientOverrides[slot.key]}
                onSwap={handleSwapOpen}
                onRevert={handleRevert}
              />
            ) : null
          )}
        </div>
      )}

      {/* Daily totals */}
      {(opt1Total.cal > 0 || opt2Total.cal > 0) && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Daily totals</h2>
          {opt1Total.cal > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Option A</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Breakfast A · Lunch A · Dinner A</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(opt1Total.cal)} kcal</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                  {Math.round(opt1Total.carb)}g C · {Math.round(opt1Total.prot)}g P · {Math.round(opt1Total.fat)}g F
                </p>
              </div>
            </div>
          )}
          {opt2Sub.cal > 0 && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Option B</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Breakfast B · Lunch B · Dinner B</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(opt2Total.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {Math.round(opt2Total.carb)}g C · {Math.round(opt2Total.prot)}g P · {Math.round(opt2Total.fat)}g F
                  </p>
                </div>
              </div>
            </>
          )}
          {assignment.calorie_target && (
            <>
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 dark:text-gray-500">Daily target</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{assignment.calorie_target} kcal</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Save bar */}
      {slotsDirty && (
        <div className="sticky bottom-4">
          <div className="card flex items-center gap-3 shadow-lg border border-brand-100 dark:border-brand-900/40">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">You have unsaved meal swaps</p>
              {saveError && <p className="text-xs text-red-500 mt-0.5">{saveError}</p>}
            </div>
            <button
              onClick={() => { setEditedSlots({ ...templateSlots }); setIngredientOverrides({}); setSlotsDirty(false) }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
            >
              Reset
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-1.5 px-4 text-sm flex-shrink-0">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {saved && !slotsDirty && (
        <div className="text-center">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved successfully</span>
        </div>
      )}

      {swapModal && (
        <SwapModal
          slotKey={swapModal.slotKey}
          label={swapModal.label}
          cat={swapModal.cat}
          currentMealId={editedSlots[swapModal.slotKey] || null}
          mealMap={mealMap}
          mealsByCategory={mealsByCategory}
          tier={tier}
          onSelect={handleSwapSelect}
          onClose={() => setSwapModal(null)}
        />
      )}
    </div>
  )
}
