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

// Check-in window: opens Thursday, expected Friday, grace period through Tuesday
// Wednesday is the "closed" day between windows
function isCheckinWindowOpen() {
  const dow = new Date().getDay() // 0=Sun,1=Mon,...,4=Thu,5=Fri,6=Sat
  return dow !== 3 // closed Wednesday only
}

function nextThursdayLabel() {
  const d = new Date()
  const daysUntil = (4 - d.getDay() + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntil)
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Parse "60x10,60x8" log format → best (heaviest) set
function getBestSet(reps_completed, weight_kg) {
  if (!reps_completed) return weight_kg != null ? { weight: weight_kg, reps: null } : null
  let best = null
  reps_completed.split(',').forEach(p => {
    const xi = p.indexOf('x')
    if (xi < 0) return
    const w = parseFloat(p.slice(0, xi))
    const r = parseInt(p.slice(xi + 1))
    if (!isNaN(w) && (!best || w > best.weight || (w === best.weight && r > (best.reps || 0)))) {
      best = { weight: w, reps: isNaN(r) ? null : r }
    }
  })
  return best || (weight_kg != null ? { weight: weight_kg, reps: null } : null)
}

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

function RatingDisplay({ field, value }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`flex-1 py-2 rounded-xl text-sm font-semibold text-center border ${
          value === n
            ? 'bg-brand-500 border-brand-500 text-white'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700'
        }`}>{n}</div>
      ))}
    </div>
  )
}

function CheckinReadView({ checkin, collectMeasurements }) {
  const photos = checkin.progress_photos || {}
  const hasPhotos = Object.values(photos).some(Boolean)
  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Body metrics</h2>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Weight</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{checkin.weight_kg != null ? `${checkin.weight_kg} kg` : '—'}</p>
        </div>
        {collectMeasurements && (checkin.waist_cm != null || checkin.hips_cm != null) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Waist</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkin.waist_cm != null ? `${checkin.waist_cm} cm` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hips</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkin.hips_cm != null ? `${checkin.hips_cm} cm` : '—'}</p>
            </div>
          </div>
        )}
      </div>

      {hasPhotos && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Progress photos</h2>
          <div className="grid grid-cols-4 gap-2">
            {PHOTO_ANGLES.map(angle => photos[angle.key] ? (
              <div key={angle.key} className="flex flex-col gap-1">
                <img src={photos[angle.key]} alt={angle.label} className="w-full aspect-[3/4] object-cover rounded-xl" />
                <p className="text-xs text-center text-gray-400">{angle.label}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">How was this week?</h2>
        {['energy_level', 'sleep_quality', 'adherence'].map(field => (
          <div key={field}>
            <label className="label capitalize">{field.replace('_', ' ')}</label>
            <RatingDisplay field={field} value={checkin[field]} />
            {checkin[field] && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">{RATING_LABELS[field][checkin[field]]}</p>}
          </div>
        ))}
      </div>

      {(checkin.lift_results || []).filter(r => r?.name).length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Lifts</h2>
          {checkin.lift_results.filter(r => r?.name).map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">{r.name}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {r.reps} reps × {r.weight_kg} kg
              </p>
            </div>
          ))}
        </div>
      )}

      {checkin.notes && (
        <div className="card space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notes</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{checkin.notes}</p>
        </div>
      )}

      {checkin.coach_response && (
        <div className="card space-y-2 border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Message from your coach</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{checkin.coach_response}</p>
        </div>
      )}
    </div>
  )
}

export default function ClientCheckin() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [weekNumber, setWeekNumber] = useState(null)
  const [personalWeek, setPersonalWeek] = useState(null)
  const [collectMeasurements, setCollectMeasurements] = useState(false)
  const [topLifts, setTopLifts] = useState([])
  const [allCheckins, setAllCheckins] = useState([])
  const [existing, setExisting] = useState(null)
  const [historyList, setHistoryList] = useState([])
  const [viewingId, setViewingId] = useState(null)
  const [upcomingPause, setUpcomingPause] = useState(null)
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
  const [exerciseLogMap, setExerciseLogMap] = useState({})   // exerciseId → log row

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
        .select('program_id, week_override, training_programs(current_week, top_lifts)')
        .eq('client_id', clientRow.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const trainingLifts = (trainingAsgn?.training_programs?.top_lifts || []).filter(l => l?.name)
      const clientLifts = (clientRow.top_lifts || []).filter(l => l?.name)
      const lifts = trainingLifts.length > 0 ? trainingLifts : clientLifts
      setTopLifts(lifts)

      // Load session exercises so lifts can be linked to logged exercises
      if (trainingAsgn?.program_id) {
        const trainingWeek = trainingAsgn.week_override ?? trainingAsgn.training_programs?.current_week ?? 1
        const { data: sessData } = await supabase
          .from('training_sessions')
          .select('session_exercises(id, name, order_index)')
          .eq('program_id', trainingAsgn.program_id)
          .eq('week_number', trainingWeek)
        const allExs = (sessData || [])
          .flatMap(s => (s.session_exercises || []).sort((a, b) => a.order_index - b.order_index))
        // Auto-match lift names to session exercises (coach set both, names should match)
        const exByName = {}
        allExs.forEach(e => { exByName[(e.name || '').toLowerCase()] = e })
        const matchedIds = lifts.map(lift => exByName[(lift.name || '').toLowerCase()]?.id).filter(Boolean)

        if (matchedIds.length > 0) {
          const { data: logs } = await supabase
            .from('client_exercise_logs')
            .select('session_exercise_id, weight_kg, reps_completed')
            .eq('client_id', clientRow.id)
            .eq('week_number', trainingWeek)
            .in('session_exercise_id', matchedIds)
          // Key by exercise name (lowercase) for easy lookup in render
          const logMap = {}
          ;(logs || []).forEach(l => {
            const ex = allExs.find(e => e.id === l.session_exercise_id)
            if (ex) logMap[(ex.name || '').toLowerCase()] = l
          })
          setExerciseLogMap(logMap)

          // Pre-populate if no check-in submitted yet this week
          const { count } = await supabase
            .from('client_checkins')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientRow.id)
            .eq('week_number', week)
          if (!count) {
            const prePop = lifts.map(lift => {
              const ex = exByName[(lift.name || '').toLowerCase()]
              const log = ex ? logMap[ex.id] : null
              if (!log) return {}
              const best = getBestSet(log.reps_completed, log.weight_kg)
              return best
                ? { name: lift.name, weight_kg: best.weight != null ? String(best.weight) : '', reps: best.reps != null ? String(best.reps) : '' }
                : {}
            })
            if (prePop.some(r => r.weight_kg || r.reps)) {
              setForm(f => ({ ...f, lift_results: prePop }))
            }
          }
        }
      }

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

      const { data: pauseRow } = await supabase.from('plan_pauses')
        .select('pause_start_date')
        .eq('client_id', clientRow.id)
        .eq('status', 'approved')
        .not('pause_start_date', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()
      setUpcomingPause(pauseRow)

      // Load full check-in history (oldest first) for week numbering + sidebar
      const { data: allHistory } = await supabase.from('client_checkins')
        .select('*').eq('client_id', clientRow.id).order('created_at', { ascending: true })

      const histWithWeeks = (allHistory || []).map((c, i) => ({ ...c, personal_week: i + 1 }))
      setAllCheckins(histWithWeeks)

      // Sidebar: past check-ins newest first
      const checkin = histWithWeeks.find(c => c.week_number === week) || null
      setHistoryList([...histWithWeeks].reverse())
      setPersonalWeek(checkin ? checkin.personal_week : histWithWeeks.length + 1)

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

  const viewingCheckin = viewingId ? historyList.find(c => c.id === viewingId) : null

  // Show holiday note if approved pause starts next Monday
  const nextMondayISO = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    const dow = d.getDay()
    const days = (8 - dow) % 7 || 7
    d.setDate(d.getDate() + days)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })()
  const showHolidayNote = upcomingPause?.pause_start_date === nextMondayISO

  function fmtCheckinDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function Sidebar() {
    return (
      <aside className="hidden sm:flex flex-col w-48 shrink-0 gap-1">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-2">Check-ins</p>
        <button
          onClick={() => setViewingId(null)}
          className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
            viewingId === null
              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <p className="text-sm font-semibold">Week {personalWeek}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">This week</p>
        </button>
        {historyList.filter(c => c.week_number !== weekNumber).map(c => (
          <button
            key={c.id}
            onClick={() => setViewingId(c.id)}
            className={`text-left px-3 py-2.5 rounded-xl transition-colors ${
              viewingId === c.id
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <p className="text-sm font-semibold">Week {c.personal_week}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtCheckinDate(c.created_at)}</p>
          </button>
        ))}
      </aside>
    )
  }

  // Gate: no check-in submitted yet AND window is closed (Wednesday)
  if (!isCheckinWindowOpen() && !existing) {
    return (
      <div className="flex gap-6">
        <Sidebar />
        <div className="flex-1 min-w-0 space-y-6 max-w-lg">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Check-in</h1>
            {personalWeek != null && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Week {personalWeek}</p>}
          </div>
          {viewingCheckin ? (
            <CheckinReadView checkin={viewingCheckin} collectMeasurements={collectMeasurements} />
          ) : (
            <div className="card text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Check-in opens Thursday</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your next check-in will be available on {nextThursdayLabel()}.<br />
                You'll get a reminder on Friday morning.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <Sidebar />
      <div className="flex-1 min-w-0 space-y-6 max-w-lg">
      {viewingCheckin ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Check-in</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Week {viewingCheckin.personal_week} · {fmtCheckinDate(viewingCheckin.created_at)}</p>
          </div>
          <CheckinReadView checkin={viewingCheckin} collectMeasurements={collectMeasurements} />
        </>
      ) : (
      <>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Check-in</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {personalWeek != null ? `Week ${personalWeek}` : 'Your weekly progress update.'}
          {existing && <span className="ml-1 text-brand-500">Already submitted — you can update it below.</span>}
        </p>
      </div>

      {showHolidayNote && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🌴</span>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">You're going on holiday next week</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Your coach won't be sending you a plan for next week — enjoy your trip!</p>
          </div>
        </div>
      )}

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
              const trainingLog = exerciseLogMap[(lift.name || '').toLowerCase()]
              const trainingBest = trainingLog ? getBestSet(trainingLog.reps_completed, trainingLog.weight_kg) : null

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
                      {trainingBest?.weight != null && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">From training: {trainingBest.weight} kg</p>
                      )}
                    </div>
                    <div>
                      <label className="label">Reps</label>
                      <input className="input" type="number" min="1" value={result.reps ?? ''} onChange={e => setLift(i, 'reps', e.target.value)} placeholder="e.g. 5" />
                      {trainingBest?.reps != null && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">From training: {trainingBest.reps}</p>
                      )}
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

      {/* Coach response */}
      {existing?.coach_response && (
        <div className="card space-y-2 border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">Message from your coach</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{existing.coach_response}</p>
        </div>
      )}

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
      </>
      )}
      </div>
    </div>
  )
}
