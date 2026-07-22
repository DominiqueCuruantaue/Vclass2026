// Resolução do plano actual do utilizador (Free / Basic / Premium).
import type { SupaClient } from '../config/supabase'
import { mockUsers } from '../middleware/database'

export type PlanId = 'free' | 'basic' | 'premium'

/**
 * Devolve o plano do utilizador, ou `null` se o papel não tiver plano aplicável
 * (professores, admin e restante staff não são "clientes" de `subscriptions` —
 * essa tabela é assignada a `student_id` — pelo que ficam sem restrição).
 *
 * Modo BD: lê a linha `active` mais recente em `subscriptions`. Sem linha, ou
 * já expirada (`expires_at` no passado, já que nada no código faz o flip
 * automático do `status` para 'expired'), conta como 'free'.
 * Modo demo (sem BD): usa o campo `plan` fixo nos mockUsers.
 */
export async function getUserPlan(
  supabase: SupaClient | null,
  userId: string,
  role: string
): Promise<PlanId | null> {
  if (role !== 'student') return null

  if (!supabase) {
    const mock = mockUsers.find((u) => u.id === userId) as any
    return (mock?.plan as PlanId) || 'free'
  }

  const { data } = await supabase
    .from('subscriptions')
    .select('plan_type, expires_at')
    .eq('student_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  const row = data?.[0]
  if (!row) return 'free'
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'free'
  return (row.plan_type as PlanId) || 'free'
}
