import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function dayRank(name) {
  const i = DAY_ORDER.findIndex(d => (name || '').startsWith(d))
  return i === -1 ? 99 : i
}

function parseProgram(name) {
  const m = (name || '').match(/^(\d+)\s*Day\s*[–\-]\s*Block\s*(\d+)/i)
  if (m) return { days: parseInt(m[1]), block: parseInt(m[2]) }
  return null
}

export default function WorkoutLibrary() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)

  async function load() {
    const [{ data: progs }, { data: allWorkouts }] = await Promise.all([
      supabase
        .from('training_programs')
        .select('id, name, training_sessions(id, name, workout_id, workouts(id, name, workout_exercises(id)))')
        .eq('coach_id', profile.id)
        .order('name'),
      supabase
        .from('workouts')
        .select('id, name, workout_exercises(id)')
        .eq('coach_id', profile.id)
        .eq('is_archived', false)
        .order('name'),
    ])

    setPrograms(progs || [])

    const linkedIds = new Set()
    for (const prog of progs || []) {
      for (const sess of prog.training_sessions || []) {
        if (sess.workout_id) linkedIds.add(sess.workout_id)
      }
    }
    setStandaloneWorkouts((allWorkouts || []).filter(w => !linkedIds.has(w.id)))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Build hierarchy: { blockNum: { dayCount: { progId, sessions[] } } }
  const grouped = {}
  for (const prog of programs) {
    const parsed = parseProgram(prog.name)
    if (!parsed) continue
    const { block, days } = parsed
    if (!grouped[block]) grouped[block] = {}
    grouped[block][days] = {
      progId: prog.id,
      sessions: [...(prog.training_sessions || [])].sort((a, b) => dayRank(a.name) - dayRank(b.name)),
    }
  }
  const blocks = Object.keys(grouped).map(Number).sort((a, b) => a - b)
  const unorganised = programs.filter(p => !parseProgram(p.name))

  async function createWorkout() {
    const { data } = await supabase.from('workouts').insert({
      coach_id: profile.id,
      name: 'New Workout',
    }).select('id').single()
    if (data) navigate(`/coach/workouts/${data.id}`)
  }

  async function duplicate(workoutId) {
    const { data: src } = await supabase.from('workouts').select('*, workout_exercises(*)').eq('id', workoutId).single()
    if (!src) return
    const { data: newW } = await supabase.from('workouts').insert({
      coach_id: profile.id,
      name: `${src.name} (copy)`,
      description: src.description,
    }).select('id').single()
    if (!newW) return
    if (src.workout_exercises?.length) {
      await supabase.from('workout_exercises').insert(src.workout_exercises.map(ex => ({
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

  async function importFromBlocks() {
    setImporting(true)
    // Only import sessions that don't yet have a workout linked
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('id, name, program_id, training_programs(name), session_exercises(*)')
      .is('workout_id', null)

    for (const session of sessions || []) {
      const { data: newW } = await supabase.from('workouts').insert({
        coach_id: profile.id,
        name: session.name,
        description: session.training_programs?.name ? `From ${session.training_programs.name}` : null,
      }).select('id').single()

      if (!newW) continue

      if (session.session_exercises?.length) {
        await supabase.from('workout_exercises').insert(
          session.session_exercises
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ex, i) => ({
              workout_id: newW.id,
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
      await supabase.from('training_sessions').update({ workout_id: newW.id }).eq('id', session.id)
    }

    await load()
    setImporting(false)
    setImportDone(true)
    setTimeout(() => setImportDone(false), 3000)
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const hasContent = blocks.length > 0 || unorganised.length > 0 || standaloneWorkouts.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Library</h1>
          {hasContent && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{programs.length} programme{programs.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={importFromBlocks} disabled={importing}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {importing ? 'Importing…' : importDone ? '✓ Imported' : 'Import from training blocks'}
          </button>
          <button onClick={createWorkout} className="btn-primary py-1.5 px-4 text-sm">+ New workout</button>
        </div>
      </div>

      {!hasContent && (
        <div className="card text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No workouts yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Click "Import from training blocks" to pull in your existing programmes, or create a workout from scratch.
          </p>
        </div>
      )}

      {/* Blocks hierarchy */}
      {blocks.map(block => (
        <div key={block} className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Block {block}</h2>
          {Object.keys(grouped[block]).map(Number).sort((a, b) => b - a).map(days => {
            const { sessions } = grouped[block][days]
            return (
              <div key={days} className="card overflow-hidden p-0">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{days} Day</p>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {sessions.map(session => {
                    const workout = session.workouts
                    const exCount = workout?.workout_exercises?.length || 0
                    return (
                      <div key={session.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{session.name}</p>
                          {workout
                            ? <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exCount} exercise{exCount !== 1 ? 's' : ''}</p>
                            : <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">No workout linked yet</p>
                          }
                        </div>
                        {workout && (
                          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                              className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Edit</button>
                            <button onClick={() => duplicate(workout.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Programmes that don't match the Block naming pattern */}
      {unorganised.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Other Programmes</h2>
          {unorganised.map(prog => (
            <div key={prog.id} className="card overflow-hidden p-0">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{prog.name}</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...(prog.training_sessions || [])].sort((a, b) => dayRank(a.name) - dayRank(b.name)).map(session => {
                  const workout = session.workouts
                  const exCount = workout?.workout_exercises?.length || 0
                  return (
                    <div key={session.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{session.name}</p>
                        {workout
                          ? <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exCount} exercise{exCount !== 1 ? 's' : ''}</p>
                          : <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">No workout linked yet</p>
                        }
                      </div>
                      {workout && (
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                          <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                            className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Edit</button>
                          <button onClick={() => duplicate(workout.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workouts not linked to any programme session */}
      {standaloneWorkouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Standalone Workouts</h2>
          <div className="card overflow-hidden p-0">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {standaloneWorkouts.map(workout => {
                const exCount = workout.workout_exercises?.length || 0
                return (
                  <div key={workout.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{workout.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exCount} exercise{exCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Edit</button>
                      <button onClick={() => duplicate(workout.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
