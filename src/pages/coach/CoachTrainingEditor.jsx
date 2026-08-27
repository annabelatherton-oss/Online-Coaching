import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Pec Deck', 'EZ Bar', 'Straight Bar', 'Kettlebell', 'Bodyweight', 'Band', 'Other']

function parseDayLabel(name) {
  for (const day of WEEK_DAYS) {
    if (name === day) return { day, label: '' }
    if (name.startsWith(day + ' ') || name.startsWith(day + '—')) {
      return { day, label: name.slice(day.length).replace(/^[\s–—\-]+/, '').trim() }
    }
  }
  return { day: null, label: name }
}

function buildName(day, label) {
  if (!day) return label || 'Session'
  return label.trim() ? `${day} — ${label.trim()}` : day
}

function ExerciseRow({ exercise, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, library }) {
  const hasMedia = !!(exercise.illustration_url || exercise.video_url)
  const [mediaOpen, setMediaOpen] = useState(hasMedia)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `exercise-illustrations/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('exercise-media').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('exercise-media').getPublicUrl(path)
      onChange('illustration_url', publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="group">
      <div className="flex items-start gap-2 py-2">
        <div className="flex flex-col gap-0.5 mt-2 flex-shrink-0">
          <button type="button" onClick={onMoveUp} disabled={isFirst}
            className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast}
            className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <input
          className="flex-1 input py-1.5 text-sm"
          placeholder="Exercise name"
          list="cte-exercise-list"
          value={exercise.name}
          onChange={e => onChange('name', e.target.value)}
        />

        <select
          className="input py-1.5 text-sm w-32"
          value={exercise.equipment ?? ''}
          onChange={e => onChange('equipment', e.target.value || null)}
        >
          <option value="">Variation…</option>
          {EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>

        <input className="input py-1.5 text-sm w-14 text-center" placeholder="Sets" type="number" min={1}
          value={exercise.sets ?? ''} onChange={e => onChange('sets', e.target.value ? parseInt(e.target.value) : null)} />
        <input className="input py-1.5 text-sm w-20 text-center" placeholder="Reps"
          value={exercise.reps ?? ''} onChange={e => onChange('reps', e.target.value)} />
        <input className="input py-1.5 text-sm w-16 text-center" placeholder="RPE"
          value={exercise.rpe ?? ''} onChange={e => onChange('rpe', e.target.value)} />

        <button
          type="button"
          onClick={() => setMediaOpen(o => !o)}
          title="Add illustration / video"
          className={`mt-1.5 flex-shrink-0 transition-colors ${hasMedia || mediaOpen ? 'text-brand-500 dark:text-brand-400' : 'text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button type="button" onClick={onRemove}
          className="mt-1.5 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 flex-shrink-0 text-xl leading-none">
          ×
        </button>
      </div>

      {mediaOpen && (
        <div className="flex items-start gap-4 pl-5 pb-3 -mt-1">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
              title="Upload illustration"
            >
              {exercise.illustration_url ? (
                <img src={exercise.illustration_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
            <div className="space-y-1">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 block font-medium disabled:opacity-50">
                {uploading ? 'Uploading…' : exercise.illustration_url ? 'Replace' : 'Upload image'}
              </button>
              {exercise.illustration_url && (
                <button type="button" onClick={() => onChange('illustration_url', null)}
                  className="text-xs text-red-400 hover:text-red-600 block">Remove</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-400 dark:text-gray-500 block mb-1">Video URL (optional)</label>
            <input
              type="url"
              placeholder="https://…"
              value={exercise.video_url ?? ''}
              onChange={e => onChange('video_url', e.target.value || null)}
              className="input w-full text-sm py-1.5"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onDelete, occupiedDays, library }) {
  const parsed = parseDayLabel(session.name)
  const [day, setDay] = useState(parsed.day || '')
  const [label, setLabel] = useState(parsed.label)
  const [exercises, setExercises] = useState(session.exercises || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(true)

  function addExercise() {
    setExercises(prev => [...prev, { _key: Math.random().toString(36).slice(2), name: '', sets: null, reps: '', rpe: '', notes: '', equipment: null, illustration_url: null, video_url: null }])
  }

  function update(idx, field, value) {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  function remove(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  function moveUp(idx) {
    if (idx === 0) return
    setExercises(prev => { const arr = [...prev]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; return arr })
  }

  function moveDown(idx) {
    setExercises(prev => {
      if (idx >= prev.length - 1) return prev
      const arr = [...prev]; [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; return arr
    })
  }

  async function save() {
    setSaving(true)
    const name = buildName(day, label)
    await supabase.from('training_sessions').update({ name }).eq('id', session.id)
    await supabase.from('session_exercises').delete().eq('session_id', session.id)
    if (exercises.length > 0) {
      await supabase.from('session_exercises').insert(
        exercises.map((ex, i) => ({
          session_id: session.id,
          order_index: i,
          name: ex.name.trim() || 'Exercise',
          sets: ex.sets ?? null,
          reps: ex.reps?.trim() || null,
          rpe: ex.rpe?.trim() || null,
          rest_seconds: ex.rest_seconds || null,
          notes: ex.notes?.trim() || null,
          equipment: ex.equipment || null,
          illustration_url: ex.illustration_url ?? null,
          video_url: ex.video_url ?? null,
        }))
      )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <select
          value={day}
          onChange={e => setDay(e.target.value)}
          className="input text-sm py-1.5 flex-shrink-0 w-32"
        >
          {WEEK_DAYS.map(d => (
            <option key={d} value={d} disabled={d !== day && occupiedDays.has(d)}>{d}</option>
          ))}
        </select>

        <input
          className="flex-1 input py-1.5 text-sm font-medium"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Session name, e.g. Upper Body A"
        />

        <button
          type="button"
          onClick={() => setExpanded(x => !x)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0 px-2 py-1 rounded"
          title={expanded ? 'Collapse' : 'Expand exercises'}
        >
          {exercises.length > 0 ? `${exercises.length} ex` : 'Exercises'}
          <span className="ml-1">{expanded ? '▲' : '▼'}</span>
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary py-1.5 px-3 text-sm flex-shrink-0"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>

        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 flex-shrink-0 p-1"
          title="Delete session"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Exercises */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-3">
          {exercises.length > 0 && (
            <div className="pt-2">
              <div className="flex gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1 pl-5">
                <span className="flex-1">Exercise</span>
                <span className="w-32 text-center">Variation</span>
                <span className="w-14 text-center">Sets</span>
                <span className="w-20 text-center">Reps</span>
                <span className="w-16 text-center">RPE</span>
                <span className="w-4" />
              </div>
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={ex.id || ex._key || i}
                  exercise={ex}
                  library={library}
                  onChange={(field, value) => update(i, field, value)}
                  onRemove={() => remove(i)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                  isFirst={i === 0}
                  isLast={i === exercises.length - 1}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addExercise}
            className="mt-2 text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add exercise
          </button>
        </div>
      )}
    </div>
  )
}

const DAY_RANK = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }

function sessionDayRank(name) {
  for (const [day, rank] of Object.entries(DAY_RANK)) {
    if (name?.startsWith(day)) return rank
  }
  return 999
}

export default function CoachTrainingEditor() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [addingSession, setAddingSession] = useState(false)
  const [addDay, setAddDay] = useState(null)
  const [addLabel, setAddLabel] = useState('')
  const [addCopyFrom, setAddCopyFrom] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [topLifts, setTopLifts] = useState([])
  const [savingLifts, setSavingLifts] = useState(false)
  const [liftsSaved, setLiftsSaved] = useState(false)
  const [exerciseNames, setExerciseNames] = useState([])
  const [exerciseRepsMap, setExerciseRepsMap] = useState({})
  const [exerciseLibrary, setExerciseLibrary] = useState([])

  async function loadProgram() {
    const { data } = await supabase
      .from('training_programs')
      .select('*')
      .eq('id', programId)
      .eq('coach_id', profile.id)
      .single()
    if (!data) { navigate('/coach/training'); return }
    setProgram(data)
    setNewName(data.name)
    setTopLifts(data.top_lifts || [])
    setLoading(false)
    loadExerciseNames()
    loadLibrary()
  }

  async function loadLibrary() {
    const { data } = await supabase
      .from('exercises')
      .select('id, name, primary_muscle')
      .eq('coach_id', profile.id)
      .eq('is_archived', false)
      .order('name')
    setExerciseLibrary(data || [])
  }

  async function loadExerciseNames() {
    const { data } = await supabase
      .from('training_sessions')
      .select('session_exercises(name, reps)')
      .eq('program_id', programId)
    const all = (data || []).flatMap(s => s.session_exercises || []).filter(e => e.name)
    const names = [...new Set(all.map(e => e.name))].sort()
    const repsMap = {}
    all.forEach(e => { if (e.name && e.reps && !repsMap[e.name]) repsMap[e.name] = e.reps })
    setExerciseNames(names)
    setExerciseRepsMap(repsMap)
  }

  function parseRepRange(repsStr) {
    if (!repsStr) return { reps_min: '', reps_max: '' }
    const range = repsStr.match(/(\d+)\s*[-–]\s*(\d+)/)
    if (range) return { reps_min: parseInt(range[1]), reps_max: parseInt(range[2]) }
    const single = repsStr.match(/(\d+)/)
    if (single) return { reps_min: parseInt(single[1]), reps_max: parseInt(single[1]) }
    return { reps_min: '', reps_max: '' }
  }

  async function loadSessions() {
    setLoadingSessions(true)
    const { data } = await supabase
      .from('training_sessions')
      .select('*, session_exercises(*)')
      .eq('program_id', programId)
      .eq('week_number', 1)
      .order('order_index')
    setSessions((data || []).map(s => ({
      ...s,
      exercises: (s.session_exercises || []).sort((a, b) => a.order_index - b.order_index),
    })).sort((a, b) => sessionDayRank(a.name) - sessionDayRank(b.name)))
    setLoadingSessions(false)
  }

  useEffect(() => { loadProgram() }, [programId])
  useEffect(() => { if (program) { loadSessions(); loadExerciseNames() } }, [program])

  function openAddForm(day) {
    setAddDay(day)
    setAddLabel('')
    setAddCopyFrom('')
  }

  async function confirmAddSession() {
    if (!addDay) return
    const name = buildName(addDay, addLabel)
    setAddingSession(true)
    const { data: newSess } = await supabase
      .from('training_sessions')
      .insert({ program_id: programId, week_number: 1, order_index: sessions.length, name })
      .select('*')
      .single()

    let exercises = []
    if (addCopyFrom && newSess) {
      const src = sessions.find(s => s.id === addCopyFrom)
      if (src?.exercises?.length) {
        await supabase.from('session_exercises').insert(
          src.exercises.map((ex, i) => ({
            session_id: newSess.id, order_index: i, name: ex.name, sets: ex.sets,
            reps: ex.reps, rpe: ex.rpe, rest_seconds: ex.rest_seconds, notes: ex.notes,
            equipment: ex.equipment, illustration_url: ex.illustration_url, video_url: ex.video_url,
          }))
        )
        exercises = src.exercises.map(ex => ({ ...ex, _key: Math.random().toString(36).slice(2) }))
      }
    }

    if (newSess) {
      setSessions(prev =>
        [...prev, { ...newSess, exercises }]
          .sort((a, b) => sessionDayRank(a.name) - sessionDayRank(b.name))
      )
    }
    setAddDay(null)
    setAddingSession(false)
  }

  async function deleteSession(sessionId) {
    if (!confirm('Delete this session and all its exercises?')) return
    await supabase.from('training_sessions').delete().eq('id', sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  async function saveName() {
    if (!newName.trim()) return
    await supabase.from('training_programs').update({ name: newName.trim() }).eq('id', programId)
    setProgram(p => ({ ...p, name: newName.trim() }))
    setEditingName(false)
  }

  function addLift() {
    setTopLifts(prev => [...prev, { name: '', reps_min: '', reps_max: '', weight_increment: '' }])
  }

  function removeLift(i) {
    setTopLifts(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateLift(i, field, value) {
    setTopLifts(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  async function saveTopLifts() {
    setSavingLifts(true)
    const cleaned = topLifts
      .filter(l => l.name?.trim())
      .map(l => ({
        name: l.name.trim(),
        reps_min: l.reps_min !== '' && l.reps_min != null ? parseInt(l.reps_min) : null,
        reps_max: l.reps_max !== '' && l.reps_max != null ? parseInt(l.reps_max) : null,
        weight_increment: l.weight_increment !== '' && l.weight_increment != null ? parseFloat(l.weight_increment) : null,
      }))
    await supabase.from('training_programs').update({ top_lifts: cleaned }).eq('id', programId)
    setProgram(p => ({ ...p, top_lifts: cleaned }))
    setSavingLifts(false)
    setLiftsSaved(true)
    setTimeout(() => setLiftsSaved(false), 2500)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // Build day → session map
  const sessionsByDay = {}
  const occupiedDays = new Set()
  for (const s of sessions) {
    const { day } = parseDayLabel(s.name)
    if (day) { sessionsByDay[day] = s; occupiedDays.add(day) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate('/coach/training')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to programmes
          </button>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                className="input text-xl font-bold py-1"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              />
              <button onClick={saveName} className="btn-primary py-1.5 px-3 text-sm">Save</button>
              <button onClick={() => setEditingName(false)} className="text-sm text-gray-400">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="text-left group">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {program.name}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Click to rename</p>
            </button>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{program.weeks_total ?? 12} week block</p>
        </div>
      </div>

      {/* Top 3 Lifts */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top 3 Lifts</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Progressive overload tracking shown to clients on check-in</p>
          </div>
          <div className="flex items-center gap-2">
            {liftsSaved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
            <button type="button" onClick={saveTopLifts} disabled={savingLifts} className="btn-primary py-1.5 px-3 text-sm">
              {savingLifts ? 'Saving…' : 'Save lifts'}
            </button>
          </div>
        </div>

        {topLifts.length > 0 && (
          <div className="space-y-2">
            <div className="flex gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium">
              <span className="flex-1">Exercise</span>
              <span className="w-32 text-center">Rep range (min–max)</span>
              <span className="w-20 text-center">+kg step</span>
              <span className="w-4" />
            </div>
            {topLifts.map((lift, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  className="flex-1 input py-1.5 text-sm"
                  value={lift.name ?? ''}
                  onChange={e => {
                    const name = e.target.value
                    const parsed = parseRepRange(exerciseRepsMap[name])
                    setTopLifts(prev => prev.map((l, idx) => idx === i ? { ...l, name, ...parsed } : l))
                  }}
                >
                  <option value="">Select exercise</option>
                  {exerciseNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 w-32">
                  <input className="input py-1.5 text-sm w-12 text-center" type="number" min={1} placeholder="6"
                    value={lift.reps_min ?? ''} onChange={e => updateLift(i, 'reps_min', e.target.value)} />
                  <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                  <input className="input py-1.5 text-sm w-12 text-center" type="number" min={1} placeholder="8"
                    value={lift.reps_max ?? ''} onChange={e => updateLift(i, 'reps_max', e.target.value)} />
                </div>
                <input className="input py-1.5 text-sm w-20 text-center" type="number" min={0.5} step={0.5} placeholder="5"
                  value={lift.weight_increment ?? ''} onChange={e => updateLift(i, 'weight_increment', e.target.value)} />
                <button type="button" onClick={() => removeLift(i)}
                  className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 text-xl leading-none w-4 flex-shrink-0">×</button>
              </div>
            ))}
          </div>
        )}

        {topLifts.length < 3 && (
          <button type="button" onClick={addLift}
            className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add lift
          </button>
        )}
      </div>

      {/* Mon–Sun session grid */}
      {loadingSessions ? (
        <LoadingSpinner size="md" className="py-8" />
      ) : (
        <div className="space-y-2">
          <datalist id="cte-exercise-list">
            {exerciseLibrary.map(e => <option key={e.id} value={e.name} />)}
          </datalist>

          {WEEK_DAYS.map(day => {
            const session = sessionsByDay[day]

            if (session) {
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={deleteSession}
                  occupiedDays={occupiedDays}
                  library={exerciseLibrary}
                />
              )
            }

            // Rest row
            if (addDay === day) {
              return (
                <div key={day} className="rounded-2xl border border-brand-200 dark:border-brand-700 bg-brand-50/30 dark:bg-brand-900/10 px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400 w-32 flex-shrink-0">{day}</span>
                    <input
                      autoFocus
                      className="flex-1 input py-1.5 text-sm"
                      placeholder="Session name, e.g. Glutes and Hamstrings"
                      value={addLabel}
                      onChange={e => setAddLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmAddSession(); if (e.key === 'Escape') setAddDay(null) }}
                    />
                  </div>
                  {sessions.length > 0 && (
                    <div className="flex items-center gap-2 pl-[8.5rem]">
                      <span className="text-xs text-gray-400 flex-shrink-0">Copy from:</span>
                      <select
                        className="input py-1 text-sm flex-1"
                        value={addCopyFrom}
                        onChange={e => setAddCopyFrom(e.target.value)}
                      >
                        <option value="">— none —</option>
                        {sessions.map(s => {
                          const { label } = parseDayLabel(s.name)
                          return <option key={s.id} value={s.id}>{label || s.name}</option>
                        })}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pl-[8.5rem]">
                    <button
                      type="button"
                      onClick={confirmAddSession}
                      disabled={addingSession}
                      className="btn-primary py-1.5 px-3 text-sm"
                    >
                      {addingSession ? 'Adding…' : 'Add session'}
                    </button>
                    <button type="button" onClick={() => setAddDay(null)} className="text-sm text-gray-400 hover:text-gray-600">
                      Cancel
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={day} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 dark:text-gray-600 w-32 flex-shrink-0">{day}</span>
                <span className="text-xs text-gray-300 dark:text-gray-700 italic flex-1">Rest</span>
                <button
                  type="button"
                  onClick={() => openAddForm(day)}
                  className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                >
                  + Add session
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
