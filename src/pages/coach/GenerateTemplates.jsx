import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

// ── Classification ─────────────────────────────────────────────────────────────

function classifyMeal(meal) {
  const n = meal.name.toLowerCase()

  if (meal.category === 'breakfast') {
    const sweetKw = ['oat', 'porridge', 'waffle', 'pancake', 'chia', 'granola', 'smoothie',
      'yoghurt', 'yogurt', 'chocolate', 'french toast', 'acai', 'açaí', 'berry', 'berries', 'fruit',
      'honey', 'biscoff', 'muffin', 'banana', 'maple', 'jam', 'peanut butter', 'pb &', 'nutella', 'crepe',
      'rice cake', 'sweet', 'cinnamon']
    const savKw = ['egg', 'avocado', 'bacon', 'mushroom', 'cheese', 'smoked', 'tomato', 'beans',
      'scramble', 'omelette', 'omelet', 'hash', 'sausage', 'frittata', 'sourdough', 'toast with']
    const ss = sweetKw.filter(k => n.includes(k)).length
    const sv = savKw.filter(k => n.includes(k)).length
    return ss >= sv ? 'sweet' : 'savoury'
  }

  if (meal.category === 'lunch') {
    if (n.includes('wrap')) return 'wrap'
    if (['pasta', 'penne', 'spaghetti', 'linguine', 'fusilli', 'tagliatelle', 'rigatoni'].some(k => n.includes(k))) return 'pasta'
    if (n.includes('rice') || n.includes('bowl')) return 'rice/bowl'
    if (n.includes('salad')) return 'salad'
    if (['sandwich', 'bagel', 'sub', 'baguette'].some(k => n.includes(k))) return 'sandwich'
    return 'other'
  }

  if (meal.category === 'dinner') {
    if (['chicken', 'turkey'].some(k => n.includes(k))) return 'chicken'
    if (['beef', 'steak', 'mince', 'meatball', 'bolognese', 'burger', 'brisket', 'chilli con carne'].some(k => n.includes(k))) return 'beef'
    if (['salmon', 'tuna', 'fish', 'prawn', 'shrimp', 'cod', 'sea bass', 'haddock', 'mackerel'].some(k => n.includes(k))) return 'fish'
    if (['pork', 'lamb'].some(k => n.includes(k))) return 'pork/lamb'
    if (['tofu', 'lentil', 'chickpea', 'halloumi', 'veggie', 'vegetarian'].some(k => n.includes(k))) return 'veggie'
    return 'other'
  }

  return null
}

// Carb side is independent of the protein-based subtype above — a chicken dinner can be
// served with rice, potato, pasta, etc.
function classifyCarb(meal) {
  if (meal.category !== 'dinner') return null
  const n = meal.name.toLowerCase()
  if (['rice', 'risotto', 'pilaf'].some(k => n.includes(k))) return 'rice'
  if (['potato', 'mash', 'fries', 'wedges', 'sweet potato'].some(k => n.includes(k))) return 'potato'
  if (['pasta', 'penne', 'spaghetti', 'linguine', 'fusilli', 'tagliatelle', 'rigatoni', 'lasagne', 'mac and cheese', 'macaroni'].some(k => n.includes(k))) return 'pasta'
  if (['noodle', 'udon', 'soba', 'pad thai'].some(k => n.includes(k))) return 'noodle'
  if (['bread', 'naan', 'pitta', 'pita', 'bun', 'bap', 'tortilla', 'wrap'].some(k => n.includes(k))) return 'bread'
  return 'other'
}

// Cross-category "theme" words — e.g. a burger lunch and a burger dinner feel repetitive even
// though they're different categories, so we keep these out of the same day-option pairing.
const THEME_KEYWORDS = ['burger', 'bbq', 'barbecue', 'pizza', 'curry', 'burrito', 'taco', 'fajita',
  'stir fry', 'stir-fry', 'kebab', 'chilli', 'chili', 'noodle', 'sushi', 'falafel']

function sharedTheme(mealA, mealB) {
  if (!mealA || !mealB) return false
  const a = mealA.name.toLowerCase()
  const b = mealB.name.toLowerCase()
  return THEME_KEYWORDS.some(k => a.includes(k) && b.includes(k))
}

// Meal Prep is independent of sweet/savoury — a batch-cooked breakfast can be either.
function detectMealPrep(meal) {
  if (meal.category !== 'breakfast') return false
  const n = meal.name.toLowerCase()
  const kw = ['overnight', 'meal prep', 'mason jar', 'jar', 'batch', 'make-ahead', 'make ahead',
    'freezer', 'egg muffin', 'egg bite', 'egg cup', 'baked oat', 'breakfast bar', 'energy bite',
    'slice', 'pre-made', 'premade']
  return kw.some(k => n.includes(k))
}

const MEAL_PREP_COLOUR = 'bg-emerald-100 text-emerald-700'
const STANDARD_COLOUR = 'bg-gray-100 text-gray-600'

const SUBTYPE_COLOURS = {
  sweet: 'bg-yellow-100 text-yellow-700',
  savoury: 'bg-orange-100 text-orange-700',
  wrap: 'bg-green-100 text-green-700',
  pasta: 'bg-amber-100 text-amber-700',
  'rice/bowl': 'bg-blue-100 text-blue-700',
  salad: 'bg-teal-100 text-teal-700',
  sandwich: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-600',
  chicken: 'bg-yellow-100 text-yellow-800',
  beef: 'bg-red-100 text-red-700',
  fish: 'bg-cyan-100 text-cyan-700',
  'pork/lamb': 'bg-rose-100 text-rose-700',
  veggie: 'bg-green-100 text-green-700',
}

const CARB_COLOURS = {
  rice: 'bg-blue-100 text-blue-700',
  potato: 'bg-amber-100 text-amber-700',
  pasta: 'bg-orange-100 text-orange-700',
  noodle: 'bg-lime-100 text-lime-700',
  bread: 'bg-stone-100 text-stone-700',
  other: 'bg-gray-100 text-gray-600',
}

// ── Pool helper ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

class DeckPool {
  constructor(meals) { this.all = [...meals]; this.deck = shuffle([...meals]); this.i = 0 }
  empty() { return this.all.length === 0 }
  // Hands out the next item without wasting any candidate from this pass: scans the remaining
  // deck slice for the lowest-scoring item per `score` (lower is better, 0 = no conflicts) and
  // swaps it to the front instead of skipping past it. `excludeId` is a hard constraint (never
  // repeat that exact meal) unless it's the only meal in the whole pool.
  pick(excludeId, score) {
    if (this.empty()) return null
    if (excludeId && this.all.length === 1 && this.all[0].id === excludeId) return null
    if (this.i >= this.deck.length) { this.deck = shuffle([...this.all]); this.i = 0 }

    const scoreOf = m => (m.id === excludeId ? Infinity : (score ? score(m) : 0))
    let bestJ = this.i
    let bestScore = scoreOf(this.deck[this.i])
    for (let j = this.i + 1; j < this.deck.length; j++) {
      const s = scoreOf(this.deck[j])
      if (s < bestScore) { bestScore = s; bestJ = j; if (s === 0) break }
    }

    ;[this.deck[this.i], this.deck[bestJ]] = [this.deck[bestJ], this.deck[this.i]]
    return this.deck[this.i++]
  }
}

// ── Generation ─────────────────────────────────────────────────────────────────

const WEEK_COUNT = 50

// A cycler hands out every item in a pool once (in shuffled order) before any item repeats,
// guaranteeing full coverage as long as it's asked for at least `pool.length` items overall.
function buildCycler(pool) {
  let deck = shuffle(pool)
  let i = 0
  return {
    next() {
      if (pool.length === 0) return null
      if (i >= deck.length) { deck = shuffle(pool); i = 0 }
      return deck[i++]
    },
    // Same as next(), but — without skipping or wasting any item — swaps an item with a
    // different subtype to the front of the remaining deck if one is available this pass.
    nextPreferring(avoidSubtype) {
      if (pool.length === 0) return null
      if (i >= deck.length) { deck = shuffle(pool); i = 0 }
      if (avoidSubtype) {
        for (let j = i; j < deck.length; j++) {
          if (deck[j]._subtype !== avoidSubtype) {
            ;[deck[i], deck[j]] = [deck[j], deck[i]]
            break
          }
        }
      }
      return deck[i++]
    },
  }
}

// Breakfast scheduling has three rules: every week needs at least one meal-prep breakfast
// (when the coach has tagged any), every included breakfast must appear at least once across
// the 20 weeks, and — where it doesn't conflict with the above — pair a sweet with a savoury.
function scheduleBreakfasts(breakfasts) {
  const mp  = breakfasts.filter(m => m._mealPrep)
  const std = breakfasts.filter(m => !m._mealPrep)
  const totalSlots = WEEK_COUNT * 2

  if (mp.length === 0) {
    const cyclerA = buildCycler(std)
    const cyclerB = buildCycler(std)
    return Array.from({ length: WEEK_COUNT }, () => {
      const b1 = cyclerA.next()
      const b2 = cyclerB.nextPreferring(b1?._subtype)
      return { b1, b2 }
    })
  }

  // How many of the 40 total slots go to meal-prep meals: at least one per week, and at
  // least enough to use every meal-prep meal once (whichever is bigger), capped at the total.
  const desiredMp = std.length === 0 ? totalSlots : Math.max(WEEK_COUNT, mp.length)
  const mpSlots = Math.min(totalSlots, desiredMp)

  const mpCycler  = buildCycler(mp)
  const stdCycler = buildCycler(std)
  const extraMpWeeks = new Set(
    shuffle(Array.from({ length: WEEK_COUNT }, (_, i) => i)).slice(0, Math.max(0, mpSlots - WEEK_COUNT))
  )

  return Array.from({ length: WEEK_COUNT }, (_, i) => {
    if (extraMpWeeks.has(i)) {
      const b2 = mpCycler.next()
      const b1 = mpCycler.nextPreferring(b2?._subtype)
      return { b1, b2 }
    }
    const b2 = mpCycler.next()
    const b1 = std.length > 0 ? stdCycler.nextPreferring(b2?._subtype) : null
    return { b1, b2 }
  })
}

function generateWeeks(classifiedMeals, excluded) {
  const avail = classifiedMeals.filter(m => !excluded.has(m.id))

  const breakfastSchedule = scheduleBreakfasts(avail.filter(m => m.category === 'breakfast'))

  const lunchPoolA = new DeckPool(avail.filter(m => m.category === 'lunch'))
  const lunchPoolB = new DeckPool(avail.filter(m => m.category === 'lunch'))

  const dinnerPoolA = new DeckPool(avail.filter(m => m.category === 'dinner'))
  const dinnerPoolB = new DeckPool(avail.filter(m => m.category === 'dinner'))

  return Array.from({ length: WEEK_COUNT }, (_, i) => {
    const { b1, b2 } = breakfastSchedule[i]

    const l1 = lunchPoolA.pick()
    const l2 = lunchPoolB.pick(l1?.id, l1 ? (m => (m._subtype === l1._subtype ? 1 : 0)) : null)

    // Option 1 day = lunch1 + dinner1, Option 2 day = lunch2 + dinner2 — keep "themed" meals
    // (burger, BBQ, curry…) from landing on the same day option.
    const d1 = dinnerPoolA.pick(null, l1 ? (m => (sharedTheme(m, l1) ? 1 : 0)) : null)
    const d2 = dinnerPoolB.pick(d1?.id, (d1 || l2) ? (m => {
      let s = 0
      if (d1 && m._subtype === d1._subtype) s += 1
      if (d1 && m._carb && d1._carb && m._carb === d1._carb) s += 1
      if (l2 && sharedTheme(m, l2)) s += 1
      return s
    }) : null)

    return {
      weekNum: i + 1,
      breakfast1: b1 || null,
      breakfast2: b2 || null,
      lunch1: l1 || null,
      lunch2: l2 || null,
      dinner1: d1 || null,
      dinner2: d2 || null,
    }
  })
}

// ── Slot config ────────────────────────────────────────────────────────────────

const SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

const BREAKFAST_SUBTYPES = [
  { value: 'sweet', label: 'Sweet' },
  { value: 'savoury', label: 'Savoury' },
]
const LUNCH_SUBTYPES = [
  { value: 'wrap', label: 'Wrap' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'rice/bowl', label: 'Rice/Bowl' },
  { value: 'salad', label: 'Salad' },
  { value: 'sandwich', label: 'Sandwich' },
  { value: 'other', label: 'Other' },
]
const DINNER_SUBTYPES = [
  { value: 'chicken', label: 'Chicken' },
  { value: 'beef', label: 'Beef' },
  { value: 'fish', label: 'Fish' },
  { value: 'pork/lamb', label: 'Pork/Lamb' },
  { value: 'veggie', label: 'Veggie' },
  { value: 'other', label: 'Other' },
]
const CARB_TYPES = [
  { value: 'rice', label: 'Rice' },
  { value: 'potato', label: 'Potato' },
  { value: 'pasta', label: 'Pasta' },
  { value: 'noodle', label: 'Noodle' },
  { value: 'bread', label: 'Bread' },
  { value: 'other', label: 'Other' },
]

function subtypeOptions(cat) {
  if (cat === 'breakfast') return BREAKFAST_SUBTYPES
  if (cat === 'lunch') return LUNCH_SUBTYPES
  if (cat === 'dinner') return DINNER_SUBTYPES
  return []
}

// ── Setup sections ─────────────────────────────────────────────────────────────

const SETUP_SECTIONS = [
  { label: 'Breakfast', cat: 'breakfast', sub: null },
  { label: 'Lunch',     cat: 'lunch',     sub: null },
  { label: 'Dinner',    cat: 'dinner',    sub: null },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function GenerateTemplates() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('setup')
  const [meals, setMeals] = useState([])
  const [excluded, setExcluded] = useState(new Set())
  const [subtypeOverrides, setSubtypeOverrides] = useState({})
  const [mealPrepOverrides, setMealPrepOverrides] = useState({})
  const [carbOverrides, setCarbOverrides] = useState({})
  const [dirty, setDirty] = useState(new Set()) // meal IDs with unsaved changes
  const [weeks, setWeeks] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState('')
  const [planName, setPlanName] = useState('50 Week Plan')
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    supabase
      .from('meals')
      .select('id, name, category, template_subtype, meal_prep_friendly, template_carb, excluded_from_templates, meal_ingredients(calories)')
      .eq('coach_id', profile.id)
      .order('name')
      .then(({ data }) => {
        const classified = (data || []).map(m => ({
          ...m,
          _subtype: classifyMeal(m),
          _mealPrepAuto: detectMealPrep(m),
          _carbAuto: classifyCarb(m),
          _totalCals: Math.round((m.meal_ingredients || []).reduce((s, i) => s + (parseFloat(i.calories) || 0), 0)),
        }))
        setMeals(classified)
        setExcluded(new Set(classified.filter(m => m.excluded_from_templates).map(m => m.id)))
        const overrides = {}
        for (const m of classified) {
          if (m.template_subtype) overrides[m.id] = m.template_subtype
        }
        setSubtypeOverrides(overrides)
        const mpOverrides = {}
        for (const m of classified) {
          if (m.meal_prep_friendly !== null && m.meal_prep_friendly !== undefined) mpOverrides[m.id] = m.meal_prep_friendly
        }
        setMealPrepOverrides(mpOverrides)
        const carbOv = {}
        for (const m of classified) {
          if (m.template_carb) carbOv[m.id] = m.template_carb
        }
        setCarbOverrides(carbOv)

        // Restore any unsaved generated draft
        try {
          const draft = localStorage.getItem(`generated_weeks_${profile.id}`)
          if (draft) {
            const parsed = JSON.parse(draft)
            // Re-hydrate meal objects from the loaded meal list
            const mealMap = Object.fromEntries(classified.map(m => [m.id, m]))
            const hydrated = parsed.map(w => {
              const week = { weekNum: w.weekNum }
              for (const s of SLOTS) {
                week[s.key] = w[s.key] ? (mealMap[w[s.key].id] || null) : null
              }
              return week
            })
            setWeeks(hydrated)
            setPhase('review')
          }
        } catch {}

        setLoading(false)
      })
  }, [profile.id])

  function getSubtype(meal) {
    return subtypeOverrides[meal.id] ?? meal._subtype
  }

  function getMealPrep(meal) {
    return mealPrepOverrides[meal.id] ?? meal._mealPrepAuto
  }

  function getCarb(meal) {
    return carbOverrides[meal.id] ?? meal._carbAuto
  }

  function withOverrides() {
    return meals.map(m => ({ ...m, _subtype: getSubtype(m), _mealPrep: getMealPrep(m), _carb: getCarb(m) }))
  }

  function toggleExclude(id) {
    const nowExcluded = !excluded.has(id)
    setExcluded(prev => { const s = new Set(prev); nowExcluded ? s.add(id) : s.delete(id); return s })
    setDirty(prev => { const s = new Set(prev); s.add(id); return s })
    setPrefsSaved(false)
  }

  async function handleSavePrefs() {
    if (dirty.size === 0) return
    setPrefsSaving(true)
    setPrefsError('')

    const dirtyMeals = meals.filter(m => dirty.has(m.id))
    const results = await Promise.all(
      dirtyMeals.map(m =>
        supabase.from('meals').update({
          excluded_from_templates: excluded.has(m.id),
          template_subtype: subtypeOverrides[m.id] ?? null,
          meal_prep_friendly: mealPrepOverrides[m.id] ?? null,
          template_carb: carbOverrides[m.id] ?? null,
        }).eq('id', m.id)
      )
    )

    const err = results.find(r => r.error)
    if (err) {
      setPrefsError(err.error.message)
    } else {
      setDirty(new Set())
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    }
    setPrefsSaving(false)
  }

  function saveDraft(generatedWeeks) {
    try {
      // Store only meal IDs to keep it lightweight
      const slim = generatedWeeks.map(w => {
        const week = { weekNum: w.weekNum }
        for (const s of SLOTS) { week[s.key] = w[s.key] ? { id: w[s.key].id } : null }
        return week
      })
      localStorage.setItem(`generated_weeks_${profile.id}`, JSON.stringify(slim))
    } catch {}
  }

  function clearDraft() {
    try { localStorage.removeItem(`generated_weeks_${profile.id}`) } catch {}
  }

  function handleGenerate() {
    const generated = generateWeeks(withOverrides(), excluded)
    setWeeks(generated)
    saveDraft(generated)
    setExpanded(new Set())
    setPhase('review')
    window.scrollTo(0, 0)
  }

  function changeSlot(weekIdx, slotKey, mealId) {
    const meal = meals.find(m => m.id === mealId) || null
    setWeeks(prev => {
      const updated = prev.map((w, i) => i === weekIdx ? { ...w, [slotKey]: meal } : w)
      saveDraft(updated)
      return updated
    })
  }

  function toggleExpand(weekNum) {
    setExpanded(prev => { const s = new Set(prev); s.has(weekNum) ? s.delete(weekNum) : s.add(weekNum); return s })
  }

  async function handleSaveAll() {
    setSaving(true)
    setSaveError('')

    setSaveProgress('Creating plan…')
    const { data: planGroup, error: pgErr } = await supabase
      .from('plan_groups')
      .insert({ coach_id: profile.id, name: planName.trim() || '50 Week Plan', current_week: 1 })
      .select('id')
      .single()

    if (pgErr) { setSaveError(pgErr.message); setSaving(false); return }

    for (let i = 0; i < weeks.length; i++) {
      const w = weeks[i]
      setSaveProgress(`Saving week ${i + 1} of ${weeks.length}…`)

      const { data: tmpl, error: tmplErr } = await supabase
        .from('weekly_templates')
        .insert({
          coach_id: profile.id,
          name: `Week ${w.weekNum}`,
          week_number: w.weekNum,
          plan_group_id: planGroup.id,
          plan_group_name: planName.trim() || '50 Week Plan',
        })
        .select('id')
        .single()

      if (tmplErr) { setSaveError(tmplErr.message); setSaving(false); return }

      const slotRows = SLOTS
        .filter(s => w[s.key])
        .map(s => ({
          template_id: tmpl.id,
          slot_type: s.key,
          meal_id: w[s.key].id,
          scaled_version_id: null,
        }))

      if (slotRows.length > 0) {
        const { error: sErr } = await supabase.from('template_meal_slots').insert(slotRows)
        if (sErr) { setSaveError(sErr.message); setSaving(false); return }
      }
    }

    clearDraft()
    navigate('/coach/meal-templates')
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // ── SETUP PHASE ─────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="space-y-6 max-w-3xl">
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Generate 50 Weeks</h1>
        </div>

        <div className="card bg-pink-50/60 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meals are auto-classified below. Uncheck any you don't want included. Use the badges to
            correct any wrong classifications — for breakfast, Sweet/Savoury and Meal Prep are independent
            tags; for dinner, the protein type and the Carb badge (rice/potato/pasta/noodle/bread) are
            independent too. Every week is guaranteed at least one Meal Prep breakfast (when you've tagged
            any), and every included breakfast gets used at least once across the 20 weeks. Where it doesn't
            conflict with that, we'll also pair a sweet with a savoury, avoid pairing two dinners with the
            same carb in one week, and avoid putting a similarly-themed lunch and dinner (e.g. both "burger"
            or "BBQ") on the same day option.
          </p>
        </div>

        {SETUP_SECTIONS.map(section => {
          const sectionMeals = meals.filter(m => {
            const cats = [section.cat, ...(section.extra ? [section.extra] : [])]
            if (!cats.includes(m.category)) return false
            return section.sub ? getSubtype(m) === section.sub : true
          })
          if (sectionMeals.length === 0) return null

          const opts = subtypeOptions(section.cat)
          const includedCount = sectionMeals.filter(m => !excluded.has(m.id)).length

          return (
            <div key={section.label} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">{section.label}</h2>
                <span className="text-xs text-gray-400">{includedCount} / {sectionMeals.length} included</span>
              </div>
              <div className="space-y-1">
                {sectionMeals.map(m => {
                  const sub = getSubtype(m)
                  const isExcluded = excluded.has(m.id)
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors ${isExcluded ? 'opacity-40' : 'hover:bg-pink-50/50 dark:hover:bg-pink-900/5'}`}
                    >
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => toggleExclude(m.id)}
                        className="w-4 h-4 accent-pink-400 rounded flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{m.name}</span>
                      {opts.length > 0 && sub && (
                        <select
                          className={`text-xs py-0.5 px-2 rounded-full font-medium border-0 focus:ring-1 focus:ring-brand-300 cursor-pointer ${SUBTYPE_COLOURS[sub] || 'bg-gray-100 text-gray-600'}`}
                          value={sub}
                          onChange={e => {
                            setSubtypeOverrides(prev => ({ ...prev, [m.id]: e.target.value }))
                            setDirty(prev => { const s = new Set(prev); s.add(m.id); return s })
                            setPrefsSaved(false)
                          }}
                        >
                          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                      {section.cat === 'breakfast' && (
                        <select
                          className={`text-xs py-0.5 px-2 rounded-full font-medium border-0 focus:ring-1 focus:ring-brand-300 cursor-pointer ${getMealPrep(m) ? MEAL_PREP_COLOUR : STANDARD_COLOUR}`}
                          value={getMealPrep(m) ? 'meal_prep' : 'standard'}
                          onChange={e => {
                            setMealPrepOverrides(prev => ({ ...prev, [m.id]: e.target.value === 'meal_prep' }))
                            setDirty(prev => { const s = new Set(prev); s.add(m.id); return s })
                            setPrefsSaved(false)
                          }}
                        >
                          <option value="standard">Standard</option>
                          <option value="meal_prep">Meal Prep</option>
                        </select>
                      )}
                      {section.cat === 'dinner' && (
                        <select
                          className={`text-xs py-0.5 px-2 rounded-full font-medium border-0 focus:ring-1 focus:ring-brand-300 cursor-pointer ${CARB_COLOURS[getCarb(m)] || CARB_COLOURS.other}`}
                          value={getCarb(m) || 'other'}
                          onChange={e => {
                            setCarbOverrides(prev => ({ ...prev, [m.id]: e.target.value }))
                            setDirty(prev => { const s = new Set(prev); s.add(m.id); return s })
                            setPrefsSaved(false)
                          }}
                        >
                          {CARB_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {meals.length - excluded.size} meals included · calorie targets are set per client when assigning
              {dirty.size > 0 && (
                <span className="ml-2 text-orange-500 font-medium">· {dirty.size} unsaved change{dirty.size !== 1 ? 's' : ''}</span>
              )}
            </p>
            <div className="flex items-center gap-3">
              {prefsSaved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
              <button
                onClick={handleSavePrefs}
                disabled={prefsSaving || dirty.size === 0}
                className="btn-secondary"
              >
                {prefsSaving ? 'Saving…' : dirty.size > 0 ? `Save ${dirty.size} Change${dirty.size !== 1 ? 's' : ''}` : 'Saved'}
              </button>
              <button onClick={handleGenerate} className="btn-primary">
                Generate {WEEK_COUNT} Weeks →
              </button>
            </div>
          </div>
          {prefsError && <p className="text-sm text-red-600 dark:text-red-400">{prefsError}</p>}
        </div>
      </div>
    )
  }

  // ── REVIEW PHASE ────────────────────────────────────────────────────────────

  const mealsByCategory = meals.reduce((acc, m) => {
    if (!excluded.has(m.id)) {
      ;(acc[m.category] = acc[m.category] || []).push(m)
    }
    return acc
  }, {})

  function mealOptionsForSlot(slot) {
    if (Array.isArray(slot.cat)) return slot.cat.flatMap(c => mealsByCategory[c] || [])
    return mealsByCategory[slot.cat] || []
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('setup')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Setup
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review 50 Weeks</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { clearDraft(); setPhase('setup'); setWeeks([]) }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Discard
          </button>
          <button onClick={handleGenerate} className="btn-secondary text-sm">
            Regenerate
          </button>
          <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
            {saving ? saveProgress : 'Save All 50 Weeks'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
        </div>
      )}

      <div className="card flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Plan name</label>
        <input
          className="input flex-1"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          placeholder="e.g. 50 Week Plan"
          maxLength={80}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Used when assigning to clients</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Click any week to expand it. Swap meals using the dropdowns. Every client on this plan gets the same meals — calorie targets are set per client when you assign the plan.
        </p>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <button
            onClick={() => setExpanded(new Set(weeks.map(w => w.weekNum)))}
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Expand all
          </button>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <button
            onClick={() => setExpanded(new Set())}
            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {weeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const calA = (week.breakfast1?._totalCals || 0) + (week.lunch1?._totalCals || 0) + (week.dinner1?._totalCals || 0)
        const calB = (week.breakfast2?._totalCals || 0) + (week.lunch2?._totalCals || 0) + (week.dinner2?._totalCals || 0)

        const OPTION_GROUPS = [
          {
            label: 'Option A',
            slots: SLOTS.filter(s => s.key.endsWith('1')),
            total: calA,
          },
          {
            label: 'Option B',
            slots: SLOTS.filter(s => s.key.endsWith('2')),
            total: calB,
          },
        ]

        return (
          <div key={weekIdx} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
              onClick={() => toggleExpand(week.weekNum)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Week {week.weekNum}</span>
                {calA > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    A: ~{calA} kcal
                  </span>
                )}
                {calB > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    B: ~{calB} kcal
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div>
                {OPTION_GROUPS.map((group, gi) => (
                  <div key={group.label} className={gi > 0 ? 'border-t-2 border-pink-100 dark:border-pink-900/20' : ''}>
                    <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                      <span className="text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-wide">{group.label}</span>
                      {group.total > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">~{group.total} kcal</span>
                      )}
                    </div>
                    <div className="divide-y divide-pink-50 dark:divide-pink-900/10">
                      {group.slots.map(slot => {
                        const meal = week[slot.key]
                        const options = mealOptionsForSlot(slot)
                        return (
                          <div key={slot.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                            <span className="w-32 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              {slot.label.replace(/ [AB]$/, '')}
                            </span>
                            <select
                              className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                              value={meal?.id || ''}
                              onChange={e => changeSlot(weekIdx, slot.key, e.target.value)}
                            >
                              <option value="">— None —</option>
                              {options.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name}{m._totalCals ? ` (${m._totalCals} kcal)` : ''}
                                </option>
                              ))}
                            </select>
                            {meal?._totalCals > 0 && (
                              <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 w-16 text-right">
                                {meal._totalCals} kcal
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex justify-end pb-8">
        <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
          {saving ? saveProgress : 'Save All 50 Weeks'}
        </button>
      </div>
    </div>
  )
}
