// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Lazy Supabase client initialization
let _supabaseClient: any = null

// Server-side: prefer service_role (bypasses RLS). Only runs on CF Worker / Node — never the browser.
// Falls back to anon key if service_role not configured.
export function getSupabase(env?: any) {
  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key =
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!url || !key) return null

  if (env) {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    })
  }

  if (!_supabaseClient) {
    _supabaseClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
    })
  }
  return _supabaseClient
}

// Backward compatibility - export as supabase
export const supabase = getSupabase()

// Database helper types
export interface Database {
  public: {
    Tables: {
      users: any
      lessons: any
      chapters: any
      subjects: any
      grades: any
      countries: any
      student_progress: any
      exercises: any
      exercise_submissions: any
      // Add more as needed
    }
  }
}

// Initialize Supabase with environment variables from context
export function initSupabase(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}
