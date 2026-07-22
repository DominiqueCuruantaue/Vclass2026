// Tickets Routes — /api/tickets/*
// Endpoint público (com ou sem login) usado pelo formulário de suporte em
// help.html. Tickets ficam disponíveis para a equipa de suporte em
// /api/support/tickets (ver src/routes/support.ts).
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { getSupabase } from '../config/supabase'
import { optionalAuth } from '../middleware/auth'
import type { ApiResponse } from '../types'

const tickets = new Hono<{ Bindings: CloudflareBindings }>()

const VALID_CATEGORIES = ['account', 'video', 'exercises', 'content', 'progress', 'technical', 'billing', 'other']

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// ═══════════════════════════════════════════════════════════════
//  POST /api/tickets  —  Abrir um novo ticket de suporte
//  Usado por utilizadores autenticados (liga ao user_id real) e por
//  visitantes sem conta (guarda guest_name/guest_email).
// ═══════════════════════════════════════════════════════════════
tickets.post('/', optionalAuth, async (c) => {
  try {
    const body = await c.req.json() as {
      name?: string; email?: string; category?: string; message?: string
    }
    const user = c.get('user')
    const category = VALID_CATEGORIES.includes(body.category || '') ? body.category! : 'other'
    const message = (body.message || '').trim()

    if (!message) {
      return c.json<ApiResponse>({ success: false, error: 'Descreva o problema antes de enviar.' }, 400)
    }
    if (!user && (!body.name?.trim() || !body.email?.trim())) {
      return c.json<ApiResponse>({ success: false, error: 'Nome e email são obrigatórios.' }, 400)
    }

    const subject = message.length > 80 ? message.slice(0, 77) + '…' : message

    if (!isDatabaseConfigured(c.env)) {
      return c.json<ApiResponse>({
        success: true,
        data: { id: 'demo-' + Date.now() },
        message: 'Ticket recebido (modo demo — sem persistência).'
      }, 201)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        guest_name: user ? null : body.name!.trim(),
        guest_email: user ? null : body.email!.trim(),
        subject,
        message,
        category,
        sla_hours: 8
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Create ticket error:', error)
      return c.json<ApiResponse>({ success: false, error: error?.message || 'Falha ao criar ticket' }, 500)
    }

    return c.json<ApiResponse>({ success: true, data: { id: data.id }, message: 'Ticket enviado com sucesso!' }, 201)
  } catch (e: any) {
    console.error('Create ticket error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

export default tickets
