import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'
import DarkModeToggle from '../components/DarkModeToggle'

export default function SetPassword() {
  const { session, isClient, isCoach, isLoading } = useAuth()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (isLoading) return <LoadingSpinner size="lg" className="min-h-screen" />

  // Already set their password — send them to the app
  if (session?.user?.user_metadata?.password_set) {
    if (isCoach) navigate('/coach', { replace: true })
    else navigate('/client', { replace: true })
    return null
  }

  // No session means the invite link wasn't clicked or has expired
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 dark:bg-gray-950 px-4">
        <div className="absolute top-4 right-4"><DarkModeToggle /></div>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="Annabel Atherton Personal Training" className="h-28 w-auto mx-auto mb-4" />
          </div>
          <div className="card text-center space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              This link has expired or has already been used.
            </p>
            <button
              className="btn-primary w-full py-2.5"
              onClick={() => navigate('/login')}
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { password_set: true },
      })
      if (error) throw error
      if (isCoach) navigate('/coach', { replace: true })
      else navigate('/client', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not set password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 dark:bg-gray-950 px-4">
      <div className="absolute top-4 right-4"><DarkModeToggle /></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Annabel Atherton Personal Training" className="h-28 w-auto mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Create your password</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Welcome! Set a password so you can log in any time.
            </p>

            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-2.5"
            >
              {saving ? 'Saving…' : 'Set password & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
