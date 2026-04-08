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
    role: decoded.role
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
