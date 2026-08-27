import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const EQUIPMENT_OPTIONS = ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Smith Machine', 'Pec Deck', 'EZ Bar', 'Straight Bar', 'Kettlebell', 'Bodyweight', 'Band', 'Other']

function ExRow({ ex, idx, total, onChange, onRemove, onMoveUp, onMoveDown, library }) {
  const [expanded, setExpanded] = useState(false)

  function handleNameChange(val) {
    onChange('name', val)
    const match = library.find(l => l.name.toLowerCase() === val.toLowerCase())
    if (match) {
      if (match.default_rest_seconds && !ex.rest_seconds) onChange('rest_seconds', match.default_rest_seconds)
      if (match.tempo && !ex.tempo) onChange('tempo', match.tempo)
      if (match.id) onChange('exercise_id', match.id)
      if (match.equipment && !ex.equipment) onChange('equipment', match.equipment)
    }
  }

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-900">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button type="button" onClick={onMoveUp} disabled={idx === 0}
            className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={idx === total - 1}
            className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        <input
          className="flex-1 input py-1.5 text-sm"
          placeholder="Exercise name"
          list="we-exercise-list"
          value={ex.name}
          onChange={e => handleNameChange(e.target.value)}
        />
        <select
          className="input py-1.5 text-sm w-32"
          value={ex.equipment ?? ''}
          onChange={e => onChange('equipment', e.target.value || null)}
        >
          <option value="">Variation…</option>
          {EQUIPMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <input className="input py-1.5 text-sm w-14 text-center" type="number" min={1} placeholder="Sets"
          value={ex.sets ?? ''} onChange={e => onChange('sets', e.target.value ? parseInt(e.target.value) : null)} />
        <input className="input py-1.5 text-sm w-20 text-center" placeholder="Reps"
          value={ex.reps ?? ''} onChange={e => onChange('reps', e.target.value)} />
        <input className="input py-1.5 text-sm w-16 text-center" placeholder="RPE"
          value={ex.rpe ?? ''} onChange={e => onChange('rpe', e.target.value)} />
        <button type="button" onClick={() => setExpanded(o => !o)}
          className={`flex-shrink-0 transition-colors ${expanded ? 'text-brand-500' : 'text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500'}`}
          title="Extra fields">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        </button>
        <button type="button" onClick={onRemove}
          className="flex-shrink-0 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 text-xl leading-none">×</button>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 px-3 pb-3 pt-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Tempo</label>
            <input className="input w-full py-1.5 text-sm" placeholder="e.g. 3010" value={ex.tempo ?? ''} onChange={e => onChange('tempo', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Rest (seconds)</label>
            <input type="number" min={0} className="input w-full py-1.5 text-sm" placeholder="e.g. 90" value={ex.rest_seconds ?? ''} onChange={e => onChange('rest_seconds', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Notes</label>
            <input className="input w-full py-1.5 text-sm" placeholder="Coaching notes for this exercise…" value={ex.notes ?? ''} onChange={e => onChange('notes', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkoutEditor() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [library, setLibrary] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [showExSearch, setShowExSearch] = useState(false)
  const searchRef = useRef(null)

  async function load() {
    const [{ data: w }, { data: exs }, { data: lib }] = await Promise.all([
      supabase.from('workouts').select('*').eq('id', workoutId).eq('coach_id', profile.id).single(),
      supabase.from('workout_exercises').select('*').eq('workout_id', workoutId).order('order_index'),
      supabase.from('exercises').select('id, name, primary_muscle, equipment').eq('coach_id', profile.id).eq('is_archived', false).order('name'),
    ])
    if (!w) { navigate('/coach/workouts'); return }
    setWorkout(w)
    setExercises((exs || []).map(ex => ({ ...ex, _key: ex.id })))
    setLibrary(lib || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [workoutId])

  const exSearchResults = exSearch.length > 1
    ? library.filter(e => e.name.toLowerCase().includes(exSearch.toLowerCase())).slice(0, 8)
    : []

  function addExercise(libEx) {
    setExercises(prev => [...prev, {
      _key: Math.random().toString(36).slice(2),
      exercise_id: libEx?.id || null,
      name: libEx?.name || '',
      equipment: libEx?.equipment || null,
      sets: null, reps: '', rpe: '', tempo: '', rest_seconds: null, notes: '',
    }])
    setExSearch('')
    setShowExSearch(false)
  }

  function updateEx(idx, field, value) {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex))
  }

  function removeEx(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  function moveUp(idx) {
    if (idx === 0) return
    setExercises(prev => { const a = [...prev]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; return a })
  }

  function moveDown(idx) {
    setExercises(prev => {
      if (idx >= prev.length - 1) return prev
      const a = [...prev]; [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]]; return a
    })
  }

  async function save() {
    if (!workout) return
    setSaving(true)
    await supabase.from('workouts').update({
      name: workout.name.trim() || 'Workout',
      description: workout.description,
      warmup: workout.warmup,
      cooldown: workout.cooldown,
    }).eq('id', workoutId)

    await supabase.from('workout_exercises').delete().eq('workout_id', workoutId)
    if (exercises.length > 0) {
      await supabase.from('workout_exercises').insert(
        exercises.map((ex, i) => ({
          workout_id: workoutId,
          exercise_id: ex.exercise_id || null,
          order_index: i,
          name: ex.name.trim() || 'Exercise',
          equipment: ex.equipment || null,
          sets: ex.sets ?? null,
          reps: ex.reps?.trim() || null,
          rpe: ex.rpe?.trim() || null,
          tempo: ex.tempo?.trim() || null,
          rest_seconds: ex.rest_seconds ?? null,
          notes: ex.notes?.trim() || null,
        }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/coach/workouts')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Workout library
        </button>
      </div>

      {/* Name */}
      <input
        className="text-2xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
        placeholder="Workout name"
        value={workout.name}
        onChange={e => setWorkout(w => ({ ...w, name: e.target.value }))}
      />

      {/* Description / Warmup / Cooldown */}
      <div className="card space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description (optional)</label>
          <input className="input w-full text-sm" placeholder="Brief description…" value={workout.description || ''}
            onChange={e => setWorkout(w => ({ ...w, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Warm-up</label>
            <textarea rows={2} className="input w-full text-sm resize-none" placeholder="Warm-up instructions…"
              value={workout.warmup || ''} onChange={e => setWorkout(w => ({ ...w, warmup: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Cool-down</label>
            <textarea rows={2} className="input w-full text-sm resize-none" placeholder="Cool-down instructions…"
              value={workout.cooldown || ''} onChange={e => setWorkout(w => ({ ...w, cooldown: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pl-10 flex-1">
            <span className="flex-1">Exercise</span>
            <span className="w-32 text-center">Variation</span>
            <span className="w-14 text-center">Sets</span>
            <span className="w-20 text-center">Reps</span>
            <span className="w-16 text-center">RPE</span>
            <span className="w-8" />
          </div>
        </div>

        <datalist id="we-exercise-list">
          {library.map(l => <option key={l.id} value={l.name} />)}
        </datalist>

        {exercises.map((ex, i) => (
          <ExRow
            key={ex._key || ex.id || i}
            ex={ex}
            idx={i}
            total={exercises.length}
            library={library}
            onChange={(field, value) => updateEx(i, field, value)}
            onRemove={() => removeEx(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}

        {/* Add exercise */}
        <div className="relative">
          {showExSearch ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 p-2">
                <input
                  ref={searchRef}
                  autoFocus
                  className="input flex-1 text-sm py-1.5"
                  placeholder="Search exercise library or type a name…"
                  value={exSearch}
                  onChange={e => setExSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && exSearch.trim()) addExercise({ id: null, name: exSearch.trim() })
                    if (e.key === 'Escape') { setShowExSearch(false); setExSearch('') }
                  }}
                />
                <button onClick={() => { setShowExSearch(false); setExSearch('') }}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              {exSearchResults.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {exSearchResults.map(ex => (
                    <button key={ex.id} onClick={() => addExercise(ex)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ex.name}</span>
                      {ex.primary_muscle && <span className="text-xs text-gray-400">{ex.primary_muscle}</span>}
                      {ex.equipment && <span className="text-xs text-gray-400 ml-auto">{ex.equipment}</span>}
                    </button>
                  ))}
                </div>
              )}
              {exSearch.trim() && exSearchResults.length === 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <button onClick={() => addExercise({ id: null, name: exSearch.trim() })}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-brand-600 dark:text-brand-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add "{exSearch}" as custom exercise
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowExSearch(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors inline-flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add exercise
            </button>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        <button onClick={save} disabled={saving} className="btn-primary py-2 px-6 text-sm">
          {saving ? 'Saving…' : 'Save workout'}
        </button>
      </div>
    </div>
  )
}
