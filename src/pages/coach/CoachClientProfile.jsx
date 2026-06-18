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

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

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
        <h3 className="font-semibold text-gray-900 dark:text-white">Current Nutrition Targets</h3>
        <div>
          <label className="label">Calories (kcal/day)</label>
          <input className="input" type="number" min={0} value={form.current_calories} onChange={e => set('current_calories', e.target.value)} placeholder="e.g. 1800" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="label">Protein (g)</label><input className="input" type="number" min={0} value={form.current_protein} onChange={e => set('current_protein', e.target.value)} placeholder="e.g. 150" /></div>
          <div><label className="label">Carbs (g)</label><input className="input" type="number" min={0} value={form.current_carbs} onChange={e => set('current_carbs', e.target.value)} placeholder="e.g. 200" /></div>
          <div><label className="label">Fat (g)</label><input className="input" type="number" min={0} value={form.current_fat} onChange={e => set('current_fat', e.target.value)} placeholder="e.g. 70" /></div>
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

const VARIANT_SIZES = ['XS', 'Small', 'Medium', 'Large', 'XL']

// Get macros for a meal at a given variant size, falling back to base ingredients
function mealMacros(mealId, mealMap, variantName) {
  if (!mealId || !mealMap[mealId]) return { cal: 0, prot: 0, carb: 0, fat: 0 }
  if (variantName) {
    const v = (mealMap[mealId].meal_variants || []).find(v => v.variant_name === variantName)
    if (v) return { cal: parseFloat(v.calories) || 0, prot: parseFloat(v.protein_g) || 0, carb: parseFloat(v.carbs_g) || 0, fat: parseFloat(v.fat_g) || 0 }
  }
  return (mealMap[mealId].meal_ingredients || []).reduce(
    (acc, ing) => ({
      cal:  acc.cal  + (parseFloat(ing.calories)  || 0),
      prot: acc.prot + (parseFloat(ing.protein_g) || 0),
      carb: acc.carb + (parseFloat(ing.carbs_g)   || 0),
      fat:  acc.fat  + (parseFloat(ing.fat_g)     || 0),
    }),
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  )
}

function addMacros(a, b) {
  return { cal: a.cal + b.cal, prot: a.prot + b.prot, carb: a.carb + b.carb, fat: a.fat + b.fat }
}

// Auto-pick the variant size whose total is closest to the client's calorie target
function autoSelectVariant(mealIds, mealMap, calorieTarget) {
  if (!calorieTarget) return null
  const activeMealIds = mealIds.filter(id => id && mealMap[id])
  if (!activeMealIds.length) return null

  const ranked = VARIANT_SIZES.map(size => {
    let total = 0, coverage = 0
    for (const id of activeMealIds) {
      const v = (mealMap[id].meal_variants || []).find(v => v.variant_name === size)
      if (v) { total += parseFloat(v.calories) || 0; coverage++ }
    }
    return { size, total, coverage }
  }).filter(s => s.coverage >= Math.max(1, Math.ceil(activeMealIds.length * 0.5)))
    .sort((a, b) => Math.abs(a.total - calorieTarget) - Math.abs(b.total - calorieTarget))

  return ranked[0]?.size || null
}

// Read-only ingredient list for a variant or base meal
function VariantIngredientList({ mealId, mealMap, variantName }) {
  const meal = mealMap[mealId]
  if (!meal) return null

  let ingredients = []
  let label = 'Base recipe'

  if (variantName) {
    const v = (meal.meal_variants || []).find(v => v.variant_name === variantName)
    if (v) {
      ingredients = v.meal_variant_ingredients || []
      label = `${variantName} variant`
    } else {
      ingredients = meal.meal_ingredients || []
      label = 'Base recipe (no variant set)'
    }
  } else {
    ingredients = meal.meal_ingredients || []
  }

  if (!ingredients.length) return <p className="text-xs text-gray-400 italic px-1">No ingredients recorded</p>

  const totCal = ingredients.reduce((s, i) => s + (parseFloat(i.calories) || 0), 0)
  const totProt = ingredients.reduce((s, i) => s + (parseFloat(i.protein_g) || 0), 0)

  return (
    <div className="space-y-1 pt-1">
      <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-1.5">{label}</p>
      <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide font-medium pb-1">
        <span className="flex-1">Ingredient</span>
        <span className="w-12 text-right">g</span>
        <span className="w-16 text-right">kcal</span>
        <span className="w-12 text-right">P</span>
      </div>
      {ingredients.map((ing, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="flex-1 truncate text-gray-600 dark:text-gray-400">{ing.name}</span>
          <span className="tabular-nums w-12 text-right text-gray-500 dark:text-gray-500">{Math.round(parseFloat(ing.quantity_g) || 0)}</span>
          <span className="tabular-nums w-16 text-right text-gray-500 dark:text-gray-400">{Math.round(parseFloat(ing.calories) || 0)} kcal</span>
          <span className="tabular-nums w-12 text-right text-gray-400 dark:text-gray-500">{Math.round(parseFloat(ing.protein_g) || 0)}g</span>
        </div>
      ))}
      {totCal > 0 && (
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-1.5">
          <span className="flex-1">Meal total</span>
          <span className="tabular-nums w-16 text-right">{Math.round(totCal)} kcal</span>
          <span className="tabular-nums w-12 text-right">{Math.round(totProt)}g</span>
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
  const [repeating, setRepeating] = useState(false)
  const [mealsByCategory, setMealsByCategory] = useState({})
  const [mealMap, setMealMap] = useState({})
  const [expandedSlots, setExpandedSlots] = useState(new Set())
  const [staticEdits, setStaticEdits] = useState({ preworkout_meal_id: null, evening_snack_meal_id: null })
  const [staticDirty, setStaticDirty] = useState(false)
  const [savingStatic, setSavingStatic] = useState(false)
  // 'auto' or a specific variant name — stored as null in DB means auto
  const [assignedVariant, setAssignedVariant] = useState('auto')
  const [variantDirty, setVariantDirty] = useState(false)
  const [savingVariant, setSavingVariant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ plan_group_id: '', calorie_target: client.current_calories || '', starting_week: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [overrideWeek, setOverrideWeek] = useState('')

  async function loadWeekSlots(asgn, weekNum, planGroupId) {
    const [{ data: tmpl }, { data: cwm }] = await Promise.all([
      supabase.from('weekly_templates').select('template_meal_slots(slot_type, meal_id)').eq('plan_group_id', planGroupId).eq('week_number', weekNum).maybeSingle(),
      supabase.from('client_week_meals').select('slots').eq('assignment_id', asgn.id).eq('week_number', weekNum).maybeSingle(),
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
      supabase.from('client_plan_assignments').select('*').eq('client_id', client.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('meals').select(`
        id, name, category,
        meal_ingredients(name, quantity_g, calories, protein_g, carbs_g, fat_g),
        meal_variants(id, variant_name, calories, protein_g, carbs_g, fat_g,
          meal_variant_ingredients(id, name, quantity_g, unit, calories, protein_g, carbs_g, fat_g, scaling_type))
      `).eq('coach_id', coachId).order('name'),
    ])

    const allGroups = groups || []
    setPlanGroups(allGroups)
    setAssignment(asgn || null)

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
      setStaticEdits({ preworkout_meal_id: asgn.preworkout_meal_id || null, evening_snack_meal_id: asgn.evening_snack_meal_id || null })
      setAssignedVariant(asgn.assigned_variant || 'auto')
      if (pg) await loadWeekSlots(asgn, asgn.week_override ?? pg.current_week, pg.id)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [client.id])

  const globalWeek = planGroup?.current_week ?? null
  const effectiveWeek = assignment?.week_override ?? globalWeek
  const isOverridden = assignment?.week_override != null

  // Determine which variant size to use for display
  const activeMealIds = MEAL_SLOTS.map(s => editedSlots[s.key]).filter(Boolean)
  const autoVariant = autoSelectVariant(activeMealIds, mealMap, assignment?.calorie_target)
  const effectiveVariant = assignedVariant === 'auto' ? autoVariant : assignedVariant

  // Daily macro totals
  const rotatingTotal = MEAL_SLOTS.reduce((acc, s) => addMacros(acc, mealMacros(editedSlots[s.key], mealMap, effectiveVariant)), { cal: 0, prot: 0, carb: 0, fat: 0 })
  const preworkoutTotal = mealMacros(staticEdits.preworkout_meal_id, mealMap, effectiveVariant)
  const snackTotal = mealMacros(staticEdits.evening_snack_meal_id, mealMap, effectiveVariant)
  const grandTotal = addMacros(addMacros(rotatingTotal, preworkoutTotal), snackTotal)

  // Variant-level suggestion: if calorie gap ≥ 50, suggest going up/down a size
  function getVariantSuggestion() {
    if (!assignment?.calorie_target || !effectiveVariant) return null
    const gap = assignment.calorie_target - grandTotal.cal
    if (Math.abs(gap) < 50) return null
    const idx = VARIANT_SIZES.indexOf(effectiveVariant)
    if (gap > 0 && idx < VARIANT_SIZES.length - 1) return { text: `Switch to ${VARIANT_SIZES[idx + 1]} portions`, detail: `May add ~${Math.round(gap)} kcal to get closer to target` }
    if (gap < 0 && idx > 0) return { text: `Switch to ${VARIANT_SIZES[idx - 1]} portions`, detail: `May save ~${Math.round(Math.abs(gap))} kcal to get closer to target` }
    return null
  }
  const suggestion = getVariantSuggestion()

  function toggleSlot(key) {
    setExpandedSlots(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })
  }

  async function handleSaveSlots() {
    if (!assignment || effectiveWeek == null) return
    setSavingSlots(true)
    await supabase.from('client_week_meals').upsert(
      { client_id: client.id, coach_id: coachId, assignment_id: assignment.id, week_number: effectiveWeek, slots: editedSlots },
      { onConflict: 'assignment_id,week_number' }
    )
    setSavingSlots(false); setSlotsDirty(false)
  }

  async function handleSaveStaticMeals() {
    if (!assignment) return
    setSavingStatic(true)
    await supabase.from('client_plan_assignments').update({
      preworkout_meal_id: staticEdits.preworkout_meal_id || null,
      evening_snack_meal_id: staticEdits.evening_snack_meal_id || null,
    }).eq('id', assignment.id)
    setSavingStatic(false); setStaticDirty(false)
  }

  async function handleSaveVariant() {
    if (!assignment) return
    setSavingVariant(true)
    await supabase.from('client_plan_assignments').update({
      assigned_variant: assignedVariant === 'auto' ? null : assignedVariant,
    }).eq('id', assignment.id)
    setSavingVariant(false); setVariantDirty(false)
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
              <input className="input" type="number" min="800" max="5000" step="50" value={form.calorie_target} onChange={e => setForm(f => ({ ...f, calorie_target: e.target.value }))} placeholder="e.g. 1800" />
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

          {/* Variant / portion size selector */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Portion Size</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Auto selects the variant closest to the calorie target. Override per-client here.
                </p>
              </div>
              {variantDirty && (
                <button onClick={handleSaveVariant} disabled={savingVariant} className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                  {savingVariant ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {['auto', ...VARIANT_SIZES].map(size => (
                <button
                  key={size}
                  onClick={() => { setAssignedVariant(size); setVariantDirty(true) }}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    assignedVariant === size
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                  }`}
                >
                  {size === 'auto' ? `Auto${autoVariant ? ` (${autoVariant})` : ''}` : size}
                </button>
              ))}
            </div>
          </div>

          {/* Rotating meal slots */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Week {effectiveWeek} meals
                  {effectiveVariant && <span className="ml-2 text-xs font-normal text-gray-400">· {effectiveVariant} portions</span>}
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
                const macros = mealMacros(currentId, mealMap, effectiveVariant)
                const options = mealsByCategory[slot.cat] || []
                const isOverridden = templateSlots[slot.key] !== undefined && (editedSlots[slot.key] || null) !== (templateSlots[slot.key] || null)
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
                      {currentId && macros.cal > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>
                      )}
                    </div>
                    {isExpanded && currentId && (
                      <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                        <VariantIngredientList mealId={currentId} mealMap={mealMap} variantName={effectiveVariant} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {rotatingTotal.cal > 0 && (
              <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <span className="flex-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Subtotal (6 meals)</span>
                <span className="tabular-nums text-sm font-semibold text-gray-700 dark:text-gray-200">{Math.round(rotatingTotal.cal)} kcal</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(rotatingTotal.prot)}g P &middot; {Math.round(rotatingTotal.carb)}g C &middot; {Math.round(rotatingTotal.fat)}g F</span>
              </div>
            )}

            {slotsDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
                <button onClick={handleSaveSlots} disabled={savingSlots} className="btn-primary py-1.5 px-4 text-sm">{savingSlots ? 'Saving…' : 'Save meal changes'}</button>
                <button onClick={() => { setEditedSlots({ ...templateSlots }); setSlotsDirty(false) }} className="text-sm text-gray-400 hover:text-gray-700">Reset to template</button>
              </div>
            )}
          </div>

          {/* Static meals */}
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Static Meals</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Same every week — not part of the rotation</p>
            </div>

            {[
              { key: 'preworkout_meal_id', label: 'Pre-workout', cat: 'pre_workout' },
              { key: 'evening_snack_meal_id', label: 'Evening snack', cat: 'evening_snack' },
            ].map(({ key, label, cat }) => {
              const mealId = staticEdits[key] || ''
              const isExpanded = expandedSlots.has(key)
              const options = mealsByCategory[cat] || []
              const macros = mealMacros(mealId, mealMap, effectiveVariant)
              return (
                <div key={key} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-pink-50/30 dark:hover:bg-pink-900/5">
                    <button onClick={() => mealId && toggleSlot(key)} className="flex-shrink-0">
                      <svg className={`w-3.5 h-3.5 transition-transform text-gray-300 dark:text-gray-600 ${isExpanded ? 'rotate-90' : ''} ${!mealId ? 'opacity-0' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="w-24 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
                    <select
                      className="flex-1 text-sm text-gray-800 dark:text-gray-200 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer min-w-0"
                      value={mealId}
                      onChange={e => { setStaticEdits(prev => ({ ...prev, [key]: e.target.value || null })); setStaticDirty(true) }}
                    >
                      <option value="">— None —</option>
                      {options.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    {options.length === 0 && <span className="text-xs text-gray-400 italic">No {cat} meals yet</span>}
                    {mealId && macros.cal > 0 && <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{Math.round(macros.cal)} kcal</span>}
                  </div>
                  {isExpanded && mealId && (
                    <div className="ml-9 px-3 pb-3 bg-gray-50/40 dark:bg-gray-800/20">
                      <VariantIngredientList mealId={mealId} mealMap={mealMap} variantName={effectiveVariant} />
                    </div>
                  )}
                </div>
              )
            })}

            {staticDirty && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
                <button onClick={handleSaveStaticMeals} disabled={savingStatic} className="btn-primary py-1.5 px-4 text-sm">{savingStatic ? 'Saving…' : 'Save static meals'}</button>
                <button onClick={() => { setStaticEdits({ preworkout_meal_id: assignment?.preworkout_meal_id || null, evening_snack_meal_id: assignment?.evening_snack_meal_id || null }); setStaticDirty(false) }} className="text-sm text-gray-400 hover:text-gray-700">Cancel</button>
              </div>
            )}
          </div>

          {/* Daily totals */}
          {(grandTotal.cal > 0 || assignment?.calorie_target) && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily total</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(grandTotal.cal)} kcal</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{Math.round(grandTotal.prot)}g P &middot; {Math.round(grandTotal.carb)}g C &middot; {Math.round(grandTotal.fat)}g F</p>
                </div>
              </div>

              {assignment?.calorie_target && (
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {assignment.calorie_target} kcal
                    {client.current_protein ? ` · ${client.current_protein}g P` : ''}
                    {client.current_carbs ? ` · ${client.current_carbs}g C` : ''}
                    {client.current_fat ? ` · ${client.current_fat}g F` : ''}
                  </span>
                </div>
              )}

              {assignment?.calorie_target && Math.abs(assignment.calorie_target - grandTotal.cal) >= 50 && (
                <p className={`text-sm font-medium ${grandTotal.cal > assignment.calorie_target ? 'text-orange-500' : 'text-blue-500'}`}>
                  {grandTotal.cal > assignment.calorie_target
                    ? `${Math.round(grandTotal.cal - assignment.calorie_target)} kcal over target`
                    : `${Math.round(assignment.calorie_target - grandTotal.cal)} kcal under target`}
                </p>
              )}

              {suggestion && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Suggestion</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{suggestion.text}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{suggestion.detail}</p>
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
