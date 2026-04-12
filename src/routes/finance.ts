// Finance Routes — /api/finance/*
// Gestão de subscrições, pagamentos e receita
import { Hono } from 'hono'
import { authMiddleware, requireFinanceOrAdmin } from '../middleware/auth'
import type { ApiResponse } from '../types'

const finance = new Hono()
finance.use('/*', authMiddleware)
finance.use('/*', requireFinanceOrAdmin)

// ── Mock data ─────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price_mzn: 0, price_aoa: 0, price_brl: 0, price_eur: 0,
    features: ['5 aulas por mês', 'Exercícios básicos', 'Biblioteca limitada'],
    active_users: 8320,
    color: '#6b7280'
  },
  {
    id: 'basic',
    name: 'Básico',
    price_mzn: 299, price_aoa: 2500, price_brl: 29.9, price_eur: 4.99,
    features: ['50 aulas por mês', 'Todos os exercícios', 'Download PDF', 'Chat IA 20 msg/dia'],
    active_users: 2140,
    color: '#2563eb'
  },
  {
    id: 'premium',
    name: 'Premium',
    price_mzn: 599, price_aoa: 4900, price_brl: 59.9, price_eur: 9.99,
    features: ['Aulas ilimitadas', 'Exercícios ilimitados', 'Downloads ilimitados', 'Chat IA ilimitado', 'Acesso antecipado'],
    active_users: 847,
    color: '#7c3aed'
  }
]

const MOCK_SUBSCRIPTIONS = [
  { id: 'sub-001', user_name: 'Ana Silva',     user_email: 'ana.silva@vclass.mz',   plan: 'premium', country: '🇲🇿 MZ', status: 'active',    amount: 599,  currency: 'MZN', started_at: '2025-10-01', expires_at: '2026-10-01', payment_provider: 'M-Pesa',   auto_renew: true },
  { id: 'sub-002', user_name: 'Mário Costa',   user_email: 'mario.costa@vclass.ao', plan: 'basic',   country: '🇦🇴 AO', status: 'active',    amount: 2500, currency: 'AOA', started_at: '2025-11-15', expires_at: '2026-11-15', payment_provider: 'Multicaixa', auto_renew: true },
  { id: 'sub-003', user_name: 'Tomás Ferreira', user_email: 'tomas@vclass.mz',     plan: 'premium', country: '🇲🇿 MZ', status: 'active',    amount: 599,  currency: 'MZN', started_at: '2025-09-01', expires_at: '2026-09-01', payment_provider: 'M-Pesa',   auto_renew: false },
  { id: 'sub-004', user_name: 'Lúcia Afonso',  user_email: 'lucia@vclass.ao',      plan: 'basic',   country: '🇦🇴 AO', status: 'cancelled', amount: 2500, currency: 'AOA', started_at: '2025-08-01', expires_at: '2025-11-01', payment_provider: 'Multicaixa', auto_renew: false },
  { id: 'sub-005', user_name: 'Pedro Mateus',  user_email: 'pedro@vclass.pt',      plan: 'premium', country: '🇵🇹 PT', status: 'active',    amount: 9.99, currency: 'EUR', started_at: '2025-10-20', expires_at: '2026-10-20', payment_provider: 'Stripe',    auto_renew: true },
  { id: 'sub-006', user_name: 'Grace Nkosi',   user_email: 'grace@vclass.mz',      plan: 'basic',   country: '🇲🇿 MZ', status: 'expired',   amount: 299,  currency: 'MZN', started_at: '2025-07-01', expires_at: '2025-10-01', payment_provider: 'M-Pesa',   auto_renew: false },
  { id: 'sub-007', user_name: 'Bruno Lopes',   user_email: 'bruno@vclass.br',      plan: 'premium', country: '🇧🇷 BR', status: 'active',    amount: 59.9, currency: 'BRL', started_at: '2025-11-01', expires_at: '2026-11-01', payment_provider: 'Stripe',    auto_renew: true },
  { id: 'sub-008', user_name: 'Sara Chissano', user_email: 'sara@vclass.mz',       plan: 'basic',   country: '🇲🇿 MZ', status: 'active',    amount: 299,  currency: 'MZN', started_at: '2025-12-01', expires_at: '2026-12-01', payment_provider: 'M-Pesa',   auto_renew: true },
]

const MOCK_PAYMENTS = [
  { id: 'pay-001', user: 'Ana Silva',     amount: 599,  currency: 'MZN', plan: 'premium', method: 'M-Pesa',    status: 'success', date: new Date(Date.now() - 86400000 * 2).toISOString(),  ref: 'MP24-00891' },
  { id: 'pay-002', user: 'Bruno Lopes',   amount: 59.9, currency: 'BRL', plan: 'premium', method: 'Stripe',    status: 'success', date: new Date(Date.now() - 86400000 * 3).toISOString(),  ref: 'STR-ch_AB12' },
  { id: 'pay-003', user: 'Sara Chissano', amount: 299,  currency: 'MZN', plan: 'basic',   method: 'M-Pesa',    status: 'success', date: new Date(Date.now() - 86400000 * 4).toISOString(),  ref: 'MP24-00788' },
  { id: 'pay-004', user: 'Lúcia Afonso',  amount: 2500, currency: 'AOA', plan: 'basic',   method: 'Multicaixa',status: 'failed',  date: new Date(Date.now() - 86400000 * 5).toISOString(),  ref: 'MCA-F-0341' },
  { id: 'pay-005', user: 'Tomás Ferreira',amount: 599,  currency: 'MZN', plan: 'premium', method: 'M-Pesa',    status: 'success', date: new Date(Date.now() - 86400000 * 7).toISOString(),  ref: 'MP24-00712' },
  { id: 'pay-006', user: 'Pedro Mateus',  amount: 9.99, currency: 'EUR', plan: 'premium', method: 'Stripe',    status: 'refunded',date: new Date(Date.now() - 86400000 * 8).toISOString(),  ref: 'STR-re_CD34' },
  { id: 'pay-007', user: 'Mário Costa',   amount: 2500, currency: 'AOA', plan: 'basic',   method: 'Multicaixa',status: 'success', date: new Date(Date.now() - 86400000 * 10).toISOString(), ref: 'MCA-00215' },
  { id: 'pay-008', user: 'Grace Nkosi',   amount: 299,  currency: 'MZN', plan: 'basic',   method: 'M-Pesa',    status: 'success', date: new Date(Date.now() - 86400000 * 12).toISOString(), ref: 'MP24-00654' },
]

// Revenue chart — últimos 12 meses (em USD equivalente)
const MONTHLY_REVENUE = [
  { month: 'Jan', revenue: 1240, subscriptions: 42 },
  { month: 'Fev', revenue: 1580, subscriptions: 56 },
  { month: 'Mar', revenue: 1820, subscriptions: 64 },
  { month: 'Abr', revenue: 2100, subscriptions: 78 },
  { month: 'Mai', revenue: 2350, subscriptions: 89 },
  { month: 'Jun', revenue: 2780, subscriptions: 102 },
  { month: 'Jul', revenue: 3120, subscriptions: 118 },
  { month: 'Ago', revenue: 3540, subscriptions: 134 },
  { month: 'Set', revenue: 3980, subscriptions: 149 },
  { month: 'Out', revenue: 4320, subscriptions: 163 },
  { month: 'Nov', revenue: 4870, subscriptions: 184 },
  { month: 'Dez', revenue: 5240, subscriptions: 198 },
]

// ── GET /api/finance/stats ────────────────────────────────────────────────────
finance.get('/stats', (c) => {
  const active = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'active').length
  const cancelled = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'cancelled').length
  const expired = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'expired').length
  const premium_active = MOCK_SUBSCRIPTIONS.filter(s => s.plan === 'premium' && s.status === 'active').length
  const basic_active = MOCK_SUBSCRIPTIONS.filter(s => s.plan === 'basic' && s.status === 'active').length

  const successPayments = MOCK_PAYMENTS.filter(p => p.status === 'success')
  const totalRevenueMZN = successPayments.filter(p => p.currency === 'MZN').reduce((a, b) => a + b.amount, 0)

  return c.json<ApiResponse>({
    success: true,
    data: {
      subscriptions: {
        total_paid_users: active,
        active,
        cancelled,
        expired,
        premium: premium_active,
        basic: basic_active,
        free_users: PLANS[0].active_users,
        conversion_rate: ((active / (PLANS[0].active_users + active)) * 100).toFixed(1) + '%'
      },
      revenue: {
        this_month_usd: 5240,
        last_month_usd: 4870,
        growth_pct: 7.6,
        total_year_usd: 36940,
        mrr_usd: 5240,
        arr_usd: 62880,
        payments_this_week: successPayments.length,
        failed_payments: MOCK_PAYMENTS.filter(p => p.status === 'failed').length,
        refunds: MOCK_PAYMENTS.filter(p => p.status === 'refunded').length,
      },
      by_country: [
        { country: '🇲🇿 Moçambique', active: 3, revenue_mzn: totalRevenueMZN, plan_split: { premium: 2, basic: 1 } },
        { country: '🇦🇴 Angola',    active: 1, revenue_aoa: 2500, plan_split: { premium: 0, basic: 1 } },
        { country: '🇵🇹 Portugal',  active: 1, revenue_eur: 9.99, plan_split: { premium: 1, basic: 0 } },
        { country: '🇧🇷 Brasil',    active: 1, revenue_brl: 59.9, plan_split: { premium: 1, basic: 0 } },
      ],
      plans: PLANS
    }
  })
})

// ── GET /api/finance/subscriptions ───────────────────────────────────────────
finance.get('/subscriptions', (c) => {
  const status = c.req.query('status')
  const plan   = c.req.query('plan')
  let subs = [...MOCK_SUBSCRIPTIONS]
  if (status && status !== 'all') subs = subs.filter(s => s.status === status)
  if (plan   && plan   !== 'all') subs = subs.filter(s => s.plan   === plan)
  return c.json<ApiResponse>({ success: true, data: { subscriptions: subs, total: subs.length } })
})

// ── PATCH /api/finance/subscriptions/:id ─────────────────────────────────────
finance.patch('/subscriptions/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json<ApiResponse>({
    success: true,
    message: `Subscrição ${id} actualizada`,
    data: { id, ...body, updated_at: new Date().toISOString() }
  })
})

// ── POST /api/finance/subscriptions/:id/cancel ───────────────────────────────
finance.post('/subscriptions/:id/cancel', async (c) => {
  const id = c.req.param('id')
  return c.json<ApiResponse>({
    success: true,
    message: `Subscrição ${id} cancelada`,
    data: { id, status: 'cancelled', cancelled_at: new Date().toISOString() }
  })
})

// ── POST /api/finance/subscriptions/:id/refund ───────────────────────────────
finance.post('/subscriptions/:id/refund', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  return c.json<ApiResponse>({
    success: true,
    message: `Reembolso processado para ${id}`,
    data: { id, refunded: true, reason: (body as any).reason || 'solicitado pelo utilizador', refunded_at: new Date().toISOString() }
  })
})

// ── GET /api/finance/payments ─────────────────────────────────────────────────
finance.get('/payments', (c) => {
  const status = c.req.query('status')
  let payments = [...MOCK_PAYMENTS]
  if (status && status !== 'all') payments = payments.filter(p => p.status === status)
  return c.json<ApiResponse>({ success: true, data: { payments, total: payments.length } })
})

// ── GET /api/finance/revenue ──────────────────────────────────────────────────
finance.get('/revenue', (c) => {
  return c.json<ApiResponse>({
    success: true,
    data: {
      monthly: MONTHLY_REVENUE,
      total_year_usd: MONTHLY_REVENUE.reduce((a, b) => a + b.revenue, 0),
      peak_month: 'Dezembro',
      peak_revenue: 5240
    }
  })
})

// ── GET /api/finance/plans ────────────────────────────────────────────────────
finance.get('/plans', (c) => {
  return c.json<ApiResponse>({ success: true, data: { plans: PLANS } })
})

// ── PATCH /api/finance/plans/:id ─────────────────────────────────────────────
finance.patch('/plans/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  return c.json<ApiResponse>({
    success: true,
    message: `Plano ${id} actualizado`,
    data: { id, ...body, updated_at: new Date().toISOString() }
  })
})

export default finance
