import { describe, it, expect } from 'vitest'
import { previousMonthPeriodMaputo } from '../src/services/settlementEngine'

describe('previousMonthPeriodMaputo', () => {
  it('returns the previous full calendar month in Africa/Maputo (UTC+2)', () => {
    // 2026-09-03T10:00:00Z → 12:00 em Maputo, ainda em Setembro → mês anterior = Agosto
    const ref = new Date('2026-09-03T10:00:00Z')
    expect(previousMonthPeriodMaputo(ref)).toEqual({ periodStart: '2026-08-01', periodEnd: '2026-09-01' })
  })

  it('rolls over the year boundary correctly', () => {
    const ref = new Date('2026-01-15T10:00:00Z')
    expect(previousMonthPeriodMaputo(ref)).toEqual({ periodStart: '2025-12-01', periodEnd: '2026-01-01' })
  })

  it('uses the Maputo-local date, not the UTC date, near midnight UTC', () => {
    // 2026-03-01T23:30:00Z é já 2026-03-02T01:30 em Maputo (UTC+2) — mês corrente
    // em Maputo é Março, logo o mês anterior tem de ser Fevereiro, não Janeiro.
    const ref = new Date('2026-03-01T23:30:00Z')
    expect(previousMonthPeriodMaputo(ref)).toEqual({ periodStart: '2026-02-01', periodEnd: '2026-03-01' })
  })
})
