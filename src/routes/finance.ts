// Finance Routes — /api/finance/*
// Gestão de subscrições, pagamentos, receita e planos (preços/funcionalidades)
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireFinanceOrAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { loadPlans, isDatabaseConfigured, FALLBACK_PLANS_DATA } from '../utils/plans'
import { COUNTRIES } from '../data/curriculum'
import { estimateTeacherEarnings, writeEstimatedLedgerEntries } from '../services/earningsAggregation'
import { calculateReferralCommission, checkAttributionWindow } from '../services/referralEngine'
import { determinePayout } from '../services/payoutEngine'
import { runEstimatePhase, runValidatePhase, runApprovePhase, previousMonthPeriodMaputo } from '../services/settlementEngine'
import { logEarningsAudit } from '../services/earningsAudit'
import type { ApiResponse } from '../types'

const finance = new Hono<{ Bindings: CloudflareBindings }>()
finance.use('/*', authMiddleware)
finance.use('/*', requireFinanceOrAdmin)

const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.id, c])) as Record<string, typeof COUNTRIES[number]>
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

async function getPlansData(env?: any) {
  if (!isDatabaseConfigured(env)) return FALLBACK_PLANS_DATA
  const supabase = getSupabase(env)
  if (!supabase) return FALLBACK_PLANS_DATA
  try {
    return await loadPlans(supabase)
  } catch (e) {
    console.error('Falha ao carregar planos da BD, a usar fallback:', e)
    return FALLBACK_PLANS_DATA
  }
}

// ── Subscrições reais (tabela `subscriptions`, migration 001) ────────────────
// Não existe tabela separada de "pagamentos" — cada subscrição já guarda
// amount/payment_provider/payment_id, por isso a aba "Pagamentos" reutiliza
// estas mesmas linhas. Também não há coluna de moeda nem de ciclo de
// facturação: inferimos "anual" quando o intervalo started_at→expires_at
// passa de ~300 dias, para poder calcular MRR/ARR correctamente.

function isYearly(startedAt: string, expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const days = (new Date(expiresAt).getTime() - new Date(startedAt).getTime()) / 86400_000
  return days > 300
}

async function loadSubscriptions(supabase: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, student_id, plan_type, status, started_at, expires_at, payment_provider, payment_id, amount, created_at, users(full_name, email, country_code)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return (data || []).map((row: any) => ({
    id: row.id,
    student_id: row.student_id,
    user_name: row.users?.full_name || '—',
    user_email: row.users?.email || '—',
    plan: row.plan_type,
    country_code: row.users?.country_code || null,
    status: row.status,
    amount: Number(row.amount) || 0,
    payment_provider: row.payment_provider || '—',
    payment_id: row.payment_id,
    started_at: row.started_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
    is_yearly: isYearly(row.started_at, row.expires_at)
  }))
}

// Mostrado só enquanto a tabela `subscriptions` estiver vazia — nunca
// misturado com subscrições reais (ver getSubscriptionsWithFallback).
const FICTITIOUS_SUBSCRIPTIONS = [
  { id: 'demo-sub-1', student_id: 'demo-1', user_name: 'Ana Silva',     user_email: 'ana.silva@vclass.mz',   plan: 'premium', country_code: 'mz', status: 'active',    amount: 599,  payment_provider: 'M-Pesa',    payment_id: null, started_at: new Date(Date.now()-86400000*20).toISOString(), expires_at: new Date(Date.now()+86400000*345).toISOString(), created_at: new Date(Date.now()-86400000*20).toISOString(), is_yearly: true },
  { id: 'demo-sub-2', student_id: 'demo-2', user_name: 'Mário Costa',   user_email: 'mario.costa@vclass.ao', plan: 'basic',   country_code: 'ao', status: 'active',    amount: 800,  payment_provider: 'Multicaixa', payment_id: null, started_at: new Date(Date.now()-86400000*10).toISOString(), expires_at: new Date(Date.now()+86400000*20).toISOString(),  created_at: new Date(Date.now()-86400000*10).toISOString(), is_yearly: false },
  { id: 'demo-sub-3', student_id: 'demo-3', user_name: 'Pedro Mateus',  user_email: 'pedro@vclass.pt',       plan: 'premium', country_code: 'pt', status: 'active',    amount: 199,  payment_provider: 'Stripe',     payment_id: null, started_at: new Date(Date.now()-86400000*5).toISOString(),  expires_at: new Date(Date.now()+86400000*25).toISOString(),  created_at: new Date(Date.now()-86400000*5).toISOString(),  is_yearly: false },
  { id: 'demo-sub-4', student_id: 'demo-4', user_name: 'Grace Nkosi',   user_email: 'grace@vclass.mz',       plan: 'basic',   country_code: 'mz', status: 'expired',   amount: 99,   payment_provider: 'M-Pesa',    payment_id: null, started_at: new Date(Date.now()-86400000*60).toISOString(), expires_at: new Date(Date.now()-86400000*29).toISOString(), created_at: new Date(Date.now()-86400000*60).toISOString(), is_yearly: false },
  { id: 'demo-sub-5', student_id: 'demo-5', user_name: 'Lúcia Afonso',  user_email: 'lucia@vclass.ao',       plan: 'basic',   country_code: 'ao', status: 'cancelled', amount: 800,  payment_provider: 'Multicaixa', payment_id: null, started_at: new Date(Date.now()-86400000*40).toISOString(), expires_at: new Date(Date.now()+86400000*325).toISOString(), created_at: new Date(Date.now()-86400000*40).toISOString(), is_yearly: true },
]

async function loadSubscriptionsWithFallback(env: any): Promise<{ subs: Awaited<ReturnType<typeof loadSubscriptions>>; isFictitious: boolean; supabase: any | null }> {
  if (!isDatabaseConfigured(env)) return { subs: FICTITIOUS_SUBSCRIPTIONS, isFictitious: true, supabase: null }
  const supabase = getSupabase(env)
  if (!supabase) return { subs: FICTITIOUS_SUBSCRIPTIONS, isFictitious: true, supabase: null }
  const real = await loadSubscriptions(supabase)
  return real.length > 0 ? { subs: real, isFictitious: false, supabase } : { subs: FICTITIOUS_SUBSCRIPTIONS, isFictitious: true, supabase }
}

// ── GET /api/finance/stats ────────────────────────────────────────────────────
finance.get('/stats', async (c) => {
  const plansData = await getPlansData(c.env)

  try {
    const { subs, isFictitious, supabase } = await loadSubscriptionsWithFallback(c.env)
    // Enquanto as subscrições forem fictícias, o total de estudantes também
    // tem de ser fictício — nunca cruzar uma contagem real de utilizadores
    // com valores de subscrição inventados no mesmo cálculo.
    let totalStudents = 120
    if (!isFictitious && supabase) {
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student')
      totalStudents = count || 0
    }

    const active = subs.filter((s: any) => s.status === 'active')
    const paidActive = active.filter((s: any) => s.plan !== 'free') // planos pagos apenas — 'free' não conta como subscritor pago
    const cancelled = subs.filter((s: any) => s.status === 'cancelled').length
    const expired = subs.filter((s: any) => s.status === 'expired').length
    const premiumActive = paidActive.filter((s: any) => s.plan === 'premium').length
    const basicActive = paidActive.filter((s: any) => s.plan === 'basic').length
    const paidUsers = new Set(paidActive.map((s: any) => s.student_id)).size
    const freeUsers = Math.max((totalStudents || 0) - paidUsers, 0)
    const conversionRate = totalStudents ? Math.round((paidUsers / totalStudents) * 1000) / 10 : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const newThisMonth = subs.filter((s: any) => s.plan !== 'free' && new Date(s.started_at) >= startOfMonth).length
    const thisMonthRevenue = subs.filter((s: any) => new Date(s.started_at) >= startOfMonth).reduce((a: number, s: any) => a + s.amount, 0)
    const lastMonthRevenue = subs.filter((s: any) => new Date(s.started_at) >= startOfLastMonth && new Date(s.started_at) < startOfMonth).reduce((a: number, s: any) => a + s.amount, 0)
    const growthPct = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10 : (thisMonthRevenue > 0 ? 100 : 0)
    const totalYearRevenue = subs.filter((s: any) => new Date(s.started_at) >= startOfYear).reduce((a: number, s: any) => a + s.amount, 0)

    const mrr = paidActive.reduce((sum: number, s: any) => sum + (s.is_yearly ? s.amount / 12 : s.amount), 0)
    const arr = mrr * 12

    const in30Days = new Date(now.getTime() + 30 * 86400_000)
    const expiringSoon = paidActive.filter((s: any) => s.expires_at && new Date(s.expires_at) <= in30Days).length

    const byCountryMap: Record<string, { active: number; revenue: number; premium: number; basic: number }> = {}
    for (const s of paidActive) {
      const code = s.country_code || 'unknown'
      if (!byCountryMap[code]) byCountryMap[code] = { active: 0, revenue: 0, premium: 0, basic: 0 }
      byCountryMap[code].active++
      byCountryMap[code].revenue += s.amount
      if (s.plan === 'premium') byCountryMap[code].premium++
      if (s.plan === 'basic') byCountryMap[code].basic++
    }
    const byCountry = Object.entries(byCountryMap)
      .map(([code, v]) => ({ country_code: code, country_name: COUNTRY_BY_CODE[code]?.name || 'Desconhecido', flag: COUNTRY_BY_CODE[code]?.flag || '🏳️', ...v }))
      .sort((a, b) => b.revenue - a.revenue)

    return c.json<ApiResponse>({
      success: true,
      data: {
        subscriptions: {
          active: paidActive.length, cancelled, expired,
          premium_active: premiumActive, basic_active: basicActive,
          free_users: freeUsers, total_students: totalStudents || 0,
          conversion_rate: conversionRate, new_this_month: newThisMonth
        },
        revenue: { this_month: thisMonthRevenue, last_month: lastMonthRevenue, growth_pct: growthPct, total_year: totalYearRevenue, mrr, arr },
        alerts: { expiring_soon: expiringSoon, cancelled_total: cancelled, expired_total: expired },
        by_country: byCountry,
        plans: plansData,
        is_fictitious: isFictitious
      }
    })
  } catch (e: any) {
    console.error('Finance stats error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── GET /api/finance/subscriptions ───────────────────────────────────────────
finance.get('/subscriptions', async (c) => {
  const status = c.req.query('status')
  const plan   = c.req.query('plan')

  try {
    const { subs: all, isFictitious } = await loadSubscriptionsWithFallback(c.env)
    let subs = all
    if (status && status !== 'all') subs = subs.filter((s: any) => s.status === status)
    if (plan   && plan   !== 'all') subs = subs.filter((s: any) => s.plan   === plan)
    return c.json<ApiResponse>({ success: true, data: { subscriptions: subs, total: subs.length, is_fictitious: isFictitious } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/subscriptions/:id/cancel ───────────────────────────────
finance.post('/subscriptions/:id/cancel', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env) || id.startsWith('demo-')) {
    // ids fictícios (demo-sub-1, ...) nunca existem na BD — modo demo, não persiste.
    return c.json<ApiResponse>({ success: true, message: 'Subscrição cancelada (modo demo)', data: { id, status: 'cancelled' } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { error } = await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, message: 'Subscrição cancelada', data: { id, status: 'cancelled' } })
})

// ── POST /api/finance/subscriptions/:id/refund ────────────────────────────────
// Distinto de /cancel: aqui houve devolução real de dinheiro (reembolso ou
// chargeback), não só fim de subscrição. Se esta subscrição foi a que
// converteu a comissão de referência do estudante (Art. 21-24) — verificado
// por `converted_subscription_id`, migration 035, não por inferência de
// datas —, a comissão é revertida automaticamente aqui: cria-se uma linha
// REVERSAL no ledger, nunca se apaga/edita a original (secção 23/26 do
// prompt de implementação). Idempotente (não duplica a reversão se chamado
// duas vezes). VCPM/BQE do período do reembolso NÃO são recalculados
// automaticamente — ficam fora deste gap, ver blueprint.
finance.post('/subscriptions/:id/refund', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env) || id.startsWith('demo-')) {
    return c.json<ApiResponse>({ success: true, message: 'Subscrição reembolsada (modo demo)', data: { id, status: 'refunded' } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: subscription, error: findErr } = await supabase.from('subscriptions').select('id, student_id, status').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!subscription) return c.json<ApiResponse>({ success: false, error: 'Subscrição não encontrada' }, 404)
  if (subscription.status === 'refunded') return c.json<ApiResponse>({ success: false, error: 'Subscrição já marcada como reembolsada' }, 409)

  const { error: updateErr } = await supabase.from('subscriptions').update({ status: 'refunded' }).eq('id', id)
  if (updateErr) return c.json<ApiResponse>({ success: false, error: updateErr.message }, 500)

  const user = c.get('user') as any
  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'REFUND_SUBSCRIPTION', entityType: 'subscriptions', entityId: id,
    before: { status: subscription.status }, after: { status: 'refunded' }
  })

  let reversal: { ledgerId: string; amountMzn: string } | null = null

  const { data: attribution } = await supabase
    .from('referral_attributions')
    .select('id, teacher_id, commission_ledger_id, converted_subscription_id')
    .eq('student_id', subscription.student_id)
    .maybeSingle()

  if (attribution?.commission_ledger_id && attribution.converted_subscription_id === id) {
    const { data: alreadyReversed } = await supabase
      .from('teacher_earnings_ledger')
      .select('id')
      .eq('reversal_of_id', attribution.commission_ledger_id)
      .maybeSingle()

    if (!alreadyReversed) {
      const { data: originalEntry, error: origErr } = await supabase
        .from('teacher_earnings_ledger')
        .select('gross_amount')
        .eq('id', attribution.commission_ledger_id)
        .maybeSingle()

      if (!origErr && originalEntry) {
        const reversalAmount = (-Number(originalEntry.gross_amount)).toFixed(2)
        const { data: reversalRow, error: reversalErr } = await supabase
          .from('teacher_earnings_ledger')
          .insert({
            teacher_id: attribution.teacher_id,
            earning_type: 'REVERSAL',
            gross_amount: reversalAmount,
            currency: 'MZN',
            status: 'APPROVED',
            policy_version: 'V1.0',
            reversal_of_id: attribution.commission_ledger_id,
            approved_at: new Date().toISOString(),
            calculation_metadata: { reason: 'Reembolso automático da subscrição de origem', subscriptionId: id, autoReversal: true }
          })
          .select('id')
          .single()

        if (!reversalErr && reversalRow) {
          reversal = { ledgerId: reversalRow.id, amountMzn: reversalAmount }
          await logEarningsAudit(supabase, {
            actorId: user?.id, action: 'AUTO_REVERSE_REFERRAL_COMMISSION',
            entityType: 'teacher_earnings_ledger', entityId: reversalRow.id,
            after: { teacherId: attribution.teacher_id, amountMzn: reversalAmount, reversalOfId: attribution.commission_ledger_id, subscriptionId: id }
          })
        }
      }
    }
  }

  return c.json<ApiResponse>({
    success: true,
    message: reversal ? 'Subscrição reembolsada; comissão de referência revertida automaticamente' : 'Subscrição reembolsada',
    data: { id, status: 'refunded', reversal }
  })
})

// ── POST /api/finance/subscriptions — registar uma subscrição manualmente ───
// GAP CRÍTICO fechado aqui (ver blueprint, achado #13 da sessão 2): antes
// desta rota, NADA no código alguma vez inseria uma linha em
// `subscriptions` — só existia leitura e cancelamento. Sem gateway de
// pagamento (Stripe/M-Pesa) integrado, este é o único ponto onde uma
// subscrição paga passa a existir, e é portanto o único ponto de onde
// `fn_record_watch_heartbeat` (Art. 5.3) alguma vez vê `hasEligibleFunding
// = true` para um estudante real. A equipa financeira usa isto para
// registar manualmente o que hoje já processa fora do sistema (M-Pesa,
// transferência, etc.) — não inventa um gateway, só fecha o elo em falta
// entre "o pagamento aconteceu" e "o sistema sabe disso".
finance.post('/subscriptions', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as Record<string, any>
  const { studentId, planType, amount, paymentProvider, paymentId, startedAt, expiresAt, fundingSource } = body

  if (!studentId || !planType) {
    return c.json<ApiResponse>({ success: false, error: 'studentId e planType são obrigatórios' }, 400)
  }
  if (!['free', 'basic', 'premium'].includes(planType)) {
    return c.json<ApiResponse>({ success: false, error: 'planType inválido' }, 400)
  }
  const validFundingSources = [
    'PAID_SUBSCRIPTION', 'INSTITUTIONAL_PAID', 'SPONSORED', 'FUNDED_SCHOLARSHIP',
    'CORPORATE', 'GOVERNMENT_FUNDED', 'NGO_FUNDED', 'OTHER_ELIGIBLE'
  ]
  if (fundingSource && !validFundingSources.includes(fundingSource)) {
    return c.json<ApiResponse>({ success: false, error: 'fundingSource inválido' }, 400)
  }

  const { data: student, error: studentErr } = await supabase.from('users').select('id, role').eq('id', studentId).maybeSingle()
  if (studentErr) return c.json<ApiResponse>({ success: false, error: studentErr.message }, 500)
  if (!student || student.role !== 'student') return c.json<ApiResponse>({ success: false, error: 'studentId não corresponde a um estudante' }, 400)

  const user = c.get('user') as any
  const { data: inserted, error } = await supabase
    .from('subscriptions')
    .insert({
      student_id: studentId,
      plan_type: planType,
      status: 'active',
      started_at: startedAt || new Date().toISOString(),
      expires_at: expiresAt || null,
      payment_provider: paymentProvider || null,
      payment_id: paymentId || null,
      amount: typeof amount === 'number' ? amount : null,
      funding_source: fundingSource || 'PAID_SUBSCRIPTION'
    })
    .select('*')
    .single()
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'CREATE_SUBSCRIPTION', entityType: 'subscriptions', entityId: inserted?.id,
    after: { studentId, planType, amount, fundingSource: fundingSource || 'PAID_SUBSCRIPTION' }
  })

  return c.json<ApiResponse>({ success: true, message: 'Subscrição registada', data: inserted })
})

// ── PATCH /api/finance/subscriptions/:id — renovar/actualizar uma subscrição
finance.patch('/subscriptions/:id', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env) || id.startsWith('demo-')) {
    return c.json<ApiResponse>({ success: true, message: 'Subscrição actualizada (modo demo)', data: { id } })
  }
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as Record<string, any>
  const updates: Record<string, any> = {}
  if (body.status) updates.status = body.status
  if (body.expiresAt) updates.expires_at = body.expiresAt
  if (body.planType) updates.plan_type = body.planType
  if (typeof body.amount === 'number') updates.amount = body.amount

  if (Object.keys(updates).length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'Nada para actualizar' }, 400)
  }

  const { error } = await supabase.from('subscriptions').update(updates).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const user = c.get('user') as any
  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'UPDATE_SUBSCRIPTION', entityType: 'subscriptions', entityId: id, after: updates
  })

  return c.json<ApiResponse>({ success: true, message: 'Subscrição actualizada' })
})

// ── GET /api/finance/payments ─────────────────────────────────────────────────
// Sem tabela de pagamentos dedicada: cada subscrição É o registo do pagamento
// que a originou (amount/payment_provider/payment_id já vivem lá).
finance.get('/payments', async (c) => {
  const status = c.req.query('status')

  try {
    const { subs, isFictitious } = await loadSubscriptionsWithFallback(c.env)
    let payments = subs.map((s: any) => ({
      id: s.payment_id || s.id,
      user_name: s.user_name,
      amount: s.amount,
      plan: s.plan,
      method: s.payment_provider,
      date: s.created_at,
      status: s.status // 'active' | 'cancelled' | 'expired' — estado real da subscrição, não há conceito de "falhado"/"reembolsado" sem gateway de pagamento
    }))
    if (status && status !== 'all') payments = payments.filter((p: any) => p.status === status)
    return c.json<ApiResponse>({ success: true, data: { payments, total: payments.length, is_fictitious: isFictitious } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── GET /api/finance/checkout-requests ────────────────────────────────────────
// Referências geradas por POST /api/plans/subscribe (migration 034) — não
// activam nada sozinhas, mas permitem confirmar aqui a referência que o
// aluno diz ter usado antes de chamar POST /subscriptions com o mesmo valor
// em paymentId. `matched` indica se já existe uma subscrição activa com essa
// referência como payment_id.
finance.get('/checkout-requests', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: requests, error } = await supabase
    .from('payment_checkout_requests')
    .select('id, user_id, plan_id, billing, currency, amount, payment_method, reference, created_at, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const references = (requests ?? []).map((r: any) => r.reference)
  const { data: matchedSubs } = references.length
    ? await supabase.from('subscriptions').select('payment_id').in('payment_id', references)
    : { data: [] }
  const matchedRefs = new Set((matchedSubs ?? []).map((s: any) => s.payment_id))

  const data = (requests ?? []).map((r: any) => ({ ...r, matched: matchedRefs.has(r.reference) }))
  return c.json<ApiResponse>({ success: true, data: { requests: data, total: data.length } })
})

// ── GET /api/finance/revenue ──────────────────────────────────────────────────
finance.get('/revenue', async (c) => {
  try {
    const { subs, isFictitious } = await loadSubscriptionsWithFallback(c.env)
    const year = new Date().getFullYear()
    const monthly = MONTHS_PT.map((m, i) => {
      const inMonth = subs.filter((s: any) => { const d = new Date(s.started_at); return d.getFullYear() === year && d.getMonth() === i })
      return { month: m, revenue: inMonth.reduce((a: number, s: any) => a + s.amount, 0), subscriptions: inMonth.length }
    })
    const totalYear = monthly.reduce((a, m) => a + m.revenue, 0)
    const peak = monthly.reduce((best, m) => (m.revenue > best.revenue ? m : best), monthly[0])
    return c.json<ApiResponse>({ success: true, data: { monthly, total_year: totalYear, peak_month: peak.revenue > 0 ? peak.month : null, peak_revenue: peak.revenue, is_fictitious: isFictitious } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── GET /api/finance/plans ────────────────────────────────────────────────────
finance.get('/plans', async (c) => {
  const plansData = await getPlansData(c.env)
  return c.json<ApiResponse>({ success: true, data: { plans: plansData } })
})

const PLAN_PRICE_FIELDS = [
  'price_monthly_mzn', 'price_monthly_aoa', 'price_monthly_brl', 'price_monthly_eur',
  'price_yearly_mzn', 'price_yearly_aoa', 'price_yearly_brl', 'price_yearly_eur',
  'yearly_saving_pct', 'name', 'tagline', 'color', 'color_bg', 'icon', 'popular', 'cta', 'cta_style'
]

// ── PATCH /api/finance/plans/:id — editar preços e metadados de um plano ─────
finance.patch('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as Record<string, any>

  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: true, message: `Plano ${id} actualizado (modo demo)`, data: { id, ...body } })
  }

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const updates: Record<string, any> = {}
  for (const key of PLAN_PRICE_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  // Preços monetários vêm do frontend agrupados (price_monthly.mzn, price_yearly.eur, ...)
  if (body.price_monthly) for (const cur of ['mzn', 'aoa', 'brl', 'eur']) {
    if (body.price_monthly[cur] !== undefined) updates[`price_monthly_${cur}`] = body.price_monthly[cur]
  }
  if (body.price_yearly) for (const cur of ['mzn', 'aoa', 'brl', 'eur']) {
    if (body.price_yearly[cur] !== undefined) updates[`price_yearly_${cur}`] = body.price_yearly[cur]
  }
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase.from('plans').update(updates).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const plansData = await getPlansData(c.env)
  const updated = plansData.find(p => p.id === id)
  if (!updated) return c.json<ApiResponse>({ success: false, error: 'Plano não encontrado' }, 404)

  return c.json<ApiResponse>({ success: true, message: `Plano ${updated.name} actualizado`, data: updated })
})

// ── PUT /api/finance/plans/:id/features — substituir a lista de funcionalidades
//    Recebe o array completo já editado (adicionar/remover/renomear/reordenar
//    tudo é resolvido no frontend; aqui apenas persistimos o resultado final).
finance.put('/plans/:id/features', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as { features?: { text: string; included: boolean }[] }
  const features = Array.isArray(body.features) ? body.features : null

  if (!features) return c.json<ApiResponse>({ success: false, error: 'Lista de funcionalidades inválida' }, 400)
  for (const f of features) {
    if (!f.text?.trim()) return c.json<ApiResponse>({ success: false, error: 'Cada funcionalidade precisa de um texto' }, 400)
  }

  if (!isDatabaseConfigured(c.env)) {
    return c.json<ApiResponse>({ success: true, message: `Funcionalidades de ${id} actualizadas (modo demo)`, data: { id, features } })
  }

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: plan, error: findErr } = await supabase.from('plans').select('id').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!plan) return c.json<ApiResponse>({ success: false, error: 'Plano não encontrado' }, 404)

  const { error: deleteErr } = await supabase.from('plan_features').delete().eq('plan_id', id)
  if (deleteErr) return c.json<ApiResponse>({ success: false, error: deleteErr.message }, 500)

  if (features.length > 0) {
    const rows = features.map((f, i) => ({ plan_id: id, text: f.text.trim(), included: !!f.included, display_order: i + 1 }))
    const { error: insertErr } = await supabase.from('plan_features').insert(rows)
    if (insertErr) return c.json<ApiResponse>({ success: false, error: insertErr.message }, 500)
  }

  return c.json<ApiResponse>({ success: true, message: 'Funcionalidades actualizadas com sucesso', data: { id, features } })
})

// ═════════════════════════════════════════════════════════════════════════════
// Teacher Earnings — administração (Política de Remuneração V1.0)
// Endpoints do lado do professor ficam em src/routes/earnings.ts.
// Estado do ledger: ESTIMATED → VALIDATING → APPROVED → PAID (Art. 29).
// Só esta rota (requireFinanceOrAdmin) pode mover um lançamento para
// APPROVED/PAID — o professor nunca marca os seus próprios ganhos.
// ═════════════════════════════════════════════════════════════════════════════

// ── GET /api/finance/earnings — listar lançamentos do ledger ────────────────
finance.get('/earnings', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const teacherId = c.req.query('teacherId')
  const status = c.req.query('status')
  const earningType = c.req.query('earningType')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)
  const offset = Number(c.req.query('offset')) || 0

  try {
    // `users(full_name, email)` resolve automaticamente via PostgREST porque
    // teacher_id é a única FK desta tabela para `users` (sem ambiguidade a
    // exigir o nome explícito da constraint).
    let query = supabase
      .from('teacher_earnings_ledger')
      .select('*, users(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (teacherId) query = query.eq('teacher_id', teacherId)
    if (status) query = query.eq('status', status)
    if (earningType) query = query.eq('earning_type', earningType)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return c.json<ApiResponse>({ success: true, data: { entries: data || [], total: count || 0 } })
  } catch (e: any) {
    console.error('finance/earnings list error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/earnings/estimate — calcular e gravar RCE+BQE dum período
// Acção CALCULATION (Art. 28) — nunca aprova nem paga, só produz/actualiza
// linhas ESTIMATED. Chamada manualmente pela equipa financeira enquanto não
// houver Cron Trigger (PDR-007, em aberto).
finance.post('/earnings/estimate', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as { teacherId?: string; periodStart?: string; periodEnd?: string }
  if (!body.teacherId || !body.periodStart || !body.periodEnd) {
    return c.json<ApiResponse>({ success: false, error: 'teacherId, periodStart e periodEnd são obrigatórios' }, 400)
  }

  try {
    const estimate = await estimateTeacherEarnings(supabase, body.teacherId, body.periodStart, body.periodEnd)
    await writeEstimatedLedgerEntries(supabase, estimate)
    return c.json<ApiResponse>({ success: true, data: estimate, message: 'Estimativa calculada e gravada' })
  } catch (e: any) {
    console.error('finance/earnings/estimate error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/earnings/close-period/:phase — fecho de período em lote
// phase = estimate | validate | approve (ver src/services/settlementEngine.ts).
// Alternativa admin-triggered ao mesmo agendamento que o GitHub Actions
// chama via src/routes/settlementCron.ts (PDR-007) — útil para correr fora
// do calendário ou reprocessar um período específico manualmente.
finance.post('/earnings/close-period/:phase', async (c) => {
  const phase = c.req.param('phase')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as { periodStart?: string; periodEnd?: string }
  const { periodStart, periodEnd } = body.periodStart && body.periodEnd
    ? { periodStart: body.periodStart, periodEnd: body.periodEnd }
    : previousMonthPeriodMaputo()

  const user = c.get('user') as any
  try {
    let result
    if (phase === 'estimate') result = await runEstimatePhase(supabase, periodStart, periodEnd, user?.id)
    else if (phase === 'validate') result = await runValidatePhase(supabase, periodStart, periodEnd, user?.id)
    else if (phase === 'approve') result = await runApprovePhase(supabase, periodStart, periodEnd, user?.id)
    else return c.json<ApiResponse>({ success: false, error: 'phase inválida (estimate|validate|approve)' }, 400)

    return c.json<ApiResponse>({ success: true, data: result })
  } catch (e: any) {
    console.error(`finance/earnings/close-period/${phase} error:`, e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/earnings/:id/approve ───────────────────────────────────
finance.post('/earnings/:id/approve', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: row, error: findErr } = await supabase.from('teacher_earnings_ledger').select('id, status').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!row) return c.json<ApiResponse>({ success: false, error: 'Lançamento não encontrado' }, 404)
  if (row.status === 'PAID') return c.json<ApiResponse>({ success: false, error: 'Lançamento já pago, não pode ser reaprovado' }, 409)

  const { error } = await supabase
    .from('teacher_earnings_ledger')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const user = c.get('user') as any
  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'APPROVE_EARNING', entityType: 'teacher_earnings_ledger', entityId: id,
    before: { status: row.status }, after: { status: 'APPROVED' }
  })

  return c.json<ApiResponse>({ success: true, message: 'Lançamento aprovado', data: { id, status: 'APPROVED' } })
})

// ── GET /api/finance/fraud-flags — professores sinalizados pelo gate anti-fraude
// (fraudDetection.ts) na fase "approve" do settlement. Não é uma acusação —
// é uma pausa para revisão humana: as linhas ficam em VALIDATING até a
// equipa financeira decidir, caso a caso, chamar
// POST /api/finance/earnings/:id/approve (aprovar manualmente, aceitando o
// sinal como falso positivo) ou investigar mais a fundo.
finance.get('/fraud-flags', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: flags, error } = await supabase
    .from('earnings_audit_log')
    .select('id, entity_id, after_state, reason, created_at')
    .eq('action', 'FRAUD_FLAG')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  // entity_id em earnings_audit_log é genérico (não tem FK declarada para
  // users, serve vários tipos de entidade), por isso o nome do professor tem
  // de ser resolvido à parte em vez de um embed automático do PostgREST.
  const teacherIds = Array.from(new Set((flags ?? []).map((f: any) => f.entity_id).filter(Boolean)))
  const { data: teachers } = teacherIds.length
    ? await supabase.from('users').select('id, full_name, email').in('id', teacherIds)
    : { data: [] }
  const teacherById = new Map((teachers ?? []).map((t: any) => [t.id, t]))

  const data = (flags ?? []).map((f: any) => ({ ...f, teacher: teacherById.get(f.entity_id) ?? null }))
  return c.json<ApiResponse>({ success: true, data: { flags: data, total: data.length } })
})

// ── GET /api/finance/earnings/payable?teacherId= — mínimo de 500 MZN (Art. 31)
// Soma todos os lançamentos APPROVED ainda não PAID de um professor e aplica
// a regra de payout mínimo. Não marca nada como PAID — só informa se, ao
// fechar agora, haveria pagamento ou carry-forward (separa CALCULATION de
// PAYOUT EXECUTION, secção 28 do prompt de implementação — a execução real
// do pagamento é acção administrativa distinta, ainda não implementada, ver
// blueprint PDR-007/Phase 8).
finance.get('/earnings/payable', async (c) => {
  const teacherId = c.req.query('teacherId')
  if (!teacherId) return c.json<ApiResponse>({ success: false, error: 'teacherId é obrigatório' }, 400)
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  try {
    const { data, error } = await supabase
      .from('teacher_earnings_ledger')
      .select('gross_amount')
      .eq('teacher_id', teacherId)
      .eq('status', 'APPROVED')
    if (error) throw new Error(error.message)

    // Soma TODOS os APPROVED ainda não PAID. POST /payouts (abaixo) marca as
    // linhas pagas como PAID, por isso este total exclui automaticamente
    // pagamentos já efectuados — o que sobra em APPROVED é sempre,
    // implicitamente, o carry-forward de períodos anteriores; não há um
    // segundo parâmetro a somar.
    const approvedTotal = (data || []).reduce((sum: number, row: any) => sum + Number(row.gross_amount), 0)
    const decision = determinePayout(approvedTotal, 0)

    return c.json<ApiResponse>({ success: true, data: decision })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

const PAYOUT_METHODS = ['mpesa', 'emola', 'bank_transfer', 'other']

// ── POST /api/finance/payouts — registar pagamento já efectuado (Art. 31) ──
// Secção 30 do prompt de implementação: não simular um gateway de
// disbursement sem integração validada. Não integra M-Pesa/banco — a equipa
// financeira processa a transferência manualmente e regista aqui a prova
// (método + referência), tal como já se faz para subscriptions em
// POST /finance/subscriptions. Paga sempre o saldo APPROVED completo do
// professor de uma vez (fn_record_teacher_payout, migration 033) — nunca
// parcial, e atómico contra pedidos concorrentes via advisory lock.
finance.post('/payouts', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as {
    teacherId?: string; method?: string; reference?: string; note?: string
  }
  if (!body.teacherId) return c.json<ApiResponse>({ success: false, error: 'teacherId é obrigatório' }, 400)
  if (!body.method || !PAYOUT_METHODS.includes(body.method)) {
    return c.json<ApiResponse>({ success: false, error: `method deve ser um de: ${PAYOUT_METHODS.join(', ')}` }, 400)
  }

  const user = c.get('user') as any
  try {
    const { data, error } = await supabase.rpc('fn_record_teacher_payout', {
      p_teacher_id: body.teacherId,
      p_method: body.method,
      p_reference: body.reference || null,
      p_note: body.note || null,
      p_recorded_by: user.id
    })
    if (error) throw new Error(error.message)

    const row = Array.isArray(data) ? data[0] : data
    await logEarningsAudit(supabase, {
      actorId: user?.id, action: 'RECORD_PAYOUT', entityType: 'teacher_payouts', entityId: row?.out_payout_id,
      after: { teacherId: body.teacherId, amountMzn: row?.out_amount_mzn, entriesPaid: row?.out_entries_paid, method: body.method }
    })

    return c.json<ApiResponse>({
      success: true,
      data: { payoutId: row?.out_payout_id, amountMzn: row?.out_amount_mzn, entriesPaid: row?.out_entries_paid },
      message: 'Pagamento registado'
    })
  } catch (e: any) {
    console.error('finance/payouts error:', e)
    const belowMinimum = /abaixo do mínimo/.test(e.message || '')
    return c.json<ApiResponse>({ success: false, error: e.message }, belowMinimum ? 409 : 500)
  }
})

// ── GET /api/finance/payouts?teacherId= — histórico de pagamentos ──────────
finance.get('/payouts', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const teacherId = c.req.query('teacherId')
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200)
  const offset = Number(c.req.query('offset')) || 0

  try {
    let query = supabase
      .from('teacher_payouts')
      .select('*, teacher:users!teacher_payouts_teacher_id_fkey(full_name, email), recordedBy:users!teacher_payouts_recorded_by_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (teacherId) query = query.eq('teacher_id', teacherId)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    return c.json<ApiResponse>({ success: true, data: { payouts: data || [], total: count || 0 } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/earnings/adjustment — lançamento manual auditável ─────
// Nunca apaga/edita um lançamento existente (secção 23/26 do prompt de
// implementação) — cria sempre uma linha nova ADJUSTMENT ou REVERSAL.
finance.post('/earnings/adjustment', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({})) as {
    teacherId?: string; amountMzn?: number; reason?: string; reversalOfId?: string
  }
  if (!body.teacherId || typeof body.amountMzn !== 'number' || !body.reason?.trim()) {
    return c.json<ApiResponse>({ success: false, error: 'teacherId, amountMzn e reason são obrigatórios' }, 400)
  }

  const { data: inserted, error } = await supabase.from('teacher_earnings_ledger').insert({
    teacher_id: body.teacherId,
    earning_type: body.reversalOfId ? 'REVERSAL' : 'ADJUSTMENT',
    gross_amount: body.amountMzn,
    currency: 'MZN',
    status: 'APPROVED',
    policy_version: 'V1.0',
    reversal_of_id: body.reversalOfId || null,
    approved_at: new Date().toISOString(),
    calculation_metadata: { reason: body.reason.trim(), createdByAdminId: user?.id }
  }).select('id').single()
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  await logEarningsAudit(supabase, {
    actorId: user?.id, action: body.reversalOfId ? 'CREATE_REVERSAL' : 'CREATE_ADJUSTMENT',
    entityType: 'teacher_earnings_ledger', entityId: inserted?.id,
    after: { teacherId: body.teacherId, amountMzn: body.amountMzn, reversalOfId: body.reversalOfId || null },
    reason: body.reason.trim()
  })

  return c.json<ApiResponse>({ success: true, message: 'Lançamento de ajuste criado' })
})

// ── GET /api/finance/referrals — listar atribuições de referência ───────────
finance.get('/referrals', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  try {
    const { data, error } = await supabase
      .from('referral_attributions')
      .select('id, student_id, teacher_id, referral_code, attributed_at, converted_at, commission_ledger_id')
      .order('attributed_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return c.json<ApiResponse>({ success: true, data: { attributions: data || [] } })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ── POST /api/finance/referrals/:studentId/convert ───────────────────────────
// Regista a comissão da PRIMEIRA compra elegível do estudante referenciado
// (Art. 21-24). Chamada manualmente pela equipa financeira quando processa a
// subscrição — não existe ainda gateway de pagamento a disparar isto
// automaticamente (ver PDR-002 no blueprint). Idempotente: uma atribuição só
// converte uma vez (commission_ledger_id preenchido bloqueia repetições).
finance.post('/referrals/:studentId/convert', async (c) => {
  const studentId = c.req.param('studentId')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as { netEligibleRevenueMzn?: number; subscriptionId?: string }
  if (typeof body.netEligibleRevenueMzn !== 'number' || body.netEligibleRevenueMzn < 0) {
    return c.json<ApiResponse>({ success: false, error: 'netEligibleRevenueMzn é obrigatório e não pode ser negativo' }, 400)
  }

  const { data: attribution, error: findErr } = await supabase
    .from('referral_attributions')
    .select('id, teacher_id, attributed_at, converted_at')
    .eq('student_id', studentId)
    .maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!attribution) return c.json<ApiResponse>({ success: false, error: 'Este estudante não tem professor referenciador atribuído' }, 404)
  if (attribution.converted_at) return c.json<ApiResponse>({ success: false, error: 'Comissão já registada para esta atribuição — só a primeira compra conta (Art. 21-24)' }, 409)

  const windowCheck = checkAttributionWindow(new Date(attribution.attributed_at), new Date())
  if (!windowCheck.eligible) {
    return c.json<ApiResponse>({ success: false, error: `Fora da janela de atribuição de 30 dias (${windowCheck.reason})` }, 409)
  }

  const commissionMzn = calculateReferralCommission(body.netEligibleRevenueMzn)

  const { data: ledgerRow, error: ledgerErr } = await supabase
    .from('teacher_earnings_ledger')
    .insert({
      teacher_id: attribution.teacher_id,
      earning_type: 'REFERRAL_COMMISSION',
      gross_amount: commissionMzn,
      currency: 'MZN',
      status: 'ESTIMATED',
      policy_version: 'V1.0',
      calculation_metadata: { studentId, netEligibleRevenueMzn: body.netEligibleRevenueMzn, ratePct: 15 }
    })
    .select('id')
    .single()
  if (ledgerErr || !ledgerRow) return c.json<ApiResponse>({ success: false, error: ledgerErr?.message || 'Falha ao gravar comissão' }, 500)

  const { error: updateErr } = await supabase
    .from('referral_attributions')
    .update({
      converted_at: new Date().toISOString(),
      commission_ledger_id: ledgerRow.id,
      // Guarda qual subscrição converteu, para a reversão automática de
      // reembolso (migration 035) saber exactamente qual reembolso deve
      // disparar a reversão desta comissão, sem ambiguidade com subscrições
      // posteriores do mesmo estudante.
      converted_subscription_id: body.subscriptionId || null
    })
    .eq('id', attribution.id)
  if (updateErr) return c.json<ApiResponse>({ success: false, error: updateErr.message }, 500)

  return c.json<ApiResponse>({ success: true, message: 'Comissão de referência registada', data: { commissionMzn, ledgerId: ledgerRow.id } })
})

// ── Fee de Embaixador (FEA, Art. 25) ─────────────────────────────────────────
finance.get('/ambassador-fees', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const { data, error } = await supabase.from('ambassador_fee_contracts').select('*').order('created_at', { ascending: false })
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  return c.json<ApiResponse>({ success: true, data: { contracts: data || [] } })
})

finance.post('/ambassador-fees', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({})) as Record<string, any>
  if (!body.teacherId || !body.amountMzn || !body.startDate || !body.endDate) {
    return c.json<ApiResponse>({ success: false, error: 'teacherId, amountMzn, startDate e endDate são obrigatórios' }, 400)
  }
  const { data, error } = await supabase.from('ambassador_fee_contracts').insert({
    teacher_id: body.teacherId,
    amount_mzn: body.amountMzn,
    start_date: body.startDate,
    end_date: body.endDate,
    contract_reference: body.contractReference || null,
    notes: body.notes || null,
    created_by: user?.id
  }).select('*').single()
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  return c.json<ApiResponse>({ success: true, message: 'Contrato de embaixador criado', data })
})

// Transição para COMPLETED gera automaticamente o lançamento AMBASSADOR_FEE
// no ledger (ESTIMATED) — sem isto, "suportar fee contratual" (secção 24)
// ficava só com a tabela de contratos, sem nunca chegar ao professor.
// Guardado contra duplicação: uma linha por contrato (metadata.contractId).
finance.patch('/ambassador-fees/:id', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const body = await c.req.json().catch(() => ({})) as { status?: string }
  if (!body.status || !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(body.status)) {
    return c.json<ApiResponse>({ success: false, error: 'status inválido' }, 400)
  }

  const { data: contract, error: findErr } = await supabase.from('ambassador_fee_contracts').select('*').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!contract) return c.json<ApiResponse>({ success: false, error: 'Contrato não encontrado' }, 404)

  const { error } = await supabase.from('ambassador_fee_contracts').update({ status: body.status }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const user = c.get('user') as any
  if (body.status === 'COMPLETED') {
    const { data: existing } = await supabase
      .from('teacher_earnings_ledger')
      .select('id')
      .eq('earning_type', 'AMBASSADOR_FEE')
      .contains('calculation_metadata', { contractId: id })
      .maybeSingle()

    if (!existing) {
      await supabase.from('teacher_earnings_ledger').insert({
        teacher_id: contract.teacher_id,
        earning_type: 'AMBASSADOR_FEE',
        period_start: contract.start_date,
        period_end: contract.end_date,
        gross_amount: contract.amount_mzn,
        currency: contract.currency,
        status: 'ESTIMATED',
        policy_version: 'V1.0',
        calculation_metadata: { contractId: id, contractReference: contract.contract_reference }
      })
    }
  }

  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'UPDATE_AMBASSADOR_FEE_STATUS', entityType: 'ambassador_fee_contracts', entityId: id,
    before: { status: contract.status }, after: { status: body.status }
  })

  return c.json<ApiResponse>({ success: true, message: 'Estado do contrato actualizado' })
})

// ── Remuneração por Conteúdo Especial (RCEsp, Art. 25) ───────────────────────
finance.get('/special-content', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const { data, error } = await supabase.from('special_content_contracts').select('*').order('created_at', { ascending: false })
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  return c.json<ApiResponse>({ success: true, data: { contracts: data || [] } })
})

finance.post('/special-content', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({})) as Record<string, any>
  if (!body.teacherId || !body.contentReference || !body.amountMzn) {
    return c.json<ApiResponse>({ success: false, error: 'teacherId, contentReference e amountMzn são obrigatórios' }, 400)
  }
  const { data, error } = await supabase.from('special_content_contracts').insert({
    teacher_id: body.teacherId,
    content_reference: body.contentReference,
    amount_mzn: body.amountMzn,
    period_start: body.periodStart || null,
    period_end: body.periodEnd || null,
    contract_reference: body.contractReference || null,
    notes: body.notes || null,
    created_by: user?.id
  }).select('*').single()
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
  return c.json<ApiResponse>({ success: true, message: 'Contrato de conteúdo especial criado', data })
})

// Transição para DELIVERED gera automaticamente o lançamento SPECIAL_CONTENT
// no ledger (ESTIMATED) — mesmo raciocínio do endpoint de ambassador-fees acima.
finance.patch('/special-content/:id', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)
  const body = await c.req.json().catch(() => ({})) as { status?: string }
  if (!body.status || !['PENDING', 'DELIVERED', 'PAID', 'CANCELLED'].includes(body.status)) {
    return c.json<ApiResponse>({ success: false, error: 'status inválido' }, 400)
  }

  const { data: contract, error: findErr } = await supabase.from('special_content_contracts').select('*').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!contract) return c.json<ApiResponse>({ success: false, error: 'Contrato não encontrado' }, 404)

  const { error } = await supabase.from('special_content_contracts').update({ status: body.status }).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const user = c.get('user') as any
  if (body.status === 'DELIVERED') {
    const { data: existing } = await supabase
      .from('teacher_earnings_ledger')
      .select('id')
      .eq('earning_type', 'SPECIAL_CONTENT')
      .contains('calculation_metadata', { contractId: id })
      .maybeSingle()

    if (!existing) {
      await supabase.from('teacher_earnings_ledger').insert({
        teacher_id: contract.teacher_id,
        earning_type: 'SPECIAL_CONTENT',
        period_start: contract.period_start,
        period_end: contract.period_end,
        gross_amount: contract.amount_mzn,
        currency: contract.currency,
        status: 'ESTIMATED',
        policy_version: 'V1.0',
        calculation_metadata: { contractId: id, contentReference: contract.content_reference, contractReference: contract.contract_reference }
      })
    }
  }

  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'UPDATE_SPECIAL_CONTENT_STATUS', entityType: 'special_content_contracts', entityId: id,
    before: { status: contract.status }, after: { status: body.status }
  })

  return c.json<ApiResponse>({ success: true, message: 'Estado do contrato actualizado' })
})

// ── Campanhas VQ-B (bónus de visualização em lote, Art. 6, migration 036) ───
// Uma campanha cobre um conjunto de lições concretas; enquanto activa e
// dentro de [startsAt, endsAt), toda visualização elegível dessas lições
// classifica VQ-B em vez de VQ-R (fn_record_watch_heartbeat decide isto no
// próprio momento do heartbeat, não aqui — isto é só administração).
finance.get('/vq-b-campaigns', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const { data: campaigns, error } = await supabase
    .from('vq_b_campaigns')
    .select('*, vq_b_campaign_lessons(lesson_id)')
    .order('created_at', { ascending: false })
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const data = (campaigns ?? []).map((camp: any) => ({
    ...camp,
    lessonIds: (camp.vq_b_campaign_lessons ?? []).map((l: any) => l.lesson_id),
    vq_b_campaign_lessons: undefined
  }))

  return c.json<ApiResponse>({ success: true, data: { campaigns: data } })
})

finance.post('/vq-b-campaigns', async (c) => {
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as {
    name?: string; rateType?: string; rateValue?: number; startsAt?: string; endsAt?: string; lessonIds?: string[]
  }
  if (!body.name?.trim()) return c.json<ApiResponse>({ success: false, error: 'name é obrigatório' }, 400)
  if (!body.rateType || !['NORMAL_VCPM', 'PERCENTAGE_OF_VCPM', 'FIXED_VCPM'].includes(body.rateType)) {
    return c.json<ApiResponse>({ success: false, error: 'rateType inválido (NORMAL_VCPM|PERCENTAGE_OF_VCPM|FIXED_VCPM)' }, 400)
  }
  if (body.rateType !== 'NORMAL_VCPM' && (typeof body.rateValue !== 'number' || body.rateValue <= 0)) {
    return c.json<ApiResponse>({ success: false, error: 'rateValue é obrigatório (e > 0) para este rateType' }, 400)
  }
  if (!body.startsAt || !body.endsAt || new Date(body.endsAt) <= new Date(body.startsAt)) {
    return c.json<ApiResponse>({ success: false, error: 'startsAt/endsAt inválidos (endsAt tem de ser depois de startsAt)' }, 400)
  }
  if (!Array.isArray(body.lessonIds) || body.lessonIds.length === 0) {
    return c.json<ApiResponse>({ success: false, error: 'lessonIds é obrigatório (pelo menos uma lição)' }, 400)
  }

  const user = c.get('user') as any
  const { data: campaign, error } = await supabase
    .from('vq_b_campaigns')
    .insert({
      name: body.name.trim(),
      rate_type: body.rateType,
      rate_value: body.rateType === 'NORMAL_VCPM' ? null : body.rateValue,
      starts_at: body.startsAt,
      ends_at: body.endsAt,
      created_by: user?.id
    })
    .select('id')
    .single()
  if (error || !campaign) return c.json<ApiResponse>({ success: false, error: error?.message || 'Falha ao criar campanha' }, 500)

  const { error: lessonsErr } = await supabase
    .from('vq_b_campaign_lessons')
    .insert(body.lessonIds.map(lessonId => ({ campaign_id: campaign.id, lesson_id: lessonId })))
  if (lessonsErr) return c.json<ApiResponse>({ success: false, error: lessonsErr.message }, 500)

  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'CREATE_VQ_B_CAMPAIGN', entityType: 'vq_b_campaigns', entityId: campaign.id,
    after: { name: body.name, rateType: body.rateType, rateValue: body.rateValue ?? null, startsAt: body.startsAt, endsAt: body.endsAt, lessonCount: body.lessonIds.length }
  })

  return c.json<ApiResponse>({ success: true, message: 'Campanha VQ-B criada', data: { id: campaign.id } })
})

// ── PATCH /api/finance/vq-b-campaigns/:id — desactivar/reactivar ou reagendar
finance.patch('/vq-b-campaigns/:id', async (c) => {
  const id = c.req.param('id')
  if (!isDatabaseConfigured(c.env)) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

  const body = await c.req.json().catch(() => ({})) as { active?: boolean; startsAt?: string; endsAt?: string }
  const updates: Record<string, any> = {}
  if (typeof body.active === 'boolean') updates.active = body.active
  if (body.startsAt) updates.starts_at = body.startsAt
  if (body.endsAt) updates.ends_at = body.endsAt
  if (Object.keys(updates).length === 0) return c.json<ApiResponse>({ success: false, error: 'Nada para actualizar' }, 400)

  const { data: campaign, error: findErr } = await supabase.from('vq_b_campaigns').select('*').eq('id', id).maybeSingle()
  if (findErr) return c.json<ApiResponse>({ success: false, error: findErr.message }, 500)
  if (!campaign) return c.json<ApiResponse>({ success: false, error: 'Campanha não encontrada' }, 404)

  const { error } = await supabase.from('vq_b_campaigns').update(updates).eq('id', id)
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const user = c.get('user') as any
  await logEarningsAudit(supabase, {
    actorId: user?.id, action: 'UPDATE_VQ_B_CAMPAIGN', entityType: 'vq_b_campaigns', entityId: id,
    before: { active: campaign.active, starts_at: campaign.starts_at, ends_at: campaign.ends_at }, after: updates
  })

  return c.json<ApiResponse>({ success: true, message: 'Campanha actualizada' })
})

export default finance
