// Endpoint interno do ciclo de settlement mensal (Art. 30-31, PDR-007).
// Este projecto Cloudflare Pages não tem Cron Trigger nativo — um workflow
// do GitHub Actions (.github/workflows/teacher-earnings-settlement.yml)
// chama esta rota nos dias 1/7/15 (Africa/Maputo). Autenticado por segredo
// partilhado, não por JWT: não há utilizador nenhum por trás desta chamada,
// é máquina-a-máquina — reutilizar o esquema de auth de utilizador não fazia
// sentido para um cron sem sessão.
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { getSupabase } from '../config/supabase'
import { runEstimatePhase, runValidatePhase, runApprovePhase, previousMonthPeriodMaputo } from '../services/settlementEngine'
import type { ApiResponse } from '../types'

const settlementCron = new Hono<{ Bindings: CloudflareBindings }>()

const PHASES = {
  estimate: runEstimatePhase,
  validate: runValidatePhase,
  approve:  runApprovePhase
} as const

settlementCron.post('/:phase', async (c) => {
  const secret = c.env?.SETTLEMENT_CRON_SECRET
  if (!secret) {
    return c.json<ApiResponse>({ success: false, error: 'SETTLEMENT_CRON_SECRET não configurado' }, 503)
  }
  const provided = c.req.header('x-settlement-secret') || ''
  if (provided !== secret) {
    return c.json<ApiResponse>({ success: false, error: 'Não autorizado' }, 401)
  }

  const phase = c.req.param('phase') as keyof typeof PHASES
  const run = PHASES[phase]
  if (!run) {
    return c.json<ApiResponse>({ success: false, error: 'phase inválida (estimate|validate|approve)' }, 400)
  }

  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'Base de dados não configurada' }, 503)

  const body = await c.req.json().catch(() => ({})) as { periodStart?: string; periodEnd?: string }
  const { periodStart, periodEnd } = body.periodStart && body.periodEnd
    ? { periodStart: body.periodStart, periodEnd: body.periodEnd }
    : previousMonthPeriodMaputo()

  try {
    const result = await run(supabase, periodStart, periodEnd)
    return c.json<ApiResponse>({ success: true, data: result })
  } catch (e: any) {
    console.error(`settlement cron (${phase}) error:`, e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

export default settlementCron
