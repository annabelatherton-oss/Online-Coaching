import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function ratingColor(v) {
  if (!v) return 'text-gray-400'
  if (v >= 4) return 'text-green-600 dark:text-green-400'
  if (v >= 3) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function fmtDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Avatar({ name, size = 9 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-300 flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function CheckinCard({ checkin, client, onResponded }) {
  const [responding, setResponding] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [saving, setSaving] = useState(false)
  const photos = checkin.progress_photos || {}
  const photoAngles = ['front', 'back', 'left', 'right'].filter(k => photos[k])

  function openRespond() {
    setResponseText(checkin.coach_response || '')
    setResponding(true)
  }

  async function sendResponse() {
    if (!responseText.trim()) return
    setSaving(true)
    await supabase
      .from('client_checkins')
      .update({ coach_response: responseText.trim(), coach_responded_at: new Date().toISOString() })
      .eq('id', checkin.id)
    setSaving(false)
    setResponding(false)
    onResponded(checkin.id, responseText.trim())
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={client?.full_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/coach/clients/${checkin.client_id}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
            >
              {client?.full_name || 'Unknown client'}
            </Link>
            {!checkin.coach_response && (
              <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full px-2 py-0.5 font-medium">
                Needs response
              </span>
            )}
            {checkin.coach_response && (
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5 font-medium">
                Responded
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Week {checkin.week_number} · {fmtDate(checkin.updated_at || checkin.submitted_at)}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {checkin.weight_kg && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Weight </span>
            <span className="font-semibold text-gray-900 dark:text-white">{checkin.weight_kg} kg</span>
          </div>
        )}
        {checkin.energy_level && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Energy </span>
            <span className={`font-semibold ${ratingColor(checkin.energy_level)}`}>{checkin.energy_level}/5</span>
          </div>
        )}
        {checkin.sleep_quality && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Sleep </span>
            <span className={`font-semibold ${ratingColor(checkin.sleep_quality)}`}>{checkin.sleep_quality}/5</span>
          </div>
        )}
        {checkin.adherence && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Adherence </span>
            <span className={`font-semibold ${ratingColor(checkin.adherence)}`}>{checkin.adherence}/5</span>
          </div>
        )}
        {checkin.waist_cm && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Waist </span>
            <span className="font-semibold text-gray-900 dark:text-white">{checkin.waist_cm} cm</span>
          </div>
        )}
        {checkin.hips_cm && (
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Hips </span>
            <span className="font-semibold text-gray-900 dark:text-white">{checkin.hips_cm} cm</span>
          </div>
        )}
      </div>

      {/* Lift results */}
      {checkin.lift_results?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {checkin.lift_results.filter(l => l?.name).map((lift, i) => (
            <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1">
              {lift.name}: <span className="font-medium">{lift.weight_kg} kg × {lift.reps}</span>
            </span>
          ))}
        </div>
      )}

      {/* Photos */}
      {photoAngles.length > 0 && (
        <div className="flex gap-2">
          {photoAngles.map(angle => (
            <a key={angle} href={photos[angle]} target="_blank" rel="noreferrer" className="group relative">
              <img
                src={photos[angle]}
                alt={angle}
                className="w-16 h-16 object-cover rounded-xl group-hover:opacity-90 transition-opacity"
              />
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-white font-medium capitalize opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
                {angle}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Client notes */}
      {checkin.notes && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Client note</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{checkin.notes}"</p>
        </div>
      )}

      {/* Existing coach response */}
      {checkin.coach_response && !responding && (
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-1">Your response</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{checkin.coach_response}</p>
        </div>
      )}

      {/* Respond area */}
      {responding ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            className="input w-full text-sm resize-none"
            rows={3}
            placeholder="Write your response to the client…"
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={sendResponse}
              disabled={saving || !responseText.trim()}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              {saving ? 'Sending…' : 'Send'}
            </button>
            <button onClick={() => setResponding(false)} className="btn-secondary py-1.5 px-3 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={openRespond}
          className="text-sm text-brand-500 hover:text-brand-700 dark:hover:text-brand-400 font-medium"
        >
          {checkin.coach_response ? 'Edit response' : 'Respond →'}
        </button>
      )}
    </div>
  )
}

export default function CoachCheckins() {
  const { profile } = useAuth()
  const [checkins, setCheckins] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: clientData }, { data: checkinData }] = await Promise.all([
      supabase.from('clients').select('id, full_name, email').eq('coach_id', profile.id),
      supabase
        .from('client_checkins')
        .select('*')
        .eq('coach_id', profile.id)
        .order('week_number', { ascending: false })
        .order('updated_at', { ascending: false }),
    ])
    setClients(clientData || [])
    setCheckins(checkinData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleResponded(id, text) {
    setCheckins(prev =>
      prev.map(c => c.id === id ? { ...c, coach_response: text, coach_responded_at: new Date().toISOString() } : c)
    )
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]))

  // Latest check-in per client (for "missing" detection)
  const latestByClient = {}
  checkins.forEach(c => {
    if (!latestByClient[c.client_id]) latestByClient[c.client_id] = c
  })

  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  const missingClients = clients.filter(client => {
    const latest = latestByClient[client.id]
    if (!latest) return true
    return new Date(latest.updated_at || latest.submitted_at || 0) < eightDaysAgo
  })

  const needsResponse = checkins.filter(c => !c.coach_response)
  const responded = checkins.filter(c => c.coach_response)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-ins</h1>
          <div className="flex gap-4 mt-1.5 flex-wrap">
            <span className="text-sm text-gray-500 dark:text-gray-400">{checkins.length} total</span>
            {needsResponse.length > 0 && (
              <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                {needsResponse.length} awaiting response
              </span>
            )}
            {missingClients.length > 0 && (
              <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                {missingClients.length} haven't checked in
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Missing clients banner */}
      {missingClients.length > 0 && (
        <div className="card border-red-200 dark:border-red-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Haven't checked in this week</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {missingClients.map(client => {
              const last = latestByClient[client.id]
              return (
                <div key={client.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={client.full_name} size={8} />
                    <div>
                      <Link
                        to={`/coach/clients/${client.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        {client.full_name}
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {last ? `Last checked in: Week ${last.week_number} · ${fmtDate(last.updated_at || last.submitted_at)}` : 'Never checked in'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Needs response */}
      {needsResponse.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            Awaiting Response ({needsResponse.length})
          </h2>
          {needsResponse.map(c => (
            <CheckinCard key={c.id} checkin={c} client={clientMap[c.client_id]} onResponded={handleResponded} />
          ))}
        </div>
      )}

      {/* Responded */}
      {responded.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            All Check-ins ({responded.length + needsResponse.length})
          </h2>
          {responded.map(c => (
            <CheckinCard key={c.id} checkin={c} client={clientMap[c.client_id]} onResponded={handleResponded} />
          ))}
        </div>
      )}

      {checkins.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">No check-ins yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Check-ins will appear here when clients submit them.</p>
        </div>
      )}
    </div>
  )
}
