// ============================================================
//  Bunny.net Stream — helpers para upload TUS assinado e
//  geração de signed URLs HLS com Token Authentication.
//
//  Documentação:
//   - TUS upload: https://docs.bunny.net/reference/tus-resumable-uploads
//   - Token Auth: https://docs.bunny.net/docs/cdn-token-authentication
// ============================================================

/**
 * Calcula HMAC SHA-256 hex de uma string usando Web Crypto.
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Cria entrada de vídeo na Stream Library e devolve o GUID.
 * O upload do ficheiro é feito separadamente pelo browser via TUS.
 */
export async function createBunnyVideo(
  apiKey: string,
  libraryId: string,
  title: string
): Promise<string> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ title })
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Bunny createVideo failed: ${err}`)
  }
  const json = await res.json() as { guid: string }
  return json.guid
}

/**
 * Gera credenciais TUS para o browser fazer upload directo ao Bunny.
 * O browser NUNCA recebe a master API key — apenas a assinatura HMAC
 * com escopo limitado a (videoId × expiração).
 *
 * Formato da assinatura (Bunny TUS):
 *   AuthorizationSignature = SHA256(libraryId + apiKey + expirationTimestamp + videoId)
 *
 * Browser usa tus-js-client com:
 *   endpoint: https://video.bunnycdn.com/tusupload
 *   metadata: { AuthorizationSignature, AuthorizationExpire, VideoId, LibraryId, filetype, title }
 */
export async function buildBunnyTusCredentials(
  apiKey: string,
  libraryId: string,
  videoId: string,
  ttlSeconds: number = 24 * 3600  // 24h por default
): Promise<{
  endpoint: string
  videoId: string
  libraryId: string
  authorizationSignature: string
  authorizationExpire: number
  expiresAtIso: string
}> {
  const expire = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = await sha256Hex(libraryId + apiKey + expire + videoId)
  return {
    endpoint: 'https://video.bunnycdn.com/tusupload',
    videoId,
    libraryId,
    authorizationSignature: sig,
    authorizationExpire: expire,
    expiresAtIso: new Date(expire * 1000).toISOString()
  }
}

/**
 * Obtém estado de processamento do vídeo no Bunny.
 * statusCodes: 0=created, 1=uploading, 2=processing, 3=transcoding,
 *              4=finishing, 5=error, 6=ready
 */
export async function getBunnyVideoStatus(
  apiKey: string,
  libraryId: string,
  videoId: string
): Promise<{
  status: string
  statusCode: number
  encodeProgress: number
  availableResolutions: string
  length: number
  title: string
} | null> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    { headers: { AccessKey: apiKey, Accept: 'application/json' } }
  )
  if (!res.ok) return null
  const v = await res.json() as any
  // Bunny Stream status enum (oficial):
  // 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished (ready),
  // 5=Error, 6=UploadFailed, 7=JitSegmenting, 8=JitPlaylistsCreated
  const map: Record<number, string> = {
    0: 'created', 1: 'uploading', 2: 'processing',
    3: 'transcoding', 4: 'ready', 5: 'error', 6: 'error',
    7: 'transcoding', 8: 'ready'
  }
  return {
    status: map[v.status] ?? 'unknown',
    statusCode: v.status,
    encodeProgress: v.encodeProgress ?? 0,
    availableResolutions: v.availableResolutions || '',
    length: v.length ?? 0,
    title: v.title ?? ''
  }
}

/**
 * Confirma se o vídeo de uma lição já está pronto para streaming — usado para
 * não notificar/deixar o admin aprovar uma lição cujo vídeo ainda está a
 * processar no Bunny (ver src/routes/admin.ts e src/routes/notifications.ts).
 */
export async function isLessonVideoReady(
  env: { BUNNY_API_KEY?: string; BUNNY_LIBRARY_ID?: string } | undefined,
  lesson: { video_id?: string | null; video_url?: string | null }
): Promise<boolean> {
  // Vídeo directo (MP4/HLS, sem Bunny) — sempre considerado pronto.
  if (lesson.video_url) return true
  if (!lesson.video_id) return false

  const apiKey    = env?.BUNNY_API_KEY
  const libraryId = env?.BUNNY_LIBRARY_ID
  if (!apiKey || !libraryId) return true // Bunny não configurado (demo/dev) — não bloquear

  try {
    const status = await getBunnyVideoStatus(apiKey, libraryId, lesson.video_id)
    return status?.status === 'ready'
  } catch {
    return false
  }
}

/**
 * SHA-256 base64-URL-safe (sem padding) — usado pelo CDN Token Authentication.
 */
async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  let binary = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Assina um path individual no formato CDN Token Authentication do Bunny:
 *   token = base64url( sha256_raw( tokenKey + path + expires ) )
 *
 * Bunny Stream **não suporta directory tokens** — cada recurso (playlist
 * master, variantes por resolução, segmentos `.ts`) tem de ter o seu
 * próprio token. Usado pelo proxy HLS server-side em `routes/video.ts`.
 */
export async function signBunnyPath(
  tokenKey: string,
  path: string,
  expires: number
): Promise<string> {
  return sha256Base64Url(tokenKey + path + expires)
}

/**
 * Constrói uma signed URL absoluta para um único path Bunny.
 */
export async function buildBunnySignedUrl(
  cdnHost: string,
  tokenKey: string,
  path: string,
  ttlSeconds: number = 7200
): Promise<{ url: string; expires: number }> {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const token = await signBunnyPath(tokenKey, path, expires)
  const url = `https://${cdnHost}${path}?token=${token}&expires=${expires}`
  return { url, expires }
}

/**
 * Helper conveniente para o master playlist HLS de um vídeo.
 */
export async function buildBunnySignedHlsUrl(
  cdnHost: string,
  tokenKey: string,
  videoId: string,
  ttlSeconds: number = 7200
): Promise<{ url: string; expires: number }> {
  return buildBunnySignedUrl(cdnHost, tokenKey, `/${videoId}/playlist.m3u8`, ttlSeconds)
}

/**
 * Indica se as 4 variáveis de ambiente Bunny estão presentes.
 */
export function isBunnyConfigured(env: any): boolean {
  return !!(env?.BUNNY_API_KEY && env?.BUNNY_LIBRARY_ID && env?.BUNNY_CDN_HOST && env?.BUNNY_TOKEN_KEY)
}
