import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'
import { useSignedProgressPhotos, useSignedProgressPhotosForCheckins } from '../../lib/progressPhotos'
import TargetDateBanner from '../../components/TargetDateBanner'
import StrengthProgress from '../../components/StrengthProgress'
import { computeLiftProgress } from '../../lib/liftProgress'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

const RATING_LABELS = {
  energy_level:   ['', 'Very low', 'Low', 'Moderate', 'High', 'Very high'],
  sleep_quality:  ['', 'Very poor', 'Poor', 'OK', 'Good', 'Excellent'],
  food_adherence: ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
  gym_adherence:  ['', 'Off track', 'Mostly off', 'Moderate', 'Mostly on', 'On track'],
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
  const photoUrls = useSignedProgressPhotos(ci.progress_photos)
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
              {ci.food_adherence != null && <RatingDot value={ci.food_adherence} />}
              {ci.gym_adherence != null && <RatingDot value={ci.gym_adherence} />}
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
          {(ci.energy_level != null || ci.sleep_quality != null || ci.food_adherence != null || ci.gym_adherence != null) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'energy_level', label: 'Energy' },
                { key: 'sleep_quality', label: 'Sleep' },
                { key: 'food_adherence', label: 'Food' },
                { key: 'gym_adherence', label: 'Gym' },
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
                    onClick={() => photoUrls[angle] && onLightbox(photoUrls[angle])}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                  >
                    {photoUrls[angle] && <img src={photoUrls[angle]} alt={angle} className="w-full h-full object-cover" />}
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
  const photoUrlsByCheckin = useSignedProgressPhotosForCheckins(checkins)

  useEffect(() => {
    async function load() {
      const { data: client } = await supabase
        .from('clients')
        .select('id, target_date, target_event_name')
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

  // Personal week = 1-based position in ascending week_number order — used by the photo
  // comparison section below.
  const sorted = [...checkins].sort((a, b) => a.week_number - b.week_number)
  const weekToPersonal = {}
  sorted.forEach((ci, i) => { weekToPersonal[ci.week_number] = i + 1 })
  const liftProgress = computeLiftProgress(checkins)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Progress</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your weight trend and weekly check-in history</p>
      </div>

      <TargetDateBanner targetDate={clientData?.target_date} targetEventName={clientData?.target_event_name} />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <StrengthProgress liftProgress={liftProgress} />

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

        const firstSlot = PhotoSlot({ photos: photoUrlsByCheckin[first.id], pw: firstPersonalWeek })
        const latestSlot = PhotoSlot({ photos: photoUrlsByCheckin[latest.id], pw: latestPersonalWeek })

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
