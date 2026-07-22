// Support Routes — /api/support/*
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireSupportOrAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { hashPassword } from '../utils/password'
import { revokeAllUserTokens } from '../utils/refreshTokens'
import { mockUsers } from '../middleware/database'
import { COUNTRIES, GRADES } from '../data/curriculum'
import type { ApiResponse } from '../types'

const support = new Hono<{ Bindings: CloudflareBindings }>()

// Todas as rotas requerem autenticação + role support ou admin
support.use('/*', authMiddleware)
support.use('/*', requireSupportOrAdmin)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
}

const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.id, c])) as Record<string, typeof COUNTRIES[number]>
const GRADE_BY_ID = Object.fromEntries(GRADES.map(g => [g.id, g])) as Record<string, typeof GRADES[number]>
const SLA_HOURS: Record<string, number> = { high: 4, medium: 8, low: 24 }
const MANAGED_ROLES = ['student', 'teacher']

function avatarInitials(name?: string | null): string {
  return (name || '??').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function slaRemainingMinutes(createdAt: string, slaHours: number, status: string): number | null {
  if (status === 'resolved') return null
  const deadline = new Date(createdAt).getTime() + slaHours * 3600_000
  return Math.round((deadline - Date.now()) / 60000)
}

function userStatus(u: { is_active: boolean; last_login_at?: string | null }): 'active' | 'inactive' | 'blocked' {
  if (!u.is_active) return 'blocked'
  if (!u.last_login_at) return 'inactive'
  const days = (Date.now() - new Date(u.last_login_at).getTime()) / 86400_000
  return days > 30 ? 'inactive' : 'active'
}

function genTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]
  const all = upper + lower + digits
  let pwd = pick(upper) + pick(lower) + pick(digits)
  for (let i = 0; i < 7; i++) pwd += pick(all)
  return pwd
}

// ═══════════════════════════════════════════════════════════════
//  Dados mock (fallback apenas quando Supabase não está configurado)
// ═══════════════════════════════════════════════════════════════

const MOCK_TICKETS = [
  {
    id: 'TKT-001', user_name: 'Ana Silva', user_email: 'ana.silva@vclass.mz', user_avatar: 'AS',
    subject: 'Vídeo não carrega na aula de Física', category: 'video', priority: 'high', status: 'open',
    created_at: new Date(Date.now() - 1800000).toISOString(), updated_at: new Date(Date.now() - 900000).toISOString(),
    message: 'Quando tento abrir a aula "Cinemática — MRU" o vídeo fica a carregar infinitamente.',
    responses: 0, sla_hours: 4
  },
  {
    id: 'TKT-002', user_name: 'Mário Costa', user_email: 'mario.costa@vclass.ao', user_avatar: 'MC',
    subject: 'Esqueci a senha e não recebo o email de recuperação', category: 'account', priority: 'medium', status: 'in_progress',
    created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString(),
    message: 'Pedi reset de senha 3 vezes mas o email nunca chega.',
    responses: 1, sla_hours: 8
  }
]

function mockAllUsers() {
  return mockUsers
    .filter(u => u.role === 'student')
    .map(u => ({
      id: u.id, name: u.full_name, email: u.email, country: u.country_name, flag: u.country_flag,
      grade: (u as any).grade || '—', status: 'active' as const,
      last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(), created_at: u.created_at
    }))
}

function mockTicketRows() {
  return MOCK_TICKETS.map(t => ({ ...t, sla_remaining_minutes: slaRemainingMinutes(t.created_at, t.sla_hours, t.status) }))
}

// ═══════════════════════════════════════════════════════════════
//  Carregar tickets reais da BD (usado por /stats, /tickets, /tickets/:id)
// ═══════════════════════════════════════════════════════════════
async function loadTicketsFromDb(supabase: any) {
  const { data: rows, error } = await supabase
    .from('support_tickets')
    .select('id, user_id, guest_name, guest_email, subject, message, category, priority, status, sla_hours, created_at, updated_at, resolved_at, users!support_tickets_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const ids = (rows || []).map((r: any) => r.id)
  const responseCounts: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: responses } = await supabase.from('ticket_responses').select('ticket_id').in('ticket_id', ids)
    for (const r of responses || []) responseCounts[r.ticket_id] = (responseCounts[r.ticket_id] || 0) + 1
  }

  return (rows || []).map((row: any) => {
    const userName = row.users?.full_name || row.guest_name || 'Visitante'
    const userEmail = row.users?.email || row.guest_email || '—'
    return {
      id: row.id,
      user_name: userName,
      user_email: userEmail,
      user_avatar: avatarInitials(userName),
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      message: row.message,
      responses: responseCounts[row.id] || 0,
      sla_hours: row.sla_hours,
      sla_remaining_minutes: slaRemainingMinutes(row.created_at, row.sla_hours, row.status)
    }
  })
}

// Tickets reais quando existir pelo menos 1; fictícios enquanto a tabela
// support_tickets estiver vazia (nunca uma mistura dos dois).
async function loadTicketsWithFallback(supabase: any | null): Promise<{ tickets: ReturnType<typeof mockTicketRows>; isFictitious: boolean }> {
  if (!supabase) return { tickets: mockTicketRows(), isFictitious: true }
  const real = await loadTicketsFromDb(supabase)
  return real.length > 0 ? { tickets: real, isFictitious: false } : { tickets: mockTicketRows(), isFictitious: true }
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/stats  —  Métricas gerais
// ═══════════════════════════════════════════════════════════════
support.get('/stats', async (c) => {
  try {
    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
    const { tickets, isFictitious } = await loadTicketsWithFallback(supabase)

    const open       = tickets.filter(t => t.status === 'open').length
    const inProgress = tickets.filter(t => t.status === 'in_progress').length
    const resolved   = tickets.filter(t => t.status === 'resolved').length
    const urgent     = tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length
    const slaBreached = tickets.filter(t => t.sla_remaining_minutes !== null && (t.sla_remaining_minutes ?? 999) < 60 && t.status !== 'resolved').length

    // Tempo médio de resposta: minutos entre a abertura do ticket e a primeira resposta da equipa
    let avgResponse = 18 // valor fictício de referência, só usado enquanto isFictitious
    if (!isFictitious && supabase && tickets.length > 0) {
      const { data: firstResponses } = await supabase
        .from('ticket_responses')
        .select('ticket_id, created_at')
        .eq('author_role', 'support')
        .order('created_at', { ascending: true })
      const firstByTicket: Record<string, string> = {}
      for (const r of firstResponses || []) {
        if (!firstByTicket[r.ticket_id]) firstByTicket[r.ticket_id] = r.created_at
      }
      const ticketById = Object.fromEntries(tickets.map(t => [t.id, t]))
      const diffs = Object.entries(firstByTicket)
        .filter(([id]) => ticketById[id])
        .map(([id, respondedAt]) => (new Date(respondedAt).getTime() - new Date(ticketById[id].created_at).getTime()) / 60000)
      avgResponse = diffs.length > 0 ? Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0
    }

    // Sem sistema de CSAT: usamos a taxa de resolução como proxy honesto de satisfação
    const satisfactionScore = tickets.length > 0 ? Math.round((resolved / tickets.length) * 1000) / 10 : 0

    const byCategory: Record<string, number> = {}
    tickets.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1 })
    const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, count]) => ({ category: cat, count }))

    let totalUsers = 0, activeToday = 0, newThisWeek = 0
    if (supabase) {
      const dayAgo = new Date(Date.now() - 86400_000).toISOString()
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
      const [{ count: total }, { count: active }, { count: newWeek }] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).in('role', MANAGED_ROLES),
        supabase.from('users').select('id', { count: 'exact', head: true }).in('role', MANAGED_ROLES).gte('last_login_at', dayAgo),
        supabase.from('users').select('id', { count: 'exact', head: true }).in('role', MANAGED_ROLES).gte('created_at', weekAgo)
      ])
      totalUsers = total || 0
      activeToday = active || 0
      newThisWeek = newWeek || 0
    } else {
      totalUsers = mockAllUsers().length
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        tickets: { open, in_progress: inProgress, resolved, total: tickets.length },
        urgent,
        sla_breached: slaBreached,
        avg_response_minutes: avgResponse,
        satisfaction_score: satisfactionScore,
        top_categories: topCategories,
        total_users: totalUsers,
        active_today: activeToday,
        new_this_week: newThisWeek,
        is_fictitious: isFictitious
      }
    })
  } catch (e: any) {
    console.error('Support stats error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/tickets  —  Lista de tickets
// ═══════════════════════════════════════════════════════════════
support.get('/tickets', async (c) => {
  try {
    const status   = c.req.query('status')   || 'all'
    const priority = c.req.query('priority') || 'all'
    const category = c.req.query('category') || 'all'
    const search   = c.req.query('search')   || ''

    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
    const { tickets: allTickets, isFictitious } = await loadTicketsWithFallback(supabase)
    let tickets = allTickets

    const stats = {
      open:        tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved:    tickets.filter(t => t.status === 'resolved').length
    }
    const totalAll = tickets.length

    if (status !== 'all')   tickets = tickets.filter(t => t.status   === status)
    if (priority !== 'all') tickets = tickets.filter(t => t.priority === priority)
    if (category !== 'all') tickets = tickets.filter(t => t.category === category)
    if (search) {
      const q = search.toLowerCase()
      tickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.user_name.toLowerCase().includes(q) ||
        t.user_email.toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)
      )
    }

    tickets.sort((a, b) => {
      const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      if (a.status !== 'resolved' && b.status === 'resolved') return -1
      if (a.status === 'resolved' && b.status !== 'resolved') return 1
      return (pOrder[a.priority] - pOrder[b.priority]) ||
        (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })

    return c.json<ApiResponse>({ success: true, data: { tickets, total: totalAll, stats, is_fictitious: isFictitious } })
  } catch (e: any) {
    console.error('Support tickets list error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/tickets/:id  —  Detalhes de um ticket
// ═══════════════════════════════════════════════════════════════
support.get('/tickets/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
    const { tickets, isFictitious } = await loadTicketsWithFallback(supabase)
    const ticket = tickets.find(t => t.id === id)
    if (!ticket) return c.json<ApiResponse>({ success: false, error: 'Ticket não encontrado' }, 404)

    if (isFictitious || !supabase) {
      const thread = [{ author: ticket.user_name, author_role: 'student', avatar: ticket.user_avatar, message: ticket.message, created_at: ticket.created_at }]
      return c.json<ApiResponse>({ success: true, data: { ...ticket, thread, is_fictitious: true } })
    }

    const { data: responses } = await supabase
      .from('ticket_responses')
      .select('id, author_id, author_role, message, is_resolution, created_at, users(full_name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    const thread = [
      { author: ticket.user_name, author_role: 'student', avatar: ticket.user_avatar, message: ticket.message, created_at: ticket.created_at },
      ...(responses || []).map((r: any) => ({
        author: r.author_role === 'support' ? (r.users?.full_name || 'Equipa de Suporte') : (r.users?.full_name || ticket.user_name),
        author_role: r.author_role,
        avatar: avatarInitials(r.users?.full_name || (r.author_role === 'support' ? 'Equipa de Suporte' : ticket.user_name)),
        message: r.message,
        created_at: r.created_at,
        is_resolution: r.is_resolution
      }))
    ]

    return c.json<ApiResponse>({ success: true, data: { ...ticket, thread, is_fictitious: false } })
  } catch (e: any) {
    console.error('Support ticket detail error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/support/tickets/:id  —  Actualizar estado / responder
// ═══════════════════════════════════════════════════════════════
support.patch('/tickets/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as { status?: string; priority?: string; response?: string }
    const agent = c.get('user')

    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
    if (!supabase) {
      return c.json<ApiResponse>({ success: true, data: { id, ...body }, message: 'Ticket actualizado (modo demo)' })
    }

    const { data: existing, error: fetchErr } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle()
    if (fetchErr) return c.json<ApiResponse>({ success: false, error: fetchErr.message }, 500)
    if (!existing) {
      // Ids fictícios (TKT-001, ...) nunca existem na BD real — modo demo, não persiste.
      if (mockTicketRows().some(t => t.id === id)) {
        return c.json<ApiResponse>({ success: true, data: { id, ...body }, message: 'Ticket actualizado (modo demo)' })
      }
      return c.json<ApiResponse>({ success: false, error: 'Ticket não encontrado' }, 404)
    }

    const newStatus = body.status || existing.status
    const newPriority = body.priority || existing.priority
    const updates: any = {
      status: newStatus,
      priority: newPriority,
      updated_at: new Date().toISOString()
    }
    if (body.priority && body.priority !== existing.priority) updates.sla_hours = SLA_HOURS[body.priority] ?? existing.sla_hours
    updates.resolved_at = newStatus === 'resolved' ? new Date().toISOString() : null

    const { error: updateErr } = await supabase.from('support_tickets').update(updates).eq('id', id)
    if (updateErr) return c.json<ApiResponse>({ success: false, error: updateErr.message }, 500)

    if (body.response?.trim()) {
      const { error: replyErr } = await supabase.from('ticket_responses').insert({
        ticket_id: id,
        author_id: agent?.id,
        author_role: 'support',
        message: body.response.trim(),
        is_resolution: newStatus === 'resolved'
      })
      if (replyErr) console.error('Insert ticket response error:', replyErr)
    }

    return c.json<ApiResponse>({ success: true, data: { id, ...updates }, message: 'Ticket actualizado com sucesso' })
  } catch (e: any) {
    console.error('Support ticket update error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/users  —  Lista de utilizadores
// ═══════════════════════════════════════════════════════════════
support.get('/users', async (c) => {
  try {
    const search = c.req.query('search') || ''
    const status = c.req.query('status') || 'all'

    const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null

    if (!supabase) {
      let users = mockAllUsers()
      if (search) { const q = search.toLowerCase(); users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) }
      if (status !== 'all') users = users.filter(u => u.status === status)
      return c.json<ApiResponse>({ success: true, data: { users, total: users.length, stats: { total: users.length, active: users.length, inactive: 0, blocked: 0 } } })
    }

    let query = supabase
      .from('users')
      .select('id, full_name, email, country_code, grade_id, is_active, last_login_at, created_at')
      .in('role', MANAGED_ROLES)
      .order('created_at', { ascending: false })

    if (search) query = query.ilike('full_name', `%${search}%`)

    const { data: rows, error } = await query
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

    let users = (rows || []).map((u: any) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      country: COUNTRY_BY_CODE[u.country_code]?.name || '—',
      flag: COUNTRY_BY_CODE[u.country_code]?.flag || '',
      grade: GRADE_BY_ID[u.grade_id]?.name || '—',
      status: userStatus(u),
      last_seen: u.last_login_at || u.created_at,
      created_at: u.created_at
    }))

    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      blocked: users.filter(u => u.status === 'blocked').length
    }

    if (status !== 'all') users = users.filter(u => u.status === status)

    return c.json<ApiResponse>({ success: true, data: { users, total: users.length, stats } })
  } catch (e: any) {
    console.error('Support users list error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/block  —  Bloquear utilizador
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/block', async (c) => {
  const id = c.req.param('id')
  const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
  if (!supabase) return c.json<ApiResponse>({ success: true, data: { id, status: 'blocked' }, message: 'Utilizador bloqueado (modo demo)' })

  const { error } = await supabase.from('users').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  await revokeAllUserTokens(supabase, id)

  return c.json<ApiResponse>({ success: true, data: { id, status: 'blocked' }, message: 'Utilizador bloqueado' })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/unblock  —  Desbloquear
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/unblock', async (c) => {
  const id = c.req.param('id')
  const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
  if (!supabase) return c.json<ApiResponse>({ success: true, data: { id, status: 'active' }, message: 'Utilizador desbloqueado (modo demo)' })

  const { error } = await supabase.from('users').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: { id, status: 'active' }, message: 'Utilizador desbloqueado' })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/reset-password  —  Reset de senha
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
  if (!supabase) return c.json<ApiResponse>({ success: true, data: { id, temp_password: 'VClass@2025' }, message: 'Senha temporária gerada (modo demo)' })

  const tempPassword = genTempPassword()
  const password_hash = await hashPassword(tempPassword)
  const { error } = await supabase.from('users').update({ password_hash, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  await revokeAllUserTokens(supabase, id)

  return c.json<ApiResponse>({ success: true, data: { id, temp_password: tempPassword }, message: 'Senha temporária gerada' })
})

// Avisos fictícios — mostrados só enquanto a tabela real `announcements`
// estiver vazia (ver migration 025). Assim que existir 1 aviso real enviado,
// deixam de aparecer por completo.
const FICTITIOUS_ANNOUNCEMENTS = [
  { id: 'demo-1', title: 'Manutenção programada', message: 'A plataforma estará em manutenção no sábado das 02h00 às 04h00.', sent_at: new Date(Date.now() - 172800000).toISOString(), audience: 'all', sent_by: 'Equipa de Suporte' },
  { id: 'demo-2', title: 'Novas aulas disponíveis', message: '25 novas aulas de Química para a 11ª Classe foram publicadas.', sent_at: new Date(Date.now() - 432000000).toISOString(), audience: 'students', sent_by: 'Equipa de Suporte' }
]

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/announcements  —  Avisos rápidos para enviar
// ═══════════════════════════════════════════════════════════════
support.get('/announcements', async (c) => {
  const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
  if (!supabase) return c.json<ApiResponse>({ success: true, data: { announcements: FICTITIOUS_ANNOUNCEMENTS, is_fictitious: true } })

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, message, audience, sent_by_name, sent_at')
    .order('sent_at', { ascending: false })
  // Tabela ainda não migrada (ou outro erro de leitura) — trata como "sem
  // avisos reais ainda" em vez de rebentar o painel com um 500.
  if (error) {
    console.error('Support announcements read error (a usar fictício):', error.message)
    return c.json<ApiResponse>({ success: true, data: { announcements: FICTITIOUS_ANNOUNCEMENTS, is_fictitious: true } })
  }

  if (!data || data.length === 0) {
    return c.json<ApiResponse>({ success: true, data: { announcements: FICTITIOUS_ANNOUNCEMENTS, is_fictitious: true } })
  }

  const announcements = data.map((a: any) => ({ id: a.id, title: a.title, message: a.message, audience: a.audience, sent_by: a.sent_by_name, sent_at: a.sent_at }))
  return c.json<ApiResponse>({ success: true, data: { announcements, is_fictitious: false } })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/announcements  —  Enviar aviso
// ═══════════════════════════════════════════════════════════════
support.post('/announcements', async (c) => {
  const body = await c.req.json().catch(() => ({})) as { title?: string; message?: string; audience?: string }
  const agent = c.get('user')

  if (!body.title?.trim() || !body.message?.trim()) {
    return c.json<ApiResponse>({ success: false, error: 'Título e mensagem são obrigatórios' }, 400)
  }

  const supabase = isDatabaseConfigured(c.env) ? getSupabase(c.env) : null
  if (!supabase) {
    return c.json<ApiResponse>({
      success: true,
      data: { id: 'demo-' + Date.now(), ...body, sent_at: new Date().toISOString(), sent_by: agent?.full_name || 'Suporte' },
      message: 'Aviso enviado (modo demo — sem persistência)'
    }, 201)
  }

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: body.title.trim(),
      message: body.message.trim(),
      audience: body.audience || 'all',
      sent_by: agent?.id,
      sent_by_name: agent?.full_name || 'Suporte'
    })
    .select('id, title, message, audience, sent_by_name, sent_at')
    .single()

  if (error || !data) {
    console.error('Support announcement insert error (modo demo):', error?.message)
    return c.json<ApiResponse>({
      success: true,
      data: { id: 'demo-' + Date.now(), ...body, sent_at: new Date().toISOString(), sent_by: agent?.full_name || 'Suporte' },
      message: 'Aviso enviado (modo demo — tabela ainda não migrada)'
    }, 201)
  }

  return c.json<ApiResponse>({
    success: true,
    data: { id: data.id, title: data.title, message: data.message, audience: data.audience, sent_by: data.sent_by_name, sent_at: data.sent_at },
    message: 'Aviso enviado com sucesso'
  }, 201)
})

export default support
