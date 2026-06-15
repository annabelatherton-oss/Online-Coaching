import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 dark:text-white">{value || '—'}</dd>
    </div>
  )
}

export default function ClientProfile() {
  const { profile, session } = useAuth()
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', session.user.id)
        .single()
      setClientData(data)
      setLoading(false)
    }
    load()
  }, [session.user.id])

  if (loading) return <LoadingSpinner size="lg" className="py-20" />

  const expiry = clientData?.access_expires_at
    ? new Date(clientData.access_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your details as set by your coach. More tracking features coming soon.
        </p>
      </div>

      {/* Avatar + name */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-white">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile?.full_name || '—'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Programme Details</h3>
        <dl>
          <InfoRow label="Goal" value={clientData?.goal} />
          <InfoRow label="Current calories" value={clientData?.current_calories ? `${clientData.current_calories} kcal/day` : null} />
          <InfoRow
            label="Start date"
            value={clientData?.start_date
              ? new Date(clientData.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : null}
          />
          <InfoRow label="Access duration" value={clientData?.access_weeks ? `${clientData.access_weeks} weeks` : null} />
          <InfoRow label="Access expires" value={expiry} />
        </dl>
      </div>

      {/* Coming soon sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          'Weight History & Trends',
          'Progress Photos',
          'Body Measurements',
          'Coach Notes',
        ].map(title => (
          <div key={title} className="card opacity-60 border-dashed">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Coming in Phase 2</p>
          </div>
        ))}
      </div>
    </div>
  )
}
