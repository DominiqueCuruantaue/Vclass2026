// Finance Routes — /api/finance/*
// Gestão de subscrições, pagamentos, receita e planos (preços/funcionalidades)
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireFinanceOrAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { loadPlans, isDatabaseConfigured, FALLBACK_PLANS_DATA } from '../utils/plans'
import { COUNTRIES } from '../data/curriculum'
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

export default finance
