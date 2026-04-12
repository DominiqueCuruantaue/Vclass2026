// Authentication Routes
import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/supabase'
import { hashPassword, verifyPassword, validatePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt'
import { mockUsers } from '../middleware/database'
import type { ApiResponse, AuthResponse } from '../types'

const auth = new Hono()

// Check if database is configured
function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(3, 'Full name must be at least 3 characters'),
  role: z.enum(['student', 'teacher']), // Only students and teachers can self-register
  country_id: z.string().uuid().optional(),
  phone: z.string().optional()
})

/**
 * POST /api/auth/register
 * Register new user
 */
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validation = registerSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json<ApiResponse>({
        success: false,
        error: validation.error.errors[0].message
      }, 400)
    }
    
    const { email, password, full_name, role, country_id, phone } = validation.data
    
    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: passwordValidation.message
      }, 400)
    }
    
    // Get Supabase credentials from env
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Email already registered'
      }, 409)
    }
    
    // Hash password
    const password_hash = await hashPassword(password)
    
    // Insert new user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        role,
        country_id,
        phone,
        is_active: true,
        is_verified: false
      })
      .select('id, email, full_name, role, country_id, phone, avatar_url, is_verified, created_at')
      .single()
    
    if (error || !user) {
      console.error('Registration error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to create user'
      }, 500)
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })
    
    const refreshToken = generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })
    
    return c.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken
      },
      message: 'Registration successful'
    }, 201)
    
  } catch (error) {
    console.error('Register error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * POST /api/auth/login
 * Login user
 */
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validation = loginSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json<ApiResponse>({
        success: false,
        error: validation.error.errors[0].message
      }, 400)
    }
    
    const { email, password } = validation.data
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Use mock users
      const demoUser = mockUsers.find(u => u.email === email)
      
      if (!demoUser || password !== 'password123') {
        return c.json<ApiResponse>({
          success: false,
          error: 'Invalid credentials (Demo mode: use password123)'
        }, 401)
      }
      
      // Generate tokens for demo user
      const accessToken = generateAccessToken({
        sub: demoUser.id,
        email: demoUser.email,
        role: demoUser.role as 'student' | 'teacher' | 'admin',
        name: demoUser.full_name
      })
      
      const refreshToken = generateRefreshToken({
        sub: demoUser.id,
        email: demoUser.email,
        role: demoUser.role as 'student' | 'teacher' | 'admin',
        name: demoUser.full_name
      })
      
      return c.json<ApiResponse<AuthResponse>>({
        success: true,
        data: {
          user: {
            ...demoUser,
            name: demoUser.full_name
          },
          accessToken,
          refreshToken
        },
        message: 'Login successful (Demo mode - database not configured)'
      })
    }
    
    // PRODUCTION MODE: Use Supabase
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, country_id, phone, avatar_url, is_verified, is_active, created_at')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid credentials'
      }, 401)
    }
    
    // Check if user is active
    if (!user.is_active) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      }, 403)
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    
    if (!isValid) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid credentials'
      }, 401)
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })
    
    const refreshToken = generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })
    
    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user
    
    return c.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          name: user.full_name
        },
        accessToken,
        refreshToken
      },
      message: 'Login successful'
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})
auth.post('/refresh', async (c) => {
  try {
    const body = await c.req.json()
    const { refreshToken } = body
    
    if (!refreshToken) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Refresh token required'
      }, 400)
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken)
    
    if (!decoded) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired refresh token'
      }, 401)
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role
    })
    
    return c.json<ApiResponse<{ accessToken: string }>>({
      success: true,
      data: { accessToken },
      message: 'Token refreshed successfully'
    })
    
  } catch (error) {
    console.error('Refresh error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
auth.post('/logout', async (c) => {
  return c.json<ApiResponse>({
    success: true,
    message: 'Logged out successfully'
  })
})

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
auth.get('/me', async (c) => {
  try {
    // Extract token
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]
    
    if (!token) {
      return c.json<ApiResponse>({
        success: false,
        error: 'No token provided'
      }, 401)
    }
    
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid token'
      }, 401)
    }
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock user
      const demoUser = mockUsers.find(u => u.id === decoded.sub)
      
      if (!demoUser) {
        return c.json<ApiResponse>({
          success: false,
          error: 'User not found (Demo mode)'
        }, 404)
      }
      
      return c.json<ApiResponse>({
        success: true,
        data: {
          ...demoUser,
          name: demoUser.full_name
        }
      })
    }
    
    // PRODUCTION MODE: Use Supabase
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, country_id, phone, avatar_url, is_verified, created_at')
      .eq('id', decoded.sub)
      .single()
    
    if (error || !user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'User not found'
      }, 404)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        ...user,
        name: user.full_name
      }
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/profile — actualizar nome, telefone, país
// ═══════════════════════════════════════════════════════════════════════════════
auth.patch('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    const decoded = verifyToken(token)

    if (!decoded) return c.json<ApiResponse>({ success: false, error: 'Not authenticated' }, 401)

    const body = await c.req.json() as { full_name?: string; phone?: string; country_id?: string }
    const { full_name, phone, country_id } = body

    if (!full_name || full_name.trim().length < 2) {
      return c.json<ApiResponse>({ success: false, error: 'Nome deve ter pelo menos 2 caracteres' }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      // Demo mode: devolver dados actualizados sem persistir
      return c.json<ApiResponse>({
        success: true,
        data: {
          id: decoded.sub,
          full_name: full_name.trim(),
          phone: phone || '',
          country_id: country_id || '',
          name: full_name.trim()
        },
        message: 'Demo: perfil actualizado localmente'
      })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    const updates: any = { full_name: full_name.trim(), updated_at: new Date().toISOString() }
    if (phone !== undefined)      updates.phone      = phone
    if (country_id !== undefined) updates.country_id = country_id

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', decoded.sub)
      .select('id, email, full_name, role, country_id, phone, avatar_url, is_verified, created_at')
      .single()

    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

    return c.json<ApiResponse>({ success: true, data: { ...data, name: data.full_name } })
  } catch (e: any) {
    console.error('Update profile error:', e)
    return c.json<ApiResponse>({ success: false, error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/change-password
// ═══════════════════════════════════════════════════════════════════════════════
auth.post('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    const decoded = verifyToken(token)

    if (!decoded) return c.json<ApiResponse>({ success: false, error: 'Not authenticated' }, 401)

    const body = await c.req.json() as { current_password: string; new_password: string }
    const { current_password, new_password } = body

    if (!current_password || !new_password) {
      return c.json<ApiResponse>({ success: false, error: 'Senha actual e nova senha são obrigatórias' }, 400)
    }
    if (new_password.length < 6) {
      return c.json<ApiResponse>({ success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      // Demo mode: verificar senha demo
      if (current_password !== 'password123') {
        return c.json<ApiResponse>({ success: false, error: 'Senha actual incorrecta' }, 400)
      }
      return c.json<ApiResponse>({ success: true, message: 'Demo: senha alterada (simulado)' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    // Buscar hash actual
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', decoded.sub)
      .single()

    if (fetchErr || !user) return c.json<ApiResponse>({ success: false, error: 'Utilizador não encontrado' }, 404)

    // Verificar senha actual
    const valid = await verifyPassword(current_password, user.password_hash)
    if (!valid) return c.json<ApiResponse>({ success: false, error: 'Senha actual incorrecta' }, 400)

    // Actualizar hash
    const new_hash = await hashPassword(new_password)

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: new_hash, updated_at: new Date().toISOString() })
      .eq('id', decoded.sub)

    if (updateErr) return c.json<ApiResponse>({ success: false, error: updateErr.message }, 500)

    return c.json<ApiResponse>({ success: true, message: 'Senha alterada com sucesso' })
  } catch (e: any) {
    console.error('Change password error:', e)
    return c.json<ApiResponse>({ success: false, error: 'Internal server error' }, 500)
  }
})

export default auth
