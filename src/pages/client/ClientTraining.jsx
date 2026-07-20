import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ExerciseThumb from '../../components/ExerciseThumb'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ClientTraining() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [programName, setProgramName] = useState('')
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState(new Set())
  const [coachNotes, setCoachNotes] = useState('')
  const [prevWeekLogs, setPrevWeekLogs] = useState({})
  const [inputs, setInputs] = useState({})

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', session.user.id)
        .single()
      if (!client) { setLoading(false); return }
      setClientId(client.id)

      const { data: asgn } = await supabase
        .from('client_training_assignments')
        .select('*, training_programs(name, current_week)')
        .eq('client_id', client.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!asgn) { setLoading(false); return }

      const week = asgn.week_override ?? asgn.training_programs?.current_week ?? 1
      setWeekNumber(week)
      setProgramName(asgn.program_name || asgn.training_programs?.name || '')

      const { data: sessData } = await supabase
        .from('training_sessions')
        .select('*, session_exercises(*)')
        .eq('program_id', asgn.program_id)
        .eq('week_number', week)
        .order('order_index')

      const sorted = (sessData || []).map(s => ({
        ...s,
        exercises: (s.session_exercises || []).sort((a, b) => a.order_index - b.order_index),
      }))
      setSessions(sorted)
      if (sorted.length > 0) setExpanded(new Set([sorted[0].id]))

      const exIds = sorted.flatMap(s => s.exercises.map(e => e.id))
      if (exIds.length > 0) {
        const weeksToFetch = week > 1 ? [week, week - 1] : [week]
        const { data: logs } = await supabase
          .from('client_exercise_logs')
          .select('session_exercise_id, week_number, weight_kg, reps_completed')
          .eq('client_id', client.id)
          .in('session_exercise_id', exIds)
          .in('week_number', weeksToFetch)

        const thisW = {}
        const prevW = {}
        ;(logs || []).forEach(log => {
          if (log.week_number === week) thisW[log.session_exercise_id] = log
          else prevW[log.session_exercise_id] = log
        })
        setPrevWeekLogs(prevW)

        const initInputs = {}
        exIds.forEach(id => {
          initInputs[id] = {
            weight: thisW[id]?.weight_kg ?? '',
            reps: thisW[id]?.reps_completed ?? '',
          }
        })
        setInputs(initInputs)
      }

      const { data: delivery } = await supabase
        .from('weekly_deliveries')
        .select('training_notes')
        .eq('client_id', client.id)
        .order('delivered_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (delivery?.training_notes) setCoachNotes(delivery.training_notes)

      setLoading(false)
    }
    load()
  }, [session.user.id])

  function toggle(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleInput(exId, field, value) {
    setInputs(prev => ({ ...prev, [exId]: { ...prev[exId], [field]: value } }))
  }

  async function saveLog(exId) {
    if (!clientId || !weekNumber) return
    const vals = inputs[exId] || {}
    const weight = vals.weight !== '' && vals.weight != null ? parseFloat(vals.weight) : null
    const reps = vals.reps?.trim() || null
    if (weight === null && !reps) return

    await supabase.from('client_exercise_logs').upsert(
      {
        client_id: clientId,
        session_exercise_id: exId,
        week_number: weekNumber,
        weight_kg: weight,
        reps_completed: reps,
      },
      { onConflict: 'client_id,session_exercise_id,week_number' }
    )
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (!weekNumber) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">This Week's Training</h1>
        <div className="card text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No training programme assigned yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your coach will set this up for you.</p>
        </div>
      </div>
    )
  }

  // Map sessions to day slots by order_index (0=Mon … 6=Sun)
  const sessionByDay = {}
  sessions.forEach(s => {
    const dayIdx = Math.min(Math.max(s.order_index, 0), 6)
    if (!sessionByDay[dayIdx]) sessionByDay[dayIdx] = s
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">This Week's Training</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {programName && <span>{programName} · </span>}Week {weekNumber}
        </p>
      </div>

      {coachNotes && (
        <div className="card border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Coach's training notes</p>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{coachNotes}</p>
        </div>
      )}

      <div className="space-y-3">
        {DAYS.map((dayName, dayIdx) => {
          const s = sessionByDay[dayIdx]

          if (!s) {
            return (
              <div key={dayName} className="card p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{dayName}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Rest Day</p>
                </div>
              </div>
            )
          }

          return (
            <div key={dayName} className="card overflow-hidden p-0">
              <button
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{dayName}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {s.exercises.length} exercise{s.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded.has(s.id) ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded.has(s.id) && s.exercises.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
                  {s.exercises.map(ex => {
                    const prev = prevWeekLogs[ex.id]
                    const inp = inputs[ex.id] || { weight: '', reps: '' }
                    const prescription = [
                      ex.sets && `${ex.sets} sets`,
                      ex.reps && ex.reps,
                      ex.rpe && `RPE ${ex.rpe}`,
                    ].filter(Boolean).join(' · ')

                    return (
                      <div key={ex.id} className="px-4 py-4 flex gap-3">
                        <ExerciseThumb
                          illustrationUrl={ex.illustration_url}
                          videoUrl={ex.video_url}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{ex.name}</p>
                            {prescription && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{prescription}</p>
                            )}
                            {ex.notes && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ex.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Weight (kg)
                              </label>
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder="e.g. 60"
                                value={inp.weight}
                                onChange={e => handleInput(ex.id, 'weight', e.target.value)}
                                onBlur={() => saveLog(ex.id)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {prev?.weight_kg != null && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Last wk: {prev.weight_kg} kg
                                </p>
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Reps completed
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="e.g. 10,10,8"
                                value={inp.reps}
                                onChange={e => handleInput(ex.id, 'reps', e.target.value)}
                                onBlur={() => saveLog(ex.id)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {prev?.reps_completed && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Last wk: {prev.reps_completed}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
