// Editor Routes — /api/editor/*
// Revisão e aprovação pedagógica de conteúdo — dados reais do Supabase.
// Aprovar publica a lição a valer (status → 'published'); rejeitar/pedir
// alterações devolve-a a rascunho com o feedback do editor gravado
// (colunas review_feedback/review_action, ver migration 021).
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireEditorOrAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { isLessonVideoReady } from '../utils/bunny'
import type { ApiResponse } from '../types'

const editor = new Hono<{ Bindings: CloudflareBindings }>()
editor.use('/*', authMiddleware)
editor.use('/*', requireEditorOrAdmin)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
}

const COUNTRY_FLAG_EMOJI: Record<string, string> = { mz: '🇲🇿', ao: '🇦🇴', pt: '🇵🇹', br: '🇧🇷', cv: '🇨🇻' }
const COUNTRY_NAME: Record<string, string> = { mz: 'Moçambique', ao: 'Angola', pt: 'Portugal', br: 'Brasil', cv: 'Cabo Verde' }

// ── Mock mínimo — só usado quando a BD não está configurada (dev local) ────
function mockQueue() {
  return [{
    id: 'demo-1', title: 'Lição de demonstração', description: 'Sem base de dados configurada.',
    subject: 'Matemática', chapter: '—', grade: '—', country: 'Moçambique', country_flag: '🇲🇿',
    creator: 'Professor Demo', duration_min: 10, exercises_count: 0, status: 'pending_review',
    review_feedback: null, review_action: null, submitted_at: new Date().toISOString(), video_url: null, video_id: null
  }]
}

// ── Lições + disciplina/capítulo/classe (join chapters→grade_subjects→subjects/grades)
//    + nome e país do professor + nº real de exercícios. ─────────────────────
async function fetchReviewLessons(supabase: any, statusIn: string[], opts: { orderBy?: string; ascending?: boolean } = {}) {
  let q = supabase.from('lessons').select(
    `id, title, description, status, video_id, video_url, video_duration, created_at, updated_at, created_by,
     review_feedback, review_action,
     chapter:chapters(title, grade_subject:grade_subjects(subject:subjects(name), grade:grades(name)))`
  ).in('status', statusIn)
  q = q.order(opts.orderBy || 'updated_at', { ascending: opts.ascending ?? false })

  const { data, error } = await q
  if (error) { console.error('fetchReviewLessons error:', error); return [] }
  const rows = data || []

  const creatorIds = [...new Set(rows.map((l: any) => l.created_by).filter(Boolean))]
  const creators: Record<string, { full_name: string; country_code: string | null }> = {}
  if (creatorIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name, country_code').in('id', creatorIds)
    ;(users || []).forEach((u: any) => { creators[u.id] = u })
  }

  const lessonIds = rows.map((l: any) => l.id)
  const exCounts: Record<string, number> = {}
  if (lessonIds.length > 0) {
    const { data: exercises } = await supabase.from('exercises').select('id, lesson_id').in('lesson_id', lessonIds)
    ;(exercises || []).forEach((e: any) => { exCounts[e.lesson_id] = (exCounts[e.lesson_id] || 0) + 1 })
  }

  return rows.map((l: any) => {
    const creator = creators[l.created_by]
    const cc = creator?.country_code || null
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      subject: l.chapter?.grade_subject?.subject?.name || null,
      chapter: l.chapter?.title || null,
      grade: l.chapter?.grade_subject?.grade?.name || null,
      country: cc ? (COUNTRY_NAME[cc] || cc) : null,
      country_flag: cc ? (COUNTRY_FLAG_EMOJI[cc] || '🏳️') : null,
      creator: creator?.full_name || null,
      duration_min: Math.round((l.video_duration || 0) / 60),
      exercises_count: exCounts[l.id] || 0,
      status: l.status,
      review_feedback: l.review_feedback,
      review_action: l.review_action,
      submitted_at: l.updated_at || l.created_at,
      video_url: l.video_url,
      video_id: l.video_id
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/stats
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/stats', async (c) => {
  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: true, data: { pending: 1, approved_week: 0, rejected_week: 0, changes_requested_week: 0, approved_total: 0, rejected_total: 0, approval_rate: 0, avg_review_hours: null, by_subject: [], by_country: [] } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const { data: lessonsRaw } = await supabase
    .from('lessons')
    .select('id, status, review_action, updated_at, created_by, video_id, video_url, chapter:chapters(grade_subject:grade_subjects(subject:subjects(name)))')
  const lessons = lessonsRaw || []

  const pendingRaw = lessons.filter((l: any) => l.status === 'pending_review')
  const readyFlags = await Promise.all(pendingRaw.map((l: any) => isLessonVideoReady(c.env as any, l)))
  const pending = pendingRaw.filter((_: any, i: number) => readyFlags[i])

  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const approved_week           = lessons.filter((l: any) => l.status === 'published' && new Date(l.updated_at) >= weekAgo).length
  const rejected_week           = lessons.filter((l: any) => l.status === 'draft' && l.review_action === 'rejected'         && new Date(l.updated_at) >= weekAgo).length
  const changes_requested_week  = lessons.filter((l: any) => l.status === 'draft' && l.review_action === 'changes_requested' && new Date(l.updated_at) >= weekAgo).length

  const approved_total = lessons.filter((l: any) => l.status === 'published').length
  const rejected_total = lessons.filter((l: any) => l.status === 'draft' && l.review_action === 'rejected').length
  const approval_rate  = (approved_total + rejected_total) > 0 ? Math.round((approved_total / (approved_total + rejected_total)) * 100) : 0

  const bySubject: Record<string, number> = {}
  pending.forEach((l: any) => {
    const s = l.chapter?.grade_subject?.subject?.name || 'Outra'
    bySubject[s] = (bySubject[s] || 0) + 1
  })

  const byCountry: Record<string, number> = {}
  const creatorIds = [...new Set(pending.map((l: any) => l.created_by).filter(Boolean))]
  if (creatorIds.length > 0) {
    const { data: creatorsRows } = await supabase.from('users').select('id, country_code').in('id', creatorIds)
    const ccById: Record<string, string> = {}
    ;(creatorsRows || []).forEach((u: any) => { ccById[u.id] = u.country_code })
    pending.forEach((l: any) => {
      const cc = ccById[l.created_by] || 'outro'
      byCountry[cc] = (byCountry[cc] || 0) + 1
    })
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      pending: pending.length,
      approved_week,
      rejected_week,
      changes_requested_week,
      approved_total,
      rejected_total,
      approval_rate,
      avg_review_hours: null, // sem timestamp de entrada/saída da fila — sem histórico, sem forma honesta de calcular
      by_subject: Object.entries(bySubject).map(([subject, count]) => ({ subject, count })),
      by_country: Object.entries(byCountry).map(([code, count]) => ({
        code, country: COUNTRY_NAME[code] || code, flag: COUNTRY_FLAG_EMOJI[code] || '🏳️', count
      }))
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/queue — fila de revisão
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/queue', async (c) => {
  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: true, data: { lessons: mockQueue(), total: 1 } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const subject = c.req.query('subject') || 'all'
  const country = c.req.query('country') || 'all'
  const search  = (c.req.query('search') || '').toLowerCase()

  let lessons = await fetchReviewLessons(supabase, ['pending_review'])

  // Só entra na fila do editor depois do vídeo estar mesmo pronto no Bunny —
  // evita rever/aprovar uma lição cujo vídeo ainda está a processar.
  const readyFlags = await Promise.all(lessons.map((l: any) => isLessonVideoReady(c.env as any, { video_id: l.video_id, video_url: l.video_url })))
  lessons = lessons.filter((_: any, i: number) => readyFlags[i])

  if (subject !== 'all') lessons = lessons.filter((l: any) => l.subject === subject)
  if (country !== 'all') lessons = lessons.filter((l: any) => l.country === country)
  if (search) lessons = lessons.filter((l: any) => l.title.toLowerCase().includes(search) || (l.creator || '').toLowerCase().includes(search))

  return c.json<ApiResponse>({ success: true, data: { lessons, total: lessons.length } })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/queue/:id
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/queue/:id', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const id = c.req.param('id')
  const { data: l, error } = await supabase.from('lessons').select(
    `id, title, description, status, video_id, video_url, video_duration, created_at, updated_at, created_by,
     review_feedback, review_action,
     chapter:chapters(title, grade_subject:grade_subjects(subject:subjects(name), grade:grades(name)))`
  ).eq('id', id).maybeSingle()

  if (error || !l) return c.json<ApiResponse>({ success: false, error: 'Lição não encontrada' }, 404)

  let creator: any = null
  if (l.created_by) {
    const { data: u } = await supabase.from('users').select('full_name, country_code').eq('id', l.created_by).maybeSingle()
    creator = u
  }
  const { count: exCount } = await supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('lesson_id', id)
  const cc = creator?.country_code || null

  return c.json<ApiResponse>({
    success: true,
    data: {
      id: l.id, title: l.title, description: l.description, status: l.status,
      subject: l.chapter?.grade_subject?.subject?.name || null,
      chapter: l.chapter?.title || null,
      grade: l.chapter?.grade_subject?.grade?.name || null,
      country: cc ? (COUNTRY_NAME[cc] || cc) : null,
      country_flag: cc ? (COUNTRY_FLAG_EMOJI[cc] || '🏳️') : null,
      creator: creator?.full_name || null,
      duration_min: Math.round((l.video_duration || 0) / 60),
      exercises_count: exCount || 0,
      review_feedback: l.review_feedback,
      review_action: l.review_action,
      submitted_at: l.updated_at || l.created_at,
      video_url: l.video_url,
      video_id: l.video_id
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/editor/queue/:id/approve — publica a lição a valer
// ═══════════════════════════════════════════════════════════════════════════
editor.post('/queue/:id/approve', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const id = c.req.param('id')
  const { data: lesson } = await supabase.from('lessons').select('video_id, video_url').eq('id', id).maybeSingle()
  if (!lesson) return c.json<ApiResponse>({ success: false, error: 'Lição não encontrada' }, 404)

  const ready = await isLessonVideoReady(c.env as any, lesson)
  if (!ready) return c.json<ApiResponse>({ success: false, error: 'O vídeo desta lição ainda está a processar no Bunny.net. Aguarde terminar antes de aprovar.' }, 409)

  const { data, error } = await supabase
    .from('lessons')
    .update({ status: 'published', review_feedback: null, review_action: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  if (error || !data) return c.json<ApiResponse>({ success: false, error: error?.message || 'Falha ao aprovar' }, 500)
  return c.json<ApiResponse>({ success: true, data, message: 'Lição aprovada e publicada' })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/editor/queue/:id/reject — devolve a rascunho com o motivo
// ═══════════════════════════════════════════════════════════════════════════
editor.post('/queue/:id/reject', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { feedback?: string }
  if (!body.feedback) return c.json<ApiResponse>({ success: false, error: 'Feedback obrigatório ao rejeitar' }, 400)

  const { data, error } = await supabase
    .from('lessons')
    .update({ status: 'draft', review_feedback: body.feedback, review_action: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  if (error || !data) return c.json<ApiResponse>({ success: false, error: error?.message || 'Lição não encontrada' }, 404)
  return c.json<ApiResponse>({ success: true, data, message: 'Lição rejeitada — devolvida ao professor com o feedback' })
})

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/editor/queue/:id/request-changes
// ═══════════════════════════════════════════════════════════════════════════
editor.post('/queue/:id/request-changes', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { feedback?: string }
  if (!body.feedback) return c.json<ApiResponse>({ success: false, error: 'Feedback obrigatório ao pedir alterações' }, 400)

  const { data, error } = await supabase
    .from('lessons')
    .update({ status: 'draft', review_feedback: body.feedback, review_action: 'changes_requested', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .maybeSingle()

  if (error || !data) return c.json<ApiResponse>({ success: false, error: error?.message || 'Lição não encontrada' }, 404)
  return c.json<ApiResponse>({ success: true, data, message: 'Pedido de alterações enviado ao professor' })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/approved
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/approved', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: true, data: { lessons: [], total: 0 } })
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const lessons = await fetchReviewLessons(supabase, ['published'], { orderBy: 'updated_at', ascending: false })
  return c.json<ApiResponse>({ success: true, data: { lessons, total: lessons.length } })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/rejected
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/rejected', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: true, data: { lessons: [], total: 0 } })
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Database não configurada' }, 500)

  const all = await fetchReviewLessons(supabase, ['draft'], { orderBy: 'updated_at', ascending: false })
  const lessons = all.filter((l: any) => l.review_action === 'rejected')
  return c.json<ApiResponse>({ success: true, data: { lessons, total: lessons.length } })
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/editor/history — sem tabela de auditoria própria (ver plano); a UI
// não tem aba de histórico hoje, este endpoint fica pronto mas honesto.
// ═══════════════════════════════════════════════════════════════════════════
editor.get('/history', async (c) => {
  return c.json<ApiResponse>({ success: true, data: { history: [], total: 0 } })
})

export default editor
