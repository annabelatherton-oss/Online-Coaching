import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function WorkoutLibrary() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_exercises(id)')
      .eq('coach_id', profile.id)
      .eq('is_archived', false)
      .order('name')
    setWorkouts((data || []).map(w => ({ ...w, exercise_count: w.workout_exercises?.length || 0 })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createWorkout() {
    const { data } = await supabase.from('workouts').insert({
      coach_id: profile.id,
      name: 'New Workout',
    }).select('id').single()
    if (data) navigate(`/coach/workouts/${data.id}`)
  }

  async function duplicate(workout) {
    const { data: newW } = await supabase.from('workouts').insert({
      coach_id: profile.id,
      name: `${workout.name} (copy)`,
      description: workout.description,
      warmup: workout.warmup,
      cooldown: workout.cooldown,
    }).select('id').single()
    if (!newW) return

    const { data: exs } = await supabase.from('workout_exercises').select('*').eq('workout_id', workout.id).order('order_index')
    if (exs?.length) {
      await supabase.from('workout_exercises').insert(exs.map(ex => ({
        workout_id: newW.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        tempo: ex.tempo,
        rest_seconds: ex.rest_seconds,
        rpe: ex.rpe,
        notes: ex.notes,
      })))
    }
    navigate(`/coach/workouts/${newW.id}`)
  }

  async function archive(workout) {
    if (!confirm(`Archive "${workout.name}"? It won't appear in the library but the data is preserved.`)) return
    await supabase.from('workouts').update({ is_archived: true }).eq('id', workout.id)
    load()
  }

  async function importFromBlocks() {
    setImporting(true)
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('id, name, program_id, training_programs(name), session_exercises(*)')

    const existingNames = new Set(workouts.map(w => w.name.toLowerCase()))
    const processed = new Map()

    for (const session of sessions || []) {
      const key = `${session.program_id}::${session.name}`
      if (processed.has(key)) {
        const workoutId = processed.get(key)
        await supabase.from('training_sessions').update({ workout_id: workoutId }).eq('id', session.id)
        continue
      }

      const workoutName = session.name
      const alreadyExists = existingNames.has(workoutName.toLowerCase())
      let workoutId = null

      if (!alreadyExists) {
        const { data: newW } = await supabase.from('workouts').insert({
          coach_id: profile.id,
          name: workoutName,
          description: session.training_programs?.name ? `From ${session.training_programs.name}` : null,
        }).select('id').single()

        workoutId = newW?.id
        if (workoutId && session.session_exercises?.length) {
          await supabase.from('workout_exercises').insert(
            session.session_exercises
              .sort((a, b) => a.order_index - b.order_index)
              .map((ex, i) => ({
                workout_id: workoutId,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rpe: ex.rpe,
                rest_seconds: ex.rest_seconds,
                notes: ex.notes,
                order_index: i,
              }))
          )
        }
      } else {
        const existing = workouts.find(w => w.name.toLowerCase() === workoutName.toLowerCase())
        workoutId = existing?.id
      }

      if (workoutId) {
        processed.set(key, workoutId)
        await supabase.from('training_sessions').update({ workout_id: workoutId }).eq('id', session.id)
      }
    }

    await load()
    setImporting(false)
    setImportDone(true)
    setTimeout(() => setImportDone(false), 3000)
  }

  const filtered = workouts.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || (w.description || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{workouts.length} workout{workouts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={importFromBlocks} disabled={importing}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors inline-flex items-center gap-1.5">
            {importing ? 'Importing…' : importDone ? '✓ Imported' : 'Import from training blocks'}
          </button>
          <button onClick={createWorkout} className="btn-primary py-1.5 px-4 text-sm">
            + New workout
          </button>
        </div>
      </div>

      {workouts.length > 0 && (
        <input
          className="input text-sm py-1.5 w-64"
          placeholder="Search workouts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {filtered.length === 0 && (
        <div className="card text-center py-16">
          {workouts.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No workouts yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Click "Import from training blocks" to convert your existing programmes into reusable workouts, or create one from scratch.
              </p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No workouts match your search.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(workout => (
          <div key={workout.id} className="card group flex flex-col hover:border-brand-300 dark:hover:border-brand-700 transition-colors cursor-pointer"
            onClick={() => navigate(`/coach/workouts/${workout.id}`)}>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{workout.name}</p>
              {workout.description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{workout.description}</p>}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{workout.exercise_count} exercise{workout.exercise_count !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800" onClick={e => e.stopPropagation()}>
              <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Edit</button>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <button onClick={() => duplicate(workout)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
              <span className="text-gray-200 dark:text-gray-700">·</span>
              <button onClick={() => archive(workout)} className="text-xs text-gray-400 hover:text-red-500">Archive</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
