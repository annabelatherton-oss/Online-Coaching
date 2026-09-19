import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)
  const [profileReady, setProfileReady] = useState(false)

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
      setProfileReady(true)
    })

    // supabase-js holds an internal lock for the duration of this callback - awaiting another
    // Supabase call (fetchProfile) directly inside it can deadlock against the signIn() call that
    // triggered the event in the first place, since both end up waiting on the same lock. This is
    // exactly the "login freezes, only works after leaving and coming back" symptom: the first
    // sign-in hangs forever, and it only "works" on the next attempt because that page load's
    // getSession() (above) isn't blocked by a signIn() call still holding the lock. Deferring the
    // callback's body with setTimeout breaks out of that call stack, matching Supabase's own
    // documented workaround for this deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          setSession(session)
          if (session?.user) {
            const p = await fetchProfile(session.user.id)
            setProfile(p)
          } else {
            setProfile(null)
          }
          setProfileReady(true)
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = {
    session,
    profile,
    isLoading: session === undefined || !profileReady,
    isCoach: profile?.role === 'coach',
    isClient: profile?.role === 'client',
    signIn,
    signOut,
    refetchProfile: async () => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
