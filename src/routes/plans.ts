// Plans Routes — /api/plans/*
// Rotas públicas de planos e subscrição
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { ApiResponse } from '../types'

const plans = new Hono()

// ── Dados dos planos ──────────────────────────────────────────────────────────

export const PLANS_DATA = [
  {
    id: 'free',
    name: 'Gratuito',
    tagline: 'Começa sem custo',
    price_monthly: { mzn: 0, aoa: 0, brl: 0, eur: 0 },
    price_yearly:  { mzn: 0, aoa: 0, brl: 0, eur: 0 },
    color: '#6b7280',
    color_bg: '#f3f4f6',
    icon: 'fa-seedling',
    popular: false,
    active_users: 8320,
    features: [
      { text: '5 aulas por mês', included: true },
      { text: 'Exercícios básicos', included: true },
      { text: 'Biblioteca limitada (20 recursos)', included: true },
      { text: 'Chat de suporte', included: true },
      { text: 'Descarregar PDFs', included: false },
      { text: 'Chat com IA', included: false },
      { text: 'Aulas ilimitadas', included: false },
      { text: 'Acesso antecipado a novos conteúdos', included: false },
      { text: 'Certificados de conclusão', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    limits: { lessons_per_month: 5, exercises: 'básicos', downloads: false, ai_chat: false, library: 20 },
    cta: 'Começar Grátis',
    cta_style: 'outline',
  },
  {
    id: 'basic',
    name: 'Básico',
    tagline: 'Para estudantes dedicados',
    price_monthly: { mzn: 299, aoa: 2500, brl: 29.9, eur: 4.99 },
    price_yearly:  { mzn: 2690, aoa: 22500, brl: 269, eur: 44.9 },
    yearly_saving_pct: 25,
    color: '#2563eb',
    color_bg: '#eff6ff',
    icon: 'fa-book-open',
    popular: false,
    active_users: 2140,
    features: [
      { text: '50 aulas por mês', included: true },
      { text: 'Todos os exercícios', included: true },
      { text: 'Biblioteca completa', included: true },
      { text: 'Chat de suporte', included: true },
      { text: 'Descarregar PDFs', included: true },
      { text: 'Chat com IA (20 msg/dia)', included: true },
      { text: 'Aulas ilimitadas', included: false },
      { text: 'Acesso antecipado a novos conteúdos', included: false },
      { text: 'Certificados de conclusão', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    limits: { lessons_per_month: 50, exercises: 'todos', downloads: true, ai_chat: '20/dia', library: 'completo' },
    cta: 'Subscrever Básico',
    cta_style: 'primary',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'A melhor experiência educativa',
    price_monthly: { mzn: 599, aoa: 4900, brl: 59.9, eur: 9.99 },
    price_yearly:  { mzn: 5390, aoa: 44100, brl: 539, eur: 89.9 },
    yearly_saving_pct: 25,
    color: '#7c3aed',
    color_bg: '#f5f3ff',
    icon: 'fa-crown',
    popular: true,
    active_users: 847,
    features: [
      { text: 'Aulas ilimitadas', included: true },
      { text: 'Exercícios ilimitados', included: true },
      { text: 'Biblioteca completa + exclusivos', included: true },
      { text: 'Chat de suporte', included: true },
      { text: 'Descarregar PDFs ilimitados', included: true },
      { text: 'Chat com IA ilimitado', included: true },
      { text: 'Aulas ilimitadas', included: true },
      { text: 'Acesso antecipado a novos conteúdos', included: true },
      { text: 'Certificados de conclusão', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
    limits: { lessons_per_month: 'ilimitado', exercises: 'ilimitado', downloads: 'ilimitado', ai_chat: 'ilimitado', library: 'completo+exclusivo' },
    cta: 'Subscrever Premium',
    cta_style: 'premium',
  }
]

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
plans.get('/', (c) => {
  const currency = (c.req.query('currency') || 'mzn').toLowerCase()
  const validCurrencies = ['mzn', 'aoa', 'brl', 'eur']
  const cur = validCurrencies.includes(currency) ? currency as keyof typeof PLANS_DATA[0]['price_monthly'] : 'mzn'

  const formattedPlans = PLANS_DATA.map(p => ({
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
plans.get('/compare', (c) => {
  const rows = [
    { feature: 'Aulas por mês',        free: '5',        basic: '50',        premium: 'Ilimitadas' },
    { feature: 'Exercícios',            free: 'Básicos',  basic: 'Todos',     premium: 'Ilimitados' },
    { feature: 'Descarregar PDFs',      free: '✗',        basic: '✓',         premium: '✓ Ilimitados' },
    { feature: 'Chat com IA',           free: '✗',        basic: '20 msg/dia',premium: 'Ilimitado' },
    { feature: 'Biblioteca',            free: '20 items', basic: 'Completa',  premium: 'Completa + Exclusivos' },
    { feature: 'Certificados',          free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Acesso antecipado',     free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Suporte prioritário',   free: '✗',        basic: '✗',         premium: '✓' },
    { feature: 'Streak de estudo',      free: '✓',        basic: '✓',         premium: '✓' },
    { feature: 'XP e conquistas',       free: '✓',        basic: '✓',         premium: '✓' },
  ]
  return c.json<ApiResponse>({ success: true, data: { comparison: rows, plans: PLANS_DATA.map(p => ({ id: p.id, name: p.name, color: p.color })) } })
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

  const plan = PLANS_DATA.find(p => p.id === plan_id)!
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
plans.get('/my', authMiddleware, (c) => {
  const user = c.get('user' as any) as any
  // Demo: estudante demo tem premium, outros têm free
  const isDemoPremium = user.email?.includes('ana.silva') || user.email?.includes('prof.')
  const isDemoBasic   = user.email?.includes('mario.costa')

  const planId   = isDemoPremium ? 'premium' : isDemoBasic ? 'basic' : 'free'
  const planData = PLANS_DATA.find(p => p.id === planId)!

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
        limits: planData.limits,
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
