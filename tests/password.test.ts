import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import { hashPassword, verifyPassword, validatePassword, getHashRounds, needsRehash, SALT_ROUNDS } from '../src/utils/password'

describe('password — strength validation', () => {
  it('rejects short passwords', () => {
    expect(validatePassword('Abc1').valid).toBe(false)
    expect(validatePassword('Abcdef1').valid).toBe(false) // 7 chars
  })

  it('rejects passwords without uppercase', () => {
    const r = validatePassword('abcdef12')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/uppercase/i)
  })

  it('rejects passwords without lowercase', () => {
    const r = validatePassword('ABCDEF12')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/lowercase/i)
  })

  it('rejects passwords without digits', () => {
    const r = validatePassword('Abcdefgh')
    expect(r.valid).toBe(false)
    expect(r.message).toMatch(/number/i)
  })

  it('accepts a strong password', () => {
    expect(validatePassword('Abcdef12').valid).toBe(true)
    expect(validatePassword('Teste1234').valid).toBe(true)
  })
})

describe('password — bcrypt hashing', () => {
  it('hash and verify round-trip', async () => {
    const hash = await hashPassword('Teste1234')
    expect(hash).not.toBe('Teste1234')
    expect(hash).toMatch(/^\$2[aby]\$/) // bcrypt prefix
    expect(await verifyPassword('Teste1234', hash)).toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('Teste1234')
    expect(await verifyPassword('Teste12345', hash)).toBe(false)
    expect(await verifyPassword('teste1234', hash)).toBe(false)
  })

  it('produces different hashes for the same password (random salt)', async () => {
    const a = await hashPassword('Teste1234')
    const b = await hashPassword('Teste1234')
    expect(a).not.toBe(b)
  })

  it('hashes with the current SALT_ROUNDS cost', async () => {
    const hash = await hashPassword('Teste1234')
    expect(getHashRounds(hash)).toBe(SALT_ROUNDS)
  })
})

describe('password — progressive rehash', () => {
  it('getHashRounds extracts cost from a bcrypt hash', async () => {
    const h10 = await bcrypt.hash('x', 10)
    const h12 = await bcrypt.hash('x', 12)
    expect(getHashRounds(h10)).toBe(10)
    expect(getHashRounds(h12)).toBe(12)
  })

  it('getHashRounds returns null for non-bcrypt strings', () => {
    expect(getHashRounds('not-a-hash')).toBeNull()
    expect(getHashRounds('$argon2id$v=19$...')).toBeNull()
    expect(getHashRounds('')).toBeNull()
  })

  it('needsRehash flags hashes below SALT_ROUNDS', async () => {
    const old = await bcrypt.hash('x', SALT_ROUNDS - 2)
    expect(needsRehash(old)).toBe(true)
  })

  it('needsRehash flags hashes above SALT_ROUNDS (downgrade after a cost reduction)', async () => {
    const expensive = await bcrypt.hash('x', SALT_ROUNDS + 2)
    expect(needsRehash(expensive)).toBe(true)
  })

  it('needsRehash returns false for hashes at the current cost', async () => {
    const current = await bcrypt.hash('x', SALT_ROUNDS)
    expect(needsRehash(current)).toBe(false)
  })

  it('needsRehash returns true for invalid hashes (defensive)', () => {
    expect(needsRehash('not-a-hash')).toBe(true)
  })

  it('SALT_ROUNDS is at least 10 (equilíbrio entre brute-force offline e limite de CPU do Worker)', () => {
    expect(SALT_ROUNDS).toBeGreaterThanOrEqual(10)
  })
})
