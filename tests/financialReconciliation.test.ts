import { describe, it, expect } from 'vitest'
import { calculateVcpmEarnings } from '../src/services/vcpmEngine'
import { calculateBqeBonus } from '../src/services/bqeEngine'
import { mznToMicros, addMicros, microsToDecimalString } from '../src/utils/money'

// Cenário obrigatório (secção 46 do prompt de implementação):
// Professor A, 100.000 VQ-R, VCPM base 13.500 MZN, conclusão 82% → BQE 15% →
// bónus 2.025 MZN → total de consumo 15.525 MZN. Referral e outros earnings
// ficam fora deste fixture (não definidos explicitamente).
describe('Reconciliação financeira — Professor A (secção 46)', () => {
  it('100.000 VQ-R a 82% de conclusão reconcilia exactamente em 15.525,00 MZN', () => {
    const vcpm = calculateVcpmEarnings(100_000)
    expect(vcpm.totalAmountMzn).toBe('13500.00')

    const bqe = calculateBqeBonus(Number(vcpm.totalAmountMzn), 82)
    expect(bqe.bonusPct).toBe(15)
    expect(bqe.bonusAmountMzn).toBe('2025.00')

    const total = addMicros(mznToMicros(Number(vcpm.totalAmountMzn)), mznToMicros(Number(bqe.bonusAmountMzn)))
    expect(microsToDecimalString(total)).toBe('15525.00')
  })
})
