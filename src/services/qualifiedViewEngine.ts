// Qualified View Engine — classificação de visualizações (Art. 6-13)
//
// IMPORTANTE (limitação conhecida — ver blueprint, "Testes executados"):
// a decisão financeira real acontece atomicamente dentro da função Postgres
// `fn_record_watch_heartbeat` (database/migrations/030_teacher_earnings_
// foundation.sql), porque só lá é possível serializar concorrência com
// segurança num ambiente Cloudflare Workers + Supabase sobre HTTP.
//
// Este módulo é a MESMA lógica reescrita em TypeScript puro, usada para:
//   1. testes unitários rápidos e determinísticos (sem precisar de Postgres);
//   2. qualquer superfície de leitura que precise de replicar a regra sem
//      round-trip à BD (ex: "faltam-te 45s para esta view contar").
// As duas implementações devem manter-se em sincronia manual. Não é a
// autoridade financeira — a função SQL é.

export type ViewClassification = 'VQ-R' | 'VQ-P' | 'VQ-B' | 'VQ-NR' | 'VNQ'

export type ReasonCode =
  | 'REPEAT_LIMIT'
  | 'NON_MONETIZABLE_CONTENT'
  | 'INELIGIBLE_ACCESS'
  | 'PROGRAM_RESTRICTION'
  | 'OTHER'
  | null

export interface ConsumptionResult {
  qualifies: boolean
  thresholdRequiredSeconds: number
}

/**
 * Critério de Qualificação V1.0 (Art. 7):
 *   <= 5 min  → 60% da aula
 *   > 5, <=15 min → 40% da aula
 *   > 15 min  → 5 minutos efectivos (valor fixo, não percentual)
 */
export function classifyConsumption(lessonDurationSeconds: number, effectiveWatchedSeconds: number): ConsumptionResult {
  if (!Number.isFinite(lessonDurationSeconds) || lessonDurationSeconds <= 0) {
    return { qualifies: false, thresholdRequiredSeconds: 0 }
  }

  let thresholdRequiredSeconds: number
  if (lessonDurationSeconds <= 300) {
    thresholdRequiredSeconds = Math.ceil(lessonDurationSeconds * 0.6)
  } else if (lessonDurationSeconds <= 900) {
    thresholdRequiredSeconds = Math.ceil(lessonDurationSeconds * 0.4)
  } else {
    thresholdRequiredSeconds = 300
  }

  return {
    qualifies: effectiveWatchedSeconds >= thresholdRequiredSeconds,
    thresholdRequiredSeconds
  }
}

export interface FundingContext {
  /** Aula marcada como grátis/preview (lessons.is_free) */
  lessonIsFree: boolean
  /** Estudante tem subscrição activa e paga (ou fonte financeira elegível equivalente) */
  hasEligibleFunding: boolean
}

export interface RepeatContext {
  /** Nº de VQ remuneráveis (VQ-R + VQ-B) já registadas para este (estudante, aula) nos últimos 30 dias, ANTES desta visualização */
  remunerableCountInWindow: number
  /** Limite da política (Art. 13) — default 2 */
  limit?: number
}

export interface ViewClassificationResult {
  classification: ViewClassification
  reasonCode: ReasonCode
}

/**
 * Combina consumo + fonte financeira + limite de repetição na classificação
 * final de 5 vias (Art. 6). Não decide campanhas VQ-B (fase posterior do
 * blueprint) — toda visualização elegível e dentro do limite é VQ-R.
 */
export function resolveViewClassification(
  consumption: ConsumptionResult,
  funding: FundingContext,
  repeat: RepeatContext
): ViewClassificationResult {
  if (!consumption.qualifies) {
    return { classification: 'VNQ', reasonCode: null }
  }

  if (funding.lessonIsFree) {
    return { classification: 'VQ-P', reasonCode: null }
  }

  if (!funding.hasEligibleFunding) {
    return { classification: 'VQ-NR', reasonCode: 'INELIGIBLE_ACCESS' }
  }

  const limit = repeat.limit ?? 2
  if (repeat.remunerableCountInWindow >= limit) {
    return { classification: 'VQ-NR', reasonCode: 'REPEAT_LIMIT' }
  }

  return { classification: 'VQ-R', reasonCode: null }
}
