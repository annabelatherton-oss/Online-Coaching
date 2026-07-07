import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function ExerciseRow({ exercise, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="flex items-start gap-2 py-2 group">
      <div className="flex flex-col gap-0.5 mt-2 flex-shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="text-gray-200 hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-400 disabled:opacity-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <input
        className="flex-1 input py-1.5 text-sm"
        placeholder="Exercise name"
        value={exercise.name}
        onChange={e => onChange('name', e.target.value)}
      />
      <input
        className="input py-1.5 text-sm w-14 text-center"
        placeholder="Sets"
        type="number"
        min={1}
        value={exercise.sets ?? ''}
        onChange={e => onChange('sets', e.target.value ? parseInt(e.target.value) : null)}
      />
      <input
        className="input py-1.5 text-sm w-20 text-center"
        placeholder="Reps"
        value={exercise.reps ?? ''}
        onChange={e => onChange('reps', e.target.value)}
      />
      <input
        className="input py-1.5 text-sm w-16 text-center"
        placeholder="RPE"
        value={exercise.rpe ?? ''}
        onChange={e => onChange('rpe', e.target.value)}
      />
      <button
        type="button"
        onClick={onRemove}
        className="mt-1.5 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 flex-shrink-0 text-xl leading-none"
      >×</button>
    </div>
  )
}

function SessionCard({ session, onDelete }) {
  const [name, setName] = useState(session.name)
  const [exercises, setExercises] = useState(session.exercises || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addExercise() {
    setExercises(prev => [...prev, { _key: Math.random().toString(36).slice(2), name: '', sets: null, reps: '', rpe: '', notes: '' }])
  }

  function update(idx, field, value) {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  function remove(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  function moveUp(idx) {
    if (idx === 0) return
    setExercises(prev => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
  }

  function moveDown(idx) {
    setExercises(prev => {
      if (idx >= prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
  }

  async function save() {
    setSaving(true)
    await supabase.from('training_sessions').update({ name: name.trim() || 'Session' }).eq('id', session.id)
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
        }))
      )
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <input
          className="flex-1 input py-1.5 text-sm font-medium"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Session name, e.g. Upper Body A"
        />
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="text-sm text-red-400 hover:text-red-600 flex-shrink-0"
        >
          Delete
        </button>
      </div>

      {exercises.length > 0 && (
        <div className="border-t border-gray-50 dark:border-gray-800 pt-2">
          <div className="flex gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1 pl-5">
            <span className="flex-1">Exercise</span>
            <span className="w-14 text-center">Sets</span>
            <span className="w-20 text-center">Reps</span>
            <span className="w-16 text-center">RPE</span>
            <span className="w-4" />
          </div>
          {exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id || ex._key || i}
              exercise={ex}
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

      <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-800">
        <button
          type="button"
          onClick={addExercise}
          className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add exercise
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoachTrainingEditor() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [addingSession, setAddingSession] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')

  async function loadProgram() {
    const { data } = await supabase
      .from('training_programs')
      .select('*')
      .eq('id', programId)
      .eq('coach_id', profile.id)
      .single()
    if (!data) { navigate('/coach/training'); return }
    setProgram(data)
    setSelectedWeek(data.current_week)
    setNewName(data.name)
    setLoading(false)
  }

  async function loadSessions(week) {
    setLoadingSessions(true)
    const { data } = await supabase
      .from('training_sessions')
      .select('*, session_exercises(*)')
      .eq('program_id', programId)
      .eq('week_number', week)
      .order('order_index')
    setSessions((data || []).map(s => ({
      ...s,
      exercises: (s.session_exercises || []).sort((a, b) => a.order_index - b.order_index),
    })))
    setLoadingSessions(false)
  }

  useEffect(() => { loadProgram() }, [programId])
  useEffect(() => { if (program) loadSessions(selectedWeek) }, [selectedWeek, program])

  async function addSession() {
    setAddingSession(true)
    const { data } = await supabase
      .from('training_sessions')
      .insert({
        program_id: programId,
        week_number: selectedWeek,
        order_index: sessions.length,
        name: `Session ${sessions.length + 1}`,
      })
      .select('*')
      .single()
    if (data) setSessions(prev => [...prev, { ...data, exercises: [] }])
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

  async function updateCurrentWeek(week) {
    await supabase.from('training_programs').update({ current_week: week }).eq('id', programId)
    setProgram(p => ({ ...p, current_week: week }))
  }

  async function copyFromWeek(sourceWeek) {
    if (!confirm(`Copy all sessions from Week ${sourceWeek} to Week ${selectedWeek}? Any existing sessions in Week ${selectedWeek} will be replaced.`)) return
    const { data: source } = await supabase
      .from('training_sessions')
      .select('*, session_exercises(*)')
      .eq('program_id', programId)
      .eq('week_number', sourceWeek)
      .order('order_index')

    if (!source?.length) { alert(`Week ${sourceWeek} has no sessions to copy.`); return }

    await supabase.from('training_sessions').delete().eq('program_id', programId).eq('week_number', selectedWeek)

    for (const s of source) {
      const { data: newSess } = await supabase.from('training_sessions').insert({
        program_id: programId,
        week_number: selectedWeek,
        order_index: s.order_index,
        name: s.name,
      }).select('id').single()
      if (newSess && s.session_exercises?.length) {
        await supabase.from('session_exercises').insert(
          s.session_exercises.map(ex => ({
            session_id: newSess.id,
            order_index: ex.order_index,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rpe: ex.rpe,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
          }))
        )
      }
    }
    loadSessions(selectedWeek)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

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
          <p className="text-sm text-gray-500 dark:text-gray-400">{program.weeks_total} weeks</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-xs text-gray-400">Current week:</span>
            <select
              className="input py-0.5 text-sm w-24"
              value={program.current_week}
              onChange={e => updateCurrentWeek(parseInt(e.target.value))}
            >
              {Array.from({ length: program.weeks_total }, (_, i) => (
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from({ length: program.weeks_total }, (_, i) => i + 1).map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedWeek === w
                  ? 'bg-brand-500 text-white'
                  : w === program.current_week
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-700'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300'
              }`}
            >
              {w}
              {w === program.current_week && <span className="ml-1 text-[10px] opacity-60">●</span>}
            </button>
          ))}
        </div>
        {selectedWeek > 1 && (
          <button
            onClick={() => copyFromWeek(selectedWeek - 1)}
            className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 whitespace-nowrap transition-colors"
          >
            ← Copy week {selectedWeek - 1}
          </button>
        )}
      </div>

      {/* Sessions */}
      {loadingSessions ? (
        <LoadingSpinner size="md" className="py-8" />
      ) : (
        <div className="space-y-4">
          {sessions.length === 0 && (
            <div className="card text-center py-10">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No sessions for Week {selectedWeek} yet.</p>
              {selectedWeek > 1 && (
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Use "← Copy week {selectedWeek - 1}" above to duplicate a previous week's sessions.
                </p>
              )}
            </div>
          )}

          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={deleteSession}
            />
          ))}

          <button
            onClick={addSession}
            disabled={addingSession}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors"
          >
            {addingSession ? 'Adding…' : '+ Add session'}
          </button>
        </div>
      )}
    </div>
  )
}
