import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { normalizeMealSplit } from '../../lib/calorieSplit'
import { calcStandardMacros } from '../../lib/macros'
import {
  generateTierIngredients, insertTierVersion, tierTargetsForCategory, calcTotals, snapToConstraints, allIngredientsFixed,
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

function sumMacros(ingredients) {
  const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  for (const i of (ingredients || [])) {
    t.calories += parseFloat(i.calories) || 0
    t.protein_g += parseFloat(i.protein_g) || 0
    t.carbs_g += parseFloat(i.carbs_g) || 0
    t.fat_g += parseFloat(i.fat_g) || 0
  }
  return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g) }
}

function OptionTotal({ label, totals, target }) {
  if (!totals || totals.calories <= 0) return null
  let diffText = null
  let colour = 'text-gray-500 dark:text-gray-400'
  if (target != null && totals.complete) {
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
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <span className="font-semibold w-16">{label}</span>
        <span>Missing a calorie-tier version for one or more meals — can't compute a macro match yet.</span>
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

// Inline editor for a meal's calorie-tier ingredient set — the same shared meal_tier_versions /
// meal_tier_ingredients rows the Meal Library edits, just reachable without leaving the template.
function TierIngredientEditor({ mealId, tier, category, coachId, mealSplit }) {
  const [loading, setLoading] = useState(true)
  const [library, setLibrary] = useState([])
  const [baseIngredients, setBaseIngredients] = useState([])
  const [version, setVersion] = useState(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: lib }, { data: baseIng }, { data: tierVer }] = await Promise.all([
      supabase.from('ingredients').select('*').eq('coach_id', coachId),
      supabase.from('meal_ingredients').select('*').eq('meal_id', mealId).order('id'),
      supabase.from('meal_tier_versions').select('id, meal_tier_ingredients(*)').eq('meal_id', mealId).eq('calorie_tier', tier).maybeSingle(),
    ])
    setLibrary(lib || [])
    setBaseIngredients(baseIng || [])
    if (tierVer) {
      setVersion({
        id: tierVer.id,
        ingredients: (tierVer.meal_tier_ingredients || []).sort((a, b) => a.id > b.id ? 1 : -1).map(ing => {
          const libIng = ing.ingredient_id ? (lib || []).find(l => l.id === ing.ingredient_id) || null : null
          return {
            ...ing,
            _library: libIng,
            _calPerG:  ing.quantity_g > 0 ? ing.calories  / ing.quantity_g : 0,
            _proPerG:  ing.quantity_g > 0 ? ing.protein_g / ing.quantity_g : 0,
            _carbPerG: ing.quantity_g > 0 ? ing.carbs_g   / ing.quantity_g : 0,
            _fatPerG:  ing.quantity_g > 0 ? ing.fat_g     / ing.quantity_g : 0,
          }
        }),
      })
    } else {
      setVersion(null)
    }
    setDirty(false)
    setLoading(false)
  }

  useEffect(() => { load() }, [mealId, tier])

  function updateQty(idx, newQty) {
    const qty = parseFloat(newQty) || 0
    setVersion(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i !== idx ? ing : {
        ...ing,
        quantity_g: newQty,
        calories:  round1(qty * (ing._calPerG  || 0)),
        protein_g: round1(qty * (ing._proPerG  || 0)),
        carbs_g:   round1(qty * (ing._carbPerG || 0)),
        fat_g:     round1(qty * (ing._fatPerG  || 0)),
      }),
    }))
    setDirty(true)
  }

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
    load()
  }

  async function handleSave() {
    if (!version) return
    setSaving(true)
    const totals = calcTotals(version.ingredients)
    await supabase.from('meal_tier_versions').update(totals).eq('id', version.id)
    for (const ing of version.ingredients) {
      const rawQty = parseFloat(ing.quantity_g) || 0
      const snapped = ing._library ? (snapToConstraints(rawQty, ing._library) ?? rawQty) : rawQty
      await supabase.from('meal_tier_ingredients').update({
        quantity_g: snapped,
        calories:  round1(snapped * (ing._calPerG  || 0)),
        protein_g: round1(snapped * (ing._proPerG  || 0)),
        carbs_g:   round1(snapped * (ing._carbPerG || 0)),
        fat_g:     round1(snapped * (ing._fatPerG  || 0)),
      }).eq('id', ing.id)
    }
    setSaving(false)
    load()
  }

  if (loading) return <p className="text-xs text-gray-400 py-2 px-2">Loading ingredients…</p>

  const fixedWarning = allIngredientsFixed(baseIngredients) && (
    <p className="text-xs text-amber-500 px-2 pt-2">
      Every ingredient in this meal is marked Fixed, so it can't be scaled to this tier's target — mark at least one ingredient Flexible in the Meal Library to fix this.
    </p>
  )

  if (!version) {
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

  const totals = calcTotals(version.ingredients)
  const target = tierTargetsForCategory(tier, category, mealSplit)
  const diff = target.calories - totals.calories

  return (
    <div className="space-y-1.5 py-2 px-2">
      {fixedWarning}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {version.ingredients.map((ing, idx) => (
        <div key={ing.id} className="flex items-center gap-2 text-xs">
          <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">{ing.name}</span>
          <input
            type="number"
            className="w-20 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5"
            value={ing.quantity_g}
            onChange={e => updateQty(idx, e.target.value)}
          />
          <span className="w-6 text-gray-400">{ing.unit || 'g'}</span>
          <span className="w-16 text-right text-gray-400 tabular-nums">{ing.calories} kcal</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{totals.calories} kcal</span>
          {' '}(target {target.calories}, {diff >= 0 ? `${Math.round(diff)} under` : `${Math.round(-diff)} over`})
        </span>
        <div className="flex items-center gap-3">
          <button onClick={handleGenerate} disabled={generating} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {generating ? 'Regenerating…' : 'Regenerate'}
          </button>
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="text-xs btn-primary py-1 px-2.5">{saving ? 'Saving…' : 'Save'}</button>
          )}
        </div>
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
  const [expanded, setExpanded] = useState(new Set())
  const [dirty, setDirty] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [forking, setForking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  // `${mealId}:${tier}` of the ingredient editor currently open, or null.
  const [editingIngredients, setEditingIngredients] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: group }, { data: templates }, { data: meals }, { data: assignments }] = await Promise.all([
        supabase.from('plan_groups').select('*').eq('id', groupId).single(),
        supabase
          .from('weekly_templates')
          .select('id, week_number, calorie_tier, template_meal_slots(slot_type, meal_id)')
          .eq('plan_group_id', groupId)
          .order('week_number'),
        supabase
          .from('meals')
          .select('id, name, category, meal_ingredients(calories, protein_g, carbs_g, fat_g), meal_tier_versions(calorie_tier, calories, protein_g, carbs_g, fat_g)')
          .eq('coach_id', profile.id)
          .order('name'),
        supabase
          .from('client_plan_assignments')
          .select('calorie_target')
          .eq('plan_group_id', groupId)
          .eq('active', true),
      ])

      if (group) setPlanGroup(group)

      const byCategory = {}
      const byId = {}
      for (const m of (meals || [])) {
        ;(byCategory[m.category] = byCategory[m.category] || []).push(m)
        byId[m.id] = m
      }
      setMealsByCategory(byCategory)
      setMealsById(byId)

      const usedTargets = new Set((assignments || []).map(a => a.calorie_target))
      setAvailableTiers(CALORIE_TIERS.filter(t => usedTargets.has(t)))

      const master = []
      const byTier = {}
      for (const t of (templates || [])) {
        const slots = {}
        for (const s of (t.template_meal_slots || [])) {
          slots[s.slot_type] = s.meal_id
        }
        const week = { templateId: t.id, weekNum: t.week_number, slots }
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

  // A meal's macros at the tier being edited — its tier version's numbers if one exists for this
  // tier, or its base recipe's totals when editing the tier-agnostic Standard template.
  function mealMacros(mealId, tier) {
    const meal = mealId ? mealsById[mealId] : null
    if (!meal) return null
    if (tier == null) return sumMacros(meal.meal_ingredients)
    const ver = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    return ver ? { calories: round1(ver.calories), protein_g: round1(ver.protein_g), carbs_g: round1(ver.carbs_g), fat_g: round1(ver.fat_g) } : null
  }

  function sumSlotMacros(week, keys, tier) {
    const t = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    let complete = true
    for (const key of keys) {
      const m = mealMacros(week.slots[key], tier)
      if (!m) { complete = false; continue }
      t.calories += m.calories
      t.protein_g += m.protein_g
      t.carbs_g += m.carbs_g
      t.fat_g += m.fat_g
    }
    return { calories: round1(t.calories), protein_g: round1(t.protein_g), carbs_g: round1(t.carbs_g), fat_g: round1(t.fat_g), complete }
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
      .map(ins => ({ templateId: ins.id, weekNum: ins.week_number, slots: { ...(weeks.find(w => w.weekNum === ins.week_number)?.slots || {}) } }))
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

  // Breakfast/lunch/dinner only change for the week being edited. Pre-workout/evening-snack are
  // the same every week, so changing one writes the new meal into every week at once.
  function changeSlot(weekIdx, slotKey, mealId) {
    const isStatic = STATIC_SLOT_KEYS.has(slotKey)
    const setActiveWeeks = activeTier == null
      ? setWeeks
      : updater => setTierWeeks(prev => ({ ...prev, [activeTier]: updater(prev[activeTier] || []) }))

    setActiveWeeks(prev => prev.map((w, i) => {
      if (!isStatic && i !== weekIdx) return w
      return { ...w, slots: { ...w.slots, [slotKey]: mealId || null } }
    }))
    setDirty(prev => {
      const s = new Set(prev)
      if (isStatic) currentWeeks.forEach(w => s.add(w.templateId))
      else s.add(currentWeeks[weekIdx].templateId)
      return s
    })
  }

  async function updateCurrentWeek(week) {
    await supabase.from('plan_groups').update({ current_week: week }).eq('id', groupId)
    setPlanGroup(prev => ({ ...prev, current_week: week }))
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
        }))

      if (rows.length) {
        const { error: insErr } = await supabase.from('template_meal_slots').insert(rows)
        if (insErr) { setSaveError(insErr.message); setSaving(false); return }
      }
    }

    setDirty(new Set())
    setSaving(false)
  }

  // Rotates every meal the coach has already placed in the template across the 20 weeks in the
  // arrangement that gets each day as close as possible to the calorie and macro target, without
  // ever using the same meal more than once per cycle and without changing WHICH meals are in the
  // rotation — only WHEN each one appears.
  //
  // Algorithm:
  //   1. Collect the unique meals currently in each slot (breakfast1, lunch1, etc.) across all
  //      20 weeks — that IS the pool; no meals are added or removed.
  //   2. Build a round-robin 20-week schedule for each slot by cycling through its pool so every
  //      meal gets equal airtime and no meal repeats until all others have appeared.
  //   3. Run pairwise swap-improvement for each slot independently (holding the other 5 fixed):
  //      swap week i's meal with week j's in this slot if it lowers the sum of those two weeks'
  //      day-total scores. This converges in a few passes and runs entirely in-memory.
  function handleOptimize() {
    if (activeTier == null) return
    setOptimizing(true)

    const tgtMacros = calcStandardMacros(activeTier)
    const N = currentWeeks.length

    // Unique meals currently placed in each slot, in first-seen order.
    // Falls back to all meals that have a tier version if a slot is completely empty.
    function buildPool(slotKey) {
      const seen = new Set()
      const order = []
      for (const w of currentWeeks) {
        const id = w.slots[slotKey]
        if (id && !seen.has(id)) { seen.add(id); order.push(id) }
      }
      if (order.length === 0) {
        const cat = MAIN_SLOTS.find(s => s.key === slotKey)?.cat
        ;(mealsByCategory[cat] || [])
          .filter(m => (m.meal_tier_versions || []).some(v => v.calorie_tier === activeTier))
          .forEach(m => { if (!seen.has(m.id)) { seen.add(m.id); order.push(m.id) } })
      }
      return order
    }

    const pools = {}
    for (const s of MAIN_SLOTS) pools[s.key] = buildPool(s.key)

    // Round-robin 20-week schedule: cycle through the pool evenly.
    function makeRoundRobin(pool) {
      if (!pool.length) return Array(N).fill(null)
      return Array.from({ length: N }, (_, i) => pool[i % pool.length])
    }

    // Current schedules — one array of meal IDs per slot, indexed by week position 0..19.
    const scheds = {}
    for (const s of MAIN_SLOTS) scheds[s.key] = makeRoundRobin(pools[s.key])

    // How far a full day total deviates from the tier target — same 4:1:1:1 weighting as the
    // tier solver so the same quality bar applies here.
    function dayScore(weekIdx) {
      const staticIds = ['preworkout', 'evening_snack'].map(k => currentWeeks[weekIdx].slots[k]).filter(Boolean)
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
      return scoreA + scoreB
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

    const optimized = currentWeeks.map((week, i) => ({
      ...week,
      slots: {
        ...week.slots,
        ...Object.fromEntries(MAIN_SLOTS.map(s => [s.key, scheds[s.key][i]])),
      },
    }))

    setTierWeeks(prev => ({ ...prev, [activeTier]: optimized }))
    setDirty(new Set(optimized.map(w => w.templateId)))
    setExpanded(new Set(optimized.map(w => w.weekNum)))
    setOptimizing(false)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/coach/meal-templates')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{planGroup?.name}</h1>
          {dirty.size > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              {dirty.size} unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTier != null && (
            <button
              onClick={handleOptimize}
              disabled={optimizing || forking}
              className="btn-secondary"
              title="Try every combination of breakfast, lunch, and dinner meals and select whichever pairing gets each day closest to the calorie and macro targets."
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
                onClick={() => updateCurrentWeek(planGroup.current_week > 1 ? planGroup.current_week - 1 : 20)}
                className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ‹
              </button>
              <select
                className="mx-1 text-sm font-semibold text-gray-900 dark:text-white bg-pink-50 dark:bg-pink-900/20 border-0 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-300 cursor-pointer"
                value={planGroup.current_week}
                onChange={e => updateCurrentWeek(parseInt(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
              <button
                onClick={() => updateCurrentWeek(planGroup.current_week < 20 ? planGroup.current_week + 1 : 1)}
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
          Editing the {activeTier} kcal version of this plan — clients on other calorie targets aren't affected. Starts as a copy of the standard meals below until you change something. Expand a week to see how closely each day's macros match the target.
        </p>
      ) : availableTiers.length > 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Select a calorie tier above to see how closely each day matches that tier's calorie and macro targets.
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
              <div className="divide-y divide-pink-50 dark:divide-pink-900/10">
                {activeTier != null && (opt1Totals.calories > 0 || opt2Totals.calories > 0) && (
                  <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/20 space-y-1">
                    <MacroMatchRow label="A" totals={opt1Totals} tier={activeTier} />
                    <MacroMatchRow label="B" totals={opt2Totals} tier={activeTier} />
                  </div>
                )}
                {SLOTS.map(slot => {
                  const options = mealsByCategory[slot.cat] || []
                  const mealId = week.slots[slot.key] || ''
                  const macros = mealMacros(mealId, activeTier)
                  const isStatic = STATIC_SLOT_KEYS.has(slot.key)
                  const editKey = mealId && activeTier != null ? `${mealId}:${activeTier}` : null
                  const isEditingIngredients = editKey != null && editingIngredients === editKey
                  return (
                    <div key={slot.key}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                        <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {slot.label}
                          {isStatic && <span className="block normal-case font-normal text-gray-300 dark:text-gray-600">same every week</span>}
                        </span>
                        <select
                          className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                          value={mealId}
                          onChange={e => changeSlot(weekIdx, slot.key, e.target.value)}
                        >
                          <option value="">— None —</option>
                          {options.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <span className="w-48 flex-shrink-0 text-right text-xs">
                          {!mealId ? (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          ) : macros ? (
                            <span className="text-gray-500 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{macros.calories} kcal</span>
                              {' · '}{macros.protein_g}P {macros.carbs_g}C {macros.fat_g}F
                            </span>
                          ) : (
                            <span className="text-amber-500" title="Generate this meal's calorie tiers in the Meal Library">
                              No {activeTier} kcal version
                            </span>
                          )}
                        </span>
                        {editKey != null && (
                          <button
                            onClick={() => setEditingIngredients(prev => prev === editKey ? null : editKey)}
                            className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex-shrink-0 whitespace-nowrap"
                          >
                            {isEditingIngredients ? 'Hide' : 'Edit ingredients'}
                          </button>
                        )}
                      </div>
                      {isEditingIngredients && (
                        <div className="mx-4 mb-2 bg-gray-50/60 dark:bg-gray-800/30 rounded-lg">
                          <TierIngredientEditor mealId={mealId} tier={activeTier} category={slot.cat} coachId={profile.id} mealSplit={mealSplit} />
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
