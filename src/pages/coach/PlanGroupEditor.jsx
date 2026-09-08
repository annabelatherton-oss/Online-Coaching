import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { normalizeMealSplit } from '../../lib/calorieSplit'
import { calcStandardMacros } from '../../lib/macros'
import { getIngredients, formatAmount, hasAnyOverride, normalizeOverrides, mealMacros as sharedMealMacros } from '../../components/MealPlanView'
import {
  generateTierIngredients, insertTierVersion, tierTargetsForCategory, allIngredientsFixed,
} from '../../lib/calorieTierScaling'

const MAIN_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

// Pre-workout/evening-snack are part of the template like any other slot, but they don't have an
// A/B option and stay the same in every week — changing one propagates to all 20 weeks at once
// instead of needing to be re-picked week by week.
const STATIC_SLOTS = [
  { key: 'preworkout',    label: 'Pre-workout',   cat: 'pre_workout' },
  { key: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
]

const SLOTS = [...MAIN_SLOTS, ...STATIC_SLOTS]
const STATIC_SLOT_KEYS = new Set(STATIC_SLOTS.map(s => s.key))

const UNDER_TARGET_TOLERANCE = 50
const OVER_TARGET_TOLERANCE = 20

function round1(n) {
  return Math.round(n * 10) / 10
}

function OptionTotal({ label, totals, target }) {
  if (!totals || totals.calories <= 0) return null
  if (!totals.complete) {
    return (
      <span className="font-medium text-amber-500" title="One or more meals in this day has no calorie-tier version — regenerate tiers in Coach Settings to fix this.">
        {label}: {totals.calories} kcal ⚠ missing tier
      </span>
    )
  }
  let diffText = null
  let colour = 'text-gray-500 dark:text-gray-400'
  if (target != null) {
    const diff = target - totals.calories
    if (diff > UNDER_TARGET_TOLERANCE) { diffText = `${Math.round(diff)} under`; colour = 'text-amber-500' }
    else if (diff < -OVER_TARGET_TOLERANCE) { diffText = `${Math.round(-diff)} over`; colour = 'text-red-500' }
    else { colour = 'text-green-600 dark:text-green-400' }
  }
  return (
    <span className={`font-medium ${colour}`}>
      {label}: {totals.calories} kcal{diffText ? ` (${diffText})` : ''}
    </span>
  )
}

// Each meal's tier version is generated to hit MACRO_SPLIT of its tier's calories (see
// tierTargetsForCategory in calorieTierScaling.js), so a day's macro "target" is just that same
// split applied to the full tier number — comparing against it tells a coach at a glance whether
// the day's actual ingredient mix landed where the generator meant it to.
const MACRO_TOLERANCE_PCT = 10

function macroColour(actual, target) {
  if (!target) return 'text-gray-400 dark:text-gray-500'
  const diffPct = (actual - target) / target * 100
  if (Math.abs(diffPct) <= MACRO_TOLERANCE_PCT) return 'text-green-600 dark:text-green-400'
  return diffPct < 0 ? 'text-amber-500' : 'text-red-500'
}

// Small coloured dots for a quick glance at a collapsed day's macro match without expanding it.
function MacroDots({ totals, tier }) {
  if (!totals || totals.calories <= 0 || !totals.complete || tier == null) return null
  const targets = calcStandardMacros(tier)
  const dims = [
    { key: 'P', actual: totals.protein_g, target: targets.protein_g },
    { key: 'C', actual: totals.carbs_g, target: targets.carbs_g },
    { key: 'F', actual: totals.fat_g, target: targets.fat_g },
  ]
  return (
    <span className="inline-flex items-center gap-1" title={dims.map(d => `${d.key}: ${d.actual}g / ${d.target}g target`).join('  ·  ')}>
      {dims.map(d => (
        <span key={d.key} className={`w-1.5 h-1.5 rounded-full ${macroColour(d.actual, d.target).replace('text-', 'bg-')}`} />
      ))}
    </span>
  )
}

// Full breakdown shown inside an expanded day — calories plus protein/carbs/fat each against
// their MACRO_SPLIT target for this tier, colour-coded the same way as the calorie diff above.
function MacroMatchRow({ label, totals, tier }) {
  if (!totals || totals.calories <= 0) return null
  if (tier == null) return null
  if (!totals.complete) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-500">
        <span className="font-semibold w-16">{label}</span>
        <span>{totals.calories} kcal — one or more slots has no tier version for {tier} kcal. Go to Coach Settings → Recalculate all calorie tiers, then re-open this plan.</span>
      </div>
    )
  }
  const targets = calcStandardMacros(tier)
  const calDiff = tier - totals.calories
  const calColour = calDiff > UNDER_TARGET_TOLERANCE ? 'text-amber-500' : calDiff < -OVER_TARGET_TOLERANCE ? 'text-red-500' : 'text-green-600 dark:text-green-400'
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="font-semibold text-gray-500 dark:text-gray-400 w-16">{label}</span>
      <span className={calColour}>
        <span className="font-medium">{totals.calories}</span> / {tier} kcal
      </span>
      <span className={macroColour(totals.protein_g, targets.protein_g)}>
        <span className="font-medium">{totals.protein_g}g</span> / {targets.protein_g}g protein
      </span>
      <span className={macroColour(totals.carbs_g, targets.carbs_g)}>
        <span className="font-medium">{totals.carbs_g}g</span> / {targets.carbs_g}g carbs
      </span>
      <span className={macroColour(totals.fat_g, targets.fat_g)}>
        <span className="font-medium">{totals.fat_g}g</span> / {targets.fat_g}g fat
      </span>
    </div>
  )
}

// Inline editor for ONE week's occurrence of a meal. Quantities are stored as an override on top
// of the meal's shared default recipe for this tier (meal_tier_versions / meal_tier_ingredients —
// the same rows the Meal Library edits), keyed to this specific (week, slot) via
// template_meal_slots.ingredient_overrides, exactly like a client's own per-week meal-plan
// overrides. This means adjusting quantities here only ever affects this one week — every other
// week showing the same meal keeps using the shared default until it's overridden separately.
function SlotIngredientEditor({ meal, mealId, tier, category, coachId, mealSplit, overridesForSlot, onChangeQty, onRevertAll, onGenerated }) {
  const [library, setLibrary] = useState([])
  const [baseIngredients, setBaseIngredients] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const version = (meal?.meal_tier_versions || []).find(v => v.calorie_tier === tier)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingBase(true)
      const [{ data: lib }, { data: baseIng }] = await Promise.all([
        supabase.from('ingredients').select('*').eq('coach_id', coachId),
        supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id'),
      ])
      if (cancelled) return
      setLibrary(lib || [])
      setBaseIngredients(baseIng || [])
      setLoadingBase(false)
    }
    load()
    return () => { cancelled = true }
  }, [mealId])

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    const targets = tierTargetsForCategory(tier, category, mealSplit)
    const generated = generateTierIngredients(baseIngredients, library, targets)
    try {
      await insertTierVersion(mealId, tier, generated)
    } catch (err) {
      setError(err.message)
      setGenerating(false)
      return
    }
    setGenerating(false)
    onGenerated?.()
  }

  const fixedWarning = !loadingBase && allIngredientsFixed(baseIngredients) && (
    <p className="text-xs text-amber-500 px-2 pt-2">
      Every ingredient in this meal is marked Fixed, so it can't be scaled to this tier's target — mark at least one ingredient Flexible in the Meal Library to fix this.
    </p>
  )

  if (!version) {
    if (loadingBase) return <p className="text-xs text-gray-400 py-2 px-2">Loading ingredients…</p>
    return (
      <div>
        {fixedWarning}
        <div className="py-3 px-2 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-500">No {tier} kcal version yet for this meal.</p>
          <button onClick={handleGenerate} disabled={generating || baseIngredients.length === 0} className="text-xs btn-secondary py-1 px-2.5 whitespace-nowrap">
            {generating ? 'Generating…' : 'Generate now'}
          </button>
        </div>
      </div>
    )
  }

  const ingredients = getIngredients(meal, tier, overridesForSlot)
  const overridden = hasAnyOverride(overridesForSlot)
  const { qty: overrideQty } = normalizeOverrides(overridesForSlot)

  return (
    <div className="space-y-1 py-2 px-2">
      {fixedWarning}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {ingredients.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium pb-1">
          <span className="flex-1">Ingredient</span>
          <span className="w-16 text-right">Amount</span>
          <span className="w-14 text-right">Kcal</span>
          <span className="w-10 text-right">C</span>
          <span className="w-10 text-right">P</span>
          <span className="w-10 text-right">F</span>
        </div>
      )}
      {ingredients.map(ing => (
        <div key={ing.id} className="flex items-center gap-2 text-xs">
          <span className={`flex-1 truncate ${overrideQty[ing.id] != null ? 'text-brand-600 dark:text-brand-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
            {ing.name}
          </span>
          <span className="w-16 flex items-center justify-end gap-1">
            <input
              type="number"
              className="w-11 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5"
              value={ing.quantity_g}
              onChange={e => onChangeQty(ing.id, e.target.value)}
            />
            <span className="text-gray-400 text-[10px]">{ing.unit || 'g'}</span>
          </span>
          <span className="w-14 text-right text-gray-500 dark:text-gray-400 tabular-nums">{round1(ing.calories)}</span>
          <span className="w-10 text-right text-gray-500 dark:text-gray-400 tabular-nums">{round1(ing.carbs_g)}</span>
          <span className="w-10 text-right text-gray-500 dark:text-gray-400 tabular-nums">{round1(ing.protein_g)}</span>
          <span className="w-10 text-right text-gray-500 dark:text-gray-400 tabular-nums">{round1(ing.fat_g)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          {overridden ? 'Adjusted for this week only — every other week keeps the default' : "Using this meal's default quantities"}
        </span>
        {overridden && (
          <button onClick={onRevertAll} className="text-xs text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium">
            Revert to default
          </button>
        )}
      </div>
    </div>
  )
}

export default function PlanGroupEditor() {
  const { groupId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [planGroup, setPlanGroup] = useState(null)
  // The standard/master 20-week template (calorie_tier = null).
  const [weeks, setWeeks] = useState([])
  // Per-tier forks of the above, keyed by calorie number — only populated once a tier has been
  // forked (either previously saved, or forked just now by opening its tab for the first time).
  const [tierWeeks, setTierWeeks] = useState({})
  // Which calorie tiers actually have an active client on this plan group, and therefore need
  // their own editable fork — a tier nobody is on stays hidden.
  const [availableTiers, setAvailableTiers] = useState([])
  // null = editing the standard template; otherwise one of CALORIE_TIERS.
  const [activeTier, setActiveTier] = useState(null)
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [mealsById, setMealsById] = useState({})
  const [ingredientLib, setIngredientLib] = useState({})
  const [expanded, setExpanded] = useState(new Set())
  const [dirty, setDirty] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [forking, setForking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  // `${weekIdx}:${slotKey}` of the ingredient editor currently open, or null.
  const [editingIngredients, setEditingIngredients] = useState(null)
  const [defaultPreworkout, setDefaultPreworkout] = useState('')
  const [defaultEveningSnack, setDefaultEveningSnack] = useState('')
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [savedDefaults, setSavedDefaults] = useState(false)
  // { weekIdx, slotKey } of the swap picker currently open, or null.
  const [swapPicker, setSwapPicker] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: group }, { data: templates }, { data: meals }, { data: assignments }, { data: ingredientsData }] = await Promise.all([
        supabase.from('plan_groups').select('*').eq('id', groupId).single(),
        supabase
          .from('weekly_templates')
          .select('id, week_number, calorie_tier, template_meal_slots(slot_type, meal_id, ingredient_overrides)')
          .eq('plan_group_id', groupId)
          .order('week_number'),
        supabase
          .from('meals')
          .select(`
            id, name, category, photo_url, photo_position,
            meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static),
            meal_tier_versions(calorie_tier, calories, protein_g, carbs_g, fat_g,
              meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
          `)
          .eq('coach_id', profile.id)
          .order('name'),
        supabase
          .from('client_plan_assignments')
          .select('calorie_target')
          .eq('plan_group_id', groupId)
          .eq('active', true),
        supabase.from('ingredients').select('id, name, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving').eq('coach_id', profile.id),
      ])

      if (group) {
        setPlanGroup(group)
        setDefaultPreworkout(group.default_preworkout_meal_id || '')
        setDefaultEveningSnack(group.default_evening_snack_meal_id || '')
      }

      const byCategory = {}
      const byId = {}
      for (const m of (meals || [])) {
        if (m.photo_url) m.photo_url = supabase.storage.from('meal-photos').getPublicUrl(m.photo_url).data.publicUrl
        ;(byCategory[m.category] = byCategory[m.category] || []).push(m)
        byId[m.id] = m
      }
      setMealsByCategory(byCategory)
      setMealsById(byId)

      const libById = {}
      for (const ing of (ingredientsData || [])) libById[ing.id] = ing
      setIngredientLib(libById)

      const usedTargets = new Set((assignments || []).map(a => a.calorie_target))
      setAvailableTiers(CALORIE_TIERS.filter(t => usedTargets.has(t)))

      const master = []
      const byTier = {}
      for (const t of (templates || [])) {
        const slots = {}
        const overrides = {}
        for (const s of (t.template_meal_slots || [])) {
          slots[s.slot_type] = s.meal_id
          if (s.ingredient_overrides) overrides[s.slot_type] = s.ingredient_overrides
        }
        const week = { templateId: t.id, weekNum: t.week_number, slots, overrides }
        if (t.calorie_tier == null) master.push(week)
        else (byTier[t.calorie_tier] = byTier[t.calorie_tier] || []).push(week)
      }
      master.sort((a, b) => a.weekNum - b.weekNum)
      for (const tier of Object.keys(byTier)) byTier[tier].sort((a, b) => a.weekNum - b.weekNum)
      setWeeks(master)
      setTierWeeks(byTier)
      setLoading(false)
    }
    load()
  }, [groupId, profile.id])

  const currentWeeks = activeTier == null ? weeks : (tierWeeks[activeTier] || [])
  const mealSplit = normalizeMealSplit(profile.meal_split)

  // A meal's macros at the tier being edited — its tier version's numbers (with any per-week
  // ingredient override applied) if one exists for this tier, or its base recipe's totals when
  // editing the tier-agnostic Standard template.
  function mealMacros(mealId, tier, overridesForSlot) {
    const m = sharedMealMacros(mealId, mealsById, tier, overridesForSlot)
    return m ? { calories: round1(m.cal), protein_g: round1(m.prot), carbs_g: round1(m.carb), fat_g: round1(m.fat) } : null
  }

  function sumSlotMacros(week, keys, tier) {
    const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    let complete = true
    for (const key of keys) {
      const slotId = week.slots[key]
      if (!slotId) continue  // empty slot — don't flag as incomplete
      const m = mealMacros(slotId, tier, week.overrides?.[key])
      if (!m) { complete = false; continue }
      t.calories += m.calories
      t.protein_g += m.protein_g
      t.carbs_g += m.carbs_g
      t.fat_g += m.fat_g
    }
    return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g), complete }
  }

  // Re-fetches one meal in the same shape the initial load uses, so cards/editors relying on its
  // photo, ingredients, and tier ingredients (e.g. right after generating a new tier version) stay
  // in sync without a full page reload.
  async function refreshMeal(mealId) {
    const { data: meal } = await supabase
      .from('meals')
      .select(`
        id, name, category, photo_url, photo_position,
        meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static),
        meal_tier_versions(calorie_tier, calories, protein_g, carbs_g, fat_g,
          meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
      `)
      .eq('id', mealId)
      .single()
    if (meal) {
      if (meal.photo_url) meal.photo_url = supabase.storage.from('meal-photos').getPublicUrl(meal.photo_url).data.publicUrl
      setMealsById(prev => ({ ...prev, [mealId]: meal }))
    }
  }

  async function selectTier(tier) {
    setActiveTier(tier)
    if (tier != null && !tierWeeks[tier]) await forkTier(tier)
  }

  // Copies the standard template's meals into a brand-new set of weekly_templates rows scoped to
  // this calorie tier, so the coach starts from "the standard 20-week meal" and can then tweak just
  // this tier without touching the standard template or any other tier.
  async function forkTier(tier) {
    setForking(true)
    setSaveError('')

    const templateRows = weeks.map(w => ({
      coach_id: profile.id,
      name: `${planGroup?.name || 'Plan'} — ${tier} kcal — Week ${w.weekNum}`,
      week_number: w.weekNum,
      plan_group_id: groupId,
      plan_group_name: planGroup?.name || null,
      calorie_tier: tier,
    }))

    const { data: inserted, error: insTmplErr } = await supabase.from('weekly_templates').insert(templateRows).select('id, week_number')
    if (insTmplErr) { setSaveError(insTmplErr.message); setForking(false); return }

    const slotRows = []
    for (const ins of inserted) {
      const masterWeek = weeks.find(w => w.weekNum === ins.week_number)
      for (const slot of SLOTS) {
        if (masterWeek?.slots[slot.key]) {
          slotRows.push({ template_id: ins.id, slot_type: slot.key, meal_id: masterWeek.slots[slot.key], scaled_version_id: null })
        }
      }
    }
    if (slotRows.length) {
      const { error: insSlotErr } = await supabase.from('template_meal_slots').insert(slotRows)
      if (insSlotErr) { setSaveError(insSlotErr.message); setForking(false); return }
    }

    const newWeeks = inserted
      .map(ins => ({ templateId: ins.id, weekNum: ins.week_number, slots: { ...(weeks.find(w => w.weekNum === ins.week_number)?.slots || {}) }, overrides: {} }))
      .sort((a, b) => a.weekNum - b.weekNum)
    setTierWeeks(prev => ({ ...prev, [tier]: newWeeks }))
    setForking(false)
  }

  function toggleExpand(weekNum) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(weekNum) ? s.delete(weekNum) : s.add(weekNum)
      return s
    })
  }

  // WHICH MEAL occupies a slot is shared across the Standard template and every calorie tier —
  // every client sees the same meal each week, just at their own tier's portion size — so this
  // writes the change to the matching week (by week number) everywhere, not just the tier
  // currently being viewed. Breakfast/lunch/dinner only change for the week being edited.
  // Pre-workout/evening-snack are the same every week, so changing one writes the new meal into
  // every week at once. Any ingredient override on the slot is cleared when its meal changes — a
  // correction calibrated for the old meal's ingredients wouldn't mean anything applied to a
  // different meal.
  function changeSlot(weekIdx, slotKey, mealId) {
    const isStatic = STATIC_SLOT_KEYS.has(slotKey)
    const weekNums = isStatic ? currentWeeks.map(w => w.weekNum) : [currentWeeks[weekIdx].weekNum]
    const weekNumSet = new Set(weekNums)

    const apply = w => {
      if (!weekNumSet.has(w.weekNum)) return w
      const nextOverrides = { ...w.overrides }
      delete nextOverrides[slotKey]
      return { ...w, slots: { ...w.slots, [slotKey]: mealId || null }, overrides: nextOverrides }
    }
    setWeeks(prev => prev.map(apply))
    setTierWeeks(prev => {
      const next = {}
      for (const [tier, tw] of Object.entries(prev)) next[tier] = tw.map(apply)
      return next
    })

    const allWeeks = [...weeks, ...Object.values(tierWeeks).flat()]
    setDirty(prev => {
      const s = new Set(prev)
      allWeeks.forEach(w => { if (weekNumSet.has(w.weekNum)) s.add(w.templateId) })
      return s
    })
  }

  // Adjusts a single ingredient's quantity for just this (week, slot) — stored as an override on
  // top of the meal's shared default recipe, so no other week showing the same meal is affected.
  function changeIngredientOverride(weekIdx, slotKey, ingId, newQtyStr) {
    const newQty = parseFloat(newQtyStr)
    const setActiveWeeks = activeTier == null
      ? setWeeks
      : updater => setTierWeeks(prev => ({ ...prev, [activeTier]: updater(prev[activeTier] || []) }))

    setActiveWeeks(prev => prev.map((w, i) => {
      if (i !== weekIdx) return w
      const existing = normalizeOverrides(w.overrides?.[slotKey])
      const nextQty = { ...existing.qty, [ingId]: isNaN(newQty) ? 0 : newQty }
      return { ...w, overrides: { ...w.overrides, [slotKey]: { ...existing, qty: nextQty } } }
    }))
    setDirty(prev => new Set(prev).add(currentWeeks[weekIdx].templateId))
  }

  // Clears every per-week override on a slot, reverting it back to the meal's shared defaults.
  function revertSlotOverrides(weekIdx, slotKey) {
    const setActiveWeeks = activeTier == null
      ? setWeeks
      : updater => setTierWeeks(prev => ({ ...prev, [activeTier]: updater(prev[activeTier] || []) }))

    setActiveWeeks(prev => prev.map((w, i) => {
      if (i !== weekIdx) return w
      const nextOverrides = { ...w.overrides }
      delete nextOverrides[slotKey]
      return { ...w, overrides: nextOverrides }
    }))
    setDirty(prev => new Set(prev).add(currentWeeks[weekIdx].templateId))
  }

  function handleSwap(weekIdx, slotKey, candidateId) {
    const originalId = currentWeeks[weekIdx].slots[slotKey] || null

    // Find the week where the candidate currently occupies this same slot
    let candidateWeekIdx = -1
    for (let i = 0; i < currentWeeks.length; i++) {
      if (i === weekIdx) continue
      if (currentWeeks[i].slots[slotKey] === candidateId) { candidateWeekIdx = i; break }
    }

    changeSlot(weekIdx, slotKey, candidateId)
    if (candidateWeekIdx !== -1) changeSlot(candidateWeekIdx, slotKey, originalId)
    setSwapPicker(null)
  }

  async function updateCurrentWeek(week) {
    await supabase.from('plan_groups').update({ current_week: week }).eq('id', groupId)
    setPlanGroup(prev => ({ ...prev, current_week: week }))
  }

  async function handleSaveDefaults() {
    setSavingDefaults(true)
    setSavedDefaults(false)

    // Persist on the plan group record
    await supabase.from('plan_groups').update({
      default_preworkout_meal_id:    defaultPreworkout    || null,
      default_evening_snack_meal_id: defaultEveningSnack || null,
    }).eq('id', groupId)

    // Write into every template in this plan group (master + all calorie-tier forks)
    const allWeeks = [...weeks, ...Object.values(tierWeeks).flat()]
    const allTemplateIds = allWeeks.map(w => w.templateId)

    if (allTemplateIds.length) {
      const slotsToReplace = [
        ...(defaultPreworkout    ? ['preworkout']    : []),
        ...(defaultEveningSnack  ? ['evening_snack'] : []),
      ]

      // Remove old static slots then re-insert so the meal is always current
      if (slotsToReplace.length) {
        await supabase.from('template_meal_slots')
          .delete()
          .in('template_id', allTemplateIds)
          .in('slot_type', slotsToReplace)

        const rows = []
        for (const templateId of allTemplateIds) {
          if (defaultPreworkout)
            rows.push({ template_id: templateId, slot_type: 'preworkout',    meal_id: defaultPreworkout,   scaled_version_id: null })
          if (defaultEveningSnack)
            rows.push({ template_id: templateId, slot_type: 'evening_snack', meal_id: defaultEveningSnack, scaled_version_id: null })
        }
        await supabase.from('template_meal_slots').insert(rows)
      }

      // Mirror into in-memory state so the editor reflects the change without a full reload.
      // The meal is changing, so any per-week override on these slots no longer applies to
      // anything and is cleared along with it.
      const applyDefaults = prev => prev.map(w => {
        const nextOverrides = { ...w.overrides }
        if (defaultPreworkout) delete nextOverrides.preworkout
        if (defaultEveningSnack) delete nextOverrides.evening_snack
        return {
          ...w,
          slots: {
            ...w.slots,
            ...(defaultPreworkout   ? { preworkout:    defaultPreworkout   } : {}),
            ...(defaultEveningSnack ? { evening_snack: defaultEveningSnack } : {}),
          },
          overrides: nextOverrides,
        }
      })
      setWeeks(applyDefaults)
      setTierWeeks(prev => {
        const next = {}
        for (const [tier, tw] of Object.entries(prev)) next[tier] = applyDefaults(tw)
        return next
      })
      setDirty(new Set())
    }

    setSavingDefaults(false)
    setSavedDefaults(true)
  }

  async function handleSaveDirty() {
    setSaving(true)
    setSaveError('')

    const allWeeks = [...weeks, ...Object.values(tierWeeks).flat()]

    for (const week of allWeeks) {
      if (!dirty.has(week.templateId)) continue

      const { error: delErr } = await supabase
        .from('template_meal_slots')
        .delete()
        .eq('template_id', week.templateId)

      if (delErr) { setSaveError(delErr.message); setSaving(false); return }

      const rows = SLOTS
        .filter(s => week.slots[s.key])
        .map(s => ({
          template_id: week.templateId,
          slot_type: s.key,
          meal_id: week.slots[s.key],
          scaled_version_id: null,
          ingredient_overrides: week.overrides?.[s.key] || null,
        }))

      if (rows.length) {
        const { error: insErr } = await supabase.from('template_meal_slots').insert(rows)
        if (insErr) { setSaveError(insErr.message); setSaving(false); return }
      }
    }

    setDirty(new Set())
    setSaving(false)
  }

  // Rotates every meal available for each slot's category across the weeks in the arrangement
  // that gets each day as close as possible to the calorie and macro target for the tier being
  // viewed, then applies that same meal-per-week choice to the Standard template and every other
  // calorie tier — every client eats the same meal each week regardless of their tier, just at
  // their own portion size. The pool for each slot is every meal in that category with a tier
  // version for the tier being viewed — including any meal added to the library since the
  // rotation was last built — so a brand-new meal gets woven into the schedule the next time this
  // runs, without needing to be placed by hand first. Only WHICH WEEK each meal lands on changes;
  // nothing about the meal itself (its ingredients, tier versions, or any manual quantity
  // corrections) is touched.
  //
  // Algorithm:
  //   1. Collect every meal in the slot's category that has a tier version for the active tier —
  //      that's the pool, whether or not it's already in the rotation.
  //   2. Build a round-robin schedule for each slot by cycling through its pool so every meal
  //      gets equal airtime and no meal repeats until all others have appeared.
  //   3. Run pairwise swap-improvement for each slot independently (holding the other 5 fixed):
  //      swap week i's meal with week j's in this slot if it lowers the sum of those two weeks'
  //      day-total scores. This converges in a few passes and runs entirely in-memory.
  function handleOptimize() {
    if (activeTier == null) return
    setOptimizing(true)

    const tgtMacros = calcStandardMacros(activeTier)
    const N = currentWeeks.length

    // Every meal in this slot's category with a tier version for the active tier — meals
    // currently placed in the rotation first (in first-seen week order), then any other library
    // meal for the category not yet in the rotation (including newly added ones). Meals without
    // a tier version are excluded — they'd contribute 0 kcal to the day total and make every week
    // they land in look 100-200 kcal under.
    function buildPool(slotKey) {
      const seen = new Set()
      const order = []
      for (const w of currentWeeks) {
        const id = w.slots[slotKey]
        if (id && !seen.has(id) && mealMacros(id, activeTier) != null) { seen.add(id); order.push(id) }
      }
      const cat = MAIN_SLOTS.find(s => s.key === slotKey)?.cat
      ;(mealsByCategory[cat] || [])
        .filter(m => (m.meal_tier_versions || []).some(v => v.calorie_tier === activeTier))
        .forEach(m => { if (!seen.has(m.id)) { seen.add(m.id); order.push(m.id) } })
      return order
    }

    const pools = {}
    for (const s of MAIN_SLOTS) pools[s.key] = buildPool(s.key)

    // Build initial schedule: space meals at least 6 weeks apart where possible.
    // At each position pick the eligible meal (not used in the last 6 weeks) that
    // was used longest ago; fall back to the oldest-used if all are still hot.
    function makeRoundRobin(pool) {
      if (!pool.length) return Array(N).fill(null)
      const MIN_GAP = 6
      const result = []
      const lastUsed = new Map()
      for (let i = 0; i < N; i++) {
        let best = null, bestScore = -Infinity
        for (const meal of pool) {
          const last = lastUsed.has(meal) ? lastUsed.get(meal) : -Infinity
          const gap = i - last
          const score = gap >= MIN_GAP ? gap : (gap - MIN_GAP) * 100
          if (score > bestScore) { bestScore = score; best = meal }
        }
        result.push(best)
        if (best != null) lastUsed.set(best, i)
      }
      return result
    }

    // Current schedules — one array of meal IDs per slot, indexed by week position 0..19.
    const scheds = {}
    for (const s of MAIN_SLOTS) scheds[s.key] = makeRoundRobin(pools[s.key])

    // How far a full day total deviates from the tier target — same 4:1:1:1 weighting as the
    // tier solver so the same quality bar applies here.
    // Also penalises: same meal in A and B of the same category (very heavy), and
    // any meal re-used within MIN_GAP weeks in the same slot (moderate penalty).
    const MIN_GAP = 6
    function dayScore(weekIdx) {
      const staticIds = [
        currentWeeks[weekIdx].slots['preworkout']    || defaultPreworkout    || null,
        currentWeeks[weekIdx].slots['evening_snack'] || defaultEveningSnack  || null,
      ].filter(Boolean)
      let scoreA = 0, scoreB = 0
      for (const opt of [['breakfast1','lunch1','dinner1'], ['breakfast2','lunch2','dinner2']]) {
        let cal = 0, prot = 0, carbs = 0, fat = 0
        for (const id of [...opt.map(k => scheds[k][weekIdx]), ...staticIds]) {
          const m = id ? mealMacros(id, activeTier) : null
          if (!m) continue
          cal += m.calories; prot += m.protein_g; carbs += m.carbs_g; fat += m.fat_g
        }
        const s = 4*Math.abs(cal-activeTier) + Math.abs(prot-tgtMacros.protein_g) + Math.abs(carbs-tgtMacros.carbs_g) + Math.abs(fat-tgtMacros.fat_g)
        if (opt[0] === 'breakfast1') scoreA = s; else scoreB = s
      }
      // Penalty: A and B same meal in same category this week
      let penalty = 0
      for (const cat of ['breakfast', 'lunch', 'dinner']) {
        const idA = scheds[`${cat}1`][weekIdx], idB = scheds[`${cat}2`][weekIdx]
        if (idA && idB && idA === idB) penalty += 5000
      }
      // Penalty: same meal repeated in same slot within MIN_GAP weeks
      for (const s of MAIN_SLOTS) {
        const meal = scheds[s.key][weekIdx]
        if (!meal) continue
        for (let k = Math.max(0, weekIdx - MIN_GAP); k < weekIdx; k++) {
          if (scheds[s.key][k] === meal) { penalty += 500; break }
        }
      }
      return scoreA + scoreB + penalty
    }

    // Swap-improve one slot's schedule: try every pair of weeks; keep the swap if it lowers the
    // combined score of those two weeks. Repeat until no improvement.
    function improveSlot(key) {
      let improved = true
      while (improved) {
        improved = false
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            if (scheds[key][i] === scheds[key][j]) continue
            const before = dayScore(i) + dayScore(j)
            ;[scheds[key][i], scheds[key][j]] = [scheds[key][j], scheds[key][i]]
            const after = dayScore(i) + dayScore(j)
            if (after < before - 0.01) { improved = true }
            else { ;[scheds[key][i], scheds[key][j]] = [scheds[key][j], scheds[key][i]] }
          }
        }
      }
    }

    // Coordinate descent: improve each slot holding the others fixed, repeat until stable.
    for (let pass = 0; pass < 4; pass++) {
      for (const s of MAIN_SLOTS) improveSlot(s.key)
    }

    // Every client should see the same meal each week regardless of their calorie tier — only
    // portion sizes differ — so the result gets applied to the Standard template and every other
    // tier fork too, matched up by week number, not just the tier used to score this run.
    const byWeekNum = new Map(currentWeeks.map((week, i) => [
      week.weekNum,
      Object.fromEntries(MAIN_SLOTS.map(s => [s.key, scheds[s.key][i]])),
    ]))
    const applyOptimized = w => byWeekNum.has(w.weekNum) ? { ...w, slots: { ...w.slots, ...byWeekNum.get(w.weekNum) } } : w

    setWeeks(prev => prev.map(applyOptimized))
    setTierWeeks(prev => {
      const next = {}
      for (const [tier, tw] of Object.entries(prev)) next[tier] = tw.map(applyOptimized)
      return next
    })

    const allWeeks = [...weeks, ...Object.values(tierWeeks).flat()]
    setDirty(new Set(allWeeks.filter(w => byWeekNum.has(w.weekNum)).map(w => w.templateId)))
    setOptimizing(false)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate min-w-0">{planGroup?.name}</h1>
          {dirty.size > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex-shrink-0">
              {dirty.size} unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {activeTier != null && (
            <button
              onClick={handleOptimize}
              disabled={optimizing || forking}
              className="btn-secondary"
              title="Re-spreads every breakfast, lunch, and dinner meal (including any you've added since this was last run) across the weeks to get each day as close as possible to this tier's calorie and macro targets — then applies the same meal choice to the Standard template and every other calorie tier, so every client eats the same meal each week at their own portion size."
            >
              {optimizing ? 'Optimising…' : 'Optimise combinations'}
            </button>
          )}
          <button
            onClick={handleSaveDirty}
            disabled={saving || dirty.size === 0}
            className="btn-primary"
          >
            {saving ? 'Saving…' : `Save ${dirty.size} Week${dirty.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
        </div>
      )}

      {planGroup && (
        <div className="card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Current week:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateCurrentWeek(planGroup.current_week > 1 ? planGroup.current_week - 1 : 50)}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ‹
              </button>
              <select
                className="mx-1 text-sm font-semibold text-gray-900 dark:text-white bg-pink-50 dark:bg-pink-900/20 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-300 cursor-pointer"
                value={planGroup.current_week}
                onChange={e => updateCurrentWeek(parseInt(e.target.value))}
              >
                {Array.from({ length: 50 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
              <button
                onClick={() => updateCurrentWeek(planGroup.current_week < 50 ? planGroup.current_week + 1 : 1)}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ›
              </button>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Advance this each week — all clients update automatically
            </span>
          </div>
        </div>
      )}

      {planGroup && (
        <div className="card space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Default static meals</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              These meals are automatically pinned when this rotation is assigned to a client.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Pre-workout</label>
              <select
                className="input text-sm"
                value={defaultPreworkout}
                onChange={e => { setDefaultPreworkout(e.target.value); setSavedDefaults(false) }}
              >
                <option value="">None</option>
                {(mealsByCategory['pre_workout'] || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Evening snack</label>
              <select
                className="input text-sm"
                value={defaultEveningSnack}
                onChange={e => { setDefaultEveningSnack(e.target.value); setSavedDefaults(false) }}
              >
                <option value="">None</option>
                {(mealsByCategory['evening_snack'] || []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDefaults} disabled={savingDefaults} className="btn-secondary text-sm">
              {savingDefaults ? 'Saving…' : 'Save defaults'}
            </button>
            {savedDefaults && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
          </div>
        </div>
      )}

      {availableTiers.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => selectTier(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTier == null
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Standard
          </button>
          {availableTiers.map(tier => (
            <button
              key={tier}
              onClick={() => selectTier(tier)}
              disabled={forking}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTier === tier
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tier} kcal{!tierWeeks[tier] ? ' (not set up yet)' : ''}
            </button>
          ))}
        </div>
      )}

      {activeTier != null ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Editing the {activeTier} kcal version of this plan. Which meal appears each week is shared across every calorie tier and the Standard template — changing a meal here, swapping it, or optimising also updates every other tier, so every client eats the same meal at their own portion size. Only ingredient quantities (and per-week corrections) are specific to this tier. Expand a week to see how closely each day's macros match the target.
        </p>
      ) : availableTiers.length > 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Editing the standard version of this plan. Changing which meal appears each week here also updates every calorie tier, so every client eats the same meal at their own portion size. Select a calorie tier above to see how closely each day matches that tier's calorie and macro targets, or to adjust that tier's ingredient quantities.
        </p>
      ) : null}

      {forking ? (
        <LoadingSpinner size="md" className="py-10" />
      ) : currentWeeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const isCurrent = planGroup && week.weekNum === planGroup.current_week
        const isDirty = dirty.has(week.templateId)
        const opt1Totals = sumSlotMacros(week, ['breakfast1', 'lunch1', 'dinner1', 'preworkout', 'evening_snack'], activeTier)
        const opt2Totals = sumSlotMacros(week, ['breakfast2', 'lunch2', 'dinner2', 'preworkout', 'evening_snack'], activeTier)

        return (
          <div key={week.templateId} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
              onClick={() => toggleExpand(week.weekNum)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Week {week.weekNum}</span>
                {isCurrent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300">
                    Current
                  </span>
                )}
                {isDirty && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <OptionTotal label="A" totals={opt1Totals} target={activeTier} />
                    <MacroDots totals={opt1Totals} tier={activeTier} />
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <OptionTotal label="B" totals={opt2Totals} target={activeTier} />
                    <MacroDots totals={opt2Totals} tier={activeTier} />
                  </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="p-3 space-y-3">
                {activeTier != null && (opt1Totals.calories > 0 || opt2Totals.calories > 0) && (
                  <div className="px-1 pb-1 space-y-1">
                    <MacroMatchRow label="A" totals={opt1Totals} tier={activeTier} />
                    <MacroMatchRow label="B" totals={opt2Totals} tier={activeTier} />
                  </div>
                )}
                {SLOTS.map(slot => {
                  const options = mealsByCategory[slot.cat] || []
                  const mealId = week.slots[slot.key] || ''
                  const meal = mealId ? mealsById[mealId] : null
                  const overridesForSlot = week.overrides?.[slot.key]
                  const macros = mealMacros(mealId, activeTier, overridesForSlot)
                  const isStatic = STATIC_SLOT_KEYS.has(slot.key)
                  const editKey = mealId && activeTier != null ? `${weekIdx}:${slot.key}` : null
                  const isEditingIngredients = editKey != null && editingIngredients === editKey
                  const previewIngredients = meal ? getIngredients(meal, activeTier, overridesForSlot) : []
                  const isOverridden = hasAnyOverride(overridesForSlot)
                  const isSwapOpen = swapPicker?.weekIdx === weekIdx && swapPicker?.slotKey === slot.key
                  return (
                    <div key={slot.key} className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full sm:w-32 aspect-[16/9] sm:aspect-square bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                          {meal?.photo_url ? (
                            <img src={meal.photo_url} alt={meal.name} className="w-full h-full object-cover" style={{ objectPosition: meal.photo_position || '50% 50%' }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <span className="absolute top-2 left-2 text-xs font-semibold bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                            {slot.label}
                          </span>
                          {isOverridden && (
                            <span className="absolute top-2 right-2 text-xs font-semibold bg-brand-500 text-white px-2 py-0.5 rounded-full shadow-sm" title="Ingredient quantities adjusted for this week only">
                              Adjusted
                            </span>
                          )}
                          {isStatic && (
                            <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                              Same every week
                            </span>
                          )}
                        </div>

                        <div className="p-3 space-y-2 flex-1 min-w-0">
                          <select
                            className="w-full text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                            value={mealId}
                            onChange={e => changeSlot(weekIdx, slot.key, e.target.value)}
                          >
                            <option value="">— None —</option>
                            {options.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>

                          {previewIngredients.length > 0 && (
                            <div className="space-y-0.5">
                              {previewIngredients.slice(0, 5).map((ing, i) => (
                                <div key={ing.id || i} className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 tabular-nums">
                                    {formatAmount(ing, ingredientLib)}
                                  </span>
                                  <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{ing.name}</span>
                                </div>
                              ))}
                              {previewIngredients.length > 5 && (
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">+{previewIngredients.length - 5} more</p>
                              )}
                            </div>
                          )}

                          {mealId && (
                            <div className="text-xs">
                              {macros ? (
                                <span className="text-gray-500 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{macros.calories} kcal</span>
                                  {' · '}{macros.protein_g}P {macros.carbs_g}C {macros.fat_g}F
                                </span>
                              ) : (
                                <span className="text-amber-500" title="Generate this meal's calorie tiers in the Meal Library">
                                  No {activeTier} kcal version
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-0.5">
                            {editKey != null && (
                              <button
                                onClick={() => setEditingIngredients(prev => prev === editKey ? null : editKey)}
                                className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex-shrink-0 whitespace-nowrap"
                              >
                                {isEditingIngredients ? 'Hide' : 'Edit ingredients'}
                              </button>
                            )}
                            {!isStatic && mealId && (
                              <button
                                onClick={() => setSwapPicker(prev =>
                                  prev?.weekIdx === weekIdx && prev?.slotKey === slot.key ? null :
                                  { weekIdx, slotKey: slot.key }
                                )}
                                className="text-xs text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 flex-shrink-0 whitespace-nowrap"
                                title="Swap this meal with one from another week"
                              >
                                ⇄ Swap with another week
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {isEditingIngredients && (
                        <div className="mx-3 mb-3 bg-gray-50/60 dark:bg-gray-800/30 rounded-lg">
                          <SlotIngredientEditor
                            meal={meal}
                            mealId={mealId}
                            tier={activeTier}
                            category={slot.cat}
                            coachId={profile.id}
                            mealSplit={mealSplit}
                            overridesForSlot={overridesForSlot}
                            onChangeQty={(ingId, val) => changeIngredientOverride(weekIdx, slot.key, ingId, val)}
                            onRevertAll={() => revertSlotOverrides(weekIdx, slot.key)}
                            onGenerated={() => refreshMeal(mealId)}
                          />
                        </div>
                      )}
                      {isSwapOpen && (
                        <div className="mx-3 mb-3 border border-brand-100 dark:border-brand-900/30 bg-brand-50/40 dark:bg-brand-900/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Swap {slot.label} with…
                            </span>
                            <button onClick={() => setSwapPicker(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              Cancel
                            </button>
                          </div>
                          <div className="space-y-0.5 max-h-52 overflow-y-auto">
                            {(mealsByCategory[slot.cat] || [])
                              .filter(m => m.id !== mealId)
                              .map(candidate => {
                                const candMacros = mealMacros(candidate.id, activeTier)
                                const hasTierVersion = activeTier == null || candMacros != null
                                let currentLoc = null
                                for (let wi = 0; wi < currentWeeks.length; wi++) {
                                  if (currentWeeks[wi].slots[slot.key] === candidate.id) {
                                    currentLoc = currentWeeks[wi].weekNum; break
                                  }
                                }
                                return (
                                  <button
                                    key={candidate.id}
                                    onClick={() => handleSwap(weekIdx, slot.key, candidate.id)}
                                    disabled={!hasTierVersion && activeTier != null}
                                    title={!hasTierVersion && activeTier != null ? `No ${activeTier} kcal version — generate tier ingredients first` : ''}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                                      hasTierVersion
                                        ? 'hover:bg-brand-100/60 dark:hover:bg-brand-900/30 text-gray-800 dark:text-gray-200'
                                        : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasTierVersion ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                    <span className="flex-1 font-medium truncate">{candidate.name}</span>
                                    {candMacros && (
                                      <span className="text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">{candMacros.calories} kcal</span>
                                    )}
                                    {currentLoc != null ? (
                                      <span className="text-brand-500 dark:text-brand-400 flex-shrink-0">↔ Week {currentLoc}</span>
                                    ) : (
                                      <span className="text-gray-300 dark:text-gray-500 flex-shrink-0">not in rotation</span>
                                    )}
                                  </button>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {dirty.size > 0 && (
        <div className="sticky bottom-4 flex justify-end pb-2">
          <button
            onClick={handleSaveDirty}
            disabled={saving}
            className="btn-primary shadow-lg"
          >
            {saving ? 'Saving…' : `Save ${dirty.size} Week${dirty.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
