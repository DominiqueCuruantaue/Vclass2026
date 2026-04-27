// CORS Middleware Configuration
import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'

const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://vclass.pages.dev'
]

/**
 * CORS dinâmico — combina origens default com `c.env.ALLOWED_ORIGINS`
 * (CSV: "https://vclass.com,https://app.vclass.mz").
 * `credentials: true` exige lista estática (sem wildcards).
 */
export async function corsConfig(c: Context, next: Next) {
  const extra = (c.env?.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)

  const allowed = [...DEFAULT_ORIGINS, ...extra]

  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
    credentials: true
  })(c, next)
}
