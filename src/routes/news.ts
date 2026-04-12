// ============================================================
//  VClass — Rota de Notícias
//  GET /api/news          → lista de notícias (público)
//  GET /api/news/:id      → notícia individual
// ============================================================
import { Hono } from 'hono'
import type { ApiResponse } from '../types'

const news = new Hono()

// ── Dados estáticos de notícias (sem BD necessária) ─────────
const NEWS_DATA = [
  {
    id: 1, category: 'vclass', featured: true,
    title: 'VClass lança 120 novas aulas para 10ª, 11ª e 12ª Classe',
    excerpt: 'A maior actualização de conteúdo da plataforma: Matemática, Física, Química, Biologia e História com exercícios práticos e provas anteriores comentadas.',
    body: 'A plataforma VClass disponibilizou hoje 120 novas aulas em vídeo cobrindo as disciplinas principais do ensino secundário. O conteúdo foi produzido por professores especializados e inclui exercícios práticos, provas anteriores comentadas e materiais de estudo complementares.',
    date: '2026-04-10', views: 8241, author: 'Equipa VClass',
    tags: ['aulas', 'matemática', 'física', 'química']
  },
  {
    id: 2, category: 'exames', featured: false,
    title: 'Calendário de Exames Nacionais 2026 publicado pelo MINED',
    excerpt: 'Confira as datas oficiais dos exames das 10ª, 11ª e 12ª classes. Inscrições abertas até 30 de Abril.',
    body: 'O Ministério da Educação publicou o calendário oficial dos exames nacionais para 2026. Os exames decorrerão entre Junho e Agosto, com inscrições a encerrar em 30 de Abril.',
    date: '2026-04-05', views: 5832, author: 'Redacção',
    tags: ['exames', 'calendário', 'mined']
  },
  {
    id: 3, category: 'bolsas', featured: false,
    title: 'Bolsas de estudo universitárias 2026 — candidaturas abertas',
    excerpt: 'Governo anuncia 500 bolsas para estudantes destaque nas classes finais.',
    body: 'O programa de bolsas de estudo universitárias 2026 está com candidaturas abertas. São 500 vagas para estudantes com melhor desempenho nas classes 11ª e 12ª.',
    date: '2026-04-02', views: 7104, author: 'Redacção',
    tags: ['bolsas', 'universidade', 'candidatura']
  },
  {
    id: 4, category: 'vclass', featured: false,
    title: 'Nova funcionalidade: Chat com IA para dúvidas de estudo',
    excerpt: 'O assistente virtual VClass responde perguntas de Matemática, Física, Química e Biologia em tempo real.',
    body: 'A VClass lança o assistente de estudo com inteligência artificial. Os alunos podem agora fazer perguntas directamente na plataforma e receber respostas detalhadas com exemplos e fórmulas.',
    date: '2026-03-28', views: 4219, author: 'Equipa VClass',
    tags: ['ia', 'chat', 'funcionalidade']
  },
  {
    id: 5, category: 'eventos', featured: false,
    title: 'Feira Nacional de Ciências 2026 — inscrições até 20 de Maio',
    excerpt: 'Estudantes de todas as classes podem apresentar projectos científicos na maior feira do país.',
    body: 'A Feira Nacional de Ciências realiza-se em Julho de 2026. As inscrições estão abertas para alunos do ensino secundário de todo o país.',
    date: '2026-03-20', views: 2876, author: 'Redacção',
    tags: ['feira', 'ciências', 'eventos']
  },
  {
    id: 6, category: 'educacao', featured: false,
    title: 'Programa Escola Digital equipa 200 escolas com internet de alta velocidade',
    excerpt: 'Ministério da Educação lança iniciativa para levar conectividade a escolas públicas em todo o país.',
    body: 'O Programa Escola Digital vai equipar 200 escolas secundárias com computadores e ligação à internet de alta velocidade durante 2026.',
    date: '2026-03-15', views: 3641, author: 'Redacção',
    tags: ['digital', 'internet', 'escolas']
  },
  {
    id: 7, category: 'bolsas', featured: false,
    title: 'Bolsas internacionais para Mestrado em Portugal e Brasil',
    excerpt: 'Programa de cooperação oferece 50 bolsas integrais para estudos de pós-graduação.',
    body: 'O programa de cooperação com universidades portuguesas e brasileiras oferece 50 bolsas integrais para mestrado. Candidaturas até 15 de Maio.',
    date: '2026-03-10', views: 6790, author: 'Redacção',
    tags: ['bolsas', 'internacional', 'mestrado']
  },
  {
    id: 8, category: 'exames', featured: false,
    title: 'Taxa de aprovação nos exames 2025 atinge 81% — recorde histórico',
    excerpt: 'Resultados superam expectativas: 10ª e 12ª classes registam os melhores índices dos últimos 10 anos.',
    body: 'Os resultados dos exames nacionais de 2025 mostraram uma taxa de aprovação de 81%, o melhor resultado da última década. O uso de plataformas digitais como VClass foi apontado como factor determinante.',
    date: '2026-03-05', views: 9123, author: 'Redacção',
    tags: ['exames', 'resultados', 'aprovação']
  },
  {
    id: 9, category: 'vclass', featured: false,
    title: 'VClass ultrapassa 10 mil alunos registados na plataforma',
    excerpt: 'Marcos histórico: a plataforma de educação digital serve hoje estudantes em 5 países de língua portuguesa.',
    body: 'A plataforma VClass atingiu a marca de 10.000 alunos registados, com utilizadores em Moçambique, Angola, Brasil, Portugal e Cabo Verde.',
    date: '2026-02-28', views: 5532, author: 'Equipa VClass',
    tags: ['marco', 'crescimento', 'vclass']
  },
  {
    id: 10, category: 'eventos', featured: false,
    title: 'Workshop gratuito de preparação para exames — inscreva-se',
    excerpt: 'VClass oferece workshop de 3 dias com estratégias de estudo, simulados e resolução de provas.',
    body: 'Workshop gratuito online de 3 dias, focado em estratégias de estudo, simulados e resolução de provas anteriores para as classes 10ª, 11ª e 12ª.',
    date: '2026-02-20', views: 3410, author: 'Equipa VClass',
    tags: ['workshop', 'gratuito', 'preparação']
  }
]

// ── GET /api/news ────────────────────────────────────────────
news.get('/', (c) => {
  const category = c.req.query('category') || 'all'
  const q = (c.req.query('q') || '').toLowerCase()
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = Math.min(20, Math.max(1, parseInt(c.req.query('limit') || '10')))

  let filtered = [...NEWS_DATA]

  if (category !== 'all') {
    filtered = filtered.filter(n => n.category === category)
  }

  if (q) {
    filtered = filtered.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.excerpt.toLowerCase().includes(q) ||
      n.tags.some(t => t.includes(q))
    )
  }

  const total = filtered.length
  const totalPages = Math.ceil(total / limit)
  const data = filtered.slice((page - 1) * limit, page * limit)

  return c.json<ApiResponse>({
    success: true,
    data: {
      news: data.map(n => ({ ...n, body: undefined })),  // sem body na lista
      pagination: { page, limit, total, totalPages }
    }
  })
})

// ── GET /api/news/featured ───────────────────────────────────
news.get('/featured', (c) => {
  const featured = NEWS_DATA.filter(n => n.featured)
  return c.json<ApiResponse>({ success: true, data: featured })
})

// ── GET /api/news/categories ─────────────────────────────────
news.get('/categories', (c) => {
  const cats = ['vclass', 'exames', 'bolsas', 'eventos', 'educacao']
  const categories = cats.map(cat => ({
    id: cat,
    count: NEWS_DATA.filter(n => n.category === cat).length
  }))
  return c.json<ApiResponse>({ success: true, data: categories })
})

// ── GET /api/news/:id ────────────────────────────────────────
news.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const item = NEWS_DATA.find(n => n.id === id)

  if (!item) {
    return c.json<ApiResponse>({ success: false, error: 'Notícia não encontrada' }, 404)
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...item,
      related: NEWS_DATA
        .filter(n => n.id !== id && n.category === item.category)
        .slice(0, 3)
        .map(n => ({ id: n.id, title: n.title, date: n.date, category: n.category }))
    }
  })
})

export default news
