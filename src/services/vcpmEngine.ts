// VCPM Engine — Remuneração por Consumo Educacional (RCE)
// Política de Remuneração e Comissões dos Professores VClass V1.0, Art. 15-16.
//
// Cálculo estritamente progressivo por escalão: cada bloco de VQ-R paga à
// taxa do SEU escalão, nunca a taxa do escalão mais alto atingido aplicada
// ao volume inteiro (proibido pela política e pela secção 14 do prompt de
// implementação). Suporta fracções inferiores a 1.000 (secção 15).
//
// Sem floating point: toda a aritmética passa por src/utils/money.ts.

import { tierAmountMicros, microsToDecimalString, type Micros } from '../utils/money'

export interface VcpmTier {
  minVqR: number
  /** null = sem limite superior (último escalão) */
  maxVqR: number | null
  rateMznPer1000: number
}

export interface VcpmTierBreakdown {
  tier: VcpmTier
  vqRInTier: number
  amountMzn: string
}

export interface VcpmCalculationResult {
  totalVqR: number
  breakdown: VcpmTierBreakdown[]
  totalAmountMzn: string
}

/** Escalões V1.0 (Art. 15) — usar sempre via earnings_policy_config em produção; hardcoded aqui só como fallback/default para os testes e para o caso de a config ainda não ter sido carregada da BD. */
export const VCPM_TIERS_V1: VcpmTier[] = [
  { minVqR: 0, maxVqR: 10_000, rateMznPer1000: 100 },
  { minVqR: 10_000, maxVqR: 50_000, rateMznPer1000: 125 },
  { minVqR: 50_000, maxVqR: 100_000, rateMznPer1000: 150 },
  { minVqR: 100_000, maxVqR: null, rateMznPer1000: 175 }
]

/**
 * Calcula a remuneração por consumo (RCE/VCPM) para um total de VQ-R num
 * período, de forma progressiva por escalão e com suporte a fracções.
 *
 * Exemplos obrigatórios (Art. 16, secção 44 do prompt):
 *   100.000 VQ-R → 13.500 MZN (1.000 + 5.000 + 7.500)
 *   2.750 VQ-R   → 275 MZN
 */
export function calculateVcpmEarnings(vqRCount: number, tiers: VcpmTier[] = VCPM_TIERS_V1): VcpmCalculationResult {
  if (!Number.isFinite(vqRCount) || vqRCount < 0) {
    throw new Error(`vqRCount inválido: ${vqRCount}`)
  }
  const totalVqR = Math.floor(vqRCount) === vqRCount ? vqRCount : Math.trunc(vqRCount)
  // VQ-R é uma contagem de visualizações — deve ser inteiro. Fracções só
  // aparecem no CÁLCULO (÷1000), nunca na contagem de entrada.
  if (totalVqR !== vqRCount) {
    throw new Error('vqRCount deve ser um número inteiro de visualizações')
  }

  let total: Micros = 0n
  const breakdown: VcpmTierBreakdown[] = []

  for (const tier of tiers) {
    const tierMax = tier.maxVqR ?? Infinity
    const overlap = Math.max(0, Math.min(totalVqR, tierMax) - tier.minVqR)
    if (overlap <= 0) continue

    const rateMicros = BigInt(Math.round(tier.rateMznPer1000 * 1_000_000))
    const amountMicros = tierAmountMicros(BigInt(overlap), rateMicros)
    total += amountMicros

    breakdown.push({
      tier,
      vqRInTier: overlap,
      amountMzn: microsToDecimalString(amountMicros)
    })
  }

  return {
    totalVqR,
    breakdown,
    totalAmountMzn: microsToDecimalString(total)
  }
}
