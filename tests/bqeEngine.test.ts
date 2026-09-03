import { describe, it, expect } from 'vitest'
import { calculateCompletionRatePct, resolveBqeTier, calculateBqeBonus, BQE_TIERS_V1 } from '../src/services/bqeEngine'

describe('bqeEngine — bónus de qualidade educacional (Art. 18-19)', () => {
  it('escalões: 39%→0%, 40%→5%, 59%→5%, 60%→10%, 79%→10%, 80%→15%', () => {
    expect(resolveBqeTier(39).bonusPct).toBe(0)
    expect(resolveBqeTier(40).bonusPct).toBe(5)
    expect(resolveBqeTier(59).bonusPct).toBe(5)
    expect(resolveBqeTier(60).bonusPct).toBe(10)
    expect(resolveBqeTier(79).bonusPct).toBe(10)
    expect(resolveBqeTier(80).bonusPct).toBe(15)
    expect(resolveBqeTier(100).bonusPct).toBe(15)
  })

  it('calculateCompletionRatePct: 82 em 100 → 82%', () => {
    expect(calculateCompletionRatePct(82, 100)).toBe(82)
  })

  it('calculateCompletionRatePct: 0 visualizações finalizadas → 0% (sem divisão por zero)', () => {
    expect(calculateCompletionRatePct(0, 0)).toBe(0)
  })

  it('calculateCompletionRatePct rejeita numerador fora do intervalo', () => {
    expect(() => calculateCompletionRatePct(11, 10)).toThrow()
    expect(() => calculateCompletionRatePct(-1, 10)).toThrow()
  })

  it('calculateBqeBonus: RCE de 13.500 MZN a 82% de conclusão → +15% = 2.025,00 MZN', () => {
    const result = calculateBqeBonus(13500, 82)
    expect(result.bonusPct).toBe(15)
    expect(result.bonusAmountMzn).toBe('2025.00')
    expect(result.rceAmountMzn).toBe('13500.00')
  })

  it('calculateBqeBonus: 0% de bónus não gera valor', () => {
    const result = calculateBqeBonus(1000, 20)
    expect(result.bonusAmountMzn).toBe('0.00')
  })

  it('usa os 4 escalões oficiais V1.0 por default', () => {
    expect(BQE_TIERS_V1).toEqual([
      { minCompletionPct: 0, maxCompletionPct: 40, bonusPct: 0 },
      { minCompletionPct: 40, maxCompletionPct: 60, bonusPct: 5 },
      { minCompletionPct: 60, maxCompletionPct: 80, bonusPct: 10 },
      { minCompletionPct: 80, maxCompletionPct: null, bonusPct: 15 }
    ])
  })
})
