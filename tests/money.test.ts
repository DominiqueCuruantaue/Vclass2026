import { describe, it, expect } from 'vitest'
import { mznToMicros, microsToDecimalString, tierAmountMicros, addMicros } from '../src/utils/money'

describe('money — aritmética monetária sem floating point (PDR-005)', () => {
  it('mznToMicros/microsToDecimalString fazem round-trip exacto para valores inteiros', () => {
    expect(microsToDecimalString(mznToMicros(13500))).toBe('13500.00')
    expect(microsToDecimalString(mznToMicros(275))).toBe('275.00')
    expect(microsToDecimalString(mznToMicros(0))).toBe('0.00')
  })

  it('tierAmountMicros(2750, 100 MZN/1000) = 275.00 exacto', () => {
    const rateMicros = mznToMicros(100)
    const amount = tierAmountMicros(2750n, rateMicros)
    expect(microsToDecimalString(amount)).toBe('275.00')
  })

  it('arredondamento round-half-up a 2 casas decimais', () => {
    // 1.005 → 1.01 (half-up), 1.004 → 1.00, 1.006 → 1.01
    expect(microsToDecimalString(mznToMicros(1.005))).toBe('1.01')
    expect(microsToDecimalString(mznToMicros(1.004))).toBe('1.00')
    expect(microsToDecimalString(mznToMicros(1.006))).toBe('1.01')
  })

  it('soma exacta de várias parcelas sem drift', () => {
    let total = 0n
    for (let i = 0; i < 1000; i++) {
      total = addMicros(total, mznToMicros(0.01))
    }
    // 1000 × 0.01 MZN deve ser exactamente 10.00, não 9.999999999998 como em float
    expect(microsToDecimalString(total)).toBe('10.00')
  })

  it('valores negativos (para lançamentos de ajuste/estorno) formatam correctamente', () => {
    expect(microsToDecimalString(mznToMicros(-50))).toBe('-50.00')
  })
})
