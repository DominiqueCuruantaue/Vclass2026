// Country Manager Routes — /api/country/*
// Gestão de currículo, utilizadores e conteúdo por país
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireCountryManagerOrAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { EDUCATION_LEVELS, GRADES, SUBJECTS } from '../data/curriculum'
import type { ApiResponse } from '../types'

const country = new Hono<{ Bindings: CloudflareBindings }>()
country.use('/*', authMiddleware)
country.use('/*', requireCountryManagerOrAdmin)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// ── Currículo real (src/data/curriculum.ts) — classes e disciplinas por país ──
// Grade.displayOrder só é único DENTRO do seu nível de ensino, por isso
// ordenamos primeiro por EducationLevel.displayOrder e só depois por
// Grade.displayOrder, para as classes saírem na sequência cronológica certa
// (ex: 1ª Classe → 12ª Classe em Moçambique, que atravessa 4 níveis).
function getCurriculumForCountry(countryId: string) {
  const levelById = Object.fromEntries(EDUCATION_LEVELS.map(l => [l.id, l]))
  const gradesForCountry = GRADES
    .filter(g => levelById[g.levelId]?.countryId === countryId)
    .sort((a, b) => {
      const la = levelById[a.levelId], lb = levelById[b.levelId]
      return (la.displayOrder - lb.displayOrder) || (a.displayOrder - b.displayOrder)
    })
    .map(g => ({ id: g.id, name: g.name, shortName: g.shortName }))

  const subjectsByGrade: Record<string, { id: string; name: string; icon: string; color: string }[]> = {}
  for (const g of gradesForCountry) {
    subjectsByGrade[g.id] = SUBJECTS
      .filter(s => s.gradeId === g.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(s => ({ id: s.id, name: s.name, icon: s.icon, color: s.color }))
  }

  const subjectNames = [...new Set(gradesForCountry.flatMap(g => subjectsByGrade[g.id].map(s => s.name)))].sort()

  return { grades: gradesForCountry, subjects: subjectNames, subjects_by_grade: subjectsByGrade }
}

// ── Dados fictícios (placeholder) ─────────────────────────────────────────────
// Mostrados apenas enquanto NÃO existir nenhum utilizador real com este
// country_code na BD. Assim que houver pelo menos 1 estudante/professor real
// desse país, loadRealCountryData() substitui isto por completo — nunca se
// misturam números fictícios com reais no mesmo painel.
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
    ...getCurriculumForCountry('ao'),
    top_lessons: [
      { title: 'Funções do 1º Grau', subject: 'Matemática', views: 842, rating: 4.7 },
      { title: 'Gramática — Verbos', subject: 'Língua Portuguesa', views: 618, rating: 4.5 },
      { title: 'Leis de Newton', subject: 'Ciências Físicas', views: 534, rating: 4.8 },
    ],
    activity_week: [38,52,41,67,58,89,74],
    alerts: [
      { level: 'warning', msg: '3 professores sem aulas publicadas no último mês' },
      { level: 'info',    msg: 'Currículo da 9ª Classe actualizado — 7 novas lições pendentes' },
    ],
    is_fictitious: true
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
    ...getCurriculumForCountry('mz'),
    top_lessons: [
      { title: 'Equações do 2º Grau', subject: 'Matemática', views: 1240, rating: 4.9 },
      { title: 'Leis de Newton', subject: 'Física', views: 984, rating: 4.7 },
      { title: 'Tabela Periódica', subject: 'Química', views: 756, rating: 4.6 },
    ],
    activity_week: [61,78,55,92,84,124,108],
    alerts: [],
    is_fictitious: true
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
    ...getCurriculumForCountry('pt'),
    top_lessons: [],
    activity_week: [14,22,18,31,27,45,38],
    alerts: [{ level: 'info', msg: 'Currículo do 11º Ano aguarda revisão editorial' }],
    is_fictitious: true
  },
  br: {
    id: 'br', name: 'Brasil', flag: '🇧🇷', code: 'BR', currency: 'BRL',
    active: true, manager: '—',
    stats: {
      total_students: 1200, active_today: 64, new_week: 18,
      total_teachers: 9,    total_lessons: 34, published_lessons: 29,
      avg_score: 69.5, total_time_hours: 4100,
      premium_users: 58, free_users: 1142,
    },
    ...getCurriculumForCountry('br'),
    top_lessons: [],
    activity_week: [9,14,11,20,17,28,24],
    alerts: [],
    is_fictitious: true
  },
  cv: {
    id: 'cv', name: 'Cabo Verde', flag: '🇨🇻', code: 'CV', currency: 'CVE',
    active: true, manager: '—',
    stats: {
      total_students: 340, active_today: 21, new_week: 6,
      total_teachers: 4,   total_lessons: 12, published_lessons: 9,
      avg_score: 73.0, total_time_hours: 980,
      premium_users: 22, free_users: 318,
    },
    ...getCurriculumForCountry('cv'),
    top_lessons: [],
    activity_week: [3,5,4,7,6,10,8],
    alerts: [],
    is_fictitious: true
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

const LESSON_SELECT = 'id, title, status, views_count, created_by, chapter:chapters(title, grade_subject:grade_subjects(subject:subjects(name)))'
const GRADE_BY_ID = Object.fromEntries(GRADES.map(g => [g.id, g])) as Record<string, typeof GRADES[number]>

const MOCK_USERS_COUNTRY: Record<string, any[]> = {
  ao: [
    { name: 'António Ferreira',  email: 'antonio@vclass.ao', role: 'student', grade: '12ª Classe', avg_score: 82,   last_access: new Date(Date.now()-7200000).toISOString(),   active: true },
    { name: 'Fátima Mbala',      email: 'fatima@vclass.ao',  role: 'student', grade: '10ª Classe', avg_score: 71,   last_access: new Date(Date.now()-86400000).toISOString(),  active: true },
    { name: 'Prof. Domingos',    email: 'domingos@vclass.ao',role: 'teacher', grade: '—',          avg_score: null, last_access: new Date(Date.now()-10800000).toISOString(),  active: true },
    { name: 'Cristina Leal',     email: 'cristina@vclass.ao',role: 'student', grade: '11ª Classe', avg_score: 65,   last_access: new Date(Date.now()-432000000).toISOString(), active: false },
    { name: 'Eduardo Kapango',   email: 'eduardo@vclass.ao', role: 'student', grade: '9ª Classe',  avg_score: 78,   last_access: new Date(Date.now()-3600000).toISOString(),   active: true },
  ]
}

// ── Estatísticas reais de um país, a partir de users/subscriptions/lessons/
//    student_progress/exercise_submissions. Devolve null se não existir NENHUM
//    utilizador real com este country_code — o chamador usa o fallback fictício.
async function loadRealCountryData(supabase: any, countryId: string) {
  const { data: countryUsers, error } = await supabase
    .from('users')
    .select('id, role, created_at, last_login_at')
    .eq('country_code', countryId)
    .in('role', ['student', 'teacher'])

  if (error) throw new Error(error.message)
  if (!countryUsers || countryUsers.length === 0) return null

  const students = countryUsers.filter((u: any) => u.role === 'student')
  const teachers = countryUsers.filter((u: any) => u.role === 'teacher')
  const studentIds = students.map((u: any) => u.id)
  const teacherIds = teachers.map((u: any) => u.id)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 86400_000)

  const activeToday = countryUsers.filter((u: any) => u.last_login_at && new Date(u.last_login_at) >= startOfToday).length
  const newWeek = countryUsers.filter((u: any) => new Date(u.created_at) >= weekAgo).length

  // Subscrições pagas reais dos estudantes deste país
  let premiumUsers = 0
  if (studentIds.length > 0) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('student_id')
      .in('student_id', studentIds)
      .eq('status', 'active')
      .neq('plan_type', 'free')
    premiumUsers = new Set((subs || []).map((s: any) => s.student_id)).size
  }
  const freeUsers = Math.max(students.length - premiumUsers, 0)

  // Lições reais criadas pelos professores deste país
  let lessons: any[] = []
  if (teacherIds.length > 0) {
    const { data } = await supabase.from('lessons').select(LESSON_SELECT).in('created_by', teacherIds)
    lessons = data || []
  }
  const totalLessons = lessons.length
  const publishedLessons = lessons.filter((l: any) => l.status === 'published').length
  const topLessons = [...lessons]
    .sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 3)
    .map((l: any) => ({
      title: l.title,
      subject: l.chapter?.grade_subject?.subject?.name || l.chapter?.title || '—',
      views: l.views_count || 0,
      rating: null
    }))

  // Actividade real dos últimos 7 dias (estudantes distintos com progresso actualizado por dia)
  let activityWeek = [0, 0, 0, 0, 0, 0, 0]
  if (studentIds.length > 0) {
    const { data: progress } = await supabase
      .from('student_progress')
      .select('student_id, updated_at')
      .in('student_id', studentIds)
      .gte('updated_at', weekAgo.toISOString())
    const byDay: Record<string, Set<string>> = {}
    for (const p of progress || []) {
      const day = new Date(p.updated_at).toISOString().slice(0, 10)
      if (!byDay[day]) byDay[day] = new Set()
      byDay[day].add(p.student_id)
    }
    activityWeek = Array.from({ length: 7 }, (_, i) => {
      const key = new Date(weekAgo.getTime() + i * 86400_000).toISOString().slice(0, 10)
      return byDay[key]?.size || 0
    })
  }

  // Nota média real (% de respostas correctas nos exercícios)
  let avgScore = 0
  if (studentIds.length > 0) {
    const { data: submissions } = await supabase.from('exercise_submissions').select('is_correct').in('student_id', studentIds)
    if (submissions && submissions.length > 0) {
      avgScore = Math.round((submissions.filter((s: any) => s.is_correct).length / submissions.length) * 1000) / 10
    }
  }

  // Tempo total real de estudo
  let totalTimeHours = 0
  if (studentIds.length > 0) {
    const { data: progressAll } = await supabase.from('student_progress').select('time_spent').in('student_id', studentIds)
    totalTimeHours = Math.round(((progressAll || []).reduce((a: number, p: any) => a + (p.time_spent || 0), 0) / 3600) * 10) / 10
  }

  // Alerta real: professores sem nenhuma lição publicada
  const publishedByTeacher = new Set(lessons.filter((l: any) => l.status === 'published').map((l: any) => l.created_by))
  const teachersNoPublished = teacherIds.filter((id: string) => !publishedByTeacher.has(id)).length
  const alerts = teachersNoPublished > 0
    ? [{ level: 'warning', msg: `${teachersNoPublished} professor(es) sem aulas publicadas` }]
    : []

  return {
    stats: {
      total_students: students.length, active_today: activeToday, new_week: newWeek,
      total_teachers: teachers.length, total_lessons: totalLessons, published_lessons: publishedLessons,
      avg_score: avgScore, total_time_hours: totalTimeHours,
      premium_users: premiumUsers, free_users: freeUsers
    },
    top_lessons: topLessons,
    activity_week: activityWeek,
    alerts,
    is_fictitious: false
  }
}

// Combina o fictício (identidade: nome/bandeira/moeda/currículo) com as
// estatísticas reais quando existirem, ou mantém tudo fictício quando não.
async function getCountryPayload(env: any, id: string) {
  const fictitious = COUNTRIES_DATA[id]
  if (!fictitious) return null
  if (!isDatabaseConfigured(env)) return fictitious

  const supabase = getSupabase(env)
  if (!supabase) return fictitious

  try {
    const real = await loadRealCountryData(supabase, id)
    if (!real) return fictitious
    return { ...fictitious, stats: real.stats, top_lessons: real.top_lessons, activity_week: real.activity_week, alerts: real.alerts, is_fictitious: false }
  } catch (e) {
    console.error(`Falha ao carregar dados reais do país ${id}, a usar fictício:`, e)
    return fictitious
  }
}

// GET /api/country/me — dados do país do gestor
country.get('/me', async (c) => {
  const user = c.get('user')
  const isAdmin = user.role === 'admin'

  if (isAdmin) {
    const all = await Promise.all(Object.keys(COUNTRIES_DATA).map(id => getCountryPayload(c.env, id)))
    return c.json<ApiResponse>({ success: true, data: { countries: all.filter(Boolean), role: 'admin' } })
  }

  // País do gestor vem do seu perfil real (users.country_code)
  let managedCountry = 'ao'
  if (isDatabaseConfigured(c.env)) {
    const supabase = getSupabase(c.env)
    if (supabase) {
      const { data } = await supabase.from('users').select('country_code').eq('id', user.id).maybeSingle()
      if (data?.country_code && COUNTRIES_DATA[data.country_code]) managedCountry = data.country_code
    }
  }

  const cData = await getCountryPayload(c.env, managedCountry)
  return c.json<ApiResponse>({ success: true, data: { country: cData, role: 'country_manager' } })
})

// GET /api/country/:id/stats
country.get('/:id/stats', async (c) => {
  const id = c.req.param('id')
  const cData = await getCountryPayload(c.env, id)
  if (!cData) return c.json<ApiResponse>({ success: false, error: 'País não encontrado' }, 404)
  return c.json<ApiResponse>({ success: true, data: cData })
})

// GET /api/country/:id/teachers
country.get('/:id/teachers', async (c) => {
  const id = c.req.param('id')

  if (!isDatabaseConfigured(c.env)) {
    const teachers = MOCK_TEACHERS[id] || []
    return c.json<ApiResponse>({ success: true, data: { teachers, total: teachers.length, is_fictitious: true } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: teacherUsers, error } = await supabase
    .from('users')
    .select('id, full_name, email, is_active, last_login_at')
    .eq('country_code', id)
    .eq('role', 'teacher')
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  if (!teacherUsers || teacherUsers.length === 0) {
    const teachers = MOCK_TEACHERS[id] || []
    return c.json<ApiResponse>({ success: true, data: { teachers, total: teachers.length, is_fictitious: true } })
  }

  const ids = teacherUsers.map((t: any) => t.id)
  const { data: lessons } = await supabase.from('lessons').select(LESSON_SELECT).in('created_by', ids)
  const lessonRows = lessons || []

  const lessonCount: Record<string, number> = {}
  const subjectByTeacher: Record<string, string> = {}
  for (const l of lessonRows) {
    lessonCount[l.created_by] = (lessonCount[l.created_by] || 0) + 1
    if (!subjectByTeacher[l.created_by]) subjectByTeacher[l.created_by] = l.chapter?.grade_subject?.subject?.name || l.chapter?.title || '—'
  }

  const lessonIds = lessonRows.map((l: any) => l.id)
  const lessonToTeacher = Object.fromEntries(lessonRows.map((l: any) => [l.id, l.created_by]))
  const studentsByTeacher: Record<string, Set<string>> = {}
  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabase.from('student_progress').select('student_id, lesson_id').in('lesson_id', lessonIds)
    for (const p of progressRows || []) {
      const t = lessonToTeacher[p.lesson_id]
      if (!t) continue
      if (!studentsByTeacher[t]) studentsByTeacher[t] = new Set()
      studentsByTeacher[t].add(p.student_id)
    }
  }

  const teachers = teacherUsers.map((t: any) => ({
    id: t.id,
    name: t.full_name,
    email: t.email,
    subject: subjectByTeacher[t.id] || '—',
    lessons: lessonCount[t.id] || 0,
    students: studentsByTeacher[t.id]?.size || 0,
    status: t.is_active ? 'active' : 'inactive',
    last_lesson: t.last_login_at
  }))

  return c.json<ApiResponse>({ success: true, data: { teachers, total: teachers.length, is_fictitious: false } })
})

// GET /api/country/:id/users — estudantes + professores reais deste país
country.get('/:id/users', async (c) => {
  const id = c.req.param('id')

  if (!isDatabaseConfigured(c.env)) {
    const users = MOCK_USERS_COUNTRY[id] || []
    return c.json<ApiResponse>({ success: true, data: { users, total: users.length, is_fictitious: true } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: rows, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, grade_id, is_active, last_login_at')
    .eq('country_code', id)
    .in('role', ['student', 'teacher'])
    .order('created_at', { ascending: false })
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  if (!rows || rows.length === 0) {
    const users = MOCK_USERS_COUNTRY[id] || []
    return c.json<ApiResponse>({ success: true, data: { users, total: users.length, is_fictitious: true } })
  }

  const studentIds = rows.filter((u: any) => u.role === 'student').map((u: any) => u.id)
  const avgScoreByStudent: Record<string, number> = {}
  if (studentIds.length > 0) {
    const { data: submissions } = await supabase.from('exercise_submissions').select('student_id, is_correct').in('student_id', studentIds)
    const byStudent: Record<string, { correct: number; total: number }> = {}
    for (const s of submissions || []) {
      if (!byStudent[s.student_id]) byStudent[s.student_id] = { correct: 0, total: 0 }
      byStudent[s.student_id].total++
      if (s.is_correct) byStudent[s.student_id].correct++
    }
    for (const [sid, v] of Object.entries(byStudent)) avgScoreByStudent[sid] = Math.round((v.correct / v.total) * 100)
  }

  const users = rows.map((u: any) => ({
    name: u.full_name,
    email: u.email,
    role: u.role,
    grade: u.role === 'student' ? (GRADE_BY_ID[u.grade_id]?.name || '—') : '—',
    avg_score: u.role === 'student' ? (avgScoreByStudent[u.id] ?? null) : null,
    last_access: u.last_login_at,
    active: u.is_active
  }))

  return c.json<ApiResponse>({ success: true, data: { users, total: users.length, is_fictitious: false } })
})

// PATCH /api/country/:id/teachers/:tid — activar/desactivar professor
country.patch('/:id/teachers/:tid', async (c) => {
  const tid = c.req.param('tid')
  const body = await c.req.json().catch(() => ({})) as { status?: string }

  if (!isDatabaseConfigured(c.env) || tid.startsWith('t-')) {
    // ids fictícios (t-ao-1, t-mz-1, ...) nunca existem na BD — modo demo
    return c.json<ApiResponse>({ success: true, data: { id: tid, ...body }, message: 'Professor actualizado (modo demo)' })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { error } = await supabase.from('users').update({ is_active: body.status !== 'inactive', updated_at: new Date().toISOString() }).eq('id', tid)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: { id: tid, ...body }, message: 'Professor actualizado' })
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
      subjects: cData.subjects,
      subjects_by_grade: cData.subjects_by_grade,
      total_lessons: cData.stats.total_lessons,
      published: cData.stats.published_lessons
    }
  })
})

// GET /api/country/list — lista todos os países (para admin)
country.get('/list', async (c) => {
  const all = await Promise.all(Object.keys(COUNTRIES_DATA).map(id => getCountryPayload(c.env, id)))
  return c.json<ApiResponse>({ success: true, data: { countries: all.filter(Boolean) } })
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
