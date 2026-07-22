// ============================================================
//  VClass — Dúvidas / comentários de aula (lesson_comments)
//
//  Qualquer utilizador autenticado (estudante ou professor) vê todos os
//  comentários aprovados de uma aula e pode responder — é um fórum
//  partilhado por aula, não um chat privado por estudante.
//
//    GET    /api/comments/lesson/:lessonId → lista (perguntas + respostas)
//    POST   /api/comments/lesson/:lessonId → cria { content, parent_comment_id? }
//    POST   /api/comments/:id/like         → incrementa likes_count
//    DELETE /api/comments/:id              → remove (só o autor; respostas
//                                             vão junto via ON DELETE CASCADE)
// ============================================================
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'

const comments = new Hono<{ Bindings: CloudflareBindings }>()

comments.use('/*', authMiddleware)

const USER_JOIN = `
  id, lesson_id, parent_comment_id, content, likes_count, created_at,
  users:user_id ( id, full_name, role )
`

// ── GET /api/comments/lesson/:lessonId ───────────────────────
comments.get('/lesson/:lessonId', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const lessonId = c.req.param('lessonId')

  const { data, error } = await supabase
    .from('lesson_comments')
    .select(USER_JOIN)
    .eq('lesson_id', lessonId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true })

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const rows = data || []
  const byId = new Map(rows.map((r: any) => [r.id, { ...r, replies: [] as any[] }]))
  const roots: any[] = []

  for (const row of byId.values()) {
    if (row.parent_comment_id && byId.has(row.parent_comment_id)) {
      byId.get(row.parent_comment_id)!.replies.push(row)
    } else {
      roots.push(row)
    }
  }

  // Perguntas mais recentes primeiro; respostas mantêm ordem cronológica
  roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return c.json<ApiResponse>({ success: true, data: { comments: roots, total: rows.length } })
})

// ── POST /api/comments/lesson/:lessonId ──────────────────────
comments.post('/lesson/:lessonId', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const lessonId = c.req.param('lessonId')
  const body = await c.req.json().catch(() => ({}))
  const content = String((body as any)?.content || '').trim()
  const parentCommentId = (body as any)?.parent_comment_id || null

  if (!content) {
    return c.json<ApiResponse>({ success: false, error: 'A pergunta/resposta não pode estar vazia' }, 400)
  }

  const { data, error } = await supabase
    .from('lesson_comments')
    .insert({
      lesson_id: lessonId,
      user_id: user.id,
      parent_comment_id: parentCommentId,
      content
    })
    .select(USER_JOIN)
    .single()

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data })
})

// ── POST /api/comments/:id/like ──────────────────────────────
comments.post('/:id/like', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const id = c.req.param('id')

  const { error } = await supabase.rpc('increment_comment_likes', { comment_id: id })
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: null })
})

// ── DELETE /api/comments/:id ─────────────────────────────────
// Respostas à mensagem removida vão junto (parent_comment_id ON DELETE CASCADE).
comments.delete('/:id', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)
  const user = c.get('user')
  const id = c.req.param('id')

  const { data, error } = await supabase
    .from('lesson_comments')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  if (!data || data.length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'Mensagem não encontrada ou não pertence a este utilizador' }, 404)
  }

  return c.json<ApiResponse>({ success: true, data: null })
})

export default comments
