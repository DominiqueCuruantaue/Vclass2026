// Content Routes - Countries, Grades, Subjects, Chapters, Lessons
import { Hono } from 'hono'
import { getSupabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth'
import { 
  mockCountries, 
  mockEducationSystems, 
  mockGrades, 
  mockSubjects, 
  mockChapters, 
  mockLessons 
} from '../middleware/database'
import type { ApiResponse, PaginatedResponse } from '../types'

const content = new Hono()

// Check if database is configured
function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

/**
 * GET /api/content/countries
 * Get all active countries
 */
content.get('/countries', async (c) => {
  try {
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock countries
      return c.json<ApiResponse>({
        success: true,
        data: mockCountries,
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
    
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch countries'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Get countries error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/education-systems/:country_id
 * Get education systems for a country
 */
content.get('/education-systems/:country_id', async (c) => {
  try {
    const country_id = c.req.param('country_id')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock education systems
      const systems = mockEducationSystems.filter(s => s.country_id === country_id)
      return c.json<ApiResponse>({
        success: true,
        data: systems,
        message: 'Demo data (database not configured)'
      })
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    const { data, error } = await supabase
      .from('education_systems')
      .select('*')
      .eq('country_id', country_id)
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch education systems'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Get education systems error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/grades/:education_system_id
 * Get grades for an education system
 */
content.get('/grades/:education_system_id', async (c) => {
  try {
    const education_system_id = c.req.param('education_system_id')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock grades
      const grades = mockGrades.filter(g => g.education_system_id === education_system_id)
      return c.json<ApiResponse>({
        success: true,
        data: grades,
        message: 'Demo data (database not configured)'
      })
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('education_system_id', education_system_id)
      .order('display_order')
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch grades'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Get grades error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/subjects/:grade_id
 * Get subjects for a grade with relationship info
 */
content.get('/subjects/:grade_id', async (c) => {
  try {
    const grade_id = c.req.param('grade_id')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock subjects
      const subjects = mockSubjects.filter(s => s.grade_id === grade_id)
      return c.json<ApiResponse>({
        success: true,
        data: subjects,
        message: 'Demo data (database not configured)'
      })
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    // Get subjects with grade_subjects relationship
    const { data, error } = await supabase
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
    
    if (error) {
      console.error('Supabase error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch subjects'
      }, 500)
    }
    
    // Flatten the structure
    const subjects = data?.map(item => ({
      grade_subject_id: item.id,
      is_mandatory: item.is_mandatory,
      workload_hours: item.workload_hours,
      ...(item.subject as any)
    })) || []
    
    return c.json<ApiResponse>({
      success: true,
      data: subjects
    })
    
  } catch (error) {
    console.error('Get subjects error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/chapters/:grade_subject_id
 * Get chapters for a grade-subject
 */
content.get('/chapters/:grade_subject_id', async (c) => {
  try {
    const grade_subject_id = c.req.param('grade_subject_id')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock chapters
      const chapters = mockChapters.filter(ch => ch.grade_subject_id === grade_subject_id)
      return c.json<ApiResponse>({
        success: true,
        data: chapters,
        message: 'Demo data (database not configured)'
      })
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('grade_subject_id', grade_subject_id)
      .order('display_order')
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch chapters'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Get chapters error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/lessons/:chapter_id
 * Get lessons for a chapter (requires auth to check access)
 */
content.get('/lessons/:chapter_id', authMiddleware, async (c) => {
  try {
    const chapter_id = c.req.param('chapter_id')
    const user = c.get('user')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock lessons
      const lessons = mockLessons.filter(l => l.chapter_id === chapter_id)
      return c.json<ApiResponse>({
        success: true,
        data: lessons,
        message: 'Demo data (database not configured)'
      })
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    // Build query based on user role
    let query = supabase
      .from('lessons')
      .select('id, title, description, thumbnail_url, display_order, is_free, video_duration, views_count, status, created_at')
      .eq('chapter_id', chapter_id)
      .order('display_order')
    
    // Only show published lessons for students
    if (user.role === 'student') {
      query = query.eq('status', 'published')
    }
    
    const { data, error } = await query
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch lessons'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data
    })
    
  } catch (error) {
    console.error('Get lessons error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/content/lesson/:lesson_id
 * Get single lesson details (requires auth)
 */
content.get('/lesson/:lesson_id', async (c) => {
  try {
    const lesson_id = c.req.param('lesson_id')
    
    // Check if database is configured
    if (!isDatabaseConfigured(c.env)) {
      // DEMO MODE: Return mock lesson
      const lesson = mockLessons.find(l => l.id === lesson_id)
      
      if (!lesson) {
        return c.json<ApiResponse>({
          success: false,
          error: 'Lesson not found'
        }, 404)
      }
      
      return c.json<ApiResponse>({
        success: true,
        data: {
          ...lesson,
          attachments: [],
          views_count: 0,
          content: `<h2>${lesson.title}</h2><p>${lesson.description}</p><p>Este é o conteúdo completo da lição. Em modo demo, o conteúdo é simulado.</p>`,
          summary: lesson.description
        },
        message: 'Demo data (database not configured)'
      })
    }
    
    // PRODUCTION MODE: Require authentication
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json<ApiResponse>({
        success: false,
        error: 'No token provided'
      }, 401)
    }
    
    const supabase = getSupabase(c.env)
    
    if (!supabase) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration error'
      }, 500)
    }
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lesson_id)
      .single()
    
    if (error || !lesson) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Lesson not found'
      }, 404)
    }
    
    // Increment view count
    await supabase
      .from('lessons')
      .update({ views_count: lesson.views_count + 1 })
      .eq('id', lesson_id)
    
    // Get lesson attachments
    const { data: attachments } = await supabase
      .from('lesson_attachments')
      .select('*')
      .eq('lesson_id', lesson_id)
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        ...lesson,
        attachments: attachments || []
      }
    })
    
  } catch (error) {
    console.error('Get lesson error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default content
