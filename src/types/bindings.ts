/**
 * Cloudflare Pages/Workers bindings — declarados via Hono Env so that
 * `c.env.X` é fortemente tipado em todas as routes.
 *
 * Para os secrets, configurar via:
 *   - Cloudflare Dashboard → Settings → Environment variables (encrypted)
 *   - ou `npx wrangler pages secret put <NAME> --project-name=vclass`
 *
 * KV bindings vêm do `wrangler.jsonc`.
 */

export interface CloudflareBindings {
  // Secrets
  JWT_SECRET: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  SUPABASE_ANON_KEY?: string
  BUNNY_CDN_URL?: string
  ALLOWED_ORIGINS?: string

  // Bunny.net Stream (vídeo)
  BUNNY_API_KEY?: string         // chave master da Stream Library (sensível)
  BUNNY_LIBRARY_ID?: string      // ID numérico da library
  BUNNY_CDN_HOST?: string        // hostname CDN (ex: vz-xxx.b-cdn.net)
  BUNNY_TOKEN_KEY?: string       // chave de Token Authentication (sensível)

  // Vídeo (token interno HMAC, separado do Bunny)
  VIDEO_SECRET?: string

  // Integrações opcionais (chat AI)
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string

  // KV namespaces
  RATE_LIMIT?: KVNamespace
}

declare module 'hono' {
  interface Env {
    Bindings: CloudflareBindings
  }
}

export {}
