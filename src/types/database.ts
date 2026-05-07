/**
 * Database types — mapeamento das tabelas Supabase para uso com supabase-js.
 *
 * Este ficheiro é uma stub temporária. Para tipos 100% precisos, gerar via:
 *
 *   npm run types:gen
 *
 * (requer Supabase CLI logado no projeto — ver README).
 *
 * Tabelas críticas que controlamos (refresh_tokens) têm Row tipada;
 * o resto fica `any` para coexistir com routes legadas até regeneração.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ────────────────────────────────────────────────────────────────────────────
// Tabela: users — UserRow disponível para uso explícito em código novo
// ────────────────────────────────────────────────────────────────────────────
export interface UserRow {
  id: string
  email: string
  password_hash: string
  full_name: string
  role: 'student' | 'teacher' | 'admin' | 'support' | 'editor' | 'country_manager' | 'finance' | 'moderator'
  phone: string | null
  country_id: string | null
  avatar_url: string | null
  is_active: boolean
  is_verified: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

// ────────────────────────────────────────────────────────────────────────────
// Tabela: refresh_tokens (migration 005) — controlamos todos os callers
// ────────────────────────────────────────────────────────────────────────────
export interface RefreshTokenRow {
  id: string
  user_id: string
  token_hash: string
  issued_at: string
  expires_at: string
  revoked_at: string | null
  user_agent: string | null
  ip_address: string | null
}

export type RefreshTokenInsert = Omit<RefreshTokenRow, 'id' | 'issued_at' | 'revoked_at'> & {
  id?: string
  issued_at?: string
  revoked_at?: string | null
}

export type RefreshTokenUpdate = Partial<RefreshTokenRow>

// ────────────────────────────────────────────────────────────────────────────
// Helper para entradas de tabela permissivas (compat com código legado)
// ────────────────────────────────────────────────────────────────────────────
type AnyTable = { Row: any; Insert: any; Update: any; Relationships: [] }

// ────────────────────────────────────────────────────────────────────────────
// Database interface — formato esperado por supabase-js v2
// ────────────────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      users: AnyTable
      refresh_tokens: {
        Row: RefreshTokenRow
        Insert: RefreshTokenInsert
        Update: RefreshTokenUpdate
        Relationships: []
      }
      countries: AnyTable
      education_systems: AnyTable
      grades: AnyTable
      subjects: AnyTable
      grade_subjects: AnyTable
      chapters: AnyTable
      lessons: AnyTable
      lesson_attachments: AnyTable
      lesson_comments: AnyTable
      lesson_progress: AnyTable
      exercises: AnyTable
      exercise_options: AnyTable
      exercise_submissions: AnyTable
      student_progress: AnyTable
      student_dashboard: AnyTable
      subject_progress_view: AnyTable
      subscriptions: AnyTable
      video_tokens: AnyTable
      options: AnyTable
    }
    Views: { [key: string]: { Row: any; Relationships: [] } }
    Functions: { [key: string]: any }
    Enums: { [key: string]: any }
    CompositeTypes: { [key: string]: any }
  }
}
