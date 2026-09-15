import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { normalizeMealSplit } from '../../lib/calorieSplit'
import { calcStandardMacros } from '../../lib/macros'
import {
  getIngredients, formatAmount, mealMacros as sharedMealMacros, hasAnyOverride,
  sumIngredientMacros, MacroTargetInfo, MacroBadge, MACRO_META, deviationColor, suggestAutoFit,
} from '../../components/MealPlanView'
import {
  generateTierIngredients, insertTierVersion, tierTargetsForCategory, allIngredientsFixed, balanceDayIngredients, calcTotals,
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
const SLOT_LABELS = Object.fromEntries(SLOTS.map(s => [s.key, s.label]))
const OPTION_A_KEYS = ['breakfast1', 'lunch1', 'dinner1', 'preworkout', 'evening_snack']
const OPTION_B_KEYS = ['breakfast2', 'lunch2', 'dinner2', 'preworkout', 'evening_snack']

// Option B needs to stay as close as possible to Option A (a client eats whichever one on any
// given day), so each B slot's target is A's own sibling slot rather than a generic tier share.
const SIBLING_SLOT = { breakfast1: 'breakfast2', breakfast2: 'breakfast1', lunch1: 'lunch2', lunch2: 'lunch1', dinner1: 'dinner2', dinner2: 'dinner1' }

function round1(n) {
  return Math.round(n * 10) / 10
}

// The day's calories should land within 20 kcal of target either way - a stricter, absolute
// pass/fail band (unlike the %-based bands used for macros elsewhere), so the week row's colour
// reflects whether the day is genuinely within the limits that actually matter for calories, not
// just roughly close.
const UNDER_TARGET_TOLERANCE = 20
const OVER_TARGET_TOLERANCE = 20

function calorieRangeColor(actual, target) {
  if (!target) return 'text-gray-500 dark:text-gray-400'
  const diff = target - actual
  if (diff > UNDER_TARGET_TOLERANCE) return 'text-amber-500'
  if (diff < -OVER_TARGET_TOLERANCE) return 'text-red-500'
  return 'text-green-600 dark:text-green-400'
}

// Same ±20kcal pass/fail band as calorieRangeColor, as a bar-fill colour instead of text.
function calorieBarColor(actual, target) {
  if (!target) return 'bg-gray-300 dark:bg-gray-600'
  const diff = target - actual
  if (diff > UNDER_TARGET_TOLERANCE) return 'bg-amber-400'
  if (diff < -OVER_TARGET_TOLERANCE) return 'bg-red-400'
  return 'bg-green-500'
}

// Small horizontal bar-chart shown once per meal category (breakfast/lunch/dinner) — that
// category's own share of the tier vs Option A's vs Option B's actual calories for that specific
// meal, so a coach can see at a glance how each option compares to ITS meal's own target, not the
// day as a whole.
function MealTargetBars({ target, a, b }) {
  if (!target) return null
  const max = Math.max(target, a || 0, b || 0, 1) * 1.05
  const rows = [
    { label: 'Target', value: target, color: 'bg-gray-400 dark:bg-gray-500' },
    { label: 'A', value: a, color: calorieBarColor(a, target) },
    { label: 'B', value: b, color: calorieBarColor(b, target) },
  ]
  return (
    <div className="flex flex-col gap-1 py-2 px-3 my-1 bg-gray-50/60 dark:bg-gray-800/30 rounded-xl">
      {rows.map(r => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="w-11 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide flex-shrink-0">{r.label}</span>
          <div className="flex-1 h-2 bg-gray-200/70 dark:bg-gray-700/70 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${r.color}`} style={{ width: `${Math.min(100, ((r.value || 0) / max) * 100)}%` }} />
          </div>
          <span className="w-12 text-right text-[11px] tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0">{Math.round(r.value || 0)}</span>
        </div>
      ))}
    </div>
  )
}

// Each meal's tier version is generated to hit MACRO_SPLIT of its tier's calories (see
// tierTargetsForCategory in calorieTierScaling.js), so a day's macro "target" is just that same
// split applied to the full tier number — comparing against it tells a coach at a glance whether
// the day's actual ingredient mix landed where the generator meant it to. Colour bands (yellow
// within 10%, orange 11-20%, red beyond that) come from deviationColor, same as everywhere else
// a meal's macros are compared against a target.
function macroColour(actual, target) {
  return deviationColor(actual, target)
}

// Full breakdown shown inside an expanded day — the same "add/remove X to hit target" block used
// everywhere else a meal's macros are edited. referenceTotals (optional): Option B is measured
// against Option A's actual totals rather than the generic tier split.
function MacroMatchRow({ label, totals, tier, referenceTotals }) {
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
  const usingReference = referenceTotals?.calories > 0
  const targets = usingReference ? referenceTotals : calcStandardMacros(tier)
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-xs">
      <span className="font-semibold text-gray-500 dark:text-gray-400 w-16 pt-0.5">{label}</span>
      <MacroTargetInfo
        macros={{ cal: totals.calories, carb: totals.carbs_g, prot: totals.protein_g, fat: totals.fat_g }}
        target={{ cal: usingReference ? targets.calories : tier, carb: targets.carbs_g, prot: targets.protein_g, fat: targets.fat_g }}
      />
    </div>
  )
}

// One-tap "fit the day" suggestion — finds the single best ingredient to nudge across every meal
// in this option (not just one slot) to close the day's gap to target. This is the lever for a
// coach who only cares about the day's total landing right, not which specific meal carries it.
// target: { cal, carb, prot, fat } - carb/prot/fat optional (calorie-only still works) - passing
// all four lets the pick also help close the macro gap, not just calories (see suggestAutoFit).
function DayAutoFitSuggestion({ week, slotKeys, tier, target, mealsById, ingredientLib, slotLabels, onApply }) {
  if (!target?.cal) return null
  const combined = []
  const slotOf = {}
  for (const slotKey of slotKeys) {
    const mealId = week.slots[slotKey]
    const meal = mealId ? mealsById[mealId] : null
    if (!meal) continue
    for (const ing of getIngredients(meal, tier, week.overrides?.[slotKey])) {
      combined.push(ing)
      slotOf[ing._tempId || ing.id] = slotKey
    }
  }
  if (combined.length === 0) return null
  const actualMacros = sumIngredientMacros(combined)
  if (actualMacros.cal <= 0) return null
  const gapCal = target.cal - actualMacros.cal
  if (Math.abs(gapCal) < Math.max(15, target.cal * 0.03)) return null // already close enough - the totals above already read as "on target"

  const suggestion = suggestAutoFit(combined, { cal: actualMacros.cal, carb: actualMacros.carb, prot: actualMacros.prot, fat: actualMacros.fat }, target, ingredientLib)
  if (!suggestion) {
    // Still says something rather than showing nothing - every eligible ingredient here is either
    // too small to matter or marked Fixed, so closing this gap needs swapping a meal instead.
    return (
      <p className="text-xs text-gray-400 dark:text-gray-500 pl-[4.5rem]">
        No small ingredient change closes this gap without touching something marked Fixed — try swapping a meal instead.
      </p>
    )
  }
  const slotKey = slotOf[suggestion.id]
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs pl-[4.5rem]">
      <span className="text-brand-600 dark:text-brand-400">
        Fit the day: {suggestion.name} ({slotLabels[slotKey]}) {round1(suggestion.oldQty)}{suggestion.unit} → {round1(suggestion.newQty)}{suggestion.unit}
        {' '}({suggestion.deltaCal > 0 ? '+' : ''}{suggestion.deltaCal} kcal)
      </span>
      <button
        type="button"
        onClick={() => onApply(slotKey, suggestion.id, suggestion.newQty)}
        className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline"
      >
        Apply
      </button>
    </div>
  )
}

// Inline editor for a meal's ingredients at ONE calorie tier. Quantities are written straight into
// the meal's shared meal_tier_versions/meal_tier_ingredients rows (the same rows the Meal Library
// edits) — so every week showing this meal at this tier picks up the change immediately, rather
// than only this one week.
function SlotIngredientEditor({ meal, mealId, tier, category, coachId, mealSplit, overridesForSlot, onChangeQty, onRemove, onAdd, onSetScalingType, onClearOverride, onGenerated, overrideTarget }) {
  const [library, setLibrary] = useState([])
  const [baseIngredients, setBaseIngredients] = useState([])
  const [loadingBase, setLoadingBase] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  // Local-only draft text while typing an amount — committed (written straight into this meal's
  // shared tier default) on blur, not per keystroke, since every keystroke would otherwise fire a
  // write that instantly becomes every week's standard.
  const [drafts, setDrafts] = useState({})
  const [addSearch, setAddSearch] = useState('')

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
  // An old per-week tweak (from before edits here became the shared standard) can still have every
  // ingredient marked removed for just this one week, which would otherwise look identical to the
  // meal genuinely having no ingredients — offer to clear it so the shared default shows again.
  const emptiedByLegacyOverride = ingredients.length === 0 && hasAnyOverride(overridesForSlot) && (version.meal_tier_ingredients || []).length > 0

  return (
    <div className="space-y-1 py-2 px-2">
      {fixedWarning}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {emptiedByLegacyOverride && onClearOverride && (
        <div className="flex items-center justify-between gap-3 py-2 px-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            An old per-week tweak removed every ingredient for just this week, hiding this meal's real default.
          </p>
          <button type="button" onClick={onClearOverride} className="text-xs btn-secondary py-1 px-2.5 whitespace-nowrap flex-shrink-0">
            Restore default
          </button>
        </div>
      )}
      {ingredients.length > 0 && (
        <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium pb-1">
          <span className="w-5 flex-shrink-0" />
          <span className="flex-1">Ingredient</span>
          <span className="w-16 text-right">Amount</span>
          <span className="w-14 text-right">Kcal</span>
          <span className={`w-10 text-right ${MACRO_META.carb.text}`}>C</span>
          <span className={`w-10 text-right ${MACRO_META.prot.text}`}>P</span>
          <span className={`w-10 text-right ${MACRO_META.fat.text}`}>F</span>
        </div>
      )}
      {ingredients.map(ing => {
        const isStatic = ing.is_static
        return (
        <div key={ing.id} className="flex items-center gap-2 text-xs">
          {onRemove && !isStatic && (
            <button
              type="button"
              onClick={() => onRemove(ing.id)}
              className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors"
              title="Remove ingredient"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {onRemove && isStatic && (
            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-amber-400" title="Static ingredient — cannot be removed">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          <span className="flex-1 min-w-0 flex items-center gap-1.5">
            <span className="truncate text-gray-600 dark:text-gray-300">{ing.name}</span>
            {onSetScalingType && !isStatic && (
              <button
                type="button"
                onClick={() => onSetScalingType(ing.id, ing.scaling_type === 'flexible' ? 'optional' : ing.scaling_type === 'optional' ? 'fixed' : 'flexible')}
                title="Flex: scales with tier  ·  Optional: scales but can be fully removed  ·  Fixed: always stays the same amount"
                className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors whitespace-nowrap ${
                  ing.scaling_type === 'fixed'
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    : ing.scaling_type === 'optional'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                }`}
              >
                {ing.scaling_type === 'fixed' ? 'Fixed' : ing.scaling_type === 'optional' ? 'Optional' : 'Flex'}
              </button>
            )}
          </span>
          <span className="w-16 flex items-center justify-end gap-1">
            <input
              type="number" onFocus={e => e.target.select()}
              className="w-11 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5"
              value={drafts[ing.id] ?? ing.quantity_g}
              onChange={e => setDrafts(d => ({ ...d, [ing.id]: e.target.value }))}
              onBlur={e => {
                const val = e.target.value
                setDrafts(d => { const next = { ...d }; delete next[ing.id]; return next })
                const parsed = parseFloat(val)
                if (!isNaN(parsed) && Math.abs(parsed - (parseFloat(ing.quantity_g) || 0)) > 0.05) onChangeQty(ing.id, val)
              }}
            />
            <span className="text-gray-400 text-[10px]">{ing.unit || 'g'}</span>
          </span>
          <span className="w-14 text-right text-gray-500 dark:text-gray-400 tabular-nums">{round1(ing.calories)}</span>
          <span className={`w-10 text-right tabular-nums ${MACRO_META.carb.text}`}>{round1(ing.carbs_g)}</span>
          <span className={`w-10 text-right tabular-nums ${MACRO_META.prot.text}`}>{round1(ing.protein_g)}</span>
          <span className={`w-10 text-right tabular-nums ${MACRO_META.fat.text}`}>{round1(ing.fat_g)}</span>
        </div>
        )
      })}
      {ingredients.length > 0 && (() => {
        const macros = sumIngredientMacros(ingredients)
        // Option B's slot editor targets Option A's own sibling slot (passed down as
        // overrideTarget) rather than the generic category share, so the two stay as close as
        // possible to each other — see SIBLING_SLOT above.
        const targets = tierTargetsForCategory(tier, category, mealSplit)
        const target = overrideTarget || { cal: targets.calories, carb: targets.carbs_g, prot: targets.protein_g, fat: targets.fat_g }
        const libraryById = Object.fromEntries(library.map(l => [l.id, l]))
        return (
          <div className="pt-1">
            <MacroTargetInfo
              macros={macros}
              target={target}
              ingredients={ingredients}
              ingredientLib={libraryById}
              onAutoFit={onChangeQty}
            />
          </div>
        )
      })()}
      {onAdd && (() => {
        const searchMatches = addSearch.length >= 2
          ? library.filter(l => l.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 8)
          : []
        return (
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
                    onClick={() => { onAdd(lib); setAddSearch('') }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-brand-50 dark:hover:bg-brand-900/10 border-b border-gray-100 dark:border-gray-800 last:border-0 text-xs"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{lib.name}</span>
                    <span className="text-gray-400 dark:text-gray-500"> — {lib.serving_size || '?'}{lib.serving_unit || 'g'} · {Math.round(lib.calories_per_serving || 0)} kcal</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })()}
      <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          Editing here updates this meal's {tier} kcal default everywhere it's used — every week showing it will pick up the change.
        </span>
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
  // Currently-edited default meal for whichever scope (Standard or a specific tier) is active —
  // kept in sync with preworkoutByTier/eveningSnackByTier below whenever the tier tab changes.
  const [defaultPreworkout, setDefaultPreworkout] = useState('')
  const [defaultEveningSnack, setDefaultEveningSnack] = useState('')
  // Saved per-tier defaults: { [tier]: mealId }. The Standard scope's default lives directly on
  // plan_groups (default_preworkout_meal_id / default_evening_snack_meal_id) since it isn't tied to
  // any tier.
  const [preworkoutByTier, setPreworkoutByTier] = useState({})
  const [eveningSnackByTier, setEveningSnackByTier] = useState({})
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [savedDefaults, setSavedDefaults] = useState(false)
  // { weekIdx, slotKey } of the swap picker currently open, or null.
  const [swapPicker, setSwapPicker] = useState(null)
  // { weekIdx, status: 'working'|'done'|'empty'|'error', text } for the last "Balance day" click,
  // so the coach always sees SOME feedback even when there's genuinely nothing to change.
  const [dayBalance, setDayBalance] = useState(null)

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
            meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static, scaling_type),
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
        supabase.from('ingredients').select('id, name, serving_size, serving_unit, serving_step, min_amount, max_amount, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving').eq('coach_id', profile.id),
      ])

      if (group) {
        setPlanGroup(group)
        setDefaultPreworkout(group.default_preworkout_meal_id || '')
        setDefaultEveningSnack(group.default_evening_snack_meal_id || '')
        setPreworkoutByTier(group.default_preworkout_by_tier || {})
        setEveningSnackByTier(group.default_evening_snack_by_tier || {})
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
        meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static, scaling_type),
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
    // Default pre-workout/evening-snack are set per scope (Standard, or a specific tier) — swap
    // the editable inputs to whichever scope is now active.
    setDefaultPreworkout(tier == null ? (planGroup?.default_preworkout_meal_id || '') : (preworkoutByTier[tier] ?? ''))
    setDefaultEveningSnack(tier == null ? (planGroup?.default_evening_snack_meal_id || '') : (eveningSnackByTier[tier] ?? ''))
    setSavedDefaults(false)
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

  // Old versions of this screen stored ingredient edits as a per-week override on top of the
  // meal's shared recipe, so a tweak only ever applied to that one week (hence the "Adjusted"
  // badge and "Revert to default" button). The coach wants edits here to become the new standard
  // for that calorie tier instead, so changeIngredientOverride/removeIngredientOverride/
  // balanceWeekDay below now write straight into the meal's shared meal_tier_ingredients /
  // meal_tier_versions rows — every week showing that meal at this tier picks it up immediately.
  // If an older per-week override still exists on a slot we touch, it would otherwise keep
  // masking the freshly-written standard, so it's cleared here too.
  async function clearLegacySlotOverride(week, slotKey) {
    if (!week.overrides?.[slotKey]) return
    await supabase.from('template_meal_slots').update({ ingredient_overrides: null })
      .eq('template_id', week.templateId).eq('slot_type', slotKey)
    setTierWeeks(prev => ({
      ...prev,
      [activeTier]: (prev[activeTier] || []).map(w => {
        if (w.templateId !== week.templateId) return w
        const nextOverrides = { ...w.overrides }
        delete nextOverrides[slotKey]
        return { ...w, overrides: nextOverrides }
      }),
    }))
  }

  // Adjusts a single ingredient's quantity by writing it straight into this meal's shared tier
  // default (see the note above) rather than a one-week-only override.
  async function changeIngredientOverride(weekIdx, slotKey, ingId, newQtyStr) {
    if (activeTier == null) return
    const newQty = parseFloat(newQtyStr)
    if (isNaN(newQty) || newQty < 0) return
    const week = currentWeeks[weekIdx]
    const mealId = week.slots[slotKey]
    const meal = mealId ? mealsById[mealId] : null
    const version = meal?.meal_tier_versions?.find(v => v.calorie_tier === activeTier)
    if (!version) return
    const rows = version.meal_tier_ingredients || []
    const row = rows.find(r => r.id === ingId)
    if (!row || row.is_static) return

    const origQty = parseFloat(row.quantity_g) || 0
    const ratio = origQty > 0 ? newQty / origQty : 1
    const updated = {
      quantity_g: newQty,
      calories:  round1((parseFloat(row.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(row.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(row.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(row.fat_g)     || 0) * ratio),
    }
    await supabase.from('meal_tier_ingredients').update(updated).eq('id', ingId)
    const totals = calcTotals(rows.map(r => r.id === ingId ? { ...r, ...updated } : r))
    await supabase.from('meal_tier_versions').update(totals).eq('id', version.id)
    await clearLegacySlotOverride(week, slotKey)
    await refreshMeal(mealId)
  }

  // Removes an ingredient by deleting it straight out of this meal's shared tier default — same
  // "becomes the standard" behaviour as changeIngredientOverride above.
  async function removeIngredientOverride(weekIdx, slotKey, ingId) {
    if (activeTier == null) return
    const week = currentWeeks[weekIdx]
    const mealId = week.slots[slotKey]
    const meal = mealId ? mealsById[mealId] : null
    const version = meal?.meal_tier_versions?.find(v => v.calorie_tier === activeTier)
    if (!version) return
    const rows = version.meal_tier_ingredients || []
    const row = rows.find(r => r.id === ingId)
    if (!row || row.is_static) return

    await supabase.from('meal_tier_ingredients').delete().eq('id', ingId)
    const totals = calcTotals(rows.filter(r => r.id !== ingId))
    await supabase.from('meal_tier_versions').update(totals).eq('id', version.id)
    await clearLegacySlotOverride(week, slotKey)
    await refreshMeal(mealId)
  }

  // Adds a brand-new ingredient straight into this meal's shared tier default — same
  // "becomes the standard" behaviour as changeIngredientOverride/removeIngredientOverride above.
  async function addTierIngredient(weekIdx, slotKey, libIng) {
    if (activeTier == null) return
    const week = currentWeeks[weekIdx]
    const mealId = week.slots[slotKey]
    const meal = mealId ? mealsById[mealId] : null
    const version = meal?.meal_tier_versions?.find(v => v.calorie_tier === activeTier)
    if (!version) return

    const qty = libIng.serving_size || 100
    const f = libIng.serving_size > 0 ? qty / libIng.serving_size : 0
    const newRow = {
      tier_version_id: version.id,
      name: libIng.name,
      quantity_g: qty,
      unit: libIng.serving_unit || 'g',
      calories:  round1(f * libIng.calories_per_serving),
      protein_g: round1(f * libIng.protein_per_serving),
      carbs_g:   round1(f * libIng.carbs_per_serving),
      fat_g:     round1(f * libIng.fat_per_serving),
      ingredient_id: libIng.id,
      scaling_type: 'flexible',
      is_static: false,
    }
    const { data: inserted, error } = await supabase.from('meal_tier_ingredients').insert(newRow).select().single()
    if (error || !inserted) return

    const totals = calcTotals([...(version.meal_tier_ingredients || []), inserted])
    await supabase.from('meal_tier_versions').update(totals).eq('id', version.id)
    await clearLegacySlotOverride(week, slotKey)
    await refreshMeal(mealId)
  }

  // scaling_type ('flexible' | 'optional' | 'fixed') is a property of the RECIPE, not any one
  // calorie tier — "200g Greek yogurt, fixed" should mean fixed at every tier, not just the one
  // currently open. So this writes the setting onto the meal's base meal_ingredients row (the
  // durable source every future tier generation reads from) and mirrors it onto every already-
  // generated tier version's matching ingredient, keyed by ingredient_id (or name, for a
  // free-typed ingredient with no library link) — quantities are untouched everywhere, only the
  // scaling behaviour changes. Lets a coach set this here, on the screen they actually live in,
  // instead of having to go back to the Meal Library.
  async function setIngredientScalingType(weekIdx, slotKey, ingId, newType) {
    if (activeTier == null) return
    const week = currentWeeks[weekIdx]
    const mealId = week.slots[slotKey]
    const meal = mealId ? mealsById[mealId] : null
    const version = meal?.meal_tier_versions?.find(v => v.calorie_tier === activeTier)
    if (!version) return
    const row = (version.meal_tier_ingredients || []).find(r => r.id === ingId)
    if (!row || row.is_static) return

    const matches = r => row.ingredient_id ? r.ingredient_id === row.ingredient_id : r.name === row.name
    const writes = [supabase.from('meal_tier_ingredients').update({ scaling_type: newType }).eq('id', ingId)]

    const baseMatch = (meal.meal_ingredients || []).find(matches)
    if (baseMatch) writes.push(supabase.from('meal_ingredients').update({ scaling_type: newType }).eq('id', baseMatch.id))

    for (const v of meal.meal_tier_versions || []) {
      if (v.id === version.id) continue
      const otherMatch = (v.meal_tier_ingredients || []).find(matches)
      if (otherMatch) writes.push(supabase.from('meal_tier_ingredients').update({ scaling_type: newType }).eq('id', otherMatch.id))
    }

    await Promise.all(writes)
    await refreshMeal(mealId)
  }

  // Balances every Option A meal in this week's day against the day's real macro target in one
  // shot — each meal's CALORIE share stays exactly at its assigned category %, only the
  // protein/carb/fat mix within that calorie envelope shifts (weighted by how much
  // flexible-ingredient room each meal has) — and writes the result straight into each meal's
  // shared tier default, same as the single-ingredient edits above, so it becomes every week's
  // standard rather than just this one week's.
  async function balanceWeekDay(weekIdx) {
    if (activeTier == null) return
    setDayBalance({ weekIdx, status: 'working', text: 'Balancing…' })
    try {
      const week = currentWeeks[weekIdx]
      const mealsInDay = []
      const skipped = []
      for (const key of OPTION_A_KEYS) {
        const mealId = week.slots[key]
        if (!mealId) continue
        const meal = mealsById[mealId]
        const version = meal?.meal_tier_versions?.find(v => v.calorie_tier === activeTier)
        const rows = version?.meal_tier_ingredients || []
        if (!version || rows.length === 0) { skipped.push(SLOT_LABELS[key] || key); continue }
        const slotDef = SLOTS.find(s => s.key === key)
        mealsInDay.push({ key, mealId, versionId: version.id, category: slotDef.cat, baseIngredients: rows })
      }
      if (mealsInDay.length === 0) {
        setDayBalance({ weekIdx, status: 'empty', text: `No Option A meal here has a generated ${activeTier} kcal version yet — use "Generate now" in each meal's ingredient editor first.` })
        return
      }

      const dayTarget = { calories: activeTier, ...calcStandardMacros(activeTier) }
      const library = Object.values(ingredientLib)
      const results = balanceDayIngredients(mealsInDay, library, dayTarget, mealSplit)

      let changedMeals = 0
      await Promise.all(results.map(async r => {
        const input = mealsInDay.find(m => m.key === r.key)
        const nextRows = input.baseIngredients.map((row, idx) => {
          const changed = r.ingredients[idx]
          return changed ? { ...row, ...changed } : row
        })
        const toUpdate = nextRows.filter((row, idx) =>
          Math.abs((parseFloat(row.quantity_g) || 0) - (parseFloat(input.baseIngredients[idx].quantity_g) || 0)) > 0.05
        )
        if (toUpdate.length === 0) return
        changedMeals++
        await Promise.all(toUpdate.map(row =>
          supabase.from('meal_tier_ingredients').update({
            quantity_g: row.quantity_g, calories: row.calories, protein_g: row.protein_g, carbs_g: row.carbs_g, fat_g: row.fat_g,
          }).eq('id', row.id)
        ))
        const totals = calcTotals(nextRows)
        await supabase.from('meal_tier_versions').update(totals).eq('id', input.versionId)
        await clearLegacySlotOverride(week, input.key)
      }))
      await Promise.all(mealsInDay.map(m => refreshMeal(m.mealId)))

      if (changedMeals === 0) {
        setDayBalance({ weekIdx, status: 'empty', text: `Already close to target — no changes needed${skipped.length ? ` (skipped: ${skipped.join(', ')}, no tier version yet)` : ''}.` })
      } else {
        setDayBalance({ weekIdx, status: 'done', text: `Updated ${changedMeals} meal${changedMeals === 1 ? '' : 's'}.` })
      }
    } catch (err) {
      setDayBalance({ weekIdx, status: 'error', text: `Couldn't balance this day: ${err.message || err}` })
    }
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

  // Default pre-workout/evening-snack meals are set per scope: the Standard template has its own
  // default (plan_groups.default_preworkout_meal_id / default_evening_snack_meal_id), and each
  // calorie tier can set a different one (plan_groups.default_preworkout_by_tier /
  // default_evening_snack_by_tier, keyed by tier) — a 1200 kcal client's evening snack doesn't have
  // to be the same as a 3000 kcal client's. Only the currently active scope is written here.
  async function handleSaveDefaults() {
    setSavingDefaults(true)
    setSavedDefaults(false)

    if (activeTier == null) {
      await supabase.from('plan_groups').update({
        default_preworkout_meal_id:    defaultPreworkout    || null,
        default_evening_snack_meal_id: defaultEveningSnack || null,
      }).eq('id', groupId)
      setPlanGroup(prev => ({ ...prev, default_preworkout_meal_id: defaultPreworkout || null, default_evening_snack_meal_id: defaultEveningSnack || null }))
    } else {
      const nextPreworkoutByTier = { ...preworkoutByTier, [activeTier]: defaultPreworkout || null }
      const nextEveningSnackByTier = { ...eveningSnackByTier, [activeTier]: defaultEveningSnack || null }
      await supabase.from('plan_groups').update({
        default_preworkout_by_tier: nextPreworkoutByTier,
        default_evening_snack_by_tier: nextEveningSnackByTier,
      }).eq('id', groupId)
      setPreworkoutByTier(nextPreworkoutByTier)
      setEveningSnackByTier(nextEveningSnackByTier)
    }

    // Write into every template for the active scope only (Standard = master weeks, a tier =
    // just that tier's forked weeks) — every OTHER tier keeps whatever its own default is.
    const scopedWeeks = activeTier == null ? weeks : (tierWeeks[activeTier] || [])
    const templateIds = scopedWeeks.map(w => w.templateId)

    if (templateIds.length) {
      const slotsToReplace = [
        ...(defaultPreworkout    ? ['preworkout']    : []),
        ...(defaultEveningSnack  ? ['evening_snack'] : []),
      ]

      // Remove old static slots then re-insert so the meal is always current
      if (slotsToReplace.length) {
        await supabase.from('template_meal_slots')
          .delete()
          .in('template_id', templateIds)
          .in('slot_type', slotsToReplace)

        const rows = []
        for (const templateId of templateIds) {
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
      if (activeTier == null) {
        setWeeks(applyDefaults)
      } else {
        setTierWeeks(prev => ({ ...prev, [activeTier]: applyDefaults(prev[activeTier] || []) }))
      }
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
  // that gets each day as close as possible to the calorie and macro targets of EVERY calorie
  // tier with an active client — not just the tier being viewed — then applies that same
  // meal-per-week choice to the Standard template and every tier. Every client eats the same meal
  // each week regardless of their tier, just at their own portion size, and the arrangement is
  // chosen to actually suit every tier reasonably well rather than being tuned for just one and
  // applied to the rest. The pool for each slot is every meal in that category with a tier
  // version for at least one considered tier — including any meal added to the library since the
  // rotation was last built — so a brand-new meal gets woven into the schedule the next time this
  // runs, without needing to be placed by hand first. Only WHICH WEEK each meal lands on changes;
  // nothing about the meal itself (its ingredients, tier versions, or any manual quantity
  // corrections) is touched.
  //
  // Algorithm:
  //   1. Collect every meal in the slot's category that has a tier version for at least one
  //      considered tier — that's the pool, whether or not it's already in the rotation.
  //   2. Build a round-robin schedule for each slot by cycling through its pool so every meal
  //      gets equal airtime and no meal repeats until all others have appeared.
  //   3. Run pairwise swap-improvement for each slot independently (holding the other 5 fixed):
  //      swap week i's meal with week j's in this slot if it lowers the sum of those two weeks'
  //      day-total scores, averaged across every considered tier. This converges in a few passes
  //      and runs entirely in-memory.
  function handleOptimize() {
    if (activeTier == null) return
    setOptimizing(true)

    // Score against every calorie tier with an active client, not just the tier being viewed —
    // the result gets applied to all of them, so it needs to actually fit each one's targets
    // rather than being tuned for whichever tier happened to be open. Falls back to just the
    // active tier if somehow none are marked available yet.
    const tiers = availableTiers.length > 0 ? availableTiers : [activeTier]
    const tgtMacrosByTier = new Map(tiers.map(t => [t, calcStandardMacros(t)]))
    const N = currentWeeks.length

    // Every meal in this slot's category with a tier version for at least one tier being
    // considered — meals currently placed in the rotation first (in first-seen week order), then
    // any other library meal for the category not yet in the rotation (including newly added
    // ones). Meals with no tier version for any considered tier are excluded — they'd contribute
    // 0 kcal to the day total and make every week they land in look 100-200 kcal under.
    function buildPool(slotKey) {
      const seen = new Set()
      const order = []
      for (const w of currentWeeks) {
        const id = w.slots[slotKey]
        if (id && !seen.has(id) && tiers.some(t => mealMacros(id, t) != null)) { seen.add(id); order.push(id) }
      }
      const cat = MAIN_SLOTS.find(s => s.key === slotKey)?.cat
      ;(mealsByCategory[cat] || [])
        .filter(m => tiers.some(t => (m.meal_tier_versions || []).some(v => v.calorie_tier === t)))
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

    // How far a full day total deviates from the target — same 4:1:1:1 weighting as the tier
    // solver so the same quality bar applies here — averaged across every tier being considered,
    // so an arrangement that fits one tier well but another badly doesn't look artificially good.
    // Also penalises: same meal in A and B of the same category (very heavy), and any meal
    // re-used within MIN_GAP weeks in the same slot (moderate penalty).
    const MIN_GAP = 6
    function dayScore(weekIdx) {
      const staticIds = [
        currentWeeks[weekIdx].slots['preworkout']    || defaultPreworkout    || null,
        currentWeeks[weekIdx].slots['evening_snack'] || defaultEveningSnack  || null,
      ].filter(Boolean)
      let fitTotal = 0
      for (const tier of tiers) {
        const tgtMacros = tgtMacrosByTier.get(tier)
        for (const opt of [['breakfast1','lunch1','dinner1'], ['breakfast2','lunch2','dinner2']]) {
          let cal = 0, prot = 0, carbs = 0, fat = 0
          for (const id of [...opt.map(k => scheds[k][weekIdx]), ...staticIds]) {
            const m = id ? mealMacros(id, tier) : null
            if (!m) continue
            cal += m.calories; prot += m.protein_g; carbs += m.carbs_g; fat += m.fat_g
          }
          fitTotal += 4*Math.abs(cal-tier) + Math.abs(prot-tgtMacros.protein_g) + Math.abs(carbs-tgtMacros.carbs_g) + Math.abs(fat-tgtMacros.fat_g)
        }
      }
      const fitScore = fitTotal / tiers.length
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
      return fitScore + penalty
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
              title="Re-spreads every breakfast, lunch, and dinner meal (including any you've added since this was last run) across the weeks to get each day as close as possible to the calorie and macro targets of every calorie tier with an active client — then applies the same meal choice to the Standard template and every tier, so every client eats the same meal each week at their own portion size."
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
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Default static meals <span className="font-normal text-gray-400 dark:text-gray-500">— {activeTier == null ? 'Standard' : `${activeTier} kcal`}</span>
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Pinned automatically for every week in {activeTier == null ? 'the Standard template' : `the ${activeTier} kcal tier`} — each tier can set its own.
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
        {CALORIE_TIERS.map(tier => (
          <button
            key={tier}
            onClick={() => selectTier(tier)}
            disabled={forking}
            title={availableTiers.includes(tier) ? '' : 'No client is currently assigned this calorie target on this plan yet'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTier === tier
                ? 'bg-brand-500 text-white'
                : availableTiers.includes(tier)
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tier} kcal{!tierWeeks[tier] ? ' (not set up yet)' : ''}
          </button>
        ))}
      </div>

      {activeTier != null ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Editing the {activeTier} kcal version of this plan. Which meal appears each week is shared across every calorie tier and the Standard template — changing a meal here, swapping it, or optimising also updates every other tier, so every client eats the same meal at their own portion size. Only ingredient quantities (and per-week corrections) are specific to this tier. Expand a week to see how closely each day's macros match the target.
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Editing the standard version of this plan. Changing which meal appears each week here also updates every calorie tier, so every client eats the same meal at their own portion size. Select a calorie tier above to see how closely each day matches that tier's calorie and macro targets, or to adjust that tier's ingredient quantities — every tier is available here whether or not a client is assigned to it yet.
        </p>
      )}

      {forking ? (
        <LoadingSpinner size="md" className="py-10" />
      ) : currentWeeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const isCurrent = planGroup && week.weekNum === planGroup.current_week
        const isDirty = dirty.has(week.templateId)
        const opt1Totals = sumSlotMacros(week, OPTION_A_KEYS, activeTier)
        const opt2Totals = sumSlotMacros(week, OPTION_B_KEYS, activeTier)

        return (
          <div key={week.templateId} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
              onClick={() => toggleExpand(week.weekNum)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Week {week.weekNum}</span>
                {activeTier != null && (opt1Totals.calories > 0 || opt2Totals.calories > 0) && (
                  <span className="hidden sm:flex items-center gap-2 text-sm tabular-nums">
                    {opt1Totals.calories > 0 && (
                      <span className={calorieRangeColor(opt1Totals.calories, activeTier)}>A: {opt1Totals.calories} kcal</span>
                    )}
                    {opt2Totals.calories > 0 && (
                      <span className={calorieRangeColor(opt2Totals.calories, opt1Totals.calories > 0 ? opt1Totals.calories : activeTier)}>B: {opt2Totals.calories} kcal</span>
                    )}
                  </span>
                )}
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
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="p-3 space-y-3">
                {activeTier != null && (opt1Totals.calories > 0 || opt2Totals.calories > 0) && (
                  <div className="px-1 pb-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <MacroMatchRow label="A" totals={opt1Totals} tier={activeTier} />
                      <button
                        type="button"
                        onClick={() => balanceWeekDay(weekIdx)}
                        disabled={dayBalance?.weekIdx === weekIdx && dayBalance.status === 'working'}
                        className="flex-shrink-0 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline whitespace-nowrap disabled:opacity-50 disabled:no-underline"
                        title="Rebalance every Option A meal's protein/carb/fat mix to close the day's macro gap, without moving any meal off its calorie %"
                      >
                        {dayBalance?.weekIdx === weekIdx && dayBalance.status === 'working' ? 'Balancing…' : 'Balance day'}
                      </button>
                    </div>
                    {dayBalance?.weekIdx === weekIdx && dayBalance.status !== 'working' && (
                      <p className={`text-xs pl-16 ${dayBalance.status === 'error' ? 'text-red-500' : dayBalance.status === 'done' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {dayBalance.text}
                      </p>
                    )}
                    <DayAutoFitSuggestion
                      week={week} slotKeys={OPTION_A_KEYS} tier={activeTier}
                      target={activeTier != null ? (() => { const t = calcStandardMacros(activeTier); return { cal: activeTier, carb: t.carbs_g, prot: t.protein_g, fat: t.fat_g } })() : null}
                      mealsById={mealsById} ingredientLib={ingredientLib} slotLabels={SLOT_LABELS}
                      onApply={(slotKey, ingId, qty) => changeIngredientOverride(weekIdx, slotKey, ingId, qty)}
                    />
                    <MacroMatchRow label="B" totals={opt2Totals} tier={activeTier} referenceTotals={opt1Totals} />
                    <p className="text-xs text-gray-400 dark:text-gray-500 pl-16">
                      Option B is matched meal-by-meal against its Option A sibling below, not as a single day-total fix — see each meal's own "vs A" line.
                    </p>
                  </div>
                )}
                {SLOTS.map(slot => {
                  const mealId = week.slots[slot.key] || ''
                  // A client eats every one of this day's slots, so the same meal can never sit in
                  // two of them at once — exclude anything already used elsewhere in this week from
                  // the picker, but keep this slot's OWN current meal selectable even if it happens
                  // to be a pre-existing duplicate (fixed by picking something else below).
                  const usedElsewhereThisWeek = new Set(
                    SLOTS.map(s => s.key).filter(k => k !== slot.key).map(k => week.slots[k]).filter(Boolean)
                  )
                  const isDuplicateMeal = mealId && usedElsewhereThisWeek.has(mealId)
                  const options = (mealsByCategory[slot.cat] || []).filter(m => m.id === mealId || !usedElsewhereThisWeek.has(m.id))
                  const meal = mealId ? mealsById[mealId] : null
                  const overridesForSlot = week.overrides?.[slot.key]
                  const macros = mealMacros(mealId, activeTier, overridesForSlot)
                  // Option B targets Option A's own sibling slot (not the generic category share)
                  // so the two stay as close as possible — a client eats whichever one on the day.
                  const siblingKey = SIBLING_SLOT[slot.key]
                  const siblingMacros = siblingKey ? mealMacros(week.slots[siblingKey] || '', activeTier, week.overrides?.[siblingKey]) : null
                  // Option A (and the static pre-workout/evening-snack slots) target what this
                  // meal would need to be if it alone closed the DAY's current gap to its real
                  // target — not this meal's own isolated % share of the tier — so the "+/- to hit
                  // target" line and auto-fit suggestion in Edit ingredients reflect the day total,
                  // matching "Balance day"/"Fit the day" above rather than a per-meal quota.
                  const dayTarget = activeTier != null ? { calories: activeTier, ...calcStandardMacros(activeTier) } : null
                  const slotTarget = siblingMacros
                    ? { cal: siblingMacros.calories, carb: siblingMacros.carbs_g, prot: siblingMacros.protein_g, fat: siblingMacros.fat_g }
                    : (macros && dayTarget && opt1Totals?.calories > 0)
                    ? {
                        cal:  macros.calories  + (dayTarget.calories  - opt1Totals.calories),
                        carb: macros.carbs_g   + (dayTarget.carbs_g   - opt1Totals.carbs_g),
                        prot: macros.protein_g + (dayTarget.protein_g - opt1Totals.protein_g),
                        fat:  macros.fat_g     + (dayTarget.fat_g     - opt1Totals.fat_g),
                      }
                    : null
                  const isStatic = STATIC_SLOT_KEYS.has(slot.key)
                  const editKey = mealId && activeTier != null ? `${weekIdx}:${slot.key}` : null
                  const isEditingIngredients = editKey != null && editingIngredients === editKey
                  const previewIngredients = meal ? getIngredients(meal, activeTier, overridesForSlot) : []
                  const isSwapOpen = swapPicker?.weekIdx === weekIdx && swapPicker?.slotKey === slot.key
                  // One checkpoint per meal category (after its Option B card) comparing that
                  // category's own tier share against Option A's and Option B's actual calories
                  // for that specific meal — not the day as a whole.
                  const showMealBarsAfter = slot.key === 'breakfast2' || slot.key === 'lunch2' || slot.key === 'dinner2'
                  const mealCategoryTarget = showMealBarsAfter && activeTier != null ? tierTargetsForCategory(activeTier, slot.cat, mealSplit).calories : null
                  return (
                    <Fragment key={slot.key}>
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
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
                          {isStatic && (
                            <span className="absolute bottom-2 left-2 text-[10px] font-medium bg-white/90 dark:bg-gray-900/90 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                              Same every week
                            </span>
                          )}
                          {isDuplicateMeal && (
                            <span className="absolute top-2 right-2 text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm" title="This meal is also used elsewhere in this same day — pick a different meal for one of them">
                              Duplicate
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
                            <div className="text-xs space-y-1">
                              {macros ? (
                                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{macros.calories} kcal</span>
                                  <span className={`flex items-center gap-0.5 ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{macros.carbs_g}g</span>
                                  <span className={`flex items-center gap-0.5 ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{macros.protein_g}g</span>
                                  <span className={`flex items-center gap-0.5 ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{macros.fat_g}g</span>
                                </span>
                              ) : (
                                <span className="text-amber-500" title="Generate this meal's calorie tiers in the Meal Library">
                                  No {activeTier} kcal version
                                </span>
                              )}
                              {/* One-tap fix for THIS meal specifically, using only its own
                                  ingredients - matches this meal to its sibling, not the day total. */}
                              {macros && slot.key.endsWith('2') && siblingMacros?.calories > 0 && (() => {
                                const suggestion = suggestAutoFit(
                                  previewIngredients,
                                  { cal: macros.calories, carb: macros.carbs_g, prot: macros.protein_g, fat: macros.fat_g },
                                  slotTarget,
                                  ingredientLib
                                )
                                if (!suggestion) return null
                                return (
                                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span className="text-brand-600 dark:text-brand-400">
                                      Try {suggestion.name}: {round1(suggestion.oldQty)}{suggestion.unit} → {round1(suggestion.newQty)}{suggestion.unit}
                                      {' '}({suggestion.deltaCal > 0 ? '+' : ''}{suggestion.deltaCal} kcal)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => changeIngredientOverride(weekIdx, slot.key, suggestion.id, suggestion.newQty)}
                                      className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 underline"
                                    >
                                      Apply
                                    </button>
                                  </span>
                                )
                              })()}
                            </div>
                          )}


                          <div className="flex items-center gap-3 pt-0.5">
                            {editKey != null && (
                              <button
                                onClick={() => setEditingIngredients(prev => prev === editKey ? null : editKey)}
                                className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex-shrink-0 whitespace-nowrap"
                              >
                                <svg className={`w-3 h-3 transition-transform ${isEditingIngredients ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {isEditingIngredients ? 'Hide ingredients' : 'Edit ingredients'}
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

                        {/* Day total, pinned to the right of every card so it's always visible while
                            scanning down the day, without scrolling back to the top or expanding
                            anything. Option A's reference is the tier target; Option B's is Option
                            A's own actual day total, since B needs to match A, not the tier split. */}
                        {activeTier != null && (() => {
                          const isB = slot.key.endsWith('2')
                          const dayTotals = isB ? opt2Totals : opt1Totals
                          if (!dayTotals || dayTotals.calories <= 0) return null
                          // Option B's match to Option A is judged meal-by-meal (see each meal's own
                          // "vs A" line above), not by day total, so this column shows B's day total
                          // for reference only - no target/delta against it.
                          const ref = isB ? null : { calories: activeTier, ...calcStandardMacros(activeTier) }
                          return (
                            <div className="flex flex-col items-center sm:items-end justify-center gap-1 px-3 py-2 sm:w-28 flex-shrink-0 sm:border-l border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                              <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">Day total</span>
                              <span className={`text-base font-semibold whitespace-nowrap ${ref ? deviationColor(dayTotals.calories, ref.calories) : 'text-gray-700 dark:text-gray-300'}`}>{dayTotals.calories} kcal</span>
                              <span className={`flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${MACRO_META.carb.text}`}><MacroBadge type="carb" />{dayTotals.carbs_g}g</span>
                              <span className={`flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${MACRO_META.prot.text}`}><MacroBadge type="prot" />{dayTotals.protein_g}g</span>
                              <span className={`flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${MACRO_META.fat.text}`}><MacroBadge type="fat" />{dayTotals.fat_g}g</span>
                              {ref && (
                                <div className="flex flex-col items-center sm:items-end gap-1 mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                                  <span className={`text-xs font-semibold whitespace-nowrap ${deviationColor(dayTotals.calories, ref.calories)}`}>
                                    {(() => {
                                      const d = Math.round(ref.calories - dayTotals.calories)
                                      return d === 0 ? '±0 kcal' : `${d > 0 ? '+' : ''}${d} kcal`
                                    })()}
                                  </span>
                                  {[
                                    { type: 'carb', a: dayTotals.carbs_g, r: ref.carbs_g },
                                    { type: 'prot', a: dayTotals.protein_g, r: ref.protein_g },
                                    { type: 'fat', a: dayTotals.fat_g, r: ref.fat_g },
                                  ].map(({ type, a, r }) => {
                                    const d = Math.round(r - a)
                                    return (
                                      <span key={type} className={`flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${macroColour(a, r)}`}>
                                        <MacroBadge type={type} />{d === 0 ? '±0' : d > 0 ? `+${d}` : d}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                              {/* Option B only - this meal's own match to its Option A sibling, in the
                                  same right-hand spot the day-level delta used to sit - matching is
                                  judged per meal now, not by day total (see the "fit the day" removal
                                  above), so this is the actual target row for B. */}
                              {isB && macros && siblingMacros?.calories > 0 && (
                                <div className="flex flex-col items-center sm:items-end gap-1 mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                                  <span className={`text-xs font-semibold whitespace-nowrap ${macroColour(macros.calories, siblingMacros.calories)}`}>
                                    {(() => {
                                      const d = Math.round(siblingMacros.calories - macros.calories)
                                      return d === 0 ? '±0 kcal' : `${d > 0 ? '+' : ''}${d} kcal`
                                    })()}
                                  </span>
                                  {[
                                    { type: 'carb', a: macros.carbs_g, r: siblingMacros.carbs_g },
                                    { type: 'prot', a: macros.protein_g, r: siblingMacros.protein_g },
                                    { type: 'fat', a: macros.fat_g, r: siblingMacros.fat_g },
                                  ].map(({ type, a, r }) => {
                                    const d = Math.round(r - a)
                                    return (
                                      <span key={type} className={`flex items-center gap-1 text-xs tabular-nums whitespace-nowrap ${macroColour(a, r)}`}>
                                        <MacroBadge type={type} />{d === 0 ? '±0' : d > 0 ? `+${d}` : d}
                                      </span>
                                    )
                                  })}
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">vs A</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}
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
                            onRemove={ingId => removeIngredientOverride(weekIdx, slot.key, ingId)}
                            onAdd={libIng => addTierIngredient(weekIdx, slot.key, libIng)}
                            onSetScalingType={(ingId, newType) => setIngredientScalingType(weekIdx, slot.key, ingId, newType)}
                            onClearOverride={() => clearLegacySlotOverride(week, slot.key)}
                            onGenerated={() => refreshMeal(mealId)}
                            overrideTarget={slotTarget}
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
                              .filter(m => m.id !== mealId && !usedElsewhereThisWeek.has(m.id))
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
                    {showMealBarsAfter && <MealTargetBars target={mealCategoryTarget} a={siblingMacros?.calories} b={macros?.calories} />}
                    </Fragment>
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
