// Teacher Verification Routes (KYT — Know Your Teacher)
// Persistência via Supabase. Migration 006 cria a tabela teacher_applications.
// Aprovação cria automaticamente o utilizador em `users` com role='teacher'.

import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { z } from 'zod'
import { authMiddleware, requireAdmin, rateLimitMiddleware } from '../middleware/auth'
import { hashPassword } from '../utils/password'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'
import {
  sendEmail,
  teacherApplicationReceivedEmail,
  teacherApplicationApprovedEmail,
  teacherApplicationRejectedEmail,
  teacherApplicationInfoRequestedEmail
} from '../utils/email'

const tv = new Hono<{ Bindings: CloudflareBindings }>()

// Rate limiting: 10 candidaturas/hora durante o piloto (apertar para 3 quando entrar em produção)
tv.use('/apply', rateLimitMiddleware(10, 3_600_000))

// ──────────────────────────────────────────────────────────────────────────────
//  Schema da candidatura — preserva o flow multi-etapa do PDF
// ──────────────────────────────────────────────────────────────────────────────
const teacherApplicationSchema = z.object({
  // Dados pessoais
  full_name:    z.string().min(5, 'Nome completo deve ter pelo menos 5 caracteres'),
  email:        z.string().email('Email inválido'),
  phone:        z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  birth_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)'),
  national_id:  z.string().min(6, 'Número do BI/CC é obrigatório'),
  country_id:   z.string().min(2, 'País é obrigatório'),
  province:     z.string().min(2, 'Província é obrigatória'),
  city:         z.string().min(2, 'Cidade é obrigatória'),
  address:      z.string().min(5, 'Endereço é obrigatório'),

  // Qualificações
  degree:             z.enum(['licenciatura', 'mestrado', 'doutoramento', 'bacharel', 'outro']),
  degree_field:       z.string().min(3, 'Área de formação é obrigatória'),
  institution:        z.string().min(3, 'Instituição é obrigatória'),
  // Limite superior conservador (2100). Validação contra ano-actual feita em runtime
  // via .refine() — evitar `new Date().getFullYear()` no schema porque é resolvido
  // a 1970 em cold-starts do Cloudflare Workers.
  graduation_year:    z.number().int().min(1960).max(2100),
  has_teaching_cert:  z.boolean(),
  teaching_cert_type: z.string().optional(),

  // Experiência
  years_experience:   z.number().int().min(0).max(50),
  current_school:     z.string().optional(),
  previous_schools:   z.array(z.string()).optional(),
  teaching_levels:    z.array(z.enum(['primary', 'secondary', 'tertiary'])).min(1, 'Selecione pelo menos um nível'),
  subjects:           z.array(z.string()).min(1).max(5, 'Máximo 5 disciplinas'),
  subjects_other:     z.string().optional(),

  // Motivação & referências
  motivation_letter:  z.string().min(200, 'Carta de motivação ≥ 200 caracteres').max(2000),
  reference_1_name:   z.string().min(3),
  reference_1_phone:  z.string().min(9),
  reference_1_role:   z.string().min(2),
  reference_2_name:   z.string().optional(),
  reference_2_phone:  z.string().optional(),

  // Competências digitais
  digital_literacy:   z.enum(['basico', 'intermedio', 'avancado']),
  has_computer:       z.boolean(),
  has_internet:       z.boolean(),
  available_hours:    z.number().int().min(1).max(40),
  preferred_schedule: z.enum(['manha', 'tarde', 'noite', 'flexivel']),

  // Credenciais
  password:           z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirm_password:   z.string(),

  // Documentos (workaround piloto: link Drive na carta)
  documents_link:     z.string().url('Link dos documentos deve ser uma URL válida').optional()
})
  .refine(d => d.password === d.confirm_password, { message: 'As senhas não coincidem', path: ['confirm_password'] })
  .refine(d => {
    const birth = new Date(d.birth_date)
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
    return age >= 21
  }, { message: 'É necessário ter pelo menos 21 anos para se candidatar', path: ['birth_date'] })
  .refine(d => {
    // Ano de conclusão não pode estar no futuro (calculado em runtime, não em load)
    const currentYear = new Date().getFullYear()
    return d.graduation_year <= Math.max(currentYear, 2025)
  }, { message: 'Ano de conclusão não pode estar no futuro', path: ['graduation_year'] })

// Validação de força de senha (≥8, maiús, min, dígito, especial)
function validatePasswordStrict(pwd: string): { valid: boolean; message: string } {
  if (pwd.length < 8) return { valid: false, message: 'Senha deve ter ≥ 8 caracteres' }
  if (!/[A-Z]/.test(pwd)) return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' }
  if (!/[a-z]/.test(pwd)) return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' }
  if (!/[0-9]/.test(pwd)) return { valid: false, message: 'Senha deve conter pelo menos um número' }
  if (!/[^A-Za-z0-9]/.test(pwd)) return { valid: false, message: 'Senha deve conter pelo menos um carácter especial (!@#$%...)' }
  return { valid: true, message: 'OK' }
}

// Auto-scoring (mantém o algoritmo original)
function autoScoreApplication(app: any): number {
  let score = 0
  const degreeScore: Record<string, number> = { doutoramento: 30, mestrado: 25, licenciatura: 20, bacharel: 12, outro: 5 }
  score += degreeScore[app.degree] || 0
  score += Math.min((app.years_experience || 0) * 2, 20)
  if (app.has_teaching_cert) score += 15
  const digScore: Record<string, number> = { avancado: 10, intermedio: 6, basico: 2 }
  score += digScore[app.digital_literacy] || 0
  if (app.has_computer) score += 5
  if (app.has_internet) score += 5
  const letterLen = (app.motivation_letter || '').length
  if (letterLen >= 800) score += 10
  else if (letterLen >= 500) score += 7
  else if (letterLen >= 200) score += 4
  if (app.available_hours >= 10) score += 5
  else if (app.available_hours >= 5) score += 3
  return Math.min(score, 100)
}

// ──────────────────────────────────────────────────────────────────────────────
//  POST /apply — submeter candidatura
// ──────────────────────────────────────────────────────────────────────────────
tv.post('/apply', async (c) => {
  try {
    const body = await c.req.json()
    const validation = teacherApplicationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return c.json<ApiResponse>({
        success: false,
        error: firstError.message,
        data: { field: firstError.path.join('.'), all_errors: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) }
      }, 400)
    }

    const data = validation.data

    const pwdCheck = validatePasswordStrict(data.password)
    if (!pwdCheck.valid) {
      return c.json<ApiResponse>({ success: false, error: pwdCheck.message }, 400)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)
    }

    // Verificar se já existe candidatura ou utilizador com este email
    const [{ data: existingApp }, { data: existingUser }] = await Promise.all([
      supabase.from('teacher_applications').select('id, status').eq('email', data.email).maybeSingle(),
      supabase.from('users').select('id').eq('email', data.email).maybeSingle()
    ])

    if (existingApp) {
      return c.json<ApiResponse>({
        success: false,
        error: `Já existe uma candidatura com este email (estado: ${existingApp.status}). Acompanhe em /teacher-verification.html?email=${encodeURIComponent(data.email)}`
      }, 409)
    }
    if (existingUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Email já registado como utilizador. Use uma conta diferente para candidatar-se como professor.'
      }, 409)
    }

    // Hash da password — guardada para criar utilizador na aprovação
    const password_hash = await hashPassword(data.password)

    // Score automático
    const score = autoScoreApplication(data)
    const flagged = score < 40 || !data.has_computer || !data.has_internet

    const { data: inserted, error } = await supabase
      .from('teacher_applications')
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        birth_date: data.birth_date,
        national_id: data.national_id,
        country_id: data.country_id,
        province: data.province,
        city: data.city,
        address: data.address,
        degree: data.degree,
        degree_field: data.degree_field,
        institution: data.institution,
        graduation_year: data.graduation_year,
        has_teaching_cert: data.has_teaching_cert,
        teaching_cert_type: data.teaching_cert_type || null,
        years_experience: data.years_experience,
        current_school: data.current_school || null,
        previous_schools: data.previous_schools || [],
        teaching_levels: data.teaching_levels,
        subjects: data.subjects,
        subjects_other: data.subjects_other || null,
        motivation_letter: data.motivation_letter,
        reference_1_name: data.reference_1_name,
        reference_1_phone: data.reference_1_phone,
        reference_1_role: data.reference_1_role,
        reference_2_name: data.reference_2_name || null,
        reference_2_phone: data.reference_2_phone || null,
        digital_literacy: data.digital_literacy,
        has_computer: data.has_computer,
        has_internet: data.has_internet,
        available_hours: data.available_hours,
        preferred_schedule: data.preferred_schedule,
        password_hash,
        documents_link: data.documents_link || null,
        score,
        flagged,
        status: 'pending',
        verification_step: 'initial_screening'
      })
      .select('id')
      .single()

    if (error || !inserted) {
      console.error('Teacher apply error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Falha ao registar candidatura'
      }, 500)
    }

    console.log(`[KYT] Nova candidatura ${inserted.id} de ${data.email} (score ${score}${flagged ? ', flagged' : ''})`)

    const receivedEmail = teacherApplicationReceivedEmail(data.full_name)
    const emailResult = await sendEmail(c.env, { to: data.email, ...receivedEmail })

    return c.json<ApiResponse>({
      success: true,
      data: {
        application_id: inserted.id,
        status: 'pending',
        estimated_review_days: 5,
        tracking_email: data.email,
        score_preview: score >= 60 ? 'Perfil promissor' : score >= 40 ? 'Perfil a avaliar' : 'Perfil com lacunas — pode ser contactado para esclarecimentos',
        email_sent: emailResult.ok
      },
      message: 'A sua candidatura foi recebida. Após a revisão das suas qualificações, receberá um email com a decisão final. Será contactado em até 5 dias úteis.'
    }, 201)
  } catch (err: any) {
    console.error('Teacher apply error:', err)
    return c.json<ApiResponse>({ success: false, error: 'Erro interno do servidor' }, 500)
  }
})

// ──────────────────────────────────────────────────────────────────────────────
//  GET /status/:email — tracking público da candidatura
// ──────────────────────────────────────────────────────────────────────────────
tv.get('/status/:email', async (c) => {
  const email = decodeURIComponent(c.req.param('email'))
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const { data: app } = await supabase
    .from('teacher_applications')
    .select('id, full_name, email, status, verification_step, submitted_at, score, flagged, approved_at, rejected_at, rejection_reason, allow_reapply, reapply_after_months, documents_submitted')
    .eq('email', email)
    .maybeSingle()

  if (!app) {
    return c.json<ApiResponse>({ success: false, error: 'Nenhuma candidatura encontrada com este email' }, 404)
  }

  const stepLabels: Record<string, string> = {
    initial_screening: 'Triagem inicial',
    document_review:   'Revisão de documentos',
    reference_check:   'Verificação de referências',
    interview:         'Entrevista de validação',
    final_review:      'Revisão final',
    completed:         'Processo concluído'
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...app,
      step_label: stepLabels[app.verification_step] || app.verification_step,
      estimated_days_remaining: app.status === 'pending' ? 5 : app.status === 'under_review' ? 2 : 0
    }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
//  GET /applications — listar (admin)
// ──────────────────────────────────────────────────────────────────────────────
tv.get('/applications', authMiddleware, requireAdmin, async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const status  = c.req.query('status')  || 'all'
  const country = c.req.query('country') || 'all'
  const flagged = c.req.query('flagged')
  const search  = (c.req.query('search') || '').toLowerCase()
  const page    = parseInt(c.req.query('page') || '1')
  const limit   = Math.min(parseInt(c.req.query('limit') || '10'), 50)

  let q = supabase.from('teacher_applications').select(
    'id, user_id, full_name, email, phone, country_id, degree, degree_field, years_experience, subjects, has_teaching_cert, digital_literacy, status, verification_step, submitted_at, score, flagged, admin_notes, documents_submitted, documents_link',
    { count: 'exact' }
  )
  if (status  !== 'all' && status !== 'inactive') q = q.eq('status', status)
  if (country !== 'all') q = q.eq('country_id', country)
  if (flagged === 'true') q = q.eq('flagged', true)
  if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  q = q.order('submitted_at', { ascending: false }).range((page - 1) * limit, page * limit - 1)

  const { data: appsRaw, count, error } = await q
  if (error) {
    console.error('TV list error:', error)
    return c.json<ApiResponse>({ success: false, error: 'Falha ao listar' }, 500)
  }
  // status='inactive' não existe em teacher_applications (é só para contas directas) — não devolver candidaturas reais nesse filtro
  const apps = status === 'inactive' ? [] : (appsRaw || [])

  // ── Contas de professor criadas sem passar pelo KYT (promoção manual via
  // Utilizadores, ou dados legados) — "quem já está a trabalhar no sistema
  // é porque já foi aprovado". Mostradas na mesma tabela como source:'direct_account'.
  const { data: allApplicationLinks } = await supabase.from('teacher_applications').select('user_id')
  const linkedUserIds = new Set((allApplicationLinks || []).map((a: any) => a.user_id).filter(Boolean))

  const { data: teacherUsers } = await supabase
    .from('users')
    .select('id, full_name, email, phone, country_code, is_active, created_at')
    .eq('role', 'teacher')

  let directAccounts = (teacherUsers || [])
    .filter((u: any) => !linkedUserIds.has(u.id))
    .map((u: any) => ({
      id: `user-${u.id}`,
      user_id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      country_id: u.country_code || null,
      degree: null, degree_field: null, years_experience: null, subjects: [],
      has_teaching_cert: false, digital_literacy: null,
      status: u.is_active ? 'approved' : 'inactive',
      verification_step: 'completed',
      submitted_at: u.created_at,
      score: null, flagged: false, admin_notes: '', documents_submitted: [], documents_link: null,
      source: 'direct_account'
    }))

  // Aplicar os mesmos filtros que a query acima aplica às candidaturas reais
  if (status  !== 'all') directAccounts = directAccounts.filter((a: any) => a.status === status)
  if (country !== 'all') directAccounts = directAccounts.filter((a: any) => a.country_id === country)
  if (flagged === 'true') directAccounts = []  // contas directas nunca são sinalizáveis
  if (search) directAccounts = directAccounts.filter((a: any) =>
    a.full_name?.toLowerCase().includes(search) || a.email?.toLowerCase().includes(search))

  const merged = [...apps, ...directAccounts]
    .sort((a: any, b: any) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, limit)

  // Stats globais (candidaturas reais + contas directas)
  const { data: statsRows } = await supabase.from('teacher_applications').select('status, flagged')
  const all = statsRows || []
  const activeDirect = (teacherUsers || []).filter((u: any) => !linkedUserIds.has(u.id) && u.is_active).length
  const inactiveDirect = (teacherUsers || []).filter((u: any) => !linkedUserIds.has(u.id) && !u.is_active).length
  const stats = {
    total: all.length + activeDirect + inactiveDirect,
    pending:        all.filter(a => a.status === 'pending').length,
    under_review:   all.filter(a => a.status === 'under_review').length,
    approved:       all.filter(a => a.status === 'approved').length + activeDirect,
    rejected:       all.filter(a => a.status === 'rejected').length,
    info_requested: all.filter(a => a.status === 'info_requested').length,
    flagged:        all.filter(a => a.flagged).length,
    direct_accounts: activeDirect + inactiveDirect
  }

  return c.json<ApiResponse>({
    success: true,
    data: { applications: merged, total: (count || 0) + directAccounts.length, page, limit, pages: Math.ceil(((count || 0) + directAccounts.length) / limit), stats }
  })
})

// ──────────────────────────────────────────────────────────────────────────────
//  GET /applications/:id — detalhe (admin)
// ──────────────────────────────────────────────────────────────────────────────
tv.get('/applications/:id', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const { data: app, error } = await supabase
    .from('teacher_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !app) {
    return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)
  }

  // Nunca retornar password_hash
  delete (app as any).password_hash
  return c.json<ApiResponse>({ success: true, data: app })
})

// ──────────────────────────────────────────────────────────────────────────────
//  PATCH /applications/:id/review — alterar status / step / notas (admin)
// ──────────────────────────────────────────────────────────────────────────────
tv.patch('/applications/:id/review', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const body = await c.req.json() as { status?: string; verification_step?: string; admin_notes?: string; score?: number; flagged?: boolean }
  const update: any = {}
  if (body.status)            update.status = body.status
  if (body.verification_step) update.verification_step = body.verification_step
  if (body.admin_notes !== undefined) update.admin_notes = body.admin_notes
  if (body.score !== undefined)       update.score = body.score
  if (body.flagged !== undefined)     update.flagged = body.flagged

  if (Object.keys(update).length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'Nada para actualizar' }, 400)
  }

  const { data, error } = await supabase
    .from('teacher_applications')
    .update(update)
    .eq('id', id)
    .select('id, status, verification_step, score')
    .maybeSingle()

  if (error || !data) {
    return c.json<ApiResponse>({ success: false, error: error?.message || 'Candidatura não encontrada' }, 404)
  }

  return c.json<ApiResponse>({ success: true, data, message: 'Candidatura actualizada' })
})

// ──────────────────────────────────────────────────────────────────────────────
//  POST /applications/:id/approve (admin)
//  → cria conta de utilizador com role=teacher e password do candidato
// ──────────────────────────────────────────────────────────────────────────────
tv.post('/applications/:id/approve', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const admin = c.get('user')
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const body = await c.req.json().catch(() => ({})) as { notes?: string }

  // Buscar candidatura completa (incluindo password_hash)
  const { data: app, error: fetchErr } = await supabase
    .from('teacher_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !app) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)
  if (app.status === 'approved') return c.json<ApiResponse>({ success: false, error: 'Candidatura já aprovada' }, 409)

  // Resolver country_id: candidatura guarda código ("mz"), users espera UUID (FK).
  // Procurar UUID em countries.code; null se não encontrar (não bloqueia aprovação).
  let countryUuid: string | null = null
  if (app.country_id) {
    const { data: countryRow } = await supabase
      .from('countries')
      .select('id')
      .eq('code', app.country_id)
      .maybeSingle()
    countryUuid = countryRow?.id || null
  }

  // Verificar se utilizador já existe (email duplicado)
  const { data: dupUser } = await supabase.from('users').select('id').eq('email', app.email).maybeSingle()
  let userId: string

  if (dupUser) {
    userId = dupUser.id
    const { error: updErr } = await supabase
      .from('users')
      .update({ role: 'teacher', is_verified: true, full_name: app.full_name, country_id: countryUuid, phone: app.phone })
      .eq('id', userId)
    if (updErr) {
      return c.json<ApiResponse>({ success: false, error: 'Falha ao promover utilizador existente: ' + updErr.message }, 500)
    }
  } else {
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        email: app.email,
        password_hash: app.password_hash,
        full_name: app.full_name,
        role: 'teacher',
        country_id: countryUuid,
        phone: app.phone,
        is_active: true,
        is_verified: true
      })
      .select('id')
      .single()

    if (insertErr || !newUser) {
      console.error('Approve insert user error:', insertErr)
      return c.json<ApiResponse>({ success: false, error: 'Falha ao criar conta do utilizador: ' + (insertErr?.message || '?') }, 500)
    }
    userId = newUser.id
  }

  // Atualizar candidatura
  const score = app.score || autoScoreApplication(app)
  const { error: updErr } = await supabase
    .from('teacher_applications')
    .update({
      status: 'approved',
      verification_step: 'completed',
      approved_at: new Date().toISOString(),
      approved_by: admin.full_name || admin.email,
      user_id: userId,
      score,
      ...(body.notes ? { admin_notes: body.notes } : {})
    })
    .eq('id', id)

  if (updErr) {
    console.error('Approve update error:', updErr)
    return c.json<ApiResponse>({ success: false, error: 'Conta criada mas falhou actualizar candidatura: ' + updErr.message }, 500)
  }

  console.log(`[KYT] Aprovada candidatura ${id} → user ${userId} (${app.email})`)

  const approvedEmail = teacherApplicationApprovedEmail(app.full_name, app.email)
  const emailResult = await sendEmail(c.env, { to: app.email, ...approvedEmail })

  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'approved', user_id: userId, score, login_email: app.email, email_sent: emailResult.ok },
    message: `Professor ${app.full_name} aprovado. Conta criada — pode fazer login com email + senha que registou na candidatura.`
  })
})

// ──────────────────────────────────────────────────────────────────────────────
//  POST /applications/:id/reject (admin)
// ──────────────────────────────────────────────────────────────────────────────
tv.post('/applications/:id/reject', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const admin = c.get('user')
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const body = await c.req.json() as { reason: string; allow_reapply?: boolean; reapply_after_months?: number }
  if (!body.reason) return c.json<ApiResponse>({ success: false, error: 'Motivo de rejeição é obrigatório' }, 400)

  const { data, error } = await supabase
    .from('teacher_applications')
    .update({
      status: 'rejected',
      verification_step: 'completed',
      rejected_at: new Date().toISOString(),
      rejected_by: admin.full_name || admin.email,
      rejection_reason: body.reason,
      allow_reapply: body.allow_reapply !== false,
      reapply_after_months: body.reapply_after_months || 6
    })
    .eq('id', id)
    .select('id, full_name, email, status, rejected_at, rejection_reason, allow_reapply, reapply_after_months')
    .maybeSingle()

  if (error || !data) {
    return c.json<ApiResponse>({ success: false, error: error?.message || 'Candidatura não encontrada' }, 404)
  }

  console.log(`[KYT] Rejeitada candidatura ${id} (motivo: ${body.reason})`)

  const rejectedEmail = teacherApplicationRejectedEmail(data.full_name, data.rejection_reason || body.reason, !!data.allow_reapply, data.reapply_after_months || 6)
  const emailResult = await sendEmail(c.env, { to: data.email, ...rejectedEmail })

  return c.json<ApiResponse>({
    success: true,
    data: { ...data, email_sent: emailResult.ok },
    message: `Candidatura de ${data.full_name} rejeitada. ${data.allow_reapply ? `Pode candidatar-se novamente após ${data.reapply_after_months} meses.` : 'Nova candidatura não permitida.'}`
  })
})

// ──────────────────────────────────────────────────────────────────────────────
//  POST /applications/:id/request-info (admin)
// ──────────────────────────────────────────────────────────────────────────────
tv.post('/applications/:id/request-info', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const body = await c.req.json() as { message: string; required_documents?: string[] }
  if (!body.message) return c.json<ApiResponse>({ success: false, error: 'Mensagem é obrigatória' }, 400)

  const { data, error } = await supabase
    .from('teacher_applications')
    .update({
      status: 'info_requested',
      info_request_message: body.message,
      required_documents: body.required_documents || [],
      info_requested_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, status, full_name, email')
    .maybeSingle()

  if (error || !data) {
    return c.json<ApiResponse>({ success: false, error: error?.message || 'Candidatura não encontrada' }, 404)
  }

  console.log(`[KYT] Pedido de info ${id} para ${data.email}: ${body.message}`)

  const infoEmail = teacherApplicationInfoRequestedEmail(data.full_name, body.message, body.required_documents || [])
  const emailResult = await sendEmail(c.env, { to: data.email, ...infoEmail })

  return c.json<ApiResponse>({ success: true, data: { ...data, email_sent: emailResult.ok }, message: 'Pedido de informação registado' })
})

// ──────────────────────────────────────────────────────────────────────────────
//  GET /stats (admin) — estatísticas globais
// ──────────────────────────────────────────────────────────────────────────────
tv.get('/stats', authMiddleware, requireAdmin, async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const { data: apps } = await supabase
    .from('teacher_applications')
    .select('status, country_id, degree, score, flagged')

  const all = apps || []
  const byCountry = all.reduce((acc: any, a: any) => { acc[a.country_id] = (acc[a.country_id] || 0) + 1; return acc }, {})
  const byDegree  = all.reduce((acc: any, a: any) => { acc[a.degree]     = (acc[a.degree]     || 0) + 1; return acc }, {})
  const scored    = all.filter((a: any) => typeof a.score === 'number')
  const avgScore  = scored.length ? scored.reduce((s: number, a: any) => s + a.score, 0) / scored.length : 0
  const approved  = all.filter((a: any) => a.status === 'approved').length

  return c.json<ApiResponse>({
    success: true,
    data: {
      total:          all.length,
      pending:        all.filter((a: any) => a.status === 'pending').length,
      under_review:   all.filter((a: any) => a.status === 'under_review').length,
      approved,
      rejected:       all.filter((a: any) => a.status === 'rejected').length,
      info_requested: all.filter((a: any) => a.status === 'info_requested').length,
      flagged:        all.filter((a: any) => a.flagged).length,
      avg_score:      Math.round(avgScore * 10) / 10,
      by_country:     byCountry,
      by_degree:      byDegree,
      approval_rate:  all.length ? Math.round((approved / all.length) * 100) : 0
    }
  })
})

// Re-export para compat com pages que importavam mockTeacherApplications (vazio agora)
export const mockTeacherApplications: any[] = []

export default tv
