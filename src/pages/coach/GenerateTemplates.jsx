import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

// ── Classification ─────────────────────────────────────────────────────────────

function classifyMeal(meal) {
  const n = meal.name.toLowerCase()

  if (meal.category === 'breakfast') {
    const sweetKw = ['oat', 'porridge', 'waffle', 'pancake', 'overnight', 'chia', 'granola', 'smoothie',
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
  pick(excludeId) {
    if (this.empty()) return null
    // try up to full deck length to find non-excluded
    for (let attempt = 0; attempt < this.all.length; attempt++) {
      if (this.i >= this.deck.length) { this.deck = shuffle([...this.all]); this.i = 0 }
      const m = this.deck[this.i++]
      if (!excludeId || m.id !== excludeId) return m
    }
    return this.deck[(this.i - 1 + this.deck.length) % this.deck.length] // fallback
  }
}

// ── Generation ─────────────────────────────────────────────────────────────────

const WEEK_COUNT = 20

function generateWeeks(classifiedMeals, excluded) {
  const avail = classifiedMeals.filter(m => !excluded.has(m.id))
  const by = (cat, sub) => avail.filter(m => m.category === cat && m._subtype === sub)

  const sweetPool   = new DeckPool(by('breakfast', 'sweet'))
  const savouryPool = new DeckPool(by('breakfast', 'savoury'))

  const lunchTypes = ['wrap', 'pasta', 'rice/bowl', 'salad', 'sandwich', 'other']
  const lunchPools = Object.fromEntries(lunchTypes.map(t => [t, new DeckPool(by('lunch', t))]))
  const activeLunchTypes = lunchTypes.filter(t => !lunchPools[t].empty())
  let lunchTypeIdx = 0

  const dinnerProteins = ['chicken', 'beef', 'fish', 'pork/lamb', 'veggie', 'other']
  const dinnerPools = Object.fromEntries(dinnerProteins.map(p => [p, new DeckPool(by('dinner', p))]))
  const activeDinnerProteins = dinnerProteins.filter(p => !dinnerPools[p].empty())
  let dinnerProteinIdx = 0

  function pickLunch(excludeType, excludeId) {
    if (!activeLunchTypes.length) return null
    for (let i = 0; i < activeLunchTypes.length; i++) {
      const type = activeLunchTypes[(lunchTypeIdx + i) % activeLunchTypes.length]
      if (type !== excludeType && !lunchPools[type].empty()) {
        const meal = lunchPools[type].pick(excludeId)
        if (meal) { lunchTypeIdx = (lunchTypeIdx + 1) % activeLunchTypes.length; return { meal, type } }
      }
    }
    const fallback = new DeckPool(avail.filter(m => m.category === 'lunch' && m.id !== excludeId))
    return { meal: fallback.pick(), type: 'other' }
  }

  function pickDinner(excludeProtein, excludeId) {
    if (!activeDinnerProteins.length) return null
    for (let i = 0; i < activeDinnerProteins.length; i++) {
      const protein = activeDinnerProteins[(dinnerProteinIdx + i) % activeDinnerProteins.length]
      if (protein !== excludeProtein && !dinnerPools[protein].empty()) {
        const meal = dinnerPools[protein].pick(excludeId)
        if (meal) { dinnerProteinIdx = (dinnerProteinIdx + 1) % activeDinnerProteins.length; return { meal, protein } }
      }
    }
    return null
  }

  return Array.from({ length: WEEK_COUNT }, (_, i) => {
    const d1 = pickDinner(null, null)
    const d2 = pickDinner(d1?.protein, d1?.meal?.id)
    const l1 = pickLunch(null, null)
    const l2 = pickLunch(l1?.type, l1?.meal?.id)
    return {
      weekNum: i + 1,
      breakfast1: sweetPool.pick(),
      breakfast2: savouryPool.pick(),
      lunch1: l1?.meal || null,
      lunch2: l2?.meal || null,
      dinner1: d1?.meal || null,
      dinner2: d2?.meal || null,
    }
  })
}

// ── Slot config ────────────────────────────────────────────────────────────────

const SLOTS = [
  { key: 'breakfast1', label: 'Breakfast (Sweet)', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast (Savoury)', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',            cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',             cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',            cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',            cat: 'dinner' },
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

function subtypeOptions(cat) {
  if (cat === 'breakfast') return BREAKFAST_SUBTYPES
  if (cat === 'lunch') return LUNCH_SUBTYPES
  if (cat === 'dinner') return DINNER_SUBTYPES
  return []
}

// ── Setup sections ─────────────────────────────────────────────────────────────

const SETUP_SECTIONS = [
  { label: 'Breakfast — Sweet',   cat: 'breakfast', sub: 'sweet'   },
  { label: 'Breakfast — Savoury', cat: 'breakfast', sub: 'savoury' },
  { label: 'Lunch',               cat: 'lunch',     sub: null      },
  { label: 'Dinner',              cat: 'dinner',    sub: null      },
]

// ── Main component ─────────────────────────────────────────────────────────────

export default function GenerateTemplates() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('setup')
  const [meals, setMeals] = useState([])
  const [excluded, setExcluded] = useState(new Set())
  const [subtypeOverrides, setSubtypeOverrides] = useState({})
  const [dirty, setDirty] = useState(new Set()) // meal IDs with unsaved changes
  const [weeks, setWeeks] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState('')
  const [planName, setPlanName] = useState('20 Week Plan')
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    supabase
      .from('meals')
      .select('id, name, category, template_subtype, excluded_from_templates, meal_ingredients(calories)')
      .eq('coach_id', profile.id)
      .order('name')
      .then(({ data }) => {
        const classified = (data || []).map(m => ({
          ...m,
          _subtype: classifyMeal(m),
          _totalCals: Math.round((m.meal_ingredients || []).reduce((s, i) => s + (parseFloat(i.calories) || 0), 0)),
        }))
        setMeals(classified)
        setExcluded(new Set(classified.filter(m => m.excluded_from_templates).map(m => m.id)))
        const overrides = {}
        for (const m of classified) {
          if (m.template_subtype) overrides[m.id] = m.template_subtype
        }
        setSubtypeOverrides(overrides)

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

  function withOverrides() {
    return meals.map(m => ({ ...m, _subtype: getSubtype(m) }))
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

    const groupId = crypto.randomUUID()

    for (let i = 0; i < weeks.length; i++) {
      const w = weeks[i]
      setSaveProgress(`Saving week ${i + 1} of ${weeks.length}…`)

      const { data: tmpl, error: tmplErr } = await supabase
        .from('weekly_templates')
        .insert({
          coach_id: profile.id,
          name: `Week ${w.weekNum}`,
          week_number: w.weekNum,
          plan_group_id: groupId,
          plan_group_name: planName.trim() || '20 Week Plan',
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Generate 20 Weeks</h1>
        </div>

        <div className="card bg-pink-50/60 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/30">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Meals are auto-classified below. Uncheck any you don't want included. Use the type badge to
            correct any wrong classifications — e.g. move a savoury breakfast that was labelled sweet.
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review 20 Weeks</h1>
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
            {saving ? saveProgress : 'Save All 20 Weeks'}
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
          placeholder="e.g. 20 Week Plan"
          maxLength={80}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">Used when assigning to clients</p>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Click any week to expand it. Swap meals using the dropdowns. Every client on this plan gets the same meals — calorie targets are set per client when you assign the plan.
      </p>

      {weeks.map((week, weekIdx) => {
        const isOpen = expanded.has(week.weekNum)
        const total = SLOTS.reduce((s, sl) => s + (week[sl.key]?._totalCals || 0), 0)

        return (
          <div key={weekIdx} className="card p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 bg-pink-50/60 dark:bg-pink-900/10 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors text-left"
              onClick={() => toggleExpand(week.weekNum)}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Week {week.weekNum}</span>
                {total > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    ~{total} kcal base
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="divide-y divide-pink-50 dark:divide-pink-900/10">
                {SLOTS.map(slot => {
                  const meal = week[slot.key]
                  const options = mealOptionsForSlot(slot)
                  return (
                    <div key={slot.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                      <span className="w-40 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {slot.label}
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
            )}
          </div>
        )
      })}

      <div className="flex justify-end pb-8">
        <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
          {saving ? saveProgress : 'Save All 20 Weeks'}
        </button>
      </div>
    </div>
  )
}
