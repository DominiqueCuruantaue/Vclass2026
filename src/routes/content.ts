// Content Routes - Countries, Grades, Subjects, Chapters, Lessons
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { getSupabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth'
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
 * Retorna as lições publicadas mais recentes criadas por professores.
 */
content.get('/recent-lessons', async (c) => {
  const { supabase, error } = requireSupabase(c)
  if (error) return error
  const limit = Math.min(parseInt(c.req.query('limit') || '6', 10), 20)

  const { data, error: dbError } = await supabase!
    .from('lessons')
    .select('id, title, description, thumbnail_url, video_duration, views_count, created_at, chapter_id, chapters(title, slug, grade_subjects(subjects(name, color, icon_name), grades(name)))')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dbError) {
    console.error('Get recent lessons error:', dbError)
    return c.json<ApiResponse>({ success: false, error: 'Failed to fetch recent lessons' }, 500)
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
