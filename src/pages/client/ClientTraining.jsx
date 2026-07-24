import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import ExerciseThumb from '../../components/ExerciseThumb'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Parse day index (0=Mon) from session name like "Monday — Upper Body A"
function parseDayIndex(name) {
  for (let i = 0; i < DAYS.length; i++) {
    if (name?.startsWith(DAYS[i])) return i
  }
  return null
}

// Strip day prefix from session name for display
function sessionLabel(name) {
  for (const day of DAYS) {
    if (name === day) return ''
    if (name?.startsWith(day)) return name.slice(day.length).replace(/^[\s–—\-]+/, '').trim()
  }
  return name || ''
}

// Parse stored "60x10,60x8,65x6" (or legacy "10,10,8") into per-set array
function parseSetLogs(reps_completed, weight_kg, numSets) {
  const n = Math.max(numSets || 1, 1)
  if (!reps_completed) {
    const w = weight_kg != null ? String(weight_kg) : ''
    return Array.from({ length: n }, () => ({ weight: w, reps: '' }))
  }
  const parts = reps_completed.split(',')
  const parsed = parts.map(p => {
    const xi = p.indexOf('x')
    if (xi >= 0) return { weight: p.slice(0, xi).trim(), reps: p.slice(xi + 1).trim() }
    // Legacy: reps only
    return { weight: weight_kg != null ? String(weight_kg) : '', reps: p.trim() }
  })
  while (parsed.length < n) parsed.push({ weight: '', reps: '' })
  return parsed.slice(0, n)
}

// Serialise per-set array → DB fields
function serializeSets(sets) {
  const anyFilled = sets.some(s => s.weight !== '' || s.reps !== '')
  if (!anyFilled) return { weight_kg: null, reps_completed: null }
  const reps_completed = sets.map(s => `${s.weight}x${s.reps}`).join(',')
  const weights = sets.map(s => parseFloat(s.weight)).filter(w => !isNaN(w) && w > 0)
  return { weight_kg: weights.length ? Math.max(...weights) : null, reps_completed }
}

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
  const [inputs, setInputs] = useState({}) // exId → [{weight, reps}, …]

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients').select('id').eq('profile_id', session.user.id).single()
      if (!client) { setLoading(false); return }
      setClientId(client.id)

      const { data: asgn } = await supabase
        .from('client_training_assignments')
        .select('*, training_programs(name, weeks_total)')
        .eq('client_id', client.id).eq('active', true)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!asgn) { setLoading(false); return }

      // week_override tracks progress through the 12-week block (display only)
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      const blockStart = asgn.start_date || asgn.created_at.split('T')[0]
      const week = Math.floor((Date.now() - new Date(blockStart).getTime()) / msPerWeek) + 1
      setWeekNumber(week)
      setProgramName(asgn.program_name || asgn.training_programs?.name || '')

      // Sessions are always loaded from week 1 — the block repeats the same plan each week
      const { data: sessData } = await supabase
        .from('training_sessions').select('*, session_exercises(*)')
        .eq('program_id', asgn.program_id).eq('week_number', 1).order('order_index')

      const sorted = (sessData || []).map(s => ({
        ...s,
        exercises: (s.session_exercises || []).sort((a, b) => a.order_index - b.order_index),
      }))
      setSessions(sorted)
      if (sorted.length > 0) setExpanded(new Set([sorted[0].id]))

      const exMap = {}
      sorted.forEach(s => s.exercises.forEach(e => { exMap[e.id] = e }))
      const exIds = Object.keys(exMap)

      if (exIds.length > 0) {
        const weeksToFetch = week > 1 ? [week, week - 1] : [week]
        const { data: logs } = await supabase
          .from('client_exercise_logs')
          .select('session_exercise_id, week_number, weight_kg, reps_completed')
          .eq('client_id', client.id)
          .in('session_exercise_id', exIds)
          .in('week_number', weeksToFetch)

        const thisW = {}, prevW = {}
        ;(logs || []).forEach(log => {
          if (log.week_number === week) thisW[log.session_exercise_id] = log
          else prevW[log.session_exercise_id] = log
        })
        setPrevWeekLogs(prevW)

        const initInputs = {}
        exIds.forEach(id => {
          const ex = exMap[id]
          const numSets = parseInt(ex.sets) || 3
          const log = thisW[id]
          initInputs[id] = parseSetLogs(log?.reps_completed, log?.weight_kg, numSets)
        })
        setInputs(initInputs)
      }

      const { data: delivery } = await supabase
        .from('weekly_deliveries').select('training_notes')
        .eq('client_id', client.id).order('delivered_at', { ascending: false }).limit(1).maybeSingle()
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

  function handleInput(exId, setIdx, field, value) {
    setInputs(prev => {
      const arr = [...(prev[exId] || [])]
      arr[setIdx] = { ...arr[setIdx], [field]: value }
      return { ...prev, [exId]: arr }
    })
  }

  async function saveLog(exId) {
    if (!clientId || !weekNumber) return
    const { weight_kg, reps_completed } = serializeSets(inputs[exId] || [])
    if (weight_kg === null && !reps_completed) return
    await supabase.from('client_exercise_logs').upsert(
      { client_id: clientId, session_exercise_id: exId, week_number: weekNumber, weight_kg, reps_completed },
      { onConflict: 'client_id,session_exercise_id,week_number' }
    )
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (!weekNumber) {
    return (
      <div className="space-y-4">
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

  const sessionByDay = {}
  sessions.forEach(s => {
    const dayIdx = parseDayIndex(s.name)
    if (dayIdx !== null && !sessionByDay[dayIdx]) sessionByDay[dayIdx] = s
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">This Week's Training</h1>
        {programName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{programName}</p>
        )}
      </div>

      {coachNotes && (
        <div className="card border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 p-3 space-y-1">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Coach's notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{coachNotes}</p>
        </div>
      )}

      <div className="space-y-2">
        {DAYS.map((dayName, dayIdx) => {
          const s = sessionByDay[dayIdx]

          if (!s) {
            return (
              <div key={dayName} className="card px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{dayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Rest Day</p>
                </div>
              </div>
            )
          }

          return (
            <div key={dayName} className="card overflow-hidden p-0">
              <button
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-none mb-0.5">{dayName}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{sessionLabel(s.name) || dayName}</p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {s.exercises.length} ex
                </p>
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
                    const numSets = parseInt(ex.sets) || 3
                    const setInputs = inputs[ex.id] || Array.from({ length: numSets }, () => ({ weight: '', reps: '' }))
                    const prev = prevWeekLogs[ex.id]
                    const prevSets = prev ? parseSetLogs(prev.reps_completed, prev.weight_kg, numSets) : null
                    const prescription = [ex.reps && ex.reps, ex.rpe && `RPE ${ex.rpe}`].filter(Boolean).join(' · ')

                    return (
                      <div key={ex.id} className="px-3 py-2.5 flex gap-2.5">
                        <ExerciseThumb illustrationUrl={ex.illustration_url} videoUrl={ex.video_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{ex.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {numSets} sets{prescription ? ` · ${prescription}` : ''}
                          </p>
                          {ex.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ex.notes}</p>}

                          {/* Column headers */}
                          <div className="grid grid-cols-[20px_1fr_1fr_56px] gap-1.5 mt-2 mb-1 px-0.5">
                            <span />
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">kg</p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">reps</p>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide text-center">last wk</p>
                          </div>

                          {/* Per-set rows */}
                          {Array.from({ length: numSets }, (_, i) => {
                            const ps = prevSets?.[i]
                            const prevLabel = ps?.weight && ps?.reps
                              ? `${ps.weight}×${ps.reps}`
                              : ps?.reps || ps?.weight || '—'
                            return (
                              <div key={i} className="grid grid-cols-[20px_1fr_1fr_56px] gap-1.5 mb-1 items-center">
                                <p className="text-xs text-gray-400 text-center">{i + 1}</p>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  placeholder="—"
                                  value={setInputs[i]?.weight ?? ''}
                                  onChange={e => handleInput(ex.id, i, 'weight', e.target.value)}
                                  onBlur={() => saveLog(ex.id)}
                                  className="w-full px-1.5 py-1 text-sm text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder="—"
                                  value={setInputs[i]?.reps ?? ''}
                                  onChange={e => handleInput(ex.id, i, 'reps', e.target.value)}
                                  onBlur={() => saveLog(ex.id)}
                                  className="w-full px-1.5 py-1 text-sm text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 text-center truncate">{prevLabel}</p>
                              </div>
                            )
                          })}
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
