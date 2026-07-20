import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function WarnIcon({ className = 'w-4 h-4 text-red-400 flex-shrink-0' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function LineChart({ points, color = '#ec4899' }) {
  if (!points || points.length < 2) {
    return <p className="text-xs text-gray-400 py-6 text-center">Not enough data</p>
  }
  const W = 500, H = 90, px = 8, py = 8
  const vals = points.map(p => p.y)
  const minV = Math.min(...vals), maxV = Math.max(...vals)
  const range = maxV - minV || 0.1
  const tx = i => px + (i / (points.length - 1)) * (W - px * 2)
  const ty = v => py + ((maxV - v) / range) * (H - py * 2)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(p.y).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 90 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${tx(points.length - 1).toFixed(1)},${H} L${tx(0).toFixed(1)},${H} Z`} fill="url(#wg)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={tx(0)} cy={ty(points[0].y)} r="3.5" fill={color} />
      <circle cx={tx(points.length - 1)} cy={ty(points[points.length - 1].y)} r="3.5" fill={color} />
    </svg>
  )
}

function BarChart({ bars }) {
  if (!bars || bars.length === 0) {
    return <p className="text-xs text-gray-400 py-6 text-center">No data</p>
  }
  return (
    <div className="flex items-end gap-0.5" style={{ height: 64 }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex items-end" style={{ height: '100%' }}>
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${(b.y / 5) * 100}%`,
              backgroundColor: b.y < 4 ? '#ef4444' : b.y < 4.5 ? '#f59e0b' : '#22c55e',
              minHeight: 3,
            }}
          />
        </div>
      ))}
    </div>
  )
}

function computeMetrics(clientId, allWeights, allCheckins) {
  const weights = allWeights
    .filter(w => w.client_id === clientId)
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))

  const checkins = allCheckins
    .filter(c => c.client_id === clientId)
    .sort((a, b) => a.week_number - b.week_number)

  const startWeight = weights.length > 0 ? parseFloat(weights[0].weight_kg) : null
  const currentWeight = weights.length > 0 ? parseFloat(weights[weights.length - 1].weight_kg) : null

  let weeksElapsed = null, rateOfLoss = null, lossFlag = false
  if (weights.length >= 2) {
    const ms = new Date(weights[weights.length - 1].recorded_at) - new Date(weights[0].recorded_at)
    weeksElapsed = ms / (7 * 24 * 60 * 60 * 1000)
    if (weeksElapsed >= 2) {
      rateOfLoss = (startWeight - currentWeight) / weeksElapsed
      lossFlag = rateOfLoss < 0.25
    }
  }

  const adherenceVals = checkins.filter(c => c.adherence != null).map(c => c.adherence)
  const avgAdherence = adherenceVals.length > 0
    ? adherenceVals.reduce((s, v) => s + v, 0) / adherenceVals.length
    : null
  const adherenceFlag = avgAdherence != null && avgAdherence < 4

  return { weights, checkins, startWeight, currentWeight, weeksElapsed, rateOfLoss, lossFlag, avgAdherence, adherenceFlag }
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function CoachReports() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [allCheckins, setAllCheckins] = useState([])
  const [allWeights, setAllWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: clientsData }, { data: checkinsData }] = await Promise.all([
        supabase
          .from('clients')
          .select('id, is_active, is_paused, access_expires_at, profiles!clients_profile_id_fkey(full_name)')
          .eq('coach_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('client_checkins')
          .select('client_id, week_number, weight_kg, adherence, energy_level, sleep_quality, submitted_at, updated_at, progress_photos')
          .eq('coach_id', profile.id)
          .order('week_number', { ascending: true }),
      ])

      const clientIds = (clientsData || []).map(c => c.id)
      let weightsData = []

      if (clientIds.length > 0) {
        const { data: wData } = await supabase
          .from('weight_entries')
          .select('client_id, weight_kg, recorded_at')
          .in('client_id', clientIds)
          .order('recorded_at', { ascending: true })
        weightsData = wData || []
      }

      setClients(clientsData || [])
      setAllCheckins(checkinsData || [])
      setAllWeights(weightsData)
      setLoading(false)
    }
    load()
  }, [profile.id])

  const now = new Date()

  function clientStatus(c) {
    const exp = c.access_expires_at ? new Date(c.access_expires_at) : null
    if (c.is_paused) return { label: 'Paused', cls: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' }
    if (exp && exp < now) return { label: 'Expired', cls: 'text-red-500 bg-red-50 dark:bg-red-900/20' }
    if (c.is_active) return { label: 'Active', cls: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
    return { label: 'Inactive', cls: 'text-gray-400 bg-gray-50 dark:bg-gray-800' }
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // ── Detail view ─────────────────────────────────────────────────────────────
  if (selected) {
    const client = clients.find(c => c.id === selected)
    const { weights, checkins, startWeight, currentWeight, weeksElapsed, rateOfLoss, lossFlag, avgAdherence, adherenceFlag } =
      computeMetrics(selected, allWeights, allCheckins)
    const { label: statusLabel, cls: statusCls } = clientStatus(client)
    const totalLost = startWeight != null && currentWeight != null ? startWeight - currentWeight : null
    const weightPoints = weights.map(w => ({ y: parseFloat(w.weight_kg) }))
    const adherenceBars = checkins.filter(c => c.adherence != null).map(c => ({ y: c.adherence }))

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Reports
          </button>
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.profiles?.full_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>{statusLabel}</span>
          </div>
        </div>

        {/* Flag banners */}
        {(lossFlag || adherenceFlag) && (
          <div className="space-y-2">
            {lossFlag && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <WarnIcon />
                <p className="text-sm text-red-700 dark:text-red-400">
                  Loss rate below target — averaging {rateOfLoss != null ? rateOfLoss.toFixed(2) : '—'} kg/wk vs 0.25 kg/wk goal
                </p>
              </div>
            )}
            {adherenceFlag && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                <WarnIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Average adherence below 4 — {avgAdherence != null ? avgAdherence.toFixed(1) : '—'}/5
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            {
              label: 'Weeks',
              value: weeksElapsed != null ? Math.round(weeksElapsed) : '—',
              color: 'text-gray-900 dark:text-white',
            },
            {
              label: 'Start weight',
              value: startWeight != null ? `${startWeight} kg` : '—',
              color: 'text-gray-900 dark:text-white',
            },
            {
              label: 'Current weight',
              value: currentWeight != null ? `${currentWeight} kg` : '—',
              color: 'text-gray-900 dark:text-white',
            },
            {
              label: 'Total lost',
              value: totalLost != null ? `${Math.abs(totalLost).toFixed(1)} kg` : '—',
              color: totalLost == null ? 'text-gray-900 dark:text-white' : totalLost > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500',
            },
            {
              label: 'Rate / wk',
              value: rateOfLoss != null ? `${rateOfLoss.toFixed(2)} kg` : '—',
              color: lossFlag ? 'text-red-500' : rateOfLoss != null ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white',
              flag: lossFlag,
            },
            {
              label: 'Avg adherence',
              value: avgAdherence != null ? `${avgAdherence.toFixed(1)}/5` : '—',
              color: adherenceFlag ? 'text-red-500' : avgAdherence != null ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white',
              flag: adherenceFlag,
            },
          ].map(s => (
            <div key={s.label} className="card py-3 text-center">
              <div className="flex items-center justify-center gap-1">
                {s.flag && <WarnIcon className="w-3.5 h-3.5 text-red-400" />}
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weight chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Weight over time</h2>
            {weights.length >= 2 && (
              <span className="text-xs text-gray-400">
                {fmtDate(weights[0].recorded_at)} – {fmtDate(weights[weights.length - 1].recorded_at)}
              </span>
            )}
          </div>
          <LineChart points={weightPoints} color="#ec4899" />
          {weights.length >= 2 && (
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{startWeight} kg</span>
              <span>{currentWeight} kg</span>
            </div>
          )}
        </div>

        {/* Adherence chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Adherence over time</h2>
            {avgAdherence != null && (
              <span className={`text-sm font-semibold ${adherenceFlag ? 'text-red-500' : 'text-green-500'}`}>
                Avg {avgAdherence.toFixed(1)}/5
              </span>
            )}
          </div>
          <BarChart bars={adherenceBars} />
          {checkins.length >= 2 && (
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>Wk {checkins[0].week_number}</span>
              <span>Wk {checkins[checkins.length - 1].week_number}</span>
            </div>
          )}
        </div>

        {/* Check-in table */}
        {checkins.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Check-in history</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800 text-xs text-gray-400 font-medium">
                    <th className="text-left px-4 py-2">Week</th>
                    <th className="text-right px-4 py-2">Weight</th>
                    <th className="text-right px-4 py-2">Adherence</th>
                    <th className="text-right px-4 py-2">Energy</th>
                    <th className="text-right px-4 py-2">Sleep</th>
                    <th className="text-right px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {[...checkins].reverse().map(ci => (
                    <tr key={ci.week_number} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">Wk {ci.week_number}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                        {ci.weight_kg != null ? `${ci.weight_kg} kg` : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-medium ${ci.adherence != null && ci.adherence < 4 ? 'text-red-500' : 'text-green-500'}`}>
                        {ci.adherence != null ? `${ci.adherence}/5` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                        {ci.energy_level != null ? `${ci.energy_level}/5` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-300">
                        {ci.sleep_quality != null ? `${ci.sleep_quality}/5` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                        {fmtShort(ci.updated_at || ci.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress photos — first vs current per angle */}
        {(() => {
          const ANGLES = ['front', 'back', 'left', 'right']
          const checkinsWithPhotos = checkins.filter(
            c => c.progress_photos && Object.values(c.progress_photos).some(Boolean)
          )
          const firstP = checkinsWithPhotos[0] ?? null
          const latestP = checkinsWithPhotos[checkinsWithPhotos.length - 1] ?? null
          const isComparison = firstP && latestP && firstP.week_number !== latestP.week_number
          const activeAngles = ANGLES.filter(
            a => firstP?.progress_photos?.[a] || latestP?.progress_photos?.[a]
          )
          const hasAny = activeAngles.length > 0

          return (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Progress photos</h2>
                {isComparison && (
                  <span className="text-xs text-gray-400">Wk {firstP.week_number} → Wk {latestP.week_number}</span>
                )}
              </div>
              {!hasAny ? (
                <p className="text-sm text-gray-400">No progress photos uploaded yet.</p>
              ) : (
                <div className="space-y-5">
                  {activeAngles.map(angle => {
                    const firstUrl = firstP?.progress_photos?.[angle]
                    const latestUrl = latestP?.progress_photos?.[angle]
                    const ANGLE_LABELS = { front: 'Front', back: 'Back', left: 'Left side', right: 'Right side' }
                    return (
                      <div key={angle}>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                          {ANGLE_LABELS[angle] || angle}
                        </p>
                        <div className={`grid gap-3 ${isComparison ? 'grid-cols-2' : 'grid-cols-1 max-w-[200px]'}`}>
                          {(isComparison ? [
                            { url: firstUrl, label: `First · Wk ${firstP.week_number}` },
                            { url: latestUrl, label: `Now · Wk ${latestP.week_number}` },
                          ] : [
                            { url: latestUrl || firstUrl, label: `Wk ${(latestP ?? firstP).week_number}` },
                          ]).map(col => (
                            <div key={col.label} className="space-y-1">
                              {col.url ? (
                                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                  <img src={col.url} alt={col.label} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                              )}
                              <p className="text-xs text-center text-gray-400 dark:text-gray-500">{col.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}
      </div>
    )
  }

  // ── List view ───────────────────────────────────────────────────────────────
  const activeCount = clients.filter(c => clientStatus(c).label === 'Active').length
  const flaggedCount = clients.filter(c => {
    const { lossFlag, adherenceFlag } = computeMetrics(c.id, allWeights, allCheckins)
    return lossFlag || adherenceFlag
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Client progress and compliance overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total clients</p>
        </div>
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active</p>
        </div>
        <div className="card text-center py-5">
          <p className={`text-3xl font-bold ${flaggedCount > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            {flaggedCount}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Flagged</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Client Overview</h2>
          <p className="text-xs text-gray-400">{activeCount} active</p>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No clients yet.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_150px_120px_130px_130px] gap-3 px-4 py-2 border-b border-gray-50 dark:border-gray-800">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Client</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Start → Current</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Lost</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Rate / wk</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Avg adherence</span>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {clients.map(client => {
                const { label: statusLabel, cls: statusCls } = clientStatus(client)
                const { startWeight, currentWeight, weeksElapsed, rateOfLoss, lossFlag, avgAdherence, adherenceFlag } =
                  computeMetrics(client.id, allWeights, allCheckins)
                const totalLost = startWeight != null && currentWeight != null ? startWeight - currentWeight : null

                return (
                  <button
                    key={client.id}
                    onClick={() => setSelected(client.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50/40 dark:hover:bg-pink-900/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                        {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {client.profiles?.full_name || '—'}
                        </span>
                        {(lossFlag || adherenceFlag) && <WarnIcon />}
                      </div>
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Start → Current */}
                    <div className="text-right hidden lg:block w-36 flex-shrink-0">
                      {startWeight != null ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {startWeight} → {currentWeight} kg
                        </p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">No data</p>
                      )}
                      {weeksElapsed != null && (
                        <p className="text-xs text-gray-400">{Math.round(weeksElapsed)} wks</p>
                      )}
                    </div>

                    {/* Total lost */}
                    <div className="text-right hidden lg:block w-28 flex-shrink-0">
                      {totalLost != null ? (
                        <p className={`text-sm font-semibold ${totalLost > 0 ? 'text-green-600 dark:text-green-400' : totalLost < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                          {totalLost > 0 ? '' : '+'}{totalLost > 0 ? totalLost.toFixed(1) : Math.abs(totalLost).toFixed(1)} kg
                          {totalLost < 0 ? ' ↑' : ' ↓'}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    {/* Rate */}
                    <div className="text-right hidden lg:block w-32 flex-shrink-0">
                      {rateOfLoss != null ? (
                        <div className="flex items-center justify-end gap-1">
                          {lossFlag && <WarnIcon />}
                          <p className={`text-sm font-semibold ${lossFlag ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                            {rateOfLoss.toFixed(2)} kg/wk
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    {/* Avg adherence */}
                    <div className="text-right hidden lg:block w-32 flex-shrink-0">
                      {avgAdherence != null ? (
                        <div className="flex items-center justify-end gap-1">
                          {adherenceFlag && <WarnIcon />}
                          <p className={`text-sm font-semibold ${adherenceFlag ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                            {avgAdherence.toFixed(1)}/5
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
