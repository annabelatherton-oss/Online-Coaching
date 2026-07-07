import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const RATING_LABELS = {
  energy_level: ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'],
  sleep_quality: ['', 'Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  adherence:     ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
}

const PHOTO_ANGLES = [
  { key: 'front', label: 'Front' },
  { key: 'back',  label: 'Back' },
  { key: 'left',  label: 'Left side' },
  { key: 'right', label: 'Right side' },
]

function RatingInput({ field, value, onChange }) {
  const labels = RATING_LABELS[field]
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(field, n === value ? null : n)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
            value === n
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-300'
          }`}
          title={labels[n]}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

// Filled human body silhouettes for each photo angle
const POSE_ICON = {
  front: (
    <svg viewBox="0 0 100 200" fill="currentColor" className="w-full h-full">
      {/* head */}
      <ellipse cx="50" cy="15" rx="13" ry="14"/>
      {/* neck */}
      <path d="M44 28 L44 38 C46 41 50 43 54 42 C57 41 57 38 56 28Z"/>
      {/* torso: wide at shoulders, slight waist, flared hips */}
      <path d="M20 40 C13 42 11 47 11 53 L11 76 C11 82 14 86 20 88 C18 91 20 96 22 99 L28 103 L36 105 L64 105 L72 103 L78 99 C80 96 82 91 80 88 C86 86 89 82 89 76 L89 53 C89 47 87 42 80 40 C71 36 61 34 50 34 C39 34 29 36 20 40Z"/>
      {/* left arm — hangs straight at side */}
      <path d="M11 55 C5 57 3 62 3 68 L3 100 C3 106 7 110 13 110 L20 110 C26 110 26 106 25 100 L25 68 C24 62 19 57 13 55Z"/>
      {/* right arm */}
      <path d="M89 55 C95 57 97 62 97 68 L97 100 C97 106 93 110 87 110 L80 110 C74 110 74 106 75 100 L75 68 C76 62 81 57 87 55Z"/>
      {/* left leg */}
      <path d="M27 105 L22 110 L18 148 L16 174 C16 181 20 185 28 185 L37 185 C43 183 43 178 41 174 L39 148 L39 110Z"/>
      {/* right leg */}
      <path d="M73 105 L78 110 L82 148 L84 174 C84 181 80 185 72 185 L63 185 C57 183 57 178 59 174 L61 148 L61 110Z"/>
      {/* left foot */}
      <path d="M16 177 L12 182 L10 188 C11 194 20 197 32 195 L41 191 L41 183Z"/>
      {/* right foot */}
      <path d="M84 177 L88 182 L90 188 C89 194 80 197 68 195 L59 191 L59 183Z"/>
    </svg>
  ),
  back: (
    // Same silhouette as front — outlines look identical
    <svg viewBox="0 0 100 200" fill="currentColor" className="w-full h-full">
      <ellipse cx="50" cy="15" rx="13" ry="14"/>
      <path d="M44 28 L44 38 C46 41 50 43 54 42 C57 41 57 38 56 28Z"/>
      <path d="M20 40 C13 42 11 47 11 53 L11 76 C11 82 14 86 20 88 C18 91 20 96 22 99 L28 103 L36 105 L64 105 L72 103 L78 99 C80 96 82 91 80 88 C86 86 89 82 89 76 L89 53 C89 47 87 42 80 40 C71 36 61 34 50 34 C39 34 29 36 20 40Z"/>
      <path d="M11 55 C5 57 3 62 3 68 L3 100 C3 106 7 110 13 110 L20 110 C26 110 26 106 25 100 L25 68 C24 62 19 57 13 55Z"/>
      <path d="M89 55 C95 57 97 62 97 68 L97 100 C97 106 93 110 87 110 L80 110 C74 110 74 106 75 100 L75 68 C76 62 81 57 87 55Z"/>
      <path d="M27 105 L22 110 L18 148 L16 174 C16 181 20 185 28 185 L37 185 C43 183 43 178 41 174 L39 148 L39 110Z"/>
      <path d="M73 105 L78 110 L82 148 L84 174 C84 181 80 185 72 185 L63 185 C57 183 57 178 59 174 L61 148 L61 110Z"/>
      <path d="M16 177 L12 182 L10 188 C11 194 20 197 32 195 L41 191 L41 183Z"/>
      <path d="M84 177 L88 182 L90 188 C89 194 80 197 68 195 L59 191 L59 183Z"/>
    </svg>
  ),
  left: (
    // Side profile facing left, arm extended forward (to the left)
    <svg viewBox="0 0 100 200" fill="currentColor" className="w-full h-full">
      {/* head — offset right to suggest facing left */}
      <ellipse cx="56" cy="15" rx="12" ry="14"/>
      {/* neck */}
      <path d="M50 28 L50 38 C52 41 57 43 61 41 L61 28Z"/>
      {/* torso — narrow side profile, slight chest/butt curve */}
      <path d="M42 40 C36 42 34 47 34 53 L34 78 C34 84 36 88 42 90 L42 105 L66 105 L66 90 C70 88 68 84 68 78 L68 53 C68 47 66 42 60 40 C56 36 46 36 42 40Z"/>
      {/* arm extended forward (leftward) */}
      <path d="M36 54 C30 52 22 52 14 54 L4 58 C0 60 0 65 2 68 L5 72 C8 74 14 74 20 72 L36 66 C40 64 42 60 40 56Z"/>
      {/* front leg */}
      <path d="M40 105 L36 112 L31 150 L29 175 C29 182 33 186 41 186 L50 186 C56 184 56 179 54 175 L52 150 L52 112Z"/>
      {/* back leg (slightly behind) */}
      <path d="M54 105 L58 112 L63 150 L65 175 C65 182 61 186 54 186 L50 186 L52 150 L56 112Z"/>
      {/* front foot */}
      <path d="M29 178 L24 183 L22 190 C23 196 34 199 48 196 L54 190 L54 184Z"/>
      {/* back foot */}
      <path d="M65 178 L68 183 L66 192 L54 190 L54 184 L62 181Z"/>
    </svg>
  ),
  right: (
    // Mirror of left — person faces right, arm extends right
    <svg viewBox="0 0 100 200" fill="currentColor" className="w-full h-full" style={{transform:'scaleX(-1)'}}>
      <ellipse cx="56" cy="15" rx="12" ry="14"/>
      <path d="M50 28 L50 38 C52 41 57 43 61 41 L61 28Z"/>
      <path d="M42 40 C36 42 34 47 34 53 L34 78 C34 84 36 88 42 90 L42 105 L66 105 L66 90 C70 88 68 84 68 78 L68 53 C68 47 66 42 60 40 C56 36 46 36 42 40Z"/>
      <path d="M36 54 C30 52 22 52 14 54 L4 58 C0 60 0 65 2 68 L5 72 C8 74 14 74 20 72 L36 66 C40 64 42 60 40 56Z"/>
      <path d="M40 105 L36 112 L31 150 L29 175 C29 182 33 186 41 186 L50 186 C56 184 56 179 54 175 L52 150 L52 112Z"/>
      <path d="M54 105 L58 112 L63 150 L65 175 C65 182 61 186 54 186 L50 186 L52 150 L56 112Z"/>
      <path d="M29 178 L24 183 L22 190 C23 196 34 199 48 196 L54 190 L54 184Z"/>
      <path d="M65 178 L68 183 L66 192 L54 190 L54 184 L62 181Z"/>
    </svg>
  ),
}

function PhotoSlot({ angle, url, uploading, onUpload }) {
  const ref = useRef()
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-600 transition-colors group"
      >
        {url ? (
          <img src={url} alt={angle.label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-200 dark:text-gray-700 group-hover:text-brand-300 dark:group-hover:text-brand-700 transition-colors">
            {POSE_ICON[angle.key]}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
        {url && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
            <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </button>
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">{angle.label}</p>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(angle.key, f) }}
      />
    </div>
  )
}

export default function ClientCheckin() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [collectMeasurements, setCollectMeasurements] = useState(false)
  const [topLifts, setTopLifts] = useState([])
  const [existing, setExisting] = useState(null)
  const [form, setForm] = useState({
    weight_kg: '',
    waist_cm: '',
    hips_cm: '',
    energy_level: null,
    sleep_quality: null,
    adherence: null,
    notes: '',
    lift_results: [],
  })
  const [photos, setPhotos] = useState({ front: null, back: null, left: null, right: null })
  const [uploading, setUploading] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id, coach_id, collect_measurements, top_lifts')
        .eq('profile_id', session.user.id)
        .single()
      if (!clientRow) { setLoading(false); return }
      setClientData(clientRow)
      setCollectMeasurements(!!clientRow.collect_measurements)
      setTopLifts((clientRow.top_lifts || []).filter(l => l?.name))

      const { data: asgn } = await supabase
        .from('client_plan_assignments')
        .select('id, plan_group_id, week_override')
        .eq('client_id', clientRow.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      let week = 1
      if (asgn) {
        if (asgn.week_override != null) {
          week = asgn.week_override
        } else {
          const { data: pg } = await supabase.from('plan_groups').select('current_week').eq('id', asgn.plan_group_id).single()
          week = pg?.current_week ?? 1
        }
      }
      setWeekNumber(week)

      const { data: checkin } = await supabase
        .from('client_checkins')
        .select('*')
        .eq('client_id', clientRow.id)
        .eq('week_number', week)
        .maybeSingle()

      if (checkin) {
        setExisting(checkin)
        setForm(f => ({
          ...f,
          weight_kg:     checkin.weight_kg    ?? '',
          waist_cm:      checkin.waist_cm     ?? '',
          hips_cm:       checkin.hips_cm      ?? '',
          energy_level:  checkin.energy_level ?? null,
          sleep_quality: checkin.sleep_quality ?? null,
          adherence:     checkin.adherence    ?? null,
          notes:         checkin.notes        ?? '',
          lift_results:  checkin.lift_results ?? [],
        }))
        if (checkin.progress_photos) setPhotos(prev => ({ ...prev, ...checkin.progress_photos }))
      }
      setLoading(false)
    }
    load()
  }, [session.user.id])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function setLift(index, key, value) {
    setForm(f => {
      const results = [...(f.lift_results || [])]
      results[index] = { ...results[index], name: topLifts[index]?.name, [key]: value }
      return { ...f, lift_results: results }
    })
  }

  async function handlePhotoUpload(angleKey, file) {
    if (!clientData || weekNumber == null) return
    setUploading(u => ({ ...u, [angleKey]: true }))
    const ext = file.name.split('.').pop()
    const path = `checkins/${clientData.id}/week-${weekNumber}/${angleKey}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('progress-photos').upload(path, file, { upsert: true })
    if (uploadErr) { setUploading(u => ({ ...u, [angleKey]: false })); return }
    const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path)
    setPhotos(p => ({ ...p, [angleKey]: urlData.publicUrl }))
    setUploading(u => ({ ...u, [angleKey]: false }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clientData) return
    setSaving(true); setError(''); setSaved(false)

    const hasPhotos = Object.values(photos).some(Boolean)
    const payload = {
      client_id:        clientData.id,
      coach_id:         clientData.coach_id,
      week_number:      weekNumber,
      updated_at:       new Date().toISOString(),
      weight_kg:        form.weight_kg !== '' ? parseFloat(form.weight_kg) : null,
      waist_cm:         collectMeasurements && form.waist_cm !== '' ? parseFloat(form.waist_cm) : null,
      hips_cm:          collectMeasurements && form.hips_cm  !== '' ? parseFloat(form.hips_cm)  : null,
      energy_level:     form.energy_level,
      sleep_quality:    form.sleep_quality,
      adherence:        form.adherence,
      notes:            form.notes || null,
      lift_results:     form.lift_results?.length ? form.lift_results : null,
      progress_photos:  hasPhotos ? photos : null,
    }

    const { error: err } = existing
      ? await supabase.from('client_checkins').update(payload).eq('id', existing.id)
      : await supabase.from('client_checkins').insert(payload)

    setSaving(false)
    if (err) { setError('Could not save. Please try again.'); return }
    setSaved(true)
    if (!existing) {
      const { data } = await supabase.from('client_checkins').select('*').eq('client_id', clientData.id).eq('week_number', weekNumber).maybeSingle()
      setExisting(data)
    }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Check-in</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {weekNumber != null ? `Week ${weekNumber}` : 'Your weekly progress update.'}
          {existing && <span className="ml-1 text-brand-500">Already submitted — you can update it below.</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Body metrics */}
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Body metrics</h2>
          <div>
            <label className="label">Weight (kg)</label>
            <input className="input" type="number" step="0.1" min="0" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="e.g. 72.5" />
          </div>
          {collectMeasurements && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Waist (cm)</label>
                <input className="input" type="number" step="0.5" min="0" value={form.waist_cm} onChange={e => set('waist_cm', e.target.value)} placeholder="—" />
              </div>
              <div>
                <label className="label">Hips (cm)</label>
                <input className="input" type="number" step="0.5" min="0" value={form.hips_cm} onChange={e => set('hips_cm', e.target.value)} placeholder="—" />
              </div>
            </div>
          )}
        </div>

        {/* Progress photos */}
        <div className="card space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Progress photos</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tap a slot to upload — photos go straight to your coach.</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {PHOTO_ANGLES.map(angle => (
              <PhotoSlot
                key={angle.key}
                angle={angle}
                url={photos[angle.key]}
                uploading={!!uploading[angle.key]}
                onUpload={handlePhotoUpload}
              />
            ))}
          </div>
        </div>

        {/* Ratings */}
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">How was this week?</h2>
          <div>
            <label className="label">Energy levels</label>
            <RatingInput field="energy_level" value={form.energy_level} onChange={set} />
            {form.energy_level && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.energy_level[form.energy_level]}</p>}
          </div>
          <div>
            <label className="label">Sleep quality</label>
            <RatingInput field="sleep_quality" value={form.sleep_quality} onChange={set} />
            {form.sleep_quality && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.sleep_quality[form.sleep_quality]}</p>}
          </div>
          <div>
            <label className="label">Adherence to your plan</label>
            <RatingInput field="adherence" value={form.adherence} onChange={set} />
            {form.adherence && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">{RATING_LABELS.adherence[form.adherence]}</p>}
          </div>
        </div>

        {/* Top lifts */}
        {topLifts.length > 0 && (
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">This week's lifts</h2>
            {topLifts.map((lift, i) => {
              const result = form.lift_results?.[i] || {}
              return (
                <div key={i}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lift.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Weight (kg)</label>
                      <input className="input" type="number" step="0.5" min="0" value={result.weight_kg ?? ''} onChange={e => setLift(i, 'weight_kg', e.target.value)} placeholder="e.g. 80" />
                    </div>
                    <div>
                      <label className="label">Reps</label>
                      <input className="input" type="number" min="1" value={result.reps ?? ''} onChange={e => setLift(i, 'reps', e.target.value)} placeholder="e.g. 5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Notes */}
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notes for your coach</h2>
          <textarea
            className="input resize-none"
            rows={4}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="How you're feeling, any struggles, wins, anything else you want your coach to know…"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || Object.values(uploading).some(Boolean)} className="btn-primary">
            {saving ? 'Saving…' : existing ? 'Update check-in' : 'Submit check-in'}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Saved</span>}
        </div>
      </form>
    </div>
  )
}
