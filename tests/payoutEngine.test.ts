import { describe, it, expect } from 'vitest'
import { determinePayout } from '../src/services/payoutEngine'

describe('payoutEngine — mínimo de 500 MZN e carry-forward (Art. 31)', () => {
  it('499 MZN não é pago — transita por inteiro', () => {
    const result = determinePayout(499)
    expect(result.willPay).toBe(false)
    expect(result.payableNowMzn).toBe('0.00')
    expect(result.carryForwardMzn).toBe('499.00')
  })

  it('500 MZN é pago na íntegra', () => {
    const result = determinePayout(500)
    expect(result.willPay).toBe(true)
    expect(result.payableNowMzn).toBe('500.00')
    expect(result.carryForwardMzn).toBe('0.00')
  })

  it('501 MZN é pago na íntegra', () => {
    const result = determinePayout(501)
    expect(result.willPay).toBe(true)
    expect(result.payableNowMzn).toBe('501.00')
  })

  it('carry-forward de ciclo anterior soma-se ao novo período antes da verificação', () => {
    // 300 aprovados agora + 250 transitados = 550 → paga tudo
    const result = determinePayout(300, 250)
    expect(result.willPay).toBe(true)
    expect(result.payableNowMzn).toBe('550.00')
  })

  it('mesmo com carry-forward, se o total continuar abaixo do mínimo, continua a transitar', () => {
    const result = determinePayout(100, 200)
    expect(result.willPay).toBe(false)
    expect(result.carryForwardMzn).toBe('300.00')
  })
})
