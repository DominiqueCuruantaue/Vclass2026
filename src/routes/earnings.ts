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
import { determinePayout, MIN_PAYOUT_MZN } from '../services/payoutEngine'
import { logEarningsAudit } from '../services/earningsAudit'
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

// ── GET /api/earnings/payable — saldo do próprio professor (Art. 31) ────────
// Espelho, restrito a `user.id`, de GET /api/finance/earnings/payable
// (admin). O professor não pode ver o saldo de ninguém mais.
earnings.get('/payable', async (c) => {
  const user = c.get('user')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data, error } = await supabase
      .from('teacher_earnings_ledger')
      .select('gross_amount')
      .eq('teacher_id', user.id)
      .eq('status', 'APPROVED')
    if (error) throw new Error(error.message)

    const approvedTotal = (data || []).reduce((sum: number, row: any) => sum + Number(row.gross_amount), 0)
    const decision = determinePayout(approvedTotal, 0)
    return c.json<ApiResponse>({ success: true, data: decision })
  } catch (e: any) {
    console.error('earnings/payable error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

// ── GET /api/earnings/history?limit= — extracto de lançamentos ──────────────
earnings.get('/history', async (c) => {
  const user = c.get('user')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data, error } = await supabase
      .from('teacher_earnings_ledger')
      .select('id, earning_type, gross_amount, currency, status, period_start, period_end, created_at, approved_at, paid_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return c.json<ApiResponse>({ success: true, data: { entries: data || [] } })
  } catch (e: any) {
    console.error('earnings/history error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

// ── GET /api/earnings/periods?months= — totais por período de settlement ────
// Só cobre VCPM/QUALITY_BONUS/BONIFIED_VIEW, que são os únicos tipos com
// period_start/period_end sempre preenchidos (os restantes — comissão de
// referência, fee de embaixador, etc. — são eventos pontuais sem período
// mensal fixo e aparecem só no extracto de /history).
earnings.get('/periods', async (c) => {
  const user = c.get('user')
  const months = Math.min(Number(c.req.query('months')) || 6, 24)
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data, error } = await supabase
      .from('teacher_earnings_ledger')
      .select('earning_type, gross_amount, period_start, period_end')
      .eq('teacher_id', user.id)
      .in('earning_type', ['VCPM', 'QUALITY_BONUS', 'BONIFIED_VIEW'])
      .not('period_start', 'is', null)
      .order('period_start', { ascending: true })
    if (error) throw new Error(error.message)

    const byPeriod = new Map<string, { periodStart: string; periodEnd: string; totalMzn: number }>()
    for (const row of (data || []) as any[]) {
      const key = `${row.period_start}_${row.period_end}`
      const entry = byPeriod.get(key) || { periodStart: row.period_start, periodEnd: row.period_end, totalMzn: 0 }
      entry.totalMzn += Number(row.gross_amount)
      byPeriod.set(key, entry)
    }
    const periods = Array.from(byPeriod.values()).sort((a, b) => a.periodStart.localeCompare(b.periodStart)).slice(-months)
    return c.json<ApiResponse>({ success: true, data: { periods } })
  } catch (e: any) {
    console.error('earnings/periods error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

// ── GET /api/earnings/top-lessons?periodStart=&periodEnd= ───────────────────
// Sem parâmetros: mês corrente. Agrupa VQ-R+VQ-B do próprio professor por
// lição, para saber que aulas mais renderam no período.
earnings.get('/top-lessons', async (c) => {
  const user = c.get('user')
  const periodStart = c.req.query('periodStart')
  const periodEnd = c.req.query('periodEnd')
  const { start, end } = currentMonthRange()
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data, error } = await supabase
      .from('qualified_views')
      .select('lesson_id, classification')
      .eq('teacher_id', user.id)
      .in('classification', ['VQ-R', 'VQ-B'])
      .gte('classified_at', periodStart || start)
      .lt('classified_at', periodEnd || end)
    if (error) throw new Error(error.message)

    const rows = data || []
    const countByLesson = new Map<string, number>()
    for (const r of rows as any[]) countByLesson.set(r.lesson_id, (countByLesson.get(r.lesson_id) ?? 0) + 1)

    const lessonIds = Array.from(countByLesson.keys())
    const { data: lessons } = lessonIds.length
      ? await supabase.from('lessons').select('id, title').in('id', lessonIds)
      : { data: [] }
    const titleById = new Map((lessons ?? []).map((l: any) => [l.id, l.title]))

    const topLessons = lessonIds
      .map(id => ({ lessonId: id, title: titleById.get(id) || 'Lição', qualifiedViews: countByLesson.get(id) || 0 }))
      .sort((a, b) => b.qualifiedViews - a.qualifiedViews)
      .slice(0, 10)

    return c.json<ApiResponse>({ success: true, data: { topLessons } })
  } catch (e: any) {
    console.error('earnings/top-lessons error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

// ── GET /api/earnings/payouts — histórico de pagamentos já efectuados ───────
earnings.get('/payouts', async (c) => {
  const user = c.get('user')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  try {
    const { data, error } = await supabase
      .from('teacher_payouts')
      .select('id, amount_mzn, method, reference, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return c.json<ApiResponse>({ success: true, data: { payouts: data || [] } })
  } catch (e: any) {
    console.error('earnings/payouts error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

const PAYOUT_REQUEST_METHODS = ['mpesa', 'emola', 'bank_transfer']

// ── POST /api/earnings/payout-request — pedir levantamento ──────────────────
// Sem gateway de pagamento, isto NÃO move dinheiro nem marca nada como PAID
// — só regista o pedido (em earnings_audit_log, mesmo mecanismo do gate
// anti-fraude e da reversão de reembolso) para a equipa financeira ver numa
// fila e processar manualmente por fora do sistema, tal como já faz hoje. O
// pagamento real continua a ser registado por eles via
// POST /api/finance/payouts quando o dinheiro for de facto enviado.
earnings.post('/payout-request', async (c) => {
  const user = c.get('user')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Erro de configuração da base de dados' }, 500)

  const body = await c.req.json().catch(() => ({})) as { amountMzn?: number; method?: string; account?: string }
  if (typeof body.amountMzn !== 'number' || body.amountMzn < MIN_PAYOUT_MZN) {
    return c.json<ApiResponse>({ success: false, error: `Valor mínimo de levantamento: ${MIN_PAYOUT_MZN} MZN` }, 400)
  }
  if (!body.method || !PAYOUT_REQUEST_METHODS.includes(body.method)) {
    return c.json<ApiResponse>({ success: false, error: 'Método de pagamento inválido' }, 400)
  }
  if (!body.account?.trim()) {
    return c.json<ApiResponse>({ success: false, error: 'Número de telemóvel/conta é obrigatório' }, 400)
  }

  try {
    const { data: rows, error } = await supabase
      .from('teacher_earnings_ledger')
      .select('gross_amount')
      .eq('teacher_id', user.id)
      .eq('status', 'APPROVED')
    if (error) throw new Error(error.message)
    const approvedTotal = (rows || []).reduce((sum: number, r: any) => sum + Number(r.gross_amount), 0)

    if (body.amountMzn > approvedTotal) {
      return c.json<ApiResponse>({ success: false, error: `Valor pedido (${body.amountMzn} MZN) excede o saldo aprovado disponível (${approvedTotal.toFixed(2)} MZN)` }, 400)
    }

    const reference = `PR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString(36).toUpperCase().slice(-4)}`
    await logEarningsAudit(supabase, {
      actorId: user.id, action: 'PAYOUT_REQUESTED', entityType: 'users', entityId: user.id,
      after: { amountMzn: body.amountMzn, method: body.method, account: body.account.trim(), reference }
    })

    return c.json<ApiResponse>({
      success: true,
      message: 'Pedido de levantamento registado — a equipa financeira vai processá-lo.',
      data: { reference, amountMzn: body.amountMzn, method: body.method, status: 'pedido_registado' }
    })
  } catch (e: any) {
    console.error('earnings/payout-request error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message || 'Erro interno' }, 500)
  }
})

export default earnings
