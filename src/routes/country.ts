// Country Manager Routes — /api/country/*
// Gestão de currículo, utilizadores e conteúdo por país
import { Hono } from 'hono'
import { authMiddleware, requireCountryManagerOrAdmin } from '../middleware/auth'
import type { ApiResponse } from '../types'

const country = new Hono()
country.use('/*', authMiddleware)
country.use('/*', requireCountryManagerOrAdmin)

// ── Mock data ─────────────────────────────────────────────────────────────────
const COUNTRIES_DATA: Record<string, any> = {
  ao: {
    id: 'ao', name: 'Angola', flag: '🇦🇴', code: 'AO', currency: 'AOA',
    active: true, manager: 'Filomena Andrade',
    stats: {
      total_students: 4820, active_today: 312, new_week: 48,
      total_teachers: 38,   total_lessons: 120, published_lessons: 104,
      avg_score: 71.3, total_time_hours: 18420,
      premium_users: 127, free_users: 4693,
    },
    grades: ['7ª Classe','8ª Classe','9ª Classe','10ª Classe','11ª Classe','12ª Classe'],
    subjects_active: ['Matemática','Língua Portuguesa','Ciências Físicas','Ciências Naturais','História','Geografia','Educação Física'],
    top_lessons: [
      { title: 'Funções do 1º Grau', subject: 'Matemática', views: 842, rating: 4.7 },
      { title: 'Gramática — Verbos', subject: 'Língua Portuguesa', views: 618, rating: 4.5 },
      { title: 'Leis de Newton', subject: 'Ciências Físicas', views: 534, rating: 4.8 },
    ],
    activity_week: [38,52,41,67,58,89,74],
    alerts: [
      { level: 'warning', msg: '3 professores sem aulas publicadas no último mês' },
      { level: 'info',    msg: 'Currículo da 9ª Classe actualizado — 7 novas lições pendentes' },
    ]
  },
  mz: {
    id: 'mz', name: 'Moçambique', flag: '🇲🇿', code: 'MZ', currency: 'MZN',
    active: true, manager: 'Admin VClass',
    stats: {
      total_students: 6210, active_today: 489, new_week: 71,
      total_teachers: 52,   total_lessons: 148, published_lessons: 131,
      avg_score: 74.8, total_time_hours: 28900,
      premium_users: 284, free_users: 5926,
    },
    grades: ['8ª Classe','9ª Classe','10ª Classe','11ª Classe','12ª Classe'],
    subjects_active: ['Matemática','Português','Física','Química','Biologia','História','Geografia'],
    top_lessons: [
      { title: 'Equações do 2º Grau', subject: 'Matemática', views: 1240, rating: 4.9 },
      { title: 'Leis de Newton', subject: 'Física', views: 984, rating: 4.7 },
      { title: 'Tabela Periódica', subject: 'Química', views: 756, rating: 4.6 },
    ],
    activity_week: [61,78,55,92,84,124,108],
    alerts: []
  },
  pt: {
    id: 'pt', name: 'Portugal', flag: '🇵🇹', code: 'PT', currency: 'EUR',
    active: true, manager: '—',
    stats: {
      total_students: 1850, active_today: 98, new_week: 12,
      total_teachers: 14,   total_lessons: 60, published_lessons: 52,
      avg_score: 78.2, total_time_hours: 8240,
      premium_users: 312, free_users: 1538,
    },
    grades: ['10º Ano','11º Ano','12º Ano'],
    subjects_active: ['Matemática','Português','Física','Química','Biologia'],
    top_lessons: [],
    activity_week: [14,22,18,31,27,45,38],
    alerts: [{ level: 'info', msg: 'Currículo do 11º Ano aguarda revisão editorial' }]
  }
}

const MOCK_TEACHERS: Record<string, any[]> = {
  ao: [
    { id: 't-ao-1', name: 'José Baptista',   email: 'jose.b@vclass.ao',   subject: 'Matemática',        lessons: 14, students: 420, status: 'active',   last_lesson: new Date(Date.now()-86400000).toISOString() },
    { id: 't-ao-2', name: 'Maria Fernandes', email: 'maria.f@vclass.ao',  subject: 'L. Portuguesa',     lessons: 11, students: 310, status: 'active',   last_lesson: new Date(Date.now()-172800000).toISOString() },
    { id: 't-ao-3', name: 'Paulo Lopes',     email: 'paulo.l@vclass.ao',  subject: 'Ciências Físicas',  lessons: 8,  students: 280, status: 'inactive', last_lesson: new Date(Date.now()-864000000).toISOString() },
    { id: 't-ao-4', name: 'Ana Pinto',       email: 'ana.p@vclass.ao',    subject: 'História',          lessons: 6,  students: 195, status: 'active',   last_lesson: new Date(Date.now()-259200000).toISOString() },
    { id: 't-ao-5', name: 'Carlos Mendes',   email: 'carlos.m@vclass.ao', subject: 'Ciências Naturais', lessons: 4,  students: 142, status: 'active',   last_lesson: new Date(Date.now()-345600000).toISOString() },
  ],
  mz: [
    { id: 't-mz-1', name: 'Prof. Carlos Machava', email: 'prof.carlos@vclass.mz', subject: 'Matemática & Física', lessons: 48, students: 312, status: 'active', last_lesson: new Date(Date.now()-3600000).toISOString() },
    { id: 't-mz-2', name: 'Beatriz Nhamposse',    email: 'criador@vclass.mz',     subject: 'Química & Biologia', lessons: 127, students: 1840, status: 'active', last_lesson: new Date(Date.now()-7200000).toISOString() },
  ]
}

// GET /api/country/me — dados do país do gestor
country.get('/me', async (c) => {
  const user = c.get('user')
  // Para admin mostra todos; para country_manager mostra só o seu
  const isAdmin = user.role === 'admin'
  if (isAdmin) {
    return c.json<ApiResponse>({
      success: true,
      data: { countries: Object.values(COUNTRIES_DATA), role: 'admin' }
    })
  }
  // Inferir país do token (em prod viria do perfil)
  const cData = COUNTRIES_DATA['ao'] // country_manager demo gerencia Angola
  return c.json<ApiResponse>({ success: true, data: { country: cData, role: 'country_manager' } })
})

// GET /api/country/:id/stats
country.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const cData = COUNTRIES_DATA[id]
  if (!cData) return c.json<ApiResponse>({ success: false, error: 'País não encontrado' }, 404)
  return c.json<ApiResponse>({ success: true, data: cData })
})

// GET /api/country/:id/teachers
country.get('/:id/teachers', async (c) => {
  const id = c.req.param('id')
  const teachers = MOCK_TEACHERS[id] || []
  return c.json<ApiResponse>({ success: true, data: { teachers, total: teachers.length } })
})

// PATCH /api/country/:id/teachers/:tid — activar/desactivar professor
country.patch('/:id/teachers/:tid', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json<ApiResponse>({
    success: true,
    data: { id: c.req.param('tid'), ...body },
    message: 'Professor actualizado (modo demo)'
  })
})

// GET /api/country/:id/curriculum
country.get('/:id/curriculum', async (c) => {
  const id = c.req.param('id')
  const cData = COUNTRIES_DATA[id]
  if (!cData) return c.json<ApiResponse>({ success: false, error: 'País não encontrado' }, 404)
  return c.json<ApiResponse>({
    success: true,
    data: {
      country: cData.name,
      grades: cData.grades,
      subjects: cData.subjects_active,
      total_lessons: cData.stats.total_lessons,
      published: cData.stats.published_lessons
    }
  })
})

// GET /api/country/list — lista todos os países (para admin)
country.get('/list', async (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: { countries: Object.values(COUNTRIES_DATA) }
  })
})

// POST /api/country/:id/announcement — aviso específico do país
country.post('/:id/announcement', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const agent = c.get('user')
  return c.json<ApiResponse>({
    success: true,
    data: { ...body, country: c.req.param('id'), sent_by: agent?.full_name, sent_at: new Date().toISOString() },
    message: 'Aviso enviado ao país (modo demo)'
  }, 201)
})

export default country
