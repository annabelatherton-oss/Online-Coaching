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

export default function CoachDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentClients, setRecentClients] = useState([])

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
