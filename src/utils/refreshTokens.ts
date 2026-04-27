// Refresh token persistence with hash-based revocation.
// Tokens são armazenados como SHA-256 do JWT — nunca o JWT em claro.

const REFRESH_DAYS = 30

/**
 * SHA-256 do token usando Web Crypto (disponível em Cloudflare Workers).
 */
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Persistir um refresh token recém-emitido.
 * Falha silenciosamente em demo mode (sem supabase).
 */
export async function storeRefreshToken(
  supabase: any,
  userId: string,
  refreshToken: string,
  meta: { user_agent?: string; ip_address?: string } = {}
): Promise<void> {
  if (!supabase) return

  const token_hash = await sha256(refreshToken)
  const expires_at = new Date(Date.now() + REFRESH_DAYS * 24 * 3600 * 1000).toISOString()

  const { error } = await supabase.from('refresh_tokens').insert({
    user_id: userId,
    token_hash,
    expires_at,
    user_agent: meta.user_agent?.slice(0, 500),
    ip_address: meta.ip_address?.slice(0, 64)
  })

  if (error) console.error('storeRefreshToken failed:', error.message)
}

/**
 * Confirma que o refresh token está activo (existe, não revogado, não expirado).
 */
export async function isRefreshTokenActive(
  supabase: any,
  refreshToken: string
): Promise<boolean> {
  if (!supabase) return true // demo mode: aceita

  const token_hash = await sha256(refreshToken)
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id, revoked_at, expires_at')
    .eq('token_hash', token_hash)
    .single()

  if (error || !data) return false
  if (data.revoked_at) return false
  if (new Date(data.expires_at) < new Date()) return false
  return true
}

/**
 * Revoga um refresh token específico (logout).
 */
export async function revokeRefreshToken(
  supabase: any,
  refreshToken: string
): Promise<void> {
  if (!supabase) return

  const token_hash = await sha256(refreshToken)
  await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', token_hash)
    .is('revoked_at', null)
}

/**
 * Revoga todos os refresh tokens de um utilizador (logout-all / change-password).
 */
export async function revokeAllUserTokens(
  supabase: any,
  userId: string
): Promise<void> {
  if (!supabase) return

  await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null)
}
