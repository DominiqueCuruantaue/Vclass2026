// Password hashing utilities
import bcrypt from 'bcryptjs'

/**
 * Cost target actual.
 * bcryptjs é JS puro (sem binding nativo) — o único disponível no runtime
 * Cloudflare Workers. Com cost=12 o hash ultrapassava intermitentemente o
 * limite de CPU do Worker (erro 1102 "exceeded resource limits"), fazendo
 * login/registo falhar ao acaso. cost=10 mantém resistência forte a
 * brute-force offline e cabe com margem no limite de CPU do Worker.
 */
export const SALT_ROUNDS = 10

/**
 * Hash com o cost actual.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verifica password contra hash existente (qualquer rounds).
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Extrai o cost (rounds) de um hash bcrypt.
 * Formato: $2[aby]$<cost>$<22-char-salt><31-char-digest>
 * Devolve null se o hash não for um bcrypt válido.
 */
export function getHashRounds(hash: string): number | null {
  const m = /^\$2[aby]\$(\d{2})\$/.exec(hash)
  if (!m) return null
  return parseInt(m[1], 10)
}

/**
 * Indica se um hash precisa de re-hash com o cost actual.
 * Usar após login bem-sucedido para migrar hashes antigos.
 * Compara por diferença (não só "menor que") porque o cost-alvo já baixou
 * uma vez (12→10, ver SALT_ROUNDS) — hashes antigos mais caros também
 * precisam de ser regravados, não só os mais baratos.
 */
export function needsRehash(hash: string): boolean {
  const rounds = getHashRounds(hash)
  return rounds === null || rounds !== SALT_ROUNDS
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }

  return { valid: true }
}
