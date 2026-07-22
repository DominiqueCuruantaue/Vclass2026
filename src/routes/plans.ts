// Plans Routes — /api/plans/*
// Rotas públicas de planos e subscrição
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { loadPlans, isDatabaseConfigured, FALLBACK_PLANS_DATA, type PlanRecord } from '../utils/plans'
import { getUserPlan } from '../utils/subscription'
import type { ApiResponse } from '../types'

const plans = new Hono<{ Bindings: CloudflareBindings }>()

// ── Dados dos planos ──────────────────────────────────────────────────────────
// Preços e funcionalidades reais vêm agora das tabelas `plans`/`plan_features`
// (migration 024), editáveis pela equipa financeira em /api/finance/plans.
// FALLBACK_PLANS_DATA (src/utils/plans.ts) só é usado em dev sem Supabase.

async function getPlansData(env?: any): Promise<PlanRecord[]> {
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

const PAYMENT_METHODS = [
  { id: 'mpesa',      name: 'M-Pesa',     icon: 'fa-mobile-alt',   countries: ['MZ'],          color: '#E31E26' },
  { id: 'emola',      name: 'e-Mola',     icon: 'fa-mobile-alt',   countries: ['MZ'],          color: '#FF6B00' },
  { id: 'multicaixa', name: 'Multicaixa', icon: 'fa-credit-card',  countries: ['AO'],          color: '#005b9e' },
  { id: 'stripe',     name: 'Cartão',     icon: 'fa-credit-card',  countries: ['PT','BR','*'], color: '#635BFF' },
  { id: 'paypal',     name: 'PayPal',     icon: 'fa-paypal',       countries: ['PT','BR','*'], color: '#003087' },
]

const FAQ_DATA = [
  {
    q: 'Posso mudar de plano a qualquer momento?',
    a: 'Sim! Pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor no próximo ciclo de facturação.'
  },
  {
    q: 'Existe um período de teste gratuito?',
    a: 'O plano Gratuito está sempre disponível sem limite de tempo. Os planos pagos não têm período de teste, mas pode cancelar em qualquer altura antes do próximo ciclo.'
  },
  {
    q: 'Como funciona a facturação anual?',
    a: 'Com a subscrição anual, paga todo o ano de uma vez e economiza 25% em relação à facturação mensal.'
  },
  {
    q: 'Quais métodos de pagamento são aceites?',
    a: 'Aceitamos M-Pesa e e-Mola para Moçambique, Multicaixa para Angola, e cartão de crédito/PayPal para os restantes países.'
  },
  {
    q: 'O que acontece quando o meu plano expira?',
    a: 'A conta volta automaticamente ao plano Gratuito. O seu progresso e conquistas são sempre mantidos.'
  },
  {
    q: 'Posso obter reembolso?',
    a: 'Oferecemos reembolso integral nos primeiros 7 dias após a subscrição, caso não esteja satisfeito.'
  }
]

// ── GET /api/plans — pública, sem auth ───────────────────────────────────────
plans.get('/', async (c) => {
  const currency = (c.req.query('currency') || 'mzn').toLowerCase()
  const validCurrencies = ['mzn', 'aoa', 'brl', 'eur']
  const cur = (validCurrencies.includes(currency) ? currency : 'mzn') as 'mzn' | 'aoa' | 'brl' | 'eur'

  const plansData = await getPlansData(c.env)
  const formattedPlans = plansData.map(p => ({
    ...p,
    display_price_monthly: p.price_monthly[cur],
    display_price_yearly:  p.price_yearly[cur],
    currency: cur.toUpperCase(),
  }))

  return c.json<ApiResponse>({
    success: true,
    data: {
      plans: formattedPlans,
      payment_methods: PAYMENT_METHODS,
      faq: FAQ_DATA,
      currencies: [
        { code: 'MZN', name: 'Metical Moçambicano', flag: '🇲🇿', symbol: 'MT' },
        { code: 'AOA', name: 'Kwanza Angolano',      flag: '🇦🇴', symbol: 'Kz' },
        { code: 'BRL', name: 'Real Brasileiro',      flag: '🇧🇷', symbol: 'R$' },
        { code: 'EUR', name: 'Euro',                 flag: '🇪🇺', symbol: '€'  },
      ]
    }
  })
})

// ── GET /api/plans/compare — comparação detalhada ────────────────────────────
plans.get('/compare', async (c) => {
  const rows = [
    { feature: 'Aulas por mês',        free: '5',        basic: '50',        premium: 'Ilimitadas' },
    { feature: 'Exercícios',            free: 'Básicos',  basic: 'Todos',     premium: 'Ilimitados' },
    { feature: 'Descarregar PDFs',      free: '✗',        basic: '✓',         premium: '✓ Ilimitados' },
    { feature: 'Chat com IA',           free: '✗',        basic: '30 msg/dia',premium: 'Ilimitado' },
    { feature: 'Biblioteca',            free: '20 items', basic: 'Completa',  premium: 'Completa + Exclusivos' },
    { feature: 'Certificados',          free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Acesso antecipado',     free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Suporte prioritário',   free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Streak de estudo',      free: '✓',        basic: '✓',         premium: '✓' },
    { feature: 'XP e conquistas',       free: '✓',        basic: '✓',         premium: '✓' },
  ]
  const plansData = await getPlansData(c.env)
  return c.json<ApiResponse>({ success: true, data: { comparison: rows, plans: plansData.map(p => ({ id: p.id, name: p.name, color: p.color })) } })
})

// ── POST /api/plans/subscribe — iniciar subscrição (requer auth) ─────────────
plans.post('/subscribe', authMiddleware, async (c) => {
  const user = c.get('user' as any) as any
  const body = await c.req.json().catch(() => ({})) as any

  const { plan_id, billing, currency, payment_method } = body

  if (!plan_id || !['basic', 'premium'].includes(plan_id)) {
    return c.json<ApiResponse>({ success: false, message: 'Plano inválido. Escolha basic ou premium.' }, 400)
  }
  if (!billing || !['monthly', 'yearly'].includes(billing)) {
    return c.json<ApiResponse>({ success: false, message: 'Ciclo de facturação inválido.' }, 400)
  }

  const plansData = await getPlansData(c.env)
  const plan = plansData.find(p => p.id === plan_id)!
  const cur  = (currency || 'mzn').toLowerCase() as keyof typeof plan.price_monthly
  const price = billing === 'yearly' ? plan.price_yearly[cur] : plan.price_monthly[cur]

  const refCode = `VC-${Date.now().toString(36).toUpperCase()}`
  const expiresAt = new Date()
  if (billing === 'yearly')  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  else                        expiresAt.setMonth(expiresAt.getMonth() + 1)

  return c.json<ApiResponse>({
    success: true,
    message: `Subscrição ${plan.name} iniciada com sucesso!`,
    data: {
      subscription: {
        id: `sub-${Date.now()}`,
        user_id: user.id,
        plan_id,
        plan_name: plan.name,
        billing,
        currency: cur.toUpperCase(),
        amount: price,
        payment_method: payment_method || 'pending',
        status: 'pending_payment',
        reference: refCode,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
      },
      payment_instructions: {
        method: payment_method,
        reference: refCode,
        amount: price,
        currency: cur.toUpperCase(),
        expiry_minutes: 30,
        instructions: payment_method === 'mpesa'
          ? `Envie ${price} MT para o número 84 553 3100 com referência ${refCode}`
          : payment_method === 'multicaixa'
          ? `Pague ${price} AOA via Multicaixa Express com referência ${refCode}`
          : `Complete o pagamento de ${price} ${cur.toUpperCase()} usando a referência ${refCode}`,
      }
    }
  })
})

// ── GET /api/plans/my — subscrição do utilizador logado ──────────────────────
plans.get('/my', authMiddleware, async (c) => {
  const user = c.get('user' as any) as any
  const supabase = getSupabase(c.env)
  // Papéis sem plano aplicável (professor/admin/staff) contam como sem restrição —
  // aqui, só para preencher a resposta, tratamos como 'free' (não têm o que "subscrever").
  const planId = (await getUserPlan(supabase, user.id, user.role)) || 'free'
  const plansData = await getPlansData(c.env)
  const planData = plansData.find(p => p.id === planId)!

  return c.json<ApiResponse>({
    success: true,
    data: {
      current_plan: {
        id: planId,
        name: planData.name,
        color: planData.color,
        icon: planData.icon,
        billing: planId === 'free' ? null : 'monthly',
        currency: 'MZN',
        amount: planId === 'free' ? 0 : planData.price_monthly.mzn,
        status: planId === 'free' ? 'free' : 'active',
        started_at: planId === 'free' ? null : '2025-10-01',
        expires_at: planId === 'free' ? null : '2026-10-01',
        auto_renew: planId !== 'free',
      },
      upgrade_available: planId !== 'premium',
      suggested_plan: planId === 'free' ? 'basic' : planId === 'basic' ? 'premium' : null,
    }
  })
})

// ── POST /api/plans/cancel — cancelar subscrição ─────────────────────────────
plans.post('/cancel', authMiddleware, async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json<ApiResponse>({
    success: true,
    message: 'Subscrição cancelada. O acesso continua até ao fim do período pago.',
    data: {
      cancelled: true,
      reason: body.reason || 'Pedido do utilizador',
      access_until: new Date(Date.now() + 86400000 * 30).toISOString(),
    }
  })
})

export default plans
