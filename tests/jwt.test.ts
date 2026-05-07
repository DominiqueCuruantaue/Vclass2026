import { describe, it, expect } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateVideoToken,
  verifyVideoToken,
  extractToken
} from '../src/utils/jwt'

const SECRET = 'test-secret-with-at-least-32-characters-of-length'
const OTHER_SECRET = 'another-secret-with-at-least-32-chars-different'

const payload = { sub: 'user-1', email: 'a@b.com', role: 'student' as const }

describe('jwt — security guarantees', () => {
  it('rejects missing or short secrets at sign time', () => {
    expect(() => generateAccessToken(payload, undefined)).toThrow(/JWT_SECRET/)
    expect(() => generateAccessToken(payload, '')).toThrow(/JWT_SECRET/)
    expect(() => generateAccessToken(payload, 'short')).toThrow(/JWT_SECRET/)
  })

  it('returns null on verify when secret is missing (fail-closed, no fallback)', () => {
    // verifyToken cataches the requireSecret error and returns null para que o
    // caller responda 401. O importante é NÃO aceitar o token usando um fallback.
    const tok = generateAccessToken(payload, SECRET)
    expect(verifyToken(tok, undefined)).toBeNull()
    expect(verifyToken(tok, '')).toBeNull()
    expect(verifyToken(tok, 'short')).toBeNull()
  })

  it('round-trips an access token with the correct secret', () => {
    const tok = generateAccessToken(payload, SECRET)
    const decoded = verifyToken(tok, SECRET)
    expect(decoded?.sub).toBe('user-1')
    expect(decoded?.email).toBe('a@b.com')
    expect(decoded?.role).toBe('student')
  })

  it('returns null when verifying with the wrong secret', () => {
    const tok = generateAccessToken(payload, SECRET)
    const decoded = verifyToken(tok, OTHER_SECRET)
    expect(decoded).toBeNull()
  })

  it('returns null for malformed tokens', () => {
    expect(verifyToken('not-a-jwt', SECRET)).toBeNull()
    expect(verifyToken('a.b.c', SECRET)).toBeNull()
  })

  it('refresh tokens carry type:"refresh" and verifyRefreshToken enforces it', () => {
    const refresh = generateRefreshToken(payload, SECRET)
    expect(verifyRefreshToken(refresh, SECRET)?.sub).toBe('user-1')
  })

  it('an access token must NOT pass verifyRefreshToken (prevents token confusion)', () => {
    const access = generateAccessToken(payload, SECRET)
    expect(verifyRefreshToken(access, SECRET)).toBeNull()
  })

  it('a refresh token must NOT be confused with a video token', () => {
    const refresh = generateRefreshToken(payload, SECRET)
    expect(verifyVideoToken(refresh, SECRET)).toBeNull()
  })

  it('video tokens carry type:"video_access" and round-trip', () => {
    const tok = generateVideoToken('u1', 'l1', 'v1', SECRET)
    const decoded = verifyVideoToken(tok, SECRET)
    expect(decoded).toEqual({ userId: 'u1', lessonId: 'l1', videoId: 'v1' })
  })

  it('an access token must NOT pass verifyVideoToken', () => {
    const access = generateAccessToken(payload, SECRET)
    expect(verifyVideoToken(access, SECRET)).toBeNull()
  })
})

describe('extractToken', () => {
  it('extracts Bearer token from header', () => {
    expect(extractToken('Bearer abc.def.ghi')).toBe('abc.def.ghi')
  })

  it('rejects other schemes', () => {
    expect(extractToken('Basic abc')).toBeNull()
    expect(extractToken('Token abc')).toBeNull()
  })

  it('returns null on missing header', () => {
    expect(extractToken(null)).toBeNull()
    expect(extractToken('')).toBeNull()
  })

  it('returns null on malformed header', () => {
    expect(extractToken('Bearer')).toBeNull()
    expect(extractToken('Bearer a b')).toBeNull()
  })
})
