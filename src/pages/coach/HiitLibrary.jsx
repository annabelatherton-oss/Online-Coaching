import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const CIRCUIT_TYPES = ['custom', 'emom', 'amrap', 'for-time', 'intervals', 'tabata']
const CIRCUIT_TYPE_LABELS = { custom: 'Custom', emom: 'EMOM', amrap: 'AMRAP', 'for-time': 'For Time', intervals: 'Intervals', tabata: 'Tabata' }
const CIRCUIT_COLOURS = {
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  emom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  amrap: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'for-time': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  intervals: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  tabata: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const SEED_HIIT = [
  {
    name: 'Bike Sprints', circuit_type: 'intervals', rounds: 8, rest_between_rounds_sec: 60,
    notes: '20 sec all-out sprint, 40 sec recovery. Build to 10 rounds.',
    exercises: [{ name: 'Assault Bike Sprint', work_seconds: 20, rest_seconds: 40 }],
  },
  {
    name: 'Rower Intervals', circuit_type: 'intervals', rounds: 6, rest_between_rounds_sec: 90,
    exercises: [{ name: 'Row', work_seconds: 45, rest_seconds: 15, notes: 'Push pace' }],
  },
  {
    name: 'Treadmill Sprints', circuit_type: 'intervals', rounds: 8, rest_between_rounds_sec: 60,
    exercises: [{ name: 'Treadmill Sprint', work_seconds: 30, rest_seconds: 30, notes: '10–12 km/h' }],
  },
  {
    name: 'Tabata', circuit_type: 'tabata', rounds: 8, rest_between_rounds_sec: 10,
    notes: '8 rounds of 20 sec work / 10 sec rest.',
    exercises: [{ name: 'Burpee', work_seconds: 20, rest_seconds: 10 }],
  },
  {
    name: 'Upper Body Circuit', circuit_type: 'custom', rounds: 3, rest_between_rounds_sec: 90,
    exercises: [
      { name: 'Push Up', work_seconds: 40, rest_seconds: 20 },
      { name: 'Dumbbell Row', work_seconds: 40, rest_seconds: 20 },
      { name: 'Dumbbell Shoulder Press', work_seconds: 40, rest_seconds: 20 },
      { name: 'Tricep Dip', work_seconds: 40, rest_seconds: 20 },
    ],
  },
  {
    name: 'Lower Body Circuit', circuit_type: 'custom', rounds: 3, rest_between_rounds_sec: 90,
    exercises: [
      { name: 'Jump Squat', work_seconds: 40, rest_seconds: 20 },
      { name: 'Hip Thrust', work_seconds: 40, rest_seconds: 20 },
      { name: 'Reverse Lunge', work_seconds: 40, rest_seconds: 20 },
      { name: 'Glute Bridge', work_seconds: 40, rest_seconds: 20 },
    ],
  },
  {
    name: 'Full Body Circuit', circuit_type: 'custom', rounds: 4, rest_between_rounds_sec: 60,
    exercises: [
      { name: 'Burpee', work_seconds: 40, rest_seconds: 20 },
      { name: 'Kettlebell Swing', work_seconds: 40, rest_seconds: 20 },
      { name: 'Box Jump', work_seconds: 40, rest_seconds: 20 },
      { name: 'Mountain Climber', work_seconds: 40, rest_seconds: 20 },
    ],
  },
  {
    name: 'EMOM – 10 Mins', circuit_type: 'emom', rounds: 10, rest_between_rounds_sec: 0,
    notes: 'Complete all reps at the start of each minute. Rest until the next minute begins.',
    exercises: [
      { name: 'Odd min: Kettlebell Swing ×15', work_seconds: 60, rest_seconds: 0 },
      { name: 'Even min: Goblet Squat ×10', work_seconds: 60, rest_seconds: 0 },
    ],
  },
  {
    name: 'Battle Ropes Circuit', circuit_type: 'intervals', rounds: 5, rest_between_rounds_sec: 45,
    exercises: [{ name: 'Battle Ropes', work_seconds: 30, rest_seconds: 15 }],
  },
  {
    name: 'Farmer Carries', circuit_type: 'intervals', rounds: 5, rest_between_rounds_sec: 60,
    notes: 'Heavy dumbbells or kettlebells. Focus on posture.',
    exercises: [{ name: 'Farmer Carry', work_seconds: 40, rest_seconds: 0, notes: '40m carry' }],
  },
  {
    name: 'Burpee Circuit', circuit_type: 'custom', rounds: 5, rest_between_rounds_sec: 60,
    exercises: [
      { name: 'Burpee', work_seconds: 45, rest_seconds: 15 },
      { name: 'Tuck Jump', work_seconds: 30, rest_seconds: 30 },
    ],
  },
  {
    name: 'Hyrox Style Conditioning', circuit_type: 'for-time', rounds: 1, rest_between_rounds_sec: 0,
    notes: 'Complete all exercises as fast as possible with good form.',
    exercises: [
      { name: 'Row 1000m', work_seconds: null, rest_seconds: 0 },
      { name: 'Sled Push 25m', work_seconds: null, rest_seconds: 0 },
      { name: 'Sled Pull 25m', work_seconds: null, rest_seconds: 0 },
      { name: 'Burpee Broad Jump 25m', work_seconds: null, rest_seconds: 0 },
      { name: 'Row 1000m', work_seconds: null, rest_seconds: 0 },
      { name: 'Farmer Carry 200m', work_seconds: null, rest_seconds: 0 },
      { name: 'Sandbag Lunges 100m', work_seconds: null, rest_seconds: 0 },
      { name: 'Wall Ball ×100', work_seconds: null, rest_seconds: 0 },
    ],
  },
]

function ExerciseRow({ ex, idx, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
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
      <input className="flex-1 input py-1 text-sm" placeholder="Exercise name" value={ex.name}
        onChange={e => onChange('name', e.target.value)} />
      <input type="number" min={0} className="input py-1 text-sm w-20 text-center" placeholder="Work sec"
        value={ex.work_seconds ?? ''} onChange={e => onChange('work_seconds', e.target.value ? parseInt(e.target.value) : null)} />
      <input type="number" min={0} className="input py-1 text-sm w-20 text-center" placeholder="Rest sec"
        value={ex.rest_seconds ?? ''} onChange={e => onChange('rest_seconds', e.target.value ? parseInt(e.target.value) : null)} />
      <button onClick={onRemove} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 text-xl leading-none flex-shrink-0">×</button>
    </div>
  )
}

function CircuitCard({ circuit, onSaved, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...circuit })
  const [exercises, setExercises] = useState(circuit.hiit_exercises || [])
  const [saving, setSaving] = useState(false)

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addExercise() {
    setExercises(prev => [...prev, { _key: Math.random().toString(36).slice(2), name: '', work_seconds: null, rest_seconds: null }])
  }

  function updateEx(idx, field, value) {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex))
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
    setSaving(true)
    await supabase.from('hiit_circuits').update({
      name: form.name.trim() || 'Circuit',
      circuit_type: form.circuit_type,
      rounds: form.rounds ? parseInt(form.rounds) : null,
      rest_between_rounds_sec: form.rest_between_rounds_sec ? parseInt(form.rest_between_rounds_sec) : null,
      notes: form.notes?.trim() || null,
    }).eq('id', circuit.id)

    await supabase.from('hiit_exercises').delete().eq('circuit_id', circuit.id)
    if (exercises.length > 0) {
      await supabase.from('hiit_exercises').insert(
        exercises.map((ex, i) => ({
          circuit_id: circuit.id,
          order_index: i,
          name: ex.name.trim() || 'Exercise',
          work_seconds: ex.work_seconds ?? null,
          rest_seconds: ex.rest_seconds ?? null,
          notes: ex.notes?.trim() || null,
        }))
      )
    }

    setSaving(false)
    setEditing(false)
    onSaved()
  }

  const typeClass = CIRCUIT_COLOURS[circuit.circuit_type] || CIRCUIT_COLOURS.custom

  return (
    <div className="card space-y-3">
      <div className="flex items-start gap-3">
        <button className="flex-1 text-left" onClick={() => !editing && setExpanded(o => !o)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeClass}`}>
              {CIRCUIT_TYPE_LABELS[circuit.circuit_type] || circuit.circuit_type}
            </span>
            {!editing && (
              <p className="font-semibold text-gray-900 dark:text-white">{circuit.name}</p>
            )}
          </div>
          {!editing && (
            <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
              {circuit.rounds && <span>{circuit.rounds} rounds</span>}
              {circuit.rest_between_rounds_sec && <span>{circuit.rest_between_rounds_sec}s rest between rounds</span>}
              <span>{(circuit.hiit_exercises || []).length} exercises</span>
            </div>
          )}
        </button>
        <div className="flex gap-2 flex-shrink-0">
          {!editing ? (
            <>
              <button onClick={() => { setEditing(true); setExpanded(true) }} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400">Edit</button>
              <button onClick={() => onDelete(circuit)} className="text-xs text-gray-400 hover:text-red-500">Archive</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
              <button onClick={save} disabled={saving} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">{saving ? 'Saving…' : 'Save'}</button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name</label>
            <input className="input w-full" value={form.name} onChange={e => setF('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Type</label>
            <select className="input w-full" value={form.circuit_type} onChange={e => setF('circuit_type', e.target.value)}>
              {CIRCUIT_TYPES.map(t => <option key={t} value={t}>{CIRCUIT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Rounds</label>
            <input type="number" min={1} className="input w-full" value={form.rounds ?? ''} onChange={e => setF('rounds', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Rest between rounds (sec)</label>
            <input type="number" min={0} className="input w-full" value={form.rest_between_rounds_sec ?? ''} onChange={e => setF('rest_between_rounds_sec', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
            <input className="input w-full" value={form.notes ?? ''} onChange={e => setF('notes', e.target.value)} />
          </div>
        </div>
      )}

      {(expanded || editing) && (
        <div className="border-t border-gray-50 dark:border-gray-800 pt-3 space-y-1">
          {exercises.length > 0 && (
            <div className="flex gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1 pl-6">
              <span className="flex-1">Exercise</span>
              <span className="w-20 text-center">Work</span>
              <span className="w-20 text-center">Rest</span>
              <span className="w-6" />
            </div>
          )}
          {exercises.map((ex, i) => editing ? (
            <ExerciseRow key={ex._key || ex.id || i} ex={ex} idx={i} total={exercises.length}
              onChange={(f, v) => updateEx(i, f, v)}
              onRemove={() => setExercises(prev => prev.filter((_, j) => j !== i))}
              onMoveUp={() => moveUp(i)} onMoveDown={() => moveDown(i)} />
          ) : (
            <div key={ex.id || i} className="flex items-center gap-3 py-1 pl-6 text-sm">
              <span className="flex-1 text-gray-700 dark:text-gray-300">{ex.name}</span>
              {ex.work_seconds && <span className="text-xs text-gray-400 w-20 text-center">{ex.work_seconds}s work</span>}
              {ex.rest_seconds ? <span className="text-xs text-gray-400 w-20 text-center">{ex.rest_seconds}s rest</span> : <span className="w-20" />}
            </div>
          ))}
          {editing && (
            <button onClick={addExercise}
              className="w-full py-2 text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add exercise
            </button>
          )}
        </div>
      )}

      {!expanded && !editing && (circuit.notes) && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{circuit.notes}</p>
      )}
    </div>
  )
}

function NewCircuitForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', circuit_type: 'custom', rounds: '', rest_between_rounds_sec: '', notes: '' })
  const [saving, setSaving] = useState(false)
  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
      rounds: form.rounds ? parseInt(form.rounds) : null,
      rest_between_rounds_sec: form.rest_between_rounds_sec ? parseInt(form.rest_between_rounds_sec) : null,
    })
    setSaving(false)
  }

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New circuit</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name *</label>
          <input className="input w-full" placeholder="e.g. HIIT Bike Circuit" value={form.name} onChange={e => setF('name', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Type</label>
          <select className="input w-full" value={form.circuit_type} onChange={e => setF('circuit_type', e.target.value)}>
            {CIRCUIT_TYPES.map(t => <option key={t} value={t}>{CIRCUIT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Rounds</label>
          <input type="number" min={1} className="input w-full" placeholder="e.g. 5" value={form.rounds} onChange={e => setF('rounds', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Rest between rounds (sec)</label>
          <input type="number" min={0} className="input w-full" placeholder="60" value={form.rest_between_rounds_sec} onChange={e => setF('rest_between_rounds_sec', e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
          <input className="input w-full" value={form.notes} onChange={e => setF('notes', e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">You can add exercises after creating the circuit.</p>
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Creating…' : 'Create circuit'}</button>
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
      </div>
    </div>
  )
}

export default function HiitLibrary() {
  const { profile } = useAuth()
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  async function load() {
    const { data } = await supabase
      .from('hiit_circuits')
      .select('*, hiit_exercises(*)')
      .eq('coach_id', profile.id)
      .eq('is_archived', false)
      .order('name')
    setCircuits((data || []).map(c => ({ ...c, hiit_exercises: (c.hiit_exercises || []).sort((a, b) => a.order_index - b.order_index) })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(form) {
    const { data } = await supabase.from('hiit_circuits').insert({ ...form, coach_id: profile.id }).select('id').single()
    setShowNew(false)
    if (data) await load()
  }

  async function handleDelete(circuit) {
    if (!confirm(`Archive "${circuit.name}"?`)) return
    await supabase.from('hiit_circuits').update({ is_archived: true }).eq('id', circuit.id)
    load()
  }

  async function seed() {
    setSeeding(true)
    const existing = new Set(circuits.map(c => c.name.toLowerCase()))
    for (const template of SEED_HIIT) {
      if (existing.has(template.name.toLowerCase())) continue
      const { data: circuit } = await supabase.from('hiit_circuits').insert({
        coach_id: profile.id,
        name: template.name,
        circuit_type: template.circuit_type,
        rounds: template.rounds ?? null,
        rest_between_rounds_sec: template.rest_between_rounds_sec ?? null,
        notes: template.notes || null,
      }).select('id').single()

      if (circuit?.id && template.exercises?.length) {
        await supabase.from('hiit_exercises').insert(
          template.exercises.map((ex, i) => ({
            circuit_id: circuit.id,
            order_index: i,
            name: ex.name,
            work_seconds: ex.work_seconds ?? null,
            rest_seconds: ex.rest_seconds ?? null,
            notes: ex.notes || null,
          }))
        )
      }
    }
    await load()
    setSeeding(false)
  }

  const filtered = circuits.filter(c => {
    if (filterType && c.circuit_type !== filterType) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HIIT &amp; Conditioning Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{circuits.length} circuit{circuits.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {circuits.length === 0 && (
            <button onClick={seed} disabled={seeding}
              className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
              {seeding ? 'Adding…' : 'Initialize with starter circuits'}
            </button>
          )}
          <button onClick={() => setShowNew(true)} className="btn-primary py-1.5 px-4 text-sm">+ New circuit</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input text-sm py-1.5 w-48" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input text-sm py-1.5" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {CIRCUIT_TYPES.map(t => <option key={t} value={t}>{CIRCUIT_TYPE_LABELS[t]}</option>)}
        </select>
        {(search || filterType) && <button onClick={() => { setSearch(''); setFilterType('') }} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>}
      </div>

      {showNew && <NewCircuitForm onSave={handleCreate} onCancel={() => setShowNew(false)} />}

      {filtered.length === 0 && !showNew ? (
        <div className="card text-center py-16">
          {circuits.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No circuits yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Initialize with 12 starter templates or build your own.</p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No circuits match your filters.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(c => (
            <CircuitCard key={c.id} circuit={c} onSaved={load} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
