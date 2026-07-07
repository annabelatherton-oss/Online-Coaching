import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const BLOCKS = [
  { key: 'Block 1', label: 'Block 1', subtitle: 'Hypertrophy / Foundations' },
  { key: 'Block 2', label: 'Block 2', subtitle: 'Strength & Hypertrophy' },
  { key: 'Block 3', label: 'Block 3', subtitle: 'Hypertrophy Variation' },
]

const DAY_ORDER = ['5 Day', '4 Day', '3 Day']

function getDayVariant(name) {
  for (const d of DAY_ORDER) {
    if (name.startsWith(d)) return d
  }
  return null
}

function getBlock(name) {
  for (const b of BLOCKS) {
    if (name.includes(b.key)) return b.key
  }
  return null
}

export default function CoachTrainingList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', weeks_total: 12 })
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('training_programs')
      .select('*')
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: true })
    setPrograms(data || [])
    setLoading(false)
    if (error) console.error('load error:', error)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setCreateError('')
    const { data, error } = await supabase
      .from('training_programs')
      .insert({ coach_id: profile.id, name: form.name.trim(), weeks_total: parseInt(form.weeks_total) })
      .select('id')
      .single()
    setSaving(false)
    if (error) { setCreateError(error.message); return }
    if (data) navigate(`/coach/training/${data.id}`)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this programme and all its sessions? This cannot be undone.')) return
    await supabase.from('training_programs').delete().eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // Separate block programmes from custom ones
  const blockMap = {}
  BLOCKS.forEach(b => { blockMap[b.key] = {} })

  const custom = []

  programs.forEach(p => {
    const block = getBlock(p.name)
    const day = getDayVariant(p.name)
    if (block && day) {
      blockMap[block][day] = p
    } else {
      custom.push(p)
    }
  })

  const hasBlocks = BLOCKS.some(b => Object.keys(blockMap[b.key]).length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Programmes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage workout blocks for your clients</p>
        </div>
        <button onClick={() => setCreating(v => !v)} className="btn-primary">
          {creating ? 'Cancel' : 'New programme'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">New Training Programme</h2>
          <div>
            <label className="label">Programme name</label>
            <input
              className="input"
              required
              autoFocus
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. 12-Week Strength Block"
            />
          </div>
          <div>
            <label className="label">Total weeks</label>
            <input
              className="input"
              type="number"
              min={1}
              max={52}
              value={form.weeks_total}
              onChange={e => setForm(f => ({ ...f, weeks_total: e.target.value }))}
            />
          </div>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary">
              {saving ? 'Creating…' : 'Create & edit'}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {!hasBlocks && !creating && custom.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">No training programmes yet.</p>
          <button onClick={() => setCreating(true)} className="btn-primary">Create your first programme</button>
        </div>
      ) : (
        <div className="space-y-4">
          {BLOCKS.map((block, bi) => {
            const variants = blockMap[block.key]
            const hasAny = Object.keys(variants).length > 0
            return (
              <div key={block.key} className="card space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0 text-brand-600 dark:text-brand-400 font-bold text-sm">
                    B{bi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{block.label}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{block.subtitle}</p>
                  </div>
                </div>

                {hasAny ? (
                  <div className="grid grid-cols-3 gap-3">
                    {DAY_ORDER.map(day => {
                      const prog = variants[day]
                      if (!prog) return (
                        <div key={day} className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-sm text-gray-400 dark:text-gray-600">
                          {day}<br /><span className="text-xs">not set up</span>
                        </div>
                      )
                      return (
                        <button
                          key={day}
                          onClick={() => navigate(`/coach/training/${prog.id}`)}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 dark:hover:border-brand-500 transition-colors p-4 text-left group"
                        >
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {day}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {prog.weeks_total} weeks
                          </p>
                          <p className="text-xs text-brand-500 dark:text-brand-400 mt-2 font-medium">
                            Edit →
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    No programmes seeded for this block yet.
                  </p>
                )}
              </div>
            )
          })}

          {custom.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Custom Programmes</h2>
              {custom.map(p => (
                <div key={p.id} className="card flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {p.weeks_total} weeks · currently week {p.current_week}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Link to={`/coach/training/${p.id}`} className="btn-secondary py-1.5 px-3 text-sm">Edit</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
