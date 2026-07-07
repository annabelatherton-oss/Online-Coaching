import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import WeightChart from '../../components/WeightChart'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

function RatingDot({ value }) {
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500']
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[value] || 'bg-gray-200'}`} />
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

  const latestCheckin = checkins[0]
  const currentWeight = weightEntries[0]?.weight_kg ?? null
  const startWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 1].weight_kg : null
  const totalChange = currentWeight != null && startWeight != null
    ? (parseFloat(currentWeight) - parseFloat(startWeight)).toFixed(1)
    : null

  const checkinsWithPhotos = checkins.filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
  const latestWithPhotos = checkinsWithPhotos[0]
  const firstWithPhotos = checkinsWithPhotos[checkinsWithPhotos.length - 1]
  const showComparison = checkinsWithPhotos.length >= 2 && latestWithPhotos?.id !== firstWithPhotos?.id
  const comparisonAngles = showComparison
    ? PHOTO_ANGLES.filter(a => firstWithPhotos.progress_photos?.[a] && latestWithPhotos.progress_photos?.[a])
    : []
  const latestOnlyAngles = !showComparison && latestWithPhotos
    ? PHOTO_ANGLES.filter(a => latestWithPhotos.progress_photos?.[a])
    : []

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

      {/* Check-in history table */}
      {checkins.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Check-in History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Week', 'Weight', 'Energy', 'Sleep', 'Adherence'].map(h => (
                    <th key={h} className="text-left pb-2.5 text-xs text-gray-400 uppercase tracking-wider font-medium pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {checkins.slice(0, 12).map(ci => (
                  <tr key={ci.id}>
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">Week {ci.week_number}</td>
                    <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 tabular-nums">
                      {ci.weight_kg != null ? `${ci.weight_kg} kg` : '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      {ci.energy_level != null
                        ? <span className="inline-flex items-center gap-1.5"><RatingDot value={ci.energy_level} /><span className="text-gray-600 dark:text-gray-400">{ci.energy_level}/5</span></span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {ci.sleep_quality != null
                        ? <span className="inline-flex items-center gap-1.5"><RatingDot value={ci.sleep_quality} /><span className="text-gray-600 dark:text-gray-400">{ci.sleep_quality}/5</span></span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="py-2.5">
                      {ci.adherence != null
                        ? <span className="inline-flex items-center gap-1.5"><RatingDot value={ci.adherence} /><span className="text-gray-600 dark:text-gray-400">{ci.adherence}/5</span></span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress photos — comparison if ≥2 check-ins with photos, otherwise latest only */}
      {showComparison && comparisonAngles.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Progress Comparison</h2>
            <span className="text-xs text-gray-400">Week {firstWithPhotos.week_number} → Week {latestWithPhotos.week_number}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Start — Week {firstWithPhotos.week_number}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Now — Week {latestWithPhotos.week_number}
            </p>
          </div>

          <div className="space-y-4">
            {comparisonAngles.map(angle => (
              <div key={angle}>
                <p className="text-xs text-gray-400 capitalize mb-2">{angle}</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setLightbox(firstWithPhotos.progress_photos[angle])}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                  >
                    <img src={firstWithPhotos.progress_photos[angle]} alt={`${angle} start`} className="w-full h-full object-cover" />
                  </button>
                  <button
                    onClick={() => setLightbox(latestWithPhotos.progress_photos[angle])}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity"
                  >
                    <img src={latestWithPhotos.progress_photos[angle]} alt={`${angle} now`} className="w-full h-full object-cover" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showComparison && latestOnlyAngles.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            Progress Photos
            <span className="ml-2 text-sm font-normal text-gray-400">Week {latestWithPhotos.week_number}</span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {latestOnlyAngles.map(angle => (
              <button
                key={angle}
                onClick={() => setLightbox(latestWithPhotos.progress_photos[angle])}
                className="flex flex-col gap-1 text-left"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity">
                  <img src={latestWithPhotos.progress_photos[angle]} alt={angle} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-400 capitalize text-center">{angle}</p>
              </button>
            ))}
          </div>
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
