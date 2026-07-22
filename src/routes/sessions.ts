// Sessões Online (Google Meet) — Route — VClass
// Lado do aluno: consultar as sessões marcadas pelos professores e marcar como vistas.
// A criação/gestão das sessões é feita pelo professor em src/routes/creator.ts.
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'

const sessions = new Hono<{ Bindings: CloudflareBindings }>()
sessions.use('*', authMiddleware)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/sessions — Sessões online agendadas para o aluno autenticado
// ═══════════════════════════════════════════════════════════════════════════════
sessions.get('/', async (c) => {
  const user = c.get('user') as any
  if (!isDatabaseConfigured(c.env)) return c.json({ success: true, data: [] })

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

  try {
    const { data: rows, error } = await supabase
      .from('live_session_recipients')
      .select('id, read_at, session:live_sessions(id, title, description, meet_link, scheduled_at, duration_minutes, status, creator:users(full_name), chapters(title))')
      .eq('student_id', user.id)
    if (error) throw error

    const now = Date.now()
    const data = (rows ?? [])
      .filter((r: any) => r.session && r.session.status === 'scheduled')
      .map((r: any) => ({
        id: r.session.id,
        title: r.session.title,
        description: r.session.description,
        meet_link: r.session.meet_link,
        scheduled_at: r.session.scheduled_at,
        duration_minutes: r.session.duration_minutes,
        teacher_name: r.session.creator?.full_name || 'Professor',
        chapter_title: r.session.chapters?.title || '—',
        read: !!r.read_at,
        is_past: new Date(r.session.scheduled_at).getTime() < now
      }))
      .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

    return c.json({ success: true, data })
  } catch (error: any) {
    console.error('List student sessions error:', error)
    return c.json({ success: false, error: error.message || 'DB error' }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/sessions/:id/read — marcar sessão como vista
// ═══════════════════════════════════════════════════════════════════════════════
sessions.patch('/:id/read', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')
  if (!isDatabaseConfigured(c.env)) return c.json({ success: true })

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

  try {
    const { error } = await supabase
      .from('live_session_recipients')
      .update({ read_at: new Date().toISOString() })
      .eq('session_id', id)
      .eq('student_id', user.id)
    if (error) throw error
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default sessions
