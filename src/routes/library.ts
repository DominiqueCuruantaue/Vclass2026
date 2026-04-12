// ============================================================
//  VClass — Rota de Biblioteca Digital
//  GET /api/library          → lista de materiais
//  GET /api/library/featured → materiais em destaque
//  GET /api/library/:id      → material individual
// ============================================================
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { ApiResponse } from '../types'

const library = new Hono()

// Auth obrigatória — só alunos registados acedem à biblioteca
library.use('/*', authMiddleware)

// ── Dados da biblioteca ────────────────────────────────────
const LIBRARY_DATA = [
  // Livros em destaque
  { id:1,  title:'Matemática — 12ª Classe',              author:'Ministério da Educação', subject:'Matemática', grade:12, category:'books',     pages:320, downloads:2456, rating:4.8, size:'12.5 MB', featured:true,  desc:'Livro oficial — Funções, Trigonometria, Geometria Analítica e Probabilidades.' },
  { id:2,  title:'Física — 11ª Classe',                  author:'Ministério da Educação', subject:'Física',     grade:11, category:'books',     pages:280, downloads:1892, rating:4.7, size:'10.8 MB', featured:true,  desc:'Mecânica, Termodinâmica, Electricidade e Magnetismo.' },
  { id:3,  title:'Química — 10ª Classe',                 author:'Ministério da Educação', subject:'Química',    grade:10, category:'books',     pages:260, downloads:1654, rating:4.6, size:'9.2 MB',  featured:true,  desc:'Química Geral e Inorgânica — Tabela periódica, ligações e reacções.' },
  // Livros
  { id:4,  title:'Biologia — 12ª Classe',                author:'MINED', subject:'Biologia',   grade:12, category:'books',     pages:298, downloads:1341, rating:4.5, size:'11.3 MB', featured:false, desc:'Genética, Evolução, Ecologia e Fisiologia humana.' },
  { id:5,  title:'Português — 11ª Classe',               author:'MINED', subject:'Português',  grade:11, category:'books',     pages:240, downloads:1120, rating:4.4, size:'8.7 MB',  featured:false, desc:'Literatura, gramática avançada e produção textual.' },
  { id:6,  title:'História — 10ª Classe',                author:'MINED', subject:'História',   grade:10, category:'books',     pages:210, downloads:980,  rating:4.3, size:'7.5 MB',  featured:false, desc:'História de África e do Mundo contemporâneo.' },
  { id:7,  title:'Geografia — 11ª Classe',               author:'MINED', subject:'Geografia',  grade:11, category:'books',     pages:225, downloads:876,  rating:4.2, size:'8.1 MB',  featured:false, desc:'Cartografia, clima, recursos naturais e globalização.' },
  { id:8,  title:'Inglês — 12ª Classe',                  author:'MINED', subject:'Inglês',     grade:12, category:'books',     pages:200, downloads:740,  rating:4.1, size:'6.9 MB',  featured:false, desc:'Gramática avançada, leitura e comunicação em inglês.' },
  { id:9,  title:'Matemática — 10ª Classe',              author:'MINED', subject:'Matemática', grade:10, category:'books',     pages:290, downloads:2100, rating:4.7, size:'11.0 MB', featured:false, desc:'Funções, equações, matrizes e determinantes.' },
  { id:10, title:'Biologia — 10ª Classe',                author:'MINED', subject:'Biologia',   grade:10, category:'books',     pages:275, downloads:1230, rating:4.5, size:'10.2 MB', featured:false, desc:'Citologia, genética básica e ecossistemas.' },
  // Apostilas
  { id:11, title:'Apostila: Funções Quadráticas',        author:'Prof. Maria Santos',  subject:'Matemática', grade:10, category:'handouts',  pages:48,  downloads:3210, rating:4.9, size:'2.1 MB',  featured:false, desc:'Resumo completo com teoria, exemplos resolvidos e exercícios.' },
  { id:12, title:'Apostila: Cinemática e Dinâmica',      author:'Prof. João Ferreira', subject:'Física',     grade:11, category:'handouts',  pages:56,  downloads:2876, rating:4.8, size:'2.8 MB',  featured:false, desc:'Leis de Newton, MRU, MRUV e energia cinética.' },
  { id:13, title:'Apostila: Reacções Químicas',          author:'Prof. Ana Lima',      subject:'Química',    grade:10, category:'handouts',  pages:42,  downloads:2340, rating:4.7, size:'1.9 MB',  featured:false, desc:'Tipos de reacções, balanceamento e estequiometria.' },
  { id:14, title:'Apostila: Genética Mendeliana',        author:'Prof. Carlos Neto',   subject:'Biologia',   grade:12, category:'handouts',  pages:38,  downloads:1980, rating:4.6, size:'1.7 MB',  featured:false, desc:'Leis de Mendel, heredograma e probabilidade genética.' },
  { id:15, title:'Apostila: Gramática Portuguesa',       author:'Prof. Sofia Pinto',   subject:'Português',  grade:11, category:'handouts',  pages:64,  downloads:1720, rating:4.5, size:'3.2 MB',  featured:false, desc:'Morfologia, sintaxe e análise de texto — guia completo.' },
  { id:16, title:'Apostila: Trigonometria',              author:'Prof. Rui Mendes',    subject:'Matemática', grade:11, category:'handouts',  pages:52,  downloads:2650, rating:4.8, size:'2.4 MB',  featured:false, desc:'Seno, cosseno, tangente e aplicações em triângulos.' },
  { id:17, title:'Apostila: Electricidade e Circuitos',  author:'Prof. Luís Carvalho', subject:'Física',     grade:12, category:'handouts',  pages:60,  downloads:2100, rating:4.7, size:'2.9 MB',  featured:false, desc:'Lei de Ohm, circuitos em série e paralelo, potência eléctrica.' },
  { id:18, title:'Apostila: Solubilidade e pH',          author:'Prof. Beatriz Cruz',  subject:'Química',    grade:11, category:'handouts',  pages:36,  downloads:1560, rating:4.4, size:'1.6 MB',  featured:false, desc:'Ácidos, bases, sais e indicadores de pH.' },
  // Exercícios
  { id:19, title:'Provas Nacionais: Matemática 2019–2025', author:'MINED / VClass', subject:'Matemática', grade:12, category:'exercises', pages:120, downloads:5432, rating:4.9, size:'4.8 MB', featured:false, desc:'Colecção de 7 provas nacionais com resolução passo a passo.' },
  { id:20, title:'Provas Nacionais: Física 2019–2025',     author:'MINED / VClass', subject:'Física',     grade:12, category:'exercises', pages:96,  downloads:4210, rating:4.8, size:'3.9 MB', featured:false, desc:'7 provas nacionais de Física com critérios de classificação.' },
  { id:21, title:'Provas Nacionais: Química 2019–2025',    author:'MINED / VClass', subject:'Química',    grade:12, category:'exercises', pages:88,  downloads:3870, rating:4.7, size:'3.5 MB', featured:false, desc:'Provas completas de Química com resoluções detalhadas.' },
  { id:22, title:'Simulados: 10ª Classe — Matemática',     author:'Equipa VClass',  subject:'Matemática', grade:10, category:'exercises', pages:64,  downloads:3120, rating:4.8, size:'2.6 MB', featured:false, desc:'10 simulados completos no formato da prova nacional.' },
  { id:23, title:'Simulados: 12ª Classe — Física',         author:'Equipa VClass',  subject:'Física',     grade:12, category:'exercises', pages:72,  downloads:2890, rating:4.7, size:'3.0 MB', featured:false, desc:'Simulados com questões de múltipla escolha e resposta aberta.' },
  { id:24, title:'Banco de Questões: Biologia',            author:'Equipa VClass',  subject:'Biologia',   grade:11, category:'exercises', pages:80,  downloads:2340, rating:4.6, size:'3.2 MB', featured:false, desc:'500+ questões de Biologia organizadas por tema e nível.' },
  { id:25, title:'Simulados: 11ª Classe — Português',      author:'Equipa VClass',  subject:'Português',  grade:11, category:'exercises', pages:56,  downloads:1980, rating:4.5, size:'2.2 MB', featured:false, desc:'Testes de compreensão leitora, gramática e redacção.' },
]

// ── GET /api/library ─────────────────────────────────────────
library.get('/', (c) => {
  const category = c.req.query('category') || 'all'
  const subject  = c.req.query('subject')  || ''
  const grade    = parseInt(c.req.query('grade') || '0')
  const q        = (c.req.query('q') || '').toLowerCase()
  const page     = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit    = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')))

  let filtered = [...LIBRARY_DATA]

  if (category !== 'all')  filtered = filtered.filter(b => b.category === category)
  if (subject)             filtered = filtered.filter(b => b.subject === subject)
  if (grade > 0)           filtered = filtered.filter(b => b.grade === grade)
  if (q)                   filtered = filtered.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.subject.toLowerCase().includes(q)
  )

  const total      = filtered.length
  const totalPages = Math.ceil(total / limit)
  const data       = filtered.slice((page - 1) * limit, page * limit)

  // Stats gerais
  const stats = {
    totalBooks:     LIBRARY_DATA.filter(b => b.category === 'books').length,
    totalHandouts:  LIBRARY_DATA.filter(b => b.category === 'handouts').length,
    totalExercises: LIBRARY_DATA.filter(b => b.category === 'exercises').length,
    totalDownloads: LIBRARY_DATA.reduce((s, b) => s + b.downloads, 0)
  }

  return c.json<ApiResponse>({
    success: true,
    data: { books: data, stats, pagination: { page, limit, total, totalPages } }
  })
})

// ── GET /api/library/featured ────────────────────────────────
library.get('/featured', (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: LIBRARY_DATA.filter(b => b.featured)
  })
})

// ── GET /api/library/stats ───────────────────────────────────
library.get('/stats', (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      totalBooks:     LIBRARY_DATA.filter(b => b.category === 'books').length,
      totalHandouts:  LIBRARY_DATA.filter(b => b.category === 'handouts').length,
      totalExercises: LIBRARY_DATA.filter(b => b.category === 'exercises').length,
      totalDownloads: LIBRARY_DATA.reduce((s, b) => s + b.downloads, 0),
      subjects: [...new Set(LIBRARY_DATA.map(b => b.subject))]
    }
  })
})

// ── GET /api/library/:id ─────────────────────────────────────
library.get('/:id', (c) => {
  const id   = parseInt(c.req.param('id'))
  const item = LIBRARY_DATA.find(b => b.id === id)

  if (!item) {
    return c.json<ApiResponse>({ success: false, error: 'Material não encontrado' }, 404)
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      ...item,
      related: LIBRARY_DATA
        .filter(b => b.id !== id && (b.subject === item.subject || b.grade === item.grade))
        .slice(0, 4)
    }
  })
})

export default library
