// Testes de integração (sem BD real) para earningsAggregation.ts e as três
// fases de settlementEngine.ts. Usa um cliente Supabase falso em memória que
// implementa só o subconjunto do query builder que estes módulos usam
// (select/eq/in/gte/lt/update/insert/rpc). fn_write_estimated_earnings é
// simulada com a mesma semântica da migration 037: apaga os ESTIMATED do
// (professor, período) e insere as linhas novas.
import { describe, it, expect, beforeEach } from 'vitest'
import { estimateTeacherEarnings, gatherFraudMetrics } from '../src/services/earningsAggregation'
import { runEstimatePhase, runValidatePhase, runApprovePhase } from '../src/services/settlementEngine'

type Row = Record<string, any>
type Tables = Record<string, Row[]>

function createFakeSupabase(tables: Tables) {
  let nextId = 1
  const rpcCalls: { fn: string; args: any }[] = []

  function query(table: string) {
    const filters: ((r: Row) => boolean)[] = []
    let op: 'select' | 'update' | 'insert' = 'select'
    let patch: Row = {}
    let inserted: Row[] = []

    const builder: any = {
      select: () => builder,
      eq: (col: string, v: any) => { filters.push(r => r[col] === v); return builder },
      in: (col: string, vs: any[]) => { filters.push(r => vs.includes(r[col])); return builder },
      gte: (col: string, v: any) => { filters.push(r => r[col] >= v); return builder },
      lt: (col: string, v: any) => { filters.push(r => r[col] < v); return builder },
      update: (p: Row) => { op = 'update'; patch = p; return builder },
      insert: (rows: Row | Row[]) => { op = 'insert'; inserted = Array.isArray(rows) ? rows : [rows]; return builder },
      then: (resolve: (v: any) => void) => {
        tables[table] ??= []
        if (op === 'insert') {
          tables[table].push(...inserted.map(r => ({ id: `row-${nextId++}`, ...r })))
          return resolve({ data: null, error: null })
        }
        const matched = tables[table].filter(r => filters.every(f => f(r)))
        if (op === 'update') matched.forEach(r => Object.assign(r, patch))
        resolve({ data: matched.map(r => ({ ...r })), error: null })
      }
    }
    return builder
  }

  const client: any = {
    from: query,
    rpc: async (fn: string, args: any) => {
      rpcCalls.push({ fn, args })
      if (fn !== 'fn_write_estimated_earnings') return { data: null, error: { message: `rpc desconhecida: ${fn}` } }
      tables.teacher_earnings_ledger = (tables.teacher_earnings_ledger ?? []).filter(r => !(
        r.teacher_id === args.p_teacher_id && r.period_start === args.p_period_start &&
        r.period_end === args.p_period_end && r.status === 'ESTIMATED'
      ))
      for (const row of args.p_rows) {
        tables.teacher_earnings_ledger.push({
          id: `ledger-${nextId++}`, teacher_id: args.p_teacher_id,
          period_start: args.p_period_start, period_end: args.p_period_end, status: 'ESTIMATED', ...row
        })
      }
      return { data: null, error: null }
    }
  }
  return { client, rpcCalls }
}

const P_START = '2026-08-01'
const P_END = '2026-09-01'
const IN_PERIOD = '2026-08-15T10:00:00Z'

function views(teacherId: string, classification: string, n: number, extra: (i: number) => Row = () => ({})): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    teacher_id: teacherId, classification, classified_at: IN_PERIOD,
    student_id: `${teacherId}-s${i}`, session_token: `${teacherId}-${classification}-${i}`, ...extra(i)
  }))
}

describe('estimateTeacherEarnings', () => {
  let tables: Tables

  beforeEach(() => {
    tables = {
      qualified_views: [
        ...views('t1', 'VQ-R', 1000),
        ...views('t1', 'VQ-B', 200, () => ({ campaign_id: 'c-pct' })),
        ...views('t1', 'VQ-B', 100, () => ({ campaign_id: 'c-fixed' })),
        ...views('t1', 'VQ-B', 10, () => ({ campaign_id: 'c-apagada' })),
        ...views('t1', 'VQ-NR', 50),
        ...views('t1', 'VNQ', 40),
        // Fora do período (antes e no limite exclusivo) — não podem contar
        { teacher_id: 't1', classification: 'VQ-R', classified_at: '2026-07-31T23:59:59Z' },
        { teacher_id: 't1', classification: 'VQ-R', classified_at: '2026-09-01T00:00:00Z' },
        // Outro professor — não pode contar
        ...views('t2', 'VQ-R', 500)
      ],
      vq_b_campaigns: [
        { id: 'c-pct', rate_type: 'PERCENTAGE_OF_VCPM', rate_value: 150 },
        { id: 'c-fixed', rate_type: 'FIXED_VCPM', rate_value: 200 }
      ]
    }
  })

  it('agrega RCE, VQ-B por campanha e BQE sobre RCE+VQ-B', async () => {
    const { client } = createFakeSupabase(tables)
    const e = await estimateTeacherEarnings(client, 't1', P_START, P_END)

    expect(e.vqRCount).toBe(1000)
    expect(e.vqBCount).toBe(310)
    expect(e.totalFinalizedViews).toBe(1400)
    expect(e.thresholdReachedViews).toBe(1360)
    // 1000 VQ-R × 100 MZN/1000 = 100
    expect(Number(e.rceAmountMzn)).toBe(100)
    // c-pct: 200 × (150% × 100)/1000 = 30 · c-fixed: 100 × 200/1000 = 20 · c-apagada ignorada
    expect(Number(e.bonifiedViewAmountMzn)).toBe(50)
    // 1360/1400 ≈ 97% → escalão 15%, sobre 100+50 = 22.5
    expect(e.bqeBonusPct).toBe(15)
    expect(Number(e.bqeAmountMzn)).toBe(22.5)
    expect(Number(e.totalConsumptionEarningsMzn)).toBe(172.5)
  })

  it('NORMAL_VCPM paga a taxa marginal do escalão actual do professor (100%)', async () => {
    tables.qualified_views = [
      ...views('t1', 'VQ-R', 12_000),
      ...views('t1', 'VQ-B', 1000, () => ({ campaign_id: 'c-normal' }))
    ]
    tables.vq_b_campaigns = [{ id: 'c-normal', rate_type: 'NORMAL_VCPM', rate_value: null }]
    const { client } = createFakeSupabase(tables)
    const e = await estimateTeacherEarnings(client, 't1', P_START, P_END)
    // 12.000 VQ-R já está no 2º escalão (125/1000) → 1000 VQ-B × 125/1000 = 125
    expect(Number(e.bonifiedViewAmountMzn)).toBe(125)
    // RCE: 10.000 × 100/1000 + 2.000 × 125/1000 = 1000 + 250
    expect(Number(e.rceAmountMzn)).toBe(1250)
  })

  it('professor sem visualizações no período dá tudo a zero', async () => {
    const { client } = createFakeSupabase(tables)
    const e = await estimateTeacherEarnings(client, 'sem-views', P_START, P_END)
    expect(e.totalFinalizedViews).toBe(0)
    expect(Number(e.totalConsumptionEarningsMzn)).toBe(0)
  })
})

describe('gatherFraudMetrics', () => {
  it('conta só VQ-R/VQ-B e resolve IPs distintos via video_watch_events', async () => {
    const tables: Tables = {
      qualified_views: [
        ...views('t1', 'VQ-R', 4, i => ({ student_id: `s${i % 2}` })),
        ...views('t1', 'VQ-B', 2, i => ({ student_id: 's9', campaign_id: 'c' })),
        ...views('t1', 'VNQ', 5)
      ],
      video_watch_events: [
        { session_token: 't1-VQ-R-0', ip_address: '1.1.1.1' },
        { session_token: 't1-VQ-R-1', ip_address: '1.1.1.1' },
        { session_token: 't1-VQ-R-2', ip_address: '2.2.2.2' },
        { session_token: 't1-VQ-B-0', ip_address: null },
        { session_token: 't1-VNQ-0', ip_address: '9.9.9.9' } // VNQ — não conta
      ]
    }
    const { client } = createFakeSupabase(tables)
    expect(await gatherFraudMetrics(client, 't1', P_START, P_END)).toEqual({
      remunerableViews: 6, distinctStudents: 3, distinctIps: 2
    })
  })
})

describe('settlement: estimate → validate → approve', () => {
  let tables: Tables

  beforeEach(() => {
    tables = {
      qualified_views: [
        // t-limpo: 20 views, 20 alunos e 20 IPs distintos
        ...views('t-limpo', 'VQ-R', 20),
        // t-suspeito: 20 views, todas do mesmo aluno e do mesmo IP
        ...views('t-suspeito', 'VQ-R', 20, () => ({ student_id: 'bot' }))
      ],
      video_watch_events: [
        ...Array.from({ length: 20 }, (_, i) => ({ session_token: `t-limpo-VQ-R-${i}`, ip_address: `10.0.0.${i}` })),
        ...Array.from({ length: 20 }, (_, i) => ({ session_token: `t-suspeito-VQ-R-${i}`, ip_address: '6.6.6.6' }))
      ],
      vq_b_campaigns: [],
      teacher_earnings_ledger: [
        // Lançamento já pago de outro período — nunca pode ser tocado
        { id: 'antigo', teacher_id: 't-limpo', period_start: '2026-07-01', period_end: P_START, status: 'PAID', earning_type: 'VCPM' }
      ],
      earnings_audit_log: []
    }
  })

  const ledgerFor = (teacherId: string) =>
    tables.teacher_earnings_ledger.filter(r => r.teacher_id === teacherId && r.period_start === P_START)

  it('estimate grava VCPM + QUALITY_BONUS ESTIMATED por professor e é idempotente', async () => {
    const { client, rpcCalls } = createFakeSupabase(tables)
    const r1 = await runEstimatePhase(client, P_START, P_END)
    expect(r1.teachersProcessed).toBe(2)
    expect(r1.errors).toEqual([])
    expect(rpcCalls.every(c => c.fn === 'fn_write_estimated_earnings')).toBe(true)

    const rows = ledgerFor('t-limpo')
    expect(rows.map(r => r.earning_type).sort()).toEqual(['QUALITY_BONUS', 'VCPM'])
    expect(rows.every(r => r.status === 'ESTIMATED')).toBe(true)
    // Sem VQ-B → nenhum lançamento BONIFIED_VIEW
    expect(rows.some(r => r.earning_type === 'BONIFIED_VIEW')).toBe(false)

    // Segunda corrida (ex.: retry do cron) não duplica
    await runEstimatePhase(client, P_START, P_END)
    expect(ledgerFor('t-limpo')).toHaveLength(2)
    expect(ledgerFor('t-suspeito')).toHaveLength(2)
    expect(tables.earnings_audit_log.filter(a => a.action === 'SETTLEMENT_ESTIMATE')).toHaveLength(2)
  })

  it('validate move só os ESTIMATED do período para VALIDATING', async () => {
    const { client } = createFakeSupabase(tables)
    await runEstimatePhase(client, P_START, P_END)
    const r = await runValidatePhase(client, P_START, P_END)
    expect(r.rowsTransitioned).toBe(4)
    expect([...ledgerFor('t-limpo'), ...ledgerFor('t-suspeito')].every(x => x.status === 'VALIDATING' && x.validated_at)).toBe(true)
    expect(tables.teacher_earnings_ledger.find(x => x.id === 'antigo')!.status).toBe('PAID')
  })

  it('approve aprova o professor limpo e retém o sinalizado em VALIDATING com FRAUD_FLAG', async () => {
    const { client } = createFakeSupabase(tables)
    await runEstimatePhase(client, P_START, P_END)
    await runValidatePhase(client, P_START, P_END)
    const r = await runApprovePhase(client, P_START, P_END)

    expect(r.errors).toEqual([])
    expect(r.teachersProcessed).toBe(2)
    expect(r.rowsTransitioned).toBe(2)
    expect(r.flaggedTeachers!.map(f => f.teacherId)).toEqual(['t-suspeito'])

    expect(ledgerFor('t-limpo').every(x => x.status === 'APPROVED' && x.approved_at)).toBe(true)
    expect(ledgerFor('t-suspeito').every(x => x.status === 'VALIDATING')).toBe(true)

    const flag = tables.earnings_audit_log.find(a => a.action === 'FRAUD_FLAG')!
    expect(flag.entity_id).toBe('t-suspeito')
    expect(flag.reason).toBeTruthy()

    // Repetir approve não volta a transitar nada já aprovado
    const again = await runApprovePhase(client, P_START, P_END)
    expect(again.rowsTransitioned).toBe(0)
    expect(again.flaggedTeachers!.map(f => f.teacherId)).toEqual(['t-suspeito'])
  })

  it('validate antes de estimate não transita nada', async () => {
    const { client } = createFakeSupabase(tables)
    const r = await runValidatePhase(client, P_START, P_END)
    expect(r.rowsTransitioned).toBe(0)
  })
})
