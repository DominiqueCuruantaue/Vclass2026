// Editor Routes — /api/editor/*
// Revisão e aprovação pedagógica de conteúdo
import { Hono } from 'hono'
import { authMiddleware, requireEditorOrAdmin } from '../middleware/auth'
import type { ApiResponse } from '../types'

const editor = new Hono()
editor.use('/*', authMiddleware)
editor.use('/*', requireEditorOrAdmin)

// ── Mock data ─────────────────────────────────────────────────────────────────
const now = () => Date.now()

const MOCK_LESSONS_PENDING = [
  {
    id: 'les-p01', title: 'Derivadas — Regra da Cadeia', subject: 'Matemática', chapter: 'Cálculo Diferencial',
    grade: '12ª Classe', country: 'Moçambique', country_flag: '🇲🇿',
    creator: 'Prof. Carlos Machava', creator_id: '33333333-3333-3333-3333-333333333333',
    duration_min: 18, exercises_count: 5, difficulty: 'hard',
    status: 'pending_review', submitted_at: new Date(now() - 3600000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Introdução à regra da cadeia para derivadas de funções compostas.',
    notes: 'Inclui exemplos resolvidos e exercícios com correcção detalhada.',
    priority: 'high'
  },
  {
    id: 'les-p02', title: 'Tabela Periódica — Metais de Transição', subject: 'Química', chapter: 'Química Inorgânica',
    grade: '11ª Classe', country: 'Angola', country_flag: '🇦🇴',
    creator: 'Beatriz Nhamposse', creator_id: '55555555-5555-5555-5555-555555555555',
    duration_min: 14, exercises_count: 4, difficulty: 'medium',
    status: 'pending_review', submitted_at: new Date(now() - 7200000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Propriedades dos metais de transição e aplicações industriais.',
    notes: 'Requer validação das configurações electrónicas.',
    priority: 'medium'
  },
  {
    id: 'les-p03', title: 'Óptica Geométrica — Reflexão e Refracção', subject: 'Física', chapter: 'Óptica',
    grade: '10ª Classe', country: 'Moçambique', country_flag: '🇲🇿',
    creator: 'Prof. Carlos Machava', creator_id: '33333333-3333-3333-3333-333333333333',
    duration_min: 22, exercises_count: 6, difficulty: 'medium',
    status: 'pending_review', submitted_at: new Date(now() - 10800000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Leis da reflexão e refracção da luz. Espelhos e lentes.',
    notes: 'Inclui animações dos raios de luz.',
    priority: 'medium'
  },
  {
    id: 'les-p04', title: 'Literatura Moçambicana — Mia Couto', subject: 'Português', chapter: 'Literatura Contemporânea',
    grade: '12ª Classe', country: 'Moçambique', country_flag: '🇲🇿',
    creator: 'Beatriz Nhamposse', creator_id: '55555555-5555-5555-5555-555555555555',
    duration_min: 16, exercises_count: 3, difficulty: 'easy',
    status: 'pending_review', submitted_at: new Date(now() - 18000000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Análise de obras de Mia Couto e contexto histórico-cultural.',
    notes: 'Verificar alinhamento com programa do MINED.',
    priority: 'low'
  },
  {
    id: 'les-p05', title: 'Genética Molecular — DNA Recombinante', subject: 'Biologia', chapter: 'Genética',
    grade: '12ª Classe', country: 'Angola', country_flag: '🇦🇴',
    creator: 'Prof. Carlos Machava', creator_id: '33333333-3333-3333-3333-333333333333',
    duration_min: 20, exercises_count: 7, difficulty: 'hard',
    status: 'pending_review', submitted_at: new Date(now() - 25200000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Técnicas de DNA recombinante e engenharia genética.',
    notes: '',
    priority: 'high'
  },
  {
    id: 'les-p06', title: 'Equações Diferenciais — Introdução', subject: 'Matemática', chapter: 'Cálculo',
    grade: '12ª Classe', country: 'Moçambique', country_flag: '🇲🇿',
    creator: 'Beatriz Nhamposse', creator_id: '55555555-5555-5555-5555-555555555555',
    duration_min: 25, exercises_count: 8, difficulty: 'hard',
    status: 'pending_review', submitted_at: new Date(now() - 32400000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Conceitos básicos de equações diferenciais ordinárias.',
    notes: 'Conteúdo avançado — verificar nível da classe.',
    priority: 'medium'
  },
  {
    id: 'les-p07', title: 'Termodinâmica — 2ª Lei e Entropia', subject: 'Física', chapter: 'Termodinâmica',
    grade: '11ª Classe', country: 'Angola', country_flag: '🇦🇴',
    creator: 'Prof. Carlos Machava', creator_id: '33333333-3333-3333-3333-333333333333',
    duration_min: 19, exercises_count: 5, difficulty: 'hard',
    status: 'pending_review', submitted_at: new Date(now() - 43200000).toISOString(),
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'Segunda lei da termodinâmica e conceito de entropia.',
    notes: '',
    priority: 'medium'
  }
]

const MOCK_HISTORY = [
  { id: 'h01', lesson_title: 'Funções Quadráticas — Gráficos', action: 'approved', editor: 'Isabel Guambe', date: new Date(now()-86400000).toISOString(), subject: 'Matemática', creator: 'Prof. Carlos Machava' },
  { id: 'h02', lesson_title: 'Leis de Newton — Dinâmica', action: 'approved', editor: 'Isabel Guambe', date: new Date(now()-172800000).toISOString(), subject: 'Física', creator: 'Beatriz Nhamposse' },
  { id: 'h03', lesson_title: 'Análise Sintática Avançada', action: 'rejected', editor: 'Isabel Guambe', date: new Date(now()-259200000).toISOString(), subject: 'Português', creator: 'Prof. Carlos Machava', feedback: 'Conteúdo não alinhado com o currículo da 10ª Classe. Rever capítulo 3.' },
  { id: 'h04', lesson_title: 'Respiração Celular — ATP', action: 'approved', editor: 'Isabel Guambe', date: new Date(now()-345600000).toISOString(), subject: 'Biologia', creator: 'Beatriz Nhamposse' },
  { id: 'h05', lesson_title: 'Isomeria Óptica', action: 'changes_requested', editor: 'Isabel Guambe', date: new Date(now()-432000000).toISOString(), subject: 'Química', creator: 'Prof. Carlos Machava', feedback: 'Adicionar mais exemplos práticos. Os exercícios 4 e 5 têm erros nas respostas.' },
]

// GET /api/editor/stats
editor.get('/stats', async (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      pending:           MOCK_LESSONS_PENDING.length,
      approved_week:     12,
      rejected_week:     2,
      changes_requested: 3,
      avg_review_hours:  4.2,
      by_subject: [
        { subject: 'Matemática', pending: 2, approved: 48 },
        { subject: 'Física',     pending: 2, approved: 41 },
        { subject: 'Química',    pending: 1, approved: 35 },
        { subject: 'Biologia',   pending: 1, approved: 29 },
        { subject: 'Português',  pending: 1, approved: 24 },
      ],
      by_country: [
        { country: 'Moçambique', flag: '🇲🇿', pending: 4, total: 198 },
        { country: 'Angola',     flag: '🇦🇴', pending: 3, total: 114 },
      ]
    }
  })
})

// GET /api/editor/queue — fila de revisão
editor.get('/queue', async (c) => {
  const subject  = c.req.query('subject')  || 'all'
  const priority = c.req.query('priority') || 'all'
  const country  = c.req.query('country')  || 'all'
  const search   = c.req.query('search')   || ''

  let lessons = [...MOCK_LESSONS_PENDING]
  if (subject  !== 'all') lessons = lessons.filter(l => l.subject === subject)
  if (priority !== 'all') lessons = lessons.filter(l => l.priority === priority)
  if (country  !== 'all') lessons = lessons.filter(l => l.country_flag === country)
  if (search) {
    const q = search.toLowerCase()
    lessons = lessons.filter(l => l.title.toLowerCase().includes(q) || l.creator.toLowerCase().includes(q))
  }

  return c.json<ApiResponse>({
    success: true,
    data: { lessons, total: lessons.length }
  })
})

// GET /api/editor/queue/:id
editor.get('/queue/:id', async (c) => {
  const lesson = MOCK_LESSONS_PENDING.find(l => l.id === c.req.param('id'))
  if (!lesson) return c.json<ApiResponse>({ success: false, error: 'Lição não encontrada' }, 404)
  return c.json<ApiResponse>({ success: true, data: lesson })
})

// POST /api/editor/queue/:id/approve
editor.post('/queue/:id/approve', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const agent = c.get('user')
  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'published', reviewed_by: agent?.full_name || 'Editor', notes: body.notes || '', reviewed_at: new Date().toISOString() },
    message: 'Lição aprovada e publicada (modo demo)'
  })
})

// POST /api/editor/queue/:id/reject
editor.post('/queue/:id/reject', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const agent = c.get('user')
  if (!body.feedback) return c.json<ApiResponse>({ success: false, error: 'Feedback obrigatório ao rejeitar' }, 400)
  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'rejected', reviewed_by: agent?.full_name || 'Editor', feedback: body.feedback, reviewed_at: new Date().toISOString() },
    message: 'Lição rejeitada — criador notificado (modo demo)'
  })
})

// POST /api/editor/queue/:id/request-changes
editor.post('/queue/:id/request-changes', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const agent = c.get('user')
  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'changes_requested', reviewed_by: agent?.full_name || 'Editor', feedback: body.feedback, reviewed_at: new Date().toISOString() },
    message: 'Pedido de alterações enviado ao criador (modo demo)'
  })
})

// GET /api/editor/approved
editor.get('/approved', (c) => {
  const approved = MOCK_LESSONS_PENDING.filter(l => l.status === 'approved')
  return c.json<ApiResponse>({ success: true, data: { lessons: approved, total: approved.length } })
})

// GET /api/editor/rejected
editor.get('/rejected', (c) => {
  const rejected = MOCK_LESSONS_PENDING.filter(l => l.status === 'rejected')
  return c.json<ApiResponse>({ success: true, data: { lessons: rejected, total: rejected.length } })
})

// GET /api/editor/history
editor.get('/history', async (c) => {
  return c.json<ApiResponse>({ success: true, data: { history: MOCK_HISTORY, total: MOCK_HISTORY.length } })
})

export default editor
