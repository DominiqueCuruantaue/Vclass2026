// JWT utilities for authentication
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRES_IN = '8h' // 8 hours (was 30min - increased for better UX)
const REFRESH_TOKEN_EXPIRES_IN = '30d' // 30 days (was 7d)

export interface JWTPayload {
  sub: string // user_id
  email: string
  role: 'student' | 'teacher' | 'admin'
  name?: string  // display name for watermark
  iat?: number
  exp?: number
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  })
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Generate video streaming token (short-lived, 15 minutes)
 */
export function generateVideoToken(userId: string, lessonId: string, videoId: string): string {
  return jwt.sign(
    {
      userId,
      lessonId,
      videoId,
      type: 'video_access'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
}

/**
 * Verify video token
 */
export function verifyVideoToken(token: string): { userId: string; lessonId: string; videoId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.type !== 'video_access') {
      return null
    }
    
    return {
      userId: decoded.userId,
      lessonId: decoded.lessonId,
      videoId: decoded.videoId
    }
  } catch (error) {
    return null
  }
}
