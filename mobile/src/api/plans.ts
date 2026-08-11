import { apiRequest } from './client'

export interface PlanData {
  id: 'free' | 'basic' | 'premium'
  name: string
  color: string
  icon?: string
  display_price_monthly: number
  display_price_yearly: number
  currency: string
  features?: string[]
}

export function fetchPlans(currency = 'mzn') {
  return apiRequest<{ plans: PlanData[]; payment_methods: any[]; faq: { q: string; a: string }[] }>(
    `/api/plans?currency=${currency}`,
    { auth: false }
  )
}

export function fetchMyPlan() {
  return apiRequest<{
    current_plan: { id: string; name: string; color: string; amount: number; status: string; expires_at: string | null }
    upgrade_available: boolean
    suggested_plan: string | null
  }>('/api/plans/my')
}

export function subscribeToPlan(payload: { plan_id: 'basic' | 'premium'; billing: 'monthly' | 'yearly'; currency: string; payment_method: string }) {
  return apiRequest('/api/plans/subscribe', { method: 'POST', body: payload })
}

export function cancelSubscription(reason?: string) {
  return apiRequest('/api/plans/cancel', { method: 'POST', body: { reason } })
}
