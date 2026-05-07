// Support Routes — /api/support/*
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireSupportOrAdmin } from '../middleware/auth'
import { mockUsers } from '../middleware/database'
import type { ApiResponse } from '../types'

const support = new Hono<{ Bindings: CloudflareBindings }>()

// Todas as rotas requerem autenticação + role support ou admin
support.use('/*', authMiddleware)
support.use('/*', requireSupportOrAdmin)

// ═══════════════════════════════════════════════════════════════
//  Dados mock de suporte (substitui DB enquanto Supabase não estiver configurado)
// ═══════════════════════════════════════════════════════════════

const MOCK_TICKETS = [
  {
    id: 'TKT-001',
    user_name: 'Ana Silva',
    user_email: 'ana.silva@vclass.mz',
    user_avatar: 'AS',
    subject: 'Vídeo não carrega na aula de Física',
    category: 'player',
    priority: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 1800000).toISOString(),  // 30 min atrás
    updated_at: new Date(Date.now() - 900000).toISOString(),
    message: 'Quando tento abrir a aula "Cinemática — MRU" o vídeo fica a carregar infinitamente. Já tentei no Chrome e no Firefox.',
    responses: 0,
    sla_hours: 4,
    sla_remaining_minutes: 210
  },
  {
    id: 'TKT-002',
    user_name: 'Mário Costa',
    user_email: 'mario.costa@vclass.ao',
    user_avatar: 'MC',
    subject: 'Esqueci a senha e não recebo o email de recuperação',
    category: 'account',
    priority: 'medium',
    status: 'in_progress',
    created_at: new Date(Date.now() - 7200000).toISOString(),  // 2 h atrás
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    message: 'Pedi reset de senha 3 vezes mas o email nunca chega. Já verifiquei spam.',
    responses: 1,
    sla_hours: 8,
    sla_remaining_minutes: 360
  },
  {
    id: 'TKT-003',
    user_name: 'Beatriz Lopes',
    user_email: 'beatriz.lopes@estudante.ao',
    user_avatar: 'BL',
    subject: 'Exercício marcado como errado mas a resposta está certa',
    category: 'exercises',
    priority: 'medium',
    status: 'open',
    created_at: new Date(Date.now() - 10800000).toISOString(), // 3 h atrás
    updated_at: new Date(Date.now() - 10800000).toISOString(),
    message: 'No exercício 3 do capítulo "Funções Quadráticas" a opção B é a correta mas o sistema diz que é errada.',
    responses: 0,
    sla_hours: 8,
    sla_remaining_minutes: 60
  },
  {
    id: 'TKT-004',
    user_name: 'João Manuel',
    user_email: 'joao.manuel@estudante.mz',
    user_avatar: 'JM',
    subject: 'Não consigo fazer download do material PDF',
    category: 'library',
    priority: 'low',
    status: 'resolved',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    updated_at: new Date(Date.now() - 43200000).toISOString(),
    message: 'O botão de download da Apostila de Matemática não funciona no telemóvel.',
    responses: 3,
    sla_hours: 24,
    sla_remaining_minutes: null,
    resolution: 'Corrigido — o download em mobile estava bloqueado por política de segurança. Actualizado.'
  },
  {
    id: 'TKT-005',
    user_name: 'Carla Nhantumbo',
    user_email: 'carla.n@estudante.mz',
    user_avatar: 'CN',
    subject: 'Conta bloqueada após 5 tentativas de login',
    category: 'account',
    priority: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 5400000).toISOString(), // 1.5 h atrás
    updated_at: new Date(Date.now() - 5400000).toISOString(),
    message: 'Digitei a senha errada 5 vezes e agora aparece "Conta temporariamente bloqueada". Preciso de acesso urgente para o exame de amanhã.',
    responses: 0,
    sla_hours: 2,
    sla_remaining_minutes: 30
  },
  {
    id: 'TKT-006',
    user_name: 'Pedro Zimba',
    user_email: 'pedro.zimba@estudante.mz',
    user_avatar: 'PZ',
    subject: 'Progresso não está a ser guardado',
    category: 'technical',
    priority: 'medium',
    status: 'in_progress',
    created_at: new Date(Date.now() - 14400000).toISOString(), // 4 h atrás
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    message: 'Assisto as aulas até ao fim mas o progresso continua a 0%. Já limpei o cache e não resolveu.',
    responses: 2,
    sla_hours: 8,
    sla_remaining_minutes: 240
  },
  {
    id: 'TKT-007',
    user_name: 'Esperança Macuácua',
    user_email: 'esp.macuacua@estudante.mz',
    user_avatar: 'EM',
    subject: 'Como obter certificado após completar a disciplina?',
    category: 'general',
    priority: 'low',
    status: 'resolved',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    message: 'Terminei a disciplina de Biologia com 100% mas não vi nenhum certificado disponível.',
    responses: 2,
    sla_hours: 24,
    sla_remaining_minutes: null,
    resolution: 'Explicado que os certificados são emitidos após aprovação da equipa pedagógica (3-5 dias úteis).'
  },
  {
    id: 'TKT-008',
    user_name: 'Tomás Bila',
    user_email: 'tomas.bila@estudante.ao',
    user_avatar: 'TB',
    subject: 'App não funciona em Angola — carregamento lento',
    category: 'technical',
    priority: 'high',
    status: 'open',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 h atrás
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    message: 'Em Luanda a plataforma demora mais de 30 segundos a carregar cada página. Colegas em Moçambique não têm este problema.',
    responses: 0,
    sla_hours: 4,
    sla_remaining_minutes: 180
  }
]

const MOCK_RECENT_USERS = mockUsers
  .filter(u => u.role === 'student')
  .map(u => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    country: u.country_name,
    flag: u.country_flag,
    grade: (u as any).grade || '—',
    status: 'active',
    last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    created_at: u.created_at
  }))

// Acrescentar utilizadores fictícios para o painel ficar rico
const EXTRA_USERS = [
  { id: 'u-101', name: 'Beatriz Lopes',     email: 'beatriz.lopes@estudante.ao',  country: 'Angola',     flag: '🇦🇴', grade: '9ª Classe',  status: 'active',   last_seen: new Date(Date.now()-1800000).toISOString(),  created_at: new Date('2025-11-03').toISOString() },
  { id: 'u-102', name: 'João Manuel',        email: 'joao.manuel@estudante.mz',    country: 'Moçambique', flag: '🇲🇿', grade: '11ª Classe', status: 'inactive', last_seen: new Date(Date.now()-86400000).toISOString(), created_at: new Date('2025-10-12').toISOString() },
  { id: 'u-103', name: 'Carla Nhantumbo',   email: 'carla.n@estudante.mz',        country: 'Moçambique', flag: '🇲🇿', grade: '12ª Classe', status: 'blocked',  last_seen: new Date(Date.now()-5400000).toISOString(),  created_at: new Date('2025-09-20').toISOString() },
  { id: 'u-104', name: 'Pedro Zimba',        email: 'pedro.zimba@estudante.mz',    country: 'Moçambique', flag: '🇲🇿', grade: '10ª Classe', status: 'active',   last_seen: new Date(Date.now()-7200000).toISOString(),  created_at: new Date('2025-11-28').toISOString() },
  { id: 'u-105', name: 'Esperança Macuácua', email: 'esp.macuacua@estudante.mz',   country: 'Moçambique', flag: '🇲🇿', grade: '12ª Classe', status: 'active',   last_seen: new Date(Date.now()-600000).toISOString(),   created_at: new Date('2025-08-15').toISOString() },
  { id: 'u-106', name: 'Tomás Bila',         email: 'tomas.bila@estudante.ao',     country: 'Angola',     flag: '🇦🇴', grade: '8ª Classe',  status: 'active',   last_seen: new Date(Date.now()-3600000).toISOString(),  created_at: new Date('2025-12-01').toISOString() },
]

const ALL_USERS = [...MOCK_RECENT_USERS, ...EXTRA_USERS]

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/stats  —  Métricas gerais
// ═══════════════════════════════════════════════════════════════
support.get('/stats', async (c) => {
  const open       = MOCK_TICKETS.filter(t => t.status === 'open').length
  const inProgress = MOCK_TICKETS.filter(t => t.status === 'in_progress').length
  const resolved   = MOCK_TICKETS.filter(t => t.status === 'resolved').length
  const urgent     = MOCK_TICKETS.filter(t => t.priority === 'high' && t.status !== 'resolved').length
  const slaBreached = MOCK_TICKETS.filter(t => t.sla_remaining_minutes !== null && (t.sla_remaining_minutes ?? 999) < 60 && t.status !== 'resolved').length
  const avgResponse = 18 // minutos (mock)
  const satisfactionScore = 94.2

  // Categorias com mais tickets
  const byCategory: Record<string, number> = {}
  MOCK_TICKETS.forEach(t => { byCategory[t.category] = (byCategory[t.category] || 0) + 1 })
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat, count]) => ({ category: cat, count }))

  return c.json<ApiResponse>({
    success: true,
    data: {
      tickets: { open, in_progress: inProgress, resolved, total: MOCK_TICKETS.length },
      urgent,
      sla_breached: slaBreached,
      avg_response_minutes: avgResponse,
      satisfaction_score: satisfactionScore,
      top_categories: topCategories,
      total_users: ALL_USERS.length + 9820,
      active_today: 1243,
      new_this_week: 87
    }
  })
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/tickets  —  Lista de tickets
// ═══════════════════════════════════════════════════════════════
support.get('/tickets', async (c) => {
  const status   = c.req.query('status')   || 'all'
  const priority = c.req.query('priority') || 'all'
  const category = c.req.query('category') || 'all'
  const search   = c.req.query('search')   || ''

  let tickets = [...MOCK_TICKETS]

  if (status !== 'all')   tickets = tickets.filter(t => t.status   === status)
  if (priority !== 'all') tickets = tickets.filter(t => t.priority === priority)
  if (category !== 'all') tickets = tickets.filter(t => t.category === category)
  if (search) {
    const q = search.toLowerCase()
    tickets = tickets.filter(t =>
      t.subject.toLowerCase().includes(q) ||
      t.user_name.toLowerCase().includes(q) ||
      t.user_email.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    )
  }

  // Ordenar: urgent primeiro, depois por data
  tickets.sort((a, b) => {
    const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    if (a.status !== 'resolved' && b.status === 'resolved') return -1
    if (a.status === 'resolved' && b.status !== 'resolved') return 1
    return (pOrder[a.priority] - pOrder[b.priority]) ||
      (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })

  return c.json<ApiResponse>({
    success: true,
    data: {
      tickets,
      total: tickets.length,
      stats: {
        open:        MOCK_TICKETS.filter(t => t.status === 'open').length,
        in_progress: MOCK_TICKETS.filter(t => t.status === 'in_progress').length,
        resolved:    MOCK_TICKETS.filter(t => t.status === 'resolved').length
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/tickets/:id  —  Detalhes de um ticket
// ═══════════════════════════════════════════════════════════════
support.get('/tickets/:id', async (c) => {
  const id = c.req.param('id')
  const ticket = MOCK_TICKETS.find(t => t.id === id)

  if (!ticket) {
    return c.json<ApiResponse>({ success: false, error: 'Ticket não encontrado' }, 404)
  }

  // Simular thread de conversação
  const thread = [
    {
      author: ticket.user_name,
      author_role: 'student',
      avatar: ticket.user_avatar,
      message: ticket.message,
      created_at: ticket.created_at
    },
    ...(ticket.responses > 0 ? [{
      author: 'Equipa de Suporte',
      author_role: 'support',
      avatar: 'ES',
      message: 'Obrigado por nos contactar. Estamos a analisar o seu problema e responderemos em breve.',
      created_at: ticket.updated_at
    }] : []),
    ...(ticket.resolution ? [{
      author: 'Equipa de Suporte',
      author_role: 'support',
      avatar: 'ES',
      message: ticket.resolution,
      created_at: ticket.updated_at,
      is_resolution: true
    }] : [])
  ]

  return c.json<ApiResponse>({
    success: true,
    data: { ...ticket, thread }
  })
})

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/support/tickets/:id  —  Actualizar estado / responder
// ═══════════════════════════════════════════════════════════════
support.patch('/tickets/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const ticket = MOCK_TICKETS.find(t => t.id === id)

  if (!ticket) {
    return c.json<ApiResponse>({ success: false, error: 'Ticket não encontrado' }, 404)
  }

  // Em modo demo apenas simulamos a actualização
  const updated = {
    ...ticket,
    status: body.status || ticket.status,
    priority: body.priority || ticket.priority,
    updated_at: new Date().toISOString(),
    responses: ticket.responses + (body.response ? 1 : 0),
    ...(body.status === 'resolved' ? { resolution: body.response || 'Resolvido pela equipa de suporte.', sla_remaining_minutes: null } : {})
  }

  return c.json<ApiResponse>({
    success: true,
    data: updated,
    message: 'Ticket actualizado com sucesso (modo demo)'
  })
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/users  —  Lista de utilizadores
// ═══════════════════════════════════════════════════════════════
support.get('/users', async (c) => {
  const search = c.req.query('search') || ''
  const status = c.req.query('status') || 'all'
  const country = c.req.query('country') || 'all'

  let users = [...ALL_USERS]

  if (search) {
    const q = search.toLowerCase()
    users = users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }
  if (status !== 'all')  users = users.filter(u => u.status === status)
  if (country !== 'all') users = users.filter(u => u.country?.toLowerCase().includes(country.toLowerCase()))

  return c.json<ApiResponse>({
    success: true,
    data: {
      users,
      total: users.length,
      stats: {
        total:    ALL_USERS.length + 9820,
        active:   ALL_USERS.filter(u => u.status === 'active').length + 9812,
        inactive: ALL_USERS.filter(u => u.status === 'inactive').length + 6,
        blocked:  ALL_USERS.filter(u => u.status === 'blocked').length + 2
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/block  —  Bloquear utilizador
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/block', async (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'blocked' },
    message: 'Utilizador bloqueado (modo demo)'
  })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/unblock  —  Desbloquear
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/unblock', async (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'active' },
    message: 'Utilizador desbloqueado (modo demo)'
  })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/users/:id/reset-password  —  Reset de senha
// ═══════════════════════════════════════════════════════════════
support.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({
    success: true,
    data: { id, temp_password: 'VClass@2025', expires_in: '24h' },
    message: 'Senha temporária gerada (modo demo)'
  })
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/support/announcements  —  Avisos rápidos para enviar
// ═══════════════════════════════════════════════════════════════
support.get('/announcements', async (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      announcements: [
        { id: 1, title: 'Manutenção programada', message: 'A plataforma estará em manutenção no sábado das 02h00 às 04h00.', sent_at: new Date(Date.now() - 172800000).toISOString(), audience: 'all', sent_by: 'Equipa de Suporte' },
        { id: 2, title: 'Novas aulas disponíveis', message: '25 novas aulas de Química para a 11ª Classe foram publicadas.', sent_at: new Date(Date.now() - 432000000).toISOString(), audience: 'students', sent_by: 'Equipa de Suporte' }
      ]
    }
  })
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/support/announcements  —  Enviar aviso
// ═══════════════════════════════════════════════════════════════
support.post('/announcements', async (c) => {
  const body = await c.req.json()
  const agent = c.get('user')
  return c.json<ApiResponse>({
    success: true,
    data: {
      id: Math.floor(Math.random() * 10000),
      ...body,
      sent_at: new Date().toISOString(),
      sent_by: agent?.full_name || 'Suporte'
    },
    message: 'Aviso enviado com sucesso (modo demo)'
  }, 201)
})

export default support
