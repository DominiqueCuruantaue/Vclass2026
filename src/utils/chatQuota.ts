// Cota diária de mensagens do Chat IA para o plano Basic.
// Mesma estratégia/binding KV do rate limit de auth (ver src/middleware/auth.ts):
// contador fixed-window, agora por (utilizador + dia calendário UTC) em vez de (IP + path).

const _memoryStore: Map<string, { count: number; day: string }> = new Map()
let _memoryWarned = false

function todayKey(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

export interface QuotaResult {
  allowed: boolean
  used: number
  limit: number
}

/** Verifica e, se permitido, incrementa o contador diário de mensagens do utilizador. */
export async function checkChatQuota(env: any, userId: string, limit: number): Promise<QuotaResult> {
  const day = todayKey()
  const key = `chat:daily:${userId}:${day}`
  const kv = env?.RATE_LIMIT as KVNamespace | undefined

  let count = 0
  if (kv) {
    try {
      const raw = await kv.get(key)
      count = raw ? parseInt(raw, 10) || 0 : 0
    } catch (err) {
      console.error('Chat quota KV read failed:', err)
    }
  } else {
    if (!_memoryWarned) {
      console.warn('[chat-quota] KV binding RATE_LIMIT ausente — a usar fallback in-memory (não eficaz em produção).')
      _memoryWarned = true
    }
    const entry = _memoryStore.get(key)
    count = entry && entry.day === day ? entry.count : 0
  }

  if (count >= limit) return { allowed: false, used: count, limit }

  count++
  if (kv) {
    try {
      // TTL > 24h para cobrir fusos horários sem cortar a janela do dia UTC antes da hora
      await kv.put(key, String(count), { expirationTtl: 90_000 })
    } catch (err) {
      console.error('Chat quota KV write failed:', err)
    }
  } else {
    _memoryStore.set(key, { count, day })
  }

  return { allowed: true, used: count, limit }
}
