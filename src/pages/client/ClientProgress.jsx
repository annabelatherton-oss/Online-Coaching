import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

const RATING_LABELS = {
  energy_level: ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'],
  sleep_quality: ['', 'Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  adherence:     ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
}

function ratingColor(v) {
  if (!v) return 'text-gray-400'
  if (v >= 4) return 'text-green-600 dark:text-green-400'
  if (v >= 3) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function RatingDot({ value }) {
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500']
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[value] || 'bg-gray-200'}`} />
  )
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CheckinCard({ ci, weekNum, onLightbox }) {
  const [open, setOpen] = useState(false)
  const photos = ci.progress_photos ? PHOTO_ANGLES.filter(a => ci.progress_photos[a]) : []
  const lifts = (ci.lift_results || []).filter(l => l?.name)

  return (
    <div className="card overflow-hidden">
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white">Week {weekNum}</span>
            {ci.updated_at || ci.submitted_at
              ? <p className="text-xs text-gray-400 mt-0.5">{fmtDate(ci.updated_at || ci.submitted_at)}</p>
              : null}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {ci.weight_kg != null && (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{ci.weight_kg} kg</span>
            )}
            <div className="flex items-center gap-1.5">
              {ci.energy_level != null && <RatingDot value={ci.energy_level} />}
              {ci.sleep_quality != null && <RatingDot value={ci.sleep_quality} />}
              {ci.adherence != null && <RatingDot value={ci.adherence} />}
            </div>
            {photos.length > 0 && (
              <span className="text-xs text-gray-400">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
            )}
            {ci.coach_response && (
              <span className="text-xs font-medium text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-full">Coach replied</span>
            )}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          {/* Ratings */}
          {(ci.energy_level != null || ci.sleep_quality != null || ci.adherence != null) && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'energy_level', label: 'Energy' },
                { key: 'sleep_quality', label: 'Sleep' },
                { key: 'adherence', label: 'Adherence' },
              ].map(({ key, label }) => ci[key] != null && (
                <div key={key} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className={`text-base font-bold ${ratingColor(ci[key])}`}>{ci[key]}<span className="text-xs font-normal text-gray-400">/5</span></p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{RATING_LABELS[key][ci[key]]}</p>
                </div>
              ))}
            </div>
          )}

          {/* Measurements */}
          {(ci.waist_cm != null || ci.hips_cm != null) && (
            <div className="grid grid-cols-2 gap-2">
              {ci.waist_cm != null && (
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-400 mb-0.5">Waist</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{ci.waist_cm} cm</p>
                </div>
              )}
              {ci.hips_cm != null && (
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-xs text-gray-400 mb-0.5">Hips</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{ci.hips_cm} cm</p>
                </div>
              )}
            </div>
          )}

          {/* Lifts */}
          {lifts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Lifts</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {lifts.map((lift, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-400 mb-0.5 truncate">{lift.name}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {ci.notes && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Your notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{ci.notes}"</p>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Progress photos</p>
              <div className="grid grid-cols-4 gap-2">
                {photos.map(angle => (
                  <button
                    key={angle}
                    onClick={() => onLightbox(ci.progress_photos[angle])}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                  >
                    <img src={ci.progress_photos[angle]} alt={angle} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coach response */}
          {ci.coach_response && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Message from your coach</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{ci.coach_response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ClientProgress() {
  const { session } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [weightEntries, setWeightEntries] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', session.user.id)
        .single()

      if (!client) { setLoading(false); return }
      setClientData(client)

      const [{ data: weights }, { data: cis }] = await Promise.all([
        supabase.from('weight_entries').select('*').eq('client_id', client.id).order('recorded_at', { ascending: false }),
        supabase.from('client_checkins').select('*').eq('client_id', client.id).order('week_number', { ascending: false }),
      ])

      setWeightEntries(weights || [])
      setCheckins(cis || [])
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const currentWeight = weightEntries[0]?.weight_kg ?? null
  const startWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 1].weight_kg : null
  const totalChange = currentWeight != null && startWeight != null
    ? (parseFloat(currentWeight) - parseFloat(startWeight)).toFixed(1)
    : null

  // Build strength progress: for each lift name, find earliest and latest entry
  const liftMap = {} // name -> { first: {weight_kg, reps, personalWeek}, latest: ... }
  const sorted = [...checkins].sort((a, b) => a.week_number - b.week_number)
  // Personal week = 1-based position in ascending sorted order
  const weekToPersonal = {}
  sorted.forEach((ci, i) => { weekToPersonal[ci.week_number] = i + 1 })
  sorted.forEach((ci, i) => {
    const pw = i + 1
    ;(ci.lift_results || []).filter(l => l?.name && l.weight_kg != null && l.reps != null).forEach(l => {
      if (!liftMap[l.name]) liftMap[l.name] = { first: null, latest: null }
      if (!liftMap[l.name].first) liftMap[l.name].first = { weight_kg: parseFloat(l.weight_kg), reps: parseInt(l.reps), personalWeek: pw }
      liftMap[l.name].latest = { weight_kg: parseFloat(l.weight_kg), reps: parseInt(l.reps), personalWeek: pw }
    })
  })
  const liftProgress = Object.entries(liftMap)
    .filter(([, v]) => v.first && v.latest)
    .map(([name, { first, latest }]) => {
      const kgIncrease = Math.round((latest.weight_kg - first.weight_kg) * 10) / 10
      const pctIncrease = first.weight_kg > 0 ? Math.round((kgIncrease / first.weight_kg) * 100) : null
      return { name, first, latest, kgIncrease, pctIncrease }
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weight trend and weekly check-in history</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentWeight ?? '—'}
            {currentWeight && <span className="text-sm font-normal text-gray-400 ml-1">kg</span>}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current weight</p>
        </div>
        <div className="card text-center py-4">
          {totalChange !== null ? (
            <p className={`text-2xl font-bold ${parseFloat(totalChange) < 0 ? 'text-green-500' : parseFloat(totalChange) > 0 ? 'text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {parseFloat(totalChange) > 0 ? '+' : ''}{totalChange} kg
            </p>
          ) : (
            <p className="text-2xl font-bold text-gray-300 dark:text-gray-600">—</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total change</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{checkins.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check-ins done</p>
        </div>
      </div>

      {/* Weight chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h2>
        <WeightChart data={weightEntries} />
      </div>

      {/* Strength progress */}
      {liftProgress.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Strength Progress</h2>
          <div className="space-y-3">
            {liftProgress.map(({ name, first, latest, kgIncrease, pctIncrease }) => (
              <div key={name} className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {/* Start */}
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Start · Wk {first.personalWeek}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {first.weight_kg} kg
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums">× {first.reps} reps</p>
                  </div>
                  {/* Now */}
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Now · Wk {latest.personalWeek}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                      {latest.weight_kg} kg
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums">× {latest.reps} reps</p>
                  </div>
                  {/* Increase */}
                  <div className={`p-2.5 rounded-xl ${kgIncrease > 0 ? 'bg-green-50 dark:bg-green-900/20' : kgIncrease < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <p className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wider">Increase</p>
                    <p className={`text-sm font-bold tabular-nums ${kgIncrease > 0 ? 'text-green-600 dark:text-green-400' : kgIncrease < 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                      {kgIncrease > 0 ? '+' : ''}{kgIncrease} kg
                    </p>
                    {pctIncrease !== null && (
                      <p className={`text-xs font-semibold tabular-nums ${kgIncrease > 0 ? 'text-green-500 dark:text-green-400' : kgIncrease < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {pctIncrease > 0 ? '+' : ''}{pctIncrease}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo comparison — first vs most recent, grouped by angle */}
      {checkins.length > 0 && (() => {
        const first = checkins[checkins.length - 1]
        const latest = checkins[0]
        const isComparison = first.id !== latest.id

        const firstPersonalWeek = weekToPersonal[first.week_number] ?? 1
        const latestPersonalWeek = weekToPersonal[latest.week_number] ?? checkins.length

        function PhotoSlot({ photos, pw }) {
          return angle => {
            const url = photos?.[angle]
            return url ? (
              <button onClick={() => setLightbox(url)} className="flex flex-col gap-1 w-full">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity w-full">
                  <img src={url} alt={angle} className="w-full h-full object-cover" />
                </div>
                <p className="text-[10px] text-center text-gray-400">Wk {pw}</p>
              </button>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <div className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center w-full">
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-[10px] text-center text-gray-400">Wk {pw}</p>
              </div>
            )
          }
        }

        const firstSlot = PhotoSlot({ photos: first.progress_photos, pw: firstPersonalWeek })
        const latestSlot = PhotoSlot({ photos: latest.progress_photos, pw: latestPersonalWeek })

        return (
          <div className="card">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Progress Photos</h2>
            {/* 2×2 grid: each cell = one angle pair (start | now) */}
            <div className="grid grid-cols-2 gap-4">
              {PHOTO_ANGLES.map(angle => (
                <div key={angle}>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize mb-1.5">{angle}</p>
                  {isComparison ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {firstSlot(angle)}
                      {latestSlot(angle)}
                    </div>
                  ) : (
                    latestSlot(angle)
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Check-in history */}
      {checkins.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Check-in History</h2>
          {checkins.map((ci, i) => (
            <CheckinCard key={ci.id} ci={ci} weekNum={checkins.length - i} onLightbox={setLightbox} />
          ))}
        </div>
      )}

      {checkins.length === 0 && weightEntries.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">No progress data yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Your weight trend and check-in history will appear here once you start logging.</p>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
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
