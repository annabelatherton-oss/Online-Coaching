import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function adherenceColor(val) {
  if (!val) return 'text-gray-300 dark:text-gray-600'
  if (val <= 2) return 'text-red-500'
  if (val === 3) return 'text-amber-500'
  return 'text-green-500'
}

function energyColor(val) {
  if (!val) return 'text-gray-300 dark:text-gray-600'
  if (val <= 2) return 'text-red-400'
  if (val === 3) return 'text-amber-400'
  return 'text-green-500'
}

export default function CoachReports() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [checkinMap, setCheckinMap] = useState({})
  const [weightMap, setWeightMap] = useState({})
  const [loading, setLoading] = useState(true)

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
          .select('client_id, week_number, weight_kg, adherence, energy_level, sleep_quality, submitted_at, updated_at')
          .eq('coach_id', profile.id)
          .order('week_number', { ascending: false }),
      ])

      const allClients = clientsData || []
      const allCheckins = checkinsData || []

      const cMap = {}
      for (const c of allCheckins) {
        if (!cMap[c.client_id]) cMap[c.client_id] = c
      }

      const clientIds = allClients.map(c => c.id)
      let wMap = {}
      if (clientIds.length > 0) {
        const { data: wData } = await supabase
          .from('weight_entries')
          .select('client_id, weight_kg, recorded_at')
          .in('client_id', clientIds)
          .order('recorded_at', { ascending: false })

        for (const w of (wData || [])) {
          if (!wMap[w.client_id]) {
            wMap[w.client_id] = { latest: parseFloat(w.weight_kg), prev: null }
          } else if (wMap[w.client_id].prev == null) {
            wMap[w.client_id].prev = parseFloat(w.weight_kg)
          }
        }
      }

      setClients(allClients)
      setCheckinMap(cMap)
      setWeightMap(wMap)
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

  function needsAttention(c) {
    const { label } = clientStatus(c)
    if (label !== 'Active') return false
    const ci = checkinMap[c.id]
    if (!ci) return true
    const ciDate = new Date(ci.updated_at || ci.submitted_at)
    if ((now - ciDate) > 14 * 24 * 60 * 60 * 1000) return true
    if (ci.adherence != null && ci.adherence <= 2) return true
    return false
  }

  const activeCount = clients.filter(c => clientStatus(c).label === 'Active').length
  const recentCount = clients.filter(c => {
    const ci = checkinMap[c.id]
    if (!ci) return false
    return (now - new Date(ci.updated_at || ci.submitted_at)) < 14 * 24 * 60 * 60 * 1000
  }).length
  const attentionCount = clients.filter(needsAttention).length

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of client activity and compliance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total clients</p>
        </div>
        <div className="card text-center py-5">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{recentCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Checked in (14 days)</p>
        </div>
        <div className="card text-center py-5">
          <p className={`text-3xl font-bold ${attentionCount > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{attentionCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Needs attention</p>
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
            <div className="hidden sm:grid grid-cols-[1fr_110px_80px_80px_80px_16px] gap-3 px-4 py-2 border-b border-gray-50 dark:border-gray-800">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Client</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Last check-in</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Adherence</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Energy</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium text-right">Weight</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {clients.map(client => {
                const ci = checkinMap[client.id]
                const weight = weightMap[client.id]
                const { label: statusLabel, cls: statusCls } = clientStatus(client)
                const attention = needsAttention(client)
                const weightChange = weight?.latest != null && weight?.prev != null
                  ? (weight.latest - weight.prev).toFixed(1)
                  : null

                return (
                  <Link
                    key={client.id}
                    to={`/coach/clients/${client.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50/40 dark:hover:bg-pink-900/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                        {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {client.profiles?.full_name || '—'}
                        </span>
                        {attention && (
                          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title="Needs attention" />
                        )}
                      </div>
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="text-right hidden sm:block w-28 flex-shrink-0">
                      {ci ? (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Week {ci.week_number}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(ci.updated_at || ci.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">No check-in</p>
                      )}
                    </div>

                    <div className="text-right hidden sm:block w-20 flex-shrink-0">
                      {ci?.adherence != null ? (
                        <p className={`text-sm font-semibold ${adherenceColor(ci.adherence)}`}>{ci.adherence}/5</p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    <div className="text-right hidden sm:block w-20 flex-shrink-0">
                      {ci?.energy_level != null ? (
                        <p className={`text-sm font-semibold ${energyColor(ci.energy_level)}`}>{ci.energy_level}/5</p>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    <div className="text-right w-16 flex-shrink-0">
                      {weight?.latest != null ? (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{weight.latest} kg</p>
                          {weightChange !== null && (
                            <p className={`text-xs ${parseFloat(weightChange) < 0 ? 'text-green-500' : parseFloat(weightChange) > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-300 dark:text-gray-600">—</p>
                      )}
                    </div>

                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
