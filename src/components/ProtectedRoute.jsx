import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'

export function CoachRoute({ children }) {
  const { isLoading, session, isCoach } = useAuth()
  if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />
  if (!session) return <Navigate to="/login" replace />
  if (!isCoach) return <Navigate to="/client" replace />
  return children
}

function ExpiredAccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 dark:bg-gray-950 px-4">
      <div className="max-w-sm text-center space-y-2">
        <p className="text-4xl">⏳</p>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Your access has ended</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your plan's access period has expired. Get in touch with your coach to renew it.
        </p>
      </div>
    </div>
  )
}

export function ClientRoute({ children }) {
  const { isLoading, session, isClient } = useAuth()
  // A pause never blocks access (a paused client should still be able to open the app and follow
  // their frozen week if they want to) — only an expired access period does, and only that: not
  // is_archived either, since a coach archiving a client isn't the same as their paid access
  // period actually running out.
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!isClient || !session?.user?.id) { setCheckingAccess(false); return }
    let cancelled = false
    supabase.from('clients').select('access_expires_at').eq('profile_id', session.user.id).maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setExpired(!!data?.access_expires_at && new Date(data.access_expires_at) < new Date())
        setCheckingAccess(false)
      })
    return () => { cancelled = true }
  }, [isClient, session?.user?.id])

  if (isLoading || checkingAccess) return <LoadingSpinner size="lg" className="min-h-screen" />
  if (!session) return <Navigate to="/login" replace />
  if (!isClient) return <Navigate to="/coach" replace />
  if (expired) return <ExpiredAccessScreen />
  return children
}
