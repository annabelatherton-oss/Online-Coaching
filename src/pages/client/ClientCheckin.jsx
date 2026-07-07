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

function getBestPerformance(liftName, checkins) {
  const results = checkins
    .flatMap(c => c.lift_results || [])
    .filter(r => r?.name === liftName && r.weight_kg != null && r.reps != null)
  if (!results.length) return null
  return results.reduce((best, r) => {
    const w = parseFloat(r.weight_kg), bw = parseFloat(best.weight_kg)
    if (w > bw) return r
    if (w === bw && parseInt(r.reps) > parseInt(best.reps)) return r
    return best
  })
}

function calcNextTarget(lift, bestPerf) {
  if (!bestPerf || !lift.reps_max) return null
  const w = parseFloat(bestPerf.weight_kg)
  const r = parseInt(bestPerf.reps)
  const maxReps = parseInt(lift.reps_max)
  const minReps = parseInt(lift.reps_min) || maxReps
  const increment = parseFloat(lift.weight_increment) || 5
  if (r >= maxReps) {
    return { weight_kg: w + increment, reps: minReps }
  }
  return { weight_kg: w, reps: r + 1 }
}

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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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
  const [allCheckins, setAllCheckins] = useState([])
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

      // Prefer top lifts from active training assignment; fall back to client record
      const { data: trainingAsgn } = await supabase
        .from('client_training_assignments')
        .select('program_id, training_programs(top_lifts)')
        .eq('client_id', clientRow.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const trainingLifts = (trainingAsgn?.training_programs?.top_lifts || []).filter(l => l?.name)
      const clientLifts = (clientRow.top_lifts || []).filter(l => l?.name)
      setTopLifts(trainingLifts.length > 0 ? trainingLifts : clientLifts)

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

      // All check-ins with lift data, used for best-ever performance calculation
      const { data: history } = await supabase
        .from('client_checkins')
        .select('week_number, lift_results')
        .eq('client_id', clientRow.id)
        .not('lift_results', 'is', null)
      setAllCheckins(history || [])

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
    if (err) { setError(err.message || 'Could not save. Please try again.'); return }
    setSaved(true)
    if (!existing) {
      const { data } = await supabase.from('client_checkins').select('*').eq('client_id', clientData.id).eq('week_number', weekNumber).maybeSingle()
      setExisting(data)
    }
  }

  // Compute next-week targets based on all history plus what was just submitted
  function getNextWeekTargets() {
    const prevCheckins = allCheckins.filter(c => c.week_number !== weekNumber)
    const currentEntry = { lift_results: (form.lift_results || []).filter(r => r?.name) }
    const withCurrent = [...prevCheckins, currentEntry]
    return topLifts.map(lift => ({
      lift,
      target: calcNextTarget(lift, getBestPerformance(lift.name, withCurrent)),
    }))
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
              const prevCheckins = allCheckins.filter(c => c.week_number !== weekNumber)
              const best = getBestPerformance(lift.name, prevCheckins)
              const target = calcNextTarget(lift, best)
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{lift.name}</p>
                    {target ? (
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-medium whitespace-nowrap">
                        Aim for: {target.reps} reps × {target.weight_kg} kg
                      </span>
                    ) : (lift.reps_min && lift.reps_max) ? (
                      <span className="text-xs text-gray-400 whitespace-nowrap">Target: {lift.reps_min}–{lift.reps_max} reps</span>
                    ) : null}
                  </div>
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

      {/* Next week's targets — shown after saving */}
      {saved && topLifts.length > 0 && (
        <div className="card space-y-3 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">Next week's targets</p>
          <div className="divide-y divide-green-100 dark:divide-green-900/40">
            {getNextWeekTargets().map(({ lift, target }, i) => (
              <div key={i} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{lift.name}</span>
                {target ? (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {target.reps} reps × {target.weight_kg} kg
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Log a result to get a target</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
