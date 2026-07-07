import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

const PHOTO_ANGLES = ['front', 'back', 'left', 'right']

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ratingColor(v) {
  if (!v) return 'text-gray-400'
  if (v >= 4) return 'text-green-600 dark:text-green-400'
  if (v >= 3) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function Avatar({ name, size = 9 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-semibold text-brand-700 dark:text-brand-300 flex-shrink-0 text-sm`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function weightDelta(a, b) {
  if (a?.weight_kg == null || b?.weight_kg == null) return null
  return Math.round((parseFloat(a.weight_kg) - parseFloat(b.weight_kg)) * 10) / 10
}

function liftDelta(currLift, prevCheckin) {
  const p = prevCheckin?.lift_results?.find(l => l?.name === currLift?.name)
  if (!p || currLift?.weight_kg == null || p?.weight_kg == null) return null
  return {
    kg: Math.round((parseFloat(currLift.weight_kg) - parseFloat(p.weight_kg)) * 10) / 10,
    reps: (parseInt(currLift.reps) || 0) - (parseInt(p.reps) || 0),
  }
}

function DeltaTag({ delta, invertColors = false, suffix = ' kg' }) {
  if (delta === null || delta === undefined) return null
  const up = delta > 0
  const down = delta < 0
  const green = invertColors ? down : up
  const red = invertColors ? up : down
  const cls = green ? 'text-green-600 dark:text-green-400' : red ? 'text-red-500 dark:text-red-400' : 'text-gray-400'
  const arrow = up ? '↑ ' : down ? '↓ ' : ''
  return <span className={`text-xs font-semibold ${cls}`}>{arrow}{up ? '+' : ''}{delta}{suffix}</span>
}

// ── Client detail view ────────────────────────────────────────────────────────
function ClientDetail({ client, checkins: rawCheckins, onBack, onResponded }) {
  const [checkins, setCheckins] = useState(rawCheckins)
  const [lightbox, setLightbox] = useState(null)
  const [responding, setResponding] = useState(null) // checkin id
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)

  // desc order (most recent first)
  const sorted = [...checkins].sort((a, b) => b.week_number - a.week_number)
  const current = sorted[0]
  const first = sorted[sorted.length - 1]
  const prev = sorted[1] || null

  // ascending for history table
  const asc = [...sorted].reverse()

  const wDeltaPrev = weightDelta(current, prev)
  const wDeltaStart = current && first && current.id !== first.id ? weightDelta(current, first) : null

  const withPhotos = sorted.filter(c => c.progress_photos && Object.values(c.progress_photos).some(Boolean))
  const newestP = withPhotos[0]
  const prevP = withPhotos[1]
  const firstP = withPhotos[withPhotos.length - 1]
  const compAngles = PHOTO_ANGLES.filter(a => newestP?.progress_photos?.[a])
  const showComparison = newestP && firstP && newestP.id !== firstP.id && compAngles.length > 0

  function openRespond(c) {
    setResponseText(c.coach_response || '')
    setResponding(c.id)
  }

  async function sendResponse(checkinId) {
    setSaving(true)
    const text = responseText.trim()
    await supabase
      .from('client_checkins')
      .update({ coach_response: text, coach_responded_at: new Date().toISOString() })
      .eq('id', checkinId)
    setSaving(false)
    setResponding(null)
    const updated = checkins.map(c => c.id === checkinId ? { ...c, coach_response: text, coach_responded_at: new Date().toISOString() } : c)
    setCheckins(updated)
    onResponded(checkinId, text)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            <button onClick={() => setLightbox(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={client?.full_name} />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client?.full_name}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sorted.length} check-in{sorted.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Current week summary */}
      {current && (
        <div className="card space-y-4 border-brand-200 dark:border-brand-800">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">This week — Week {current.week_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(current.updated_at || current.submitted_at)}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {wDeltaPrev !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaPrev < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaPrev > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaPrev > 0 ? '↑ +' : wDeltaPrev < 0 ? '↓ ' : ''}{wDeltaPrev} kg vs last week
                </span>
              )}
              {wDeltaStart !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDeltaStart < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDeltaStart > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDeltaStart > 0 ? '↑ +' : wDeltaStart < 0 ? '↓ ' : ''}{wDeltaStart} kg since start
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {current.weight_kg != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{current.weight_kg} <span className="text-sm font-normal text-gray-500">kg</span></p>
              </div>
            )}
            {current.energy_level != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Energy</p>
                <p className={`text-lg font-bold ${ratingColor(current.energy_level)}`}>{current.energy_level}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
            {current.sleep_quality != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sleep</p>
                <p className={`text-lg font-bold ${ratingColor(current.sleep_quality)}`}>{current.sleep_quality}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
            {current.adherence != null && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Adherence</p>
                <p className={`text-lg font-bold ${ratingColor(current.adherence)}`}>{current.adherence}<span className="text-xs font-normal text-gray-400">/5</span></p>
              </div>
            )}
          </div>

          {/* Current week lifts vs prev and vs start */}
          {current.lift_results?.filter(l => l?.name).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Lifts</p>
              <div className="grid grid-cols-3 gap-3">
                {current.lift_results.filter(l => l?.name).map((lift, i) => {
                  const dPrev = liftDelta(lift, prev)
                  const dStart = first && first.id !== current.id ? liftDelta(lift, first) : null
                  return (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{lift.name}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span>
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {dPrev !== null && (dPrev.kg !== 0 || dPrev.reps !== 0) && (
                          <div className="flex gap-1.5">
                            {dPrev.kg !== 0 && <DeltaTag delta={dPrev.kg} />}
                            {dPrev.reps !== 0 && <DeltaTag delta={dPrev.reps} suffix=" reps" />}
                            <span className="text-xs text-gray-400">vs last wk</span>
                          </div>
                        )}
                        {dStart !== null && (dStart.kg !== 0 || dStart.reps !== 0) && (
                          <div className="flex gap-1.5">
                            {dStart.kg !== 0 && <DeltaTag delta={dStart.kg} />}
                            {dStart.reps !== 0 && <DeltaTag delta={dStart.reps} suffix=" reps" />}
                            <span className="text-xs text-gray-400">vs start</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Current week photos */}
          {current.progress_photos && Object.values(current.progress_photos).some(Boolean) && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">This week's photos</p>
              <div className="grid grid-cols-4 gap-2">
                {PHOTO_ANGLES.filter(a => current.progress_photos[a]).map(angle => (
                  <div key={angle} className="space-y-1">
                    <button onClick={() => setLightbox(current.progress_photos[angle])} className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block">
                      <img src={current.progress_photos[angle]} alt={angle} className="w-full h-full object-cover" />
                    </button>
                    <p className="text-xs text-center text-gray-400 capitalize">{angle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.notes && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Client note</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{current.notes}"</p>
            </div>
          )}

          {/* Respond to current week */}
          {current.coach_response && responding !== current.id && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Your response</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{current.coach_response}</p>
            </div>
          )}
          {responding === current.id ? (
            <div className="space-y-2">
              <textarea autoFocus className="input w-full text-sm resize-none" rows={3} placeholder="Write your response…" value={responseText} onChange={e => setResponseText(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => sendResponse(current.id)} disabled={saving || !responseText.trim()} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Sending…' : 'Send'}</button>
                <button onClick={() => setResponding(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => openRespond(current)} className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
              {current.coach_response ? 'Edit response' : 'Respond →'}
            </button>
          )}
        </div>
      )}

      {/* Photo comparison: start / last week / now */}
      {showComparison && (
        <div className="card space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Photo Comparison</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Start (Wk {firstP.week_number})
              {prevP && prevP.id !== firstP.id && prevP.id !== newestP.id && ` · Last week (Wk ${prevP.week_number})`}
              {` · Now (Wk ${newestP.week_number})`}
            </p>
          </div>
          {compAngles.map(angle => {
            const cols = [
              { label: `Start · Wk ${firstP.week_number}`, url: firstP.progress_photos[angle] },
              prevP && prevP.id !== firstP.id && prevP.id !== newestP.id && prevP.progress_photos?.[angle]
                ? { label: `Last week · Wk ${prevP.week_number}`, url: prevP.progress_photos[angle] }
                : null,
              { label: `Now · Wk ${newestP.week_number}`, url: newestP.progress_photos[angle] },
            ].filter(Boolean)
            return (
              <div key={angle}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 capitalize">{angle}</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
                  {cols.map(col => (
                    <div key={col.label} className="space-y-1">
                      <button onClick={() => setLightbox(col.url)} className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity block">
                        <img src={col.url} alt={col.label} className="w-full h-full object-cover" />
                      </button>
                      <p className="text-xs text-center text-gray-400">{col.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Progress history table */}
      {sorted.length > 1 && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Progress History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Week', 'Date', 'Weight', 'Change', 'Energy', 'Sleep', 'Adherence'].map(h => (
                    <th key={h} className="text-left pb-2.5 pr-4 text-xs text-gray-400 uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {asc.map((c, i) => {
                  const p = asc[i - 1] || null
                  const delta = weightDelta(c, p)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">Wk {c.week_number}</td>
                      <td className="py-2.5 pr-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.updated_at || c.submitted_at)}</td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 dark:text-white tabular-nums">{c.weight_kg != null ? `${c.weight_kg} kg` : '—'}</td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {delta !== null
                          ? <span className={`font-semibold text-xs ${delta < 0 ? 'text-green-600 dark:text-green-400' : delta > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>{delta > 0 ? '+' : ''}{delta} kg</span>
                          : <span className="text-gray-300 dark:text-gray-700">—</span>}
                      </td>
                      <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(c.energy_level)}`}>{c.energy_level != null ? `${c.energy_level}/5` : '—'}</span></td>
                      <td className="py-2.5 pr-4"><span className={`text-xs font-semibold ${ratingColor(c.sleep_quality)}`}>{c.sleep_quality != null ? `${c.sleep_quality}/5` : '—'}</span></td>
                      <td className="py-2.5"><span className={`text-xs font-semibold ${ratingColor(c.adherence)}`}>{c.adherence != null ? `${c.adherence}/5` : '—'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous week cards */}
      {sorted.slice(1).map((c, i) => {
        const p = sorted[i + 2] || null
        const wDelta = weightDelta(c, p)
        return (
          <div key={c.id} className="card space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Week {c.week_number}</h3>
                <p className="text-xs text-gray-400">{fmtDate(c.updated_at || c.submitted_at)}</p>
              </div>
              {wDelta !== null && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${wDelta < 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : wDelta > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {wDelta > 0 ? '↑ +' : wDelta < 0 ? '↓ ' : ''}{wDelta} kg
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {c.weight_kg != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Weight</p><p className="font-semibold text-gray-900 dark:text-white text-sm">{c.weight_kg} kg</p></div>}
              {c.energy_level != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Energy</p><p className={`font-semibold text-sm ${ratingColor(c.energy_level)}`}>{c.energy_level}/5</p></div>}
              {c.sleep_quality != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Sleep</p><p className={`font-semibold text-sm ${ratingColor(c.sleep_quality)}`}>{c.sleep_quality}/5</p></div>}
              {c.adherence != null && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800"><p className="text-xs text-gray-400 mb-0.5">Adherence</p><p className={`font-semibold text-sm ${ratingColor(c.adherence)}`}>{c.adherence}/5</p></div>}
            </div>

            {c.lift_results?.filter(l => l?.name).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {c.lift_results.filter(l => l?.name).map((lift, li) => {
                  const d = liftDelta(lift, p)
                  return (
                    <div key={li} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                      <p className="text-xs text-gray-400 mb-0.5 truncate">{lift.name}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{lift.weight_kg} kg <span className="text-xs font-normal text-gray-400">× {lift.reps}</span></p>
                      {d !== null && (d.kg !== 0 || d.reps !== 0) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {d.kg !== 0 && <DeltaTag delta={d.kg} />}
                          {d.reps !== 0 && <DeltaTag delta={d.reps} suffix=" reps" />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {c.progress_photos && Object.values(c.progress_photos).some(Boolean) && (
              <div className="flex gap-2">
                {PHOTO_ANGLES.filter(a => c.progress_photos[a]).map(angle => (
                  <button key={angle} onClick={() => setLightbox(c.progress_photos[angle])} className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 hover:opacity-90">
                    <img src={c.progress_photos[angle]} alt={angle} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {c.notes && <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{c.notes}"</p>}

            {c.coach_response && responding !== c.id && (
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Your response</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{c.coach_response}</p>
              </div>
            )}
            {responding === c.id ? (
              <div className="space-y-2">
                <textarea autoFocus className="input w-full text-sm resize-none" rows={3} value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Write your response…" />
                <div className="flex gap-2">
                  <button onClick={() => sendResponse(c.id)} disabled={saving || !responseText.trim()} className="btn-primary py-1.5 px-4 text-sm">{saving ? 'Sending…' : 'Send'}</button>
                  <button onClick={() => setResponding(null)} className="btn-secondary py-1.5 px-3 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => openRespond(c)} className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium">
                {c.coach_response ? 'Edit response' : 'Respond →'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CoachCheckins() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState(null)

  async function load() {
    const [{ data: clientData }, { data: checkinData }] = await Promise.all([
      supabase.from('clients').select('id, collect_measurements, profiles!clients_profile_id_fkey(full_name)').eq('coach_id', profile.id),
      supabase.from('client_checkins').select('*').eq('coach_id', profile.id).order('week_number', { ascending: false }),
    ])
    setClients((clientData || []).map(c => ({ ...c, full_name: c.profiles?.full_name })))
    setCheckins(checkinData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleResponded(id, text) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, coach_response: text } : c))
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  // If a client is selected, show detail view
  if (selectedClientId) {
    const client = clients.find(c => c.id === selectedClientId)
    const clientCheckins = checkins.filter(c => c.client_id === selectedClientId)
    return (
      <ClientDetail
        client={client}
        checkins={clientCheckins}
        onBack={() => setSelectedClientId(null)}
        onResponded={handleResponded}
      />
    )
  }

  // Latest check-in per client
  const latestByClient = {}
  checkins.forEach(c => { if (!latestByClient[c.client_id]) latestByClient[c.client_id] = c })

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

  function clientStatus(client) {
    const latest = latestByClient[client.id]
    if (!latest) return 'missing'
    if (new Date(latest.updated_at || latest.submitted_at || 0) < eightDaysAgo) return 'missing'
    if (!latest.coach_response) return 'needs-response'
    return 'ok'
  }

  const needsResponse = clients.filter(c => clientStatus(c) === 'needs-response')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const missing = clients.filter(c => clientStatus(c) === 'missing')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
  const upToDate = clients.filter(c => clientStatus(c) === 'ok')
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  function ClientRow({ client }) {
    const latest = latestByClient[client.id]
    const status = clientStatus(client)
    return (
      <button
        onClick={() => setSelectedClientId(client.id)}
        className="w-full flex items-center gap-4 py-3.5 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left rounded-xl group"
      >
        <Avatar name={client.full_name} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
            {client.full_name || 'Unnamed client'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {latest ? `Last check-in: Week ${latest.week_number} · ${fmtDate(latest.updated_at || latest.submitted_at)}` : 'No check-ins yet'}
          </p>
        </div>
        {status === 'needs-response' && (
          <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            Respond
          </span>
        )}
        {status === 'missing' && (
          <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
            Overdue
          </span>
        )}
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-ins</h1>
        <div className="flex gap-4 mt-1.5 flex-wrap">
          {needsResponse.length > 0 && <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">{needsResponse.length} to respond to</span>}
          {missing.length > 0 && <span className="text-sm text-red-500 dark:text-red-400 font-medium">{missing.length} overdue</span>}
        </div>
      </div>

      {clients.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">No clients yet.</p>
        </div>
      )}

      {(needsResponse.length > 0 || missing.length > 0) && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          {needsResponse.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide px-4 pt-3.5 pb-2">Needs response</p>
              {needsResponse.map(c => <ClientRow key={c.id} client={c} />)}
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide px-4 pt-3.5 pb-2">Overdue</p>
              {missing.map(c => <ClientRow key={c.id} client={c} />)}
            </div>
          )}
        </div>
      )}

      {upToDate.length > 0 && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 p-0 overflow-hidden">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3.5 pb-2">All clients</p>
          {upToDate.map(c => <ClientRow key={c.id} client={c} />)}
        </div>
      )}

      {needsResponse.length === 0 && missing.length === 0 && upToDate.length > 0 && null}
    </div>
  )
}
