import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_OPTIONS = [2, 3, 4, 5, 6, 7]

function dayRank(name) {
  const i = DAY_ORDER.findIndex(d => (name || '').startsWith(d))
  return i === -1 ? 99 : i
}

function parseProgram(name) {
  const m = (name || '').match(/^(\d+)\s*Day\s*[–—\-]\s*Block\s*(\d+)/i)
  if (m) return { days: parseInt(m[1]), block: parseInt(m[2]) }
  return null
}

function stripDay(name) {
  if (!name) return ''
  for (const d of DAY_ORDER) {
    if (name === d) return ''
    if (name.startsWith(d + ' ') || name.startsWith(d + '—')) {
      return name.slice(d.length).replace(/^[\s–—\-]+/, '').trim()
    }
  }
  return name
}

function getBlockLabel(programs, blockNum) {
  const prog = programs.find(p => parseProgram(p.name)?.block === blockNum)
  if (!prog) return ''
  const m = prog.name.match(/Block\s+\d+\s*\(([^)]+)\)/)
  return m ? m[1] : ''
}

function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }}
      className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1 rounded">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}

export default function WorkoutLibrary() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [selectedDays, setSelectedDays] = useState(null)

  // Add block form
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [addBlockLabel, setAddBlockLabel] = useState('')
  const [addBlockDays, setAddBlockDays] = useState([5, 4, 3])

  // Add day variant form
  const [showAddDayVariant, setShowAddDayVariant] = useState(false)
  const [addDayCount, setAddDayCount] = useState(5)

  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  // Inline workout name editing: { workoutId: draftName }
  const [draftNames, setDraftNames] = useState({})

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

  // Build hierarchy
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

  // ── Create block ─────────────────────────────────────────────────────────
  async function createBlock() {
    if (addBlockDays.length === 0) return
    setSaving(true)
    const nextBlock = blocks.length > 0 ? Math.max(...blocks) + 1 : 1
    const label = addBlockLabel.trim()

    for (const days of [...addBlockDays].sort((a, b) => b - a)) {
      const progName = label
        ? `${days} Day — Block ${nextBlock} (${label})`
        : `${days} Day — Block ${nextBlock}`

      const { data: prog } = await supabase.from('training_programs')
        .insert({ coach_id: profile.id, name: progName })
        .select('id').single()
      if (!prog) continue

      for (let i = 0; i < days; i++) {
        const dayName = DAY_ORDER[i]
        const { data: sess } = await supabase.from('training_sessions')
          .insert({ program_id: prog.id, name: dayName })
          .select('id').single()
        if (!sess) continue
        const { data: workout } = await supabase.from('workouts')
          .insert({ coach_id: profile.id, name: dayName, description: `From ${progName}` })
          .select('id').single()
        if (workout) {
          await supabase.from('training_sessions').update({ workout_id: workout.id }).eq('id', sess.id)
        }
      }
    }

    setAddBlockLabel('')
    setAddBlockDays([5, 4, 3])
    setShowAddBlock(false)
    setSaving(false)
    await load()
  }

  // ── Delete block ──────────────────────────────────────────────────────────
  async function deleteBlock(blockNum) {
    if (!confirm(`Delete Block ${blockNum} and all its workouts? This cannot be undone.`)) return
    setSaving(true)
    const blockProgs = programs.filter(p => parseProgram(p.name)?.block === blockNum)
    const workoutIds = blockProgs.flatMap(p =>
      (p.training_sessions || []).filter(s => s.workout_id).map(s => s.workout_id)
    )
    if (workoutIds.length) await supabase.from('workouts').delete().in('id', workoutIds)
    const progIds = blockProgs.map(p => p.id)
    if (progIds.length) {
      await supabase.from('training_sessions').delete().in('program_id', progIds)
      await supabase.from('training_programs').delete().in('id', progIds)
    }
    if (selectedBlock === blockNum) setSelectedBlock(null)
    setSaving(false)
    await load()
  }

  // ── Create day variant ────────────────────────────────────────────────────
  async function createDayVariant() {
    if (!addDayCount || !selectedBlock) return
    setSaving(true)
    const label = getBlockLabel(programs, selectedBlock)
    const progName = label
      ? `${addDayCount} Day — Block ${selectedBlock} (${label})`
      : `${addDayCount} Day — Block ${selectedBlock}`

    const { data: prog } = await supabase.from('training_programs')
      .insert({ coach_id: profile.id, name: progName })
      .select('id').single()

    if (prog) {
      for (let i = 0; i < addDayCount; i++) {
        const dayName = DAY_ORDER[i]
        const { data: sess } = await supabase.from('training_sessions')
          .insert({ program_id: prog.id, name: dayName })
          .select('id').single()
        if (!sess) continue
        const { data: workout } = await supabase.from('workouts')
          .insert({ coach_id: profile.id, name: dayName, description: `From ${progName}` })
          .select('id').single()
        if (workout) {
          await supabase.from('training_sessions').update({ workout_id: workout.id }).eq('id', sess.id)
        }
      }
    }

    setShowAddDayVariant(false)
    setSaving(false)
    await load()
  }

  // ── Delete day variant ────────────────────────────────────────────────────
  async function deleteDayVariant(days) {
    if (!confirm(`Delete the ${days} Day variant of Block ${selectedBlock}? This cannot be undone.`)) return
    setSaving(true)
    const prog = programs.find(p => {
      const parsed = parseProgram(p.name)
      return parsed?.block === selectedBlock && parsed?.days === days
    })
    if (prog) {
      const workoutIds = (prog.training_sessions || []).filter(s => s.workout_id).map(s => s.workout_id)
      if (workoutIds.length) await supabase.from('workouts').delete().in('id', workoutIds)
      await supabase.from('training_sessions').delete().eq('program_id', prog.id)
      await supabase.from('training_programs').delete().eq('id', prog.id)
    }
    if (selectedDays === days) setSelectedDays(null)
    setSaving(false)
    await load()
  }

  // ── Delete session ────────────────────────────────────────────────────────
  async function deleteSession(session) {
    if (!confirm(`Delete "${session.name}"? This will also delete the linked workout.`)) return
    if (session.workout_id) await supabase.from('workouts').delete().eq('id', session.workout_id)
    await supabase.from('training_sessions').delete().eq('id', session.id)
    await load()
  }

  // ── Duplicate workout ─────────────────────────────────────────────────────
  async function duplicate(workoutId) {
    const { data: src } = await supabase.from('workouts').select('*, workout_exercises(*)').eq('id', workoutId).single()
    if (!src) return
    const { data: newW } = await supabase.from('workouts').insert({
      coach_id: profile.id, name: `${src.name} (copy)`, description: src.description,
    }).select('id').single()
    if (!newW) return
    if (src.workout_exercises?.length) {
      await supabase.from('workout_exercises').insert(src.workout_exercises.map(ex => ({
        workout_id: newW.id, exercise_id: ex.exercise_id, order_index: ex.order_index,
        name: ex.name, sets: ex.sets, reps: ex.reps, tempo: ex.tempo,
        rest_seconds: ex.rest_seconds, rpe: ex.rpe, notes: ex.notes,
      })))
    }
    navigate(`/coach/workouts/${newW.id}`)
  }

  // ── Delete standalone workout ─────────────────────────────────────────────
  async function deleteStandalone(workout) {
    if (!confirm(`Delete "${workout.name}"? This cannot be undone.`)) return
    await supabase.from('workouts').delete().eq('id', workout.id)
    await load()
  }

  // ── Reassign session to a different day ───────────────────────────────────
  async function reassignDay(session, newDay) {
    const name = session.name
    const oldDay = DAY_ORDER.find(d => name === d || name.startsWith(d + ' ') || name.startsWith(d + '—'))
    const rest = oldDay ? name.slice(oldDay.length).replace(/^[\s–—\-]+/, '').trim() : name
    const newName = rest ? `${newDay} — ${rest}` : newDay
    await supabase.from('training_sessions').update({ name: newName }).eq('id', session.id)
    await load()
  }

  // ── Save inline workout name edit ─────────────────────────────────────────
  async function saveWorkoutName(workoutId, name) {
    if (!name.trim()) return
    await supabase.from('workouts').update({ name: name.trim() }).eq('id', workoutId)
    setDraftNames(p => { const n = { ...p }; delete n[workoutId]; return n })
    await load()
  }

  // ── Create standalone workout ─────────────────────────────────────────────
  async function createWorkout() {
    const { data } = await supabase.from('workouts').insert({ coach_id: profile.id, name: 'New Workout' }).select('id').single()
    if (data) navigate(`/coach/workouts/${data.id}`)
  }

  // ── Import from blocks ────────────────────────────────────────────────────
  async function importFromBlocks() {
    setImporting(true)
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('id, name, program_id, training_programs(name), session_exercises(*)')
      .is('workout_id', null)
    for (const session of sessions || []) {
      const { data: newW } = await supabase.from('workouts').insert({
        coach_id: profile.id, name: session.name,
        description: session.training_programs?.name ? `From ${session.training_programs.name}` : null,
      }).select('id').single()
      if (!newW) continue
      if (session.session_exercises?.length) {
        await supabase.from('workout_exercises').insert(
          session.session_exercises
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((ex, i) => ({
              workout_id: newW.id, name: ex.name, sets: ex.sets, reps: ex.reps,
              rpe: ex.rpe, rest_seconds: ex.rest_seconds, notes: ex.notes, order_index: i,
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

  // ── LEVEL 3: Sessions — Mon–Sun template view ────────────────────────────
  if (selectedBlock !== null && selectedDays !== null) {
    const { sessions } = grouped[selectedBlock]?.[selectedDays] || { sessions: [] }

    const sessionByDay = {}
    const unscheduled = []
    for (const session of sessions) {
      const day = DAY_ORDER.find(d =>
        session.name === d ||
        session.name.startsWith(d + ' ') ||
        session.name.startsWith(d + '—')
      )
      if (day) sessionByDay[day] = session
      else unscheduled.push(session)
    }

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <BackButton onClick={() => setSelectedDays(null)} label={`Block ${selectedBlock}`} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Block {selectedBlock} — {selectedDays} Day</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => deleteDayVariant(selectedDays)} disabled={saving}
              className="text-sm text-red-400 hover:text-red-600 dark:hover:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-1.5 transition-colors">
              Delete {selectedDays} Day variant
            </button>
          </div>
        </div>

        {/* Mon–Sun editable template grid */}
        <div className="space-y-2">
          {DAY_ORDER.map(day => {
            const session = sessionByDay[day]
            const workout = session?.workouts
            const exCount = workout?.workout_exercises?.length || 0
            const draftName = draftNames[workout?.id] !== undefined
              ? draftNames[workout.id]
              : stripDay(workout?.name ?? '')

            if (!session) {
              return (
                <div key={day} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 px-4 py-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-600 w-28 flex-shrink-0">{day}</span>
                  <span className="text-xs text-gray-300 dark:text-gray-700 italic">Rest</span>
                </div>
              )
            }

            return (
              <div key={day} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Day selector — lets coach move this session to a different day */}
                  <select
                    value={day}
                    onChange={e => reassignDay(session, e.target.value)}
                    className="input text-sm py-1.5 flex-shrink-0 w-32"
                  >
                    {DAY_ORDER.map(d => (
                      <option key={d} value={d} disabled={d !== day && !!sessionByDay[d]}>{d}</option>
                    ))}
                  </select>

                  {/* Workout name — editable inline */}
                  {workout ? (
                    <input
                      type="text"
                      className="input flex-1 text-sm font-medium"
                      value={draftName}
                      onChange={e => setDraftNames(p => ({ ...p, [workout.id]: e.target.value }))}
                      onBlur={() => {
                        const trimmed = draftName.trim()
                        if (trimmed && trimmed !== workout.name) saveWorkoutName(workout.id, trimmed)
                      }}
                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                      placeholder="Session name…"
                      title={`${exCount} exercise${exCount !== 1 ? 's' : ''}`}
                    />
                  ) : (
                    <p className="text-sm text-gray-400 italic flex-1">No workout linked</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {workout && (
                      <>
                        <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                          className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Open</button>
                        <button onClick={() => duplicate(workout.id)}
                          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
                      </>
                    )}
                    <DeleteBtn onClick={() => deleteSession(session)} />
                  </div>
                </div>
                {workout && exCount > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 pl-[calc(8rem+0.75rem)]">
                    {exCount} exercise{exCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Unscheduled sessions — shown with a day selector to assign them */}
        {unscheduled.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Unscheduled</p>
            {unscheduled.map(session => {
              const workout = session.workouts
              const exCount = workout?.workout_exercises?.length || 0
              const draftName = draftNames[workout?.id] !== undefined
                ? draftNames[workout.id]
                : stripDay(workout?.name ?? session.name)
              return (
                <div key={session.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <select
                      value=""
                      onChange={e => e.target.value && reassignDay(session, e.target.value)}
                      className="input text-sm py-1.5 flex-shrink-0 w-32"
                    >
                      <option value="">Assign day…</option>
                      {DAY_ORDER.filter(d => !sessionByDay[d]).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {workout ? (
                      <input
                        type="text"
                        className="input flex-1 text-sm font-medium"
                        value={draftName}
                        onChange={e => setDraftNames(p => ({ ...p, [workout.id]: e.target.value }))}
                        onBlur={() => {
                          const trimmed = draftName.trim()
                          if (trimmed && trimmed !== workout.name) saveWorkoutName(workout.id, trimmed)
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        placeholder="Session name…"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 italic flex-1">{session.name}</p>
                    )}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {workout && (
                        <>
                          <button onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                            className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium">Open</button>
                          <button onClick={() => duplicate(workout.id)}
                            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Duplicate</button>
                        </>
                      )}
                      <DeleteBtn onClick={() => deleteSession(session)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── LEVEL 2: Day variants ─────────────────────────────────────────────────
  if (selectedBlock !== null) {
    const dayVariants = Object.keys(grouped[selectedBlock] || {}).map(Number).sort((a, b) => b - a)
    const existingDayCounts = new Set(dayVariants)
    const availableDays = DAY_OPTIONS.filter(d => !existingDayCounts.has(d))
    const blockLabel = getBlockLabel(programs, selectedBlock)

    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <BackButton onClick={() => setSelectedBlock(null)} label="Workout Library" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Block {selectedBlock}{blockLabel ? ` — ${blockLabel}` : ''}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{dayVariants.length} day variant{dayVariants.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {availableDays.length > 0 && (
                <button onClick={() => setShowAddDayVariant(v => !v)}
                  className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
                  + Add day variant
                </button>
              )}
              <button onClick={() => deleteBlock(selectedBlock)} disabled={saving}
                className="text-sm text-red-400 hover:text-red-600 dark:hover:text-red-300 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-1.5 transition-colors">
                Delete block
              </button>
            </div>
          </div>
        </div>

        {showAddDayVariant && (
          <div className="card flex items-center gap-3 flex-wrap">
            <select className="input text-sm py-1.5" value={addDayCount}
              onChange={e => setAddDayCount(parseInt(e.target.value))}>
              {availableDays.map(d => <option key={d} value={d}>{d} Day</option>)}
            </select>
            <button onClick={createDayVariant} disabled={saving}
              className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Creating…' : 'Create'}</button>
            <button onClick={() => setShowAddDayVariant(false)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dayVariants.map(days => {
            const { sessions } = grouped[selectedBlock][days]
            const linkedCount = sessions.filter(s => s.workout_id).length
            return (
              <div key={days} className="relative group">
                <button onClick={() => setSelectedDays(days)}
                  className="card w-full text-left hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pr-6">
                    {days} Day
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
                  {linkedCount < sessions.length && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">{sessions.length - linkedCount} not yet imported</p>
                  )}
                </button>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteBtn onClick={() => deleteDayVariant(days)} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LEVEL 1: Blocks ───────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Library</h1>
          {blocks.length > 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={importFromBlocks} disabled={importing}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            {importing ? 'Importing…' : importDone ? '✓ Imported' : 'Import from training blocks'}
          </button>
          <button onClick={() => setShowAddBlock(v => !v)}
            className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
            + Add block
          </button>
          <button onClick={createWorkout} className="btn-primary py-1.5 px-4 text-sm">+ New standalone workout</button>
        </div>
      </div>

      {/* Add block form */}
      {showAddBlock && (
        <div className="card space-y-4">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">New block — Block {blocks.length > 0 ? Math.max(...blocks) + 1 : 1}</p>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Block label (optional)</label>
            <input className="input w-full max-w-xs" placeholder="e.g. Hypertrophy, Strength…"
              value={addBlockLabel} onChange={e => setAddBlockLabel(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Day variants to include</label>
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map(d => (
                <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={addBlockDays.includes(d)}
                    onChange={e => setAddBlockDays(prev =>
                      e.target.checked ? [...prev, d] : prev.filter(x => x !== d)
                    )} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{d} Day</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={createBlock} disabled={saving || addBlockDays.length === 0}
              className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Creating…' : 'Create block'}</button>
            <button onClick={() => { setShowAddBlock(false); setAddBlockLabel(''); setAddBlockDays([5, 4, 3]) }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      {blocks.length === 0 && unorganised.length === 0 && standaloneWorkouts.length === 0 && !showAddBlock && (
        <div className="card text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No workouts yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "+ Add block" to create your first training block, or "Import from training blocks" to pull in existing programmes.</p>
        </div>
      )}

      {/* Block cards */}
      {blocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map(block => {
            const label = getBlockLabel(programs, block)
            const dayVariants = Object.keys(grouped[block]).length
            const totalSessions = Object.values(grouped[block]).reduce((s, { sessions }) => s + sessions.length, 0)
            const linkedSessions = Object.values(grouped[block]).reduce((s, { sessions }) => s + sessions.filter(x => x.workout_id).length, 0)
            return (
              <div key={block} className="relative group">
                <button onClick={() => setSelectedBlock(block)}
                  className="card w-full text-left hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pr-6">
                    Block {block}
                  </p>
                  {label && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>}
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{dayVariants} day variant{dayVariants !== 1 ? 's' : ''}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{linkedSessions}/{totalSessions} sessions imported</p>
                </button>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteBtn onClick={() => deleteBlock(block)} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Unrecognised programmes */}
      {unorganised.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">Other Programmes</h2>
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
                        {workout && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exCount} exercise{exCount !== 1 ? 's' : ''}</p>}
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

      {/* Standalone workouts */}
      {standaloneWorkouts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">Standalone Workouts</h2>
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
                      <DeleteBtn onClick={() => deleteStandalone(workout)} />
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
