import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase URL and anon key.'
  )
}

// persistSession/autoRefreshToken are already supabase-js's defaults, but set explicitly rather
// than left implicit — this is what keeps a signed-in account signed in indefinitely (session
// saved to localStorage, access token silently refreshed in the background) until an explicit
// Sign Out, rather than expiring after the short-lived access token's own lifetime.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
})

// A second client instance used only to create new user accounts without
// displacing the currently logged-in coach session.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
