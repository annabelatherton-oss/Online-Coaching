import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. ' +
    'Copy .env.example to .env and fill in your Supabase URL and anon key.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// A second client instance used only to create new user accounts without
// displacing the currently logged-in coach session.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
