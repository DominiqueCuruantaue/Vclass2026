// BQE Engine — Bónus de Qualidade Educacional (Art. 18-19)
//
// Decisão registada (PDR-003, blueprint): "taxa de conclusão" para efeitos de
// BQE é a % das visualizações finalizadas de um professor que atingiram o
// limiar de consumo do Art. 7 — não a conclusão por exercícios que já existe
// em student_progress.status. "Consumos genuínos de todas as classificações
// VQ" (Art. 19) = VQ-R + VQ-P + VQ-B + VQ-NR contam como "atingiu o limiar";
// só VNQ (não atingiu o mínimo) conta como não-conclusão.
//
// O bónus incide só sobre a RCE (VCPM de VQ-R + VQ-B) — nunca sobre CRA, FEA
// ou RCEsp (Art. 18, secção 18 do prompt de implementação).

import { mznToMicros, microsToDecimalString, type Micros } from '../utils/money'

export interface BqeTier {
  minCompletionPct: number
  /** null = sem limite superior (último escalão) */
  maxCompletionPct: number | null
  bonusPct: number
}

export const BQE_TIERS_V1: BqeTier[] = [
  { minCompletionPct: 0, maxCompletionPct: 40, bonusPct: 0 },
  { minCompletionPct: 40, maxCompletionPct: 60, bonusPct: 5 },
  { minCompletionPct: 60, maxCompletionPct: 80, bonusPct: 10 },
  { minCompletionPct: 80, maxCompletionPct: null, bonusPct: 15 }
]

/**
 * Taxa de conclusão = visualizações que atingiram o limiar do Art. 7 ÷
 * total de visualizações finalizadas (inclui VNQ no denominador, exclui-o
 * do numerador — é precisamente o que distingue "atingiu o limiar" de não).
 */
export function calculateCompletionRatePct(thresholdReachedCount: number, totalFinalizedCount: number): number {
  if (totalFinalizedCount <= 0) return 0
  if (thresholdReachedCount < 0 || thresholdReachedCount > totalFinalizedCount) {
    throw new Error('thresholdReachedCount fora do intervalo [0, totalFinalizedCount]')
  }
  // Precisão de 2 casas — suficiente para decidir o escalão, sem floats na parte monetária.
  return Math.round((thresholdReachedCount / totalFinalizedCount) * 10000) / 100
}

export function resolveBqeTier(completionRatePct: number, tiers: BqeTier[] = BQE_TIERS_V1): BqeTier {
  for (const tier of tiers) {
    const max = tier.maxCompletionPct ?? Infinity
    if (completionRatePct >= tier.minCompletionPct && completionRatePct < max) return tier
  }
  // >= 100% (ou igual ao maxCompletionPct do último escalão nomeado) cai no último escalão.
  return tiers[tiers.length - 1]
}

export interface BqeCalculationResult {
  completionRatePct: number
  bonusPct: number
  rceAmountMzn: string
  bonusAmountMzn: string
}

/**
 * @param rceAmountMzn Remuneração por Consumo Educacional já calculada (VCPM de VQ-R+VQ-B) — base sobre a qual o bónus incide.
 */
export function calculateBqeBonus(rceAmountMzn: number, completionRatePct: number, tiers: BqeTier[] = BQE_TIERS_V1): BqeCalculationResult {
  const tier = resolveBqeTier(completionRatePct, tiers)
  const rceMicros: Micros = mznToMicros(rceAmountMzn)
  // bonusMicros = rceMicros × bonusPct ÷ 100, feito em BigInt para exactidão:
  // multiplicar por bonusPct escalado (×1e6) e dividir por (100×1e6) evita floats.
  const bonusMicros = (rceMicros * BigInt(Math.round(tier.bonusPct * 1_000_000))) / 100_000_000n

  return {
    completionRatePct,
    bonusPct: tier.bonusPct,
    rceAmountMzn: microsToDecimalString(rceMicros),
    bonusAmountMzn: microsToDecimalString(bonusMicros)
  }
}
