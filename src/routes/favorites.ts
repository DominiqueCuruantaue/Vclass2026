// ============================================================
//  VClass — Favoritos de aula (lesson_favorites)
//
//    GET    /api/favorites            → lista aulas favoritadas do utilizador
//    GET    /api/favorites/:lessonId  → { favorited: boolean }
//    POST   /api/favorites/:lessonId  → favoritar
//    DELETE /api/favorites/:lessonId  → desfavoritar
// ============================================================
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { logger } from '../utils/logger'
import type { ApiResponse } from '../types'

const favorites = new Hono<{ Bindings: CloudflareBindings }>()

favorites.use('/*', authMiddleware)

const LESSON_JOIN = `
  id, lesson_id, created_at,
  lessons:lesson_id (
    id, title, thumbnail_url, video_duration,
    chapters:chapter_id ( title, slug,
      grade_subjects:grade_subject_id ( subjects:subject_id ( name, color, icon_url ) )
    )
  )
`

// ── GET /api/favorites ───────────────────────────────────────
favorites.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')

  const { data, error } = await supabase
    .from('lesson_favorites')
    .select(LESSON_JOIN)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('favorites GET: listar favoritos', error)
    return c.json<ApiResponse>({ success: false, error: 'Erro ao carregar favoritos' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: data || [] })
})

// ── GET /api/favorites/:lessonId/count ───────────────────────
// Total de "gostos" (favoritos) de uma lição — público entre utilizadores
// autenticados, mostrado junto ao botão de like em lesson.html.
favorites.get('/:lessonId/count', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const lessonId = c.req.param('lessonId')

  const { count, error } = await supabase
    .from('lesson_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId)

  if (error) {
    logger.error('favorites/:lessonId/count GET: contar gostos', error)
    return c.json<ApiResponse>({ success: false, error: 'Erro ao contar gostos' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: { count: count || 0 } })
})

// ── GET /api/favorites/:lessonId ─────────────────────────────
favorites.get('/:lessonId', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const lessonId = c.req.param('lessonId')

  const { data, error } = await supabase
    .from('lesson_favorites')
    .select('id')
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    logger.error('favorites/:lessonId GET: verificar favorito', error)
    return c.json<ApiResponse>({ success: false, error: 'Erro ao verificar favorito' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: { favorited: !!data } })
})

// ── POST /api/favorites/:lessonId ────────────────────────────
favorites.post('/:lessonId', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const lessonId = c.req.param('lessonId')

  const { error } = await supabase
    .from('lesson_favorites')
    .upsert({ student_id: user.id, lesson_id: lessonId }, { onConflict: 'student_id,lesson_id' })

  if (error) {
    logger.error('favorites POST: adicionar favorito', error)
    return c.json<ApiResponse>({ success: false, error: 'Erro ao adicionar favorito' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: { favorited: true } })
})

// ── DELETE /api/favorites/:lessonId ──────────────────────────
favorites.delete('/:lessonId', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const lessonId = c.req.param('lessonId')

  const { error } = await supabase
    .from('lesson_favorites')
    .delete()
    .eq('student_id', user.id)
    .eq('lesson_id', lessonId)

  if (error) {
    logger.error('favorites DELETE: remover favorito', error)
    return c.json<ApiResponse>({ success: false, error: 'Erro ao remover favorito' }, 500)
  }

  return c.json<ApiResponse>({ success: true, data: { favorited: false } })
})

export default favorites
