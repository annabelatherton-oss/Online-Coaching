import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function ClientTraining() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [weekNumber, setWeekNumber] = useState(null)
  const [programName, setProgramName] = useState('')
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState(new Set())

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', session.user.id)
        .single()
      if (!client) { setLoading(false); return }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">This Week's Training</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {programName && <span>{programName} · </span>}Week {weekNumber}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No sessions scheduled for this week yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Check back soon — your coach is putting your programme together.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={s.id} className="card overflow-hidden p-0">
              <button
                onClick={() => toggle(s.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
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
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-[1fr_44px_68px_52px] gap-2 px-4 py-2 text-xs text-gray-400 uppercase tracking-wider font-medium bg-gray-50/60 dark:bg-gray-800/40">
                    <span>Exercise</span>
                    <span className="text-center">Sets</span>
                    <span className="text-center">Reps</span>
                    <span className="text-center">RPE</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {s.exercises.map(ex => (
                      <div key={ex.id} className="grid grid-cols-[1fr_44px_68px_52px] gap-2 px-4 py-3 items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{ex.name}</p>
                          {ex.notes && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ex.notes}</p>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 text-center tabular-nums">
                          {ex.sets ?? '—'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                          {ex.reps || '—'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          {ex.rpe || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
