// Settlement mensal (Art. 30-31) — sequencia o ciclo ESTIMATED → VALIDATING
// → APPROVED por período, para todos os professores com actividade no
// período, em vez de depender de chamadas manuais por-professor a
// /earnings/estimate e /earnings/:id/approve.
//
// PDR-007 (blueprint): este projecto Cloudflare Pages não tem Cron Trigger
// nativo. Estas três fases são expostas como acções administrativas (ver
// src/routes/finance.ts, POST /earnings/close-period/:phase) e também por um
// endpoint interno autenticado por segredo partilhado (src/routes/
// settlementCron.ts), chamado por um agendador externo (GitHub Actions).
// CÁLCULO ≠ APROVAÇÃO ≠ PAGAMENTO continua válido: a fase "approve" ainda não
// marca nada como PAID — isso continua a ser execução de payout, Fase 8,
// não implementada.
import type { SupaClient } from '../config/supabase'
import { estimateTeacherEarnings, writeEstimatedLedgerEntries } from './earningsAggregation'
import { logEarningsAudit } from './earningsAudit'

export interface SettlementPhaseResult {
  phase: 'estimate' | 'validate' | 'approve'
  periodStart: string
  periodEnd: string
  teachersProcessed?: number
  rowsTransitioned?: number
  errors: { teacherId?: string; message: string }[]
}

/**
 * PDR-006: Africa/Maputo é UTC+2 sem horário de verão — usado como
 * referência fixa para os limiares "dia 1/7/10/15" do ciclo de fecho.
 * Devolve o mês civil anterior completo como [periodStart, periodEnd), no
 * mesmo formato meio-aberto que estimateTeacherEarnings já usa
 * (gte(periodStart) & lt(periodEnd)).
 */
export function previousMonthPeriodMaputo(refDate: Date = new Date()): { periodStart: string; periodEnd: string } {
  const maputo = new Date(refDate.getTime() + 2 * 3600 * 1000)
  const year = maputo.getUTCFullYear()
  const month = maputo.getUTCMonth() // 0-indexed, mês corrente em Maputo

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 1))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { periodStart: fmt(start), periodEnd: fmt(end) }
}

/**
 * Fase 1 (ex.: dia 1) — CALCULATION. Recalcula e grava RCE+BQE (ESTIMATED)
 * para todos os professores com qualified_views no período. Reaproveita
 * estimateTeacherEarnings/writeEstimatedLedgerEntries, que já são
 * idempotentes por (teacher_id, período) — seguro correr mais que uma vez.
 */
export async function runEstimatePhase(
  supabase: SupaClient,
  periodStart: string,
  periodEnd: string,
  actorId?: string
): Promise<SettlementPhaseResult> {
  const { data, error } = await supabase
    .from('qualified_views')
    .select('teacher_id')
    .gte('classified_at', periodStart)
    .lt('classified_at', periodEnd)

  if (error) throw new Error(`Falha ao listar professores do período: ${error.message}`)

  const teacherIds = Array.from(new Set((data || []).map((r: any) => r.teacher_id).filter(Boolean)))
  const errors: SettlementPhaseResult['errors'] = []

  for (const teacherId of teacherIds) {
    try {
      const estimate = await estimateTeacherEarnings(supabase, teacherId, periodStart, periodEnd)
      await writeEstimatedLedgerEntries(supabase, estimate)
    } catch (e: any) {
      errors.push({ teacherId, message: e.message })
    }
  }

  await logEarningsAudit(supabase, {
    actorId, action: 'SETTLEMENT_ESTIMATE', entityType: 'settlement_period',
    entityId: `${periodStart}_${periodEnd}`,
    after: { teachersProcessed: teacherIds.length, errors: errors.length }
  })

  return { phase: 'estimate', periodStart, periodEnd, teachersProcessed: teacherIds.length, errors }
}

async function transitionLedgerStatus(
  supabase: SupaClient,
  periodStart: string,
  periodEnd: string,
  from: 'ESTIMATED' | 'VALIDATING',
  to: 'VALIDATING' | 'APPROVED',
  timestampField: 'validated_at' | 'approved_at',
  action: string,
  actorId?: string
): Promise<SettlementPhaseResult> {
  const { data, error } = await supabase
    .from('teacher_earnings_ledger')
    .update({ status: to, [timestampField]: new Date().toISOString() })
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('status', from)
    .in('earning_type', ['VCPM', 'QUALITY_BONUS'])
    .select('id')

  if (error) throw new Error(`Falha ao transitar ${from} → ${to}: ${error.message}`)

  const rowsTransitioned = (data || []).length

  await logEarningsAudit(supabase, {
    actorId, action, entityType: 'settlement_period', entityId: `${periodStart}_${periodEnd}`,
    before: { status: from }, after: { status: to, rowsTransitioned }
  })

  return {
    phase: to === 'VALIDATING' ? 'validate' : 'approve',
    periodStart, periodEnd, rowsTransitioned, errors: []
  }
}

/** Fase 2 (ex.: dia 7) — fecha a janela de cálculo: ESTIMATED → VALIDATING. */
export function runValidatePhase(supabase: SupaClient, periodStart: string, periodEnd: string, actorId?: string) {
  return transitionLedgerStatus(supabase, periodStart, periodEnd, 'ESTIMATED', 'VALIDATING', 'validated_at', 'SETTLEMENT_VALIDATE', actorId)
}

/**
 * Fase 3 (ex.: dia 15) — VALIDATING → APPROVED. Ainda não verifica fraude
 * nem qualquer outro gate além do estado — ver blueprint gap #7 (fraude
 * mínima) para o que falta antes disto poder ser totalmente automático sem
 * revisão humana.
 */
export function runApprovePhase(supabase: SupaClient, periodStart: string, periodEnd: string, actorId?: string) {
  return transitionLedgerStatus(supabase, periodStart, periodEnd, 'VALIDATING', 'APPROVED', 'approved_at', 'SETTLEMENT_APPROVE', actorId)
}
