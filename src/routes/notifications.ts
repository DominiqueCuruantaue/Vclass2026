// Notifications Route — VClass
// Gera notificações baseadas em eventos reais do progresso do estudante
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { z } from 'zod'
import type { ApiResponse } from '../types'

const notifications = new Hono()
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

    let data = await generateRealNotifications(supabase, user.id)
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

    const data = await generateRealNotifications(supabase, user.id)
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
  // Em demo mode, o frontend gere estado no localStorage
  return c.json<ApiResponse>({ success: true, data: { id: c.req.param('id'), read: true } })
})

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/notifications/mark-all-read
// ═══════════════════════════════════════════════════════════════════════════════
notifications.post('/mark-all-read', async (c) => {
  return c.json<ApiResponse>({ success: true, message: 'Todas marcadas como lidas' })
})

export default notifications
