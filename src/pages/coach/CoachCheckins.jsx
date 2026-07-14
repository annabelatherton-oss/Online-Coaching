import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CALORIE_TIERS } from '../../lib/calorieTiers'
import {
  MEAL_GROUPS, OPTION_1_KEYS, OPTION_2_KEYS,
  normalizeOverrides, hasAnyOverride,
  mealMacros, addMacros,
  MealCard, RecipeModal, SwapModal,
} from '../../components/MealPlanView'
import ExerciseThumb from '../../components/ExerciseThumb'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
function dayRank(name) {
  const n = (name || '').toLowerCase().substring(0, 3)
  const idx = DAY_ORDER.indexOf(n)
  return idx >= 0 ? idx : 99
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtCheckinWindow(fridayISO) {
  if (!fridayISO) return '—'
  const fri = new Date(fridayISO + 'T00:00:00')
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2)
  const opts = { day: 'numeric', month: 'short' }
  return `${fri.toLocaleDateString('en-GB', opts)}–${sun.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`
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

// ── Plan delivery panel ───────────────────────────────────────────────────────
function DeliveryPanel({ client, current, activeAssignment, deliveryPersonalWeek, coachId, onCancel, onDelivered }) {
  const [loading, setLoading] = useState(true)
  const [coachNotes, setCoachNotes] = useState(current?.coach_response || '')
  const [calorieTarget, setCalorieTarget] = useState(String(activeAssignment?.calorie_target ?? ''))
  const [trainingNotes, setTrainingNotes] = useState('')
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [mealMap, setMealMap] = useState({})
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [ingredientLib, setIngredientLib] = useState({})
  const [training, setTraining] = useState(null)
  const [swapModal, setSwapModal] = useState(null)
  const [recipeModal, setRecipeModal] = useState(null)
  const [sessions, setSessions] = useState([])
  const [originalSessions, setOriginalSessions] = useState([])
  const [editedExercises, setEditedExercises] = useState({})
  const [removedExerciseIds, setRemovedExerciseIds] = useState(new Set())
  const [addedExercises, setAddedExercises] = useState({})
  const [addedSessions, setAddedSessions] = useState([])
  const [newSessionForm, setNewSessionForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const skipTierReload = useRef(true)

  const nextTemplateWeek = (current?.week_number ?? 0) + 1
  const tier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null

  // Initial data load
  useEffect(() => {
    if (!activeAssignment) { setLoading(false); return }
    async function load() {
      const currentTier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null
      const [
        { data: mealsData },
        { data: libData },
        { data: tierTmplData },
        { data: stdTmplData },
        { data: cwm },
        { data: trainingAsgn },
      ] = await Promise.all([
        supabase.from('meals').select(`
          id, name, category, instructions, photo_url, photo_position,
          meal_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, ingredient_id),
          meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
            meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id))
        `).eq('coach_id', coachId).order('name'),
        supabase.from('ingredients').select('id, name, serving_size, serving_unit, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving').eq('coach_id', coachId),
        currentTier
          ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).eq('calorie_tier', currentTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).is('calorie_tier', null).maybeSingle(),
        supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', activeAssignment.id).eq('week_number', nextTemplateWeek).maybeSingle(),
        supabase.from('client_training_assignments').select('*, training_programs(name, current_week, weeks_total)').eq('client_id', client.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
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

      const tSlots = buildTemplateSlots(tierTmplData, stdTmplData, activeAssignment)
      setTemplateSlots(tSlots)
      setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
      if (cwm?.ingredient_overrides) setIngredientOverrides(cwm.ingredient_overrides)
      setTraining(trainingAsgn)

      if (trainingAsgn) {
        const trainingWeek = trainingAsgn.week_override ?? 1
        const { data: sessionsData } = await supabase
          .from('training_sessions')
          .select('*, session_exercises(*)')
          .eq('program_id', trainingAsgn.program_id)
          .eq('week_number', trainingWeek)
          .order('order_index')
        const sortedSessions = (sessionsData || []).map(s => ({
          ...s,
          session_exercises: [...(s.session_exercises || [])].sort((a, b) => a.order_index - b.order_index),
        })).sort((a, b) => dayRank(a.name) - dayRank(b.name))
        setSessions(sortedSessions)
        setOriginalSessions(JSON.parse(JSON.stringify(sortedSessions)))
      }

      setLoading(false)
      skipTierReload.current = false
    }
    load()
  }, [])

  // Reload template slots when calorie tier changes
  useEffect(() => {
    if (skipTierReload.current || !activeAssignment) return
    async function reloadTemplate() {
      const newTier = CALORIE_TIERS.includes(parseInt(calorieTarget)) ? parseInt(calorieTarget) : null
      const [{ data: tierTmplData }, { data: stdTmplData }] = await Promise.all([
        newTier
          ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).eq('calorie_tier', newTier).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', activeAssignment.plan_group_id).eq('week_number', nextTemplateWeek).is('calorie_tier', null).maybeSingle(),
      ])
      const tSlots = buildTemplateSlots(tierTmplData, stdTmplData, activeAssignment)
      setTemplateSlots(tSlots)
      setEditedSlots(tSlots)
    }
    reloadTemplate()
  }, [calorieTarget])

  function buildTemplateSlots(tierTmplData, stdTmplData, asgn) {
    const tmpl = tierTmplData || stdTmplData
    const slots = {}
    for (const s of (tmpl?.template_meal_slots || [])) slots[s.slot_type] = s.meal_id
    if (asgn.preworkout_static && asgn.preworkout_meal_id) slots.preworkout = asgn.preworkout_meal_id
    if (asgn.evening_snack_static && asgn.evening_snack_meal_id) slots.evening_snack = asgn.evening_snack_meal_id
    return slots
  }

  function handleSwapOpen(slotKey, label, cat) { setSwapModal({ slotKey, label, cat }) }
  function handleSwapSelect(slotKey, newMealId) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: newMealId }))
    setSwapModal(null)
  }
  function handleRevert(slotKey) {
    setEditedSlots(prev => ({ ...prev, [slotKey]: templateSlots[slotKey] || null }))
  }

  function handleUpdateIngredient(slotKey, ingKey, newQty) {
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
      if (ing._isAdded) {
        return { ...prev, [slotKey]: { ...existing, added: existing.added.filter(a => a._tempId !== ing._tempId) } }
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

  function handleRevertMealPlan() {
    setEditedSlots({ ...templateSlots })
    setIngredientOverrides({})
  }

  function handleUpdateExercise(exId, field, value) {
    setEditedExercises(prev => ({ ...prev, [exId]: { ...(prev[exId] || {}), [field]: value } }))
  }

  function handleRemoveExercise(exId) {
    setRemovedExerciseIds(prev => new Set([...prev, exId]))
  }

  function handleAddExercise(sessionId) {
    const tempId = `new-${sessionId}-${Date.now()}`
    setAddedExercises(prev => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), { _tempId: tempId, name: '', sets: null, reps: '', rpe: '', notes: '' }],
    }))
  }

  function handleUpdateAddedExercise(sessionId, tempId, field, value) {
    setAddedExercises(prev => ({
      ...prev,
      [sessionId]: (prev[sessionId] || []).map(ex => ex._tempId === tempId ? { ...ex, [field]: value } : ex),
    }))
  }

  function handleRemoveAddedExercise(sessionId, tempId) {
    setAddedExercises(prev => ({
      ...prev,
      [sessionId]: (prev[sessionId] || []).filter(ex => ex._tempId !== tempId),
    }))
  }

  function handleAddSession() {
    if (!newSessionForm?.name?.trim()) return
    const copyFrom = newSessionForm.copyFromId
      ? sessions.find(s => s.id === newSessionForm.copyFromId)
      : null
    const exercises = copyFrom
      ? (copyFrom.session_exercises || [])
          .filter(ex => !removedExerciseIds.has(ex.id))
          .map(ex => ({
            _tempId: `cp-${ex.id}-${Date.now()}`,
            name: ex.name, sets: ex.sets, reps: ex.reps, rpe: ex.rpe, notes: ex.notes,
          }))
      : []
    setAddedSessions(prev => [...prev, {
      _tempId: `sess-${Date.now()}`,
      name: newSessionForm.name.trim(),
      exercises,
    }])
    setNewSessionForm(null)
  }

  function handleRemoveAddedSession(tempId) {
    setAddedSessions(prev => prev.filter(s => s._tempId !== tempId))
  }

  function handleAddExToAddedSession(sessTempId) {
    setAddedSessions(prev => prev.map(s => s._tempId !== sessTempId ? s : {
      ...s,
      exercises: [...s.exercises, { _tempId: `nex-${Date.now()}`, name: '', sets: null, reps: '', rpe: '', notes: '' }],
    }))
  }

  function handleUpdateAddedSessionExercise(sessTempId, exTempId, field, value) {
    setAddedSessions(prev => prev.map(s => s._tempId !== sessTempId ? s : {
      ...s,
      exercises: s.exercises.map(ex => ex._tempId !== exTempId ? ex : { ...ex, [field]: value }),
    }))
  }

  function handleRemoveExFromAddedSession(sessTempId, exTempId) {
    setAddedSessions(prev => prev.map(s => s._tempId !== sessTempId ? s : {
      ...s,
      exercises: s.exercises.filter(ex => ex._tempId !== exTempId),
    }))
  }

  function handleRevertTraining() {
    setEditedExercises({})
    setRemovedExerciseIds(new Set())
    setAddedExercises({})
    setAddedSessions([])
    setNewSessionForm(null)
  }

  async function handleSubmit() {
    if (!current || !activeAssignment) return
    setSaving(true)
    const newCalTarget = calorieTarget ? parseInt(calorieTarget) : activeAssignment.calorie_target

    await supabase.from('client_checkins')
      .update({ coach_response: coachNotes.trim() || null, coach_responded_at: new Date().toISOString() })
      .eq('id', current.id)

    await supabase.from('client_week_meals').upsert({
      client_id: client.id,
      coach_id: coachId,
      assignment_id: activeAssignment.id,
      week_number: nextTemplateWeek,
      slots: editedSlots,
      ingredient_overrides: ingredientOverrides,
    }, { onConflict: 'assignment_id,week_number' })

    await supabase.from('client_plan_assignments')
      .update({ week_override: nextTemplateWeek, calorie_target: newCalTarget })
      .eq('id', activeAssignment.id)

    supabase.from('weekly_deliveries').insert({
      client_id: client.id,
      coach_id: coachId,
      checkin_id: current.id,
      personal_week: deliveryPersonalWeek,
      template_week: nextTemplateWeek,
      coach_notes: coachNotes.trim() || null,
      calorie_target: newCalTarget,
      training_notes: trainingNotes.trim() || null,
    })

    for (const [exId, edits] of Object.entries(editedExercises)) {
      if (Object.keys(edits).length > 0 && !removedExerciseIds.has(exId)) {
        await supabase.from('session_exercises').update(edits).eq('id', exId)
      }
    }

    if (removedExerciseIds.size > 0) {
      await supabase.from('session_exercises').delete().in('id', [...removedExerciseIds])
    }

    for (const [sessionId, newExes] of Object.entries(addedExercises)) {
      const sess = sessions.find(s => s.id === sessionId)
      const baseCount = (sess?.session_exercises || []).filter(ex => !removedExerciseIds.has(ex.id)).length
      const toInsert = newExes.filter(ex => ex.name.trim())
      for (let idx = 0; idx < toInsert.length; idx++) {
        const { _tempId, ...fields } = toInsert[idx]
        await supabase.from('session_exercises').insert({
          session_id: sessionId,
          name: fields.name.trim(),
          sets: fields.sets !== null && fields.sets !== '' ? parseInt(fields.sets) : null,
          reps: fields.reps || null,
          rpe: fields.rpe || null,
          notes: fields.notes || null,
          order_index: baseCount + idx,
        })
      }
    }

    const trainingWeek = training?.week_override ?? 1
    for (const sess of addedSessions) {
      if (!sess.name.trim()) continue
      const { data: newSess } = await supabase.from('training_sessions').insert({
        program_id: training.program_id,
        week_number: trainingWeek,
        name: sess.name.trim(),
        order_index: sessions.length + addedSessions.indexOf(sess),
      }).select('id').single()
      if (newSess) {
        const toInsert = sess.exercises.filter(ex => ex.name?.trim())
        for (let idx = 0; idx < toInsert.length; idx++) {
          const { _tempId, ...fields } = toInsert[idx]
          await supabase.from('session_exercises').insert({
            session_id: newSess.id,
            name: fields.name.trim(),
            sets: fields.sets != null && fields.sets !== '' ? parseInt(fields.sets) : null,
            reps: fields.reps || null,
            rpe: fields.rpe || null,
            notes: fields.notes || null,
            order_index: idx,
          })
        }
      }
    }

    setSaving(false)
    onDelivered(coachNotes.trim(), newCalTarget)
  }

  // Daily macro totals
  const preworkoutM = mealMacros(editedSlots.preworkout, mealMap, tier, ingredientOverrides.preworkout) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  const snackM      = mealMacros(editedSlots.evening_snack, mealMap, tier, ingredientOverrides.evening_snack) || { cal: 0, prot: 0, carb: 0, fat: 0 }
  function sumSlotKeys(keys) {
    return keys.reduce((acc, key) => addMacros(acc, mealMacros(editedSlots[key], mealMap, tier, ingredientOverrides[key])), { cal: 0, prot: 0, carb: 0, fat: 0 })
  }
  const opt1Total = addMacros(addMacros(sumSlotKeys(OPTION_1_KEYS), preworkoutM), snackM)
  const opt2Total = addMacros(addMacros(sumSlotKeys(OPTION_2_KEYS), preworkoutM), snackM)

  const hasMealPlanChanges =
    Object.keys(ingredientOverrides).some(k => hasAnyOverride(ingredientOverrides[k])) ||
    Object.keys({ ...templateSlots, ...editedSlots }).some(k => editedSlots[k] !== templateSlots[k])

  const hasTrainingChanges =
    Object.keys(editedExercises).length > 0 ||
    removedExerciseIds.size > 0 ||
    Object.values(addedExercises).some(a => a.length > 0) ||
    addedSessions.length > 0

  const prevCalTarget = activeAssignment?.calorie_target
  const calDiff = calorieTarget && prevCalTarget ? parseInt(calorieTarget) - prevCalTarget : null

  return (
    <div className="space-y-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-0 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Cancel
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Submit Week {deliveryPersonalWeek} Plan</h1>
            <p className="text-xs text-gray-400 leading-tight">{client?.full_name}</p>
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
          {/* Coach notes */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Message to client</h2>
            <textarea
              autoFocus
              className="input w-full text-sm resize-none"
              rows={5}
              placeholder="Weekly feedback, notes and encouragement…"
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
            />
          </div>

          {/* Calorie target */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Calorie target</h2>
            <div className="flex items-center gap-4">
              <div>
                <label className="label text-xs">kcal/day</label>
                <input
                  className="input w-32 text-sm"
                  type="number"
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
            {/* Daily macro totals */}
            <div className="grid grid-cols-2 gap-3">
              {[{ label: 'Option A', macros: opt1Total }, { label: 'Option B', macros: opt2Total }].map(({ label, macros }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label} daily total</p>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[{ val: Math.round(macros.cal), lbl: 'kcal' }, { val: Math.round(macros.carb) + 'g', lbl: 'carbs' }, { val: Math.round(macros.prot) + 'g', lbl: 'prot' }, { val: Math.round(macros.fat) + 'g', lbl: 'fat' }].map(({ val, lbl }) => (
                      <div key={lbl}>
                        <p className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{val}</p>
                        <p className="text-[10px] text-gray-400">{lbl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meal plan for next week */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Week {deliveryPersonalWeek} meal plan
                <span className="ml-2 text-xs font-normal text-gray-400">Tap a meal to view · Swap to change</span>
              </h2>
              {hasMealPlanChanges && (
                <button
                  onClick={handleRevertMealPlan}
                  className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium flex-shrink-0"
                >
                  Revert all
                </button>
              )}
            </div>
            {MEAL_GROUPS.map(group => {
              const visibleSlots = group.slots.filter(s => editedSlots[s.key])
              if (visibleSlots.length === 0) return null
              return (
                <section key={group.label}>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{group.label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {visibleSlots.map(slot => (
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
                        onSwap={handleSwapOpen}
                        onViewRecipe={setRecipeModal}
                        ingredientLib={ingredientLib}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
            {Object.values(editedSlots).every(v => !v) && (
              <div className="card text-center py-10">
                <p className="text-sm text-gray-400">No meal plan template set for this week.</p>
                <p className="text-xs text-gray-400 mt-1">Set up weekly templates in the plan editor first.</p>
              </div>
            )}
          </div>

          {/* Training — header */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Training</h2>
              {hasTrainingChanges && (
                <button
                  onClick={handleRevertTraining}
                  className="text-xs text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                >
                  Revert to original
                </button>
              )}
            </div>
            {training ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{training.program_name || training.training_programs?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Week {training.week_override ?? 1} · {training.training_programs?.weeks_total} weeks total
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No training programme assigned.</p>
            )}
          </div>

          {/* Training — session blocks (full width) */}
          {training && (() => {
            const displaySessions = [
              ...sessions.map(s => ({ ...s, _kind: 'existing' })),
              ...addedSessions.map(s => ({ ...s, _kind: 'added' })),
            ].sort((a, b) => dayRank(a.name) - dayRank(b.name))

            const ExRow = ({ ex, onUpdate, onRemove, autoF }) => (
              <div className="px-3 py-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  {ex.illustration_url != null || ex.video_url != null
                    ? <ExerciseThumb illustrationUrl={ex.illustration_url} videoUrl={ex.video_url} size="sm" />
                    : <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </div>
                  }
                  <input autoFocus={autoF} type="text" value={ex.name ?? ''} onChange={e => onUpdate('name', e.target.value)}
                    className="input flex-1 text-xs py-0.5 px-2 font-medium min-w-0" placeholder="Exercise name…" />
                  <input type="number" min="0" value={ex.sets ?? ''} onChange={e => onUpdate('sets', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-10 input text-xs py-0.5 px-1 text-center tabular-nums flex-shrink-0" />
                  <input type="text" value={ex.reps ?? ''} onChange={e => onUpdate('reps', e.target.value || null)}
                    className="w-12 input text-xs py-0.5 px-1 text-center tabular-nums flex-shrink-0" />
                  <input type="text" value={ex.rpe ?? ''} onChange={e => onUpdate('rpe', e.target.value || null)}
                    className="w-10 input text-xs py-0.5 px-1 text-center tabular-nums flex-shrink-0" />
                  <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="pl-12">
                  <input type="text" value={ex.notes ?? ''} onChange={e => onUpdate('notes', e.target.value || null)}
                    className="input w-full text-xs py-0.5 px-2 text-gray-500 dark:text-gray-400" placeholder="Notes…" />
                </div>
              </div>
            )

            return (
              <>
                {displaySessions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {displaySessions.map((sess, i) => {
                      const isAdded = sess._kind === 'added'
                      const dbExercises = isAdded ? [] : (sess.session_exercises || []).filter(ex => !removedExerciseIds.has(ex.id))
                      const newExercises = isAdded ? sess.exercises : (addedExercises[sess.id] || [])
                      const hasExercises = dbExercises.length > 0 || newExercises.length > 0

                      const onUpdateNew = (exTempId, field, value) => isAdded
                        ? handleUpdateAddedSessionExercise(sess._tempId, exTempId, field, value)
                        : handleUpdateAddedExercise(sess.id, exTempId, field, value)
                      const onRemoveNew = exTempId => isAdded
                        ? handleRemoveExFromAddedSession(sess._tempId, exTempId)
                        : handleRemoveAddedExercise(sess.id, exTempId)
                      const onAddNew = () => isAdded
                        ? handleAddExToAddedSession(sess._tempId)
                        : handleAddExercise(sess.id)

                      return (
                        <div key={isAdded ? sess._tempId : sess.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                          {/* Session header */}
                          <div className={`px-3 py-2.5 flex items-center gap-2 flex-shrink-0 ${isAdded ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                            <span className={`w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${isAdded ? 'bg-green-500' : 'bg-blue-500'}`}>
                              {i + 1}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex-1 min-w-0 truncate">{sess.name}</p>
                            {isAdded && (
                              <>
                                <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">New</span>
                                <button onClick={() => handleRemoveAddedSession(sess._tempId)} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </>
                            )}
                          </div>

                          {/* Column header */}
                          {hasExercises && (
                            <div className="px-3 py-1 flex items-center gap-1.5 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">
                              <div className="w-10 flex-shrink-0" />
                              <span className="flex-1 min-w-0">Exercise</span>
                              <span className="w-10 text-center flex-shrink-0">Sets</span>
                              <span className="w-12 text-center flex-shrink-0">Reps</span>
                              <span className="w-10 text-center flex-shrink-0">RPE</span>
                              <div className="w-6 flex-shrink-0" />
                            </div>
                          )}

                          {/* Exercise rows */}
                          <div className="flex-1 flex flex-col">
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {dbExercises.map(ex => {
                                const edits = editedExercises[ex.id] || {}
                                const merged = {
                                  ...ex,
                                  name:  edits.name  !== undefined ? edits.name  : ex.name,
                                  sets:  edits.sets  !== undefined ? edits.sets  : ex.sets,
                                  reps:  edits.reps  !== undefined ? edits.reps  : ex.reps,
                                  rpe:   edits.rpe   !== undefined ? edits.rpe   : ex.rpe,
                                  notes: edits.notes !== undefined ? edits.notes : ex.notes,
                                }
                                return <ExRow key={ex.id} ex={merged}
                                  onUpdate={(f, v) => handleUpdateExercise(ex.id, f, v)}
                                  onRemove={() => handleRemoveExercise(ex.id)} />
                              })}
                              {newExercises.map((ex, ni) => (
                                <ExRow key={ex._tempId} ex={ex} autoF={ni === 0}
                                  onUpdate={(f, v) => onUpdateNew(ex._tempId, f, v)}
                                  onRemove={() => onRemoveNew(ex._tempId)} />
                              ))}
                            </div>

                            <button onClick={onAddNew} className="mt-auto py-2 flex items-center justify-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-colors border-t border-gray-100 dark:border-gray-800">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                              Add exercise
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 px-1">No sessions found for this training week.</p>
                )}

                {/* Add training day */}
                {newSessionForm ? (
                  <div className="card space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add training day</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Day</label>
                        <select
                          value={newSessionForm.name}
                          onChange={e => setNewSessionForm(p => ({ ...p, name: e.target.value }))}
                          className="input w-full text-sm"
                        >
                          <option value="">Select day…</option>
                          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Copy exercises from (optional)</label>
                        <select
                          value={newSessionForm.copyFromId || ''}
                          onChange={e => setNewSessionForm(p => ({ ...p, copyFromId: e.target.value }))}
                          className="input w-full text-sm"
                        >
                          <option value="">— Start empty —</option>
                          {sessions.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({(s.session_exercises || []).length} exercises)</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddSession} disabled={!newSessionForm.name} className="btn-primary text-sm py-1.5 px-4">
                        Add day
                      </button>
                      <button onClick={() => setNewSessionForm(null)} className="btn-secondary text-sm py-1.5 px-3">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewSessionForm({ name: '', copyFromId: '' })}
                    className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium px-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add training day
                  </button>
                )}
              </>
            )
          })()}

          {/* Training notes */}
          {training && (
            <div className="card space-y-2">
              <label className="label text-xs">Training notes for this week (optional)</label>
              <textarea
                className="input w-full text-sm resize-none"
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
          cat={swapModal.cat}
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
        />
      )}
    </div>
  )
}

// ── Client detail view ────────────────────────────────────────────────────────
function ClientDetail({ client, checkins: rawCheckins, onBack, onResponded }) {
  const { profile } = useAuth()
  const [checkins, setCheckins] = useState(rawCheckins)
  const [lightbox, setLightbox] = useState(null)
  const [responding, setResponding] = useState(null) // checkin id (past check-ins only)
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [showDeliveryPanel, setShowDeliveryPanel] = useState(false)
  const [delivered, setDelivered] = useState(false)

  // desc order (most recent first)
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  const current = sorted[0]
  const first = sorted[sorted.length - 1]
  const prev = sorted[1] || null

  // ascending for history table + personal week mapping
  const asc = [...sorted].reverse()
  const personalWeekMap = {}
  asc.forEach((c, i) => { personalWeekMap[c.id] = i + 1 })
  const currentPersonalWeek = current ? personalWeekMap[current.id] : 0
  const deliveryPersonalWeek = currentPersonalWeek + 1

  const wDeltaPrev = weightDelta(current, prev)
  const wDeltaStart = current && first && current.id !== first.id ? weightDelta(current, first) : null

  const withPhotos = sorted.filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
  const newestP = withPhotos[0]
  const prevP = withPhotos[1]
  const firstP = withPhotos[withPhotos.length - 1]
  const compAngles = PHOTO_ANGLES.filter(a => newestP?.progress_photos?.[a])
  const showComparison = newestP && firstP && newestP.id !== firstP.id && compAngles.length > 0

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

  async function sendResponse(checkinId) {
    setSaving(true)
    const text = responseText.trim()
    await supabase
      .from('client_checkins')
      .update({ coach_response: text, coach_responded_at: new Date().toISOString() })
      .eq('id', checkinId)
    setSaving(false)
    setResponding(null)
    const updated = checkins.map(c => c.id === checkinId ? { ...c, coach_response: text, coach_responded_at: new Date().toISOString() } : c)
    setCheckins(updated)
    onResponded(checkinId, text)
  }

  // Show the full delivery panel when the coach clicks "Submit Week X Plan"
  if (showDeliveryPanel && current && activeAssignment) {
    return (
      <div className="w-full">
        <DeliveryPanel
          client={client}
          current={current}
          activeAssignment={activeAssignment}
          deliveryPersonalWeek={deliveryPersonalWeek}
          coachId={profile.id}
          onCancel={() => setShowDeliveryPanel(false)}
          onDelivered={(notes, calTarget) => {
            setShowDeliveryPanel(false)
            setDelivered(true)
            setCheckins(prev => prev.map(c => c.id === current.id
              ? { ...c, coach_response: notes, coach_responded_at: new Date().toISOString() }
              : c))
            onResponded(current.id, notes)
            setActiveAssignment(prev => prev ? { ...prev, calorie_target: calTarget } : prev)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={client?.full_name} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client?.full_name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sorted.length} check-in{sorted.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Current week summary */}
      {current && (
        <div className="card space-y-4 border-brand-200 dark:border-brand-800">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">This week — Week {currentPersonalWeek}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(current.updated_at || current.submitted_at)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {wDeltaPrev !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaPrev < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaPrev > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaPrev > 0 ? '↑ +' : wDeltaPrev < 0 ? '↓ ' : ''}{wDeltaPrev} kg vs last week
                </span>
              )}
              {wDeltaStart !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaStart < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaStart > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaStart > 0 ? '↑ +' : wDeltaStart < 0 ? '↓ ' : ''}{wDeltaStart} kg since start
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            {current.adherence != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Adherence</p>
                <p className={`text-lg font-bold ${ratingColor(current.adherence)}`}>{current.adherence}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
          </div>

          {/* Current week lifts vs prev and vs start */}
          {current.lift_results?.filter(l => l?.name).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Lifts</p>
              <div className="grid grid-cols-3 gap-3">
                {current.lift_results.filter(l => l?.name).map((lift, i) => {
                  const dPrev = liftDelta(lift, prev)
                  const dStart = first && first.id !== current.id ? liftDelta(lift, first) : null
                  return (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{lift.name}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span>
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {dPrev !== null && (dPrev.kg !== 0 || dPrev.reps !== 0) && (
                          <div className="flex gap-1.5">
                            {dPrev.kg !== 0 && <DeltaTag delta={dPrev.kg} />}
                            {dPrev.reps !== 0 && <DeltaTag delta={dPrev.reps} suffix=" reps" />}
                            <span className="text-xs text-gray-400">vs last wk</span>
                          </div>
                        )}
                        {dStart !== null && (dStart.kg !== 0 || dStart.reps !== 0) && (
                          <div className="flex gap-1.5">
                            {dStart.kg !== 0 && <DeltaTag delta={dStart.kg} />}
                            {dStart.reps !== 0 && <DeltaTag delta={dStart.reps} suffix=" reps" />}
                            <span className="text-xs text-gray-400">vs start</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Photos — current week + first week below for comparison */}
          <div className="space-y-3">
            {[
              { label: `Now — Week ${personalWeekMap[current.id]}`, photos: current.progress_photos },
              first && first.id !== current.id ? { label: `Start — Week ${personalWeekMap[first.id]}`, photos: first.progress_photos } : null,
            ].filter(Boolean).map(row => (
              <div key={row.label}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{row.label}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PHOTO_ANGLES.map(angle => {
                    const url = row.photos?.[angle]
                    return (
                      <div key={angle} className="space-y-1">
                        {url ? (
                          <button onClick={() => setLightbox(url)} className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block">
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

          {current.notes && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Client note</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{current.notes}"</p>
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
            {current.coach_response && !delivered
              ? `Edit & resubmit Week ${deliveryPersonalWeek} Plan →`
              : `Submit Week ${deliveryPersonalWeek} Plan →`}
          </button>
        </div>
      )}

      {/* Photo comparison: start / last week / now */}
      {showComparison && (
        <div className="card space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Photo Comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Start (Wk {personalWeekMap[firstP.id]})
              {prevP && prevP.id !== firstP.id && prevP.id !== newestP.id && ` · Last week (Wk ${personalWeekMap[prevP.id]})`}
              {` · Now (Wk ${personalWeekMap[newestP.id]})`}
            </p>
          </div>
          {compAngles.map(angle => {
            const cols = [
              { label: `Start · Wk ${personalWeekMap[firstP.id]}`, url: firstP.progress_photos[angle] },
              prevP && prevP.id !== firstP.id && prevP.id !== newestP.id && prevP.progress_photos?.[angle]
                ? { label: `Last week · Wk ${personalWeekMap[prevP.id]}`, url: prevP.progress_photos[angle] }
                : null,
              { label: `Now · Wk ${personalWeekMap[newestP.id]}`, url: newestP.progress_photos[angle] },
            ].filter(Boolean)
            return (
              <div key={angle}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 capitalize">{angle}</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                  {cols.map(col => (
                    <div key={col.label} className="space-y-1">
                      <button onClick={() => setLightbox(col.url)} className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block">
                        <img src={col.url} alt={col.label} className="w-full h-full object-cover" />
                      </button>
                      <p className="text-xs text-center text-gray-400">{col.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress history table */}
      {sorted.length > 1 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progress History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Week', 'Date', 'Weight', 'Change', 'Energy', 'Sleep', 'Adherence'].map(h => (
                    <th key={h} className="text-left pb-2.5 pr-4 text-xs text-gray-400 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {asc.map((c, i) => {
                  const p = asc[i - 1] || null
                  const delta = weightDelta(c, p)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">Wk {personalWeekMap[c.id]}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.updated_at || c.submitted_at)}</td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white tabular-nums">{c.weight_kg != null ? `${c.weight_kg} kg` : '—'}</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {delta !== null
                          ? <span className={`font-semibold text-xs ${delta < 0 ? 'text-green-600 dark:text-green-400' : delta > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>{delta > 0 ? '+' : ''}{delta} kg</span>
                          : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(c.energy_level)}`}>{c.energy_level != null ? `${c.energy_level}/5` : '—'}</span></td>
                      <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(c.sleep_quality)}`}>{c.sleep_quality != null ? `${c.sleep_quality}/5` : '—'}</span></td>
                      <td className="py-2.5"><span className={`text-xs font-semibold ${ratingColor(c.adherence)}`}>{c.adherence != null ? `${c.adherence}/5` : '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous week cards */}
      {sorted.slice(1).map((c, i) => {
        const p = sorted[i + 2] || null
        const wDelta = weightDelta(c, p)
        return (
          <div key={c.id} className="card space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Week {personalWeekMap[c.id]}</h3>
                <p className="text-xs text-gray-400">{fmtDate(c.updated_at || c.submitted_at)}</p>
              </div>
              {wDelta !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDelta < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDelta > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDelta > 0 ? '↑ +' : wDelta < 0 ? '↓ ' : ''}{wDelta} kg
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {c.weight_kg != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Weight</p><p className="font-semibold text-gray-900 dark:text-white text-sm">{c.weight_kg} kg</p></div>}
              {c.energy_level != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Energy</p><p className={`font-semibold text-sm ${ratingColor(c.energy_level)}`}>{c.energy_level}/5</p></div>}
              {c.sleep_quality != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Sleep</p><p className={`font-semibold text-sm ${ratingColor(c.sleep_quality)}`}>{c.sleep_quality}/5</p></div>}
              {c.adherence != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Adherence</p><p className={`font-semibold text-sm ${ratingColor(c.adherence)}`}>{c.adherence}/5</p></div>}
            </div>

            {c.lift_results?.filter(l => l?.name).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {c.lift_results.filter(l => l?.name).map((lift, li) => {
                  const d = liftDelta(lift, p)
                  return (
                    <div key={li} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 mb-0.5 truncate">{lift.name}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span></p>
                      {d !== null && (d.kg !== 0 || d.reps !== 0) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
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
                {PHOTO_ANGLES.filter(a => c.progress_photos[a]).map(angle => (
                  <button key={angle} onClick={() => setLightbox(c.progress_photos[angle])} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 hover:opacity-90">
                    <img src={c.progress_photos[angle]} alt={angle} className="w-full h-full object-cover" />
                  </button>
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
                <textarea autoFocus className="input w-full text-sm resize-none" rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response…" />
                <div className="flex gap-2">
                  <button onClick={() => sendResponse(c.id)} disabled={saving || !responseText.trim()} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Sending…' : 'Send'}</button>
                  <button onClick={() => setResponding(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => openRespond(c)} className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
                {c.coach_response ? 'Edit response' : 'Respond →'}
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

  async function load() {
    const [{ data: clientData }, { data: checkinData }] = await Promise.all([
      supabase.from('clients').select('id, collect_measurements, profiles!clients_profile_id_fkey(full_name)').eq('coach_id', profile.id),
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

  function handleResponded(id, text) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, coach_response: text } : c))
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
    if (!latest.coach_response) return 'needs-response'
    return 'ok'
  }

  const needsResponse = clients.filter(c => clientStatus(c) === 'needs-response')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const missing = clients.filter(c => clientStatus(c) === 'missing')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const upToDate = clients.filter(c => clientStatus(c) === 'ok')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

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
                      ? `${p.weeks_paused} week${p.weeks_paused !== 1 ? 's' : ''} · check-in window: ${fmtCheckinWindow(p.first_checkin_date)}`
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
