import { describe, it, expect } from 'vitest'
import {
  calculateReferralCommission,
  checkAttributionWindow,
  isSelfReferral,
  generateReferralCode
} from '../src/services/referralEngine'

describe('referralEngine — CRA 15% sobre receita líquida elegível (Art. 21-24)', () => {
  it('15% de 1000 MZN = 150.00 MZN', () => {
    expect(calculateReferralCommission(1000)).toBe('150.00')
  })

  it('15% de 199 MZN (preço premium mensal real da plataforma) = 29.85 MZN', () => {
    expect(calculateReferralCommission(199)).toBe('29.85')
  })

  it('taxa é configurável (não hardcoded a 15 na função)', () => {
    expect(calculateReferralCommission(1000, 10)).toBe('100.00')
  })

  it('rejeita receita negativa', () => {
    expect(() => calculateReferralCommission(-1)).toThrow()
  })

  it('janela de atribuição: dentro de 30 dias é elegível', () => {
    const attributedAt = new Date('2026-01-01T00:00:00Z')
    const purchaseAt = new Date('2026-01-30T00:00:00Z')
    expect(checkAttributionWindow(attributedAt, purchaseAt).eligible).toBe(true)
  })

  it('janela de atribuição: 31 dias depois expira', () => {
    const attributedAt = new Date('2026-01-01T00:00:00Z')
    const purchaseAt = new Date('2026-02-02T00:00:00Z') // 32 dias
    const result = checkAttributionWindow(attributedAt, purchaseAt)
    expect(result.eligible).toBe(false)
    expect(result.reason).toBe('EXPIRED')
  })

  it('janela de atribuição: compra antes da atribuição (relógio inconsistente) não é elegível', () => {
    const attributedAt = new Date('2026-01-10T00:00:00Z')
    const purchaseAt = new Date('2026-01-01T00:00:00Z')
    expect(checkAttributionWindow(attributedAt, purchaseAt).eligible).toBe(false)
  })

  it('auto-referência (professor referindo-se a si mesmo) é detectada', () => {
    expect(isSelfReferral('user-1', 'user-1')).toBe(true)
    expect(isSelfReferral('user-1', 'user-2')).toBe(false)
  })

  it('gera códigos de referência com 8 caracteres, sem ambiguidade visual (sem O/0/I/1)', () => {
    const code = generateReferralCode()
    expect(code).toHaveLength(8)
    expect(code).not.toMatch(/[O0I1]/)
  })
})
