import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import { writeCalorieTarget } from '../../lib/calorieTarget'
import {
  MEAL_GROUPS, ALL_SLOT_DEFS, OPTION_1_KEYS, OPTION_2_KEYS,
  normalizeOverrides, hasAnyOverride,
  mealMacros, mealMacrosLayered, addMacros, getIngredients, getIngredientsLayered,
  MealCard, RecipeModal, SwapModal,
  MacroBadge, MACRO_META, formatSigned,
} from '../../components/MealPlanView'
import { snapToConstraints } from '../../lib/calorieTierScaling'
import { weekForDate } from '../../lib/planWeek'
import { calcBodyweightMacros, normalizeGoalMacroSplits } from '../../lib/macros'
import { GOAL_LABELS } from '../../lib/calorieSuggestion'
import { useSignedProgressPhotosForCheckins } from '../../lib/progressPhotos'
import { diffAndSnapshotPlan } from '../../lib/planChanges'
import CalorieSuggestionPanel from '../../components/CalorieSuggestionPanel'
import ClientWeeklyPlan from './ClientWeeklyPlan'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Check-in window: opens Friday, runs a full 7 days through the following Thursday, then the
// next Friday opens straight into a new window — no closed day in between. Mirrors the
// client-side window in ClientCheckin.jsx.
function lastFridayMidnight() {
  const now = new Date()
  const daysSince = (now.getDay() - 5 + 7) % 7
  const d = new Date(now)
  d.setDate(now.getDate() - daysSince)
  d.setHours(0, 0, 0, 0)
  return d
}
function checkinStreak(checkins) {
  let cursor = lastFridayMidnight()
  const hasCurrent = checkins.some(c => new Date(c.submitted_at || c.updated_at) >= cursor)
  if (!hasCurrent) cursor.setDate(cursor.getDate() - 7)
  let streak = 0
  while (streak < 520) {
    const windowStart = new Date(cursor)
    const windowEnd = new Date(cursor)
    windowEnd.setDate(windowEnd.getDate() + 7)
    const hit = checkins.some(c => {
      const t = new Date(c.submitted_at || c.updated_at)
      return t >= windowStart && t < windowEnd
    })
    if (!hit) break
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

// Quick-reply starters for the coach response box — warm and encouraging,
// not a full message on their own (the coach edits/adds to them before sending).
const QUICK_REPLIES = [
  { label: 'Great week 🌟', text: "You're doing amazing this week! ✨ So proud of how consistent you've been — keep this energy going." },
  { label: 'Tough week 💗', text: "Rough week, but you still showed up — that says everything about you. Let's tighten things up together next week. 💗" },
  { label: 'Progress! 🌸', text: "Look at that progress! 🌸 Every week you're proving what you're capable of. Keep going, you've got this." },
  { label: 'Plateau pep talk 🌷', text: "Plateaus just mean your body's catching its breath before the next breakthrough — stay patient, you're closer than you think." },
  { label: 'Consistency win 🤍', text: 'Your consistency this week did not go unnoticed. This is exactly how real results are built! 🤍' },
  { label: 'Resolved a struggle 🎉', text: "So glad to hear you're feeling on top of this now — that's a genuine win, well done! 🎉" },
]

function QuickReplies({ onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUICK_REPLIES.map(q => (
        <button
          type="button"
          key={q.label}
          onClick={() => onPick(q.text)}
          className="px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
        >
          {q.label}
        </button>
      ))}
    </div>
  )
}

function appendQuickReply(current, text) {
  return current?.trim() ? `${current.trim()}\n\n${text}` : text
}

// Check-in submitted Wed or Thu (the last two days of the Fri-Thu window) = late re-submit
function isLateSubmission(checkin) {
  const iso = checkin?.updated_at || checkin?.submitted_at
  if (!iso) return false
  const dow = new Date(iso).getDay()
  return dow === 3 || dow === 4
}

function ratingColor(v) {
  if (!v) return 'text-gray-400'
  if (v >= 4) return 'text-green-600 dark:text-green-400'
  if (v >= 3) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function Avatar({ name, size = 9 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-semibold text-brand-700 dark:text-brand-300 flex-shrink-0 text-sm`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function weightDelta(a, b) {
  if (a?.weight_kg == null || b?.weight_kg == null) return null
  return Math.round((parseFloat(a.weight_kg) - parseFloat(b.weight_kg)) * 10) / 10
}

function liftDelta(currLift, prevCheckin) {
  const p = prevCheckin?.lift_results?.find(l => l?.name === currLift?.name)
  if (!p || currLift?.weight_kg == null || p?.weight_kg == null) return null
  return {
    kg: Math.round((parseFloat(currLift.weight_kg) - parseFloat(p.weight_kg)) * 10) / 10,
    reps: (parseInt(currLift.reps) || 0) - (parseInt(p.reps) || 0),
  }
}

function DeltaTag({ delta, invertColors = false, suffix = ' kg' }) {
  if (delta === null || delta === undefined) return null
  const up = delta > 0
  const down = delta < 0
  const green = invertColors ? down : up
  const red = invertColors ? up : down
  const cls = green ? 'text-green-600 dark:text-green-400' : red ? 'text-red-500 dark:text-red-400' : 'text-gray-400'
  const arrow = up ? '↑ ' : down ? '↓ ' : ''
  return <span className={`text-xs font-semibold ${cls}`}>{arrow}{up ? '+' : ''}{delta}{suffix}</span>
}

// Full-screen photo viewer, swiped (touch) or arrow-button-clicked through all 4 angles of
// whichever check-in's photo grid it was opened from — `photos` is that week's own
// { front, back, ... } url map, `initialAngle` is whichever thumbnail was actually clicked.
function PhotoLightbox({ photos, initialAngle, onClose }) {
  const [index, setIndex] = useState(() => Math.max(0, PHOTO_ANGLES.indexOf(initialAngle)))
  const touchX = useRef(null)

  function go(delta) {
    setIndex(i => (i + delta + PHOTO_ANGLES.length) % PHOTO_ANGLES.length)
  }

  function handleTouchStart(e) { touchX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchX.current == null) return
    const delta = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
  }

  const angle = PHOTO_ANGLES[index]
  const url = photos?.[angle]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="relative max-w-lg w-full select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {url ? (
          <img src={url} alt={angle} className="w-full max-h-[70vh] object-contain rounded-xl" />
        ) : (
          <div className="w-full aspect-[3/4] max-h-[70vh] rounded-xl bg-gray-900 flex flex-col items-center justify-center gap-1">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-500">No photo for this angle</span>
          </div>
        )}
        <button onClick={onClose} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <div className="flex items-center justify-center gap-3 mt-3">
          {PHOTO_ANGLES.map((a, i) => (
            <button
              key={a}
              onClick={() => setIndex(i)}
              className={`text-xs px-1.5 pb-1 border-b-2 transition-colors capitalize ${
                i === index ? 'border-white text-white font-medium' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Full-screen start-vs-now (vs last-week, when it's a distinct week) comparison — the same pose,
// side by side, swiped (or arrow-button-clicked) through each angle in turn. `getCols(angle)`
// returns that angle's columns as [{ label, url }, ...]; how many columns there are can vary by
// angle since an in-between week's photos might be missing that one.
function ComparisonLightbox({ angles, getCols, onClose }) {
  const [index, setIndex] = useState(0)
  const touchX = useRef(null)

  function go(delta) {
    setIndex(i => (i + delta + angles.length) % angles.length)
  }

  function handleTouchStart(e) { touchX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchX.current == null) return
    const delta = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
  }

  const angle = angles[index]
  const cols = getCols(angle)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div
        className="relative max-w-3xl w-full select-none"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <p className="text-center text-sm font-medium text-white capitalize mb-3">{angle}</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
          {cols.map(col => (
            <div key={col.label} className="space-y-1.5">
              {col.url ? (
                <img src={col.url} alt={col.label} className="w-full aspect-[3/4] object-cover rounded-xl" />
              ) : (
                <div className="w-full aspect-[3/4] rounded-xl bg-gray-800 flex items-center justify-center text-xs text-gray-500">No photo</div>
              )}
              <p className="text-xs text-center text-gray-300">{col.label}</p>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="absolute -top-1 right-1 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <div className="flex items-center justify-center gap-3 mt-3">
          {angles.map((a, i) => (
            <button
              key={a}
              onClick={() => setIndex(i)}
              className={`text-xs px-1.5 pb-1 border-b-2 transition-colors capitalize ${
                i === index ? 'border-white text-white font-medium' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Plan delivery panel ───────────────────────────────────────────────────────
function DeliveryPanel({ client, current, prev, activeAssignment, deliveryPersonalWeek, coachId, onCancel, onDelivered }) {
  const { profile } = useAuth()
  const goalSplits = normalizeGoalMacroSplits(profile?.goal_macro_splits)
  const [loading, setLoading] = useState(true)
  const [coachNotes, setCoachNotes] = useState(current?.coach_response || '')
  // Coach's own per-struggle advice for THIS week's check-in, keyed by struggle label — e.g. a
  // comment specifically against "Struggling to find time for the gym" rather than one big
  // response covering everything. Saved together with the rest of the response.
  const [struggleComments, setStruggleComments] = useState(current?.coach_struggle_comments || {})
  const [calorieTarget, setCalorieTarget] = useState(String(activeAssignment?.calorie_target ?? ''))
  const [trainingNotes, setTrainingNotes] = useState('')
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  // Slot keys the coach has permanently removed for this client (e.g. "no
  // evening snack, ever") — persisted onto the assignment on submit so it
  // stays gone on every future week, not just this one.
  const [removedMealSlots, setRemovedMealSlots] = useState([])
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  // The plan group's own per-week/tier override (set from the 50-week schedule editor) for the
  // week currently loaded here — read-only in check-ins, applied underneath ingredientOverrides.
  const [templateOverrides, setTemplateOverrides] = useState({})
  // id of the weekly_templates row backing the currently-loaded week+tier — "Apply to weekly
  // schedule" writes its result to this row's template_meal_slots. Never falls back cross-scope
  // (a tier's own row only) — see buildTemplateOverrides vs this for why.
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  // Whether the shared schedule's own week/tier (not this one client's personal edits) has already
  // been approved — see approveTemplateWeek below. Lets the coach see at a glance, right here while
  // responding to a check-in, whether this is standard/confirmed or still needs a look.
  const [activeTemplateLocked, setActiveTemplateLocked] = useState(false)
  const [approvingTemplate, setApprovingTemplate] = useState(false)
  const [applyingToSchedule, setApplyingToSchedule] = useState(null) // slotKey currently being applied, or null
  const [mealMap, setMealMap] = useState({})
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [ingredientLib, setIngredientLib] = useState({})
  const [training, setTraining] = useState(null)
  const [swapModal, setSwapModal] = useState(null)
  const [recipeModal, setRecipeModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [allPrograms, setAllPrograms] = useState([])
  const [nextBlockId, setNextBlockId] = useState('')
  const [assigningBlock, setAssigningBlock] = useState(false)
  // Bridges the "assigned training block" summary card below to ClientWeeklyPlan's own
  // populate/re-populate logic — same pattern the client's own Training tab uses, so there's one
  // box for the assigned block instead of two.
  const weeklyPlanRef = useRef(null)
  const [populateInfo, setPopulateInfo] = useState(null)
  const skipTierReload = useRef(true)
  const skipWeekReload = useRef(true)

  // Every client without a deliberate override just follows the plan group's own current_week —
  // the same "week_override ?? plan_group.current_week" rule the client's own meal plan/shopping
  // list use — so moving the group on to week 4 moves every client not pinned elsewhere onto week
  // 4 too, whether or not they checked in for week 3. week_override is only ever non-null here when
  // the coach has deliberately put this one client on a different week than everyone else (see the
  // "Put on a different week" control on the Meal Plan tab) — it's re-fetched below once the plan
  // group's actual current_week loads, so this initial value is only a placeholder until then.
  const [nextTemplateWeek, setNextTemplateWeek] = useState(activeAssignment?.week_override ?? 1)
  // The plan group's own current_week — null until loaded, or if this assignment has no plan
  // group at all. Submitting only writes week_override when the coach picked something other
  // than this, so a client who's just naturally following along never gets silently pinned.
  const [groupCurrentWeek, setGroupCurrentWeek] = useState(null)
  const tier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null

  // Initial data load
  useEffect(() => {
    if (!activeAssignment) { setLoading(false); return }
    async function load() {
      const currentTier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null

      // Look up the plan group's current rotation week — without a deliberate override, the panel
      // opens on this week regardless of whatever week this client was last delivered.
      let weekNum = nextTemplateWeek
      if (activeAssignment.plan_group_id) {
        const { data: pg } = await supabase.from('plan_groups').select('current_week').eq('id', activeAssignment.plan_group_id).maybeSingle()
        setGroupCurrentWeek(pg?.current_week ?? null)
        if (activeAssignment.week_override == null && pg?.current_week) { weekNum = pg.current_week; setNextTemplateWeek(pg.current_week) }
      }

      const [
        { data: mealsData },
        { data: libData },
        { data: tierTmplData },
        { data: stdTmplData },
        { data: cwm },
        { data: trainingAsgn },
        { data: programs },
      ] = await Promise.all([
        supabase.from('meals').select(`
          id, name, category, instructions, photo_url, photo_position,
          meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id, is_static, scaling_type),
          meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
            meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id, is_static))
        `).eq('coach_id', coachId).order('name'),
        supabase.from('ingredients').select('id, name, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving').eq('coach_id', coachId),
        currentTier
          ? supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', weekNum).eq('calorie_tier', currentTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', weekNum).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', activeAssignment.id).eq('week_number', weekNum).maybeSingle(),
        supabase.from('client_training_assignments').select('*, training_programs(name, weeks_total)').eq('client_id', client.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('training_programs').select('id, name').eq('coach_id', coachId).order('name'),
      ])

      const map = {}, byCat = {}
      for (const m of (mealsData || [])) {
        if (m.photo_url) m.photo_url = supabase.storage.from('meal-photos').getPublicUrl(m.photo_url).data.publicUrl
        map[m.id] = m
        ;(byCat[m.category] = byCat[m.category] || []).push(m)
      }
      setMealMap(map)
      setMealsByCategory(byCat)
      const lib = {}
      for (const ing of (libData || [])) lib[ing.id] = ing
      setIngredientLib(lib)

      setRemovedMealSlots(activeAssignment.removed_meal_slots || [])
      const tSlots = buildTemplateSlots(tierTmplData, stdTmplData, activeAssignment)
      let draft = {}
      try { const s = localStorage.getItem(`meal-draft-${client.id}-${activeAssignment.id}-${weekNum}`); draft = s ? JSON.parse(s) : {} } catch (_) {}
      setTemplateSlots(tSlots)
      setTemplateOverrides(buildTemplateOverrides(tierTmplData, stdTmplData))
      setActiveTemplateId((currentTier ? tierTmplData : stdTmplData)?.id ?? null)
      setActiveTemplateLocked(!!(currentTier ? tierTmplData : stdTmplData)?.locked)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}), ...draft })
      if (cwm?.ingredient_overrides) setIngredientOverrides(cwm.ingredient_overrides)
      setTraining(trainingAsgn)
      setAllPrograms(programs || [])

      setLoading(false)
      skipTierReload.current = false
      skipWeekReload.current = false
    }
    load()
  }, [])

  // Reload template slots when calorie tier changes — merge with any saved client overrides
  useEffect(() => {
    if (skipTierReload.current || !activeAssignment) return
    async function reloadTemplate() {
      const newTier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null
      const [{ data: tierTmplData }, { data: stdTmplData }, { data: cwm }] = await Promise.all([
        newTier
          ? supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).eq('calorie_tier', newTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', activeAssignment.id).eq('week_number', nextTemplateWeek).maybeSingle(),
      ])
      const tSlots = buildTemplateSlots(tierTmplData, stdTmplData, activeAssignment)
      let draft = {}
      try { const s = localStorage.getItem(`meal-draft-${client.id}-${activeAssignment.id}-${nextTemplateWeek}`); draft = s ? JSON.parse(s) : {} } catch (_) {}
      setTemplateSlots(tSlots)
      setTemplateOverrides(buildTemplateOverrides(tierTmplData, stdTmplData))
      setActiveTemplateId((newTier ? tierTmplData : stdTmplData)?.id ?? null)
      setActiveTemplateLocked(!!(newTier ? tierTmplData : stdTmplData)?.locked)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}), ...draft })
    }
    reloadTemplate()
  }, [calorieTarget])

  // Reload template slots + any saved overrides when the meal week changes
  useEffect(() => {
    if (skipWeekReload.current || !activeAssignment) return
    async function reloadWeek() {
      const currentTier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null
      const [{ data: tierTmplData }, { data: stdTmplData }, { data: cwm }] = await Promise.all([
        currentTier
          ? supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).eq('calorie_tier', currentTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('id, locked, template_meal_slots(slot_type, meal_id, ingredient_overrides)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', activeAssignment.id).eq('week_number', nextTemplateWeek).maybeSingle(),
      ])
      const tSlots = buildTemplateSlots(tierTmplData, stdTmplData, activeAssignment)
      let draft = {}
      try { const s = localStorage.getItem(`meal-draft-${client.id}-${activeAssignment.id}-${nextTemplateWeek}`); draft = s ? JSON.parse(s) : {} } catch (_) {}
      setTemplateSlots(tSlots)
      setTemplateOverrides(buildTemplateOverrides(tierTmplData, stdTmplData))
      setActiveTemplateId((currentTier ? tierTmplData : stdTmplData)?.id ?? null)
      setActiveTemplateLocked(!!(currentTier ? tierTmplData : stdTmplData)?.locked)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}), ...draft })
      setIngredientOverrides(cwm?.ingredient_overrides || {})
    }
    reloadWeek()
  }, [nextTemplateWeek])

  function buildTemplateSlots(tierTmplData, stdTmplData, asgn) {
    const tmpl = tierTmplData || stdTmplData
    const slots = {}
    for (const s of (tmpl?.template_meal_slots || [])) slots[s.slot_type] = s.meal_id
    if (asgn.preworkout_static && asgn.preworkout_meal_id) slots.preworkout = asgn.preworkout_meal_id
    if (asgn.evening_snack_static && asgn.evening_snack_meal_id) slots.evening_snack = asgn.evening_snack_meal_id
    // Meals the coach has permanently removed for this client stay out of
    // every future week's template, not just the week they were removed in.
    for (const key of (asgn.removed_meal_slots || [])) delete slots[key]
    return slots
  }

  // The plan group's own per-week/tier ingredient override (from the 50-week schedule editor) for
  // each slot — applied underneath this client's own ingredientOverrides everywhere macros/
  // ingredients get resolved below, so an edit made in the schedule shows up here automatically.
  function buildTemplateOverrides(tierTmplData, stdTmplData) {
    const tmpl = tierTmplData || stdTmplData
    const overrides = {}
    for (const s of (tmpl?.template_meal_slots || [])) {
      if (s.ingredient_overrides) overrides[s.slot_type] = s.ingredient_overrides
    }
    return overrides
  }

  function draftKey(weekNum) {
    return `meal-draft-${client.id}-${activeAssignment.id}-${weekNum}`
  }
  function loadDraftSlots(weekNum) {
    try { const s = localStorage.getItem(draftKey(weekNum)); return s ? JSON.parse(s) : {} } catch (_) { return {} }
  }
  function saveDraftSlots(weekNum, slots) {
    try { localStorage.setItem(draftKey(weekNum), JSON.stringify(slots)) } catch (_) {}
  }
  function clearDraftSlots(weekNum) {
    try { localStorage.removeItem(draftKey(weekNum)) } catch (_) {}
  }

  function handleSwapOpen(slotKey, label, cat) { setSwapModal({ slotKey, label, cat }) }
  function handleSwapSelect(slotKey, newMealId) {
    const newSlots = { ...editedSlots, [slotKey]: newMealId }
    setEditedSlots(newSlots)
    setSwapModal(null)
    saveDraftSlots(nextTemplateWeek, newSlots)
  }
  function handleRevert(slotKey) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: templateSlots[slotKey] || null }))
  }

  // Dragging/typing an ingredient's quantity down to 0 removes it outright instead of leaving a
  // "0g / 0 kcal" row sitting in the list — a zeroed ingredient isn't part of the meal any more,
  // so it shouldn't still look like it is.
  function handleUpdateIngredient(slotKey, ingKey, newQty) {
    if (newQty <= 0) {
      setIngredientOverrides(prev => {
        const existing = normalizeOverrides(prev[slotKey])
        if (existing.added.some(a => a._tempId === ingKey)) {
          return { ...prev, [slotKey]: { ...existing, added: existing.added.filter(a => a._tempId !== ingKey) } }
        }
        const qty = { ...existing.qty }
        delete qty[ingKey]
        return { ...prev, [slotKey]: { ...existing, qty, removed: [...new Set([...existing.removed, ingKey])] } }
      })
      return
    }
    setIngredientOverrides(prev => {
      const existing = normalizeOverrides(prev[slotKey])
      const matchAdded = existing.added.find(a => a._tempId === ingKey)
      if (matchAdded) {
        const origQty = parseFloat(matchAdded.quantity_g) || 0
        const ratio = origQty > 0 ? newQty / origQty : 1
        const updatedAdded = existing.added.map(a => a._tempId !== ingKey ? a : {
          ...a,
          quantity_g: newQty,
          calories:  Math.round((parseFloat(a.calories)  || 0) * ratio * 10) / 10,
          protein_g: Math.round((parseFloat(a.protein_g) || 0) * ratio * 10) / 10,
          carbs_g:   Math.round((parseFloat(a.carbs_g)   || 0) * ratio * 10) / 10,
          fat_g:     Math.round((parseFloat(a.fat_g)     || 0) * ratio * 10) / 10,
        })
        return { ...prev, [slotKey]: { ...existing, added: updatedAdded } }
      }
      return { ...prev, [slotKey]: { ...existing, qty: { ...existing.qty, [ingKey]: newQty } } }
    })
  }

  function handleRemoveIngredient(slotKey, ing) {
    setIngredientOverrides(prev => {
      const existing = normalizeOverrides(prev[slotKey])
      // ing._isAdded also covers an ingredient the SCHEDULE (template layer) added, not just one
      // this client's own override added — those two look identical once resolved. Only take the
      // "drop from my own added list" path when it's actually in this client's own list; anything
      // else (a real base ingredient, or one the schedule itself added) is removed the normal way,
      // which correctly filters it out by id regardless of which layer it came from.
      const key = ing._tempId || ing.id
      if (ing._isAdded && existing.added.some(a => (a._tempId || a.id) === key)) {
        return { ...prev, [slotKey]: { ...existing, added: existing.added.filter(a => (a._tempId || a.id) !== key) } }
      }
      return { ...prev, [slotKey]: { ...existing, removed: [...existing.removed, ing.id] } }
    })
  }

  function handleAddIngredient(slotKey, libIng) {
    const tempId = `added-${libIng.id}-${Date.now()}`
    const newIng = {
      _tempId: tempId,
      id: libIng.id,
      name: libIng.name,
      quantity_g: libIng.serving_size || 100,
      unit: libIng.serving_unit || 'g',
      calories:  libIng.calories_per_serving  || 0,
      protein_g: libIng.protein_per_serving   || 0,
      carbs_g:   libIng.carbs_per_serving     || 0,
      fat_g:     libIng.fat_per_serving       || 0,
      _isAdded: true,
    }
    setIngredientOverrides(prev => {
      const existing = normalizeOverrides(prev[slotKey])
      return { ...prev, [slotKey]: { ...existing, added: [...existing.added, newIng] } }
    })
  }

  function handleRevertIngredients(slotKey) {
    setIngredientOverrides(prev => {
      const next = { ...prev }
      delete next[slotKey]
      return next
    })
  }

  // Static ingredients aren't a per-client override — locking one edits the meal's actual
  // recipe (base row + every calorie-tier version) so the fixed quantity applies to every
  // client on that meal, mirroring toggleIngredientStatic/updateStaticIngredientQty in
  // CoachClientProfile.jsx.
  async function toggleIngredientStatic(mealId, ing) {
    const meal = mealMap[mealId]
    if (!meal || ing._isAdded) return
    const newVal = !ing.is_static
    const baseIng = meal.meal_ingredients.find(b =>
      (ing.ingredient_id && b.ingredient_id === ing.ingredient_id) || b.name === ing.name
    )
    if (!baseIng) return
    await supabase.from('meal_ingredients').update({ is_static: newVal }).eq('id', baseIng.id)
    const tierVersionIds = (meal.meal_tier_versions || []).map(v => v.id)
    if (tierVersionIds.length > 0) {
      const q = supabase.from('meal_tier_ingredients').update({ is_static: newVal }).in('tier_version_id', tierVersionIds)
      ing.ingredient_id ? await q.eq('ingredient_id', ing.ingredient_id) : await q.eq('name', ing.name)
    }
    setMealMap(prev => {
      const m = { ...prev[mealId] }
      m.meal_ingredients = m.meal_ingredients.map(b => b.id === baseIng.id ? { ...b, is_static: newVal } : b)
      m.meal_tier_versions = (m.meal_tier_versions || []).map(v => ({
        ...v,
        meal_tier_ingredients: (v.meal_tier_ingredients || []).map(ti =>
          (ing.ingredient_id ? ti.ingredient_id === ing.ingredient_id : ti.name === ing.name)
            ? { ...ti, is_static: newVal }
            : ti
        ),
      }))
      return { ...prev, [mealId]: m }
    })
  }

  async function updateStaticIngredientQty(mealId, ing, newQty) {
    const meal = mealMap[mealId]
    if (!meal) return
    const baseIng = meal.meal_ingredients.find(b =>
      (ing.ingredient_id && b.ingredient_id === ing.ingredient_id) || b.name === ing.name
    )
    if (!baseIng) return
    const libIng = ing.ingredient_id ? ingredientLib[ing.ingredient_id] : null
    const factor = libIng && libIng.serving_size > 0 ? newQty / libIng.serving_size : newQty > 0 ? newQty / (parseFloat(baseIng.quantity_g) || 1) : 0
    const macros = libIng ? {
      calories:  Math.round(factor * libIng.calories_per_serving * 10) / 10,
      protein_g: Math.round(factor * libIng.protein_per_serving  * 10) / 10,
      carbs_g:   Math.round(factor * libIng.carbs_per_serving    * 10) / 10,
      fat_g:     Math.round(factor * libIng.fat_per_serving      * 10) / 10,
    } : {}
    await supabase.from('meal_ingredients').update({ quantity_g: newQty, ...macros }).eq('id', baseIng.id)
    const tierVersionIds = (meal.meal_tier_versions || []).map(v => v.id)
    if (tierVersionIds.length > 0) {
      const q = supabase.from('meal_tier_ingredients').update({ quantity_g: newQty, ...macros }).in('tier_version_id', tierVersionIds)
      ing.ingredient_id ? await q.eq('ingredient_id', ing.ingredient_id) : await q.eq('name', ing.name)
    }
    setMealMap(prev => {
      const m = { ...prev[mealId] }
      m.meal_ingredients = m.meal_ingredients.map(b =>
        b.id === baseIng.id ? { ...b, quantity_g: newQty, ...macros } : b
      )
      m.meal_tier_versions = (m.meal_tier_versions || []).map(v => ({
        ...v,
        meal_tier_ingredients: (v.meal_tier_ingredients || []).map(ti =>
          (ing.ingredient_id ? ti.ingredient_id === ing.ingredient_id : ti.name === ing.name)
            ? { ...ti, quantity_g: newQty, ...macros }
            : ti
        ),
      }))
      return { ...prev, [mealId]: m }
    })
  }

  // snapToConstraints only rounds when the ingredient has an explicit
  // serving_step configured in the library — most don't (it's an optional
  // per-ingredient field), so without a fallback here the redistribution
  // could land on a raw, unrounded figure like 4.7 crumpets or a
  // not-quite-round 41g of something. When there's no step: discrete/
  // counted units (crumpets, eggs, scoops, slices…) round to a whole
  // number, and weight/volume amounts round to the nearest 5.
  function roundIngredientQty(rawQty, ing, libIng) {
    if (libIng?.serving_step > 0) {
      const snapped = snapToConstraints(rawQty, libIng, false)
      return (snapped != null && !isNaN(snapped)) ? snapped : Math.round(rawQty)
    }
    const unit = ((ing.unit && ing.unit !== 'g') ? ing.unit : (libIng?.serving_unit || 'g')).trim().toLowerCase()
    const isWeightOrVolume = ['g', 'gram', 'grams', 'ml', 'millilitre', 'millilitres', 'l', 'litre', 'litres'].includes(unit)
    let rounded = isWeightOrVolume ? Math.round(rawQty / 5) * 5 : Math.max(1, Math.round(rawQty))
    if (libIng?.min_amount != null && rounded < libIng.min_amount) rounded = libIng.min_amount
    if (libIng?.max_amount != null && rounded > libIng.max_amount) rounded = libIng.max_amount
    return rounded
  }

  function handleRevertMealPlan() {
    setEditedSlots({ ...templateSlots })
    setIngredientOverrides({})
    setRemovedMealSlots(activeAssignment?.removed_meal_slots || [])
    clearDraftSlots(nextTemplateWeek)
  }

  // Removes a meal the client doesn't want (e.g. an evening snack) and
  // spreads its calories evenly across the day's other assigned meals by
  // scaling up their non-static ingredient quantities — so the client's
  // daily calorie target stays roughly the same instead of just dropping.
  // The removal is remembered on the assignment (on submit) so it stays
  // out of every future week too, not just this one.
  function handleRemoveMeal(slotKeyToRemove) {
    const removedCal = mealMacrosLayered(editedSlots[slotKeyToRemove], mealMap, tier, templateOverrides[slotKeyToRemove], ingredientOverrides[slotKeyToRemove])?.cal || 0

    const newSlots = { ...editedSlots, [slotKeyToRemove]: null }
    setEditedSlots(newSlots)
    setIngredientOverrides(prev => {
      const next = { ...prev }
      delete next[slotKeyToRemove]
      return next
    })
    setRemovedMealSlots(prev => prev.includes(slotKeyToRemove) ? prev : [...prev, slotKeyToRemove])
    saveDraftSlots(nextTemplateWeek, newSlots)

    if (removedCal <= 0) return

    // Option A and Option B (breakfast/lunch/dinner 1 vs 2) are separate,
    // parallel daily totals — redistributing across both at once would
    // throw both off. Pre-workout/evening-snack are shared by both totals,
    // so removing one of those tops up each option's own three meals
    // independently rather than touching the other shared slot (which
    // would double-count into whichever option still has it).
    const scopes = OPTION_1_KEYS.includes(slotKeyToRemove) ? [OPTION_1_KEYS]
      : OPTION_2_KEYS.includes(slotKeyToRemove) ? [OPTION_2_KEYS]
      : [OPTION_1_KEYS, OPTION_2_KEYS]

    scopes.forEach(optionKeys => {
      const remainingKeys = optionKeys.filter(k => k !== slotKeyToRemove && newSlots[k])
      if (remainingKeys.length === 0) return
      const share = removedCal / remainingKeys.length

      remainingKeys.forEach(key => {
        const meal = mealMap[newSlots[key]]
        if (!meal) return
        const allIngredients = getIngredientsLayered(meal, tier, templateOverrides[key], ingredientOverrides[key])
        const flexIngredients = allIngredients.filter(ing => !ing.is_static)
        const flexCal = flexIngredients.reduce((s, ing) => s + (parseFloat(ing.calories) || 0), 0)
        if (flexCal <= 0) return
        const scale = (flexCal + share) / flexCal
        flexIngredients.forEach(ing => {
          const currentQty = parseFloat(ing.quantity_g) || 0
          const rawQty = currentQty * scale
          const libIng = ing.ingredient_id ? ingredientLib[ing.ingredient_id] : null
          handleUpdateIngredient(key, ing._tempId || ing.id, roundIngredientQty(rawQty, ing, libIng))
        })
      })
    })
  }

  // Brings a removed meal slot back — both locally (this week's plan) and
  // by clearing it from the permanent removal list so it isn't excluded
  // from future weeks either. Doesn't undo the calorie redistribution
  // that was spread onto other meals when it was removed — use "Revert
  // all" for a full reset if that's what's needed too.
  function handleRestoreMeal(slotKey) {
    handleRevert(slotKey)
    setRemovedMealSlots(prev => prev.filter(k => k !== slotKey))
  }

  // Approves the shared schedule's own week/tier — not this one client's personal view — exactly
  // like the Plan Group editor's own Approve button (src/pages/coach/PlanGroupEditor.jsx
  // approveWeek), which this mirrors so a week approved from either screen shows the same way in
  // both. Deliberately resolves from templateSlots/templateOverrides, never editedSlots/
  // ingredientOverrides — approving reflects the standard every other client on this tier gets, not
  // whatever this client has swapped. If this client needs something different, that's exactly what
  // leaving this unapproved (and editing their own plan instead) is for.
  async function approveTemplateWeek() {
    if (!activeTemplateId || tier == null) return
    setApprovingTemplate(true)

    const frozenOverrides = {}
    for (const def of ALL_SLOT_DEFS) {
      const mealId = templateSlots[def.key]
      if (!mealId) continue
      const meal = mealMap[mealId]
      const effective = getIngredients(meal, tier, templateOverrides[def.key])
      const existing = templateOverrides[def.key] || {}
      frozenOverrides[def.key] = {
        ...existing,
        qty: Object.fromEntries(effective.filter(ing => !ing._isAdded).map(ing => [ing.id, ing.quantity_g])),
      }
    }

    await Promise.all(Object.entries(frozenOverrides).map(([slotKey, overrides]) =>
      supabase.from('template_meal_slots').update({ ingredient_overrides: overrides }).eq('template_id', activeTemplateId).eq('slot_type', slotKey)
    ))
    await supabase.from('weekly_templates').update({ locked: true }).eq('id', activeTemplateId)

    const combination = Object.fromEntries(ALL_SLOT_DEFS.map(def => [def.key, templateSlots[def.key] || null]))
    await supabase.from('plan_week_sends').upsert(
      [{ plan_group_id: activeAssignment.plan_group_id, calorie_tier: tier, week_number: nextTemplateWeek, meal_combination: combination }],
      { onConflict: 'plan_group_id,calorie_tier,week_number' }
    )

    setTemplateOverrides(frozenOverrides)
    setActiveTemplateLocked(true)
    setApprovingTemplate(false)
  }

  async function unlockTemplateWeek() {
    if (!activeTemplateId) return
    await supabase.from('weekly_templates').update({ locked: false }).eq('id', activeTemplateId)
    setActiveTemplateLocked(false)
  }

  async function assignNextBlock() {
    if (!nextBlockId || !training || !client) return
    setAssigningBlock(true)
    await supabase.from('client_training_assignments').update({ active: false }).eq('id', training.id)
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('client_training_assignments').insert({
      client_id: client.id,
      program_id: nextBlockId,
      active: true,
      start_date: today,
    })
    const { data: newAsgn } = await supabase
      .from('client_training_assignments')
      .select('*, training_programs(name, weeks_total)')
      .eq('client_id', client.id).eq('active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setTraining(newAsgn)
    setNextBlockId('')
    setAssigningBlock(false)
  }

  // Promotes this ONE client's current ingredient edits for one slot into the shared 50-week
  // schedule, for this exact week + calorie tier only (never the meal's global recipe) — so every
  // other client on that same tier this week picks it up too. Only available when this client's
  // slot is showing the SAME meal the template has (a swapped-in meal has nothing to promote back
  // to) and this tier already has its own forked template row in the schedule editor. Purely local
  // to the schedule — doesn't touch this check-in's own draft/submit flow at all.
  async function applyEditToSchedule(slotKey) {
    if (!activeTemplateId) return
    const mealId = editedSlots[slotKey]
    const meal = mealId ? mealMap[mealId] : null
    if (!meal) return
    const tierLabel = tier != null ? `${tier} kcal` : 'Standard'
    if (!window.confirm(`Make these ingredients the ${tierLabel} standard for this meal, for week ${nextTemplateWeek}? Every other client on this tier this week will pick it up too.`)) return

    setApplyingToSchedule(slotKey)
    try {
      const effective = getIngredientsLayered(meal, tier, templateOverrides[slotKey], ingredientOverrides[slotKey])
      // An ingredient removed via either override layer just doesn't appear in `effective` at
      // all — there's nothing there to loop over and notice it's gone. Comparing against the
      // meal's own base/tier rows is the only way to know which ones were dropped, so that the
      // written override's `removed` list actually carries that forward instead of defaulting to
      // empty and silently letting every removed ingredient reappear once this becomes the standard.
      const baseRows = tier != null
        ? (meal.meal_tier_versions?.find(v => v.calorie_tier === tier)?.meal_tier_ingredients || [])
        : (meal.meal_ingredients || [])
      const effectiveIds = new Set(effective.filter(ing => !ing._isAdded).map(ing => ing.id))
      const nextOverride = {
        qty: {},
        removed: baseRows.filter(row => !row.is_static && !effectiveIds.has(row.id)).map(row => row.id),
        added: [],
      }
      for (const ing of effective) {
        if (ing._isAdded) nextOverride.added.push({ ...ing })
        else nextOverride.qty[ing.id] = ing.quantity_g
      }
      const cleaned = hasAnyOverride(nextOverride) ? nextOverride : null
      const { error } = await supabase.from('template_meal_slots')
        .update({ ingredient_overrides: cleaned })
        .eq('template_id', activeTemplateId).eq('slot_type', slotKey)
      if (error) throw error

      setTemplateOverrides(prev => {
        const next = { ...prev }
        if (cleaned) next[slotKey] = cleaned
        else delete next[slotKey]
        return next
      })
      // This client's own override is now redundant — it matches what was just pushed to the
      // schedule — so clear it rather than leaving a stale layer sitting on top.
      setIngredientOverrides(prev => {
        const next = { ...prev }
        delete next[slotKey]
        return next
      })
    } catch (err) {
      window.alert(err.message || 'Failed to apply to the weekly schedule')
    } finally {
      setApplyingToSchedule(null)
    }
  }

  async function handleSubmit() {
    if (!current || !activeAssignment) return
    setSaving(true)
    const newCalTarget = calorieTarget ? parseInt(calorieTarget) : activeAssignment.calorie_target

    // .update() alone reports no error even when a missing/mismatched RLS policy silently
    // matches zero rows — chaining .select() and checking what actually came back is the only
    // way to tell "saved" from "quietly did nothing" (bit us for real on this exact table once
    // already — see coach-struggle-comments-migration.sql). Bail out before touching anything
    // else if the response itself never actually saved, rather than reporting success anyway.
    const { data: savedCheckin, error: checkinError } = await supabase.from('client_checkins')
      .update({ coach_response: coachNotes.trim() || null, coach_responded_at: new Date().toISOString(), coach_struggle_comments: struggleComments })
      .eq('id', current.id)
      .select()
    if (checkinError || !savedCheckin?.length) {
      setSaving(false)
      window.alert('Could not save your response. Please try again, or check with support if this keeps happening.')
      return
    }

    await supabase.from('client_week_meals').upsert({
      client_id: client.id,
      coach_id: coachId,
      assignment_id: activeAssignment.id,
      week_number: nextTemplateWeek,
      slots: editedSlots,
      ingredient_overrides: ingredientOverrides,
    }, { onConflict: 'assignment_id,week_number' })

    // Only actually pins week_override when the coach picked something other than the plan
    // group's own current_week — delivering "whatever week the group is naturally on" should
    // leave this client following it, not silently lock them onto today's week number forever
    // (which is exactly what always writing this here used to do).
    await supabase.from('client_plan_assignments')
      .update({ week_override: nextTemplateWeek === groupCurrentWeek ? null : nextTemplateWeek, calorie_target: newCalTarget, removed_meal_slots: removedMealSlots })
      .eq('id', activeAssignment.id)
    // Mirrors onto clients.current_calories too, so the Overview tab's own copy of the target
    // (and the client's task checklist) reflect a calorie change made from a check-in response.
    await supabase.from('clients').update({ current_calories: newCalTarget }).eq('id', client.id)

    // "What's changed" for the client — training plan and calorie/step changes only (meal content
    // changes every week regardless, so it's not worth flagging). Diffed against whatever schedule
    // snapshot the PREVIOUS delivery stored; a brand new client with no previous delivery just gets
    // no item-level changes reported, since there's nothing yet to compare against.
    const [{ data: scheduleItems }, { data: prevDelivery }, { data: clientRow }] = await Promise.all([
      supabase.from('client_schedule_items')
        .select('id, day_of_week, item_type, custom_label, duration_minutes, heart_rate_zone, times_per_week, workouts(name), hiit_circuits(name), cardio_sessions(name)')
        .eq('client_id', client.id),
      supabase.from('weekly_deliveries').select('schedule_snapshot')
        .eq('client_id', client.id).order('delivered_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('clients').select('steps_target').eq('id', client.id).maybeSingle(),
    ])
    const { changes: planChanges, snapshot: scheduleSnapshot } = diffAndSnapshotPlan({
      prevSnapshot: prevDelivery?.schedule_snapshot || null,
      currentItems: scheduleItems || [],
      currentStepsTarget: clientRow?.steps_target ?? null,
      prevCalorieTarget: activeAssignment.calorie_target,
      currentCalorieTarget: newCalTarget,
    })

    supabase.from('weekly_deliveries').insert({
      client_id: client.id,
      coach_id: coachId,
      checkin_id: current.id,
      personal_week: deliveryPersonalWeek,
      template_week: nextTemplateWeek,
      coach_notes: coachNotes.trim() || null,
      calorie_target: newCalTarget,
      training_notes: trainingNotes.trim() || null,
      delivered_slots: editedSlots,
      plan_changes: planChanges.length ? planChanges : null,
      schedule_snapshot: scheduleSnapshot,
    })

    clearDraftSlots(nextTemplateWeek)
    setSaving(false)
    onDelivered(coachNotes.trim(), newCalTarget, nextTemplateWeek === groupCurrentWeek ? null : nextTemplateWeek)
  }

  // Daily macro totals
  const preworkoutM = mealMacrosLayered(editedSlots.preworkout, mealMap, tier, templateOverrides.preworkout, ingredientOverrides.preworkout) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const snackM      = mealMacrosLayered(editedSlots.evening_snack, mealMap, tier, templateOverrides.evening_snack, ingredientOverrides.evening_snack) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  function sumSlotKeys(keys) {
    return keys.reduce((acc, key) => addMacros(acc, mealMacrosLayered(editedSlots[key], mealMap, tier, templateOverrides[key], ingredientOverrides[key])), { cal: 0, prot: 0, carb: 0, fat: 0 })
  }
  const opt1Total = addMacros(addMacros(sumSlotKeys(OPTION_1_KEYS), preworkoutM), snackM)
  const opt2Total = addMacros(addMacros(sumSlotKeys(OPTION_2_KEYS), preworkoutM), snackM)
  // "Original" here means the template's own standing content for this week/tier (including any
  // schedule-editor override) — before this client's own edits, not before the schedule's.
  const originalDailyCal = ALL_SLOT_DEFS.reduce((sum, s) => sum + (mealMacrosLayered(templateSlots[s.key], mealMap, tier, templateOverrides[s.key], null)?.cal || 0), 0)
  const currentDailyCal  = ALL_SLOT_DEFS.reduce((sum, s) => sum + (mealMacrosLayered(editedSlots[s.key], mealMap, tier, templateOverrides[s.key], ingredientOverrides[s.key])?.cal || 0), 0)

  const hasMealPlanChanges =
    Object.keys(ingredientOverrides).some(k => hasAnyOverride(ingredientOverrides[k])) ||
    Object.keys({ ...templateSlots, ...editedSlots }).some(k => editedSlots[k] !== templateSlots[k])

  const prevCalTarget = activeAssignment?.calorie_target
  const calDiff = calorieTarget && prevCalTarget ? parseInt(calorieTarget) - prevCalTarget : null

  // How far each option's actual daily macros land from the client's calorie target - protein
  // from this week's own logged bodyweight (falls back to the %-of-calories split if it hasn't
  // been logged yet), carbs/fat from the coach's standard split for the goal phase.
  const targetCal = parseInt(calorieTarget) || 0
  const targetMacros = targetCal > 0 ? calcBodyweightMacros(targetCal, current?.weight_kg, profile?.protein_g_per_kg, client?.goal_type, goalSplits) : null

  // What this slot's own macros would need to be for the WHOLE DAY to land exactly on target,
  // holding every other meal in that option as it actually is right now — not a fixed % of the
  // day handed to this meal's category regardless of what's happening elsewhere. A meal-split %
  // is an even-handed guess with no visibility into the rest of the day; this is the actual
  // number that closes the gap, whether that's because other meals left extra room or already
  // used more than their share.
  function slotTarget(slotKey) {
    if (!targetMacros || targetCal <= 0 || !slotKey) return null
    const optionTotal = OPTION_2_KEYS.includes(slotKey) ? opt2Total : opt1Total
    const mealActual = mealMacrosLayered(editedSlots[slotKey], mealMap, tier, templateOverrides[slotKey], ingredientOverrides[slotKey]) || { cal: 0, prot: 0, carb: 0, fat: 0 }
    return {
      cal:  targetCal              - (optionTotal.cal  - mealActual.cal),
      prot: targetMacros.protein_g - (optionTotal.prot - mealActual.prot),
      carb: targetMacros.carbs_g   - (optionTotal.carb - mealActual.carb),
      fat:  targetMacros.fat_g     - (optionTotal.fat  - mealActual.fat),
    }
  }
  function siblingSlotKey(slotKey) {
    const i1 = OPTION_1_KEYS.indexOf(slotKey)
    if (i1 !== -1) return OPTION_2_KEYS[i1]
    const i2 = OPTION_2_KEYS.indexOf(slotKey)
    if (i2 !== -1) return OPTION_1_KEYS[i2]
    return null
  }

  return (
    <div className="space-y-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-0 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Cancel
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight truncate">Submit Week {deliveryPersonalWeek} Plan</h1>
            <p className="text-xs text-gray-400 leading-tight truncate">{client?.full_name}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || loading}
          className="btn-primary py-1.5 px-4 text-sm flex-shrink-0"
        >
          {saving ? 'Submitting…' : `Submit Week ${deliveryPersonalWeek} Plan`}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="space-y-8 pt-6">
          {/* What the client actually sent this week — kept visible here (not just on the check-in
              list you came from) so it's on screen the whole time you're writing feedback below,
              instead of having to flip back and forth to remember what they said. */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This week's check-in</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Weight</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{current.weight_kg != null ? `${current.weight_kg} kg` : '—'}</p>
                <DeltaTag delta={weightDelta(current, prev)} invertColors />
              </div>
              {[['Energy', current.energy_level], ['Sleep', current.sleep_quality], ['Food', current.food_adherence], ['Gym', current.gym_adherence]].map(([label, v]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className={`text-sm font-semibold ${ratingColor(v)}`}>{v != null ? `${v}/5` : '—'}</p>
                </div>
              ))}
            </div>
            {(current.lift_results || []).filter(l => l?.name).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Lifts logged</p>
                <div className="space-y-1">
                  {current.lift_results.filter(l => l?.name).map((l, i) => {
                    const d = liftDelta(l, prev)
                    return (
                      <div key={i} className="flex items-center justify-between text-sm gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{l.name}</span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-medium text-gray-900 dark:text-white tabular-nums">{l.weight_kg ?? '—'} kg × {l.reps ?? '—'}</span>
                          {d && (d.kg !== 0 || d.reps !== 0) && <DeltaTag delta={d.kg} />}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {((current.struggles || []).length > 0 || current.struggles_other) && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Struggling with</p>
                {(current.struggles || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {current.struggles.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{s}</span>
                    ))}
                  </div>
                )}
                {current.struggles_other && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{current.struggles_other}</p>}
              </div>
            )}
            {current.notes && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Client note</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{current.notes}"</p>
              </div>
            )}
          </div>

          {/* Coach notes */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Message to client</h2>
            <QuickReplies onPick={text => setCoachNotes(v => appendQuickReply(v, text))} />
            <textarea
              autoFocus
              className="input w-full text-sm resize-none min-h-[120px]"
              rows={5}
              placeholder="Weekly feedback, notes and encouragement…"
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
            />
          </div>

          {/* Per-struggle advice — one comment against each specific issue the client listed this
              week (e.g. "Struggling to find time for the gym" -> "let's try a new split"), separate
              from the general message above. */}
          {(current.struggles || []).length > 0 && (
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Struggling with (this week)</h2>
              <div className="space-y-2.5">
                {current.struggles.map(s => (
                  <div key={s}>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-1.5">{s}</span>
                    <textarea
                      rows={1}
                      value={struggleComments[s] || ''}
                      onChange={e => setStruggleComments(prev => ({ ...prev, [s]: e.target.value }))}
                      placeholder={`Your advice for "${s}"…`}
                      className="input w-full text-sm py-1.5 resize-none min-h-[56px]"
                    />
                  </div>
                ))}
              </div>
              {current.struggles_other && (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{current.struggles_other}"</p>
              )}
            </div>
          )}

          {/* Calorie target — shown before the meal plan below, so the coach sees what they're
              aiming for (and how each option currently measures up against it) before scrolling
              down to the actual meal choices. */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Calorie target</h2>
            <div className="flex items-center gap-4">
              <div>
                <label className="label text-xs">kcal/day</label>
                <input
                  className="input w-32 text-sm"
                  type="number" onFocus={e => e.target.select()}
                  min="0"
                  step="100"
                  value={calorieTarget}
                  onChange={e => setCalorieTarget(e.target.value)}
                  placeholder="e.g. 1800"
                />
              </div>
              {calDiff !== null && calDiff !== 0 && (
                <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${calDiff > 0 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                  {calDiff > 0 ? `↑ +${calDiff}` : `↓ ${calDiff}`} kcal vs last week
                </div>
              )}
            </div>
            <CalorieSuggestionPanel
              client={client}
              currentTarget={prevCalTarget}
              onApply={v => setCalorieTarget(String(v))}
            />
            {targetMacros && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Macro target:</span>{' '}
                {targetCal} kcal · {Math.round(targetMacros.carbs_g)}g C · {Math.round(targetMacros.protein_g)}g P · {Math.round(targetMacros.fat_g)}g F
                {client?.goal_type && GOAL_LABELS[client.goal_type] && <> · <span className="font-medium text-gray-700 dark:text-gray-300">{GOAL_LABELS[client.goal_type]}</span></>}
              </p>
            )}
            {/* Daily macro totals, with how far each option lands from the
                calorie target and the coach's standard macro split for it */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[{ label: 'Option A', macros: opt1Total }, { label: 'Option B', macros: opt2Total }].map(({ label, macros }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label} daily total{targetMacros ? ' vs target' : ''}</p>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[
                      { val: Math.round(macros.cal), lbl: 'kcal', target: targetMacros ? targetCal : null, unit: '', type: null },
                      { val: Math.round(macros.carb), lbl: 'carbs', target: targetMacros?.carbs_g ?? null, unit: 'g', type: 'carb' },
                      { val: Math.round(macros.prot), lbl: 'prot', target: targetMacros?.protein_g ?? null, unit: 'g', type: 'prot' },
                      { val: Math.round(macros.fat), lbl: 'fat', target: targetMacros?.fat_g ?? null, unit: 'g', type: 'fat' },
                    ].map(({ val, lbl, target, unit, type }) => {
                      // target - val (not val - target): phrased as the action still needed to
                      // hit target, same convention as MacroTargetInfo's macroDiff elsewhere in
                      // the app - positive means add this much more, negative means remove it.
                      const diff = target != null ? target - val : null
                      const onTarget = diff !== null && Math.abs(diff) <= (lbl === 'kcal' ? 30 : 5)
                      return (
                        <div key={lbl}>
                          <p className={`text-xs font-bold tabular-nums ${type ? MACRO_META[type].text : 'text-gray-900 dark:text-white'}`}>{val}{unit}</p>
                          <p className="text-[10px] text-gray-400 flex items-center justify-center gap-0.5">
                            {type && <MacroBadge type={type} />}{lbl}
                          </p>
                          {diff !== null && (
                            <p className={`text-[10px] font-semibold tabular-nums ${onTarget ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {diff > 0 ? `+${diff}` : diff === 0 ? '±0' : diff}{unit}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal plan for next week — shown right after the calorie target above, so the coach
              already knows what they're aiming for (and how each option compares) before picking
              or reviewing the actual meals. */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Meal plan
                  <span className="ml-2 text-xs font-normal text-gray-400">Tap a meal to view · Swap to change</span>
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Client sees this after you submit</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Template week</label>
                  <select
                    value={nextTemplateWeek}
                    onChange={e => setNextTemplateWeek(parseInt(e.target.value))}
                    className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                    ))}
                  </select>
                </div>
                {groupCurrentWeek != null && (
                  nextTemplateWeek === groupCurrentWeek
                    ? <p className="text-[10px] text-gray-400 dark:text-gray-500">Following the plan (Week {groupCurrentWeek})</p>
                    : <p className="text-[10px] text-orange-500">Individual override — plan is on Week {groupCurrentWeek}</p>
                )}
              </div>
              {hasMealPlanChanges && (
                <button
                  onClick={handleRevertMealPlan}
                  className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium flex-shrink-0"
                >
                  Revert all
                </button>
              )}
            </div>

            {/* Approval status for the SHARED standard at this tier/week — not this client's own
                view. Deliberately obvious (its own banner, not a small badge) since knowing at a
                glance whether a week has actually been checked is the whole point. */}
            {tier != null && (
              activeTemplateLocked ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 px-3 py-2">
                  <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" /></svg>
                    <span className="font-medium">Approved</span> — the {tier} kcal standard for Week {nextTemplateWeek} is checked and locked
                  </p>
                  <button type="button" onClick={unlockTemplateWeek} className="text-xs font-medium text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 flex-shrink-0">
                    Unlock
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Not yet approved</span> for the {tier} kcal standard, Week {nextTemplateWeek}
                    {hasMealPlanChanges && ' — this client has their own edits, which approving won\'t include'}
                  </p>
                  <button
                    type="button"
                    onClick={approveTemplateWeek}
                    disabled={approvingTemplate}
                    title="Confirms the standard meals/amounts at this tier for this week — locks them so nothing (Optimise combinations, a meal's own recipe changing later) can alter them again. Doesn't affect this client's own edits either way."
                    className="text-xs font-semibold text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 flex-shrink-0 disabled:opacity-50"
                  >
                    {approvingTemplate ? 'Approving…' : 'Approve'}
                  </button>
                </div>
              )
            )}

            {MEAL_GROUPS.map(group => {
              // Show a slot if it currently has a meal, or if it originally
              // had one from the template and has since been removed (so
              // there's still a card to restore it from).
              const relevantSlots = group.slots.filter(s => editedSlots[s.key] || templateSlots[s.key])
              if (relevantSlots.length === 0) return null

              // Banner above each meal type — up to two small lines: what B needs to change by
              // to match A, and what A itself needs to change by to hit its own slice of the
              // day's real target (slotTarget — whole-day-derived, not a fixed %). Both framed
              // the same +/- way as every other "hit target" number in the app.
              const [slotA, slotB] = group.slots
              const hasBothOptions = slotA && slotB && editedSlots[slotA.key] && editedSlots[slotB.key]
              const macrosA = slotA && editedSlots[slotA.key]
                ? mealMacrosLayered(editedSlots[slotA.key], mealMap, tier, templateOverrides[slotA.key], ingredientOverrides[slotA.key])
                : null
              const abDiff = (hasBothOptions && macrosA) ? (() => {
                const macrosB = mealMacrosLayered(editedSlots[slotB.key], mealMap, tier, templateOverrides[slotB.key], ingredientOverrides[slotB.key])
                if (!macrosB) return null
                return {
                  cal:  Math.round(macrosA.cal  - macrosB.cal),
                  carb: Math.round(macrosA.carb - macrosB.carb),
                  prot: Math.round(macrosA.prot - macrosB.prot),
                  fat:  Math.round(macrosA.fat  - macrosB.fat),
                }
              })() : null
              const targetA = slotA ? slotTarget(slotA.key) : null
              const aTargetDiff = (macrosA && targetA && targetA.cal > 0) ? {
                cal:  Math.round(targetA.cal  - macrosA.cal),
                carb: Math.round(targetA.carb - macrosA.carb),
                prot: Math.round(targetA.prot - macrosA.prot),
                fat:  Math.round(targetA.fat  - macrosA.fat),
              } : null

              return (
                <section key={group.label}>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{group.label}</h3>
                  {(abDiff || aTargetDiff) && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5 mb-2 space-y-1">
                      {aTargetDiff && (
                        <p>
                          {aTargetDiff.cal === 0 && aTargetDiff.carb === 0 && aTargetDiff.prot === 0 && aTargetDiff.fat === 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">{slotA.optionLabel ? 'A' : slotA.label} on target for the day</span>
                          ) : (
                            <>
                              <span className="font-medium text-gray-600 dark:text-gray-300">{slotA.optionLabel ? 'A' : slotA.label} → Target:</span>{' '}
                              {formatSigned(aTargetDiff.cal)} kcal · {formatSigned(aTargetDiff.carb)}g C · {formatSigned(aTargetDiff.prot)}g P · {formatSigned(aTargetDiff.fat)}g F
                            </>
                          )}
                        </p>
                      )}
                      {abDiff && (
                        <p>
                          {abDiff.cal === 0 && abDiff.carb === 0 && abDiff.prot === 0 && abDiff.fat === 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">B matches A</span>
                          ) : (
                            <>
                              <span className="font-medium text-gray-600 dark:text-gray-300">B → A:</span>{' '}
                              {formatSigned(abDiff.cal)} kcal · {formatSigned(abDiff.carb)}g C · {formatSigned(abDiff.prot)}g P · {formatSigned(abDiff.fat)}g F
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {relevantSlots.map(slot => (
                      editedSlots[slot.key] ? (
                        <MealCard
                          key={slot.key}
                          slotKey={slot.key}
                          label={slot.label}
                          optionLabel={slot.optionLabel}
                          cat={slot.cat}
                          mealId={editedSlots[slot.key]}
                          templateMealId={templateSlots[slot.key]}
                          mealMap={mealMap}
                          mealsByCategory={mealsByCategory}
                          tier={tier}
                          overrides={ingredientOverrides[slot.key]}
                          templateOverrides={templateOverrides[slot.key]}
                          onSwap={handleSwapOpen}
                          onViewRecipe={setRecipeModal}
                          ingredientLib={ingredientLib}
                          onRevert={handleRevert}
                          onRemove={handleRemoveMeal}
                        />
                      ) : (
                        <div key={slot.key} className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 min-h-[6.5rem]">
                          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{slot.label}{slot.optionLabel ? ` — ${slot.optionLabel}` : ''} removed<br/>its calories were added to the other meals</p>
                          <button
                            onClick={() => handleRestoreMeal(slot.key)}
                            className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                          >
                            Restore
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </section>
              )
            })}
            {Object.values(templateSlots).every(v => !v) && (
              <div className="card text-center py-10">
                <p className="text-sm text-gray-400">No meal plan template set for this week.</p>
                <p className="text-xs text-gray-400 mt-1">Set up weekly templates in the plan editor first.</p>
              </div>
            )}
          </div>

          {/* Training — header */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Training</h2>
              {populateInfo?.assignedProgram && (
                <button
                  onClick={() => weeklyPlanRef.current?.populate()}
                  disabled={populateInfo.populating}
                  className="text-xs text-brand-500 hover:text-brand-700 font-medium whitespace-nowrap disabled:opacity-50"
                >
                  {populateInfo.populating ? 'Populating…' : populateInfo.hasAnySchedule ? 'Re-populate schedule' : 'Populate schedule'}
                </button>
              )}
            </div>
            {training ? (() => {
              // Tracks the same personal-week count as the rest of the check-in (deliveryPersonalWeek —
              // "Submit Week N Plan" above) rather than counting calendar weeks since the training
              // block's own start_date. Those two used to drift apart whenever a client checked in
              // early/late a few times, or the training block was assigned on a different date than
              // the meal plan — "week 2 of the plan" showing as "week 1 of the block" for the exact
              // same client, same week, right next to each other on this same screen.
              const blockTotal = training.training_programs?.weeks_total ?? 12
              const currentWeek = Math.min(deliveryPersonalWeek, blockTotal)
              const weeksLeft = Math.max(0, blockTotal - currentWeek + 1)
              const isComplete = deliveryPersonalWeek > blockTotal
              return (
                <div className="space-y-2">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${isComplete ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-700' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-500/10 dark:bg-blue-500/20'}`}>
                      <svg className={`w-5 h-5 ${isComplete ? 'text-amber-600 dark:text-amber-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    {/* Which programme this is takes a back seat here — what actually needs a
                        glance during a check-in is just "is this block done yet", not its name. */}
                    <div className="flex-1 min-w-0" title={training.program_name || training.training_programs?.name}>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Training block</p>
                      {isComplete ? (
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          Block complete — time to move them into their next one
                        </p>
                      ) : (
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {weeksLeft} week{weeksLeft !== 1 ? 's' : ''} left
                          <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(week {currentWeek} of {blockTotal})</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {isComplete && (
                    <div className="p-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/10 space-y-2">
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-300">Assign next block</p>
                      <div className="flex gap-2">
                        <select
                          className="input py-1.5 text-sm flex-1"
                          value={nextBlockId}
                          onChange={e => setNextBlockId(e.target.value)}
                        >
                          <option value="">Select programme…</option>
                          {allPrograms.filter(p => p.id !== training.program_id).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={assignNextBlock}
                          disabled={!nextBlockId || assigningBlock}
                          className="btn-primary py-1.5 px-3 text-sm whitespace-nowrap"
                        >
                          {assigningBlock ? 'Assigning…' : 'Assign block'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })() : (
              <p className="text-sm text-gray-400">No training programme assigned.</p>
            )}
          </div>

          {/* Training — weekly schedule, the exact same day-card editor (workout/HIIT/cardio/rest,
              drag-and-drop between days) as the client's own Training tab uses — edits here save
              immediately, same as there, rather than waiting for the check-in's own Submit. */}
          {training && (
            <ClientWeeklyPlan
              ref={weeklyPlanRef}
              clientId={client.id}
              coachId={coachId}
              assignment={training}
              onPopulateInfo={setPopulateInfo}
            />
          )}

          {/* Training notes */}
          {training && (
            <div className="card space-y-2">
              <label className="label text-xs">Training notes for this week (optional)</label>
              <textarea
                className="input w-full text-sm resize-none min-h-[80px]"
                rows={3}
                placeholder="Any changes to training, extra rest days, focus points…"
                value={trainingNotes}
                onChange={e => setTrainingNotes(e.target.value)}
              />
            </div>
          )}

          {/* Bottom submit */}
          <div className="pb-8">
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="btn-primary w-full py-3 text-sm"
            >
              {saving ? 'Submitting…' : `Submit Week ${deliveryPersonalWeek} Plan to ${client?.full_name}`}
            </button>
          </div>
        </div>
      )}

      {swapModal && (
        <SwapModal
          slotKey={swapModal.slotKey}
          label={swapModal.label}
          category={swapModal.cat}
          currentMealId={editedSlots[swapModal.slotKey]}
          mealMap={mealMap}
          mealsByCategory={mealsByCategory}
          tier={tier}
          onSelect={handleSwapSelect}
          onClose={() => setSwapModal(null)}
        />
      )}

      {recipeModal && (
        <RecipeModal
          slotKey={recipeModal}
          mealMap={mealMap}
          editedSlots={editedSlots}
          tier={tier}
          ingredientOverrides={ingredientOverrides}
          templateOverrides={templateOverrides}
          templateSlots={templateSlots}
          mealsByCategory={mealsByCategory}
          ingredientLib={ingredientLib}
          onClose={() => setRecipeModal(null)}
          onSwap={(slotKey, label, cat) => { setRecipeModal(null); setSwapModal({ slotKey, label, cat }) }}
          onRevert={handleRevert}
          onUpdateIngredient={handleUpdateIngredient}
          onRevertIngredients={handleRevertIngredients}
          onRemoveIngredient={handleRemoveIngredient}
          onAddIngredient={handleAddIngredient}
          onToggleStatic={ing => toggleIngredientStatic(editedSlots[recipeModal], ing)}
          onStaticQtyChange={(ing, qty) => updateStaticIngredientQty(editedSlots[recipeModal], ing, qty)}
          onRemove={handleRemoveMeal}
          onApplyToSchedule={applyEditToSchedule}
          canApplyToSchedule={!!activeTemplateId && (editedSlots[recipeModal] || null) === (templateSlots[recipeModal] || null)}
          applyingToSchedule={applyingToSchedule === recipeModal}
          dayOptionTotals={[{ label: 'Option A', macros: opt1Total }, { label: 'Option B', macros: opt2Total }]}
          dayTargetCal={targetCal > 0 ? targetCal : null}
          target={slotTarget(recipeModal)}
          siblingMacros={(() => {
            const sibKey = siblingSlotKey(recipeModal)
            return sibKey ? mealMacrosLayered(editedSlots[sibKey], mealMap, tier, templateOverrides[sibKey], ingredientOverrides[sibKey]) : null
          })()}
          siblingLabel={ALL_SLOT_DEFS.find(s => s.key === siblingSlotKey(recipeModal))?.optionLabel || 'other option'}
        />
      )}
    </div>
  )
}

// ── Client detail view ────────────────────────────────────────────────────────
function ClientDetail({ client, checkins: rawCheckins, onBack, onResponded }) {
  const { profile } = useAuth()
  // Seeded from the parent list's own snapshot so there's no blank flash on open, but that
  // snapshot is only as fresh as whenever the coach's check-ins list last loaded — if this client
  // has submitted since then, it's missing here entirely. Refetched fresh below.
  const [checkins, setCheckins] = useState(rawCheckins)
  const [lightbox, setLightbox] = useState(null)
  const [showPhotoComparison, setShowPhotoComparison] = useState(false)
  const [responding, setResponding] = useState(null) // checkin id (past check-ins only)
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [showDeliveryPanel, setShowDeliveryPanel] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [editingCalorie, setEditingCalorie] = useState(false)
  const [calorieDraft, setCalorieDraft] = useState('')
  const [savingCalorie, setSavingCalorie] = useState(false)
  const [earlyAccess, setEarlyAccess] = useState(false)
  const [togglingEarlyAccess, setTogglingEarlyAccess] = useState(false)

  useEffect(() => {
    if (!client?.id) return
    supabase.from('clients').select('checkin_early_access').eq('id', client.id).maybeSingle()
      .then(({ data }) => setEarlyAccess(!!data?.checkin_early_access))
  }, [client?.id])

  async function toggleEarlyAccess() {
    if (!client?.id) return
    setTogglingEarlyAccess(true)
    const next = !earlyAccess
    const { error } = await supabase.from('clients').update({ checkin_early_access: next }).eq('id', client.id)
    if (!error) setEarlyAccess(next)
    setTogglingEarlyAccess(false)
  }

  const [weightEntries, setWeightEntries] = useState([])
  function loadWeightEntries() {
    if (!client?.id) return
    supabase.from('weight_entries').select('id, weight_kg, recorded_at')
      .eq('client_id', client.id).order('recorded_at', { ascending: false })
      .then(({ data }) => setWeightEntries(data || []))
  }
  useEffect(() => { loadWeightEntries() }, [client?.id])
  async function deleteWeightEntry(id) {
    await supabase.from('weight_entries').delete().eq('id', id)
    loadWeightEntries()
  }

  // Lets the coach backfill a past body weight or lift log right from here, while reviewing a
  // check-in, instead of needing to go to the client's own profile page for it.
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [addEntryType, setAddEntryType] = useState('weight')
  const [addEntryForm, setAddEntryForm] = useState({ date: new Date().toISOString().split('T')[0], weight_kg: '', lift_name: '', reps: '' })
  const [addEntrySaving, setAddEntrySaving] = useState(false)
  useEffect(() => { setShowAddEntry(false) }, [client?.id])

  async function submitAddEntry(e) {
    e.preventDefault()
    setAddEntrySaving(true)
    if (addEntryType === 'weight') {
      await supabase.from('weight_entries').insert({ client_id: client.id, weight_kg: parseFloat(addEntryForm.weight_kg), recorded_at: addEntryForm.date })
      loadWeightEntries()
    } else {
      await supabase.from('lift_entries').insert({
        client_id: client.id, lift_name: addEntryForm.lift_name.trim(),
        weight_kg: parseFloat(addEntryForm.weight_kg), reps: parseInt(addEntryForm.reps), recorded_at: addEntryForm.date,
      })
    }
    setAddEntrySaving(false)
    setShowAddEntry(false)
    setAddEntryForm({ date: new Date().toISOString().split('T')[0], weight_kg: '', lift_name: '', reps: '' })
  }

  // Refetch this client's own check-ins fresh on open, rather than trusting the parent list's
  // snapshot — a client who submitted after that snapshot was taken would otherwise be invisible
  // here (their weight, energy/sleep/food/gym ratings, struggles — all of it) until the coach
  // backed out to the list and re-opened it, or reloaded the page.
  useEffect(() => {
    if (!client?.id) return
    supabase.from('client_checkins').select('*').eq('client_id', client.id).order('week_number', { ascending: false })
      .then(({ data }) => { if (data) setCheckins(data) })
  }, [client?.id])

  // Struggle tracking — open issues carried across check-ins, plus any the
  // client has just marked resolved that the coach hasn't acknowledged yet.
  const [struggleTracking, setStruggleTracking] = useState([])
  useEffect(() => {
    if (!client?.id) return
    supabase.from('client_struggle_tracking').select('*')
      .eq('client_id', client.id).order('created_at', { ascending: true })
      .then(({ data }) => setStruggleTracking(data || []))
  }, [client?.id])

  async function acknowledgeResolvedStruggle(id) {
    await supabase.from('client_struggle_tracking').update({ coach_seen_resolved: true }).eq('id', id)
    setStruggleTracking(prev => prev.map(s => s.id === id ? { ...s, coach_seen_resolved: true } : s))
  }

  const openStruggleRows = struggleTracking.filter(s => s.status === 'open')
  const unseenResolvedStruggles = struggleTracking.filter(s => s.status === 'resolved' && !s.coach_seen_resolved)

  // Chronological comment trail for one struggle label, pulled from every
  // check-in that recorded an update against it.
  function struggleHistory(label) {
    return asc
      .filter(c => c.struggle_comments?.[label])
      .map(c => ({ week: personalWeekMap[c.id], comment: c.struggle_comments[label] }))
  }

  // desc order (most recent first)
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  const current = sorted[0]
  const first = sorted[sorted.length - 1]
  const prev = sorted[1] || null

  // ascending for history table + personal week mapping. A week_number=0 row (the one-off
  // "starting check-in" some clients submit right after signup, for a baseline weight/photos
  // before their real Week 1 begins) is never numbered as part of the sequence.
  //
  // Each real check-in's week is calendar-based — weeks elapsed since client.start_date — not a
  // count of check-ins actually submitted, so a client who misses one doesn't throw every later
  // week off, and backdating a start date immediately reclassifies their whole history. Falls back
  // to the old counting behaviour only for a client with no start_date set at all.
  const asc = [...sorted].reverse()
  const personalWeekMap = {}
  let personalCounter = 0
  asc.forEach(c => {
    if (c.week_number > 0) {
      personalCounter++
      personalWeekMap[c.id] = client.start_date
        ? (weekForDate(c.submitted_at || c.updated_at, client.start_date) || personalCounter)
        : personalCounter
    }
  })
  const currentPersonalWeek = current ? (current.week_number === 0 ? 0 : personalWeekMap[current.id]) : 0
  // deliveryPersonalWeek (used for "Submit Week N Plan") is normally one past the week this
  // check-in itself reports on — responding to a Week 2 check-in delivers Week 3. But it's never
  // allowed to fall behind today's own calendar week (weeks elapsed since client.start_date): if
  // check-ins were missed and today is already further along than "current + 1", it catches the
  // client up to today instead of quietly numbering a late response as just the next one along.
  const deliveryPersonalWeek = client.start_date
    ? Math.max(currentPersonalWeek + 1, weekForDate(new Date().toISOString(), client.start_date) || (currentPersonalWeek + 1))
    : currentPersonalWeek + 1

  // When there's no previous check-in, fall back to the last weight_entries row recorded before
  // this check-in's submission date so first-time check-ins still show a meaningful delta.
  const checkinDate = (current?.submitted_at || current?.updated_at || '').split('T')[0]
  const prevLogEntry = !prev && current?.weight_kg != null && checkinDate
    ? (weightEntries.find(e => e.recorded_at < checkinDate) ?? null)
    : null
  const wDeltaPrev = weightDelta(current, prev ?? (prevLogEntry ? { weight_kg: prevLogEntry.weight_kg } : null))
  const wDeltaPrevLabel = prev ? 'vs last week' : 'vs prev. log'

  // "since start": use oldest check-in; fall back to oldest weight_entry for first-check-in clients
  const oldestLog = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1] : null
  const wDeltaStart = current && first && current.id !== first.id
    ? weightDelta(current, first)
    : (current && oldestLog && Math.abs(parseFloat(oldestLog.weight_kg) - parseFloat(current.weight_kg ?? 0)) > 0.05
        ? weightDelta(current, { weight_kg: oldestLog.weight_kg })
        : null)
  const wDeltaStartLabel = (current && first && current.id !== first.id) ? 'since start' : 'since first log'

  const withPhotos = sorted.filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
  const newestP = withPhotos[0]
  const prevP = withPhotos[1]
  const firstP = withPhotos[withPhotos.length - 1]
  const compAngles = PHOTO_ANGLES.filter(a => newestP?.progress_photos?.[a])
  const showComparison = newestP && firstP && newestP.id !== firstP.id && compAngles.length > 0
  const photoUrlsByCheckin = useSignedProgressPhotosForCheckins(sorted)

  // Load active plan assignment for calorie target
  useEffect(() => {
    if (!client?.id) return
    supabase
      .from('client_plan_assignments')
      .select('id, calorie_target, week_override, plan_group_id, preworkout_static, preworkout_meal_id, evening_snack_static, evening_snack_meal_id')
      .eq('client_id', client.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setActiveAssignment(data) })
  }, [client?.id])

  function openRespond(c) {
    setResponseText(c.coach_response || '')
    setResponding(c.id)
  }

  async function saveCalorieTarget() {
    if (!activeAssignment) return
    const value = calorieDraft ? parseInt(calorieDraft) : null
    setSavingCalorie(true)
    await writeCalorieTarget({ clientId: client.id, assignmentId: activeAssignment.id, value })
    setActiveAssignment(prev => prev ? { ...prev, calorie_target: value } : prev)
    setSavingCalorie(false)
    setEditingCalorie(false)
  }

  async function sendResponse(checkinId) {
    setSaving(true)
    const text = responseText.trim()
    // .update() alone reports no error even when a missing/mismatched RLS policy silently
    // matches zero rows — chaining .select() and checking what actually came back is the only
    // way to tell "saved" from "quietly did nothing" (bit us for real on this exact table once
    // already — see coach-struggle-comments-migration.sql).
    const { data, error } = await supabase
      .from('client_checkins')
      .update({ coach_response: text, coach_responded_at: new Date().toISOString() })
      .eq('id', checkinId)
      .select()
    setSaving(false)
    if (error || !data?.length) {
      window.alert('Could not save your response. Please try again, or check with support if this keeps happening.')
      return
    }
    setResponding(null)
    const updated = checkins.map(c => c.id === checkinId ? { ...c, coach_response: text, coach_responded_at: new Date().toISOString() } : c)
    setCheckins(updated)
    onResponded(checkinId, text, client.id)
  }

  // Show the full delivery panel when the coach clicks "Submit Week X Plan"
  if (showDeliveryPanel && current && activeAssignment) {
    return (
      <div className="w-full">
        <DeliveryPanel
          client={client}
          current={current}
          prev={prev}
          activeAssignment={activeAssignment}
          deliveryPersonalWeek={deliveryPersonalWeek}
          coachId={profile.id}
          onCancel={() => setShowDeliveryPanel(false)}
          onDelivered={(notes, calTarget, deliveredWeek) => {
            setShowDeliveryPanel(false)
            setDelivered(true)
            setCheckins(prev => prev.map(c => c.id === current.id
              ? { ...c, coach_response: notes, coach_responded_at: new Date().toISOString() }
              : c))
            onResponded(current.id, notes, client.id)
            // Keep week_override in sync locally too — otherwise reopening Edit check-in right
            // after submitting reads the assignment's stale in-memory week and reintroduces the
            // "silently bumps forward a week" bug even though the DB itself is correct.
            setActiveAssignment(prev => prev ? { ...prev, calorie_target: calTarget, week_override: deliveredWeek } : prev)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} initialAngle={lightbox.angle} onClose={() => setLightbox(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={client?.full_name} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{client?.full_name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{sorted.length} check-in{sorted.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {checkinStreak(sorted) > 1 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex-shrink-0">
              <span className="text-base leading-none">🔥</span>
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{checkinStreak(sorted)} week streak</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleEarlyAccess}
          disabled={togglingEarlyAccess}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50 ${
            earlyAccess
              ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          title="Let this client submit next week's check-in early. If they haven't checked in for the current week yet, it's simply skipped — their plan's time remaining isn't affected."
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          {earlyAccess ? 'Next week open early' : 'Open next week early'}
        </button>
      </div>

      {unseenResolvedStruggles.length > 0 && (
        <div className="rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10 px-4 py-3 space-y-2">
          {unseenResolvedStruggles.map(row => (
            <div key={row.id} className="flex items-center justify-between gap-3">
              <p className="text-sm text-green-800 dark:text-green-300">
                <span className="font-semibold">{client?.full_name}</span> says they're now ok with "{row.label}"
              </p>
              <button
                onClick={() => acknowledgeResolvedStruggle(row.id)}
                className="text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 whitespace-nowrap flex-shrink-0"
              >
                Got it
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current week summary */}
      {current && (
        <div className="card space-y-4 border-brand-200 dark:border-brand-800">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">This week — Week {currentPersonalWeek}</p>
                {isLateSubmission(current) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">Late re-submit</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(current.updated_at || current.submitted_at)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {wDeltaPrev !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaPrev < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaPrev > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaPrev > 0 ? '↑ +' : wDeltaPrev < 0 ? '↓ ' : ''}{wDeltaPrev} kg {wDeltaPrevLabel}
                </span>
              )}
              {wDeltaStart !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaStart < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaStart > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaStart > 0 ? '↑ +' : wDeltaStart < 0 ? '↓ ' : ''}{wDeltaStart} kg {wDeltaStartLabel}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {current.weight_kg != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{current.weight_kg} <span className="text-sm font-normal text-gray-500">kg</span></p>
              </div>
            )}
            {current.energy_level != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Energy</p>
                <p className={`text-lg font-bold ${ratingColor(current.energy_level)}`}>{current.energy_level}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
            {current.sleep_quality != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sleep</p>
                <p className={`text-lg font-bold ${ratingColor(current.sleep_quality)}`}>{current.sleep_quality}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
            {current.food_adherence != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Food adherence</p>
                <p className={`text-lg font-bold ${ratingColor(current.food_adherence)}`}>{current.food_adherence}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
            {current.gym_adherence != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gym adherence</p>
                <p className={`text-lg font-bold ${ratingColor(current.gym_adherence)}`}>{current.gym_adherence}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
          </div>

          {/* Current week lifts vs prev and vs start */}
          {current.lift_results?.filter(l => l?.name).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Lifts</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {current.lift_results.filter(l => l?.name).map((lift, i) => {
                  const dPrev = liftDelta(lift, prev)
                  const dStart = first && first.id !== current.id ? liftDelta(lift, first) : null
                  return (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lift.name}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right space-y-0.5">
                        {dPrev !== null && (dPrev.kg !== 0 || dPrev.reps !== 0) && (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-gray-400 whitespace-nowrap">vs last wk</span>
                            {dPrev.kg !== 0 && <DeltaTag delta={dPrev.kg} />}
                            {dPrev.reps !== 0 && <DeltaTag delta={dPrev.reps} suffix=" reps" />}
                          </div>
                        )}
                        {dStart !== null && (dStart.kg !== 0 || dStart.reps !== 0) && (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs text-gray-400 whitespace-nowrap">vs start</span>
                            {dStart.kg !== 0 && <DeltaTag delta={dStart.kg} />}
                            {dStart.reps !== 0 && <DeltaTag delta={dStart.reps} suffix=" reps" />}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Photos — current week + first week below for comparison. Click any thumbnail to
              swipe through all 4 angles of that same week full-screen. */}
          <div className="space-y-3">
            {[
              { label: `Now — Week ${personalWeekMap[current.id]}`, photos: photoUrlsByCheckin[current.id] },
              first && first.id !== current.id ? { label: `Start — Week ${personalWeekMap[first.id]}`, photos: photoUrlsByCheckin[first.id] } : null,
            ].filter(Boolean).map(row => (
              <div key={row.label}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{row.label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PHOTO_ANGLES.map(angle => {
                    const url = row.photos?.[angle]
                    return (
                      <div key={angle} className="space-y-1">
                        {url ? (
                          <button onClick={() => setLightbox({ photos: row.photos, angle })} className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block">
                            <img src={url} alt={angle} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-full aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1">
                            <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-gray-300 dark:text-gray-600">No photo</span>
                          </div>
                        )}
                        <p className="text-xs text-center text-gray-400 capitalize">{angle}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {first && first.id !== current.id && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowPhotoComparison(true)}
                className="text-xs font-medium text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 flex items-center gap-1"
              >
                See comparison
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {openStruggleRows.filter(row => row.first_checkin_id !== current.id).length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 space-y-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Ongoing issues</p>
              {openStruggleRows.filter(row => row.first_checkin_id !== current.id).map(row => {
                const history = struggleHistory(row.label)
                const firstWeekCheckin = asc.find(c => c.id === row.first_checkin_id)
                const sinceWeek = firstWeekCheckin ? personalWeekMap[firstWeekCheckin.id] : null
                return (
                  <div key={row.id} className="bg-white dark:bg-gray-900 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</p>
                      {sinceWeek && <span className="text-xs text-gray-400 whitespace-nowrap">Since Wk {sinceWeek}</span>}
                    </div>
                    {history.length > 0 ? (
                      <div className="space-y-0.5">
                        {history.map((h, i) => (
                          <p key={i} className="text-xs text-gray-600 dark:text-gray-300"><span className="font-medium text-gray-400">Wk {h.week}:</span> {h.comment}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No update yet</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {((current.struggles || []).length > 0 || current.struggles_other) && (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Struggling with (this week)</p>
              {(current.struggles || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {current.struggles.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{s}</span>
                  ))}
                </div>
              )}
              {current.struggles_other && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{current.struggles_other}</p>
              )}
              <p className="text-xs text-amber-600 dark:text-amber-500">Add your advice for each of these when you submit this week's plan.</p>
            </div>
          )}

          {current.notes && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Client note</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{current.notes}"</p>
            </div>
          )}

          {/* Quick calorie-target adjustment, without opening the full weekly plan */}
          {activeAssignment && (
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 space-y-2">
              {editingCalorie ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" onFocus={e => e.target.select()} min="0" step="25" autoFocus
                      className="input py-1.5 w-28 text-sm"
                      value={calorieDraft}
                      onChange={e => setCalorieDraft(e.target.value)}
                      placeholder="e.g. 1800"
                    />
                    <span className="text-xs text-gray-400">kcal/day</span>
                    <button onClick={saveCalorieTarget} disabled={savingCalorie} className="btn-primary py-1.5 px-3 text-xs">{savingCalorie ? 'Saving…' : 'Save'}</button>
                    <button onClick={() => setEditingCalorie(false)} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
                  </div>
                  <CalorieSuggestionPanel client={client} currentTarget={activeAssignment.calorie_target} onApply={v => setCalorieDraft(String(v))} compact />
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activeAssignment.calorie_target ? `${activeAssignment.calorie_target} kcal / day` : 'No calorie target set'}
                  </p>
                  <button onClick={() => { setCalorieDraft(activeAssignment.calorie_target || ''); setEditingCalorie(true) }} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
                    Edit calorie target
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit week plan / respond to current week */}
          {current.coach_response && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">Your response</p>
                {delivered && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5 font-medium">Week {deliveryPersonalWeek} plan delivered</span>}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{current.coach_response}</p>
            </div>
          )}
          <button
            onClick={() => setShowDeliveryPanel(true)}
            className="btn-primary py-2 px-4 text-sm"
          >
            {current.coach_responded_at
              ? 'Edit check-in →'
              : `Submit Week ${deliveryPersonalWeek} Plan →`}
          </button>
        </div>
      )}

      {/* "See comparison" opens straight into a full-screen start-vs-now viewer — the same pose
          side by side, swiped through each angle — rather than a small inline row of thumbnails.
          If neither week has photos yet it says so in the same full-screen spot instead of the
          button just disappearing with no explanation. */}
      {showPhotoComparison && (
        showComparison ? (
          <ComparisonLightbox
            angles={compAngles}
            getCols={angle => [
              { label: `Start · Wk ${personalWeekMap[firstP.id]}`, url: photoUrlsByCheckin[firstP.id]?.[angle] },
              prevP && prevP.id !== firstP.id && prevP.id !== newestP.id && prevP.progress_photos?.[angle]
                ? { label: `Last week · Wk ${personalWeekMap[prevP.id]}`, url: photoUrlsByCheckin[prevP.id]?.[angle] }
                : null,
              { label: `Now · Wk ${personalWeekMap[newestP.id]}`, url: photoUrlsByCheckin[newestP.id]?.[angle] },
            ].filter(Boolean)}
            onClose={() => setShowPhotoComparison(false)}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowPhotoComparison(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-xs text-center space-y-3" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-gray-500 dark:text-gray-400">No photos yet to compare — this client hasn't submitted progress photos on more than one check-in.</p>
              <button onClick={() => setShowPhotoComparison(false)} className="btn-secondary py-1.5 px-4 text-sm">Close</button>
            </div>
          </div>
        )
      )}

      {/* Add a past weight or lift entry — for backfilling history while reviewing a check-in */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add previous weight or lift</h3>
          <button onClick={() => setShowAddEntry(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">{showAddEntry ? 'Cancel' : 'Add Entry'}</button>
        </div>
        {showAddEntry && (
          <form onSubmit={submitAddEntry} className="space-y-3">
            <div className="flex gap-2">
              {['weight', 'lift'].map(t => (
                <button key={t} type="button" onClick={() => setAddEntryType(t)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${addEntryType === t ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
                  {t === 'weight' ? 'Weight' : 'Lift'}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[140px]"><label className="label">Date</label><input className="input" type="date" required value={addEntryForm.date} onChange={e => setAddEntryForm(f => ({ ...f, date: e.target.value }))} /></div>
              {addEntryType === 'lift' && (
                <div className="flex-1 min-w-[140px]"><label className="label">Lift</label><input className="input" required value={addEntryForm.lift_name} onChange={e => setAddEntryForm(f => ({ ...f, lift_name: e.target.value }))} placeholder="e.g. Back Squat" /></div>
              )}
              <div className="w-28"><label className="label">Weight (kg)</label><input className="input" type="number" onFocus={e => e.target.select()} step={addEntryType === 'weight' ? '0.1' : '0.5'} min="0" required value={addEntryForm.weight_kg} onChange={e => setAddEntryForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder={addEntryType === 'weight' ? 'e.g. 72.5' : 'e.g. 80'} /></div>
              {addEntryType === 'lift' && (
                <div className="w-24"><label className="label">Reps</label><input className="input" type="number" onFocus={e => e.target.select()} step="1" min="1" required value={addEntryForm.reps} onChange={e => setAddEntryForm(f => ({ ...f, reps: e.target.value }))} placeholder="e.g. 5" /></div>
              )}
              <button type="submit" disabled={addEntrySaving} className="btn-primary whitespace-nowrap">{addEntrySaving ? 'Saving…' : 'Add'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Progress history table — check-ins merged with manual weight logs */}
      {(sorted.length > 0 || weightEntries.length > 0) && (() => {
        // Build a unified timeline: check-ins + standalone weight_entries (no check-in that date)
        const checkinDates = new Set(asc.map(c => (c.updated_at || c.submitted_at || '').split('T')[0]))
        const standaloneEntries = weightEntries
          .filter(e => e.recorded_at && !checkinDates.has(e.recorded_at))
          .map(e => ({ _type: 'log', id: e.id, recorded_at: e.recorded_at, weight_kg: e.weight_kg }))
        const checkinRows = asc.map(c => ({ _type: 'checkin', ...c }))
        const timeline = [...checkinRows, ...standaloneEntries]
          .sort((a, b) => {
            const da = a._type === 'checkin' ? (a.updated_at || a.submitted_at || '') : a.recorded_at
            const db = b._type === 'checkin' ? (b.updated_at || b.submitted_at || '') : b.recorded_at
            return da.localeCompare(db)
          })

        if (timeline.length === 0) return null
        return (
          <div className="card overflow-hidden">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progress History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Week', 'Date', 'Weight', 'Change', 'Energy', 'Sleep', 'Food', 'Gym', ''].map(h => (
                      <th key={h} className="text-left pb-2.5 pr-4 text-xs text-gray-400 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {timeline.map((row, i) => {
                    const prevRow = timeline[i - 1] || null
                    const prevWeight = prevRow ? prevRow.weight_kg : null
                    const delta = row.weight_kg != null && prevWeight != null
                      ? parseFloat((parseFloat(row.weight_kg) - parseFloat(prevWeight)).toFixed(1))
                      : null
                    const isLog = row._type === 'log'
                    const date = isLog ? row.recorded_at : (row.updated_at || row.submitted_at || '')
                    return (
                      <tr key={isLog ? `log-${row.id}` : row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 ${isLog ? 'opacity-70' : ''}`}>
                        <td className="py-2.5 pr-4 whitespace-nowrap">
                          {isLog
                            ? <span className="text-xs text-gray-400 italic">Weight log</span>
                            : <span className="font-semibold text-gray-900 dark:text-white">Wk {personalWeekMap[row.id]}</span>
                          }
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(date)}</td>
                        <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white tabular-nums">{row.weight_kg != null ? `${row.weight_kg} kg` : '—'}</td>
                        <td className="py-2.5 pr-4 tabular-nums">
                          {delta !== null
                            ? <span className={`font-semibold text-xs ${delta < 0 ? 'text-green-600 dark:text-green-400' : delta > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>{delta > 0 ? '+' : ''}{delta} kg</span>
                            : <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                        {isLog ? (
                          <><td className="py-2.5 pr-4 text-gray-300 dark:text-gray-700">—</td><td className="py-2.5 pr-4 text-gray-300 dark:text-gray-700">—</td><td className="py-2.5 pr-4 text-gray-300 dark:text-gray-700">—</td><td className="py-2.5 pr-4 text-gray-300 dark:text-gray-700">—</td></>
                        ) : (
                          <>
                            <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(row.energy_level)}`}>{row.energy_level != null ? `${row.energy_level}/5` : '—'}</span></td>
                            <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(row.sleep_quality)}`}>{row.sleep_quality != null ? `${row.sleep_quality}/5` : '—'}</span></td>
                            <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(row.food_adherence)}`}>{row.food_adherence != null ? `${row.food_adherence}/5` : '—'}</span></td>
                            <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(row.gym_adherence)}`}>{row.gym_adherence != null ? `${row.gym_adherence}/5` : '—'}</span></td>
                          </>
                        )}
                        <td className="py-2.5">
                          {isLog && <button onClick={() => deleteWeightEntry(row.id)} className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap">Remove</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* Previous week cards */}
      {sorted.slice(1).map((c, i) => {
        const p = sorted[i + 2] || null
        const wDelta = weightDelta(c, p)
        return (
          <div key={c.id} className="card space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Week {personalWeekMap[c.id]}</h3>
                  {isLateSubmission(c) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">Late</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{fmtDate(c.updated_at || c.submitted_at)}</p>
              </div>
              {wDelta !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDelta < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDelta > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDelta > 0 ? '↑ +' : wDelta < 0 ? '↓ ' : ''}{wDelta} kg
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {c.weight_kg != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Weight</p><p className="font-semibold text-gray-900 dark:text-white text-sm">{c.weight_kg} kg</p></div>}
              {c.energy_level != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Energy</p><p className={`font-semibold text-sm ${ratingColor(c.energy_level)}`}>{c.energy_level}/5</p></div>}
              {c.sleep_quality != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Sleep</p><p className={`font-semibold text-sm ${ratingColor(c.sleep_quality)}`}>{c.sleep_quality}/5</p></div>}
              {c.food_adherence != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Food adherence</p><p className={`font-semibold text-sm ${ratingColor(c.food_adherence)}`}>{c.food_adherence}/5</p></div>}
              {c.gym_adherence != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Gym adherence</p><p className={`font-semibold text-sm ${ratingColor(c.gym_adherence)}`}>{c.gym_adherence}/5</p></div>}
            </div>

            {c.lift_results?.filter(l => l?.name).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {c.lift_results.filter(l => l?.name).map((lift, li) => {
                  const d = liftDelta(lift, p)
                  return (
                    <div key={li} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 truncate">{lift.name}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span></p>
                      </div>
                      {d !== null && (d.kg !== 0 || d.reps !== 0) && (
                        <div className="flex gap-1 flex-wrap justify-end flex-shrink-0">
                          {d.kg !== 0 && <DeltaTag delta={d.kg} />}
                          {d.reps !== 0 && <DeltaTag delta={d.reps} suffix=" reps" />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {c.progress_photos && Object.values(c.progress_photos).some(Boolean) && (
              <div className="flex gap-2">
                {PHOTO_ANGLES.filter(a => c.progress_photos[a]).map(angle => {
                  const url = photoUrlsByCheckin[c.id]?.[angle]
                  return (
                    <button key={angle} onClick={() => url && setLightbox({ photos: photoUrlsByCheckin[c.id], angle })} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 hover:opacity-90">
                      {url && <img src={url} alt={angle} className="w-full h-full object-cover" />}
                    </button>
                  )
                })}
              </div>
            )}

            {((c.struggles || []).length > 0 || c.struggles_other) && (
              <div className="space-y-1.5">
                {(c.struggles || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.struggles.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{s}</span>
                    ))}
                  </div>
                )}
                {c.struggles_other && <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{c.struggles_other}"</p>}
                {c.struggle_comments && Object.entries(c.struggle_comments).filter(([, v]) => v).map(([label, comment]) => (
                  <p key={label} className="text-xs text-gray-500 dark:text-gray-400"><span className="font-medium">{label}:</span> {comment}</p>
                ))}
                {c.coach_struggle_comments && Object.entries(c.coach_struggle_comments).filter(([, v]) => v).map(([label, comment]) => (
                  <p key={`coach-${label}`} className="text-xs text-brand-600 dark:text-brand-400"><span className="font-medium">You, on {label}:</span> {comment}</p>
                ))}
              </div>
            )}

            {c.notes && <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{c.notes}"</p>}

            {c.coach_response && responding !== c.id && (
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Your response</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{c.coach_response}</p>
              </div>
            )}
            {responding === c.id ? (
              <div className="space-y-2">
                <QuickReplies onPick={text => setResponseText(v => appendQuickReply(v, text))} />
                <textarea autoFocus className="input w-full text-sm resize-none min-h-[80px]" rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response…" />
                <div className="flex gap-2">
                  <button onClick={() => sendResponse(c.id)} disabled={saving || !responseText.trim()} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Sending…' : 'Send'}</button>
                  <button onClick={() => setResponding(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => openRespond(c)} className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
                {c.coach_responded_at ? 'Edit response' : 'Respond →'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CoachCheckins() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [pendingPauses, setPendingPauses] = useState([])
  // Clients responded to just now, this session — shown with a green confirmation badge and
  // pushed to the bottom of the list, so responding doesn't just make them silently vanish
  // (and reflow the whole list) the moment the coach backs out to it.
  const [justRespondedIds, setJustRespondedIds] = useState(new Set())

  async function load() {
    const [{ data: clientData }, { data: checkinData }] = await Promise.all([
      supabase.from('clients').select('id, collect_measurements, height_cm, date_of_birth, sex, activity_level, goal_type, start_date, profiles!clients_profile_id_fkey(full_name)').eq('coach_id', profile.id).eq('is_archived', false),
      supabase.from('client_checkins').select('*').eq('coach_id', profile.id).order('week_number', { ascending: false }),
    ])
    const mapped = (clientData || []).map(c => ({ ...c, full_name: c.profiles?.full_name }))
    setClients(mapped)
    setCheckins(checkinData || [])

    if (mapped.length > 0) {
      const clientMap = {}
      mapped.forEach(c => { clientMap[c.id] = c.full_name || 'Unknown' })
      const { data: pauseData } = await supabase
        .from('plan_pauses')
        .select('id, client_id, return_date, first_checkin_date, weeks_paused, pause_start_date')
        .in('client_id', mapped.map(c => c.id))
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      setPendingPauses((pauseData || []).map(p => ({ ...p, client_name: clientMap[p.client_id] })))
    }
    setLoading(false)
  }

  async function actOnPause(id, status) {
    await supabase.from('plan_pauses').update({ status }).eq('id', id)
    setPendingPauses(prev => prev.filter(p => p.id !== id))
  }

  useEffect(() => { load() }, [])

  function handleResponded(id, text, clientId) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, coach_response: text } : c))
    if (clientId) setJustRespondedIds(prev => new Set(prev).add(clientId))
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // If a client is selected, show detail view
  if (selectedClientId) {
    const client = clients.find(c => c.id === selectedClientId)
    const clientCheckins = checkins.filter(c => c.client_id === selectedClientId)
    return (
      <ClientDetail
        client={client}
        checkins={clientCheckins}
        onBack={() => setSelectedClientId(null)}
        onResponded={handleResponded}
      />
    )
  }

  // Latest check-in per client
  const latestByClient = {}
  checkins.forEach(c => { if (!latestByClient[c.client_id]) latestByClient[c.client_id] = c })

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

  function clientStatus(client) {
    const latest = latestByClient[client.id]
    if (!latest) return 'missing'
    if (new Date(latest.updated_at || latest.submitted_at || 0) < eightDaysAgo) return 'missing'
    // coach_responded_at is set on every submit, even if the coach left the message box empty
    // (e.g. they only adjusted the meal plan/calories) — coach_response itself being blank isn't
    // the same as "hasn't been dealt with yet", so status tracks the former, not the latter.
    if (!latest.coach_responded_at) return 'needs-response'
    return 'ok'
  }

  const needsResponse = clients.filter(c => clientStatus(c) === 'needs-response')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const missing = clients.filter(c => clientStatus(c) === 'missing')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const upToDate = clients.filter(c => clientStatus(c) === 'ok')
    .sort((a, b) => {
      const aJust = justRespondedIds.has(a.id), bJust = justRespondedIds.has(b.id)
      if (aJust !== bJust) return aJust ? 1 : -1
      return (a.full_name || '').localeCompare(b.full_name || '')
    })

  function ClientRow({ client }) {
    const latest = latestByClient[client.id]
    const status = clientStatus(client)
    return (
      <button
        onClick={() => setSelectedClientId(client.id)}
        className="w-full flex items-center gap-4 py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left rounded-xl group"
      >
        <Avatar name={client.full_name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {client.full_name || 'Unnamed client'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {latest ? `Last check-in: ${fmtDate(latest.updated_at || latest.submitted_at)}` : 'No check-ins yet'}
          </p>
        </div>
        {pendingPauses.some(p => p.client_id === client.id) && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            🌴 Pause
          </span>
        )}
        {status === 'ok' && justRespondedIds.has(client.id) && (
          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            ✓ Check-in submitted
          </span>
        )}
        {status === 'needs-response' && (
          <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            Respond
          </span>
        )}
        {status === 'missing' && (
          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            Overdue
          </span>
        )}
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-ins</h1>
        <div className="flex gap-4 mt-1.5 flex-wrap">
          {pendingPauses.length > 0 && <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{pendingPauses.length} pause request{pendingPauses.length !== 1 ? 's' : ''}</span>}
          {needsResponse.length > 0 && <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">{needsResponse.length} to respond to</span>}
          {missing.length > 0 && <span className="text-sm text-red-500 dark:text-red-400 font-medium">{missing.length} overdue</span>}
        </div>
      </div>

      {pendingPauses.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌴</span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pause Requests</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pendingPauses.map(p => (
              <div key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{p.client_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.pause_start_date && `Starts ${fmtDate(p.pause_start_date)} · `}
                    Returning {fmtDate(p.return_date)} ·{' '}
                    {p.weeks_paused > 0
                      ? `${p.weeks_paused} week${p.weeks_paused !== 1 ? 's' : ''} · first check-in ${fmtDate(p.first_checkin_date)}`
                      : 'Short break'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => actOnPause(p.id, 'approved')} className="btn-primary py-1.5 px-3 text-xs">Approve</button>
                  <button onClick={() => actOnPause(p.id, 'rejected')} className="btn-secondary py-1.5 px-3 text-xs">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">No clients yet.</p>
        </div>
      )}

      {(needsResponse.length > 0 || missing.length > 0) && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {needsResponse.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide px-4 pt-3.5 pb-2">Needs response</p>
              {needsResponse.map(c => <ClientRow key={c.id} client={c} />)}
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide px-4 pt-3.5 pb-2">Overdue</p>
              {missing.map(c => <ClientRow key={c.id} client={c} />)}
            </div>
          )}
        </div>
      )}

      {upToDate.length > 0 && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3.5 pb-2">All clients</p>
          {upToDate.map(c => <ClientRow key={c.id} client={c} />)}
        </div>
      )}

      {needsResponse.length === 0 && missing.length === 0 && upToDate.length > 0 && null}
    </div>
  )
}
