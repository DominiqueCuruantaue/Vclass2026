// Student Progress & Dashboard Routes
import { Hono } from 'hono'
import { getSupabase } from '../config/supabase'
import { authMiddleware, requireStudent } from '../middleware/auth'
import { mockDashboardData } from '../middleware/database'
import type { ApiResponse } from '../types'

const progress = new Hono()

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
      // DEMO MODE: Return mock data
      return c.json<ApiResponse>({
        success: true,
        data: mockDashboardData,
        message: 'Demo data (database not configured)'
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
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
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
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
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
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
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

export default progress
