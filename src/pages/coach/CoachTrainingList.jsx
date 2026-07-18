import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const HARDCODED_SUBTITLES = {
  'Block 1': 'Hypertrophy / Foundations',
  'Block 2': 'Strength & Hypertrophy',
  'Block 3': 'Hypertrophy Variation',
}

const DAY_ORDER = ['5 Day', '4 Day', '3 Day']

function getDayVariant(name) {
  for (const d of DAY_ORDER) {
    if (name.startsWith(d)) return d
  }
  return null
}

export default function CoachTrainingList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [standaloneWorkouts, setStandaloneWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [blockForm, setBlockForm] = useState(null)
  const [addingBlock, setAddingBlock] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [{ data: progsData }, { data: allWorkouts }] = await Promise.all([
      supabase
        .from('training_programs')
        .select('*, training_sessions(id, workout_id)')
        .eq('coach_id', profile.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('workouts')
        .select('id, name, workout_exercises(id)')
        .eq('coach_id', profile.id)
        .eq('is_archived', false)
        .order('name'),
    ])

    setPrograms(progsData || [])

    const linkedIds = new Set()
    for (const prog of progsData || []) {
      for (const sess of prog.training_sessions || []) {
        if (sess.workout_id) linkedIds.add(sess.workout_id)
      }
    }
    setStandaloneWorkouts((allWorkouts || []).filter(w => !linkedIds.has(w.id)))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createStandaloneWorkout() {
    const { data } = await supabase
      .from('workouts')
      .insert({ coach_id: profile.id, name: 'New Session' })
      .select('id')
      .single()
    if (data) navigate(`/coach/workouts/${data.id}`)
  }

  async function duplicateWorkout(workout) {
    const { data: src } = await supabase
      .from('workouts')
      .select('*, workout_exercises(*)')
      .eq('id', workout.id)
      .single()
    if (!src) return
    const { data: newW } = await supabase
      .from('workouts')
      .insert({ coach_id: profile.id, name: `${src.name} (copy)`, description: src.description })
      .select('id')
      .single()
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

  async function deleteWorkout(workout) {
    if (!confirm(`Delete "${workout.name}"? This cannot be undone.`)) return
    await supabase.from('workouts').delete().eq('id', workout.id)
    setStandaloneWorkouts(prev => prev.filter(w => w.id !== workout.id))
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // Derive blocks from DB programme names + hardcoded defaults
  const blockKeySet = new Set(Object.keys(HARDCODED_SUBTITLES))
  programs.forEach(p => {
    const match = p.name.match(/Block\s+(\d+)/i)
    if (match) blockKeySet.add(`Block ${parseInt(match[1])}`)
  })
  const blocks = [...blockKeySet]
    .sort((a, b) => (parseInt(a.match(/\d+/)?.[0]) || 99) - (parseInt(b.match(/\d+/)?.[0]) || 99))
    .map(key => ({ key, label: key, subtitle: HARDCODED_SUBTITLES[key] || '' }))

  function getBlockKey(name) {
    for (const b of blocks) {
      if (name.includes(b.key)) return b.key
    }
    return null
  }

  const blockMap = {}
  blocks.forEach(b => { blockMap[b.key] = {} })
  programs.forEach(p => {
    const block = getBlockKey(p.name)
    const day = getDayVariant(p.name)
    if (block && day) blockMap[block][day] = p
  })

  function openAddBlockForm() {
    const nums = blocks.map(b => parseInt(b.key.match(/\d+/)?.[0])).filter(Boolean)
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    setBlockForm({ label: `Block ${next}`, subtitle: '', weeks: 12 })
  }

  async function confirmAddBlock() {
    const trimmedLabel = blockForm.label.trim()
    if (!trimmedLabel) return
    setAddingBlock(true)
    const inserts = DAY_ORDER.map(day => ({
      coach_id: profile.id,
      name: `${day} – ${trimmedLabel}`,
      weeks_total: parseInt(blockForm.weeks) || 12,
      current_week: 1,
      top_lifts: [],
    }))
    const { data, error } = await supabase.from('training_programs').insert(inserts).select('*')
    if (!error && data) setPrograms(prev => [...prev, ...data])
    setBlockForm(null)
    setAddingBlock(false)
  }

  // Day variant view
  if (selectedBlock) {
    const block = blocks.find(b => b.key === selectedBlock)
    const variants = blockMap[selectedBlock]
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedBlock(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{block.label}</h1>
            {block.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {DAY_ORDER.map(day => {
            const prog = variants[day]
            if (!prog) return (
              <div key={day} className="card text-center py-10 text-sm text-gray-400 dark:text-gray-600 border-dashed border-gray-200 dark:border-gray-700">
                {day}<br /><span className="text-xs">not set up</span>
              </div>
            )
            return (
              <button
                key={day}
                onClick={() => navigate(`/coach/training/${prog.id}`)}
                className="card text-left hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group"
              >
                <p className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 mb-1">
                  {day}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{prog.weeks_total} weeks</p>
                <p className="text-sm text-brand-500 dark:text-brand-400 mt-4 font-medium">Edit →</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Main view — blocks + standalone sessions
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Programmes and standalone sessions</p>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block, bi) => (
          <button
            key={block.key}
            onClick={() => setSelectedBlock(block.key)}
            className="w-full card text-left flex items-center gap-4 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 font-bold">
              B{bi + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 text-lg">
                {block.label}
              </p>
              {block.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>}
            </div>
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}

        {blockForm ? (
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add training block</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Block name</label>
                <input
                  className="input w-full py-1.5 text-sm"
                  placeholder="e.g. Block 4"
                  value={blockForm.label}
                  onChange={e => setBlockForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Weeks</label>
                <input
                  className="input w-full py-1.5 text-sm"
                  type="number"
                  min={1}
                  placeholder="12"
                  value={blockForm.weeks}
                  onChange={e => setBlockForm(f => ({ ...f, weeks: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Description (optional)</label>
              <input
                className="input w-full py-1.5 text-sm"
                placeholder="e.g. Peaking Phase"
                value={blockForm.subtitle}
                onChange={e => setBlockForm(f => ({ ...f, subtitle: e.target.value }))}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Creates 5 Day, 4 Day, and 3 Day programmes for this block.</p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={confirmAddBlock}
                disabled={addingBlock || !blockForm.label.trim()}
                className="btn-primary py-1.5 px-4 text-sm"
              >
                {addingBlock ? 'Creating…' : 'Create block'}
              </button>
              <button
                type="button"
                onClick={() => setBlockForm(null)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={openAddBlockForm}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:hover:border-brand-700 dark:hover:text-brand-400 transition-colors"
          >
            + Add training block
          </button>
        )}
      </div>

      {/* Standalone sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">Standalone Sessions</h2>
          <button onClick={createStandaloneWorkout} className="btn-primary py-1.5 px-4 text-sm">
            + New session
          </button>
        </div>

        {standaloneWorkouts.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No standalone sessions yet.</p>
        ) : (
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
                      <button
                        onClick={() => navigate(`/coach/workouts/${workout.id}`)}
                        className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateWorkout(workout)}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => deleteWorkout(workout)}
                        className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
