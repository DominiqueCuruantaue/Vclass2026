import { describe, it, expect, beforeEach } from 'vitest'
import {
  storeRefreshToken,
  isRefreshTokenActive,
  revokeRefreshToken,
  revokeAllUserTokens
} from '../src/utils/refreshTokens'

/**
 * In-memory fake do cliente Supabase usado pelos helpers de refresh tokens.
 * Implementa apenas o subconjunto chamado: from('refresh_tokens')
 *   .insert / .update().eq().is() / .select().eq().single()
 */
function fakeSupabase() {
  type Row = {
    id: string
    user_id: string
    token_hash: string
    expires_at: string
    revoked_at: string | null
    user_agent?: string
    ip_address?: string
  }
  const rows: Row[] = []
  let idSeq = 1

  const builder = (filterRows: () => Row[]) => {
    let chained = filterRows()
    const api: any = {
      eq(col: string, val: any) {
        chained = chained.filter((r: any) => r[col] === val)
        return api
      },
      is(col: string, val: any) {
        chained = chained.filter((r: any) => r[col] === val)
        return api
      },
      async single() {
        if (chained.length === 0) return { data: null, error: { code: 'PGRST116' } }
        return { data: chained[0], error: null }
      }
    }
    return api
  }

  return {
    _rows: rows,
    from(table: string) {
      if (table !== 'refresh_tokens') throw new Error('unexpected table: ' + table)
      return {
        async insert(row: Omit<Row, 'id' | 'revoked_at'>) {
          rows.push({ id: String(idSeq++), revoked_at: null, ...row })
          return { error: null }
        },
        select(_cols?: string) {
          return builder(() => rows)
        },
        update(patch: Partial<Row>) {
          let target = rows
          const upd: any = {
            eq(col: string, val: any) {
              target = target.filter((r: any) => r[col] === val)
              return upd
            },
            is(col: string, val: any) {
              target = target.filter((r: any) => r[col] === val)
              return upd
            },
            then(resolve: any) {
              target.forEach(r => Object.assign(r, patch))
              resolve({ error: null })
            }
          }
          return upd
        }
      }
    }
  }
}

const TOKEN_A = 'header.payload-a.signature'
const TOKEN_B = 'header.payload-b.signature'

describe('refreshTokens helpers', () => {
  let db: ReturnType<typeof fakeSupabase>

  beforeEach(() => {
    db = fakeSupabase()
  })

  it('stores a token and recognises it as active', async () => {
    await storeRefreshToken(db as any, 'user-1', TOKEN_A, { user_agent: 'pwsh', ip_address: '1.2.3.4' })
    expect(db._rows.length).toBe(1)
    expect(await isRefreshTokenActive(db as any, TOKEN_A)).toBe(true)
  })

  it('does not store the JWT in plain text — apenas o hash SHA-256', async () => {
    await storeRefreshToken(db as any, 'user-1', TOKEN_A)
    const stored = db._rows[0]
    expect(stored.token_hash).not.toBe(TOKEN_A)
    expect(stored.token_hash).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex
  })

  it('revokeRefreshToken makes the token inactive', async () => {
    await storeRefreshToken(db as any, 'user-1', TOKEN_A)
    expect(await isRefreshTokenActive(db as any, TOKEN_A)).toBe(true)
    await revokeRefreshToken(db as any, TOKEN_A)
    expect(await isRefreshTokenActive(db as any, TOKEN_A)).toBe(false)
  })

  it('revokeAllUserTokens revokes every active token for that user', async () => {
    await storeRefreshToken(db as any, 'user-1', TOKEN_A)
    await storeRefreshToken(db as any, 'user-1', TOKEN_B)
    await storeRefreshToken(db as any, 'user-2', 'other.user.token')

    await revokeAllUserTokens(db as any, 'user-1')

    expect(await isRefreshTokenActive(db as any, TOKEN_A)).toBe(false)
    expect(await isRefreshTokenActive(db as any, TOKEN_B)).toBe(false)
    expect(await isRefreshTokenActive(db as any, 'other.user.token')).toBe(true)
  })

  it('unknown tokens are reported as inactive', async () => {
    expect(await isRefreshTokenActive(db as any, 'never.seen.token')).toBe(false)
  })

  it('demo mode (supabase = null) — store/revoke são no-ops, isActive devolve true', async () => {
    await expect(storeRefreshToken(null, 'u', TOKEN_A)).resolves.toBeUndefined()
    await expect(revokeRefreshToken(null, TOKEN_A)).resolves.toBeUndefined()
    await expect(revokeAllUserTokens(null, 'u')).resolves.toBeUndefined()
    expect(await isRefreshTokenActive(null, TOKEN_A)).toBe(true)
  })
})
