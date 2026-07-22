// Notifications Route — VClass
// Gera notificações baseadas em eventos reais do progresso do estudante
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { z } from 'zod'
import type { ApiResponse } from '../types'
import { isLessonVideoReady } from '../utils/bunny'

const notifications = new Hono<{ Bindings: CloudflareBindings }>()
notifications.use('*', authMiddleware)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
}

// ── Geração de notificações sintéticas baseadas em progresso ──────────────────
// Quando não há DB configurada, gera notifs coerentes com timestamp relativo
function generateDemoNotifications(userId: string) {
  const now = Date.now()
  const h = (n: number) => new Date(now - n * 3600000).toISOString()
  const d = (n: number) => new Date(now - n * 86400000).toISOString()

  return [
    {
      id: 'n-streak-7',
      type: 'achievement',
      title: '🔥 Sequência de 7 dias!',
      message: 'Parabéns! Estudaste 7 dias consecutivos. Mantém o ritmo!',
      read: false,
      created_at: h(1),
      action_url: '/achievements.html'
    },
    {
      id: 'n-lesson-new',
      type: 'lesson',
      title: '📹 Nova Lição Disponível',
      message: '"Funções Trigonométricas" foi adicionada ao capítulo de Matemática.',
      read: false,
      created_at: h(3),
      action_url: '/browse.html'
    },
    {
      id: 'n-exercise-result',
      type: 'exercise',
      title: '✅ Exercício Avaliado',
      message: 'O teu exercício "Leis de Newton" foi avaliado. Pontuação: 85%',
      read: false,
      created_at: h(6),
      action_url: '/progress.html'
    },
    {
      id: 'n-achievement-first',
      type: 'achievement',
      title: '🏆 Conquista Desbloqueada',
      message: 'Conquistaste "Primeiro Passo" por completares a tua primeira lição!',
      read: true,
      created_at: d(1),
      action_url: '/achievements.html'
    },
    {
      id: 'n-progress-25',
      type: 'progress',
      title: '📊 25% do Currículo Completo',
      message: 'Completaste 25% do currículo de Matemática. Continua!',
      read: true,
      created_at: d(2),
      action_url: '/progress.html'
    },
    {
      id: 'n-lesson-reminder',
      type: 'reminder',
      title: '⏰ Lembra-te de estudar hoje',
      message: 'Tens 3 lições pendentes em Física. Não quebres a sequência!',
      read: true,
      created_at: d(3),
      action_url: '/browse.html'
    },
  ]
}

// ── Gerar notificações reais a partir de dados do Supabase ────────────────────
async function generateRealNotifications(supabase: any, userId: string) {
  const notifs: any[] = []
  const now = new Date()

  try {
    // 1) Progresso recente
    const { data: progress } = await supabase
      .from('student_progress')
      .select('id, status, progress_percent, updated_at, lesson:lessons(title)')
      .eq('student_id', userId)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(3)

    if (progress) {
      for (const p of progress) {
        const ageHours = (now.getTime() - new Date(p.updated_at).getTime()) / 3600000
        if (ageHours < 72) {
          notifs.push({
            id: `prog-${p.id}`,
            type: 'lesson',
            title: '✅ Lição Concluída',
            message: `Completaste "${p.lesson?.title || 'Lição'}" com sucesso!`,
            read: ageHours > 24,
            created_at: p.updated_at,
            action_url: '/progress.html'
          })
        }
      }
    }

    // 2) Exercícios recentes
    const { data: submissions } = await supabase
      .from('exercise_submissions')
      .select('id, points_earned, submitted_at, exercise:exercises(question)')
      .eq('student_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(2)

    if (submissions) {
      for (const s of submissions) {
        const ageHours = (now.getTime() - new Date(s.submitted_at).getTime()) / 3600000
        if (ageHours < 48) {
          notifs.push({
            id: `sub-${s.id}`,
            type: 'exercise',
            title: '📝 Exercício Respondido',
            message: `Respondeste um exercício. Pontos ganhos: ${s.points_earned || 0}`,
            read: ageHours > 12,
            created_at: s.submitted_at,
            action_url: '/progress.html'
          })
        }
      }
    }

    // 3) Sessões online (Google Meet) marcadas para o aluno
    const { data: sessionRows } = await supabase
      .from('live_session_recipients')
      .select('id, read_at, created_at, session:live_sessions(id, title, scheduled_at, status, creator:users(full_name))')
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (sessionRows) {
      for (const r of sessionRows as any[]) {
        const s = r.session
        if (!s || s.status !== 'scheduled') continue
        const ageHours = (now.getTime() - new Date(r.created_at).getTime()) / 3600000
        if (ageHours < 168) {
          const when = new Date(s.scheduled_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          notifs.push({
            id: `session-${s.id}`,
            type: 'session',
            title: '📅 Sessão Online Agendada',
            message: `${s.creator?.full_name || 'O professor'} marcou "${s.title}" para ${when} via Google Meet.`,
            read: !!r.read_at,
            created_at: r.created_at,
            action_url: '/dashboard.html#sessions'
          })
        }
      }
    }
  } catch (e) {
    console.error('Error generating real notifications:', e)
  }

  // Preencher com notifs estáticas se poucas
  if (notifs.length < 3) {
    const demo = generateDemoNotifications(userId).slice(0, 4 - notifs.length)
    notifs.push(...demo)
  }

  return notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// ── Notificações para o admin: lições na fila de aprovação ────────────────────
// Cada professor que clica "Publicar" só envia a lição para 'pending_review';
// o admin precisa de ser avisado para rever e aprovar (ver src/routes/creator.ts).
async function generateAdminNotifications(supabase: any, env?: any) {
  try {
    const { data: pendingRaw } = await supabase
      .from('lessons')
      .select('id, title, updated_at, created_by, video_id, video_url')
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: false })
      .limit(20)

    if (!pendingRaw || pendingRaw.length === 0) return []

    // Só notifica depois do vídeo estar mesmo pronto no Bunny — evita o admin ser
    // avisado (e tentado a aprovar) uma lição cujo vídeo ainda está a processar.
    const readyFlags = await Promise.all(pendingRaw.map((l: any) => isLessonVideoReady(env, l)))
    const pending = pendingRaw.filter((_: any, i: number) => readyFlags[i])
    if (pending.length === 0) return []

    // Nomes dos professores (consulta separada — evita depender de embeds/FK hints)
    const creatorIds = [...new Set(pending.map((l: any) => l.created_by).filter(Boolean))]
    const namesById: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase.from('users').select('id, full_name').in('id', creatorIds)
      ;(creators || []).forEach((u: any) => { namesById[u.id] = u.full_name })
    }

    return pending.map((l: any) => ({
      id: `lesson-review-${l.id}`,
      type: 'review',
      title: '📚 Lição aguarda aprovação',
      message: `"${l.title}" foi enviada por ${namesById[l.created_by] || 'um professor'} e aguarda a sua revisão.`,
      read: false,
      created_at: l.updated_at,
      action_url: `/admin-dashboard.html?tab=content&status=pending_review&lesson=${l.id}`
    }))
  } catch (e) {
    console.error('Error generating admin notifications:', e)
    return []
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/notifications
// ═══════════════════════════════════════════════════════════════════════════════
notifications.get('/', async (c) => {
  try {
    const user = c.get('user')
    const unreadOnly = c.req.query('unread') === 'true'

    if (!isDatabaseConfigured(c.env)) {
      let data = generateDemoNotifications(user.id)
      if (unreadOnly) data = data.filter(n => !n.read)
      return c.json<ApiResponse>({
        success: true,
        data,
        message: 'demo'
      })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    let data = user.role === 'admin'
      ? await generateAdminNotifications(supabase, c.env)
      : await generateRealNotifications(supabase, user.id)
    if (unreadOnly) data = data.filter((n: any) => !n.read)

    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/notifications/unread-count
// ═══════════════════════════════════════════════════════════════════════════════
notifications.get('/unread-count', async (c) => {
  try {
    const user = c.get('user')

    if (!isDatabaseConfigured(c.env)) {
      const data = generateDemoNotifications(user.id)
      const count = data.filter(n => !n.read).length
      return c.json<ApiResponse>({ success: true, data: { count } })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    const data = user.role === 'admin'
      ? await generateAdminNotifications(supabase, c.env)
      : await generateRealNotifications(supabase, user.id)
    const count = data.filter((n: any) => !n.read).length
    return c.json<ApiResponse>({ success: true, data: { count } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/notifications/:id/read — marcar como lida
// ═══════════════════════════════════════════════════════════════════════════════
notifications.patch('/:id/read', async (c) => {
  const id = c.req.param('id')

  // Notificações de sessão têm estado real na BD (live_session_recipients) —
  // sincroniza para que a secção "Sessões" do dashboard reflita a leitura.
  if (id.startsWith('session-') && isDatabaseConfigured(c.env)) {
    const sessionId = id.slice('session-'.length)
    const supabase = getSupabase(c.env)
    if (supabase) {
      try {
        const user = c.get('user')
        await supabase
          .from('live_session_recipients')
          .update({ read_at: new Date().toISOString() })
          .eq('session_id', sessionId)
          .eq('student_id', user.id)
      } catch (e) {
        console.error('Error marking session notification as read:', e)
      }
    }
  }

  // Demais tipos: sintéticos — o frontend gere estado no localStorage
  return c.json<ApiResponse>({ success: true, data: { id, read: true } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/notifications/mark-all-read
// ═══════════════════════════════════════════════════════════════════════════════
notifications.post('/mark-all-read', async (c) => {
  return c.json<ApiResponse>({ success: true, message: 'Todas marcadas como lidas' })
})

export default notifications
