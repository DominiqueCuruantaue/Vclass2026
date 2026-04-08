// Video Routes - Protected video streaming with tokens
import { Hono } from 'hono'
import { initSupabase } from '../config/supabase'
import { authMiddleware } from '../middleware/auth'
import { generateVideoToken } from '../utils/jwt'
import type { ApiResponse, VideoTokenResponse } from '../types'

const video = new Hono()

// Apply auth middleware to all video routes
video.use('/*', authMiddleware)

/**
 * GET /api/video/:lesson_id/token
 * Generate temporary video access token
 */
video.get('/:lesson_id/token', async (c) => {
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
    
    // Get lesson details
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, video_id, is_free, status')
      .eq('id', lesson_id)
      .single()
    
    if (error || !lesson) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Lesson not found'
      }, 404)
    }
    
    // Check if lesson is published
    if (lesson.status !== 'published' && user.role === 'student') {
      return c.json<ApiResponse>({
        success: false,
        error: 'Lesson not available'
      }, 403)
    }
    
    // Check if lesson has video
    if (!lesson.video_id) {
      return c.json<ApiResponse>({
        success: false,
        error: 'No video available for this lesson'
      }, 404)
    }
    
    // Check access permissions
    if (!lesson.is_free && user.role === 'student') {
      // TODO: Check user subscription status
      // For now, we'll allow all authenticated users
      // In production, implement subscription checking here
      
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        .eq('student_id', user.id)
        .eq('status', 'active')
        .single()
      
      // Uncomment for production
      // if (!subscription || new Date(subscription.expires_at) < new Date()) {
      //   return c.json<ApiResponse>({
      //     success: false,
      //     error: 'Premium subscription required'
      //   }, 403)
      // }
    }
    
    // Generate video access token (15 minutes expiry)
    const token = generateVideoToken(user.id, lesson_id, lesson.video_id)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    
    // Store token in database for validation (optional but recommended)
    await supabase
      .from('video_tokens')
      .insert({
        user_id: user.id,
        lesson_id: lesson_id,
        token: token,
        expires_at: expiresAt,
        ip_address: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
        user_agent: c.req.header('user-agent') || 'unknown'
      })
    
    // Generate stream URL
    // For Bunny.net CDN: https://your-cdn-zone.b-cdn.net/video_id.m3u8?token=xxx
    // For Cloudflare Stream: https://customer-xxxxx.cloudflarestream.com/video_id/manifest/video.m3u8?token=xxx
    
    const BUNNY_CDN_URL = c.env?.BUNNY_CDN_URL || 'https://your-zone.b-cdn.net'
    const streamUrl = `${BUNNY_CDN_URL}/${lesson.video_id}.m3u8?token=${token}`
    
    return c.json<ApiResponse<VideoTokenResponse>>({
      success: true,
      data: {
        token,
        streamUrl,
        expiresAt
      },
      message: 'Video token generated successfully'
    })
    
  } catch (error) {
    console.error('Generate video token error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * POST /api/video/:lesson_id/progress
 * Update video watch progress
 */
video.post('/:lesson_id/progress', async (c) => {
  try {
    const lesson_id = c.req.param('lesson_id')
    const user = c.get('user')
    const body = await c.req.json()
    
    const { last_position, time_spent } = body
    
    if (typeof last_position !== 'number' || typeof time_spent !== 'number') {
      return c.json<ApiResponse>({
        success: false,
        error: 'Invalid progress data'
      }, 400)
    }
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
    // Get lesson video duration
    const { data: lesson } = await supabase
      .from('lessons')
      .select('video_duration')
      .eq('id', lesson_id)
      .single()
    
    if (!lesson) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Lesson not found'
      }, 404)
    }
    
    // Calculate progress percentage
    const progress_percent = lesson.video_duration 
      ? Math.min(100, Math.round((last_position / lesson.video_duration) * 100))
      : 0
    
    // Determine status
    const status = progress_percent >= 90 ? 'completed' : 
                   progress_percent > 0 ? 'in_progress' : 'not_started'
    
    // Update or insert progress
    const { data, error } = await supabase
      .from('student_progress')
      .upsert({
        student_id: user.id,
        lesson_id: lesson_id,
        last_position,
        time_spent,
        progress_percent,
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,lesson_id'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Update progress error:', error)
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to update progress'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      data,
      message: 'Progress updated successfully'
    })
    
  } catch (error) {
    console.error('Update video progress error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * DELETE /api/video/cleanup-tokens
 * Cleanup expired video tokens (can be called by cron job)
 */
video.delete('/cleanup-tokens', async (c) => {
  try {
    // Only allow admin to call this
    const user = c.get('user')
    
    if (user.role !== 'admin') {
      return c.json<ApiResponse>({
        success: false,
        error: 'Admin access required'
      }, 403)
    }
    
    const supabaseUrl = c.env?.SUPABASE_URL
    const supabaseKey = c.env?.SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Database configuration missing'
      }, 500)
    }
    
    const supabase = initSupabase(supabaseUrl, supabaseKey)
    
    // Delete expired tokens
    const { error } = await supabase
      .from('video_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    if (error) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Failed to cleanup tokens'
      }, 500)
    }
    
    return c.json<ApiResponse>({
      success: true,
      message: 'Expired tokens cleaned up successfully'
    })
    
  } catch (error) {
    console.error('Cleanup tokens error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default video
