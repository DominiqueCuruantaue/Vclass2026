// ============================================================
//  VClass — Marcadores de vídeo (lesson_bookmarks)
//
//    GET    /api/bookmarks?lesson_id=X → marcadores de uma aula
//    GET    /api/bookmarks             → todos os marcadores do utilizador
//    POST   /api/bookmarks             → cria { lesson_id, time_seconds, title }
//    DELETE /api/bookmarks/:id         → remove
// ============================================================
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'

const bookmarks = new Hono<{ Bindings: CloudflareBindings }>()

bookmarks.use('/*', authMiddleware)

const LESSON_JOIN = `
  id, lesson_id, time_seconds, title, created_at,
  lessons:lesson_id (
    id, title, thumbnail_url, video_duration,
    chapters:chapter_id ( title, slug,
      grade_subjects:grade_subject_id ( subjects:subject_id ( name, color, icon_url ) )
    )
  )
`

// ── GET /api/bookmarks ───────────────────────────────────────
bookmarks.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const lessonId = c.req.query('lesson_id')

  let query = supabase
    .from('lesson_bookmarks')
    .select(LESSON_JOIN)
    .eq('student_id', user.id)
    .order('time_seconds', { ascending: true })

  if (lessonId) query = query.eq('lesson_id', lessonId)

  const { data, error } = await query
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: data || [] })
})

// ── POST /api/bookmarks ──────────────────────────────────────
bookmarks.post('/', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const body = await c.req.json().catch(() => ({}))
  const { lesson_id, time_seconds, title } = body as { lesson_id?: string; time_seconds?: number; title?: string }

  if (!lesson_id || typeof time_seconds !== 'number' || time_seconds < 0) {
    return c.json<ApiResponse>({ success: false, error: 'lesson_id e time_seconds são obrigatórios' }, 400)
  }

  const { data, error } = await supabase
    .from('lesson_bookmarks')
    .insert({
      student_id: user.id,
      lesson_id,
      time_seconds: Math.floor(time_seconds),
      title: (title || '').trim() || 'Marcador'
    })
    .select('id, lesson_id, time_seconds, title, created_at')
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

// ── DELETE /api/bookmarks/:id ────────────────────────────────
bookmarks.delete('/:id', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const id = c.req.param('id')

  const { error } = await supabase
    .from('lesson_bookmarks')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: null })
})

export default bookmarks
