// Supabase Client Configuration
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Re-export para compatibilidade com imports legados.
// Os tipos em `../types/database` ficam disponíveis para uso EXPLÍCITO
// (ex: `as UserRow`) — não são aplicados ao cliente porque supabase-js v2
// produz `never` em selects quando `Row: any` (bug conhecido).
// Após `npm run types:gen` substituir os tipos por reais, podemos
// reactivar `createClient<Database>(...)` de forma segura.
export type { Database, UserRow, RefreshTokenRow } from '../types/database'

export type SupaClient = SupabaseClient

let _supabaseClient: SupaClient | null = null

const CLIENT_OPTS = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
} as const

/**
 * Obter cliente Supabase server-side (Cloudflare Worker ou Node).
 * Preferência: service_role (bypassa RLS — backend confia no JWT validado).
 * Devolve `null` se não houver credenciais configuradas (modo demo).
 */
export function getSupabase(env?: any): SupaClient | null {
  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key =
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!url || !key) return null

  if (env) {
    return createClient(url, key, CLIENT_OPTS)
  }

  if (!_supabaseClient) {
    _supabaseClient = createClient(url, key, CLIENT_OPTS)
  }
  return _supabaseClient
}

export const supabase = getSupabase()

export function initSupabase(supabaseUrl: string, supabaseKey: string): SupaClient {
  return createClient(supabaseUrl, supabaseKey, CLIENT_OPTS)
}
