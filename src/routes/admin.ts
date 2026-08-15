// Admin Dashboard Routes — VClass
// Apenas utilizadores com role 'admin' têm acesso
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'
import { revokeAllUserTokens } from '../utils/refreshTokens'
import { isLessonVideoReady } from '../utils/bunny'
import { hashPassword, validatePassword } from '../utils/password'
import { extractPageCount, isValidPdfSignature } from '../utils/documentMeta'
import { GRADES } from '../data/curriculum'

const admin = new Hono<{ Bindings: CloudflareBindings }>()

// ── Auth guard: apenas admins ─────────────────────────────────────────────────
admin.use('*', authMiddleware)
admin.use('*', requireAdmin)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
}

const VALID_ROLES = ['student', 'teacher', 'admin', 'support', 'editor', 'finance', 'moderator', 'country_manager']

// ─── Mock data ────────────────────────────────────────────────────────────────
function getMockAdminData() {
  const now = Date.now()
  return {
    stats: {
      total_users:        1_247,
      active_users_today:   89,
      new_users_week:       43,
      total_students:     1_190,
      total_teachers:        52,
      total_admins:           5,
      total_lessons:        120,
      published_lessons:    108,
      draft_lessons:         12,
      total_views:       34_820,
      views_today:          312,
      total_exercises_done: 9_840,
      avg_score:           76.4,
      total_countries:        5,
      active_countries:       3,
    },
    chart_week: {
      labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
      new_users:    [6, 9, 5, 12, 8, 14, 11],
      lesson_views: [42, 58, 35, 71, 49, 88, 69],
      exercises:    [18, 27, 14, 34, 22, 41, 31],
    },
    chart_month: {
      labels: ['Sem 1','Sem 2','Sem 3','Sem 4'],
      new_users:    [28, 35, 22, 40],
      lesson_views: [220, 310, 195, 370],
      exercises:    [95, 132, 88, 160],
    },
    countries: [
      { name: 'Moçambique', code: 'mz', flag: '🇲🇿', students: 620, lessons: 120, active: true },
      { name: 'Angola',     code: 'ao', flag: '🇦🇴', students: 310, lessons: 120, active: true },
      { name: 'Portugal',   code: 'pt', flag: '🇵🇹', students: 185, lessons:  60, active: true },
      { name: 'Brasil',     code: 'br', flag: '🇧🇷', students:  58, lessons:  30, active: false },
      { name: 'Cabo Verde', code: 'cv', flag: '🇨🇻', students:  17, lessons:  10, active: false },
    ],
    recent_users: [
      { id:'u1', name:'Ana Machava',    email:'ana@vclass.mz',   role:'student', country:'mz', joined: new Date(now - 1*3600000).toISOString(),  active:true  },
      { id:'u2', name:'Carlos Sitoe',   email:'csitoe@vclass.mz',role:'teacher', country:'mz', joined: new Date(now - 3*3600000).toISOString(),  active:true  },
      { id:'u3', name:'Beatriz Santos', email:'bsantos@vclass.ao',role:'student',country:'ao', joined: new Date(now - 5*3600000).toISOString(),  active:true  },
      { id:'u4', name:'Fábio Nuvunga',  email:'fnuvu@vclass.mz', role:'student', country:'mz', joined: new Date(now - 8*3600000).toISOString(),  active:false },
      { id:'u5', name:'Lénia Bila',     email:'lbila@vclass.mz', role:'student', country:'mz', joined: new Date(now - 12*3600000).toISOString(), active:true  },
      { id:'u6', name:'Tomás Guambe',   email:'tguambe@vclass.mz',role:'teacher',country:'mz',joined: new Date(now - 24*3600000).toISOString(), active:true  },
      { id:'u7', name:'Isadora Chaves', email:'ichaves@vclass.ao',role:'student',country:'ao', joined: new Date(now - 30*3600000).toISOString(), active:true  },
      { id:'u8', name:'Rui Mondlane',   email:'rmondl@vclass.mz', role:'student',country:'mz', joined: new Date(now - 36*3600000).toISOString(), active:false },
    ],
    recent_lessons: [
      { id:'l1', title:'Funções Quadráticas',      subject:'Matemática', teacher:'Carlos Sitoe', status:'published', views:284, created: new Date(now - 2*86400000).toISOString()  },
      { id:'l2', title:'Leis de Newton',            subject:'Física',     teacher:'Tomás Guambe', status:'published', views:197, created: new Date(now - 3*86400000).toISOString()  },
      { id:'l3', title:'Tabela Periódica',           subject:'Química',    teacher:'Carlos Sitoe', status:'draft',    views:  0, created: new Date(now - 1*86400000).toISOString()  },
      { id:'l4', title:'Verbos Irregulares',         subject:'Português',  teacher:'Lénia Bila',   status:'published', views:143, created: new Date(now - 4*86400000).toISOString()  },
      { id:'l5', title:'Genética e Hereditariedade', subject:'Biologia',   teacher:'Tomás Guambe', status:'published', views: 92, created: new Date(now - 5*86400000).toISOString()  },
    ],
    system_alerts: [
      { level:'info',    msg:'Sistema a funcionar normalmente',        time: new Date(now - 300000).toISOString() },
      { level:'warning', msg:'3 lições aguardam aprovação de conteúdo', time: new Date(now - 3600000).toISOString() },
      { level:'info',    msg:'Backup automático concluído com sucesso', time: new Date(now - 7200000).toISOString() },
      { level:'success', msg:'43 novos utilizadores esta semana',       time: new Date(now - 86400000).toISOString() },
    ],
    top_lessons: [
      { title:'Equações do 2º Grau',   subject:'Matemática', views:412, score:82 },
      { title:'Leis de Newton',         subject:'Física',     views:388, score:78 },
      { title:'Tabela Periódica',       subject:'Química',    views:341, score:74 },
      { title:'Verbos Irregulares',     subject:'Português',  views:295, score:80 },
      { title:'Cinemática',             subject:'Física',     views:267, score:76 },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers partilhados — dados reais do dashboard (usados por /dashboard e /stats/overview)
// ═══════════════════════════════════════════════════════════════════════════════

// Stats agregadas a partir de arrays já obtidos (sem tocar na BD) — mantém
// /dashboard e /stats/overview sempre consistentes entre si.
function buildStats(users: any[], lessons: any[], submissions: any[], countries: any[]) {
  const today   = new Date(); today.setHours(0,0,0,0)
  const weekAgo = new Date(Date.now() - 7*86400000)
  const correctCount = submissions.filter((s: any) => s.is_correct).length

  return {
    total_users:          users.length,
    active_users_today:   users.filter((u: any) => u.is_active && new Date(u.created_at) >= today).length,
    new_users_week:       users.filter((u: any) => new Date(u.created_at) >= weekAgo).length,
    total_students:       users.filter((u: any) => u.role === 'student').length,
    total_teachers:       users.filter((u: any) => u.role === 'teacher').length,
    total_admins:         users.filter((u: any) => u.role === 'admin').length,
    total_lessons:        lessons.length,
    published_lessons:    lessons.filter((l: any) => l.status === 'published').length,
    draft_lessons:        lessons.filter((l: any) => l.status === 'draft').length,
    pending_lessons:      lessons.filter((l: any) => l.status === 'pending_review').length,
    total_views:          lessons.reduce((s: number, l: any) => s + (l.views_count || 0), 0),
    views_today:          0, // sem histórico de vistas com data — só existe um contador total (views_count)
    total_exercises_done: submissions.length,
    avg_score:            submissions.length ? Math.round((correctCount / submissions.length) * 100) : 0,
    total_countries:      countries.length,
    active_countries:     countries.filter((c: any) => c.is_active).length,
  }
}

// Lições + disciplina (via chapters→grade_subjects→subjects) + nome do professor.
// Mesmo join já usado em GET /content — reaproveitado aqui para recent_lessons/top_lessons.
async function fetchLessonsWithDetails(
  supabase: any,
  opts: { statusIn?: string[]; orderBy?: string; ascending?: boolean; limit?: number } = {}
) {
  let q = supabase.from('lessons').select(
    'id, title, status, views_count, created_at, created_by, chapter:chapters(title, grade_subject:grade_subjects(subject:subjects(name)))'
  )
  if (opts.statusIn) q = q.in('status', opts.statusIn)
  q = q.order(opts.orderBy || 'created_at', { ascending: opts.ascending ?? false })
  if (opts.limit) q = q.limit(opts.limit)

  const { data, error } = await q
  if (error) { console.error('fetchLessonsWithDetails error:', error); return [] }
  const rows = data || []

  const teacherIds = [...new Set(rows.map((l: any) => l.created_by).filter(Boolean))]
  const teacherNames: Record<string, string> = {}
  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase.from('users').select('id, full_name').in('id', teacherIds)
    ;(teachers || []).forEach((u: any) => { teacherNames[u.id] = u.full_name })
  }

  return rows.map((l: any) => ({
    id:      l.id,
    title:   l.title,
    status:  l.status,
    views:   l.views_count,
    created: l.created_at,
    subject: l.chapter?.grade_subject?.subject?.name || null,
    teacher: teacherNames[l.created_by] || null
  }))
}

// Score médio real por lição (% de respostas correctas nas submissões dos seus exercícios).
// Devolve {} para lições sem nenhuma submissão — o chamador trata como "sem dados".
async function fetchLessonScores(supabase: any, lessonIds: string[]): Promise<Record<string, number>> {
  if (lessonIds.length === 0) return {}
  const { data: exercises } = await supabase.from('exercises').select('id, lesson_id').in('lesson_id', lessonIds)
  const exerciseRows = exercises || []
  const exerciseIds = exerciseRows.map((e: any) => e.id)
  if (exerciseIds.length === 0) return {}

  const { data: subs } = await supabase.from('exercise_submissions').select('exercise_id, is_correct').in('exercise_id', exerciseIds)
  const exerciseToLesson: Record<string, string> = {}
  exerciseRows.forEach((e: any) => { exerciseToLesson[e.id] = e.lesson_id })

  const tally: Record<string, { correct: number; total: number }> = {}
  ;(subs || []).forEach((s: any) => {
    const lid = exerciseToLesson[s.exercise_id]
    if (!lid) return
    tally[lid] = tally[lid] || { correct: 0, total: 0 }
    tally[lid].total++
    if (s.is_correct) tally[lid].correct++
  })

  const scores: Record<string, number> = {}
  Object.entries(tally).forEach(([lid, t]) => { scores[lid] = Math.round((t.correct / t.total) * 100) })
  return scores
}

// Contagem de datas ISO agrupadas nos últimos N dias (labels = dia da semana abreviado)
function bucketByDay(dates: string[], days: number) {
  const now = new Date()
  const labels: string[] = []
  const counts: number[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now); day.setDate(now.getDate() - i); day.setHours(0, 0, 0, 0)
    const next = new Date(day); next.setDate(day.getDate() + 1)
    labels.push(day.toLocaleDateString('pt-PT', { weekday: 'short' }))
    counts.push(dates.filter(d => { const t = new Date(d).getTime(); return t >= day.getTime() && t < next.getTime() }).length)
  }
  return { labels, counts }
}

// Contagem de datas ISO agrupadas nas últimas N semanas (labels = "Sem 1".."Sem N")
function bucketByWeek(dates: string[], weeks: number) {
  const now = new Date()
  const labels: string[] = []
  const counts: number[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now); start.setDate(now.getDate() - (i + 1) * 7); start.setHours(0, 0, 0, 0)
    const end   = new Date(now); end.setDate(now.getDate() - i * 7); end.setHours(0, 0, 0, 0)
    labels.push(`Sem ${weeks - i}`)
    counts.push(dates.filter(d => { const t = new Date(d).getTime(); return t >= start.getTime() && t < end.getTime() }).length)
  }
  return { labels, counts }
}

const COUNTRY_FLAG_EMOJI: Record<string, string> = { mz: '🇲🇿', ao: '🇦🇴', pt: '🇵🇹', br: '🇧🇷', cv: '🇨🇻' }

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/dashboard
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/dashboard', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      return c.json<ApiResponse>({ success: true, data: getMockAdminData(), message: 'demo' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    // Parallel queries
    const [usersRes, lessonsRes, submissionsRes, countriesRes] = await Promise.all([
      supabase.from('users').select('id, full_name, email, role, country_id, country_code, created_at, is_active'),
      supabase.from('lessons').select('id, status, views_count, created_at, title, updated_at, created_by, video_id, video_url'),
      supabase.from('exercise_submissions').select('id, is_correct, submitted_at'),
      supabase.from('countries').select('id, name, code, flag_url, is_active').order('name'),
    ])

    const users       = usersRes.data       || []
    const lessons     = lessonsRes.data     || []
    const submissions = submissionsRes.data || []
    const countriesRaw = countriesRes.data  || []

    const stats = buildStats(users, lessons, submissions, countriesRaw)

    // Alertas reais: uma lição por professor na fila de aprovação, com hora real de entrada
    // (updated_at é actualizado no momento em que o professor a envia — ver src/routes/creator.ts)
    // Só entra no alerta depois do vídeo estar mesmo pronto no Bunny — evita o admin ser
    // avisado (e tentado a aprovar) uma lição cujo vídeo ainda está a processar.
    const pendingLessonsRaw = lessons.filter((l: any) => l.status === 'pending_review')
    const readyFlags = await Promise.all(pendingLessonsRaw.map((l: any) => isLessonVideoReady(c.env as any, l)))
    const pendingLessons = pendingLessonsRaw.filter((_: any, i: number) => readyFlags[i])

    let creatorNames: Record<string, string> = {}
    if (pendingLessons.length > 0) {
      const creatorIds = [...new Set(pendingLessons.map((l: any) => l.created_by).filter(Boolean))]
      const { data: creators } = await supabase.from('users').select('id, full_name').in('id', creatorIds)
      ;(creators || []).forEach((u: any) => { creatorNames[u.id] = u.full_name })
    }
    const pendingAlerts = pendingLessons
      .sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .map((l: any) => ({
        level: 'warning',
        type: 'lesson_review',
        msg: `Nova lição na fila: "${l.title}" — ${creatorNames[l.created_by] || 'professor'} aguarda aprovação (vídeo pronto)`,
        time: l.updated_at || l.created_at,
        action_url: `/admin-dashboard.html?tab=content&status=pending_review&lesson=${l.id}`
      }))

    // Alertas de candidaturas de professor (nova candidatura, em análise, ou à
    // espera de resposta do candidato) — mesma fila que a aba "Professores".
    const { data: pendingAppsRaw } = await supabase
      .from('teacher_applications')
      .select('id, full_name, status, submitted_at')
      .in('status', ['pending', 'under_review', 'info_requested'])
      .order('submitted_at', { ascending: false })
      .limit(20)
    const appStatusLabel: Record<string, string> = {
      pending: 'nova candidatura de professor',
      under_review: 'candidatura de professor em análise',
      info_requested: 'candidatura de professor aguarda info. do candidato'
    }
    const teacherAlerts = (pendingAppsRaw || []).map((a: any) => ({
      level: 'warning',
      type: 'teacher_application',
      msg: `👩‍🏫 ${a.full_name} — ${appStatusLabel[a.status] || a.status}`,
      time: a.submitted_at,
      action_url: `/admin-dashboard.html?tab=teachers&status=${a.status}`
    }))

    // Estatística agregada de novos utilizadores da semana
    const newUsersAlerts = stats.new_users_week > 0 ? [{
      level: 'info',
      type: 'new_users',
      msg: `${stats.new_users_week} novos utilizadores esta semana`,
      time: new Date().toISOString(),
      action_url: '/admin-dashboard.html?tab=users'
    }] : []

    const system_alerts = [...teacherAlerts, ...pendingAlerts, ...newUsersAlerts]
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())

    // Países reais (tabela countries) — nº de estudantes activos por país via
    // users.country_code. `lessons` por país fica null (placeholder): o schema
    // não modela uma relação directa país→lição.
    const countries = countriesRaw.map((cRow: any) => {
      const inCountry = users.filter((u: any) => u.country_code === cRow.code)
      return {
        name:     cRow.name,
        code:     cRow.code,
        flag:     COUNTRY_FLAG_EMOJI[cRow.code] || '🏳️',
        students: inCountry.filter((u: any) => u.role === 'student').length,
        lessons:  null,
        active:   cRow.is_active
      }
    })

    // Utilizadores recentes (Overview) — reais, mais recentes primeiro
    const recent_users = [...users]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)
      .map((u: any) => ({ id: u.id, name: u.full_name, email: u.email, role: u.role, country: u.country_code, joined: u.created_at, active: u.is_active }))

    // Lições recentes + mais vistas (Overview) — reais, mesmo join de GET /content
    const recent_lessons  = await fetchLessonsWithDetails(supabase, { orderBy: 'created_at', ascending: false, limit: 8 })
    const topLessonsRaw   = await fetchLessonsWithDetails(supabase, { orderBy: 'views_count', ascending: false, limit: 8 })
    const lessonScores    = await fetchLessonScores(supabase, topLessonsRaw.map((l: any) => l.id))
    const top_lessons     = topLessonsRaw.map((l: any) => ({ ...l, score: lessonScores[l.id] ?? null }))

    // Gráfico de actividade — new_users/exercises reais (timestamps existem);
    // lesson_views fica placeholder (zeros): views_count é só um contador total,
    // sem histórico de quando cada vista aconteceu.
    const userDates       = users.map((u: any) => u.created_at)
    const exerciseDates   = submissions.map((s: any) => s.submitted_at)
    const weekUsers      = bucketByDay(userDates, 7)
    const weekExercises  = bucketByDay(exerciseDates, 7)
    const monthUsers     = bucketByWeek(userDates, 4)
    const monthExercises = bucketByWeek(exerciseDates, 4)

    const chart_week = {
      labels: weekUsers.labels,
      new_users: weekUsers.counts,
      exercises: weekExercises.counts,
      lesson_views: new Array(7).fill(0)
    }
    const chart_month = {
      labels: monthUsers.labels,
      new_users: monthUsers.counts,
      exercises: monthExercises.counts,
      lesson_views: new Array(4).fill(0)
    }

    return c.json<ApiResponse>({
      success: true,
      data: { stats, chart_week, chart_month, countries, recent_users, recent_lessons, top_lessons, system_alerts }
    })
  } catch (e: any) {
    console.error('Admin dashboard error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/users?page=1&limit=20&role=&search=
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/users', async (c) => {
  try {
    const page   = parseInt(c.req.query('page')  || '1')
    const limit  = parseInt(c.req.query('limit') || '20')
    const role   = c.req.query('role')   || ''
    const search = c.req.query('search') || ''

    if (!isDatabaseConfigured(c.env)) {
      const mock = getMockAdminData()
      let users = mock.recent_users as any[]
      if (role)   users = users.filter(u => u.role === role)
      if (search) users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      return c.json({ success: true, data: users, pagination: { page, limit, total: users.length, totalPages: 1 } })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, country_code, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit - 1)

    if (role)   query = query.eq('role', role)
    if (search) query = query.ilike('full_name', `%${search}%`)

    const { data, count, error } = await query
    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data: data || [], pagination: { page, limit, total: count||0, totalPages: Math.ceil((count||0)/limit) } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/users — criar conta directamente com um papel (staff: support,
// editor, finance, moderator, country_manager, ou mesmo admin/teacher/student).
// Usado quando não se quer depender do auto-registo (que só cria estudantes) +
// promoção manual — dá acesso imediato ao papel certo.
// ═══════════════════════════════════════════════════════════════════════════════
admin.post('/users', async (c) => {
  try {
    const body = await c.req.json() as { email?: string; password?: string; full_name?: string; role?: string; phone?: string; country_id?: string }
    const { email, password, full_name, role, phone, country_id } = body

    if (!email || !password || !full_name || !role) {
      return c.json({ success: false, error: 'email, password, full_name e role são obrigatórios' }, 400)
    }
    if (!VALID_ROLES.includes(role)) {
      return c.json({ success: false, error: 'Papel inválido' }, 400)
    }
    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      return c.json({ success: false, error: passwordCheck.message }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, data: { id: 'demo-' + Date.now(), email, full_name, role }, message: 'Demo: conta simulada' }, 201)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return c.json({ success: false, error: 'Já existe uma conta com este email' }, 409)
    }

    const password_hash = await hashPassword(password)
    const { data, error } = await supabase
      .from('users')
      .insert({
        email, password_hash, full_name, role,
        phone: phone || null,
        country_id: country_id || null,
        is_active: true,
        is_verified: true
      })
      .select('id, email, full_name, role, phone, country_id, is_active, created_at')
      .single()

    if (error || !data) {
      console.error('Admin create user error:', error)
      return c.json({ success: false, error: error?.message || 'Falha ao criar conta' }, 500)
    }

    return c.json({ success: true, data, message: `Conta de ${roleLabelPt(role)} criada para ${full_name}` }, 201)
  } catch (e: any) {
    console.error('Admin create user error:', e)
    return c.json({ success: false, error: e.message }, 500)
  }
})

function roleLabelPt(r: string): string {
  return ({ student:'estudante', teacher:'professor', admin:'admin', support:'suporte', editor:'editor', finance:'financeiro', moderator:'moderador', country_manager:'gestor de país' } as Record<string,string>)[r] || r
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/users/:id — toggle active / change role
// ═══════════════════════════════════════════════════════════════════════════════
admin.patch('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as { is_active?: boolean; role?: string; full_name?: string }

    if (body.role && !VALID_ROLES.includes(body.role)) {
      return c.json({ success: false, error: 'Papel inválido' }, 400)
    }

    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, data: { id, ...body }, message: 'Demo: alteração simulada' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const updates: any = { updated_at: new Date().toISOString() }
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.role)                    updates.role      = body.role
    if (body.full_name)               updates.full_name = body.full_name

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, role, phone, country_id, country_code, avatar_url, is_active, is_verified, created_at, updated_at')
      .single()
    if (error) return c.json({ success: false, error: error.message }, 500)

    // Revogar todos os refresh tokens do utilizador quando o role é alterado,
    // para que a nova role seja forçada no próximo login.
    if (body.role) {
      await revokeAllUserTokens(supabase, id)
    }

    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/content — lessons list with teacher info
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/content', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, data: getMockAdminData().recent_lessons })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const flattened = await fetchLessonsWithDetails(supabase, { orderBy: 'created_at', ascending: false, limit: 50 })
    return c.json({ success: true, data: flattened })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/content/:id — publish / archive / delete lesson
// ═══════════════════════════════════════════════════════════════════════════════
admin.patch('/content/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json() as { status: string }

    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, message: `Demo: lição ${id} → ${status}` })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    // Trava de segurança: não deixa aprovar/publicar se o vídeo ainda não está
    // pronto no Bunny — evita publicar uma aula cujo vídeo ainda está a processar.
    if (status === 'published') {
      const { data: lesson } = await supabase.from('lessons').select('video_id, video_url').eq('id', id).single()
      const ready = lesson ? await isLessonVideoReady(c.env as any, lesson) : false
      if (!ready) {
        return c.json({ success: false, error: 'O vídeo desta lição ainda está a processar no Bunny.net. Aguarde terminar antes de aprovar.' }, 409)
      }
    }

    const { data, error } = await supabase.from('lessons').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM MANAGEMENT — Admin gere disciplinas e vínculos com classes
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/curriculum — devolve subjects, grades e grade_subjects
admin.get('/curriculum', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const [subjectsRes, gradesRes, gsRes] = await Promise.all([
      supabase.from('subjects').select('id, name, description, color, icon_url, created_at').order('name'),
      supabase.from('grades').select('id, name, level, display_order, education_system_id, education_systems(id, name, country_id, countries(id, name, code, flag_url))').order('display_order'),
      supabase.from('grade_subjects').select('id, grade_id, subject_id, is_mandatory, workload_hours'),
    ])

    if (subjectsRes.error) return c.json<ApiResponse>({ success: false, error: subjectsRes.error.message }, 500)

    return c.json<ApiResponse>({
      success: true,
      data: {
        subjects:        subjectsRes.data || [],
        grades:          gradesRes.data   || [],
        grade_subjects:  gsRes.data       || [],
      },
    })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// POST /api/admin/curriculum/subjects — criar nova disciplina
admin.post('/curriculum/subjects', async (c) => {
  try {
    const body = await c.req.json() as { name: string; description?: string; color?: string; icon_url?: string }
    if (!body.name || !body.name.trim()) {
      return c.json<ApiResponse>({ success: false, error: 'Nome da disciplina é obrigatório' }, 400)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name:        body.name.trim(),
        description: body.description?.trim() || null,
        color:       body.color || '#3B82F6',
        icon_url:    body.icon_url || null,
      })
      .select()
      .single()

    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// PATCH /api/admin/curriculum/subjects/:id — editar disciplina
admin.patch('/curriculum/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as { name?: string; description?: string; color?: string; icon_url?: string }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const updates: any = {}
    if (body.name !== undefined)        updates.name        = body.name.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.color !== undefined)       updates.color       = body.color
    if (body.icon_url !== undefined)    updates.icon_url    = body.icon_url || null

    const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select().single()
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// DELETE /api/admin/curriculum/subjects/:id — apagar disciplina (cascade em grade_subjects e chapters)
admin.delete('/curriculum/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// POST /api/admin/curriculum/grade-subjects — vincular disciplina a uma classe
admin.post('/curriculum/grade-subjects', async (c) => {
  try {
    const body = await c.req.json() as { grade_id: string; subject_id: string; is_mandatory?: boolean; workload_hours?: number }
    if (!body.grade_id || !body.subject_id) {
      return c.json<ApiResponse>({ success: false, error: 'grade_id e subject_id são obrigatórios' }, 400)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { data, error } = await supabase
      .from('grade_subjects')
      .insert({
        grade_id:       body.grade_id,
        subject_id:     body.subject_id,
        is_mandatory:   body.is_mandatory ?? true,
        workload_hours: body.workload_hours ?? null,
      })
      .select()
      .single()

    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// DELETE /api/admin/curriculum/grade-subjects/:id — desvincular
admin.delete('/curriculum/grade-subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { error } = await supabase.from('grade_subjects').delete().eq('id', id)
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats/overview — mini stats for widgets
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/stats/overview', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      const d = getMockAdminData()
      return c.json({ success: true, data: d.stats })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const [usersRes, lessonsRes, submissionsRes, countriesRes] = await Promise.all([
      supabase.from('users').select('id, role, created_at, is_active'),
      supabase.from('lessons').select('id, status, views_count'),
      supabase.from('exercise_submissions').select('id, is_correct'),
      supabase.from('countries').select('id, is_active'),
    ])

    const stats = buildStats(usersRes.data || [], lessonsRes.data || [], submissionsRes.data || [], countriesRes.data || [])
    return c.json({ success: true, data: stats })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// BIBLIOTECA DIGITAL — Endpoints de Admin
//
//  Livros oficiais (só admin pode criar/editar/apagar):
//    GET    /api/admin/library                  → lista todos (qualquer status)
//    POST   /api/admin/library                  → criar livro
//    PUT    /api/admin/library/:id              → editar qualquer item
//    DELETE /api/admin/library/:id              → apagar qualquer item
//    PATCH  /api/admin/library/:id/feature      → toggle destaque
//
//  Fila de revisão (apostilas/exercícios de professores):
//    GET    /api/admin/library/queue            → itens em pending_review
//    POST   /api/admin/library/:id/approve      → aprovar e publicar
//    POST   /api/admin/library/:id/reject       → rejeitar com motivo
// ═════════════════════════════════════════════════════════════════════════════

const ADMIN_LIB_SELECT = `
  id, title, description, author, category,
  subject_id, grade_id, curriculum_grade_id, file_url, file_size_kb, pages, cover_url,
  downloads_count, is_featured, status, rejection_reason,
  created_by, approved_by, approved_at, created_at, updated_at,
  subjects:subject_id ( id, name, color ),
  grades:grade_id     ( id, name, level ),
  creator:created_by  ( id, full_name, email )
`

const LIBRARY_CATEGORIES = ['ensino_geral', 'apostilas', 'artigos', 'educacao_financeira', 'empreendedorismo', 'obras_poemas']

// curriculum_grade_id só é válido quando category = 'ensino_geral' — nos restantes casos é sempre null
function resolveCurriculumGradeId(category: string, curriculum_grade_id: unknown): { ok: true, value: string | null } | { ok: false, error: string } {
  if (category !== 'ensino_geral') return { ok: true, value: null }
  if (!curriculum_grade_id) return { ok: true, value: null }
  if (!GRADES.some(g => g.id === curriculum_grade_id)) return { ok: false, error: 'Classe curricular inválida' }
  return { ok: true, value: String(curriculum_grade_id) }
}

function getSupabaseAdmin(env?: any) {
  return getSupabase(env)
}

// POST /api/admin/library/upload — upload de PDF para Supabase Storage
admin.post('/library/upload', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json<ApiResponse>({ success: false, error: 'Corpo inválido — envie multipart/form-data' }, 400)
  }

  const file = formData.get('file') as File | null
  if (!file || !file.name) return c.json<ApiResponse>({ success: false, error: 'Ficheiro não encontrado no pedido' }, 400)

  const allowed = ['application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                   'application/vnd.ms-excel',
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                   'application/vnd.ms-powerpoint',
                   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                   'image/jpeg', 'image/png',
                   'application/zip', 'application/x-zip-compressed']
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|zip)$/i))
    return c.json<ApiResponse>({ success: false, error: 'Tipo de ficheiro não suportado' }, 400)

  // Tecto do bucket 'vclass-library' no Supabase (limite global de upload do projecto) — manter em sincronia
  const MAX_MB = 50
  if (file.size > MAX_MB * 1024 * 1024)
    return c.json<ApiResponse>({ success: false, error: `Ficheiro demasiado grande (máx ${MAX_MB} MB)` }, 400)

  const ext      = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const safeName = file.name
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_{2,}/g, '_')
  const path     = `library/${Date.now()}_${safeName}`

  const buffer = await file.arrayBuffer()

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (isPdf && !isValidPdfSignature(buffer))
    return c.json<ApiResponse>({ success: false, error: 'Ficheiro PDF inválido ou corrompido — verifique o ficheiro e tente novamente' }, 400)

  // Nº de páginas real, extraído do ficheiro (não confiar em input manual do utilizador)
  const pages = await extractPageCount(buffer, file.type, file.name)

  const { error: upErr } = await supabase.storage
    .from('vclass-library')
    .upload(path, buffer, { contentType: file.type || 'application/pdf', upsert: false })

  if (upErr) return c.json<ApiResponse>({ success: false, error: upErr.message }, 500)

  const { data: urlData } = supabase.storage.from('vclass-library').getPublicUrl(path)

  return c.json<ApiResponse>({
    success: true,
    data: {
      url:         urlData.publicUrl,
      path,
      size_kb:     Math.round(file.size / 1024),
      pages,
      original_name: file.name,
    }
  }, 201)
})

// GET /api/admin/library
admin.get('/library', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const status   = c.req.query('status')   || ''
  const category = c.req.query('category') || ''
  const page  = Math.max(1, parseInt(c.req.query('page')  || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')))
  const from  = (page - 1) * limit

  let query = supabase
    .from('library_items')
    .select(ADMIN_LIB_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error, count } = await query
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({
    success: true,
    data: {
      items: data || [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) }
    }
  })
})

// GET /api/admin/library/queue — apostilas/exercícios a aguardar aprovação
admin.get('/library/queue', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data, error } = await supabase
    .from('library_items')
    .select(ADMIN_LIB_SELECT)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: data || [] })
})

// POST /api/admin/library — criar livro oficial
admin.post('/library', async (c) => {
  const user     = c.get('user') as any
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const body = await c.req.json().catch(() => ({}))
  const { title, description, author, category, subject_id, grade_id, curriculum_grade_id,
          file_url, file_size_kb, pages, cover_url, is_featured } = body

  if (!title?.trim())  return c.json<ApiResponse>({ success: false, error: 'Título obrigatório' }, 400)
  if (!author?.trim()) return c.json<ApiResponse>({ success: false, error: 'Autor obrigatório' }, 400)
  if (!category)       return c.json<ApiResponse>({ success: false, error: 'Categoria obrigatória' }, 400)
  if (!LIBRARY_CATEGORIES.includes(category))
    return c.json<ApiResponse>({ success: false, error: 'Categoria inválida' }, 400)

  const curriculumGrade = resolveCurriculumGradeId(category, curriculum_grade_id)
  if (!curriculumGrade.ok) return c.json<ApiResponse>({ success: false, error: curriculumGrade.error }, 400)

  // Admin pode publicar directamente
  const { data, error } = await supabase
    .from('library_items')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      author: author.trim(),
      category,
      subject_id:   subject_id   || null,
      grade_id:     grade_id     || null,
      curriculum_grade_id: curriculumGrade.value,
      file_url:     file_url     || null,
      file_size_kb: file_size_kb || null,
      pages:        pages        || null,
      cover_url:    cover_url    || null,
      is_featured:  !!is_featured,
      status:       'published',
      created_by:   user.id,
      approved_by:  user.id,
      approved_at:  new Date().toISOString(),
    })
    .select(ADMIN_LIB_SELECT)
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data }, 201)
})

// PUT /api/admin/library/:id — editar qualquer item
admin.put('/library/:id', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const id   = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))

  if (body.category !== undefined && !LIBRARY_CATEGORIES.includes(body.category))
    return c.json<ApiResponse>({ success: false, error: 'Categoria inválida' }, 400)

  const allowed = ['title','description','author','category','subject_id','grade_id',
                   'file_url','file_size_kb','pages','cover_url','is_featured','status']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (body.curriculum_grade_id !== undefined) {
    const curriculumGrade = resolveCurriculumGradeId(body.category ?? 'ensino_geral', body.curriculum_grade_id)
    if (!curriculumGrade.ok) return c.json<ApiResponse>({ success: false, error: curriculumGrade.error }, 400)
    updates.curriculum_grade_id = curriculumGrade.value
  }

  const { data, error } = await supabase
    .from('library_items')
    .update(updates)
    .eq('id', id)
    .select(ADMIN_LIB_SELECT)
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

// DELETE /api/admin/library/:id
admin.delete('/library/:id', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const id = c.req.param('id')
  const { error } = await supabase.from('library_items').delete().eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: null })
})

// PATCH /api/admin/library/:id/feature — toggle destaque
admin.patch('/library/:id/feature', async (c) => {
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const id = c.req.param('id')
  const { data: existing } = await supabase
    .from('library_items')
    .select('id, is_featured')
    .eq('id', id)
    .single()

  if (!existing) return c.json<ApiResponse>({ success: false, error: 'Material não encontrado' }, 404)

  const { data, error } = await supabase
    .from('library_items')
    .update({ is_featured: !existing.is_featured })
    .eq('id', id)
    .select('id, is_featured')
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

// POST /api/admin/library/:id/approve — aprovar e publicar apostila/exercício
admin.post('/library/:id/approve', async (c) => {
  const user     = c.get('user') as any
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const id = c.req.param('id')

  const { data: existing } = await supabase
    .from('library_items')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!existing) return c.json<ApiResponse>({ success: false, error: 'Material não encontrado' }, 404)
  if (existing.status !== 'pending_review')
    return c.json<ApiResponse>({ success: false, error: 'Só itens em revisão podem ser aprovados' }, 400)

  const { data, error } = await supabase
    .from('library_items')
    .update({
      status:          'published',
      approved_by:     user.id,
      approved_at:     new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id)
    .select(ADMIN_LIB_SELECT)
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

// POST /api/admin/library/:id/reject — rejeitar com motivo
admin.post('/library/:id/reject', async (c) => {
  const user     = c.get('user') as any
  const supabase = getSupabaseAdmin(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const id   = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))

  if (!body.reason?.trim())
    return c.json<ApiResponse>({ success: false, error: 'Motivo de rejeição obrigatório' }, 400)

  const { data: existing } = await supabase
    .from('library_items')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!existing) return c.json<ApiResponse>({ success: false, error: 'Material não encontrado' }, 404)
  if (existing.status !== 'pending_review')
    return c.json<ApiResponse>({ success: false, error: 'Só itens em revisão podem ser rejeitados' }, 400)

  const { data, error } = await supabase
    .from('library_items')
    .update({
      status:           'rejected',
      rejection_reason: body.reason.trim(),
      approved_by:      user.id,
    })
    .eq('id', id)
    .select(ADMIN_LIB_SELECT)
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

export default admin
