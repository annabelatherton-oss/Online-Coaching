import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function StatCard({ title, value, subtitle, icon, color, to }) {
  const content = (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
  if (to) return <Link to={to}>{content}</Link>
  return content
}

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Check-in window: opens Thursday, runs through Tuesday, closed Wednesday —
// mirrors the client-side window in ClientCheckin.jsx.
function lastWednesdayMidnight() {
  const now = new Date()
  const daysSince = (now.getDay() - 3 + 7) % 7 || 7
  const d = new Date(now)
  d.setDate(now.getDate() - daysSince)
  d.setHours(0, 0, 0, 0)
  return d
}

const RATING_FIELDS = [
  { key: 'energy_level', label: 'Low energy' },
  { key: 'sleep_quality', label: 'Low sleep quality' },
  { key: 'food_adherence', label: 'Low food adherence' },
  { key: 'gym_adherence', label: 'Low gym adherence' },
]

export default function CoachDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentClients, setRecentClients] = useState([])
  const [pendingPauses, setPendingPauses] = useState([])
  const [attention, setAttention] = useState([]) // [{ clientId, name, reasons: [{text, tone}] }]

  useEffect(() => {
    async function load() {
      const { data: clients } = await supabase
        .from('clients')
        .select('id, is_active, is_paused, access_expires_at, profiles!clients_profile_id_fkey(full_name, email)')
        .eq('coach_id', profile.id)

      if (clients) {
        const now = new Date()
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const active = clients.filter(c => c.is_active && !c.is_paused)
        const expiringSoon = clients.filter(c => {
          if (!c.access_expires_at) return false
          const exp = new Date(c.access_expires_at)
          return exp > now && exp <= sevenDays
        })

        const clientIds = clients.map(c => c.id)
        let pendingCheckins = 0
        if (clientIds.length > 0) {
          const { count } = await supabase
            .from('client_checkins')
            .select('id', { count: 'exact', head: true })
            .in('client_id', clientIds)
            .is('coach_responded_at', null)
          pendingCheckins = count ?? 0
        }

        const clientMap = {}
        clients.forEach(c => { clientMap[c.id] = c.profiles?.full_name || 'Unknown' })
        let pauses = []
        if (clientIds.length > 0) {
          const { data: pauseData } = await supabase
            .from('plan_pauses')
            .select('id, client_id, return_date, first_checkin_date, weeks_paused, pause_start_date')
            .in('client_id', clientIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
          pauses = (pauseData || []).map(p => ({ ...p, client_name: clientMap[p.client_id] }))
        }
        setPendingPauses(pauses)

        // ── "Needs attention today" — merges three signals per active client:
        // missed this week's check-in, a rating stuck low 3+ weeks running,
        // and a struggle the client marked resolved that hasn't been
        // acknowledged yet.
        const attentionMap = {}
        function flag(clientId, reason) {
          if (!attentionMap[clientId]) attentionMap[clientId] = { clientId, name: clientMap[clientId], reasons: [] }
          attentionMap[clientId].reasons.push(reason)
        }

        if (clientIds.length > 0) {
          const [{ data: checkinRows }, { data: resolvedRows }, { data: mealFlagRows }, { data: everydayRows }] = await Promise.all([
            supabase
              .from('client_checkins')
              .select('client_id, week_number, energy_level, sleep_quality, food_adherence, gym_adherence, submitted_at, updated_at')
              .in('client_id', clientIds)
              .order('week_number', { ascending: false }),
            supabase
              .from('client_struggle_tracking')
              .select('id, client_id, label')
              .in('client_id', clientIds)
              .eq('status', 'resolved')
              .eq('coach_seen_resolved', false),
            supabase
              .from('client_meal_swap_acks')
              .select('client_id, dislike_name, resolution, meals(name)')
              .in('client_id', clientIds)
              .eq('acknowledged', false),
            supabase
              .from('client_everyday_meals')
              .select('client_id, slot_type, meals(name)')
              .in('client_id', clientIds)
              .eq('needs_coach_review', true),
          ])

          const checkinsByClient = {}
          ;(checkinRows || []).forEach(c => { (checkinsByClient[c.client_id] ||= []).push(c) })

          // Missed check-in: only flag from Monday through Wednesday, giving
          // Thu/Fri/weekend as normal submission grace period.
          const dow = now.getDay()
          if (dow === 1 || dow === 2 || dow === 3) {
            const windowStartISO = lastWednesdayMidnight().toISOString()
            active.forEach(client => {
              const rows = checkinsByClient[client.id] || []
              const hasCurrent = rows.some(c => (c.submitted_at || c.updated_at) >= windowStartISO)
              if (!hasCurrent) flag(client.id, { text: "Hasn't checked in this week", tone: 'gray' })
            })
          }

          active.forEach(client => {
            const rows = checkinsByClient[client.id] || []
            RATING_FIELDS.forEach(f => {
              let streak = 0
              for (const c of rows) {
                const v = c[f.key]
                if (v == null) continue
                if (v < 4) streak++
                else break
              }
              if (streak > 2) flag(client.id, { text: f.label, badge: `${streak}wks`, tone: 'amber' })
            })
          })

          ;(resolvedRows || []).forEach(r => flag(r.client_id, { text: r.label, icon: 'check', tone: 'green' }))

          ;(mealFlagRows || []).forEach(r => {
            const mealName = r.meals?.name || 'A meal'
            if (r.resolution === 'needs_review') {
              flag(r.client_id, { text: `${mealName} needs a swap for "${r.dislike_name}"`, tone: 'amber' })
            } else {
              flag(r.client_id, { text: `${mealName} auto-swapped for "${r.dislike_name}"`, tone: 'gray' })
            }
          })

          ;(everydayRows || []).forEach(r => {
            flag(r.client_id, { text: `Everyday ${(r.meals?.name) ? r.meals.name : 'meal'} changed — check macros`, tone: 'amber' })
          })
        }

        setAttention(Object.values(attentionMap))

        setStats({
          total: clients.length,
          active: active.length,
          paused: clients.filter(c => c.is_paused).length,
          expiringSoon: expiringSoon.length,
          pendingCheckins,
        })
        setRecentClients(clients.slice(0, 5))
      }
      setLoading(false)
    }
    load()
  }, [profile.id])

  async function actOnPause(id, status) {
    await supabase.from('plan_pauses').update({ status }).eq('id', id)
    setPendingPauses(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'Coach'} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your clients today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={stats?.total ?? '—'}
          subtitle={`${stats?.active ?? 0} active`}
          to="/coach/clients"
          color="bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Paused Clients"
          value={stats?.paused ?? '—'}
          color="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Expiring Soon"
          value={stats?.expiringSoon ?? '—'}
          subtitle="within 7 days"
          color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Check-ins"
          value={stats?.pendingCheckins ?? '—'}
          subtitle={stats?.pendingCheckins ? 'need your response' : 'all responded'}
          to="/coach/checkins"
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Needs attention today */}
      {attention.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Needs attention today</h2>
            <span className="badge bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{attention.length}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {attention.map(a => (
              <Link
                key={a.clientId}
                to={`/coach/clients/${a.clientId}?tab=Check-ins`}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <p className="font-medium text-sm text-gray-900 dark:text-white flex-shrink-0">{a.name}</p>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {a.reasons.map((r, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium pl-1 pr-2 py-0.5 rounded-full whitespace-nowrap ${
                        r.tone === 'green'  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        r.tone === 'amber'  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                              'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {r.badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-black/25 font-semibold">{r.badge}</span>
                      )}
                      {r.icon === 'check' && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {r.text}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pause requests */}
      {pendingPauses.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌴</span>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pause Requests</h2>
            <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{pendingPauses.length}</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pendingPauses.map(p => (
              <div key={p.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{p.client_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.pause_start_date && `Starts ${fmtDate(p.pause_start_date)} · `}
                    {p.weeks_paused > 0
                      ? `${p.weeks_paused} week${p.weeks_paused !== 1 ? 's' : ''} paused · first check-in ${fmtDate(p.first_checkin_date)}`
                      : 'Short break'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => actOnPause(p.id, 'approved')} className="btn-primary py-1.5 px-3 text-xs">Approve</button>
                  <button onClick={() => actOnPause(p.id, 'rejected')} className="btn-secondary py-1.5 px-3 text-xs">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent clients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Clients</h2>
          <Link to="/coach/clients" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            View all →
          </Link>
        </div>
        {recentClients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No clients yet.</p>
            <Link to="/coach/clients" className="btn-primary mt-3 inline-flex">
              Add your first client
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentClients.map(client => {
              const exp = client.access_expires_at ? new Date(client.access_expires_at) : null
              const expired = exp && exp < new Date()
              return (
                <div key={client.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                        {client.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {client.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400">{client.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.is_paused && (
                      <span className="badge bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        Paused
                      </span>
                    )}
                    {expired && !client.is_paused && (
                      <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        Expired
                      </span>
                    )}
                    {!client.is_paused && !expired && client.is_active && (
                      <span className="badge bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coming soon note */}
      <div className="card border-dashed">
        <div className="text-center py-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            More dashboard widgets coming in later phases
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            Meal plans, training programmes, check-in analytics, and more
          </p>
        </div>
      </div>
    </div>
  )
}
