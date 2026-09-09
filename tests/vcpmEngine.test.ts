import { describe, it, expect } from 'vitest'
import { calculateVcpmEarnings, marginalVcpmRate, calculatePercentageOfVcpmEarnings, calculateFixedVcpmEarnings, VCPM_TIERS_V1 } from '../src/services/vcpmEngine'

describe('vcpmEngine — cálculo progressivo por escalão (Art. 15-16)', () => {
  const cases: [number, string][] = [
    [1_000, '100.00'],
    [2_750, '275.00'],
    [10_000, '1000.00'],
    [20_000, '2250.00'],
    [50_000, '6000.00'],
    [100_000, '13500.00'],
    [200_000, '31000.00'],
    [500_000, '83500.00']
  ]

  for (const [vqR, expected] of cases) {
    it(`${vqR} VQ-R → ${expected} MZN`, () => {
      const result = calculateVcpmEarnings(vqR)
      expect(result.totalAmountMzn).toBe(expected)
    })
  }

  it('100.000 VQ-R reparte exactamente em 1.000 + 5.000 + 7.500 (exemplo obrigatório Art. 16)', () => {
    const result = calculateVcpmEarnings(100_000)
    expect(result.breakdown).toHaveLength(3)
    expect(result.breakdown[0]).toMatchObject({ vqRInTier: 10_000, amountMzn: '1000.00' })
    expect(result.breakdown[1]).toMatchObject({ vqRInTier: 40_000, amountMzn: '5000.00' })
    expect(result.breakdown[2]).toMatchObject({ vqRInTier: 50_000, amountMzn: '7500.00' })
  })

  it('nunca aplica a taxa do último escalão atingido a todo o volume', () => {
    // Se fosse (errado) 100.000 × 150/1000 = 15.000, isto falharia.
    const result = calculateVcpmEarnings(100_000)
    expect(result.totalAmountMzn).not.toBe('15000.00')
  })

  it('0 VQ-R → 0.00 MZN, sem escalões no breakdown', () => {
    const result = calculateVcpmEarnings(0)
    expect(result.totalAmountMzn).toBe('0.00')
    expect(result.breakdown).toHaveLength(0)
  })

  it('rejeita contagens não-inteiras', () => {
    expect(() => calculateVcpmEarnings(10.5)).toThrow()
  })

  it('rejeita contagens negativas', () => {
    expect(() => calculateVcpmEarnings(-1)).toThrow()
  })

  it('escalão acima de 100.000 usa 175 MZN/1000 sem limite superior', () => {
    const result = calculateVcpmEarnings(150_000)
    const lastTier = result.breakdown[result.breakdown.length - 1]
    expect(lastTier.tier.maxVqR).toBeNull()
    expect(lastTier.vqRInTier).toBe(50_000)
  })

  it('usa os 4 escalões oficiais V1.0 por default', () => {
    expect(VCPM_TIERS_V1).toEqual([
      { minVqR: 0, maxVqR: 10_000, rateMznPer1000: 100 },
      { minVqR: 10_000, maxVqR: 50_000, rateMznPer1000: 125 },
      { minVqR: 50_000, maxVqR: 100_000, rateMznPer1000: 150 },
      { minVqR: 100_000, maxVqR: null, rateMznPer1000: 175 }
    ])
  })
})

describe('marginalVcpmRate — taxa do escalão em que uma posição cai (campanhas VQ-B)', () => {
  it('posição 0 usa a taxa do 1º escalão', () => {
    expect(marginalVcpmRate(0)).toBe(100)
  })
  it('posição exactamente na fronteira de um escalão pertence ao escalão que termina aí', () => {
    expect(marginalVcpmRate(10_000)).toBe(100)
    expect(marginalVcpmRate(10_001)).toBe(125)
  })
  it('posição acima de 100.000 usa o último escalão (175)', () => {
    expect(marginalVcpmRate(250_000)).toBe(175)
  })
})

describe('calculatePercentageOfVcpmEarnings — campanhas VQ-B PERCENTAGE_OF_VCPM / NORMAL_VCPM', () => {
  it('150% da taxa marginal do 1º escalão sobre 1.000 visualizações', () => {
    // baseline 5.000 -> tier 1 (100 MZN/1000) -> 150% = 150 MZN/1000 -> 1.000 views = 150.00
    expect(calculatePercentageOfVcpmEarnings(1_000, 150, 5_000)).toBe('150.00')
  })
  it('100% (equivalente a NORMAL_VCPM) paga exactamente a taxa marginal, sem boost', () => {
    expect(calculatePercentageOfVcpmEarnings(1_000, 100, 5_000)).toBe('100.00')
  })
  it('usa a taxa do escalão mais alto quando o baseline já passou de 100.000', () => {
    expect(calculatePercentageOfVcpmEarnings(1_000, 200, 150_000)).toBe('350.00') // 175 * 2 = 350/1000
  })
  it('rejeita viewCount negativo ou fraccionário', () => {
    expect(() => calculatePercentageOfVcpmEarnings(-1, 100, 0)).toThrow()
    expect(() => calculatePercentageOfVcpmEarnings(1.5, 100, 0)).toThrow()
  })
  it('rejeita ratePct <= 0', () => {
    expect(() => calculatePercentageOfVcpmEarnings(100, 0, 0)).toThrow()
  })
})

describe('calculateFixedVcpmEarnings — campanhas VQ-B FIXED_VCPM', () => {
  it('paga a taxa fixa por 1.000 visualizações, independente do escalão', () => {
    expect(calculateFixedVcpmEarnings(2_000, 80)).toBe('160.00')
  })
  it('suporta fracções abaixo de 1.000 visualizações', () => {
    expect(calculateFixedVcpmEarnings(500, 80)).toBe('40.00')
  })
  it('rejeita ratePer1000 <= 0', () => {
    expect(() => calculateFixedVcpmEarnings(100, 0)).toThrow()
  })
})
