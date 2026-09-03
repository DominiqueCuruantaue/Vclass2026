// Audit log genérico do domínio Teacher Earnings (secção 34 do prompt de
// implementação) — cobre acções administrativas sensíveis (aprovações,
// ajustes, mudanças de estado de contrato, fecho de período). Nunca bloqueia
// a operação principal se a escrita do log falhar (best-effort, mas logado).
import type { SupaClient } from '../config/supabase'

export async function logEarningsAudit(supabase: SupaClient, entry: {
  actorId?: string; action: string; entityType: string; entityId?: string;
  before?: any; after?: any; reason?: string
}) {
  try {
    await supabase.from('earnings_audit_log').insert({
      actor_id: entry.actorId || null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      before_state: entry.before ?? null,
      after_state: entry.after ?? null,
      reason: entry.reason || null
    })
  } catch (e) {
    console.error('earnings audit log write failed:', e)
  }
}
