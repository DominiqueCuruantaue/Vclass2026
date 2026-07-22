// Planos e preços — fonte partilhada entre /api/plans (página pública) e
// /api/finance/plans (edição pelo painel financeiro).
//
// Os dados vivem nas tabelas `plans` + `plan_features` (migration 024).
// Antes disso não existia nenhuma tabela — havia TRÊS cópias hardcoded e
// desligadas entre si (src/routes/plans.ts, src/routes/finance.ts e o
// script inline de finance-dashboard.html). Isto é agora a única fonte.

export interface PlanFeature {
  text: string
  included: boolean
}

export interface PlanRecord {
  id: string
  name: string
  tagline: string
  price_monthly: { mzn: number; aoa: number; brl: number; eur: number }
  price_yearly: { mzn: number; aoa: number; brl: number; eur: number }
  yearly_saving_pct: number | null
  color: string
  color_bg: string
  icon: string
  popular: boolean
  cta: string
  cta_style: string
  features: PlanFeature[]
}

// Fallback usado apenas quando o Supabase não está configurado (dev sem BD).
export const FALLBACK_PLANS_DATA: PlanRecord[] = [
  {
    id: 'free', name: 'Gratuito', tagline: 'Começa sem custo',
    price_monthly: { mzn: 0, aoa: 0, brl: 0, eur: 0 },
    price_yearly: { mzn: 0, aoa: 0, brl: 0, eur: 0 },
    yearly_saving_pct: null,
    color: '#6b7280', color_bg: '#f3f4f6', icon: 'fa-seedling', popular: false,
    cta: 'Começar Grátis', cta_style: 'outline',
    features: [
      { text: '10 aulas por mês', included: true },
      { text: 'Exercícios básicos', included: true },
      { text: 'Biblioteca limitada (30 recursos)', included: true },
      { text: 'Chat de suporte comunitário', included: true },
      { text: 'Descarregar PDFs', included: false },
      { text: 'Chat com IA', included: false },
      { text: 'Aulas ilimitadas', included: false },
      { text: 'Acesso antecipado a novos conteúdos', included: false },
      { text: 'Certificados de conclusão', included: false },
      { text: 'Suporte prioritário', included: false },
    ]
  },
  {
    id: 'basic', name: 'Básico', tagline: 'Para estudantes dedicados',
    price_monthly: { mzn: 99, aoa: 800, brl: 9.9, eur: 1.99 },
    price_yearly: { mzn: 830, aoa: 6720, brl: 83, eur: 16.7 },
    yearly_saving_pct: 30,
    color: '#2563eb', color_bg: '#eff6ff', icon: 'fa-book-open', popular: false,
    cta: 'Subscrever Básico', cta_style: 'primary',
    features: [
      { text: 'Aulas ilimitadas', included: true },
      { text: 'Todos os exercícios', included: true },
      { text: 'Biblioteca completa', included: true },
      { text: 'Chat de suporte prioritário', included: true },
      { text: 'Descarregar PDFs', included: true },
      { text: 'Chat com IA (30 msg/dia)', included: true },
      { text: 'Modo offline (app móvel)', included: false },
      { text: 'Acesso antecipado a novos conteúdos', included: false },
      { text: 'Certificados de conclusão', included: false },
      { text: 'Sessões ao vivo com professores', included: false },
    ]
  },
  {
    id: 'premium', name: 'Premium', tagline: 'A experiência completa',
    price_monthly: { mzn: 199, aoa: 1600, brl: 19.9, eur: 3.49 },
    price_yearly: { mzn: 1670, aoa: 13440, brl: 167, eur: 29.3 },
    yearly_saving_pct: 30,
    color: '#7c3aed', color_bg: '#f5f3ff', icon: 'fa-crown', popular: true,
    cta: 'Subscrever Premium', cta_style: 'premium',
    features: [
      { text: 'Aulas ilimitadas', included: true },
      { text: 'Exercícios ilimitados', included: true },
      { text: 'Biblioteca completa + exclusivos', included: true },
      { text: 'Chat de suporte prioritário', included: true },
      { text: 'Descarregar PDFs ilimitados', included: true },
      { text: 'Chat com IA ilimitado', included: true },
      { text: 'Modo offline (app móvel)', included: true },
      { text: 'Acesso antecipado a novos conteúdos', included: true },
      { text: 'Certificados de conclusão', included: true },
      { text: 'Sessões ao vivo com professores', included: true },
    ]
  }
]

export function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * Carrega todos os planos + funcionalidades da BD, ordenados por display_order.
 * Lança em caso de erro de BD — o chamador decide o fallback.
 */
export async function loadPlans(supabase: any): Promise<PlanRecord[]> {
  const [{ data: plans, error: plansErr }, { data: features, error: featErr }] = await Promise.all([
    supabase.from('plans').select('*').order('display_order', { ascending: true }),
    supabase.from('plan_features').select('plan_id, text, included, display_order').order('display_order', { ascending: true })
  ])
  if (plansErr) throw new Error(plansErr.message)
  if (featErr) throw new Error(featErr.message)

  const featuresByPlan: Record<string, PlanFeature[]> = {}
  for (const f of features || []) {
    if (!featuresByPlan[f.plan_id]) featuresByPlan[f.plan_id] = []
    featuresByPlan[f.plan_id].push({ text: f.text, included: f.included })
  }

  return (plans || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    price_monthly: { mzn: Number(p.price_monthly_mzn), aoa: Number(p.price_monthly_aoa), brl: Number(p.price_monthly_brl), eur: Number(p.price_monthly_eur) },
    price_yearly: { mzn: Number(p.price_yearly_mzn), aoa: Number(p.price_yearly_aoa), brl: Number(p.price_yearly_brl), eur: Number(p.price_yearly_eur) },
    yearly_saving_pct: p.yearly_saving_pct,
    color: p.color,
    color_bg: p.color_bg,
    icon: p.icon,
    popular: p.popular,
    cta: p.cta,
    cta_style: p.cta_style,
    features: featuresByPlan[p.id] || []
  }))
}
