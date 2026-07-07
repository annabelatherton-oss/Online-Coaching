import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function PlaceholderCard({ title, subtitle, icon, color, comingSoon }) {
  return (
    <div className={`card flex flex-col gap-3 ${comingSoon ? 'opacity-60' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {comingSoon && (
        <span className="self-start badge bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          Coming soon
        </span>
      )}
    </div>
  )
}

export default function ClientDashboard() {
  const { profile, session } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*, profiles!clients_coach_id_fkey(full_name)')
        .eq('profile_id', session.user.id)
        .single()
      setClientData(data)
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const now = new Date()
  const expiry = clientData?.access_expires_at ? new Date(clientData.access_expires_at) : null
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))) : null
  const weeksLeft = daysLeft !== null ? Math.ceil(daysLeft / 7) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        {clientData?.profiles?.full_name && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your coach: <span className="font-medium">{clientData.profiles.full_name}</span>
          </p>
        )}
      </div>

      {/* Access info */}
      {daysLeft !== null && (
        <div className={`card flex items-center gap-4 ${daysLeft <= 7 ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10' : ''}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${daysLeft <= 7 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {daysLeft === 0 ? 'Plan expired' : `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} remaining on current plan`}
            </p>
            {expiry && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {daysLeft === 0 ? 'Contact your coach to renew.' : `Expires ${expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/client/profile">
          <PlaceholderCard
            title="My Profile"
            subtitle="View your goals, stats, and measurements"
            color="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </Link>

        <PlaceholderCard
          title="This Week's Meal Plan"
          subtitle="Your personalised nutrition for the week"
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          comingSoon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <PlaceholderCard
          title="This Week's Training"
          subtitle="Your exercise programme for the week"
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          comingSoon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <PlaceholderCard
          title="Weekly Check-in"
          subtitle="Log your progress for your coach"
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          comingSoon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <PlaceholderCard
          title="My Progress"
          subtitle="Weight trends, photos, and measurements"
          color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
          comingSoon
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>
    </div>
  )
}
