import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Pec Deck', 'EZ Bar', 'Straight Bar', 'Kettlebell', 'Bodyweight', 'Band', 'Other']

function parseProgram(name) {
  const m = (name || '').match(/^(\d+)\s*Day\s*[–—\-]\s*Block\s*(\d+)/i)
  if (m) return { days: parseInt(m[1]), block: parseInt(m[2]) }
  return null
}

function stripDay(name) {
  if (!name) return ''
  for (const d of DAYS) {
    if (name === d) return ''
    if (name.startsWith(d + ' ') || name.startsWith(d + '—')) {
      return name.slice(d.length).replace(/^[\s–—\-]+/, '').trim()
    }
  }
  return name
}

// Handles "Monday", "Monday — Glutes and Hamstrings", etc.
// Returns { day, label } or null if no DAYS prefix found.
function parseDaySession(session, workouts) {
  for (const day of DAYS) {
    if (session.name === day || session.name.startsWith(day + ' ') || session.name.startsWith(day + '—')) {
      const rest = session.name.slice(day.length).replace(/^[\s–—\-]+/, '').trim()
      const wkt = workouts.find(w => w.id === session.workout_id)
      return { day, label: stripDay(wkt?.name) || rest || day }
    }
  }
  return null
}

// Strip day prefix from a session name to get the interchangeable label.
// "Monday — Glutes and Hamstrings" → "Glutes and Hamstrings"
// "Push" → "Push"
function sessionLabel(session, workouts) {
  const wkt = workouts.find(w => w.id === session.workout_id)
  if (wkt) return stripDay(wkt.name) || wkt.name
  for (const day of DAYS) {
    if (session.name === day) return day
    if (session.name.startsWith(day + ' ') || session.name.startsWith(day + '—')) {
      return session.name.slice(day.length).replace(/^[\s–—\-]+/, '').trim() || day
    }
  }
  return session.name
}

export default function ClientWeeklyPlan({ clientId, coachId, assignment }) {
  const [items, setItems] = useState([])
  const [programs, setPrograms] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [hiitCircuits, setHiitCircuits] = useState([])
  const [cardioSessions, setCardioSessions] = useState([])
  const [exerciseLibrary, setExerciseLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [populating, setPopulating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Per-day add form state
  const [addingToDay, setAddingToDay] = useState(null)
  const [addType, setAddType] = useState('workout')
  const [addBlock, setAddBlock] = useState('')
  const [addDayVariant, setAddDayVariant] = useState('')
  const [addItemId, setAddItemId] = useState('')

  // Cardio free-text add state
  const [addCardioText, setAddCardioText] = useState('')

  // Rest day sub-type
  const [addRestSubtype, setAddRestSubtype] = useState('rest')

  // Workout exercise drill-down (editable)
  const [expandedItemId, setExpandedItemId] = useState(null)
  const [exerciseDrafts, setExerciseDrafts] = useState({})   // workoutId → Exercise[]
  const [exerciseSaving, setExerciseSaving] = useState({})

  // Populate banner "use different block" expander
  const [showAltPopulate, setShowAltPopulate] = useState(false)
  const [altBlock, setAltBlock] = useState('')
  const [altDays, setAltDays] = useState('')

  // Drag-and-drop state
  const [dragItemId, setDragItemId] = useState(null)
  const [dragOverDay, setDragOverDay] = useState(null)

  async function load() {
    const [
      { data: schedItems, error: schedErr },
      { data: progs },
      { data: wkts },
      { data: hiits },
      { data: cardios },
      { data: exLib },
    ] = await Promise.all([
      supabase
        .from('client_schedule_items')
        .select('id, client_id, day_of_week, item_type, workout_id, hiit_circuit_id, cardio_session_id, custom_label, notes, order_index')
        .eq('client_id', clientId)
        .order('order_index'),
      supabase
        .from('training_programs')
        .select('id, name, training_sessions(id, name, workout_id)')
        .eq('coach_id', coachId)
        .order('name'),
      supabase.from('workouts').select('id, name').eq('coach_id', coachId).eq('is_archived', false).order('name'),
      supabase.from('hiit_circuits').select('id, name, circuit_type').eq('coach_id', coachId).eq('is_archived', false).order('name'),
      supabase.from('cardio_sessions').select('id, name, cardio_type, duration_minutes').eq('coach_id', coachId).eq('is_archived', false).order('name'),
      supabase.from('exercises').select('id, name').eq('coach_id', coachId).eq('is_archived', false).order('name'),
    ])
    if (schedErr?.code === '42P01' || schedErr?.message?.includes('does not exist')) {
      setError('migration_needed')
    } else if (schedErr) {
      setError(`select_failed:${schedErr.message}`)
    } else {
      setError('')
    }
    setItems(schedItems || [])
    setPrograms(progs || [])
    setWorkouts(wkts || [])
    setHiitCircuits(hiits || [])
    setCardioSessions(cardios || [])
    setExerciseLibrary(exLib || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function addItem(day, type, entityId) {
    setSaving(true)
    const existing = items.filter(i => i.day_of_week === day && i.item_type === type)
    const record = {
      client_id: clientId,
      coach_id: coachId,
      day_of_week: day,
      item_type: type,
      order_index: existing.length,
    }
    if (type === 'workout') record.workout_id = entityId
    if (type === 'hiit') record.hiit_circuit_id = entityId
    if (type === 'cardio') record.cardio_session_id = entityId
    await supabase.from('client_schedule_items').insert(record)
    setSaving(false)
    await load()
  }

  async function removeItem(id) {
    await supabase.from('client_schedule_items').delete().eq('id', id)
    await load()
  }

  async function moveItem(id, toDay) {
    await supabase.from('client_schedule_items').update({ day_of_week: toDay }).eq('id', id)
    await load()
  }

  async function addCardioItem(day, customLabel, cardioSessionId) {
    setSaving(true)
    const existing = items.filter(i => i.day_of_week === day && i.item_type === 'cardio')
    const record = {
      client_id: clientId,
      coach_id: coachId,
      day_of_week: day,
      item_type: 'cardio',
      order_index: existing.length,
    }
    if (cardioSessionId) record.cardio_session_id = cardioSessionId
    if (customLabel) record.custom_label = customLabel
    await supabase.from('client_schedule_items').insert(record)
    setSaving(false)
    await load()
  }

  async function addRestItem(day, subtype) {
    setSaving(true)
    const existing = items.filter(i => i.day_of_week === day && i.item_type === 'rest')
    const record = {
      client_id: clientId,
      coach_id: coachId,
      day_of_week: day,
      item_type: 'rest',
      custom_label: subtype === 'active_rest' ? 'Active Rest Day' : 'Rest Day',
      order_index: existing.length,
    }
    await supabase.from('client_schedule_items').insert(record)
    setSaving(false)
    await load()
  }

  async function toggleExpand(item) {
    if (expandedItemId === item.id) {
      setExpandedItemId(null)
      return
    }
    setExpandedItemId(item.id)
    if (item.workout_id && exerciseDrafts[item.workout_id] === undefined) {
      const { data } = await supabase
        .from('workout_exercises')
        .select('id, name, equipment, sets, reps, rpe, rest_seconds, notes, order_index')
        .eq('workout_id', item.workout_id)
        .order('order_index')
      setExerciseDrafts(prev => ({ ...prev, [item.workout_id]: data || [] }))
    }
  }

  function updateExercise(workoutId, idx, field, value) {
    setExerciseDrafts(prev => ({
      ...prev,
      [workoutId]: prev[workoutId].map((ex, i) => i === idx ? { ...ex, [field]: value } : ex),
    }))
  }

  function addExercise(workoutId) {
    setExerciseDrafts(prev => ({
      ...prev,
      [workoutId]: [...(prev[workoutId] || []), { _key: Math.random().toString(36).slice(2), name: '', equipment: null, sets: null, reps: '', rpe: '', notes: '' }],
    }))
  }

  function removeExercise(workoutId, idx) {
    setExerciseDrafts(prev => ({
      ...prev,
      [workoutId]: prev[workoutId].filter((_, i) => i !== idx),
    }))
  }

  async function saveExercises(workoutId) {
    setExerciseSaving(prev => ({ ...prev, [workoutId]: true }))
    const draft = exerciseDrafts[workoutId] || []
    await supabase.from('workout_exercises').delete().eq('workout_id', workoutId)
    if (draft.length > 0) {
      await supabase.from('workout_exercises').insert(
        draft.map((ex, i) => ({
          workout_id: workoutId,
          order_index: i,
          name: ex.name?.trim() || 'Exercise',
          equipment: ex.equipment || null,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps?.trim() || null,
          rpe: ex.rpe?.trim() || null,
          rest_seconds: ex.rest_seconds || null,
          notes: ex.notes?.trim() || null,
        }))
      )
    }
    // Re-fetch to get real IDs
    const { data } = await supabase
      .from('workout_exercises')
      .select('id, name, sets, reps, rpe, rest_seconds, notes, order_index')
      .eq('workout_id', workoutId)
      .order('order_index')
    setExerciseDrafts(prev => ({ ...prev, [workoutId]: data || [] }))
    setExerciseSaving(prev => ({ ...prev, [workoutId]: false }))
  }

  async function populateFromProgram(prog) {
    if (!prog) return
    setPopulating(true)
    setError('')

    await supabase.from('client_schedule_items')
      .delete().eq('client_id', clientId).in('item_type', ['workout', 'hiit'])

    // Use sessions from nested join; fall back to a direct query if empty
    let rawSessions = prog.training_sessions || []
    if (rawSessions.length === 0) {
      const { data: direct } = await supabase
        .from('training_sessions')
        .select('id, name, workout_id')
        .eq('program_id', prog.id)
      rawSessions = direct || []
    }

    const seenDays = new Set()
    const toInsert = []

    for (const s of rawSessions) {
      const parsed = parseDaySession(s, workouts)
      if (!parsed) continue
      const { day, label } = parsed
      if (seenDays.has(day)) continue
      seenDays.add(day)
      toInsert.push({
        client_id: clientId,
        coach_id: coachId,
        day_of_week: day,
        item_type: 'workout',
        workout_id: s.workout_id || null,
        custom_label: label,
        order_index: 0,
      })
    }

    if (toInsert.length === 0) {
      setError('no_sessions')
      setPopulating(false)
      return
    }

    const { error: insertErr } = await supabase.from('client_schedule_items').insert(toInsert)
    if (insertErr) {
      setError(insertErr.message?.includes('does not exist') || insertErr.code === '42P01'
        ? 'migration_needed'
        : `insert_failed:${insertErr.message}`)
      setPopulating(false)
      return
    }

    setPopulating(false)
    setShowAltPopulate(false)
    await load()
  }

  if (loading) return <LoadingSpinner size="md" className="py-8" />

  const hasAnySchedule = items.length > 0

  const assignedProgram = assignment
    ? programs.find(p => p.id === assignment.program_id)
    : null

  // Populate banner — "use different block"
  const blockNums = [...new Set(programs.map(p => parseProgram(p.name)?.block).filter(Boolean))].sort()
  const altDayOptions = altBlock
    ? [...new Set(
        programs
          .filter(p => parseProgram(p.name)?.block === parseInt(altBlock))
          .map(p => parseProgram(p.name)?.days)
          .filter(Boolean)
      )].sort((a, b) => b - a)
    : []

  // Cascading add-workout selector data
  const addBlockOptions = [...new Set(
    programs.map(p => parseProgram(p.name)?.block).filter(Boolean)
  )].sort((a, b) => a - b)

  const addDayOptions = addBlock
    ? [...new Set(
        programs
          .filter(p => parseProgram(p.name)?.block === parseInt(addBlock))
          .map(p => parseProgram(p.name)?.days)
          .filter(Boolean)
      )].sort((a, b) => b - a)
    : []

  const addSessionOptions = (addBlock && addDayVariant)
    ? (() => {
        const prog = programs.find(p => {
          const parsed = parseProgram(p.name)
          return parsed?.block === parseInt(addBlock) && parsed?.days === parseInt(addDayVariant)
        })
        return (prog?.training_sessions || []).map(s => ({
          id: s.workout_id || s.id,
          workoutId: s.workout_id || null,
          label: sessionLabel(s, workouts),
        }))
      })()
    : []

  return (
    <div className="space-y-8">

      {error === 'migration_needed' && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">Database table missing</p>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">
            Run <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">supabase/client-schedule-migration.sql</code> in your Supabase SQL Editor, then refresh the page.
          </p>
        </div>
      )}

      {error === 'no_sessions' && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            No sessions found in this programme. Open the <strong>Workouts</strong> library and make sure the block has sessions created.
          </p>
        </div>
      )}

      {error && !['migration_needed', 'no_sessions'].includes(error) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error.replace('insert_failed:', '')}</p>
        </div>
      )}

      {/* ── Weekly Training Schedule ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Schedule</h3>
        </div>

        {/* Populate banner */}
        {(assignedProgram || programs.length > 0) && (
          <div className="mb-4 rounded-xl border border-brand-100 dark:border-brand-800/40 bg-brand-50/50 dark:bg-brand-900/10 px-4 py-3 space-y-2">
            {assignedProgram ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {hasAnySchedule ? 'Re-populate' : 'Populate schedule'} from assigned programme:
                    <span className="font-semibold text-gray-800 dark:text-white"> {assignment.program_name}</span>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {(assignedProgram.training_sessions || []).length} sessions · {(assignedProgram.training_sessions || []).filter(s => parseDaySession(s, workouts)).length} days matched
                  </p>
                </div>
                <button
                  onClick={() => populateFromProgram(assignedProgram)}
                  disabled={populating}
                  className="btn-primary py-1.5 px-3 text-sm whitespace-nowrap"
                >
                  {populating ? 'Populating…' : hasAnySchedule ? 'Re-populate' : 'Populate schedule'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Assign a training programme above to auto-fill the schedule, or add sessions manually below.</p>
            )}

            <button
              onClick={() => { setShowAltPopulate(v => !v); setAltBlock(''); setAltDays('') }}
              className="text-xs text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              {showAltPopulate ? '▲ Hide' : '▾ Use a different block'}
            </button>

            {showAltPopulate && (
              <div className="flex flex-wrap gap-3 items-end pt-1">
                <div>
                  <label className="label text-xs">Block</label>
                  <select className="input" value={altBlock} onChange={e => { setAltBlock(e.target.value); setAltDays('') }}>
                    <option value="">Select block…</option>
                    {blockNums.map(n => <option key={n} value={n}>Block {n}</option>)}
                  </select>
                </div>
                {altBlock && altDayOptions.length > 0 && (
                  <div>
                    <label className="label text-xs">Day variant</label>
                    <select className="input" value={altDays} onChange={e => setAltDays(e.target.value)}>
                      <option value="">Select…</option>
                      {altDayOptions.map(d => <option key={d} value={d}>{d} Day</option>)}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => {
                    const prog = programs.find(p => {
                      const parsed = parseProgram(p.name)
                      return parsed && parsed.block === parseInt(altBlock) && parsed.days === parseInt(altDays)
                    })
                    if (prog) populateFromProgram(prog)
                  }}
                  disabled={!altBlock || !altDays || populating}
                  className="btn-primary"
                >
                  {populating ? 'Populating…' : 'Populate'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Day cards — vertical list with drag-and-drop */}
        <div className="space-y-2">
          {DAYS.map(day => {
            const dayItems = items.filter(i => i.day_of_week === day)
            const isEmpty = dayItems.length === 0
            const isAdding = addingToDay === day
            const isDragTarget = dragOverDay === day

            return (
              <div
                key={day}
                onDragOver={e => { e.preventDefault(); if (dragItemId) setDragOverDay(day) }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null)
                }}
                onDrop={async e => {
                  e.preventDefault()
                  setDragOverDay(null)
                  if (dragItemId) {
                    const item = items.find(i => i.id === dragItemId)
                    if (item && item.day_of_week !== day) await moveItem(dragItemId, day)
                    setDragItemId(null)
                  }
                }}
                className={`rounded-2xl border transition-colors ${
                  isDragTarget
                    ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-200 dark:ring-brand-800'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40'
                }`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold w-24 text-gray-800 dark:text-gray-100">
                      {day}
                    </span>
                    {isEmpty && !isAdding && !isDragTarget && (
                      <span className="text-xs text-gray-300 dark:text-gray-700 italic">Rest day</span>
                    )}
                    {isDragTarget && isEmpty && (
                      <span className="text-xs text-brand-400 italic">Drop here</span>
                    )}
                    {!isEmpty && (
                      <div className="flex gap-1.5 flex-wrap">
                        {dayItems.filter(i => i.item_type === 'workout').length > 0 && (
                          <span className="text-[10px] font-semibold text-brand-500 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            {dayItems.filter(i => i.item_type === 'workout').length} workout{dayItems.filter(i => i.item_type === 'workout').length > 1 ? 's' : ''}
                          </span>
                        )}
                        {dayItems.filter(i => i.item_type === 'hiit').length > 0 && (
                          <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            HIIT
                          </span>
                        )}
                        {dayItems.filter(i => i.item_type === 'cardio').length > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Cardio
                          </span>
                        )}
                        {dayItems.filter(i => i.item_type === 'rest').map(i => (
                          <span key={i.id} className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            {i.custom_label || 'Rest'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isAdding && (
                    <button
                      onClick={() => {
                        setAddingToDay(day)
                        setAddType('workout')
                        setAddBlock('')
                        setAddDayVariant('')
                        setAddItemId('')
                        setAddCardioText('')
                        setAddRestSubtype('rest')
                      }}
                      className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {/* Assigned items */}
                {dayItems.length > 0 && (
                  <div className="px-4 pb-3 space-y-2">
                    {dayItems.map(item => {
                      const isHiit = item.item_type === 'hiit'
                      const isCardio = item.item_type === 'cardio'
                      const isRest = item.item_type === 'rest'
                      const wktName = workouts.find(w => w.id === item.workout_id)?.name
                      const cs = cardioSessions.find(c => c.id === item.cardio_session_id)
                      const label = isHiit
                        ? (hiitCircuits.find(h => h.id === item.hiit_circuit_id)?.name || 'HIIT')
                        : isCardio
                          ? (item.custom_label || cs?.name || 'Cardio')
                          : isRest
                            ? (item.custom_label || 'Rest Day')
                            : (stripDay(wktName) || wktName || item.custom_label || 'Workout')
                      const isDragging = dragItemId === item.id
                      const isExpanded = expandedItemId === item.id
                      const exercises = item.workout_id ? exerciseDrafts[item.workout_id] : null

                      return (
                        <div key={item.id}>
                          <div
                            draggable={!isCardio && !isRest}
                            onDragStart={e => {
                              if (isCardio || isRest) return
                              setDragItemId(item.id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onDragEnd={() => { setDragItemId(null); setDragOverDay(null) }}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-opacity ${
                              isDragging ? 'opacity-40' : ''
                            } ${!isCardio && !isRest ? 'cursor-grab active:cursor-grabbing' : ''} ${
                              isHiit
                                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40'
                                : isCardio
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'
                                  : isRest
                                    ? 'bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700'
                                    : 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {/* Drag handle (workouts/HIIT only) */}
                              {!isCardio && !isRest && (
                                <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isHiit ? 'text-orange-300' : 'text-brand-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
                                </svg>
                              )}
                              {/* Cardio icon */}
                              {isCardio && (
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              )}
                              {/* Rest icon */}
                              {isRest && (
                                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                              )}
                              {/* Clickable name for workouts */}
                              {!isCardio && !isHiit && !isRest ? (
                                <button
                                  className="text-left flex-1 min-w-0"
                                  onClick={() => toggleExpand(item)}
                                >
                                  <p className="text-sm font-semibold leading-tight text-brand-700 dark:text-brand-300 truncate">
                                    {label}
                                  </p>
                                  <p className="text-[11px] mt-0.5 text-brand-400/80">
                                    Workout {isExpanded ? '▲' : '▼'}
                                  </p>
                                </button>
                              ) : isRest ? (
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold leading-tight truncate text-gray-600 dark:text-gray-300">
                                    {label}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold leading-tight truncate ${
                                    isHiit ? 'text-orange-700 dark:text-orange-300' : 'text-emerald-700 dark:text-emerald-300'
                                  }`}>
                                    {label}
                                  </p>
                                  <p className={`text-[11px] mt-0.5 ${isHiit ? 'text-orange-400/80' : 'text-emerald-500/70'}`}>
                                    {isHiit ? 'HIIT' : cs?.duration_minutes ? `${cs.duration_minutes} min` : 'Cardio'}
                                  </p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1 flex-shrink-0"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Exercise detail panel — editable */}
                          {isExpanded && !isCardio && !isHiit && !isRest && (
                            <div className="mt-1 ml-4 rounded-xl border border-brand-100 dark:border-brand-800/30 bg-brand-50/50 dark:bg-brand-900/10 px-3 py-3">
                              {exercises === undefined ? (
                                <p className="text-xs text-gray-400">Loading…</p>
                              ) : (
                                <div className="space-y-2">
                                  {exercises.length > 0 && (
                                    <div className="flex gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-1 border-b border-brand-100 dark:border-brand-800/30">
                                      <span className="flex-1">Exercise</span>
                                      <span className="w-20 text-center">Variation</span>
                                      <span className="w-12 text-center">Sets</span>
                                      <span className="w-16 text-center">Reps</span>
                                      <span className="w-12 text-center">RPE</span>
                                      <span className="w-5" />
                                    </div>
                                  )}
                                  <datalist id="cwp-exercise-list">
                                    {exerciseLibrary.map(e => <option key={e.id} value={e.name} />)}
                                  </datalist>
                                  {exercises.map((ex, idx) => (
                                    <div key={ex.id || ex._key || idx} className="flex gap-2 items-center">
                                      <input
                                        className="flex-1 input py-1 text-xs"
                                        placeholder="Exercise name"
                                        list="cwp-exercise-list"
                                        value={ex.name}
                                        onChange={e => updateExercise(item.workout_id, idx, 'name', e.target.value)}
                                      />
                                      <select
                                        className="input py-1 text-xs w-20"
                                        value={ex.equipment ?? ''}
                                        onChange={e => updateExercise(item.workout_id, idx, 'equipment', e.target.value || null)}
                                      >
                                        <option value="">Variation…</option>
                                        {EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                      <input
                                        className="input py-1 text-xs w-12 text-center"
                                        type="number"
                                        min={1}
                                        placeholder="Sets"
                                        value={ex.sets ?? ''}
                                        onChange={e => updateExercise(item.workout_id, idx, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                                      />
                                      <input
                                        className="input py-1 text-xs w-16 text-center"
                                        placeholder="Reps"
                                        value={ex.reps ?? ''}
                                        onChange={e => updateExercise(item.workout_id, idx, 'reps', e.target.value)}
                                      />
                                      <input
                                        className="input py-1 text-xs w-12 text-center"
                                        placeholder="RPE"
                                        value={ex.rpe ?? ''}
                                        onChange={e => updateExercise(item.workout_id, idx, 'rpe', e.target.value)}
                                      />
                                      <button
                                        onClick={() => removeExercise(item.workout_id, idx)}
                                        className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 w-5 flex-shrink-0 text-base leading-none"
                                      >×</button>
                                    </div>
                                  ))}
                                  <div className="flex items-center justify-between pt-1">
                                    <button
                                      onClick={() => addExercise(item.workout_id)}
                                      className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add exercise
                                    </button>
                                    <button
                                      onClick={() => saveExercises(item.workout_id)}
                                      disabled={exerciseSaving[item.workout_id]}
                                      className="btn-primary py-1 px-3 text-xs"
                                    >
                                      {exerciseSaving[item.workout_id] ? 'Saving…' : 'Save'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Inline add form */}
                {isAdding && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {/* Type toggle */}
                    <div className="flex gap-2">
                      {['workout', 'hiit', 'cardio', 'rest'].map(type => (
                        <button
                          key={type}
                          onClick={() => { setAddType(type); setAddBlock(''); setAddDayVariant(''); setAddItemId(''); setAddCardioText(''); setAddRestSubtype('rest') }}
                          className={`flex-1 text-sm py-1.5 rounded-lg font-medium capitalize transition-colors ${
                            addType === type
                              ? type === 'workout' ? 'bg-brand-500 text-white'
                                : type === 'hiit' ? 'bg-orange-500 text-white'
                                : type === 'cardio' ? 'bg-emerald-500 text-white'
                                : 'bg-gray-400 dark:bg-gray-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {type === 'hiit' ? 'HIIT' : type === 'rest' ? 'Rest' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>

                    {addType === 'rest' && (
                      <div className="flex gap-2">
                        {['rest', 'active_rest'].map(sub => (
                          <button
                            key={sub}
                            onClick={() => setAddRestSubtype(sub)}
                            className={`flex-1 text-sm py-2 rounded-lg font-medium transition-colors border ${
                              addRestSubtype === sub
                                ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            {sub === 'active_rest' ? 'Active Rest Day' : 'Rest Day'}
                          </button>
                        ))}
                      </div>
                    )}

                    {addType === 'workout' && (
                      <div className="space-y-2">
                        <select
                          className="input w-full"
                          value={addBlock}
                          onChange={e => { setAddBlock(e.target.value); setAddDayVariant(''); setAddItemId('') }}
                        >
                          <option value="">Select block…</option>
                          {addBlockOptions.map(n => <option key={n} value={n}>Block {n}</option>)}
                        </select>
                        {addBlock && (
                          <select
                            className="input w-full"
                            value={addDayVariant}
                            onChange={e => { setAddDayVariant(e.target.value); setAddItemId('') }}
                          >
                            <option value="">Select days…</option>
                            {addDayOptions.map(d => <option key={d} value={d}>{d} Day</option>)}
                          </select>
                        )}
                        {addDayVariant && (
                          <select
                            className="input w-full"
                            value={addItemId}
                            onChange={e => setAddItemId(e.target.value)}
                          >
                            <option value="">Select session…</option>
                            {addSessionOptions.map(s => (
                              <option key={s.id} value={s.workoutId || ''} disabled={!s.workoutId}>{s.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {addType === 'hiit' && (
                      <select className="input w-full" value={addItemId} onChange={e => setAddItemId(e.target.value)}>
                        <option value="">Select a HIIT circuit…</option>
                        {hiitCircuits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                    )}

                    {addType === 'cardio' && (
                      <div className="space-y-2">
                        <input
                          autoFocus
                          className="input w-full"
                          placeholder="e.g. 10k steps, Zone 2 Stairmaster 30 mins…"
                          value={addCardioText}
                          onChange={e => { setAddCardioText(e.target.value); setAddItemId('') }}
                        />
                        {cardioSessions.length > 0 && (
                          <>
                            <p className="text-xs text-gray-400 text-center">— or pick from library —</p>
                            <select
                              className="input w-full"
                              value={addItemId}
                              onChange={e => { setAddItemId(e.target.value); setAddCardioText('') }}
                            >
                              <option value="">Select cardio session…</option>
                              {cardioSessions.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}{c.duration_minutes ? ` — ${c.duration_minutes} min` : ''}
                                </option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (addType === 'rest') {
                            await addRestItem(day, addRestSubtype)
                          } else if (addType === 'cardio') {
                            if (!addCardioText && !addItemId) return
                            await addCardioItem(day, addCardioText || null, addItemId || null)
                          } else {
                            if (!addItemId) return
                            await addItem(day, addType, addItemId)
                          }
                          setAddingToDay(null)
                          setAddBlock('')
                          setAddDayVariant('')
                          setAddItemId('')
                          setAddCardioText('')
                          setAddRestSubtype('rest')
                        }}
                        disabled={addType !== 'rest' && (addType === 'cardio' ? (!addCardioText && !addItemId) : !addItemId) || saving}
                        className="btn-primary text-sm"
                      >
                        Add to {day}
                      </button>
                      <button
                        onClick={() => { setAddingToDay(null); setAddBlock(''); setAddDayVariant(''); setAddItemId(''); setAddCardioText(''); setAddRestSubtype('rest') }}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
