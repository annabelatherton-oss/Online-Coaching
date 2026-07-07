import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CoachTrainingList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', weeks_total: 12 })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('training_programs')
      .select('*')
      .eq('coach_id', profile.id)
      .order('created_at', { ascending: false })
    setPrograms(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase
      .from('training_programs')
      .insert({ coach_id: profile.id, name: form.name.trim(), weeks_total: parseInt(form.weeks_total) })
      .select('id')
      .single()
    setSaving(false)
    if (data) navigate(`/coach/training/${data.id}`)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this programme and all its sessions? This cannot be undone.')) return
    await supabase.from('training_programs').delete().eq('id', id)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Training Programmes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage workout plans for your clients</p>
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
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !form.name.trim()} className="btn-primary">
              {saving ? 'Creating…' : 'Create & edit'}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {programs.length === 0 && !creating ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">No training programmes yet.</p>
          <button onClick={() => setCreating(true)} className="btn-primary">Create your first programme</button>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map(p => (
            <div key={p.id} className="card flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
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
  )
}
