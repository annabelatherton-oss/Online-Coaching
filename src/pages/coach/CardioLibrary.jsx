import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const TYPE_LABELS = {
  zone2: 'Zone 2',
  'steady-state': 'Steady State',
  interval: 'Intervals',
  outdoor: 'Outdoor',
  'cross-training': 'Cross Training',
  mobility: 'Mobility',
  recovery: 'Recovery',
  'daily-movement': 'Daily Movement',
  hiit: 'HIIT',
}

const TYPE_COLOURS = {
  zone2: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'steady-state': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  interval: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  outdoor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'cross-training': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  mobility: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  recovery: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'daily-movement': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  hiit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const SEED_CARDIO = [
  { name: 'Zone 2 Walk', cardio_type: 'zone2', duration_minutes: 45, intensity: 'low', notes: 'Keep heart rate in Zone 2 (60–70% max HR). Conversational pace.' },
  { name: 'Zone 2 Bike', cardio_type: 'zone2', duration_minutes: 45, intensity: 'low', notes: 'Steady state cycling in Zone 2. Should feel easy.' },
  { name: 'Zone 2 Cross Trainer', cardio_type: 'zone2', duration_minutes: 40, intensity: 'low', notes: 'Low intensity elliptical at conversational pace.' },
  { name: 'Zone 2 Row', cardio_type: 'zone2', duration_minutes: 30, intensity: 'low', notes: 'Rowing at an easy, sustainable pace.' },
  { name: 'Zone 2 Swim', cardio_type: 'zone2', duration_minutes: 30, intensity: 'low', notes: 'Easy swimming. Breathe comfortably throughout.' },
  { name: 'Incline Walk', cardio_type: 'steady-state', duration_minutes: 30, incline: 12, speed: 5, intensity: 'moderate', notes: '12% incline, 5 km/h. Focus on glutes and hamstrings.' },
  { name: 'Outdoor Run', cardio_type: 'outdoor', duration_minutes: 40, intensity: 'moderate' },
  { name: 'Treadmill Run', cardio_type: 'steady-state', duration_minutes: 30, intensity: 'moderate' },
  { name: 'Jog', cardio_type: 'outdoor', duration_minutes: 30, intensity: 'low', notes: 'Easy jog at conversational pace.' },
  { name: 'Recovery Walk', cardio_type: 'recovery', duration_minutes: 30, intensity: 'low', notes: 'Easy walking for active recovery. No targets, just move.' },
  { name: 'Weighted Walk', cardio_type: 'steady-state', duration_minutes: 30, intensity: 'low', notes: 'Walk with weighted vest to increase caloric burn.' },
  { name: '10,000 Steps', cardio_type: 'daily-movement', duration_minutes: 90, intensity: 'low', notes: 'Accumulate 10,000 steps throughout the day.' },
  { name: 'Stairmaster', cardio_type: 'steady-state', duration_minutes: 30, intensity: 'moderate', notes: 'Steady pace on the Stairmaster.' },
  { name: 'Assault Bike', cardio_type: 'interval', duration_minutes: 20, intensity: 'high', notes: 'High intensity intervals on the assault bike.' },
  { name: 'Spin Bike', cardio_type: 'steady-state', duration_minutes: 45, intensity: 'moderate' },
  { name: 'Swimming', cardio_type: 'steady-state', duration_minutes: 30, intensity: 'moderate' },
  { name: 'Cycling', cardio_type: 'outdoor', duration_minutes: 60, intensity: 'moderate' },
  { name: 'Mobility Session', cardio_type: 'mobility', duration_minutes: 20, intensity: 'low', notes: 'Dynamic and static stretching for full range of motion.' },
  { name: 'Stretching', cardio_type: 'recovery', duration_minutes: 15, intensity: 'low', notes: 'Static stretching, hold each stretch 30–60 seconds.' },
  { name: 'Recovery Session', cardio_type: 'recovery', duration_minutes: 20, intensity: 'low', notes: 'Light movement, foam rolling, mobility work.' },
]

const EMPTY_FORM = { name: '', cardio_type: '', duration_minutes: '', distance_km: '', heart_rate_zone: '', intensity: '', pace: '', incline: '', speed: '', notes: '', progression: '' }

function CardioModal({ session, onSave, onClose }) {
  const [form, setForm] = useState(session ? { ...session } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function set(f, v) { setForm(x => ({ ...x, [f]: v })) }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({
      ...form,
      name: form.name.trim(),
      duration_minutes: form.duration_minutes !== '' ? parseInt(form.duration_minutes) : null,
      distance_km: form.distance_km !== '' ? parseFloat(form.distance_km) : null,
      incline: form.incline !== '' ? parseFloat(form.incline) : null,
      speed: form.speed !== '' ? parseFloat(form.speed) : null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{session ? 'Edit session' : 'Add cardio session'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Name *</label>
            <input className="input w-full" placeholder="e.g. Zone 2 Bike" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Type</label>
              <select className="input w-full" value={form.cardio_type} onChange={e => set('cardio_type', e.target.value)}>
                <option value="">Select…</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Duration (minutes)</label>
              <input type="number" min={1} className="input w-full" placeholder="45" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Intensity</label>
              <select className="input w-full" value={form.intensity} onChange={e => set('intensity', e.target.value)}>
                <option value="">Select…</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Heart rate zone</label>
              <input className="input w-full" placeholder="e.g. Zone 2" value={form.heart_rate_zone} onChange={e => set('heart_rate_zone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Distance (km, optional)</label>
              <input type="number" min={0} step={0.1} className="input w-full" placeholder="5.0" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Pace</label>
              <input className="input w-full" placeholder="e.g. 6:00/km" value={form.pace} onChange={e => set('pace', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Incline (%)</label>
              <input type="number" min={0} step={0.5} className="input w-full" placeholder="12" value={form.incline} onChange={e => set('incline', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Speed (km/h)</label>
              <input type="number" min={0} step={0.5} className="input w-full" placeholder="5.0" value={form.speed} onChange={e => set('speed', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Notes</label>
            <textarea rows={3} className="input w-full resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Progression</label>
            <textarea rows={2} className="input w-full resize-none" placeholder="How to progress this session over time…" value={form.progression} onChange={e => set('progression', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900">
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary py-2 px-5 text-sm">
            {saving ? 'Saving…' : session ? 'Save changes' : 'Add session'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CardioLibrary() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')
  const [seeding, setSeeding] = useState(false)

  async function load() {
    const { data } = await supabase.from('cardio_sessions').select('*').eq('coach_id', profile.id).eq('is_archived', false).order('name')
    setSessions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(form) {
    if (modal === 'new') {
      await supabase.from('cardio_sessions').insert({ ...form, coach_id: profile.id })
    } else {
      await supabase.from('cardio_sessions').update(form).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function handleDelete(s) {
    if (!confirm(`Archive "${s.name}"?`)) return
    await supabase.from('cardio_sessions').update({ is_archived: true }).eq('id', s.id)
    load()
  }

  async function seed() {
    setSeeding(true)
    const existing = new Set(sessions.map(s => s.name.toLowerCase()))
    const toInsert = SEED_CARDIO.filter(s => !existing.has(s.name.toLowerCase())).map(s => ({ ...s, coach_id: profile.id }))
    if (toInsert.length) {
      await supabase.from('cardio_sessions').insert(toInsert)
      await load()
    }
    setSeeding(false)
  }

  const filtered = sessions.filter(s => {
    if (filterType && s.cardio_type !== filterType) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cardio Library</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {sessions.length === 0 && (
            <button onClick={seed} disabled={seeding}
              className="text-sm text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors">
              {seeding ? 'Adding…' : 'Initialize with starter sessions'}
            </button>
          )}
          <button onClick={() => setModal('new')} className="btn-primary py-1.5 px-4 text-sm">+ Add session</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input text-sm py-1.5 w-48" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input text-sm py-1.5" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || filterType) && <button onClick={() => { setSearch(''); setFilterType('') }} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Clear</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          {sessions.length === 0 ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No cardio sessions yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Initialize with 20 starter sessions or add your own.</p>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-sm">No sessions match your filters.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <div key={s.id} className="card group hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {s.cardio_type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOURS[s.cardio_type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[s.cardio_type] || s.cardio_type}
                      </span>
                    )}
                    {s.intensity && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-medium capitalize">{s.intensity}</span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {s.duration_minutes && <span>{s.duration_minutes} min</span>}
                    {s.distance_km && <span>{s.distance_km} km</span>}
                    {s.incline && <span>{s.incline}% incline</span>}
                    {s.speed && <span>{s.speed} km/h</span>}
                  </div>
                  {s.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2">{s.notes}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal(s)} className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 px-1.5 py-1">Edit</button>
                  <button onClick={() => handleDelete(s)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1">Archive</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CardioModal
          session={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
