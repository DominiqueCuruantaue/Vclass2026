// Student Progress & Dashboard Routes
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { getSupabase } from '../config/supabase'
import { authMiddleware, requireStudent } from '../middleware/auth'
import { getMockDashboard } from '../middleware/database'
import type { ApiResponse } from '../types'

const progress = new Hono<{ Bindings: CloudflareBindings }>()

// Apply auth middleware
progress.use('/*', authMiddleware)

// Check if database is configured
function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

/**
 * GET /api/progress/dashboard
 * Get student dashboard summary
 */
progress.get('/dashboard', requireStudent, async (c) => {
  try {
    const user = c.get('user')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: dados personalizados por utilizador
      return c.json<ApiResponse>({
        success: true,
        data: getMockDashboard(user?.id),
        message: 'Demo data'
      })
    }
    
    // PRODUCTION MODE: Use Supabase
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    // Get dashboard data from view
    const { data: dashboard, error } = await supabase
      .from('student_dashboard')
      .select('*')
      .eq('student_id', user.id)
      .single()
    
    if (error) {
      console.error('Get dashboard error:', error)
    }
    
    // Get recent activity
    const { data: recentLessons } = await supabase
      .from('student_progress')
      .select(`
        id,
        progress_percent,
        status,
        updated_at,
        lesson:lessons (
          id,
          title,
          thumbnail_url
        )
      `)
      .eq('student_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)
    
    // Get subject progress
    const { data: subjectProgress } = await supabase
      .from('subject_progress_view')
      .select('*')
      .eq('student_id', user.id)
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        stats: dashboard || {
          totalLessons: 0,
          completedLessons: 0,
          totalExercises: 0,
          averageScore: 0
        },
        recentActivity: recentLessons || [],
        subjectProgress: subjectProgress || []
      }
    })
    
  } catch (error) {
    console.error('Get dashboard error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/progress/lesson/:lesson_id
 * Get student's progress for specific lesson
 */
progress.get('/lesson/:lesson_id', requireStudent, async (c) => {
  try {
    const lesson_id = c.req.param('lesson_id')
    const user = c.get('user')
    
    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('lesson_id', lesson_id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Get lesson progress error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch progress'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data: data || {
        student_id: user.id,
        lesson_id,
        status: 'not_started',
        progress_percent: 0,
        time_spent: 0,
        last_position: 0
      }
    })
    
  } catch (error) {
    console.error('Get lesson progress error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/progress/subject/:grade_subject_id
 * Get student's progress for a subject
 */
progress.get('/subject/:grade_subject_id', requireStudent, async (c) => {
  try {
    const grade_subject_id = c.req.param('grade_subject_id')
    const user = c.get('user')
    
    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    // Get all chapters and lessons for this subject
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        description,
        display_order,
        lessons (
          id,
          title,
          display_order
        )
      `)
      .eq('grade_subject_id', grade_subject_id)
      .order('display_order')
    
    if (error) {
      console.error('Get subject progress error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch subject progress'
      }, 500)
    }
    
    // Get student progress for all lessons
    const lessonIds = chapters?.flatMap(ch => (ch.lessons as any[]).map(l => l.id)) || []
    
    const { data: progressData } = await supabase
      .from('student_progress')
      .select('lesson_id, status, progress_percent, completed_at')
      .eq('student_id', user.id)
      .in('lesson_id', lessonIds)
    
    // Create progress map
    const progressMap = new Map(
      progressData?.map(p => [p.lesson_id, p]) || []
    )
    
    // Enrich chapters with progress
    const enriched = chapters?.map(chapter => ({
      ...chapter,
      lessons: (chapter.lessons as any[]).map(lesson => ({
        ...lesson,
        progress: progressMap.get(lesson.id) || {
          status: 'not_started',
          progress_percent: 0
        }
      }))
    }))
    
    // Calculate overall progress
    const totalLessons = lessonIds.length
    const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0
    const overallProgress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        chapters: enriched,
        summary: {
          totalChapters: chapters?.length || 0,
          totalLessons,
          completedLessons,
          overallProgress
        }
      }
    })
    
  } catch (error) {
    console.error('Get subject progress error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/progress/recommendations
 * Get recommended lessons based on student performance
 */
progress.get('/recommendations', requireStudent, async (c) => {
  try {
    const user = c.get('user')
    
    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    // Get lessons with low scores (need review)
    const { data: weakLessons } = await supabase
      .rpc('get_weak_lessons', { student_uuid: user.id })
      .limit(5)
    
    // Get next recommended lessons (in progress or not started)
    const { data: nextLessons } = await supabase
      .from('student_progress')
      .select(`
        lesson:lessons (
          id,
          title,
          description,
          thumbnail_url,
          chapter:chapters (
            title,
            grade_subject:grade_subjects (
              subject:subjects (
                name,
                color
              )
            )
          )
        )
      `)
      .eq('student_id', user.id)
      .in('status', ['not_started', 'in_progress'])
      .order('updated_at', { ascending: false })
      .limit(5)
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        reviewRecommended: weakLessons || [],
        continueWatching: nextLessons || []
      }
    })
    
  } catch (error) {
    console.error('Get recommendations error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/progress/activity
 * Mapa de estudo (últimas 12 semanas) + histórico recente — dados reais,
 * a partir de student_progress e exercise_submissions do próprio aluno.
 * Sem requireStudent: outros papéis (ex: professor) simplesmente não têm
 * linhas nessas tabelas, e recebem um histórico honesto e vazio em vez de 403.
 */
progress.get('/activity', async (c) => {
  try {
    const user = c.get('user')
    const supabase = getSupabase(c.env)
    if (!supabase) {
      return c.json<ApiResponse>({ success: false, error: 'Database configuration missing' }, 500)
    }

    const WEEKS = 12
    const DAYS = WEEKS * 7
    const since = new Date(Date.now() - DAYS * 86400000).toISOString()

    const [progressRes, submissionsRes] = await Promise.all([
      supabase
        .from('student_progress')
        .select('status, progress_percent, updated_at, completed_at, lesson:lessons(title)')
        .eq('student_id', user.id)
        .gte('updated_at', since),
      supabase
        .from('exercise_submissions')
        .select('is_correct, points_earned, submitted_at, exercise:exercises(question, points, lesson:lessons(title))')
        .eq('student_id', user.id)
        .gte('submitted_at', since)
    ])

    const progressRows   = progressRes.data    || []
    const submissionRows = submissionsRes.data || []
    const dateKey = (iso: string) => iso.slice(0, 10)

    // Contagem de eventos por dia (para o heatmap)
    const dayCounts: Record<string, number> = {}
    progressRows.forEach((p: any) => {
      const k = dateKey(p.updated_at)
      dayCounts[k] = (dayCounts[k] || 0) + 1
    })
    submissionRows.forEach((s: any) => {
      const k = dateKey(s.submitted_at)
      dayCounts[k] = (dayCounts[k] || 0) + 1
    })

    const heatmap: { date: string; count: number }[] = []
    for (let i = DAYS - 1; i >= 0; i--) {
      const k = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      heatmap.push({ date: k, count: dayCounts[k] || 0 })
    }

    // Histórico recente — combina lições e exercícios, mais recentes primeiro
    const events: any[] = []
    progressRows.forEach((p: any) => {
      if (p.status === 'completed') {
        events.push({ type: 'lesson_completed', title: p.lesson?.title || 'Lição', time: p.completed_at || p.updated_at })
      } else if (p.status === 'in_progress') {
        events.push({ type: 'lesson_progress', title: p.lesson?.title || 'Lição', time: p.updated_at, progress: p.progress_percent })
      }
    })
    submissionRows.forEach((s: any) => {
      events.push({
        type: 'exercise',
        title: s.exercise?.lesson?.title || s.exercise?.question || 'Exercício',
        time: s.submitted_at,
        correct: s.is_correct,
        points: s.points_earned || 0,
        maxPoints: s.exercise?.points ?? 1
      })
    })
    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return c.json<ApiResponse>({
      success: true,
      data: { heatmap, recentActivity: events.slice(0, 15) }
    })
  } catch (error) {
    console.error('Get activity error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default progress
