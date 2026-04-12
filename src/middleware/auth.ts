// Authentication Middleware
import { Context, Next } from 'hono'
import { extractToken, verifyToken } from '../utils/jwt'
import type { UserRole } from '../types'

// Extend Hono context to include user info
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

/**
 * Authentication middleware - verifies JWT token
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader || '')
  
  if (!token) {
    return c.json({ success: false, error: 'No token provided' }, 401)
  }
  
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }
  
  // Set user in context
  c.set('user', {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    full_name: (decoded as any).name || decoded.email?.split('@')[0] || 'Utilizador'
  })
  
  await next()
}

/**
 * Role-based authorization middleware
 */
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

/**
 * Student-only routes
 */
export const requireStudent = requireRole('student')

/**
 * Teacher-only routes
 */
export const requireTeacher = requireRole('teacher')

/**
 * Admin-only routes
 */
export const requireAdmin = requireRole('admin')

/**
 * Teacher or Admin routes
 */
export const requireTeacherOrAdmin = requireRole('teacher', 'admin')

/**
 * Optional auth middleware — não bloqueia se não houver token,
 * mas popula c.get('user') se o token for válido.
 * Útil para rotas públicas que beneficiam de dados do utilizador autenticado.
 */
export async function optionalAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = extractToken(authHeader || '')

  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      c.set('user', {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        full_name: (decoded as any).name || decoded.email?.split('@')[0] || 'Utilizador'
      })
    }
  }

  await next()
}

/**
 * Rate limiting simples por IP (em memória — reset no restart do worker)
 * Uso: app.use('/api/auth/*', rateLimitMiddleware(10, 60000))  → 10 req/min por IP
 */
const _rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map()

export function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('cf-connecting-ip')
            || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
            || 'unknown'
    const now = Date.now()
    const key = `${ip}:${c.req.path}`
    const entry = _rateLimitStore.get(key)

    if (entry) {
      if (now < entry.resetAt) {
        if (entry.count >= maxRequests) {
          return c.json({
            success: false,
            error: 'Demasiadas tentativas. Tente novamente mais tarde.'
          }, 429)
        }
        entry.count++
      } else {
        // Janela expirou — reset
        _rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      }
    } else {
      _rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    }

    await next()
  }
}
