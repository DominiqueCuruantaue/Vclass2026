// Teacher Earnings Routes — /api/earnings/*
// Vista do professor sobre a sua própria remuneração (Política V1.0, Art. 28
// "dashboard de remuneração" e secção 32 "explicabilidade" do prompt de
// implementação). Endpoints administrativos ficam em src/routes/finance.ts
// (mesmo padrão de authorization já usado para planos/subscrições).
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireTeacher } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { estimateTeacherEarnings } from '../services/earningsAggregation'
import { generateReferralCode } from '../services/referralEngine'
import type { ApiResponse } from '../types'

const earnings = new Hono<{ Bindings: CloudflareBindings }>()
earnings.use('/*', authMiddleware)
earnings.use('/*', requireTeacher)

function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

/** Primeiro dia do mês corrente e primeiro dia do mês seguinte, em ISO date. */
function currentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

// ── GET /api/earnings/summary?periodStart=&periodEnd= ───────────────────────
// Sem parâmetros: mês corrente. Cálculo ao vivo (Art. 29 "Estimado: cálculo
// provisório") — não depende de o ledger já ter sido gravado para este período.
earnings.get('/summary', async (c) => {
  const user = c.get('user')
  const periodStart = c.req.query('periodStart')
  const periodEnd = c.req.query('periodEnd')
  const { start, end } = currentMonthRange()

  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const estimate = await estimateTeacherEarnings(supabase, user.id, periodStart || start, periodEnd || end)
    return c.json<ApiResponse>({ success: true, data: estimate })
  } catch (e: any) {
    console.error('earnings/summary error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

// ── GET /api/earnings/referral-code ──────────────────────────────────────────
// Devolve o código existente do professor, ou cria um novo na primeira vez.
earnings.get('/referral-code', async (c) => {
  const user = c.get('user')

  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code, active, created_at')
      .eq('teacher_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return c.json<ApiResponse>({ success: true, data: existing })
    }

    // Gera e tenta inserir; em caso de colisão improvável (UNIQUE code),
    // repete algumas vezes antes de desistir.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferralCode()
      const { data: inserted, error } = await supabase
        .from('referral_codes')
        .insert({ teacher_id: user.id, code })
        .select('code, active, created_at')
        .single()

      if (!error && inserted) {
        return c.json<ApiResponse>({ success: true, data: inserted, message: 'Código de referência criado' })
      }
      // 23505 = unique_violation (Postgres) — colisão de código, tenta outro.
      if (error && (error as any).code !== '23505') {
        throw new Error(error.message)
      }
    }

    return c.json<ApiResponse>({ success: false, error: 'Não foi possível gerar um código único, tente novamente' }, 500)
  } catch (e: any) {
    console.error('earnings/referral-code error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

export default earnings
