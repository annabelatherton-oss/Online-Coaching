import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { normalizeMealSplit } from '../../lib/calorieSplit'

const SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

// Breakfast/lunch/dinner are the only categories this editor controls — pre-workout and evening
// snack are chosen per-client elsewhere, so "the day" here means just those 3 main meals' share
// of the tier (per the coach's calorie split), not the full daily target.
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
  // The combined share of a tier that breakfast+lunch+dinner should add up to — the rest goes to
  // pre-workout/evening snack, which are chosen per-client and aren't part of this template.
  const mainMealsTarget = activeTier == null
    ? null
    : Math.round(activeTier * (mealSplit.breakfast + mealSplit.lunch + mealSplit.dinner) / 100)

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

  function changeSlot(weekIdx, slotKey, mealId) {
    const setActiveWeeks = activeTier == null
      ? setWeeks
      : updater => setTierWeeks(prev => ({ ...prev, [activeTier]: updater(prev[activeTier] || []) }))

    setActiveWeeks(prev => prev.map((w, i) => {
      if (i !== weekIdx) return w
      return { ...w, slots: { ...w.slots, [slotKey]: mealId || null } }
    }))
    setDirty(prev => {
      const s = new Set(prev)
      s.add(currentWeeks[weekIdx].templateId)
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
        <button
          onClick={handleSaveDirty}
          disabled={saving || dirty.size === 0}
          className="btn-primary"
        >
          {saving ? 'Saving…' : `Save ${dirty.size} Week${dirty.size !== 1 ? 's' : ''}`}
        </button>
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

      {activeTier != null && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Editing the {activeTier} kcal version of this plan — clients on other calorie targets aren't affected. Starts as a copy of the standard meals below until you change something.
        </p>
      )}

      {forking ? (
        <LoadingSpinner size="md" className="py-10" />
      ) : currentWeeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const isCurrent = planGroup && week.weekNum === planGroup.current_week
        const isDirty = dirty.has(week.templateId)
        const opt1Totals = sumSlotMacros(week, ['breakfast1', 'lunch1', 'dinner1'], activeTier)
        const opt2Totals = sumSlotMacros(week, ['breakfast2', 'lunch2', 'dinner2'], activeTier)

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
                  <OptionTotal label="A" totals={opt1Totals} target={mainMealsTarget} />
                  <OptionTotal label="B" totals={opt2Totals} target={mainMealsTarget} />
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isOpen && (
              <div className="divide-y divide-pink-50 dark:divide-pink-900/10">
                {SLOTS.map(slot => {
                  const options = mealsByCategory[slot.cat] || []
                  const mealId = week.slots[slot.key] || ''
                  const macros = mealMacros(mealId, activeTier)
                  return (
                    <div key={slot.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                      <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {slot.label}
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
