// JWT utilities for authentication
import jwt from 'jsonwebtoken'
import type { UserRole } from '../types'

const JWT_EXPIRES_IN = '8h'
const REFRESH_TOKEN_EXPIRES_IN = '30d'
const VIDEO_TOKEN_EXPIRES_IN = '15m'

export interface JWTPayload {
  sub: string
  email: string
  role: UserRole
  name?: string
  iat?: number
  exp?: number
}

interface RefreshPayload extends JWTPayload {
  type: 'refresh'
}

interface VideoPayload {
  userId: string
  lessonId: string
  videoId: string
  type: 'video_access'
}

function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET not configured (must be set as Cloudflare secret with ≥16 chars)')
  }
  return secret
}

export function generateAccessToken(payload: JWTPayload, secret: string | undefined): string {
  return jwt.sign(payload, requireSecret(secret), { expiresIn: JWT_EXPIRES_IN })
}

export function generateRefreshToken(payload: JWTPayload, secret: string | undefined): string {
  const refreshPayload: RefreshPayload = { ...payload, type: 'refresh' }
  return jwt.sign(refreshPayload, requireSecret(secret), { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

export function verifyToken(token: string, secret: string | undefined): JWTPayload | null {
  try {
    return jwt.verify(token, requireSecret(secret)) as JWTPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string, secret: string | undefined): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, requireSecret(secret)) as RefreshPayload
    if (decoded.type !== 'refresh') return null
    return decoded
  } catch {
    return null
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

export function generateVideoToken(
  userId: string,
  lessonId: string,
  videoId: string,
  secret: string | undefined
): string {
  const payload: VideoPayload = { userId, lessonId, videoId, type: 'video_access' }
  return jwt.sign(payload, requireSecret(secret), { expiresIn: VIDEO_TOKEN_EXPIRES_IN })
}

export function verifyVideoToken(
  token: string,
  secret: string | undefined
): { userId: string; lessonId: string; videoId: string } | null {
  try {
    const decoded = jwt.verify(token, requireSecret(secret)) as VideoPayload
    if (decoded.type !== 'video_access') return null
    return { userId: decoded.userId, lessonId: decoded.lessonId, videoId: decoded.videoId }
  } catch {
    return null
  }
}
