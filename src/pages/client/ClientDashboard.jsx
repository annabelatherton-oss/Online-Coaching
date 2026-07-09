import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function PlaceholderCard({ title, subtitle, icon, color, comingSoon }) {
  return (
    <div className={`card flex flex-col gap-3 h-full ${comingSoon ? 'opacity-60' : ''}`}>
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
  const [newDelivery, setNewDelivery] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*, profiles!clients_coach_id_fkey(full_name)')
        .eq('profile_id', session.user.id)
        .single()
      setClientData(data)

      if (data?.id) {
        const { data: delivery } = await supabase
          .from('weekly_deliveries')
          .select('id, coach_notes, personal_week, delivered_at')
          .eq('client_id', data.id)
          .is('seen_at', null)
          .order('delivered_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (delivery) {
          setNewDelivery(delivery)
          supabase.from('weekly_deliveries')
            .update({ seen_at: new Date().toISOString() })
            .eq('id', delivery.id)
            .then(() => {})
        }
      }

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

      {/* New plan notification */}
      {newDelivery && (
        <Link to="/client/meals">
          <div className="card border-brand-300 dark:border-brand-700 bg-gradient-to-r from-brand-50 to-pink-50 dark:from-brand-900/20 dark:to-pink-900/10 flex gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300">New plan for Week {newDelivery.personal_week}!</p>
              {newDelivery.coach_notes ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{newDelivery.coach_notes}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your coach has updated your plan — tap to view.</p>
              )}
            </div>
            <svg className="w-4 h-4 text-brand-400 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
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

        <Link to="/client/meals">
          <PlaceholderCard
            title="This Week's Meal Plan"
            subtitle="Your personalised nutrition for the week"
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/training">
          <PlaceholderCard
            title="This Week's Training"
            subtitle="Your exercise programme for the week"
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/checkin">
          <PlaceholderCard
            title="Weekly Check-in"
            subtitle="Log your progress for your coach"
            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>

        <Link to="/client/progress">
          <PlaceholderCard
            title="My Progress"
            subtitle="Weight trends, photos, and check-in history"
            color="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </Link>
      </div>
    </div>
  )
}
