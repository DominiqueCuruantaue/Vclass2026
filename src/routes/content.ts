// Content Routes - Countries, Grades, Subjects, Chapters, Lessons
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { getSupabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth'
import { GRADES } from '../data/curriculum'
import type { ApiResponse } from '../types'

const content = new Hono<{ Bindings: CloudflareBindings }>()

// Política da plataforma: nenhum conteúdo curricular é acessível sem login.
content.use('/*', authMiddleware)

function requireSupabase(c: any) {
  const supabase = getSupabase(c.env)
  if (!supabase) {
    return { supabase: null, error: c.json({ success: false, error: 'Database configuration error' }, 500) }
  }
  return { supabase, error: null }
}

/**
 * GET /api/content/countries
 */
content.get('/countries', async (c) => {
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('countries')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (dbError) {
    console.error('Get countries error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch countries' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data })
})

/**
 * GET /api/content/education-systems/:country_id
 */
content.get('/education-systems/:country_id', async (c) => {
  const country_id = c.req.param('country_id')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('education_systems')
    .select('*')
    .eq('country_id', country_id)

  if (dbError) {
    console.error('Get education systems error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch education systems' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data })
})

/**
 * GET /api/content/grades/:education_system_id
 */
content.get('/grades/:education_system_id', async (c) => {
  const education_system_id = c.req.param('education_system_id')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('grades')
    .select('*')
    .eq('education_system_id', education_system_id)
    .order('display_order')

  if (dbError) {
    console.error('Get grades error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch grades' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data })
})

/**
 * GET /api/content/subjects/:grade_id
 */
content.get('/subjects/:grade_id', async (c) => {
  const grade_id = c.req.param('grade_id')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('grade_subjects')
    .select(`
      id,
      is_mandatory,
      workload_hours,
      subject:subjects (
        id,
        name,
        description,
        icon_url,
        color
      )
    `)
    .eq('grade_id', grade_id)

  if (dbError) {
    console.error('Get subjects error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch subjects' }, 500)
  }

  const subjects = data?.map(item => ({
    grade_subject_id: item.id,
    is_mandatory: item.is_mandatory,
    workload_hours: item.workload_hours,
    ...(item.subject as any)
  })) || []

  return c.json<ApiResponse>({ success: true, data: subjects })
})

/**
 * GET /api/content/chapters/:grade_subject_id
 */
content.get('/chapters/:grade_subject_id', async (c) => {
  const grade_subject_id = c.req.param('grade_subject_id')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('chapters')
    .select('*')
    .eq('grade_subject_id', grade_subject_id)
    .order('display_order')

  if (dbError) {
    console.error('Get chapters error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch chapters' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data })
})

/**
 * GET /api/content/recent-lessons?limit=6
 * Retorna as lições publicadas mais recentes da classe do aluno autenticado
 * ("Continuar a estudar"). Nunca mistura classes — um aluno da 12ª nunca deve
 * ver aqui lições da 10ª, por exemplo.
 */
const RECENT_LESSON_COLUMNS = 'id, title, description, thumbnail_url, video_duration, views_count, created_at, chapter_id, chapters(title, slug, grade_subjects(subjects(name, color, icon_url), grades(name)))'

// users.grade_id guarda o id estático do currículo (ex.: 'mz-12c', de
// src/data/curriculum.ts) — não o UUID da tabela `grades`. É preciso
// resolver pelo nome (ex.: '12ª Classe') antes de filtrar grade_subjects,
// senão a comparação nunca bate e as secções por classe ficam sempre vazias.
// Devolve null quando não é possível resolver a classe do aluno.
async function resolveStudentChapterIds(supabase: any, userId: string): Promise<string[] | null> {
  const { data: profile } = await supabase
    .from('users')
    .select('grade_id')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.grade_id) return null

  const staticGrade = GRADES.find(g => g.id === profile.grade_id)
  if (!staticGrade) return null

  const { data: dbGrade } = await supabase
    .from('grades')
    .select('id')
    .eq('name', staticGrade.name)
    .maybeSingle()
  if (!dbGrade) return null

  const { data: gradeSubjects } = await supabase
    .from('grade_subjects')
    .select('id')
    .eq('grade_id', dbGrade.id)
  const gradeSubjectIds = (gradeSubjects || []).map((gs: any) => gs.id)
  if (gradeSubjectIds.length === 0) return []

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id')
    .in('grade_subject_id', gradeSubjectIds)
  return (chapters || []).map((ch: any) => ch.id)
}

content.get('/recent-lessons', async (c) => {
  const { supabase, error } = requireSupabase(c)
  if (error) return error
  const limit = Math.min(parseInt(c.req.query('limit') || '6', 10), 20)
  const user = c.get('user')

  // 1) Lições que o aluno já abriu — mesmo que só por alguns segundos —
  // aparecem primeiro, da mais recente para a mais antiga, para retomar
  // de onde ficou. Vem de student_progress, alimentado por
  // POST /api/video/:lessonId/progress a cada 30s + ao pausar/sair.
  const { data: progressRows } = await supabase!
    .from('student_progress')
    .select('lesson_id, progress_percent, status, updated_at')
    .eq('student_id', user.id)
    .in('status', ['in_progress', 'completed'])
    .order('updated_at', { ascending: false })
    .limit(limit)

  const progressByLesson = new Map((progressRows || []).map(r => [r.lesson_id, r]))
  const inProgressIds = [...progressByLesson.keys()]

  let continueLessons: any[] = []
  if (inProgressIds.length > 0) {
    const { data: openedLessons } = await supabase!
      .from('lessons')
      .select(RECENT_LESSON_COLUMNS)
      .in('id', inProgressIds)
      .eq('status', 'published')

    continueLessons = (openedLessons || [])
      .map((l: any) => ({
        ...l,
        progress_percent: progressByLesson.get(l.id)?.progress_percent ?? 0,
        last_opened_at: progressByLesson.get(l.id)?.updated_at
      }))
      .sort((a, b) => new Date(b.last_opened_at).getTime() - new Date(a.last_opened_at).getTime())
      .slice(0, limit)
  }

  if (continueLessons.length >= limit) {
    return c.json<ApiResponse>({ success: true, data: continueLessons })
  }

  // 2) Preencher o resto com lições recentes da própria classe do aluno —
  // nunca mistura classes (um aluno da 12ª nunca vê aqui lições da 10ª).
  const remaining = limit - continueLessons.length
  const excludeIds = new Set(continueLessons.map((l: any) => l.id))

  const chapterIds = await resolveStudentChapterIds(supabase!, user.id)
  if (!chapterIds || chapterIds.length === 0) {
    return c.json<ApiResponse>({ success: true, data: continueLessons })
  }

  const { data: fallbackLessons, error: dbError } = await supabase!
    .from('lessons')
    .select(RECENT_LESSON_COLUMNS)
    .eq('status', 'published')
    .in('chapter_id', chapterIds)
    .order('created_at', { ascending: false })
    .limit(remaining + excludeIds.size)

  if (dbError) {
    console.error('Get recent lessons error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch recent lessons' }, 500)
  }

  const fillIn = (fallbackLessons || []).filter((l: any) => !excludeIds.has(l.id)).slice(0, remaining)

  return c.json<ApiResponse>({ success: true, data: [...continueLessons, ...fillIn] })
})

/**
 * GET /api/content/trending-lessons?limit=6
 * Lições em alta: as mais vistas (views_count) dentro da própria classe do
 * aluno — mesma regra de nunca misturar classes usada em /recent-lessons.
 */
content.get('/trending-lessons', async (c) => {
  const { supabase, error } = requireSupabase(c)
  if (error) return error
  const limit = Math.min(parseInt(c.req.query('limit') || '6', 10), 20)
  const user = c.get('user')

  const chapterIds = await resolveStudentChapterIds(supabase!, user.id)
  if (!chapterIds || chapterIds.length === 0) {
    return c.json<ApiResponse>({ success: true, data: [] })
  }

  const { data, error: dbError } = await supabase!
    .from('lessons')
    .select(RECENT_LESSON_COLUMNS)
    .eq('status', 'published')
    .in('chapter_id', chapterIds)
    .order('views_count', { ascending: false })
    .limit(limit)

  if (dbError) {
    console.error('Get trending lessons error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch trending lessons' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: data || [] })
})

/**
 * GET /api/content/lessons/:chapter_id
 * Aceita slug ou UUID do capítulo. Estudantes só veem 'published'.
 */
content.get('/lessons/:chapter_id', async (c) => {
  const chapter_id = c.req.param('chapter_id')
  const user = c.get('user')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let resolvedChapterId = chapter_id
  if (!UUID_RE.test(chapter_id)) {
    const { data: ch } = await supabase!
      .from('chapters')
      .select('id')
      .eq('slug', chapter_id)
      .maybeSingle()
    if (!ch) {
      return c.json<ApiResponse>({ success: true, data: [] })
    }
    resolvedChapterId = ch.id
  }

  let query = supabase!
    .from('lessons')
    .select('id, title, description, thumbnail_url, display_order, video_duration, views_count, status, created_at')
    .eq('chapter_id', resolvedChapterId)
    .order('display_order')

  if (user.role === 'student') {
    query = query.eq('status', 'published')
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error('Get lessons error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch lessons' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data })
})

/**
 * GET /api/content/lesson/:lesson_id
 */
content.get('/lesson/:lesson_id', async (c) => {
  const lesson_id = c.req.param('lesson_id')
  const user = c.get('user')
  const { supabase, error } = requireSupabase(c)
  if (error) return error

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson_id)) {
    return c.json<ApiResponse>({ success: false, error: 'ID de lição inválido' }, 400)
  }

  let query = supabase!.from('lessons').select('*').eq('id', lesson_id)
  if (user.role === 'student') {
    query = (query as any).eq('status', 'published')
  }
  const { data: lesson, error: dbError } = await (query as any).maybeSingle()

  if (dbError) {
    console.error('Get lesson SQL error:', dbError)
    return c.json<ApiResponse>({ success: false, error: dbError.message || 'DB error' }, 500)
  }
  if (!lesson) {
    return c.json<ApiResponse>({ success: false, error: 'Lição não encontrada' }, 404)
  }

  // Incrementar visualizações (não bloqueia)
  supabase!.from('lessons').update({ views_count: (lesson.views_count || 0) + 1 }).eq('id', lesson_id)
    .then(({ error: e }: any) => { if (e) console.warn('views update failed:', e.message) })

  let attachments: any[] = []
  try {
    const { data: att } = await supabase!.from('lesson_attachments').select('*').eq('lesson_id', lesson_id)
    attachments = att || []
  } catch (e: any) {
    console.warn('attachments fetch failed:', e?.message)
  }

  return c.json<ApiResponse>({ success: true, data: { ...lesson, attachments } })
})

export default content
