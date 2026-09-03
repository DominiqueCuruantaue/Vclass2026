// Referral Engine — Comissão de Referência/Aquisição (CRA, Art. 21-24)
//
// Decisões registadas no blueprint:
//   PDR-002: subscriptions.amount é tratado como já líquido (sem gateway de
//     pagamento real ainda) — limitação conhecida, documentada, a rever
//     quando existir integração real com IVA/taxas/reembolsos.
//   PDR-004: atribuição por primeiro clique — implementada aqui como
//     "primeira linha de atribuição nunca é substituída" (ver migration 031,
//     tabela referral_attributions com UNIQUE(student_id)), não como um log
//     de cliques — não existe infra de tracking de cliques neste projecto,
//     e o Art. 21-24 fala em "entrada pelo link ou código", que a captura no
//     registo (auth.ts) já satisfaz sem inventar uma peça de infraestrutura
//     que a política não exige explicitamente.

import { mznToMicros, microsToDecimalString, type Micros } from '../utils/money'

export const CRA_RATE_PCT = 15
export const CRA_ATTRIBUTION_WINDOW_DAYS = 30

/** 15% sobre a receita líquida elegível da primeira compra (Art. 21). */
export function calculateReferralCommission(netEligibleRevenueMzn: number, ratePct: number = CRA_RATE_PCT): string {
  if (!Number.isFinite(netEligibleRevenueMzn) || netEligibleRevenueMzn < 0) {
    throw new Error(`netEligibleRevenueMzn inválido: ${netEligibleRevenueMzn}`)
  }
  const revenueMicros: Micros = mznToMicros(netEligibleRevenueMzn)
  // commissionMicros = revenueMicros × ratePct ÷ 100, em BigInt exacto
  // (mesmo padrão de src/services/bqeEngine.ts::calculateBqeBonus).
  const commissionMicros = (revenueMicros * BigInt(Math.round(ratePct * 1_000_000))) / 100_000_000n
  return microsToDecimalString(commissionMicros)
}

export interface AttributionWindowCheck {
  eligible: boolean
  reason?: 'EXPIRED' | 'SELF_REFERRAL'
}

/**
 * @param attributedAt Momento em que o código de referência foi associado ao estudante (registo).
 * @param purchaseAt Momento da primeira compra elegível.
 */
export function checkAttributionWindow(attributedAt: Date, purchaseAt: Date, windowDays: number = CRA_ATTRIBUTION_WINDOW_DAYS): AttributionWindowCheck {
  const diffMs = purchaseAt.getTime() - attributedAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays < 0 || diffDays > windowDays) {
    return { eligible: false, reason: 'EXPIRED' }
  }
  return { eligible: true }
}

export function isSelfReferral(teacherUserId: string, referredStudentUserId: string): boolean {
  return teacherUserId === referredStudentUserId
}

/** Gera um código de referência curto e legível a partir do id do professor. Não é secreto — é público (vai em URLs). */
export function generateReferralCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem O/0/I/1 para evitar confusão visual
  let code = ''
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length]
  return code
}
