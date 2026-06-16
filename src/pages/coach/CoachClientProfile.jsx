import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'

const TABS = ['Overview', 'Meal Plan', 'Weight', 'Measurements', 'Photos', 'Notes']

function StatusBadge({ client }) {
  const now = new Date()
  const exp = client.access_expires_at ? new Date(client.access_expires_at) : null
  const expired = exp && exp < now
  if (client.is_paused)
    return <span className="badge bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Paused</span>
  if (expired)
    return <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">Expired</span>
  if (client.is_active)
    return <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
  return <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Inactive</span>
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ client, onSaved }) {
  const [form, setForm] = useState({
    goal: client.goal || '',
    current_calories: client.current_calories || '',
    current_protein: client.current_protein || '',
    current_carbs: client.current_carbs || '',
    current_fat: client.current_fat || '',
    start_date: client.start_date ? client.start_date.split('T')[0] : '',
    access_weeks: client.access_weeks || 4,
    is_paused: client.is_paused || false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: err } = await supabase
      .from('clients')
      .update({
        goal: form.goal,
        current_calories: form.current_calories ? parseInt(form.current_calories) : null,
        current_protein: form.current_protein ? parseInt(form.current_protein) : null,
        current_carbs: form.current_carbs ? parseInt(form.current_carbs) : null,
        current_fat: form.current_fat ? parseInt(form.current_fat) : null,
        start_date: form.start_date,
        access_weeks: parseInt(form.access_weeks),
        is_paused: form.is_paused,
      })
      .eq('id', client.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  const expiry = client.access_expires_at
    ? new Date(client.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Goal */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Programme Details</h3>
        <div>
          <label className="label">Goal</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={form.goal}
            onChange={e => set('goal', e.target.value)}
            placeholder="e.g. Lose 10kg, build lean muscle"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input
              className="input"
              type="date"
              value={form.start_date}
              onChange={e => set('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Access (weeks)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={52}
              value={form.access_weeks}
              onChange={e => set('access_weeks', e.target.value)}
            />
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Access expires: <span className="font-medium text-gray-700 dark:text-gray-200">{expiry}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="is_paused"
            type="checkbox"
            checked={form.is_paused}
            onChange={e => set('is_paused', e.target.checked)}
            className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
          />
          <label htmlFor="is_paused" className="text-sm text-gray-700 dark:text-gray-300">Pause client access</label>
        </div>
      </div>

      {/* Nutrition */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Current Nutrition Targets</h3>
        <div>
          <label className="label">Calories (kcal/day)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={form.current_calories}
            onChange={e => set('current_calories', e.target.value)}
            placeholder="e.g. 1800"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Protein (g)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.current_protein}
              onChange={e => set('current_protein', e.target.value)}
              placeholder="e.g. 150"
            />
          </div>
          <div>
            <label className="label">Carbs (g)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.current_carbs}
              onChange={e => set('current_carbs', e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          <div>
            <label className="label">Fat (g)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={form.current_fat}
              onChange={e => set('current_fat', e.target.value)}
              placeholder="e.g. 70"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
    </form>
  )
}

// ─── Weight Tab ───────────────────────────────────────────────────────────────
function WeightTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: '',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('weight_entries').insert({
      client_id: clientId,
      weight_kg: parseFloat(form.weight_kg),
      recorded_at: form.date,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ date: new Date().toISOString().split('T')[0], weight_kg: '' })
    load()
  }

  async function deleteEntry(id) {
    await supabase.from('weight_entries').delete().eq('id', id)
    load()
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h3>
        <WeightChart data={entries} />
      </div>

      {/* Add entry */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Entries</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEntry} className="card flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="flex-1">
            <label className="label">Weight (kg)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              required
              value={form.weight_kg}
              onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
              placeholder="e.g. 72.5"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary whitespace-nowrap">
            {saving ? 'Saving…' : 'Add'}
          </button>
        </form>
      )}

      {/* Table */}
      {entries.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No weight entries yet. Add the first one above.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(entry.recorded_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{entry.weight_kg} kg</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Measurements Tab ────────────────────────────────────────────────────────
function MeasurementsTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '',
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('measurements').insert({
      client_id: clientId,
      recorded_at: form.date,
      chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null,
      waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
      hips_cm: form.hips_cm ? parseFloat(form.hips_cm) : null,
      thighs_cm: form.thighs_cm ? parseFloat(form.thighs_cm) : null,
      arms_cm: form.arms_cm ? parseFloat(form.arms_cm) : null,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ date: new Date().toISOString().split('T')[0], chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '' })
    load()
  }

  async function deleteEntry(id) {
    await supabase.from('measurements').delete().eq('id', id)
    load()
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function fmtVal(v) {
    return v != null ? `${v} cm` : '—'
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  const latest = entries[0]

  return (
    <div className="space-y-6">
      {/* Latest summary card */}
      {latest && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Latest Measurements — {fmtDate(latest.recorded_at)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Chest', value: latest.chest_cm },
              { label: 'Waist', value: latest.waist_cm },
              { label: 'Hips', value: latest.hips_cm },
              { label: 'Thighs', value: latest.thighs_cm },
              { label: 'Arms', value: latest.arms_cm },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{fmtVal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">
          {showForm ? 'Cancel' : 'Add Measurements'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEntry} className="card space-y-4">
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'chest_cm', label: 'Chest (cm)' },
              { key: 'waist_cm', label: 'Waist (cm)' },
              { key: 'hips_cm', label: 'Hips (cm)' },
              { key: 'thighs_cm', label: 'Thighs (cm)' },
              { key: 'arms_cm', label: 'Arms (cm)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Measurements'}
            </button>
          </div>
        </form>
      )}

      {/* History table */}
      {entries.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No measurements yet.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chest</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waist</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hips</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thighs</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Arms</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtDate(e.recorded_at)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e.chest_cm)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e.waist_cm)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e.hips_cm)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e.thighs_cm)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e.arms_cm)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Photos Tab ───────────────────────────────────────────────────────────────
function PhotosTab({ clientId }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('client_id', clientId)
      .order('recorded_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId])

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    setStorageError(false)

    for (const file of files) {
      const path = `${clientId}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('progress-photos')
        .upload(path, file)

      if (uploadErr) {
        console.error(uploadErr)
        setStorageError(true)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(path)

      await supabase.from('progress_photos').insert({
        client_id: clientId,
        photo_url: urlData.publicUrl,
        recorded_at: new Date().toISOString().split('T')[0],
      })
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    load()
  }

  async function deletePhoto(photo) {
    // Extract storage path from URL
    const url = photo.photo_url
    const bucketMarker = '/progress-photos/'
    const idx = url.indexOf(bucketMarker)
    if (idx !== -1) {
      const storagePath = decodeURIComponent(url.slice(idx + bucketMarker.length))
      await supabase.storage.from('progress-photos').remove([storagePath])
    }
    await supabase.from('progress_photos').delete().eq('id', photo.id)
    if (lightbox?.id === photo.id) setLightbox(null)
    load()
  }

  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6">
      {storageError && (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Photo storage not configured yet — see SETUP.md
          </p>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading ? 'Uploading…' : 'Upload Photos'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <p className="text-xs text-gray-400">Accepts JPG, PNG, HEIC, WebP</p>
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No progress photos yet. Upload the first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Progress photo'}
                className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightbox(photo)}
              />
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(photo.recorded_at)}</p>
                {photo.caption && <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 truncate">{photo.caption}</p>}
              </div>
              <button
                onClick={() => deletePhoto(photo)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete photo"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightbox.photo_url}
              alt={lightbox.caption || 'Progress photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <div className="mt-2 text-center text-white/80 text-sm">{fmtDate(lightbox.recorded_at)}{lightbox.caption ? ` — ${lightbox.caption}` : ''}</div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({ client }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  async function handleBlur() {
    if (notes === (client.notes || '')) return
    setSaving(true)
    await supabase
      .from('clients')
      .update({ notes })
      .eq('id', client.id)
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Coach Notes</h3>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {savedMsg && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
      <textarea
        className="input resize-y min-h-[300px]"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder="Private notes about this client — auto-saves when you click away."
      />
      <p className="text-xs text-gray-400 dark:text-gray-500">Notes are private and only visible to you. Auto-saves on blur.</p>
    </div>
  )
}

// ─── Meal Plan Tab ────────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

function MealPlanTab({ client, coachId }) {
  const [planGroups, setPlanGroups] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [planGroup, setPlanGroup] = useState(null)
  // Current week's meal slots: merged from template + any client-specific overrides
  const [editedSlots, setEditedSlots] = useState({})   // { slotKey: meal_id }
  const [templateSlots, setTemplateSlots] = useState({}) // { slotKey: meal_id } from template
  const [slotsDirty, setSlotsDirty] = useState(false)
  const [savingSlots, setSavingSlots] = useState(false)
  const [repeating, setRepeating] = useState(false)
  // All meals for dropdowns
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  // Assignment form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    plan_group_id: '',
    calorie_target: client.current_calories || '',
    starting_week: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Week override inline
  const [showOverride, setShowOverride] = useState(false)
  const [overrideWeek, setOverrideWeek] = useState('')

  async function loadWeekSlots(asgn, weekNum, planGroupId) {
    const [{ data: tmpl }, { data: cwm }] = await Promise.all([
      supabase
        .from('weekly_templates')
        .select('template_meal_slots(slot_type, meal_id)')
        .eq('plan_group_id', planGroupId)
        .eq('week_number', weekNum)
        .maybeSingle(),
      supabase
        .from('client_week_meals')
        .select('slots')
        .eq('assignment_id', asgn.id)
        .eq('week_number', weekNum)
        .maybeSingle(),
    ])
    const tSlots = {}
    for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
    setTemplateSlots(tSlots)
    setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
    setSlotsDirty(false)
  }

  async function load() {
    const [{ data: groups }, { data: asgn }, { data: mealsData }] = await Promise.all([
      supabase.from('plan_groups').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
      supabase
        .from('client_plan_assignments')
        .select('*')
        .eq('client_id', client.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('meals').select('id, name, category').eq('coach_id', coachId).order('name'),
    ])

    const allGroups = groups || []
    setPlanGroups(allGroups)
    setAssignment(asgn || null)

    const byCat = {}
    for (const m of (mealsData || [])) {
      ;(byCat[m.category] = byCat[m.category] || []).push(m)
    }
    setMealsByCategory(byCat)

    if (asgn) {
      const pg = allGroups.find(g => g.id === asgn.plan_group_id) || null
      setPlanGroup(pg)
      setOverrideWeek(asgn.week_override ?? '')
      if (pg) {
        const ew = asgn.week_override ?? pg.current_week
        await loadWeekSlots(asgn, ew, pg.id)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  const globalWeek = planGroup?.current_week ?? null
  const effectiveWeek = assignment?.week_override ?? globalWeek
  const isOverridden = assignment?.week_override != null
  const hasCustom = MEAL_SLOTS.some(s => editedSlots[s.key] && editedSlots[s.key] !== templateSlots[s.key])

  function changeSlot(key, mealId) {
    setEditedSlots(prev => ({ ...prev, [key]: mealId || null }))
    setSlotsDirty(true)
  }

  async function handleSaveSlots() {
    if (!assignment || effectiveWeek == null) return
    setSavingSlots(true)
    await supabase.from('client_week_meals').upsert(
      { client_id: client.id, coach_id: coachId, assignment_id: assignment.id, week_number: effectiveWeek, slots: editedSlots },
      { onConflict: 'assignment_id,week_number' }
    )
    setSavingSlots(false)
    setSlotsDirty(false)
  }

  async function handleRepeatLastWeek() {
    if (!assignment || effectiveWeek == null) return
    setRepeating(true)
    const prevWeek = effectiveWeek > 1 ? effectiveWeek - 1 : 20
    const [{ data: prevTmpl }, { data: prevCwm }] = await Promise.all([
      supabase
        .from('weekly_templates')
        .select('template_meal_slots(slot_type, meal_id)')
        .eq('plan_group_id', assignment.plan_group_id)
        .eq('week_number', prevWeek)
        .maybeSingle(),
      supabase
        .from('client_week_meals')
        .select('slots')
        .eq('assignment_id', assignment.id)
        .eq('week_number', prevWeek)
        .maybeSingle(),
    ])
    const prevTSlots = {}
    for (const s of (prevTmpl?.template_meal_slots || [])) prevTSlots[s.slot_type] = s.meal_id
    const prevMerged = { ...prevTSlots, ...(prevCwm?.slots || {}) }
    setEditedSlots(prevMerged)
    setSlotsDirty(true)
    setRepeating(false)
  }

  async function handleAssign(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    await supabase.from('client_plan_assignments').update({ active: false }).eq('client_id', client.id)
    const group = planGroups.find(g => g.id === form.plan_group_id)
    const startingWeek = form.starting_week ? parseInt(form.starting_week) : null
    const { error: err } = await supabase.from('client_plan_assignments').insert({
      client_id: client.id,
      coach_id: coachId,
      plan_group_id: form.plan_group_id,
      plan_group_name: group?.name || '20 Week Plan',
      calorie_target: form.calorie_target ? parseInt(form.calorie_target) : null,
      start_date: new Date().toISOString().split('T')[0],
      week_override: startingWeek,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    load()
  }

  async function handleSaveOverride(e) {
    e.preventDefault()
    const val = overrideWeek !== '' ? parseInt(overrideWeek) : null
    await supabase.from('client_plan_assignments').update({ week_override: val }).eq('id', assignment.id)
    setShowOverride(false)
    load()
  }

  async function handleClearOverride() {
    await supabase.from('client_plan_assignments').update({ week_override: null }).eq('id', assignment.id)
    setOverrideWeek('')
    load()
  }

  async function handleRemove() {
    if (!confirm('Remove this meal plan assignment?')) return
    await supabase.from('client_plan_assignments').update({ active: false }).eq('client_id', client.id)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── No assignment ─────────────────────────────────── */}
      {!assignment && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">No meal plan assigned yet.</p>
          {planGroups.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Generate a 20-week plan from the Templates page first.
            </p>
          ) : (
            <button onClick={() => setShowForm(true)} className="btn-primary">Assign Meal Plan</button>
          )}
        </div>
      )}

      {/* ── Assign / change form ──────────────────────────── */}
      {showForm && (
        <form onSubmit={handleAssign} className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {assignment ? 'Change Meal Plan' : 'Assign Meal Plan'}
          </h3>
          <div>
            <label className="label">Plan</label>
            <select
              className="input" required value={form.plan_group_id}
              onChange={e => {
                const pg = planGroups.find(g => g.id === e.target.value)
                setForm(f => ({ ...f, plan_group_id: e.target.value, starting_week: pg?.current_week ?? '' }))
              }}
            >
              <option value="">Select a plan…</option>
              {planGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name} (currently Week {g.current_week})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Calorie target (kcal/day)</label>
              <input
                className="input" type="number" min="800" max="5000" step="50"
                value={form.calorie_target}
                onChange={e => setForm(f => ({ ...f, calorie_target: e.target.value }))}
                placeholder="e.g. 1800"
              />
            </div>
            <div>
              <label className="label">Starting week</label>
              <select
                className="input" value={form.starting_week}
                onChange={e => setForm(f => ({ ...f, starting_week: e.target.value }))}
              >
                <option value="">Follow plan's current week</option>
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !form.plan_group_id} className="btn-primary">
              {saving ? 'Saving…' : assignment ? 'Update' : 'Assign Plan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* ── Active assignment ─────────────────────────────── */}
      {assignment && planGroup && (
        <>
          {/* Header card */}
          <div className="card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {assignment.plan_group_name || planGroup.name}
                </h3>
                {assignment.calorie_target && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {assignment.calorie_target} kcal / day
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => { setForm({ plan_group_id: assignment.plan_group_id, calorie_target: assignment.calorie_target || '', starting_week: '' }); setShowForm(true); setShowOverride(false) }}
                  className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
                >
                  Change
                </button>
                <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
              </div>
            </div>

            {/* Week status */}
            <div className="flex items-center gap-5 py-3 px-4 rounded-xl bg-pink-50/60 dark:bg-pink-900/10">
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{effectiveWeek ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Week</p>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {isOverridden ? (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Week {assignment.week_override} <span className="text-xs font-normal text-orange-500">(individual override)</span>
                    </p>
                    <p className="text-xs text-gray-400">Plan is on Week {globalWeek}</p>
                    <button onClick={handleClearOverride} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                      Clear → follow plan (Week {globalWeek})
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Following plan — same week as all clients</p>
                    <button
                      onClick={() => { setOverrideWeek(globalWeek ?? 1); setShowOverride(true) }}
                      className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                    >
                      Put on a different week
                    </button>
                  </>
                )}
              </div>
            </div>

            {showOverride && (
              <form onSubmit={handleSaveOverride} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Put on week:</span>
                <select
                  className="input py-1" value={overrideWeek}
                  onChange={e => setOverrideWeek(e.target.value)}
                >
                  {Array.from({ length: 20 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Save</button>
                <button type="button" onClick={() => setShowOverride(false)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
              </form>
            )}
          </div>

          {/* ── Meal slots for this week ─────────────────── */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Week {effectiveWeek} meals
                </h3>
                {hasCustom && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                    Customised
                  </span>
                )}
              </div>
              <button
                onClick={handleRepeatLastWeek}
                disabled={repeating || effectiveWeek == null}
                className="btn-secondary text-xs py-1.5 px-3"
                title={`Copy Week ${effectiveWeek != null && effectiveWeek > 1 ? effectiveWeek - 1 : 20} meals to this week`}
              >
                {repeating ? 'Loading…' : `← Repeat Week ${effectiveWeek != null && effectiveWeek > 1 ? effectiveWeek - 1 : 20}`}
              </button>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {MEAL_SLOTS.map(slot => {
                const currentId = editedSlots[slot.key] || ''
                const options = mealsByCategory[slot.cat] || []
                const isChanged = currentId !== (templateSlots[slot.key] || '')
                return (
                  <div key={slot.key} className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                    <span className="w-28 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      {slot.label}
                    </span>
                    <select
                      className={`flex-1 text-sm bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0 ${isChanged ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-800 dark:text-gray-200'}`}
                      value={currentId}
                      onChange={e => changeSlot(slot.key, e.target.value)}
                    >
                      <option value="">— None —</option>
                      {options.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {isChanged && (
                      <span className="flex-shrink-0 text-xs text-orange-400 dark:text-orange-500">changed</span>
                    )}
                  </div>
                )
              })}
            </div>

            {slotsDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
                <button onClick={handleSaveSlots} disabled={savingSlots} className="btn-primary py-1.5 px-4 text-sm">
                  {savingSlots ? 'Saving…' : 'Save meal changes'}
                </button>
                <button
                  onClick={() => { setEditedSlots({ ...templateSlots }); setSlotsDirty(false) }}
                  className="text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Reset to template
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoachClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

  async function loadClient() {
    const { data, error: err } = await supabase
      .from('clients')
      .select(`
        id, coach_id, profile_id, goal, current_calories, current_protein,
        current_carbs, current_fat, start_date, access_weeks, access_expires_at,
        is_active, is_paused, notes, created_at, tags,
        profiles!clients_profile_id_fkey(full_name, email)
      `)
      .eq('id', clientId)
      .eq('coach_id', profile.id)
      .single()

    if (err || !data) {
      setError('Client not found or you do not have access.')
    } else {
      setClient(data)
    }
    setLoading(false)
  }

  useEffect(() => { loadClient() }, [clientId])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={() => navigate('/coach/clients')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </button>
        <div className="flex items-center gap-3 sm:ml-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="font-semibold text-brand-700 dark:text-brand-400 text-sm">
              {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.profiles?.full_name || '—'}</h1>
              <StatusBadge client={client} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{client.profiles?.email}</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'Overview' && (
          <OverviewTab client={client} onSaved={loadClient} />
        )}
        {activeTab === 'Meal Plan' && (
          <MealPlanTab client={client} coachId={profile.id} />
        )}
        {activeTab === 'Weight' && (
          <WeightTab clientId={client.id} />
        )}
        {activeTab === 'Measurements' && (
          <MeasurementsTab clientId={client.id} />
        )}
        {activeTab === 'Photos' && (
          <PhotosTab clientId={client.id} />
        )}
        {activeTab === 'Notes' && (
          <NotesTab client={client} />
        )}
      </div>
    </div>
  )
}
