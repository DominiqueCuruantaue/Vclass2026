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

/**
 * Taxa marginal (MZN/1.000) do escalão em que a posição `count` cai — usada
 * pelas campanhas VQ-B do tipo PERCENTAGE_OF_VCPM (migration 036) para saber
 * "a que taxa o professor já está a ganhar", sem reabrir o cálculo
 * progressivo. `count` é normalmente o total combinado de VQ-R + VQ-B
 * NORMAL_VCPM do professor no período (a base sobre a qual a percentagem
 * incide), não a contagem da própria campanha.
 */
export function marginalVcpmRate(count: number, tiers: VcpmTier[] = VCPM_TIERS_V1): number {
  if (!Number.isFinite(count) || count < 0) throw new Error(`count inválido: ${count}`)
  const position = Math.max(count, 1) // posição 0 usa a taxa do 1º escalão
  for (const tier of tiers) {
    const tierMax = tier.maxVqR ?? Infinity
    if (position > tier.minVqR && position <= tierMax) return tier.rateMznPer1000
  }
  return tiers[tiers.length - 1].rateMznPer1000
}

/**
 * Ganhos de uma campanha VQ-B do tipo PERCENTAGE_OF_VCPM (Art. 6, secção 11
 * do prompt de implementação, PDR-09): `ratePct`% da taxa marginal do
 * escalão que o professor já atingiu (Art. 15-16), sobre `viewCount`
 * visualizações desta campanha.
 */
export function calculatePercentageOfVcpmEarnings(viewCount: number, ratePct: number, baselineCount: number, tiers: VcpmTier[] = VCPM_TIERS_V1): string {
  if (!Number.isFinite(viewCount) || viewCount < 0 || !Number.isInteger(viewCount)) throw new Error(`viewCount inválido: ${viewCount}`)
  if (!Number.isFinite(ratePct) || ratePct <= 0) throw new Error(`ratePct inválido: ${ratePct}`)
  const baseRate = marginalVcpmRate(baselineCount, tiers)
  const effectiveRateMicros = BigInt(Math.round(baseRate * 1_000_000 * ratePct)) / 100n
  const amountMicros = tierAmountMicros(BigInt(viewCount), effectiveRateMicros)
  return microsToDecimalString(amountMicros)
}

/**
 * Ganhos de uma campanha VQ-B do tipo FIXED_VCPM: `ratePer1000` MZN por
 * 1.000 visualizações, fixo, independente do escalão do professor.
 */
export function calculateFixedVcpmEarnings(viewCount: number, ratePer1000: number): string {
  if (!Number.isFinite(viewCount) || viewCount < 0 || !Number.isInteger(viewCount)) throw new Error(`viewCount inválido: ${viewCount}`)
  if (!Number.isFinite(ratePer1000) || ratePer1000 <= 0) throw new Error(`ratePer1000 inválido: ${ratePer1000}`)
  const rateMicros = BigInt(Math.round(ratePer1000 * 1_000_000))
  const amountMicros = tierAmountMicros(BigInt(viewCount), rateMicros)
  return microsToDecimalString(amountMicros)
}
