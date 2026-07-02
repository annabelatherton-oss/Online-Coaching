import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'
import { MACRO_SPLIT, calcMacrosFromSplit, splitPercentFromGrams } from '../../lib/macros'
import { CALORIE_TIERS } from '../../lib/calorieTiers'

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
  // The carbs/protein/fat split (% of calories) driving the gram fields below.
  const [split, setSplit] = useState(splitPercentFromGrams(
    { protein_g: client.current_protein, carbs_g: client.current_carbs, fat_g: client.current_fat },
    client.current_calories
  ))

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function applySplit(calories, splitPct) {
    const grams = calcMacrosFromSplit(calories, splitPct)
    setForm(f => ({
      ...f,
      current_calories: calories,
      current_protein: calories ? String(grams.protein_g) : '',
      current_carbs: calories ? String(grams.carbs_g) : '',
      current_fat: calories ? String(grams.fat_g) : '',
    }))
  }

  function setCalories(value) {
    applySplit(value, split)
  }

  function setSplitPct(field, value) {
    const pct = value === '' ? '' : Number(value)
    const nextSplit = { ...split, [field]: pct }
    setSplit(nextSplit)
    applySplit(form.current_calories, { carbs: nextSplit.carbs || 0, protein: nextSplit.protein || 0, fat: nextSplit.fat || 0 })
  }

  function resetToStandardSplit() {
    setSplit({ ...MACRO_SPLIT })
    applySplit(form.current_calories, MACRO_SPLIT)
  }

  const splitTotal = (Number(split.carbs) || 0) + (Number(split.protein) || 0) + (Number(split.fat) || 0)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    const { error: err } = await supabase.from('clients').update({
      goal: form.goal,
      current_calories: form.current_calories ? parseInt(form.current_calories) : null,
      current_protein: form.current_protein ? parseInt(form.current_protein) : null,
      current_carbs: form.current_carbs ? parseInt(form.current_carbs) : null,
      current_fat: form.current_fat ? parseInt(form.current_fat) : null,
      start_date: form.start_date,
      access_weeks: parseInt(form.access_weeks),
      is_paused: form.is_paused,
    }).eq('id', client.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    onSaved()
  }

  const expiry = client.access_expires_at
    ? new Date(client.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Programme Details</h3>
        <div>
          <label className="label">Goal</label>
          <textarea className="input resize-none" rows={3} value={form.goal} onChange={e => set('goal', e.target.value)} placeholder="e.g. Lose 10kg, build lean muscle" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date</label>
            <input className="input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Access (weeks)</label>
            <input className="input" type="number" min={1} max={52} value={form.access_weeks} onChange={e => set('access_weeks', e.target.value)} />
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Access expires: <span className="font-medium text-gray-700 dark:text-gray-200">{expiry}</span>
        </div>
        <div className="flex items-center gap-2">
          <input id="is_paused" type="checkbox" checked={form.is_paused} onChange={e => set('is_paused', e.target.checked)} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500" />
          <label htmlFor="is_paused" className="text-sm text-gray-700 dark:text-gray-300">Pause client access</label>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Current Nutrition Targets</h3>
          <button
            type="button"
            onClick={resetToStandardSplit}
            className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            Use standard split (40/35/25)
          </button>
        </div>
        <div>
          <label className="label">Calories (kcal/day)</label>
          <input className="input" type="number" min={0} value={form.current_calories} onChange={e => setCalories(e.target.value)} placeholder="e.g. 1800" />
        </div>
        <div>
          <label className="label !mb-0">Macro split (% of calories)</label>
          <div className="grid grid-cols-3 gap-4 mt-1">
            <div>
              <label className="label">Carbs %</label>
              <input className="input" type="number" min={0} max={100} value={split.carbs} onChange={e => setSplitPct('carbs', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_carbs || 0}g</p>
            </div>
            <div>
              <label className="label">Protein %</label>
              <input className="input" type="number" min={0} max={100} value={split.protein} onChange={e => setSplitPct('protein', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_protein || 0}g</p>
            </div>
            <div>
              <label className="label">Fat %</label>
              <input className="input" type="number" min={0} max={100} value={split.fat} onChange={e => setSplitPct('fat', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{form.current_fat || 0}g</p>
            </div>
          </div>
          {splitTotal !== 100 && (
            <p className="text-xs text-amber-500 mt-2">Split totals {splitTotal}% — adjust so the three add up to 100%.</p>
          )}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><p className="text-sm text-red-700 dark:text-red-400">{error}</p></div>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
    </form>
  )
}

function WeightTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], weight_kg: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('weight_entries').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false })
    setEntries(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('weight_entries').insert({ client_id: clientId, weight_kg: parseFloat(form.weight_kg), recorded_at: form.date })
    setSaving(false); setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], weight_kg: '' }); load()
  }
  async function deleteEntry(id) { await supabase.from('weight_entries').delete().eq('id', id); load() }
  function formatDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="card"><h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h3><WeightChart data={entries} /></div>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Entries</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">{showForm ? 'Cancel' : 'Add Entry'}</button>
      </div>
      {showForm && (
        <form onSubmit={addEntry} className="card flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1"><label className="label">Date</label><input className="input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="flex-1"><label className="label">Weight (kg)</label><input className="input" type="number" step="0.1" min="0" required value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="e.g. 72.5" /></div>
          <button type="submit" disabled={saving} className="btn-primary whitespace-nowrap">{saving ? 'Saving…' : 'Add'}</button>
        </form>
      )}
      {entries.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 dark:text-gray-500 text-sm">No weight entries yet.</p></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['Date','Weight',''].map(h => <th key={h} className={`${h === '' ? 'text-right' : 'text-left'} px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatDate(e.recorded_at)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.weight_kg} kg</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => deleteEntry(e.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MeasurementsTab({ clientId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('measurements').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false })
    setEntries(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function addEntry(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('measurements').insert({ client_id: clientId, recorded_at: form.date, chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null, waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null, hips_cm: form.hips_cm ? parseFloat(form.hips_cm) : null, thighs_cm: form.thighs_cm ? parseFloat(form.thighs_cm) : null, arms_cm: form.arms_cm ? parseFloat(form.arms_cm) : null })
    setSaving(false); setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], chest_cm: '', waist_cm: '', hips_cm: '', thighs_cm: '', arms_cm: '' }); load()
  }
  async function deleteEntry(id) { await supabase.from('measurements').delete().eq('id', id); load() }
  function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  function fmtVal(v) { return v != null ? `${v} cm` : '—' }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />
  const latest = entries[0]

  return (
    <div className="space-y-6">
      {latest && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Latest — {fmtDate(latest.recorded_at)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[['Chest', latest.chest_cm],['Waist', latest.waist_cm],['Hips', latest.hips_cm],['Thighs', latest.thighs_cm],['Arms', latest.arms_cm]].map(([label, value]) => (
              <div key={label} className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{fmtVal(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">History</h3>
        <button onClick={() => setShowForm(v => !v)} className="btn-secondary py-1.5 px-3 text-xs">{showForm ? 'Cancel' : 'Add Measurements'}</button>
      </div>
      {showForm && (
        <form onSubmit={addEntry} className="card space-y-4">
          <div><label className="label">Date</label><input className="input" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[['chest_cm','Chest (cm)'],['waist_cm','Waist (cm)'],['hips_cm','Hips (cm)'],['thighs_cm','Thighs (cm)'],['arms_cm','Arms (cm)']].map(([key, label]) => (
              <div key={key}><label className="label">{label}</label><input className="input" type="number" step="0.1" min="0" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="—" /></div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}
      {entries.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 text-sm">No measurements yet.</p></div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['Date','Chest','Waist','Hips','Thighs','Arms',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtDate(e.recorded_at)}</td>
                  {['chest_cm','waist_cm','hips_cm','thighs_cm','arms_cm'].map(k => <td key={k} className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtVal(e[k])}</td>)}
                  <td className="px-4 py-3 text-right"><button onClick={() => deleteEntry(e.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PhotosTab({ clientId }) {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const fileRef = useRef()

  async function load() {
    const { data } = await supabase.from('progress_photos').select('*').eq('client_id', clientId).order('recorded_at', { ascending: false })
    setPhotos(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [clientId])

  async function handleUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true); setStorageError(false)
    for (const file of files) {
      const path = `${clientId}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('progress-photos').upload(path, file)
      if (uploadErr) { setStorageError(true); setUploading(false); return }
      const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path)
      await supabase.from('progress_photos').insert({ client_id: clientId, photo_url: urlData.publicUrl, recorded_at: new Date().toISOString().split('T')[0] })
    }
    setUploading(false); if (fileRef.current) fileRef.current.value = ''; load()
  }

  async function deletePhoto(photo) {
    const url = photo.photo_url
    const idx = url.indexOf('/progress-photos/')
    if (idx !== -1) await supabase.storage.from('progress-photos').remove([decodeURIComponent(url.slice(idx + '/progress-photos/'.length))])
    await supabase.from('progress_photos').delete().eq('id', photo.id)
    if (lightbox?.id === photo.id) setLightbox(null)
    load()
  }

  function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-6">
      {storageError && <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"><p className="text-sm text-yellow-800 dark:text-yellow-300">Photo storage not configured yet.</p></div>}
      <div className="flex items-center gap-4">
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">{uploading ? 'Uploading…' : 'Upload Photos'}</button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        <p className="text-xs text-gray-400">JPG, PNG, HEIC, WebP</p>
      </div>
      {photos.length === 0 ? (
        <div className="card text-center py-10"><p className="text-gray-400 text-sm">No photos yet.</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <img src={photo.photo_url} alt="" className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setLightbox(photo)} />
              <div className="p-2"><p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(photo.recorded_at)}</p></div>
              <button onClick={() => deletePhoto(photo)} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.photo_url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesTab({ client }) {
  const [notes, setNotes] = useState(client.notes || '')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  async function handleBlur() {
    if (notes === (client.notes || '')) return
    setSaving(true)
    await supabase.from('clients').update({ notes }).eq('id', client.id)
    setSaving(false); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Coach Notes</h3>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {savedMsg && <span className="text-xs text-green-600 dark:text-green-400 font-medium">Saved</span>}
      </div>
      <textarea className="input resize-y min-h-[300px]" value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleBlur} placeholder="Private notes about this client — auto-saves on blur." />
      <p className="text-xs text-gray-400 dark:text-gray-500">Private and only visible to you.</p>
    </div>
  )
}

// ─── Meal Plan helpers ────────────────────────────────────────────────────────

const MEAL_SLOTS = [
  { key: 'breakfast1', label: 'Breakfast A', cat: 'breakfast' },
  { key: 'breakfast2', label: 'Breakfast B', cat: 'breakfast' },
  { key: 'lunch1',     label: 'Lunch A',     cat: 'lunch' },
  { key: 'lunch2',     label: 'Lunch B',     cat: 'lunch' },
  { key: 'dinner1',    label: 'Dinner A',    cat: 'dinner' },
  { key: 'dinner2',    label: 'Dinner B',    cat: 'dinner' },
]

// The client eats one option per category per day, not both — these are the two
// interchangeable combinations the daily totals are built from.
const OPTION_1_KEYS = ['breakfast1', 'lunch1', 'dinner1']
const OPTION_2_KEYS = ['breakfast2', 'lunch2', 'dinner2']
const SLOT_CATEGORY = Object.fromEntries(MEAL_SLOTS.map(s => [s.key, s.cat]))
// Which option (1 or 2) each rotating slot belongs to — lets Auto mode size each option's
// breakfast/lunch/dinner independently, since the two options can be entirely different meals.
const SLOT_OPTION = { breakfast1: 1, breakfast2: 2, lunch1: 1, lunch2: 2, dinner1: 1, dinner2: 2 }

// The day's actual calories should stay within this band of the client's assigned calorie tier —
// each meal's tier version is already generated to hit its own sub-target within this same band, but
// swapping in a different meal or editing ingredients per-client can push the day total out of it.
const UNDER_TARGET_TOLERANCE = 50
const OVER_TARGET_TOLERANCE = 20

function round1(n) {
  return Math.round(n * 10) / 10
}

// Snap a gram amount to the ingredient library's serving step / minimum amount
function snapToConstraints(amount, libIng) {
  let val = parseFloat(amount)
  if (isNaN(val) || val <= 0) return val
  const step = libIng?.serving_step
  const min = libIng?.min_amount
  if (step && step > 0) {
    val = Math.round(val / step) * step
    val = Math.round(val * 10000) / 10000
  }
  if (min != null && val > 0 && val < min) val = min
  return val
}

// Per-client override shape for a single meal slot: { qty: {id: grams}, removed: [id], added: [row] }.
// Older saved data was a flat { id: grams } map — normalize that into the same shape.
function normalizeOverrides(raw) {
  if (!raw) return { qty: {}, removed: [], added: [] }
  if (raw.qty || raw.removed || raw.added) {
    return { qty: raw.qty || {}, removed: raw.removed || [], added: raw.added || [] }
  }
  return { qty: { ...raw }, removed: [], added: [] }
}

function hasAnyOverride(raw) {
  const { qty, removed, added } = normalizeOverrides(raw)
  return Object.keys(qty).length > 0 || removed.length > 0 || added.length > 0
}

// Apply per-client gram overrides, removals and additions to a meal's ingredient list.
// Quantity overrides rescale that ingredient's macros proportionally.
function applyIngredientOverrides(ingredients, overridesForSlot) {
  const { qty, removed, added } = normalizeOverrides(overridesForSlot)
  const visible = removed.length ? ingredients.filter(ing => !removed.includes(ing.id)) : ingredients
  const withQty = visible.map(ing => {
    const override = qty[ing.id]
    if (override == null) return ing
    const origQty = parseFloat(ing.quantity_g) || 0
    const ratio = origQty > 0 ? override / origQty : 1
    return {
      ...ing,
      quantity_g: override,
      calories:  round1((parseFloat(ing.calories)  || 0) * ratio),
      protein_g: round1((parseFloat(ing.protein_g) || 0) * ratio),
      carbs_g:   round1((parseFloat(ing.carbs_g)   || 0) * ratio),
      fat_g:     round1((parseFloat(ing.fat_g)     || 0) * ratio),
    }
  })
  if (!added.length) return withQty
  return [...withQty, ...added.map(a => ({ ...a, _isAdded: true }))]
}

function sumIngredientMacros(ingredients) {
  return ingredients.reduce(
    (acc, ing) => ({
      cal:  acc.cal  + (parseFloat(ing.calories)  || 0),
      prot: acc.prot + (parseFloat(ing.protein_g) || 0),
      carb: acc.carb + (parseFloat(ing.carbs_g)   || 0),
      fat:  acc.fat  + (parseFloat(ing.fat_g)     || 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

// Whether this meal actually has a saved calorie-tier version for the given tier — if not,
// mealMacros() silently falls back to the base portion, so callers use this to warn the coach why a
// meal's calories didn't change when the client's tier did.
function tierVersionExists(mealId, mealMap, tier) {
  if (!mealId || !tier || !mealMap[mealId]) return true
  return (mealMap[mealId].meal_tier_versions || []).some(v => v.calorie_tier === tier)
}

// Get macros for a meal at a given calorie tier, falling back to base ingredients.
// overridesForSlot holds this client's gram tweaks / removed / added ingredients for the slot.
function mealMacros(mealId, mealMap, tier, overridesForSlot) {
  if (!mealId || !mealMap[mealId]) return { cal: 0, prot: 0, carb: 0, fat: 0 }
  const hasOverrides = hasAnyOverride(overridesForSlot)
  if (tier) {
    const v = (mealMap[mealId].meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      if (!hasOverrides) return { cal: parseFloat(v.calories) || 0, prot: parseFloat(v.protein_g) || 0, carb: parseFloat(v.carbs_g) || 0, fat: parseFloat(v.fat_g) || 0 }
      return sumIngredientMacros(applyIngredientOverrides(v.meal_tier_ingredients || [], overridesForSlot))
    }
  }
  return sumIngredientMacros(applyIngredientOverrides(mealMap[mealId].meal_ingredients || [], overridesForSlot))
}

// Factory for the add/remove/quantity-change handlers shared by rotating slots and static meals —
// `key` is the slot key (rotating) or static field name, scoped within whichever overrides state is passed in.
function makeOverrideHandlers(setOverrides, setDirty) {
  return {
    changeQty(key, ingredientId, value) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        const qty = { ...current.qty }
        if (value === null || value === '') delete qty[ingredientId]
        else {
          const num = parseFloat(value)
          if (isNaN(num)) return prev
          qty[ingredientId] = num
        }
        return { ...prev, [key]: { ...current, qty } }
      })
      setDirty(true)
    },
    remove(key, ingredientId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        if (current.removed.includes(ingredientId)) return prev
        const qty = { ...current.qty }
        delete qty[ingredientId]
        return { ...prev, [key]: { ...current, qty, removed: [...current.removed, ingredientId] } }
      })
      setDirty(true)
    },
    restore(key, ingredientId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, removed: current.removed.filter(id => id !== ingredientId) } }
      })
      setDirty(true)
    },
    add(key, newIngredient) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, added: [...current.added, newIngredient] } }
      })
      setDirty(true)
    },
    removeAdded(key, addedId) {
      setOverrides(prev => {
        const current = normalizeOverrides(prev[key])
        return { ...prev, [key]: { ...current, added: current.added.filter(a => a.id !== addedId) } }
      })
      setDirty(true)
    },
    revertAll(key) {
      setOverrides(prev => {
        if (!prev[key]) return prev
        const { [key]: _omit, ...rest } = prev
        return rest
      })
      setDirty(true)
    },
  }
}

function addMacros(a, b) {
  return { cal: a.cal + b.cal, prot: a.prot + b.prot, carb: a.carb + b.carb, fat: a.fat + b.fat }
}

function sumMealSlots(keys, editedSlots, mealMap, tier, ingredientOverrides) {
  return keys.reduce(
    (acc, key) => addMacros(acc, mealMacros(editedSlots[key], mealMap, tier, ingredientOverrides[key])),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

// Ingredient list for a calorie-tier version or base meal. Gram quantities are editable per-client,
// and ingredients can be removed or added just for this client — none of it touches the shared
// master meal/tier-version data. Quantity overrides rescale that ingredient's macros proportionally;
// added ingredients are pulled from the coach's ingredient library so their macros are accurate.
function TierIngredientList({ mealId, mealMap, tier, overrides, library, libraryById, onQtyChange, onRemove, onRestore, onAdd, onRemoveAdded, onRevertAll }) {
  const [addingOpen, setAddingOpen] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addSelected, setAddSelected] = useState(null)
  const [addQty, setAddQty] = useState('')

  const meal = mealMap[mealId]
  if (!meal) return null

  let baseIngredients = []
  let label = 'Base recipe'

  if (tier) {
    const v = (meal.meal_tier_versions || []).find(v => v.calorie_tier === tier)
    if (v) {
      baseIngredients = v.meal_tier_ingredients || []
      label = `${tier} kcal version`
    } else {
      baseIngredients = meal.meal_ingredients || []
      label = 'Base recipe (no tier version set)'
    }
  } else {
    baseIngredients = meal.meal_ingredients || []
  }

  const { qty: overrideQty, removed } = normalizeOverrides(overrides)
  const ingredients = applyIngredientOverrides(baseIngredients, overrides)
  const totCal  = ingredients.reduce((s, i) => s + (parseFloat(i.calories)  || 0), 0)
  const totCarb = ingredients.reduce((s, i) => s + (parseFloat(i.carbs_g)   || 0), 0)
  const totProt = ingredients.reduce((s, i) => s + (parseFloat(i.protein_g) || 0), 0)
  const totFat  = ingredients.reduce((s, i) => s + (parseFloat(i.fat_g)     || 0), 0)

  function handleBlur(ing) {
    const libIng = ing.ingredient_id ? libraryById[ing.ingredient_id] : null
    if (!libIng) return
    const snapped = snapToConstraints(ing.quantity_g, libIng)
    if (!isNaN(snapped) && snapped !== parseFloat(ing.quantity_g)) onQtyChange(ing.id, snapped)
  }

  function resetAddForm() {
    setAddingOpen(false); setAddSearch(''); setAddSelected(null); setAddQty('')
  }

  function confirmAdd() {
    if (!addSelected) return
    const qty = parseFloat(addQty)
    if (isNaN(qty) || qty <= 0) return
    const f = addSelected.serving_size > 0 ? qty / addSelected.serving_size : 0
    onAdd({
      id: `added-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: addSelected.name,
      quantity_g: qty,
      unit: addSelected.serving_unit || 'g',
      calories:  round1(f * addSelected.calories_per_serving),
      protein_g: round1(f * addSelected.protein_per_serving),
      carbs_g:   round1(f * addSelected.carbs_per_serving),
      fat_g:     round1(f * addSelected.fat_per_serving),
      ingredient_id: addSelected.id,
    })
    resetAddForm()
  }

  const filteredLibrary = addSearch
    ? library.filter(l => l.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 8)
    : []

  const overridden = hasAnyOverride(overrides)

  return (
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{label}</p>
        {overridden && (
          <button
            type="button"
            onClick={onRevertAll}
            className="text-xs text-gray-400 hover:text-red-500 inline-flex items-center gap-1 flex-shrink-0"
            title="Undo all changes for this client's version of this meal"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 010 8H8m-5-8l4-4m-4 4l4 4" />
            </svg>
            Revert to original
          </button>
        )}
      </div>

      {ingredients.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1">
            <span className="flex-1">Ingredient</span>
            <span className="w-16 text-right">g</span>
            <span className="w-16 text-right">kcal</span>
            <span className="w-10 text-right">C</span>
            <span className="w-10 text-right">P</span>
            <span className="w-10 text-right">F</span>
            <span className="w-4" />
          </div>
          {ingredients.map((ing, i) => {
            const libIng = ing.ingredient_id ? libraryById[ing.ingredient_id] : null
            const overridden = !ing._isAdded && overrideQty[ing.id] != null
            return (
              <div key={ing.id || i} className="flex items-center gap-2 text-xs">
                <span className={`flex-1 truncate ${ing._isAdded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{ing.name}</span>
                <input
                  type="number"
                  min={libIng?.min_amount ?? 0}
                  step={libIng?.serving_step ?? 1}
                  className={`w-16 text-right text-xs py-0.5 px-1 rounded border tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-400 ${
                    overridden
                      ? 'border-orange-300 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                  }`}
                  value={ing.quantity_g}
                  onChange={e => onQtyChange(ing.id, e.target.value)}
                  onBlur={() => handleBlur(ing)}
                />
                <span className="tabular-nums w-16 text-right text-gray-500 dark:text-gray-400">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.carbs_g) || 0)}g</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.protein_g) || 0)}g</span>
                <span className="tabular-nums w-10 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.fat_g) || 0)}g</span>
                <button
                  type="button"
                  onClick={() => ing._isAdded ? onRemoveAdded(ing.id) : onRemove(ing.id)}
                  className="w-4 text-center text-gray-300 hover:text-red-400 flex-shrink-0"
                  title={ing._isAdded ? 'Remove this ingredient' : 'Remove for this client'}
                >
                  ×
                </button>
              </div>
            )
          })}
        </>
      )}

      {ingredients.length === 0 && <p className="text-xs text-gray-400 italic">No ingredients recorded</p>}

      {totCal > 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-1.5">
          <span className="flex-1">Meal total</span>
          <span className="tabular-nums w-16 text-right">{Math.round(totCal)} kcal</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totCarb)}g</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totProt)}g</span>
          <span className="tabular-nums w-10 text-right">{Math.round(totFat)}g</span>
        </div>
      )}

      {removed.length > 0 && (
        <div className="pt-1.5 space-y-1">
          {removed.map(id => {
            const orig = baseIngredients.find(i => i.id === id)
            if (!orig) return null
            return (
              <div key={id} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="flex-1 truncate line-through">{orig.name}</span>
                <button type="button" onClick={() => onRestore(id)} className="text-brand-500 hover:text-brand-700 font-medium flex-shrink-0">Restore</button>
              </div>
            )
          })}
        </div>
      )}

      {!addingOpen ? (
        <button type="button" onClick={() => setAddingOpen(true)} className="mt-1 text-xs text-brand-500 hover:text-brand-700 font-medium inline-flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add ingredient
        </button>
      ) : (
        <div className="mt-1 p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
          <div className="relative">
            <input
              autoFocus
              className="input py-1 text-xs"
              placeholder="Search your ingredient library…"
              value={addSearch}
              onChange={e => { setAddSearch(e.target.value); setAddSelected(null) }}
            />
            {addSearch && !addSelected && (
              <div className="absolute z-20 left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full max-h-40 overflow-y-auto">
                {filteredLibrary.map(l => (
                  <button key={l.id} type="button" onClick={() => { setAddSelected(l); setAddSearch(l.name) }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-between gap-2">
                    <span className="truncate">{l.name}</span>
                    <span className="text-gray-400 flex-shrink-0">{l.calories_per_serving} kcal/{l.serving_size}{l.serving_unit}</span>
                  </button>
                ))}
                {filteredLibrary.length === 0 && <p className="px-2 py-1.5 text-xs text-gray-400 italic">No matches in your ingredient library</p>}
              </div>
            )}
          </div>
          {addSelected ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input py-1 text-xs w-20"
                placeholder="grams"
                min={addSelected.min_amount ?? 0}
                step={addSelected.serving_step ?? 1}
                value={addQty}
                onChange={e => setAddQty(e.target.value)}
              />
              <span className="text-xs text-gray-400">{addSelected.serving_unit}</span>
              <button type="button" onClick={confirmAdd} disabled={!addQty} className="btn-primary py-1 px-2 text-xs">Add</button>
              <button type="button" onClick={resetAddForm} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={resetAddForm} className="text-xs text-gray-400 hover:text-gray-700">Cancel</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Meal Plan Tab ────────────────────────────────────────────────────────────

function MealPlanTab({ client, coachId }) {
  const [planGroups, setPlanGroups] = useState([])
  const [assignment, setAssignment] = useState(null)
  const [planGroup, setPlanGroup] = useState(null)
  const [editedSlots, setEditedSlots] = useState({})
  const [templateSlots, setTemplateSlots] = useState({})
  const [slotsDirty, setSlotsDirty] = useState(false)
  const [savingSlots, setSavingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState('')
  const [repeating, setRepeating] = useState(false)
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [mealMap, setMealMap] = useState({})
  const [library, setLibrary] = useState([])
  const [ingredientOverrides, setIngredientOverrides] = useState({})
  const [staticIngredientOverrides, setStaticIngredientOverrides] = useState({})
  const [expandedSlots, setExpandedSlots] = useState(new Set())
  const [staticEdits, setStaticEdits] = useState({ preworkout_meal_id: null, evening_snack_meal_id: null })
  const [staticFlags, setStaticFlags] = useState({ preworkout_static: false, evening_snack_static: false })
  const [staticDirty, setStaticDirty] = useState(false)
  const [savingStatic, setSavingStatic] = useState(false)
  const [staticError, setStaticError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plan_group_id: '', calorie_target: CALORIE_TIERS.includes(client.current_calories) ? client.current_calories : '', starting_week: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [overrideWeek, setOverrideWeek] = useState('')

  async function loadWeekSlots(asgn, weekNum, planGroupId) {
    // If a coach has forked this client's exact calorie target into its own version of the plan
    // (see PlanGroupEditor), it takes priority over the standard template for this week.
    const tier = CALORIE_TIERS.includes(asgn.calorie_target) ? asgn.calorie_target : null
    const [{ data: tierTmpl }, { data: stdTmpl }, { data: cwm }] = await Promise.all([
      tier
        ? supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', planGroupId).eq('week_number', weekNum).eq('calorie_tier', tier).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', planGroupId).eq('week_number', weekNum).is('calorie_tier', null).maybeSingle(),
      supabase.from('client_week_meals').select('slots, ingredient_overrides').eq('assignment_id', asgn.id).eq('week_number', weekNum).maybeSingle(),
    ])
    const tmpl = tierTmpl || stdTmpl
    const tSlots = {}
    for (const s of (tmpl?.template_meal_slots || [])) tSlots[s.slot_type] = s.meal_id
    setTemplateSlots(tSlots)
    setEditedSlots({ ...tSlots, ...(cwm?.slots || {}) })
    setIngredientOverrides(cwm?.ingredient_overrides || {})
    setSlotsDirty(false)
  }

  async function load() {
    const [{ data: groups }, { data: asgn }, { data: mealsData }, { data: libData }] = await Promise.all([
      supabase.from('plan_groups').select('*').eq('coach_id', coachId).order('created_at', { ascending: false }),
      supabase.from('client_plan_assignments').select('*').eq('client_id', client.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('meals').select(`
        id, name, category,
        meal_ingredients(id, name, quantity_g, calories, protein_g, carbs_g, fat_g, ingredient_id),
        meal_tier_versions(id, calorie_tier, calories, protein_g, carbs_g, fat_g,
          meal_tier_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type, ingredient_id))
      `).eq('coach_id', coachId).order('name'),
      supabase.from('ingredients').select('*').eq('coach_id', coachId),
    ])

    const allGroups = groups || []
    setPlanGroups(allGroups)
    setAssignment(asgn || null)
    setLibrary(libData || [])

    const map = {}, byCat = {}
    for (const m of (mealsData || [])) {
      map[m.id] = m
      ;(byCat[m.category] = byCat[m.category] || []).push(m)
    }
    setMealMap(map)
    setMealsByCategory(byCat)

    if (asgn) {
      const pg = allGroups.find(g => g.id === asgn.plan_group_id) || null
      setPlanGroup(pg)
      setOverrideWeek(asgn.week_override ?? '')
      setStaticEdits({
        preworkout_meal_id: asgn.preworkout_meal_id || null,
        evening_snack_meal_id: asgn.evening_snack_meal_id || null,
      })
      setStaticFlags({
        preworkout_static: !!asgn.preworkout_static,
        evening_snack_static: !!asgn.evening_snack_static,
      })
      setStaticIngredientOverrides(asgn.static_ingredient_overrides || {})
      if (pg) await loadWeekSlots(asgn, asgn.week_override ?? pg.current_week, pg.id)
    }
    setLoading(false)
  }

  const libraryById = Object.fromEntries(library.map(l => [l.id, l]))

  const slotHandlers = makeOverrideHandlers(setIngredientOverrides, setSlotsDirty)
  const staticHandlers = makeOverrideHandlers(setStaticIngredientOverrides, setStaticDirty)

  useEffect(() => { load() }, [client.id])

  const globalWeek = planGroup?.current_week ?? null
  const effectiveWeek = assignment?.week_override ?? globalWeek
  const isOverridden = assignment?.week_override != null

  // The single calorie tier this client is assigned to — every meal's macros below are read from
  // that meal's tier version, which was already generated to hit its own sub-target within the
  // -50/+20 kcal band, so there's no per-client sizing to compute here.
  const tier = assignment && CALORIE_TIERS.includes(assignment.calorie_target) ? assignment.calorie_target : null

  // Pre-workout/evening-snack default to whatever the plan template has set for this tier — a
  // coach only needs staticEdits/staticFlags when a specific client needs something different
  // (e.g. an allergy or dislike), via the "Make static" button below.
  const effectivePreworkoutId = staticFlags.preworkout_static ? staticEdits.preworkout_meal_id : (templateSlots.preworkout || null)
  const effectiveSnackId = staticFlags.evening_snack_static ? staticEdits.evening_snack_meal_id : (templateSlots.evening_snack || null)
  const preworkoutTotal = mealMacros(effectivePreworkoutId, mealMap, tier, staticIngredientOverrides.preworkout_meal_id)
  const snackTotal = mealMacros(effectiveSnackId, mealMap, tier, staticIngredientOverrides.evening_snack_meal_id)

  // Daily macro totals — one of each option (not both) plus the static meals. Each option is
  // compared against the calorie target independently, since the two can be different meals.
  const option1Subtotal = sumMealSlots(OPTION_1_KEYS, editedSlots, mealMap, tier, ingredientOverrides)
  const option2Subtotal = sumMealSlots(OPTION_2_KEYS, editedSlots, mealMap, tier, ingredientOverrides)
  const option1Total = addMacros(addMacros(option1Subtotal, preworkoutTotal), snackTotal)
  const option2Total = addMacros(addMacros(option2Subtotal, preworkoutTotal), snackTotal)

  // Suggestion: if an option's day total falls outside the -50/+20 kcal band, suggest a fix. Every
  // meal is already sized to hit its own calorie-tier sub-target, so the gap (if any) can only be
  // closed by swapping a meal or editing ingredients for this client.
  function getTargetSuggestion(dayTotal, label) {
    if (!assignment?.calorie_target) return null
    const gap = assignment.calorie_target - dayTotal.cal
    if (gap <= UNDER_TARGET_TOLERANCE && gap >= -OVER_TARGET_TOLERANCE) return null

    if (gap > UNDER_TARGET_TOLERANCE) {
      return { text: `Swap a meal or edit ingredients`, detail: `${label} still ~${Math.round(gap)} kcal under target — swap in a bigger meal, add to a meal's ingredients, or regenerate this meal's calorie-tier version in the Meal Library` }
    }
    return { text: `Swap a meal or edit ingredients`, detail: `${label} still ~${Math.round(Math.abs(gap))} kcal over target — swap in a smaller meal, trim a meal's ingredients, or regenerate this meal's calorie-tier version in the Meal Library` }
  }
  const suggestion1 = getTargetSuggestion(option1Total, 'Option 1')
  const suggestion2 = option2Subtotal.cal > 0 ? getTargetSuggestion(option2Total, 'Option 2') : null

  function targetStatus(total) {
    if (!assignment?.calorie_target) return null
    if (total.cal > assignment.calorie_target + OVER_TARGET_TOLERANCE) {
      return <p className="text-sm font-medium text-orange-500">{Math.round(total.cal - assignment.calorie_target)} kcal over target (max {OVER_TARGET_TOLERANCE})</p>
    }
    if (total.cal < assignment.calorie_target - UNDER_TARGET_TOLERANCE) {
      return <p className="text-sm font-medium text-blue-500">{Math.round(assignment.calorie_target - total.cal)} kcal under target (max {UNDER_TARGET_TOLERANCE})</p>
    }
    return null
  }

  function toggleSlot(key) {
    setExpandedSlots(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  function dayTotalViolations() {
    return [
      option1Subtotal.cal > 0 ? suggestion1 : null,
      option2Subtotal.cal > 0 ? suggestion2 : null,
    ].filter(Boolean)
  }

  async function handleSaveSlots() {
    if (!assignment || effectiveWeek == null) return
    const violations = dayTotalViolations()
    if (violations.length > 0) {
      setSlotsError(`${violations.map(v => v.detail).join(' ')} Fix this before saving.`)
      return
    }
    setSlotsError('')
    setSavingSlots(true)
    await supabase.from('client_week_meals').upsert(
      { client_id: client.id, coach_id: coachId, assignment_id: assignment.id, week_number: effectiveWeek, slots: editedSlots, ingredient_overrides: ingredientOverrides },
      { onConflict: 'assignment_id,week_number' }
    )
    setSavingSlots(false); setSlotsDirty(false)
  }

  async function handleSaveStaticMeals() {
    if (!assignment) return
    const violations = dayTotalViolations()
    if (violations.length > 0) {
      setStaticError(`${violations.map(v => v.detail).join(' ')} Fix this before saving.`)
      return
    }
    setStaticError('')
    setSavingStatic(true)
    await supabase.from('client_plan_assignments').update({
      preworkout_meal_id: staticEdits.preworkout_meal_id || null,
      evening_snack_meal_id: staticEdits.evening_snack_meal_id || null,
      preworkout_static: staticFlags.preworkout_static,
      evening_snack_static: staticFlags.evening_snack_static,
      static_ingredient_overrides: staticIngredientOverrides,
    }).eq('id', assignment.id)
    setSavingStatic(false); setStaticDirty(false)
  }

  function makeStatic(key, flagKey, templateMealId) {
    setStaticEdits(prev => ({ ...prev, [key]: templateMealId || null }))
    setStaticFlags(prev => ({ ...prev, [flagKey]: true }))
    setStaticDirty(true)
  }

  function useTemplateDefault(key, flagKey) {
    setStaticFlags(prev => ({ ...prev, [flagKey]: false }))
    setStaticIngredientOverrides(prev => {
      const { [key]: _omit, ...rest } = prev
      return rest
    })
    setStaticDirty(true)
  }

  async function handleRepeatLastWeek() {
    if (!assignment || effectiveWeek == null) return
    setRepeating(true)
    const prevWeek = effectiveWeek > 1 ? effectiveWeek - 1 : 20
    const [{ data: prevTmpl }, { data: prevCwm }] = await Promise.all([
      supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', assignment.plan_group_id).eq('week_number', prevWeek).maybeSingle(),
      supabase.from('client_week_meals').select('slots').eq('assignment_id', assignment.id).eq('week_number', prevWeek).maybeSingle(),
    ])
    const prevTSlots = {}
    for (const s of (prevTmpl?.template_meal_slots || [])) prevTSlots[s.slot_type] = s.meal_id
    setEditedSlots({ ...prevTSlots, ...(prevCwm?.slots || {}) })
    setSlotsDirty(true); setRepeating(false)
  }

  async function handleAssign(e) {
    e.preventDefault(); setSaving(true); setError('')
    await supabase.from('client_plan_assignments').update({ active: false }).eq('client_id', client.id)
    const group = planGroups.find(g => g.id === form.plan_group_id)
    const { error: err } = await supabase.from('client_plan_assignments').insert({
      client_id: client.id, coach_id: coachId,
      plan_group_id: form.plan_group_id,
      plan_group_name: group?.name || '20 Week Plan',
      calorie_target: form.calorie_target ? parseInt(form.calorie_target) : null,
      start_date: new Date().toISOString().split('T')[0],
      week_override: form.starting_week ? parseInt(form.starting_week) : null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false); load()
  }

  async function handleSaveOverride(e) {
    e.preventDefault()
    await supabase.from('client_plan_assignments').update({ week_override: overrideWeek !== '' ? parseInt(overrideWeek) : null }).eq('id', assignment.id)
    setShowOverride(false); load()
  }

  async function handleClearOverride() {
    await supabase.from('client_plan_assignments').update({ week_override: null }).eq('id', assignment.id)
    setOverrideWeek(''); load()
  }

  async function handleRemove() {
    if (!confirm('Remove this meal plan assignment?')) return
    await supabase.from('client_plan_assignments').update({ active: false }).eq('client_id', client.id)
    load()
  }

  if (loading) return <LoadingSpinner size="lg" className="py-12" />

  return (
    <div className="space-y-5 max-w-2xl">

      {!assignment && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">No meal plan assigned yet.</p>
          {planGroups.length === 0
            ? <p className="text-xs text-gray-400">Generate a 20-week plan from the Templates page first.</p>
            : <button onClick={() => setShowForm(true)} className="btn-primary">Assign Meal Plan</button>}
        </div>
      )}

      {assignment && !planGroup && !showForm && (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            This client was assigned to "{assignment.plan_group_name || 'a plan'}", but that plan no longer exists
          </p>
          <p className="text-xs text-gray-400 mb-4">It was probably deleted from the Templates page. Assign a different plan to fix this.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setShowForm(true)} className="btn-primary">Assign a Plan</button>
            <button onClick={handleRemove} className="btn-secondary">Clear assignment</button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAssign} className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment ? 'Change Meal Plan' : 'Assign Meal Plan'}</h3>
          <div>
            <label className="label">Plan</label>
            <select className="input" required value={form.plan_group_id}
              onChange={e => { const pg = planGroups.find(g => g.id === e.target.value); setForm(f => ({ ...f, plan_group_id: e.target.value, starting_week: pg?.current_week ?? '' })) }}>
              <option value="">Select a plan…</option>
              {planGroups.map(g => <option key={g.id} value={g.id}>{g.name} (currently Week {g.current_week})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Calorie target (kcal/day)</label>
              <select className="input" value={form.calorie_target} onChange={e => setForm(f => ({ ...f, calorie_target: e.target.value }))}>
                <option value="">Select a tier…</option>
                {CALORIE_TIERS.map(t => <option key={t} value={t}>{t} kcal</option>)}
              </select>
            </div>
            <div>
              <label className="label">Starting week</label>
              <select className="input" value={form.starting_week} onChange={e => setForm(f => ({ ...f, starting_week: e.target.value }))}>
                <option value="">Follow plan's current week</option>
                {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !form.plan_group_id} className="btn-primary">{saving ? 'Saving…' : assignment ? 'Update' : 'Assign Plan'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {assignment && planGroup && (
        <>
          {/* Plan header */}
          <div className="card space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.plan_group_name || planGroup.name}</h3>
                {assignment.calorie_target && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{assignment.calorie_target} kcal / day</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => { setForm({ plan_group_id: assignment.plan_group_id, calorie_target: assignment.calorie_target || '', starting_week: '' }); setShowForm(true); setShowOverride(false) }} className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">Change</button>
                <button onClick={handleRemove} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
              </div>
            </div>

            <div className="flex items-center gap-5 py-3 px-4 rounded-xl bg-pink-50/60 dark:bg-pink-900/10">
              <div className="text-center">
                <p className="text-4xl font-bold text-brand-600 dark:text-brand-400">{effectiveWeek ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wide">Week</p>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                {isOverridden ? (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Week {assignment.week_override} <span className="text-xs font-normal text-orange-500">(individual override)</span></p>
                    <p className="text-xs text-gray-400">Plan is on Week {globalWeek}</p>
                    <button onClick={handleClearOverride} className="text-xs text-brand-500 hover:text-brand-700 font-medium">Clear &rarr; follow plan (Week {globalWeek})</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Following plan — same week as all clients</p>
                    <button onClick={() => { setOverrideWeek(globalWeek ?? 1); setShowOverride(true) }} className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">Put on a different week</button>
                  </>
                )}
              </div>
            </div>

            {showOverride && (
              <form onSubmit={handleSaveOverride} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Put on week:</span>
                <select className="input py-1" value={overrideWeek} onChange={e => setOverrideWeek(e.target.value)}>
                  {Array.from({ length: 20 }, (_, i) => <option key={i + 1} value={i + 1}>Week {i + 1}</option>)}
                </select>
                <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Save</button>
                <button type="button" onClick={() => setShowOverride(false)} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
              </form>
            )}
          </div>

          {/* Rotating meal slots */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Week {effectiveWeek} meals
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Follows the master plan — change any meal for this client only</p>
              </div>
              <button onClick={handleRepeatLastWeek} disabled={repeating || effectiveWeek == null} className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
                {repeating ? 'Loading…' : `← Repeat Week ${effectiveWeek != null && effectiveWeek > 1 ? effectiveWeek - 1 : 20}`}
              </button>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {MEAL_SLOTS.map(slot => {
                const currentId = editedSlots[slot.key] || ''
                const isExpanded = expandedSlots.has(slot.key)
                const slotOverrides = ingredientOverrides[slot.key]
                const macros = mealMacros(currentId, mealMap, tier, slotOverrides)
                const options = mealsByCategory[slot.cat] || []
                const isOverridden = templateSlots[slot.key] !== undefined && (editedSlots[slot.key] || null) !== (templateSlots[slot.key] || null)
                const hasIngredientEdits = hasAnyOverride(slotOverrides)
                const missingTierVersion = currentId && tier && !tierVersionExists(currentId, mealMap, tier)
                return (
                  <div key={slot.key}>
                    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                      <button onClick={() => currentId && toggleSlot(slot.key)} className="flex-shrink-0">
                        <svg className={`w-3.5 h-3.5 transition-transform text-gray-300 dark:text-gray-600 ${isExpanded ? 'rotate-90' : ''} ${!currentId ? 'opacity-0' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{slot.label}</span>
                      <select
                        className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                        value={currentId}
                        onChange={e => { setEditedSlots(prev => ({ ...prev, [slot.key]: e.target.value || null })); setSlotsDirty(true) }}
                      >
                        <option value="">— None —</option>
                        {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {isOverridden && (
                        <span className="text-xs text-orange-500 flex-shrink-0" title="Different from the master template">Custom</span>
                      )}
                      {hasIngredientEdits && (
                        <span className="text-xs text-blue-500 flex-shrink-0" title="Ingredient quantities adjusted for this client">Adjusted</span>
                      )}
                      {missingTierVersion && (
                        <span className="text-xs text-amber-500 flex-shrink-0" title={`This meal has no saved ${tier} kcal version — showing its base portion instead. Generate it in the Meal Library to fix this.`}>No {tier} kcal version</span>
                      )}
                      {currentId && macros.cal > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>
                      )}
                    </div>
                    {isExpanded && currentId && (
                      <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                        <TierIngredientList
                          mealId={currentId}
                          mealMap={mealMap}
                          tier={tier}
                          overrides={slotOverrides}
                          library={library}
                          libraryById={libraryById}
                          onQtyChange={(ingId, val) => slotHandlers.changeQty(slot.key, ingId, val)}
                          onRemove={ingId => slotHandlers.remove(slot.key, ingId)}
                          onRestore={ingId => slotHandlers.restore(slot.key, ingId)}
                          onAdd={newIng => slotHandlers.add(slot.key, newIng)}
                          onRemoveAdded={addedId => slotHandlers.removeAdded(slot.key, addedId)}
                          onRevertAll={() => slotHandlers.revertAll(slot.key)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(option1Subtotal.cal > 0 || option2Subtotal.cal > 0) && (
              <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 space-y-1">
                {option1Subtotal.cal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Option 1 subtotal (A meals)</span>
                    <span className="tabular-nums text-sm font-semibold text-gray-700 dark:text-gray-200">{Math.round(option1Subtotal.cal)} kcal</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option1Subtotal.carb)}g C &middot; {Math.round(option1Subtotal.prot)}g P &middot; {Math.round(option1Subtotal.fat)}g F</span>
                  </div>
                )}
                {option2Subtotal.cal > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Option 2 subtotal (B meals)</span>
                    <span className="tabular-nums text-sm font-medium text-gray-500 dark:text-gray-400">{Math.round(option2Subtotal.cal)} kcal</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option2Subtotal.carb)}g C &middot; {Math.round(option2Subtotal.prot)}g P &middot; {Math.round(option2Subtotal.fat)}g F</span>
                  </div>
                )}
              </div>
            )}

            {slotsDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                {slotsError && (
                  <p className="text-sm font-medium text-red-500">{slotsError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveSlots} disabled={savingSlots} className="btn-primary py-1.5 px-4 text-sm">{savingSlots ? 'Saving…' : 'Save meal changes'}</button>
                  <button onClick={() => { setEditedSlots({ ...templateSlots }); setIngredientOverrides({}); setSlotsDirty(false); setSlotsError('') }} className="text-sm text-gray-400 hover:text-gray-700">Reset to template</button>
                </div>
              </div>
            )}
          </div>

          {/* Static meals */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pre-workout &amp; Evening Snack</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Same every week. Follows the plan template by default — use "Make static" to give this client something different.</p>
            </div>

            {[
              { key: 'preworkout_meal_id', flagKey: 'preworkout_static', templateKey: 'preworkout', label: 'Pre-workout', cat: 'pre_workout' },
              { key: 'evening_snack_meal_id', flagKey: 'evening_snack_static', templateKey: 'evening_snack', label: 'Evening snack', cat: 'evening_snack' },
            ].map(({ key, flagKey, templateKey, label, cat }) => {
              const isStatic = staticFlags[flagKey]
              const templateMealId = templateSlots[templateKey] || ''
              const mealId = isStatic ? (staticEdits[key] || '') : templateMealId
              const isExpanded = expandedSlots.has(key)
              const options = mealsByCategory[cat] || []
              const keyOverrides = staticIngredientOverrides[key]
              const macros = mealMacros(mealId, mealMap, tier, keyOverrides)
              const hasIngredientEdits = hasAnyOverride(keyOverrides)
              const missingTierVersion = mealId && tier && !tierVersionExists(mealId, mealMap, tier)
              const templateMealName = templateMealId ? (mealMap[templateMealId]?.name || 'Unknown meal') : null
              return (
                <div key={key} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                    <button onClick={() => toggleSlot(key)} className="flex-shrink-0">
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-300 dark:text-gray-600 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
                    {isStatic ? (
                      <select
                        className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                        value={mealId}
                        onChange={e => { setStaticEdits(prev => ({ ...prev, [key]: e.target.value || null })); setStaticDirty(true) }}
                      >
                        <option value="">— None —</option>
                        {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    ) : (
                      <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                        {templateMealName || <span className="italic text-gray-300 dark:text-gray-600">Not set in plan template</span>}
                        <span className="ml-1.5 text-xs text-gray-300 dark:text-gray-600">(from plan template)</span>
                      </span>
                    )}
                    {options.length === 0 && isStatic && <span className="text-xs text-gray-400 italic">No {cat} meals yet</span>}
                    {hasIngredientEdits && (
                      <span className="text-xs text-blue-500 flex-shrink-0" title="Ingredient quantities adjusted for this client">Adjusted</span>
                    )}
                    {missingTierVersion && (
                      <span className="text-xs text-amber-500 flex-shrink-0" title={`This meal has no saved ${tier} kcal version — showing its base portion instead. Generate it in the Meal Library to fix this.`}>No {tier} kcal version</span>
                    )}
                    {mealId && macros.cal > 0 && <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>}
                    <button
                      onClick={() => isStatic ? useTemplateDefault(key, flagKey) : makeStatic(key, flagKey, templateMealId)}
                      className="text-xs text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium flex-shrink-0 whitespace-nowrap"
                    >
                      {isStatic ? 'Use template default' : 'Make static'}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                      {mealId ? (
                        <TierIngredientList
                          mealId={mealId}
                          mealMap={mealMap}
                          tier={tier}
                          overrides={keyOverrides}
                          library={library}
                          libraryById={libraryById}
                          onQtyChange={(ingId, val) => staticHandlers.changeQty(key, ingId, val)}
                          onRemove={ingId => staticHandlers.remove(key, ingId)}
                          onRestore={ingId => staticHandlers.restore(key, ingId)}
                          onAdd={newIng => staticHandlers.add(key, newIng)}
                          onRemoveAdded={addedId => staticHandlers.removeAdded(key, addedId)}
                          onRevertAll={() => staticHandlers.revertAll(key)}
                        />
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No meal set in the plan template for this slot.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {staticDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
                {staticError && (
                  <p className="text-sm font-medium text-red-500">{staticError}</p>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={handleSaveStaticMeals} disabled={savingStatic} className="btn-primary py-1.5 px-4 text-sm">{savingStatic ? 'Saving…' : 'Save static meals'}</button>
                  <button onClick={() => { setStaticEdits({ preworkout_meal_id: assignment?.preworkout_meal_id || null, evening_snack_meal_id: assignment?.evening_snack_meal_id || null }); setStaticIngredientOverrides(assignment?.static_ingredient_overrides || {}); setStaticFlags({ preworkout_static: !!assignment?.preworkout_static, evening_snack_static: !!assignment?.evening_snack_static }); setStaticDirty(false); setStaticError('') }} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Daily totals */}
          {(option1Total.cal > 0 || option2Total.cal > 0 || assignment?.calorie_target) && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Daily total <span className="font-normal text-gray-400">(Option 1)</span>
                </span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(option1Total.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option1Total.carb)}g C &middot; {Math.round(option1Total.prot)}g P &middot; {Math.round(option1Total.fat)}g F</p>
                </div>
              </div>
              {targetStatus(option1Total)}

              {option2Subtotal.cal > 0 && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Daily total <span className="font-normal text-gray-400">(Option 2)</span>
                    </span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(option2Total.cal)} kcal</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round(option2Total.carb)}g C &middot; {Math.round(option2Total.prot)}g P &middot; {Math.round(option2Total.fat)}g F</p>
                    </div>
                  </div>
                  {targetStatus(option2Total)}
                </>
              )}

              {assignment?.calorie_target && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {assignment.calorie_target} kcal
                    {client.current_carbs ? ` · ${client.current_carbs}g C` : ''}
                    {client.current_protein ? ` · ${client.current_protein}g P` : ''}
                    {client.current_fat ? ` · ${client.current_fat}g F` : ''}
                  </span>
                </div>
              )}

              {suggestion1 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestion (Option 1)</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{suggestion1.text}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{suggestion1.detail}</p>
                </div>
              )}
              {suggestion2 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestion (Option 2)</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{suggestion2.text}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{suggestion2.detail}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CoachClientProfile() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Overview')

  async function loadClient() {
    const { data, error: err } = await supabase.from('clients').select(`
      id, coach_id, profile_id, goal, current_calories, current_protein,
      current_carbs, current_fat, start_date, access_weeks, access_expires_at,
      is_active, is_paused, notes, created_at, tags,
      profiles!clients_profile_id_fkey(full_name, email)
    `).eq('id', clientId).eq('coach_id', profile.id).single()
    if (err || !data) setError('Client not found or you do not have access.')
    else setClient(data)
    setLoading(false)
  }

  useEffect(() => { loadClient() }, [clientId])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />
  if (error) return (
    <div className="p-6">
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate('/coach/clients')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Clients
        </button>
        <div className="flex items-center gap-3 sm:ml-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
            <span className="font-semibold text-brand-700 dark:text-brand-400 text-sm">{client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
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

      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 -mx-1 px-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'Overview' && <OverviewTab client={client} onSaved={loadClient} />}
        {activeTab === 'Meal Plan' && <MealPlanTab client={client} coachId={profile.id} />}
        {activeTab === 'Weight' && <WeightTab clientId={client.id} />}
        {activeTab === 'Measurements' && <MeasurementsTab clientId={client.id} />}
        {activeTab === 'Photos' && <PhotosTab clientId={client.id} />}
        {activeTab === 'Notes' && <NotesTab client={client} />}
      </div>
    </div>
  )
}
