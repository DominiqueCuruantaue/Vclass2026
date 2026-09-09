// Earnings Aggregation — liga os motores puros (VCPM/BQE) aos dados reais em
// qualified_views, e (opcionalmente) grava o resultado no ledger imutável.
//
// Separação exigida pela política (Art. 28-31, secção 28 do prompt de
// implementação): CÁLCULO ≠ APROVAÇÃO ≠ EXECUÇÃO DO PAGAMENTO. Este módulo só
// faz CÁLCULO (e a escrita do lançamento ESTIMATED correspondente). A
// transição para VALIDATING/APPROVED/PAID é uma acção administrativa
// separada (ver src/routes/finance.ts), nunca automática a partir daqui.
//
// LIMITAÇÃO CONHECIDA: as queries abaixo nunca foram executadas contra uma
// instância Postgres/Supabase real nesta sessão de trabalho (sem ligação
// disponível). Revistas manualmente, mas por validar em staging.

import type { SupaClient } from '../config/supabase'
import { calculateVcpmEarnings, type VcpmTier, VCPM_TIERS_V1 } from './vcpmEngine'
import { calculateCompletionRatePct, calculateBqeBonus, type BqeTier, BQE_TIERS_V1 } from './bqeEngine'
import { addMicros, mznToMicros, microsToDecimalString } from '../utils/money'
import type { FraudMetricsInput } from './fraudDetection'

export interface TeacherEarningsEstimate {
  teacherId: string
  periodStart: string
  periodEnd: string
  vqRCount: number
  totalFinalizedViews: number
  thresholdReachedViews: number
  completionRatePct: number
  rceAmountMzn: string
  bqeBonusPct: number
  bqeAmountMzn: string
  totalConsumptionEarningsMzn: string
  vcpmBreakdown: ReturnType<typeof calculateVcpmEarnings>['breakdown']
  policyVersion: string
}

/**
 * Calcula (sem gravar nada) a estimativa de RCE + BQE de um professor num
 * período, a partir das linhas já classificadas em `qualified_views`.
 *
 * VQ-B (campanhas de bonificação) ainda não está implementado (fase
 * posterior do blueprint) — por agora só VQ-R conta para o VCPM.
 */
export async function estimateTeacherEarnings(
  supabase: SupaClient,
  teacherId: string,
  periodStart: string, // 'YYYY-MM-DD'
  periodEnd: string,
  tiers: { vcpm?: VcpmTier[]; bqe?: BqeTier[] } = {}
): Promise<TeacherEarningsEstimate> {
  const { data: rows, error } = await supabase
    .from('qualified_views')
    .select('classification')
    .eq('teacher_id', teacherId)
    .gte('classified_at', periodStart)
    .lt('classified_at', periodEnd)

  if (error) throw new Error(`Falha ao carregar qualified_views: ${error.message}`)

  const all = rows || []
  const vqRCount = all.filter((r: any) => r.classification === 'VQ-R').length
  // "Atingiu o limiar" = qualquer classificação excepto VNQ (que por definição não atingiu).
  const thresholdReachedViews = all.filter((r: any) => r.classification !== 'VNQ').length
  const totalFinalizedViews = all.length

  const vcpm = calculateVcpmEarnings(vqRCount, tiers.vcpm ?? VCPM_TIERS_V1)
  const completionRatePct = calculateCompletionRatePct(thresholdReachedViews, totalFinalizedViews)
  const bqe = calculateBqeBonus(Number(vcpm.totalAmountMzn), completionRatePct, tiers.bqe ?? BQE_TIERS_V1)

  const total = addMicros(mznToMicros(Number(vcpm.totalAmountMzn)), mznToMicros(Number(bqe.bonusAmountMzn)))

  return {
    teacherId,
    periodStart,
    periodEnd,
    vqRCount,
    totalFinalizedViews,
    thresholdReachedViews,
    completionRatePct,
    rceAmountMzn: vcpm.totalAmountMzn,
    bqeBonusPct: bqe.bonusPct,
    bqeAmountMzn: bqe.bonusAmountMzn,
    totalConsumptionEarningsMzn: microsToDecimalString(total),
    vcpmBreakdown: vcpm.breakdown,
    policyVersion: 'V1.0'
  }
}

/**
 * Grava a estimativa como dois lançamentos ESTIMATED no ledger (VCPM +
 * QUALITY_BONUS). Idempotente por (teacher_id, earning_type, period_start,
 * period_end): apaga estimativas anteriores do mesmo período antes de
 * inserir — só linhas ESTIMATED podem ser substituídas desta forma (nunca
 * APPROVED/PAID, que são imutáveis por definição do ledger).
 */
export async function writeEstimatedLedgerEntries(supabase: SupaClient, estimate: TeacherEarningsEstimate): Promise<void> {
  const { error: deleteErr } = await supabase
    .from('teacher_earnings_ledger')
    .delete()
    .eq('teacher_id', estimate.teacherId)
    .eq('period_start', estimate.periodStart)
    .eq('period_end', estimate.periodEnd)
    .eq('status', 'ESTIMATED')
    .in('earning_type', ['VCPM', 'QUALITY_BONUS'])

  if (deleteErr) throw new Error(`Falha ao limpar estimativas anteriores: ${deleteErr.message}`)

  const rows = [
    {
      teacher_id: estimate.teacherId,
      earning_type: 'VCPM',
      period_start: estimate.periodStart,
      period_end: estimate.periodEnd,
      gross_amount: estimate.rceAmountMzn,
      currency: 'MZN',
      status: 'ESTIMATED',
      policy_version: estimate.policyVersion,
      calculation_metadata: { vqRCount: estimate.vqRCount, breakdown: estimate.vcpmBreakdown }
    },
    {
      teacher_id: estimate.teacherId,
      earning_type: 'QUALITY_BONUS',
      period_start: estimate.periodStart,
      period_end: estimate.periodEnd,
      gross_amount: estimate.bqeAmountMzn,
      currency: 'MZN',
      status: 'ESTIMATED',
      policy_version: estimate.policyVersion,
      calculation_metadata: {
        completionRatePct: estimate.completionRatePct,
        bonusPct: estimate.bqeBonusPct,
        totalFinalizedViews: estimate.totalFinalizedViews,
        thresholdReachedViews: estimate.thresholdReachedViews
      }
    }
  ]

  const { error: insertErr } = await supabase.from('teacher_earnings_ledger').insert(rows)
  if (insertErr) throw new Error(`Falha ao gravar estimativas no ledger: ${insertErr.message}`)
}

/**
 * Reúne as métricas de concentração (IP/alunos) usadas pelo gate anti-fraude
 * (fraudDetection.ts) para um professor num período, a partir das mesmas
 * `qualified_views` (VQ-R/VQ-B) já usadas em estimateTeacherEarnings, mais o
 * IP registado em `video_watch_events` para cada sessão qualificada.
 */
export async function gatherFraudMetrics(
  supabase: SupaClient,
  teacherId: string,
  periodStart: string,
  periodEnd: string
): Promise<FraudMetricsInput> {
  const { data: qvRows, error } = await supabase
    .from('qualified_views')
    .select('student_id, session_token')
    .eq('teacher_id', teacherId)
    .in('classification', ['VQ-R', 'VQ-B'])
    .gte('classified_at', periodStart)
    .lt('classified_at', periodEnd)

  if (error) throw new Error(`Falha ao carregar qualified_views para métricas de fraude: ${error.message}`)

  const rows = qvRows || []
  const remunerableViews = rows.length
  const distinctStudents = new Set(rows.map((r: any) => r.student_id).filter(Boolean)).size

  const sessionTokens = Array.from(new Set(rows.map((r: any) => r.session_token).filter(Boolean)))
  const ips = new Set<string>()
  const CHUNK = 200 // .in() com listas muito grandes pode exceder o limite prático de URL do PostgREST
  for (let i = 0; i < sessionTokens.length; i += CHUNK) {
    const chunk = sessionTokens.slice(i, i + CHUNK)
    const { data: eventRows, error: evErr } = await supabase
      .from('video_watch_events')
      .select('ip_address')
      .in('session_token', chunk)
    if (evErr) throw new Error(`Falha ao carregar IPs para métricas de fraude: ${evErr.message}`)
    for (const r of eventRows || []) if ((r as any).ip_address) ips.add((r as any).ip_address)
  }

  return { remunerableViews, distinctStudents, distinctIps: ips.size }
}
