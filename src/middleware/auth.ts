// Authentication Middleware
import { Context, Next } from 'hono'
import { extractToken, verifyToken } from '../utils/jwt'
import type { UserRole } from '../types'

declare module 'hono' {
  interface ContextVariableMap {
    user: {
      id: string
      email: string
      role: UserRole
      full_name?: string
    }
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader || '')

  if (!token) {
    return c.json({ success: false, error: 'No token provided' }, 401)
  }

  const decoded = verifyToken(token, c.env?.JWT_SECRET)

  if (!decoded) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }

  c.set('user', {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    full_name: (decoded as any).name || decoded.email?.split('@')[0] || 'Utilizador'
  })

  await next()
}

export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user')

    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401)
    }

    if (!roles.includes(user.role)) {
      return c.json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`
      }, 403)
    }

    await next()
  }
}

export const requireStudent = requireRole('student')
export const requireTeacher = requireRole('teacher')
export const requireAdmin = requireRole('admin')
export const requireTeacherOrAdmin = requireRole('teacher', 'admin')
export const requireSupport = requireRole('support')
export const requireSupportOrAdmin = requireRole('support', 'admin')
export const requireStaff = requireRole('support', 'teacher', 'admin')
export const requireEditor = requireRole('editor')
export const requireEditorOrAdmin = requireRole('editor', 'admin')
export const requireCountryManager = requireRole('country_manager')
export const requireCountryManagerOrAdmin = requireRole('country_manager', 'admin')
export const requireFinance = requireRole('finance')
export const requireFinanceOrAdmin = requireRole('finance', 'admin')
export const requireModerator = requireRole('moderator')
export const requireModeratorOrAdmin = requireRole('moderator', 'admin')
export const requireAnyStaff = requireRole('teacher', 'admin', 'support', 'editor', 'country_manager', 'finance', 'moderator')

export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader || '')

  if (token) {
    try {
      const decoded = verifyToken(token, c.env?.JWT_SECRET)
      if (decoded) {
        c.set('user', {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          full_name: (decoded as any).name || decoded.email?.split('@')[0] || 'Utilizador'
        })
      }
    } catch {
      // Sem JWT_SECRET configurado: tratar como não autenticado.
    }
  }

  await next()
}

/**
 * Rate limiting partilhado entre isolates Workers via Cloudflare KV.
 *
 * Estratégia: contador fixed-window por (IP + path). Janela = `windowMs`.
 * Fallback in-memory quando o binding KV não está disponível (dev local sem KV
 * configurado ou demo mode) — emite warning para tornar visível.
 *
 * Limitações conhecidas (aceitáveis para auth endpoints):
 *  - KV é eventualmente consistente (~60s globalmente). Burst muito rápido em
 *    múltiplas regiões pode passar do limite por um curto período. Para auth,
 *    a barreira contra brute-force distribuído é o que interessa.
 *  - TTL mínimo do KV é 60s — janelas mais curtas usam o campo `resetAt`.
 */

const _memoryStore: Map<string, { count: number; resetAt: number }> = new Map()
let _memoryWarned = false

interface RateEntry {
  count: number
  resetAt: number
}

export function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip')
            || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
            || 'unknown'
    const now = Date.now()
    const key = `rl:${ip}:${c.req.path}`
    const kv = c.env?.RATE_LIMIT as KVNamespace | undefined

    let entry: RateEntry | null = null

    if (kv) {
      try {
        const raw = await kv.get(key)
        entry = raw ? JSON.parse(raw) as RateEntry : null
      } catch (err) {
        console.error('Rate limit KV read failed:', err)
      }
    } else {
      if (!_memoryWarned) {
        console.warn('[rate-limit] KV binding RATE_LIMIT ausente — a usar fallback in-memory (não eficaz em produção).')
        _memoryWarned = true
      }
      entry = _memoryStore.get(key) || null
    }

    // Janela ainda válida
    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        c.header('Retry-After', String(retryAfter))
        return c.json({
          success: false,
          error: 'Demasiadas tentativas. Tente novamente mais tarde.'
        }, 429)
      }
      entry.count++
    } else {
      entry = { count: 1, resetAt: now + windowMs }
    }

    // Persistir
    if (kv) {
      // KV TTL mínimo é 60s; usamos max(60, windowMs/1000) e confiamos em resetAt para janelas curtas
      const ttlSeconds = Math.max(60, Math.ceil(windowMs / 1000))
      try {
        await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds })
      } catch (err) {
        console.error('Rate limit KV write failed:', err)
      }
    } else {
      _memoryStore.set(key, entry)
    }

    await next()
  }
}
