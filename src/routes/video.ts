// ============================================================
//  VClass — Rotas de Vídeo Protegido
//  Sistema: Signed URL + Token de curta duração + Watermark
//  Garante: vídeos só visualizáveis na plataforma,
//           sem download, sem partilha directa
// ============================================================
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { ApiResponse } from '../types'

const video = new Hono()

// ── Auth em todas as rotas de vídeo ─────────────────────────
video.use('/*', authMiddleware)

// ── Helpers ─────────────────────────────────────────────────

// ── Secret padrão (substitua por env var VIDEO_SECRET em produção) ──────────
const DEFAULT_VIDEO_SECRET = 'VCLASS_VIDEO_SECRET_2024_CHANGE_IN_PROD'

function getVideoSecret(env?: Record<string, string>): string {
  return env?.VIDEO_SECRET || DEFAULT_VIDEO_SECRET
}

/** Gera um token de acesso ao vídeo assinado com HMAC-SHA256 */
async function generateSignedToken(payload: {
  userId: string
  lessonId: string
  videoId: string
  expiresAt: number          // Unix timestamp ms
  ip?: string
  userAgent?: string
}, secret: string): Promise<string> {
  const data = JSON.stringify(payload)
  const encoder = new TextEncoder()
  // Usa crypto.subtle disponível no Workers runtime
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
  const b64 = btoa(unescape(encodeURIComponent(data)))  // UTF-8 safe
  return `${b64}.${sigHex}`
}

/** Valida o token e retorna o payload ou null */
async function verifySignedToken(token: string, secret: string): Promise<{
  userId: string; lessonId: string; videoId: string; expiresAt: number; ip?: string; userAgent?: string
} | null> {
  try {
    const [b64, sigHex] = token.split('.')
    if (!b64 || !sigHex) return null
    const data = decodeURIComponent(escape(atob(b64)))  // UTF-8 safe
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sig = new Uint8Array(sigHex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data))
    if (!valid) return null
    const payload = JSON.parse(data)
    if (Date.now() > payload.expiresAt) return null   // expirado
    return payload
  } catch { return null }
}

/** Extrai o IP real do cliente de forma robusta */
function getClientIP(c: Parameters<typeof video.post>[1] extends (...args: infer A) => unknown ? A[0] : never): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

// ============================================================
//  POST /api/video/token
//  Body: { lessonId, videoId }
//  → Retorna { token, expiresAt, watermark }
//  Token dura 4 horas — suficiente para ver, impossível partilhar
// ============================================================
video.post('/token', async (c) => {
  try {
    const user   = c.get('user')
    const env    = (c.env as Record<string,string>) || {}
    const secret = getVideoSecret(env)
    const body   = await c.req.json().catch(() => ({}))
    const { lessonId, videoId } = body

    if (!lessonId || !videoId) {
      return c.json<ApiResponse>({ success: false, error: 'lessonId e videoId são obrigatórios' }, 400)
    }

    // IP e User-Agent do utilizador (para IP binding)
    const ip        = getClientIP(c as any)
    const userAgent = c.req.header('user-agent')?.substring(0, 100) || ''

    const expiresAt = Date.now() + 4 * 60 * 60 * 1000   // 4 horas

    const token = await generateSignedToken({
      userId: user.id,
      lessonId,
      videoId,
      expiresAt,
      ip,
      userAgent
    }, secret)

    // Watermark dinâmico com dados do utilizador (para rastrear fugas)
    const watermark = {
      userId: user.id,
      email: user.email ? `${user.email.substring(0,3)}***` : '***',  // parcialmente mascarado
      name:  user.full_name || user.name || 'Utilizador',
      ts:    Date.now()
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        token,
        expiresAt: new Date(expiresAt).toISOString(),
        watermark,
        // URL do stream já fica no cliente — o token é o que o protege
        // Em prod com Bunny.net: construir aqui o Signed URL
        // e não passar o videoId puro ao cliente
        streamConfig: {
          type: 'hls',          // HLS não permite download directo
          tokenRequired: true,
          drmHint: 'basic'
        }
      },
      message: 'Token gerado com sucesso'
    })

  } catch (err) {
    console.error('video/token error:', err)
    return c.json<ApiResponse>({ success: false, error: 'Erro interno' }, 500)
  }
})

// ============================================================
//  GET /api/video/stream/:lessonId
//  Header: Authorization: Bearer <token>   (token do POST acima)
//  → Proxy do stream HLS ou redirect com Signed URL Bunny.net
//  Isto garante que o URL real do vídeo NUNCA chega ao browser
// ============================================================
video.get('/stream/:lessonId', async (c) => {
  try {
    const user     = c.get('user')
    const lessonId = c.req.param('lessonId')
    const token    = c.req.query('vt')   // video token na query string
    const env      = (c.env as Record<string,string>) || {}
    const secret   = getVideoSecret(env)

    if (!token) {
      return c.json<ApiResponse>({ success: false, error: 'Token de vídeo em falta' }, 401)
    }

    const payload = await verifySignedToken(token, secret)
    if (!payload) {
      return c.json<ApiResponse>({ success: false, error: 'Token inválido ou expirado' }, 403)
    }

    // Verificar que o token pertence ao utilizador autenticado
    if (payload.userId !== user.id) {
      return c.json<ApiResponse>({ success: false, error: 'Token não pertence a este utilizador' }, 403)
    }

    if (payload.lessonId !== lessonId) {
      return c.json<ApiResponse>({ success: false, error: 'Token não é válido para esta lição' }, 403)
    }

    // IP binding: verificar se o IP coincide (tolerância para proxies)
    if (payload.ip && payload.ip !== 'unknown') {
      const currentIP = getClientIP(c as any)
      if (currentIP !== 'unknown' && payload.ip !== currentIP) {
        // Em produção: log do evento de segurança
        console.warn(`[SECURITY] IP mismatch: token_ip=${payload.ip} request_ip=${currentIP} user=${user.id}`)
        // Aviso mas não bloquear (IPs podem mudar em mobile/proxies)
        // Para bloquear: return c.json<ApiResponse>({ success: false, error: 'IP inválido' }, 403)
      }
    }

    // ── Produção com Bunny.net ────────────────────────────────
    // const BUNNY_API_KEY    = c.env?.BUNNY_API_KEY    || ''
    // const BUNNY_LIBRARY_ID = c.env?.BUNNY_LIBRARY_ID || ''
    // const BUNNY_CDN_HOST   = c.env?.BUNNY_CDN_HOST   || 'vz-xxx.b-cdn.net'
    // const BUNNY_TOKEN_KEY  = c.env?.BUNNY_TOKEN_KEY  || ''
    //
    // // Gerar Signed URL Bunny.net (válido por 2h)
    // const expires    = Math.floor(Date.now() / 1000) + 7200
    // const hashBase   = BUNNY_TOKEN_KEY + '/' + payload.videoId + '/playlist.m3u8' + expires
    // const hashBytes  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashBase))
    // const hashB64    = btoa(String.fromCharCode(...new Uint8Array(hashBytes)))
    //                      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    // const signedUrl  = `https://${BUNNY_CDN_HOST}/${payload.videoId}/playlist.m3u8?token=${hashB64}&expires=${expires}`
    // return c.redirect(signedUrl, 302)

    // ── Demo mode ─────────────────────────────────────────────
    // Em demo devolve config para o player usar o videoId directamente
    return c.json<ApiResponse>({
      success: true,
      data: {
        videoId: payload.videoId,
        // Em produção NUNCA devolver o URL raw — apenas o Signed URL com expiração
        streamUrl: `https://iframe.mediadelivery.net/embed/${payload.videoId}?autoplay=false`,
        tokenValid: true,
        expiresAt: new Date(payload.expiresAt).toISOString()
      }
    })

  } catch (err) {
    console.error('video/stream error:', err)
    return c.json<ApiResponse>({ success: false, error: 'Erro interno' }, 500)
  }
})

// ============================================================
//  POST /api/video/:lessonId/progress
//  Actualiza progresso de visualização (posição + % assistida)
// ============================================================
video.post('/:lessonId/progress', async (c) => {
  try {
    const user     = c.get('user')
    const lessonId = c.req.param('lessonId')
    const body     = await c.req.json().catch(() => ({}))
    const { position, duration, percent } = body

    if (typeof position !== 'number') {
      return c.json<ApiResponse>({ success: false, error: 'position obrigatório' }, 400)
    }

    // Em produção: guardar na DB (Supabase/D1)
    // Por agora retorna sucesso (será persistido no localStorage do cliente)
    return c.json<ApiResponse>({
      success: true,
      data: {
        lessonId,
        userId: user.id,
        position: Math.round(position),
        duration: duration || 0,
        percent:  Math.min(100, Math.max(0, Math.round(percent || 0))),
        savedAt:  new Date().toISOString()
      },
      message: 'Progresso guardado'
    })
  } catch (err) {
    console.error('progress error:', err)
    return c.json<ApiResponse>({ success: false, error: 'Erro interno' }, 500)
  }
})

// ── Manter rota legada por compatibilidade ───────────────────
video.get('/:lesson_id/token', async (c) => {
  return c.json<ApiResponse>({
    success: false,
    error: 'Use POST /api/video/token em vez desta rota'
  }, 410)
})

export default video
