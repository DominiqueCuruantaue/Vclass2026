// Moderator Routes — /api/moderator/*
// Moderação de chat, comentários e comunidade
import { Hono } from 'hono'
import { authMiddleware, requireModeratorOrAdmin } from '../middleware/auth'
import type { ApiResponse } from '../types'

const moderator = new Hono()
moderator.use('/*', authMiddleware)
moderator.use('/*', requireModeratorOrAdmin)

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_REPORTS = [
  {
    id: 'rep-001', type: 'chat', category: 'inappropriate',
    reporter: 'Ana Silva', reporter_email: 'ana.silva@vclass.mz',
    reported_user: 'user_xyz', reported_content: 'Este conteúdo é inadequado para o contexto escolar.',
    context: 'Chat geral — sala Matemática 12ª Classe',
    status: 'pending', priority: 'high',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    lesson_id: null, chat_room: 'math-12'
  },
  {
    id: 'rep-002', type: 'comment', category: 'spam',
    reporter: 'Prof. Carlos', reporter_email: 'prof.carlos@vclass.mz',
    reported_user: 'spammer_99', reported_content: 'Clique aqui para ganhar créditos grátis!!!',
    context: 'Comentário na aula — Funções do 2º Grau',
    status: 'pending', priority: 'medium',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    lesson_id: 'les-math-01', chat_room: null
  },
  {
    id: 'rep-003', type: 'chat', category: 'harassment',
    reporter: 'Mário Costa', reporter_email: 'mario.costa@vclass.ao',
    reported_user: 'bully_user', reported_content: 'Mensagem ofensiva dirigida a outro estudante.',
    context: 'Chat privado — sala Angola Física',
    status: 'in_review', priority: 'high',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    lesson_id: null, chat_room: 'physics-ao'
  },
  {
    id: 'rep-004', type: 'comment', category: 'off_topic',
    reporter: 'Sara Chissano', reporter_email: 'sara@vclass.mz',
    reported_user: 'troll_001', reported_content: 'Comentário completamente fora do assunto académico.',
    context: 'Comentário na aula — Cinemática',
    status: 'resolved', priority: 'low',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    lesson_id: 'les-phys-02', chat_room: null,
    resolution: 'removed', resolved_at: new Date(Date.now() - 82800000).toISOString()
  },
  {
    id: 'rep-005', type: 'chat', category: 'inappropriate',
    reporter: 'Pedro Mateus', reporter_email: 'pedro@vclass.pt',
    reported_user: 'anon_user_12', reported_content: 'Partilha de material externo não autorizado.',
    context: 'Chat geral — sala Portugal Química',
    status: 'pending', priority: 'medium',
    created_at: new Date(Date.now() - 10800000).toISOString(),
    lesson_id: null, chat_room: 'chem-pt'
  },
]

const MOCK_CHAT_MESSAGES = [
  { id: 'msg-001', room: 'math-12',   user: 'estudante_a', content: 'Alguém pode explicar a regra da cadeia?', flagged: false, timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'msg-002', room: 'math-12',   user: 'user_xyz',    content: 'Este conteúdo é inadequado…',              flagged: true,  timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'msg-003', room: 'physics-ao',user: 'mario.costa', content: 'Qual é a diferença entre velocidade e aceleração?', flagged: false, timestamp: new Date(Date.now() - 900000).toISOString() },
  { id: 'msg-004', room: 'physics-ao',user: 'bully_user',  content: 'Mensagem ofensiva…',                       flagged: true,  timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'msg-005', room: 'general',   user: 'spammer_99',  content: 'Clique aqui para ganhar créditos grátis!!!',flagged: true,  timestamp: new Date(Date.now() - 3600000).toISOString() },
]

const MOCK_BANNED_USERS = [
  { id: 'ban-001', user: 'spammer_99',  email: 'spam@external.com', reason: 'Spam repetido', banned_at: new Date(Date.now() - 86400000 * 3).toISOString(), expires_at: new Date(Date.now() + 86400000 * 27).toISOString(), permanent: false },
  { id: 'ban-002', user: 'bully_user',  email: 'bully@fake.com',    reason: 'Assédio a outros utilizadores', banned_at: new Date(Date.now() - 86400000).toISOString(), expires_at: null, permanent: true },
]

const MOCK_ANNOUNCEMENTS_MOD = [
  { id: 'ann-m001', title: 'Regras de Conduta Actualizadas', message: 'Lembramos que a plataforma exige respeito mútuo.', audience: 'all', sent_at: new Date(Date.now() - 86400000 * 5).toISOString(), sent_by: 'Tânia Bila' },
  { id: 'ann-m002', title: 'Aviso: uso inapropriado do chat', message: 'Detectámos mensagens fora das normas. Contas suspensas.', audience: 'all', sent_at: new Date(Date.now() - 86400000 * 2).toISOString(), sent_by: 'Tânia Bila' },
]

// ── GET /api/moderator/stats ─────────────────────────────────────────────────
moderator.get('/stats', (c) => {
  const pending = MOCK_REPORTS.filter(r => r.status === 'pending').length
  const in_review = MOCK_REPORTS.filter(r => r.status === 'in_review').length
  const resolved_today = MOCK_REPORTS.filter(r =>
    r.status === 'resolved' && r.created_at > new Date(Date.now() - 86400000).toISOString()
  ).length
  const flagged_messages = MOCK_CHAT_MESSAGES.filter(m => m.flagged).length

  return c.json<ApiResponse>({
    success: true,
    data: {
      reports: {
        pending,
        in_review,
        resolved_today,
        total: MOCK_REPORTS.length,
        high_priority: MOCK_REPORTS.filter(r => r.priority === 'high' && r.status !== 'resolved').length
      },
      chat: {
        flagged_messages,
        active_rooms: 12,
        messages_today: 847,
        banned_users: MOCK_BANNED_USERS.length
      },
      actions_taken: {
        total: 143,
        this_week: 18,
        removals: 67,
        warnings: 54,
        bans: 22
      }
    }
  })
})

// ── GET /api/moderator/reports ────────────────────────────────────────────────
moderator.get('/reports', (c) => {
  const status = c.req.query('status')
  const type = c.req.query('type')
  let reports = [...MOCK_REPORTS]
  if (status && status !== 'all') reports = reports.filter(r => r.status === status)
  if (type   && type   !== 'all') reports = reports.filter(r => r.type   === type)
  reports.sort((a, b) => {
    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return pOrder[a.priority] - pOrder[b.priority]
  })
  return c.json<ApiResponse>({ success: true, data: { reports, total: reports.length } })
})

// ── GET /api/moderator/reports/:id ───────────────────────────────────────────
moderator.get('/reports/:id', (c) => {
  const id = c.req.param('id')
  const report = MOCK_REPORTS.find(r => r.id === id)
  if (!report) return c.json<ApiResponse>({ success: false, error: 'Relatório não encontrado' }, 404)
  return c.json<ApiResponse>({ success: true, data: report })
})

// ── PATCH /api/moderator/reports/:id ─────────────────────────────────────────
moderator.patch('/reports/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json<ApiResponse>({
    success: true,
    message: `Relatório ${id} actualizado para "${body.status}"`,
    data: { id, ...body, updated_at: new Date().toISOString() }
  })
})

// ── POST /api/moderator/reports/:id/resolve ───────────────────────────────────
moderator.post('/reports/:id/resolve', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  return c.json<ApiResponse>({
    success: true,
    message: `Relatório ${id} resolvido`,
    data: { id, status: 'resolved', resolution: (body as any).action || 'warning', resolved_at: new Date().toISOString() }
  })
})

// ── GET /api/moderator/messages ───────────────────────────────────────────────
moderator.get('/messages', (c) => {
  const flagged = c.req.query('flagged')
  let messages = [...MOCK_CHAT_MESSAGES]
  if (flagged === 'true') messages = messages.filter(m => m.flagged)
  return c.json<ApiResponse>({ success: true, data: { messages, total: messages.length } })
})

// ── DELETE /api/moderator/messages/:id ───────────────────────────────────────
moderator.delete('/messages/:id', (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({ success: true, message: `Mensagem ${id} removida`, data: { id, deleted: true } })
})

// ── GET /api/moderator/banned ─────────────────────────────────────────────────
moderator.get('/banned', (c) => {
  return c.json<ApiResponse>({ success: true, data: { banned: MOCK_BANNED_USERS, total: MOCK_BANNED_USERS.length } })
})

// ── POST /api/moderator/ban ────────────────────────────────────────────────────
moderator.post('/ban', async (c) => {
  const body = await c.req.json()
  const newBan = {
    id: `ban-${Date.now()}`,
    user: (body as any).user,
    email: (body as any).email,
    reason: (body as any).reason,
    banned_at: new Date().toISOString(),
    expires_at: (body as any).permanent ? null : new Date(Date.now() + 86400000 * ((body as any).days || 7)).toISOString(),
    permanent: !!(body as any).permanent
  }
  return c.json<ApiResponse>({ success: true, message: `Utilizador banido`, data: newBan })
})

// ── DELETE /api/moderator/ban/:id ─────────────────────────────────────────────
moderator.delete('/ban/:id', (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({ success: true, message: `Ban ${id} levantado`, data: { id, unbanned: true } })
})

// ── POST /api/moderator/warn ──────────────────────────────────────────────────
moderator.post('/warn', async (c) => {
  const body = await c.req.json()
  return c.json<ApiResponse>({
    success: true,
    message: `Aviso enviado a ${(body as any).user}`,
    data: { warned: true, user: (body as any).user, message: (body as any).message, sent_at: new Date().toISOString() }
  })
})

// ── GET /api/moderator/announcements ─────────────────────────────────────────
moderator.get('/announcements', (c) => {
  return c.json<ApiResponse>({ success: true, data: { announcements: MOCK_ANNOUNCEMENTS_MOD } })
})

// ── POST /api/moderator/announcements ────────────────────────────────────────
moderator.post('/announcements', async (c) => {
  const body = await c.req.json()
  const user = c.get('user')
  const newAnn = {
    id: `ann-m${Date.now()}`,
    title: (body as any).title,
    message: (body as any).message,
    audience: (body as any).audience || 'all',
    sent_at: new Date().toISOString(),
    sent_by: user?.full_name || 'Moderador'
  }
  return c.json<ApiResponse>({ success: true, message: 'Comunicado enviado', data: newAnn })
})

export default moderator
