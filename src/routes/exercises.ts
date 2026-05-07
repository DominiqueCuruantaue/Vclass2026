// Exercises Routes
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { z } from 'zod'
import { initSupabase } from '../config/supabase'
import { authMiddleware, requireStudent } from '../middleware/auth'
import type { ApiResponse } from '../types'

const exercises = new Hono<{ Bindings: CloudflareBindings }>()

// Apply auth middleware
exercises.use('/*', authMiddleware)

// Validation schema
const submitAnswerSchema = z.object({
  exercise_id: z.string().uuid(),
  selected_option_id: z.string().uuid().optional(),
  answer_text: z.string().optional()
})

/**
 * GET /api/exercises/:lesson_id
 * Get exercises for a lesson
 */
exercises.get('/:lesson_id', async (c) => {
  try {
    const lesson_id = c.req.param('lesson_id')
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
    // Get exercises with options
    const { data: exercisesData, error } = await supabase
      .from('exercises')
      .select(`
        id,
        question,
        question_type,
        explanation,
        display_order,
        points,
        options:exercise_options(
          id,
          option_text,
          display_order
        )
      `)
      .eq('lesson_id', lesson_id)
      .order('display_order')
    
    if (error) {
      console.error('Get exercises error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch exercises'
      }, 500)
    }
    
    // Don't send is_correct to students in the initial response
    const sanitized = exercisesData?.map(ex => ({
      ...ex,
      options: ex.options?.map((opt: any) => ({
        id: opt.id,
        option_text: opt.option_text,
        display_order: opt.display_order
      }))
    }))
    
    return c.json<ApiResponse>({
      success: true,
      data: sanitized || []
    })
    
  } catch (error) {
    console.error('Get exercises error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * POST /api/exercises/submit
 * Submit exercise answer (students only)
 */
exercises.post('/submit', requireStudent, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    
    const validation = submitAnswerSchema.safeParse(body)
    
    if (!validation.success) {
      return c.json<ApiResponse>({
        success: false,
        error: validation.error.errors[0].message
      }, 400)
    }
    
    const { exercise_id, selected_option_id, answer_text } = validation.data
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
    // Get exercise details
    const { data: exercise, error: exError } = await supabase
      .from('exercises')
      .select('id, question_type, points, lesson_id')
      .eq('id', exercise_id)
      .single()
    
    if (exError || !exercise) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Exercise not found'
      }, 404)
    }
    
    let is_correct = false
    let points_earned = 0
    
    // Check answer for multiple choice
    if (exercise.question_type === 'multiple_choice' && selected_option_id) {
      const { data: option } = await supabase
        .from('exercise_options')
        .select('is_correct')
        .eq('id', selected_option_id)
        .single()
      
      if (option?.is_correct) {
        is_correct = true
        points_earned = exercise.points
      }
    }
    
    // For essay type, mark as pending review (teacher grades later)
    if (exercise.question_type === 'essay') {
      is_correct = null as any // Will be graded by teacher
    }
    
    // Insert or update submission
    const { data: submission, error: subError } = await supabase
      .from('exercise_submissions')
      .upsert({
        student_id: user.id,
        exercise_id,
        selected_option_id,
        answer_text,
        is_correct,
        points_earned,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,exercise_id'
      })
      .select()
      .single()
    
    if (subError) {
      console.error('Submit answer error:', subError)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to submit answer'
      }, 500)
    }
    
    // Get the correct answer for immediate feedback
    let correctAnswer = null
    
    if (exercise.question_type === 'multiple_choice') {
      const { data: correctOption } = await supabase
        .from('exercise_options')
        .select('id, option_text')
        .eq('exercise_id', exercise_id)
        .eq('is_correct', true)
        .single()
      
      correctAnswer = correctOption
    }
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        ...submission,
        correctAnswer
      },
      message: is_correct ? 'Correct answer!' : 'Incorrect. Try again!'
    })
    
  } catch (error) {
    console.error('Submit exercise error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * GET /api/exercises/results/:lesson_id
 * Get student's exercise results for a lesson
 */
exercises.get('/results/:lesson_id', requireStudent, async (c) => {
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
    
    // Get submissions with exercise details
    const { data, error } = await supabase
      .from('exercise_submissions')
      .select(`
        id,
        exercise_id,
        selected_option_id,
        answer_text,
        is_correct,
        points_earned,
        submitted_at,
        exercise:exercises (
          question,
          question_type,
          points,
          explanation
        )
      `)
      .eq('student_id', user.id)
      .in('exercise_id', 
        supabase
          .from('exercises')
          .select('id')
          .eq('lesson_id', lesson_id)
      )
    
    if (error) {
      console.error('Get results error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to fetch results'
      }, 500)
    }
    
    // Calculate score
    const totalPoints = data?.reduce((sum, s) => sum + (s.points_earned || 0), 0) || 0
    const maxPoints = data?.reduce((sum: any, s: any) => sum + (s.exercise?.points || 0), 0) || 1
    const scorePercent = Math.round((totalPoints / maxPoints) * 100)
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        submissions: data,
        summary: {
          totalExercises: data?.length || 0,
          correctAnswers: data?.filter(s => s.is_correct).length || 0,
          totalPoints,
          maxPoints,
          scorePercent
        }
      }
    })
    
  } catch (error) {
    console.error('Get exercise results error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default exercises
