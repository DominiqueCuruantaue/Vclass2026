// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Environment variables (set these in wrangler.jsonc or .dev.vars)
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

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
