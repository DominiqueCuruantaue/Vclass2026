// Authentication Routes
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { CloudflareBindings } from '../types/bindings'
import { z } from 'zod'
import { getSupabase } from '../config/supabase'
import { hashPassword, verifyPassword, validatePassword, needsRehash } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken } from '../utils/jwt'
import { storeRefreshToken, isRefreshTokenActive, revokeRefreshToken, revokeAllUserTokens } from '../utils/refreshTokens'
import { mockUsers, DEMO_PASSWORD } from '../middleware/database'
import { authMiddleware, rateLimitMiddleware } from '../middleware/auth'
import { COUNTRIES, GRADES, EDUCATION_LEVELS } from '../data/curriculum'

const REFRESH_COOKIE = 'vclass_rt'
const REFRESH_MAX_AGE = 30 * 24 * 3600 // 30 dias em segundos — usado apenas como validade absoluta do JWT/registo em BD

function setRefreshCookie(c: any, token: string) {
  // Sem maxAge/expires: cookie de sessão. O navegador apaga-o ao fechar por completo,
  // forçando novo login mesmo que o utilizador reabra o navegador com as abas restauradas
  // (a menos que o utilizador tenha "continuar de onde parei" activo — nesse caso a
  // verificação extra em window.name, no frontend, cobre esse cenário).
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/'
  })
}

function clearRefreshCookie(c: any) {
  setCookie(c, REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 0
  })
}

function requestMeta(c: any) {
  return {
    user_agent: c.req.header('user-agent') || undefined,
    ip_address:
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      undefined
  }
}
import type { ApiResponse, AuthResponse } from '../types'

const auth = new Hono<{ Bindings: CloudflareBindings }>()

// Rate limiting: máx 20 tentativas de login por minuto por IP
auth.use('/login',    rateLimitMiddleware(20, 60_000))
auth.use('/register', rateLimitMiddleware(5,  60_000))
auth.use('/refresh',  rateLimitMiddleware(30, 60_000))

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
  // Apenas estudantes podem auto-registar-se por aqui. Professores passam
  // obrigatoriamente pela verificação KYT em /api/teacher-verification/apply
  // (ver register-teacher.html) — nunca por este endpoint. A validação estrita
  // (rejeitar role='teacher' com mensagem clara) é feita a seguir ao parse,
  // porque a mensagem custom de z.literal() não se propaga para invalid_literal.
  role: z.string().optional().default('student'),
  country_id: z.string().uuid().optional(),
  phone: z.string().optional(),
  // País e classe do currículo (src/data/curriculum.ts) — usados para restringir
  // o Explorar ao currículo do próprio estudante. Códigos curtos (ex: 'mz'),
  // não confundir com o country_id (UUID legado da tabela countries).
  country_code: z.string().optional(),
  grade_id: z.string().optional()
})

// Confirma que grade_id pertence de facto ao país indicado em country_code
function isValidCountryGrade(countryCode?: string, gradeId?: string): boolean {
  if (!countryCode && !gradeId) return true
  if (!countryCode || !gradeId) return false
  if (!COUNTRIES.some(c => c.id === countryCode)) return false
  const grade = GRADES.find(g => g.id === gradeId)
  if (!grade) return false
  const level = EDUCATION_LEVELS.find(l => l.id === grade.levelId)
  return level?.countryId === countryCode
}

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
    
    const { email, password, full_name, role, country_id, phone, country_code, grade_id } = validation.data

    if (role !== 'student') {
      return c.json<ApiResponse>({
        success: false,
        error: 'Professores não se podem registar diretamente. Use o formulário de candidatura em /register-teacher.html'
      }, 400)
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: passwordValidation.message
      }, 400)
    }

    if (!isValidCountryGrade(country_code, grade_id)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Classe inválida para o país seleccionado'
      }, 400)
    }

    // Use service_role client (consistente com login/refresh/me)
    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
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
        country_code,
        grade_id,
        is_active: true,
        is_verified: false
      })
      .select('id, email, full_name, role, country_id, phone, country_code, grade_id, avatar_url, is_verified, created_at')
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
    }, c.env?.JWT_SECRET)

    const refreshToken = generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role
    }, c.env?.JWT_SECRET)

    await storeRefreshToken(supabase, user.id, refreshToken, requestMeta(c))
    setRefreshCookie(c, refreshToken)

    return c.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user,
        accessToken
      } as any,
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
      
      if (!demoUser || password !== DEMO_PASSWORD) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Credenciais inválidas. Em modo demo, use a senha padrão das contas de demonstração.'
        }, 401)
      }
      
      // Generate tokens for demo user
      const accessToken = generateAccessToken({
        sub: demoUser.id,
        email: demoUser.email,
        role: demoUser.role as 'student' | 'teacher' | 'admin',
        name: demoUser.full_name
      }, c.env?.JWT_SECRET)

      const refreshToken = generateRefreshToken({
        sub: demoUser.id,
        email: demoUser.email,
        role: demoUser.role as 'student' | 'teacher' | 'admin',
        name: demoUser.full_name
      }, c.env?.JWT_SECRET)
      
      setRefreshCookie(c, refreshToken)
      return c.json<ApiResponse<AuthResponse>>({
        success: true,
        data: {
          user: {
            ...demoUser,
            name: demoUser.full_name
          },
          accessToken
        } as any,
        message: 'Login realizado com sucesso (Modo Demo)'
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
      .select('id, email, password_hash, full_name, role, country_id, phone, country_code, grade_id, avatar_url, is_verified, is_active, created_at')
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

    // Migração progressiva: se o hash usa cost antigo, re-hash com SALT_ROUNDS actual.
    // Falha silenciosa — não bloqueia o login se a UPDATE falhar.
    if (needsRehash(user.password_hash)) {
      try {
        const new_hash = await hashPassword(password)
        await supabase
          .from('users')
          .update({ password_hash: new_hash, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      } catch (e) {
        console.warn('Password rehash failed for user', user.id, e)
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    }, c.env?.JWT_SECRET)

    const refreshToken = generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role
    }, c.env?.JWT_SECRET)

    await storeRefreshToken(supabase, user.id, refreshToken, requestMeta(c))
    setRefreshCookie(c, refreshToken)

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user

    return c.json<ApiResponse<AuthResponse>>({
      success: true,
      data: {
        user: {
          ...userWithoutPassword,
          name: user.full_name
        },
        accessToken
      } as any,
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
    // Ler refresh token do cookie HttpOnly (obrigatório)
    const refreshToken = getCookie(c, REFRESH_COOKIE)

    if (!refreshToken) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Refresh token required'
      }, 400)
    }

    // Verify refresh token (must have type: 'refresh' claim)
    const decoded = verifyRefreshToken(refreshToken, c.env?.JWT_SECRET)

    if (!decoded) {
      clearRefreshCookie(c)
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid or expired refresh token'
      }, 401)
    }

    // Verificar contra BD: token tem de existir, não estar revogado e não ter expirado
    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
    if (supabase) {
      const active = await isRefreshTokenActive(supabase, refreshToken)
      if (!active) {
        clearRefreshCookie(c)
        return c.json<ApiResponse>({
          success: false,
          error: 'Refresh token revoked or unknown'
        }, 401)
      }
    }

    // Rotação: emitir novo par e revogar o antigo
    const accessToken = generateAccessToken({
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role
    }, c.env?.JWT_SECRET)

    const newRefreshToken = generateRefreshToken({
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role
    }, c.env?.JWT_SECRET)

    if (supabase) {
      await revokeRefreshToken(supabase, refreshToken)
      await storeRefreshToken(supabase, decoded.sub, newRefreshToken, requestMeta(c))
    }

    setRefreshCookie(c, newRefreshToken)

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
 * Revoga o refresh token (se enviado) e remove a sessão server-side.
 * O cliente deve apagar accessToken/refreshToken do storage.
 */
auth.post('/logout', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as { allDevices?: boolean }
    const refreshToken = getCookie(c, REFRESH_COOKIE)
    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null

    if (supabase) {
      if (body.allDevices) {
        const authHeader = c.req.header('Authorization')
        const token = authHeader?.replace('Bearer ', '') || ''
        const decoded = verifyToken(token, c.env?.JWT_SECRET)
        if (decoded) await revokeAllUserTokens(supabase, decoded.sub)
      } else if (refreshToken) {
        await revokeRefreshToken(supabase, refreshToken)
      }
    }

    clearRefreshCookie(c)
    return c.json<ApiResponse>({ success: true, message: 'Logged out successfully' })
  } catch (e) {
    console.error('Logout error:', e)
    return c.json<ApiResponse>({ success: true, message: 'Logged out' })
  }
})

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')

    if (!isDatabaseConfigured(c.env)) {
      const demoUser = mockUsers.find(u => u.id === user.id)
      if (!demoUser) {
        return c.json<ApiResponse>({ success: false, error: 'Utilizador não encontrado' }, 404)
      }
      return c.json<ApiResponse>({
        success: true,
        data: { ...demoUser, name: demoUser.full_name }
      })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({ success: false, error: 'Database configuration error' }, 500)
    }

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, country_id, phone, country_code, grade_id, avatar_url, is_verified, created_at')
      .eq('id', user.id)
      .single()

    if (error || !dbUser) {
      return c.json<ApiResponse>({ success: false, error: 'User not found' }, 404)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { ...dbUser, name: dbUser.full_name }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json<ApiResponse>({ success: false, error: 'Internal server error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/profile — actualizar nome, telefone, país
// ═══════════════════════════════════════════════════════════════════════════════
auth.patch('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')

    const body = await c.req.json() as { full_name?: string; phone?: string; country_id?: string }
    const { full_name, phone, country_id } = body

    if (!full_name || full_name.trim().length < 2) {
      return c.json<ApiResponse>({ success: false, error: 'Nome deve ter pelo menos 2 caracteres' }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      return c.json<ApiResponse>({
        success: true,
        data: {
          id: user.id,
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
      .eq('id', user.id)
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
// Mudar de Classe/País — o aluno pode trocar o país/classe do currículo do seu
// próprio perfil sem re-registo, até 5 vezes em qualquer janela de 365 dias
// corridos. GET devolve o estado actual (quantas já usou, quando desbloqueia
// se esgotou); POST efectiva a troca.
// ═══════════════════════════════════════════════════════════════════════════════
const CLASS_SWITCH_LIMIT = 5
const CLASS_SWITCH_WINDOW_DAYS = 365

async function getClassSwitchWindow(supabase: any, userId: string) {
  const sinceIso = new Date(Date.now() - CLASS_SWITCH_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
  const { data } = await supabase
    .from('class_switch_log')
    .select('created_at')
    .eq('user_id', userId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })

  const used = data?.length || 0
  const remaining = Math.max(0, CLASS_SWITCH_LIMIT - used)
  const nextAvailableAt = used >= CLASS_SWITCH_LIMIT
    ? new Date(new Date(data[0].created_at).getTime() + CLASS_SWITCH_WINDOW_DAYS * 24 * 3600 * 1000).toISOString()
    : null

  return { used, remaining, nextAvailableAt }
}

// GET /api/auth/class-switch-status
auth.get('/class-switch-status', authMiddleware, async (c) => {
  const authUser = c.get('user')
  if (authUser.role !== 'student')
    return c.json<ApiResponse>({ success: false, error: 'Apenas alunos podem trocar de classe' }, 403)

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data: dbUser, error } = await supabase
    .from('users')
    .select('country_code, grade_id')
    .eq('id', authUser.id)
    .single()

  if (error || !dbUser) return c.json<ApiResponse>({ success: false, error: 'Utilizador não encontrado' }, 404)

  const window = await getClassSwitchWindow(supabase, authUser.id)

  return c.json<ApiResponse>({
    success: true,
    data: { country_code: dbUser.country_code, grade_id: dbUser.grade_id, ...window }
  })
})

// POST /api/auth/class-switch
auth.post('/class-switch', authMiddleware, async (c) => {
  const authUser = c.get('user')
  if (authUser.role !== 'student')
    return c.json<ApiResponse>({ success: false, error: 'Apenas alunos podem trocar de classe' }, 403)

  const body = await c.req.json().catch(() => ({}))
  const { country_code, grade_id } = body as { country_code?: string; grade_id?: string }

  if (!country_code || !grade_id || !isValidCountryGrade(country_code, grade_id))
    return c.json<ApiResponse>({ success: false, error: 'País/classe inválidos' }, 400)

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data: dbUser, error: fetchError } = await supabase
    .from('users')
    .select('country_code, grade_id')
    .eq('id', authUser.id)
    .single()

  if (fetchError || !dbUser) return c.json<ApiResponse>({ success: false, error: 'Utilizador não encontrado' }, 404)

  if (dbUser.country_code === country_code && dbUser.grade_id === grade_id)
    return c.json<ApiResponse>({ success: false, error: 'Já estás nessa classe' }, 400)

  const isFirstTimeSet = !dbUser.country_code && !dbUser.grade_id
  const window = await getClassSwitchWindow(supabase, authUser.id)

  if (!isFirstTimeSet && window.remaining <= 0)
    return c.json<ApiResponse>({
      success: false,
      error: 'Limite de trocas de classe atingido (5 por ano)',
      data: { nextAvailableAt: window.nextAvailableAt }
    }, 429)

  const { error: updateError } = await supabase
    .from('users')
    .update({ country_code, grade_id, updated_at: new Date().toISOString() })
    .eq('id', authUser.id)

  if (updateError) return c.json<ApiResponse>({ success: false, error: updateError.message }, 500)

  if (!isFirstTimeSet) {
    await supabase.from('class_switch_log').insert({
      user_id: authUser.id,
      previous_country_code: dbUser.country_code,
      previous_grade_id: dbUser.grade_id,
      new_country_code: country_code,
      new_grade_id: grade_id,
    })
  }

  const remaining = isFirstTimeSet ? window.remaining : Math.max(0, window.remaining - 1)

  return c.json<ApiResponse>({ success: true, data: { country_code, grade_id, remaining } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/change-password
// ═══════════════════════════════════════════════════════════════════════════════
auth.post('/change-password', authMiddleware, async (c) => {
  try {
    const user = c.get('user')

    const body = await c.req.json() as { current_password: string; new_password: string }
    const { current_password, new_password } = body

    if (!current_password || !new_password) {
      return c.json<ApiResponse>({ success: false, error: 'Senha actual e nova senha são obrigatórias' }, 400)
    }
    // Aplicar mesma política de força exigida no registo (≥8 chars, maiúscula, minúscula, dígito)
    const strength = validatePassword(new_password)
    if (!strength.valid) {
      return c.json<ApiResponse>({ success: false, error: strength.message || 'Senha fraca' }, 400)
    }
    if (current_password === new_password) {
      return c.json<ApiResponse>({ success: false, error: 'A nova senha tem de ser diferente da actual' }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      // Demo mode: verificar senha demo
      if (current_password !== DEMO_PASSWORD) {
        return c.json<ApiResponse>({ success: false, error: 'Senha actual incorrecta' }, 400)
      }
      return c.json<ApiResponse>({ success: true, message: 'Demo: senha alterada (simulado)' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    // Buscar hash actual
    const { data: dbUser, error: fetchErr } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .single()

    if (fetchErr || !dbUser) return c.json<ApiResponse>({ success: false, error: 'Utilizador não encontrado' }, 404)

    // Verificar senha actual
    const valid = await verifyPassword(current_password, dbUser.password_hash)
    if (!valid) return c.json<ApiResponse>({ success: false, error: 'Senha actual incorrecta' }, 400)

    // Actualizar hash
    const new_hash = await hashPassword(new_password)

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: new_hash, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateErr) return c.json<ApiResponse>({ success: false, error: updateErr.message }, 500)

    // Após mudar password: invalidar todas as sessões existentes (forçar re-login noutros devices)
    await revokeAllUserTokens(supabase, user.id)

    return c.json<ApiResponse>({ success: true, message: 'Senha alterada com sucesso. Por segurança, faça login novamente nos outros dispositivos.' })
  } catch (e: any) {
    console.error('Change password error:', e)
    return c.json<ApiResponse>({ success: false, error: 'Internal server error' }, 500)
  }
})

export default auth
