import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DarkModeToggle from '../components/DarkModeToggle'

export default function Login() {
  const { signIn, session, isCoach, isClient, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicError, setMagicError] = useState('')
  const [sendingMagic, setSendingMagic] = useState(false)

  useEffect(() => {
    if (!isLoading && session) {
      if (isCoach) navigate('/coach', { replace: true })
      else if (isClient) {
        if (!session.user.user_metadata?.password_set) {
          navigate('/set-password', { replace: true })
        } else {
          navigate('/client', { replace: true })
        }
      }
    }
  }, [isLoading, session, isCoach, isClient, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    setMagicError('')
    setSendingMagic(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: { emailRedirectTo: window.location.origin + '/login' },
      })
      if (error) throw error
      setMagicSent(true)
    } catch (err) {
      setMagicError(err.message || 'Could not send link. Please try again.')
    } finally {
      setSendingMagic(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 dark:bg-gray-950 px-4">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Annabel Atherton Personal Training" className="h-28 w-auto mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </div>

        <div className="card">
          {mode === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-2.5"
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                No password?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('magic'); setError('') }}
                  className="text-rose-500 hover:text-rose-600 font-medium underline"
                >
                  Send me a login link
                </button>
              </p>
            </form>
          ) : magicSent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Check your inbox</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  We sent a login link to <span className="font-medium">{magicEmail}</span>. Click it to sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setMagicSent(false); setMode('password') }}
                className="text-sm text-rose-500 hover:text-rose-600 underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Enter your email and we'll send you a one-click login link.
                </p>
                <label className="label" htmlFor="magic-email">Email address</label>
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="you@example.com"
                  value={magicEmail}
                  onChange={e => setMagicEmail(e.target.value)}
                />
              </div>

              {magicError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">{magicError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={sendingMagic}
                className="btn-primary w-full py-2.5"
              >
                {sendingMagic ? 'Sending…' : 'Send login link'}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => { setMode('password'); setMagicError('') }}
                  className="text-rose-500 hover:text-rose-600 font-medium underline"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
