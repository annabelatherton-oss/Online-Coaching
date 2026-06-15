import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export function CoachRoute({ children }) {
  const { isLoading, session, isCoach } = useAuth()
  if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />
  if (!session) return <Navigate to="/login" replace />
  if (!isCoach) return <Navigate to="/client" replace />
  return children
}

export function ClientRoute({ children }) {
  const { isLoading, session, isClient } = useAuth()
  if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />
  if (!session) return <Navigate to="/login" replace />
  if (!isClient) return <Navigate to="/coach" replace />
  return children
}
