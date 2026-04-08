// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Lazy Supabase client initialization
let _supabaseClient: any = null

export function getSupabase(env?: any) {
  // If env provided (from Cloudflare Workers context), use it
  if (env?.SUPABASE_URL && env?.SUPABASE_ANON_KEY) {
    return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
  
  // Otherwise use cached client or create from process.env
  if (!_supabaseClient) {
    const SUPABASE_URL = process.env.SUPABASE_URL || ''
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''
    
    // Return mock client if no credentials (for build time)
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return null
    }
    
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
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
