// ============================================================
//  VClass — Rota de Biblioteca Digital
//
//  Público (aluno autenticado):
//    GET  /api/library            → lista materiais publicados
//    GET  /api/library/featured   → destaques
//    GET  /api/library/stats      → contagens
//    GET  /api/library/:id        → material + relacionados
//    POST /api/library/:id/download → incrementa downloads_count
//
//  Criador/Professor → src/routes/creator.ts (/api/creator/library/*)
//  Admin             → src/routes/admin.ts   (/api/admin/library/*)
// ============================================================
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'

const library = new Hono<{ Bindings: CloudflareBindings }>()

library.use('/*', authMiddleware)

// ── helpers ──────────────────────────────────────────────────

const SELECT_FIELDS = `
  id, title, description, author, category,
  subject_id, grade_id, curriculum_grade_id, file_url, file_size_kb, pages, cover_url,
  downloads_count, is_featured, status,
  created_by, approved_at, created_at,
  subjects:subject_id ( id, name, color ),
  grades:grade_id     ( id, name, level )
`

function buildFilters(query: any, filters: Record<string, string | number>) {
  let q = query
  if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category)
  if (filters.subject_id) q = q.eq('subject_id', filters.subject_id)
  if (filters.grade_id)   q = q.eq('grade_id', filters.grade_id)
  if (filters.search) {
    const s = String(filters.search).trim().replace(/[%,()]/g, '')
    if (s) q = q.or(`title.ilike.%${s}%,author.ilike.%${s}%,description.ilike.%${s}%`)
  }
  return q
}

// ── GET /api/library ─────────────────────────────────────────
library.get('/', async (c) => {
  const supabase = getSupabase(c.env)
  const category  = c.req.query('category') || 'all'
  const subject_id = c.req.query('subject_id') || ''
  const grade_id   = c.req.query('grade_id')   || ''
  const search     = c.req.query('q') || ''
  const page  = Math.max(1, parseInt(c.req.query('page')  || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')))
  const from  = (page - 1) * limit

  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  let query = supabase
    .from('library_items')
    .select(SELECT_FIELDS, { count: 'exact' })
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('downloads_count', { ascending: false })
    .range(from, from + limit - 1)

  query = buildFilters(query, { category, subject_id, grade_id, search })

  const { data, error, count } = await query
  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const total      = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return c.json<ApiResponse>({
    success: true,
    data: {
      books: data || [],
      pagination: { page, limit, total, totalPages }
    }
  })
})

// ── GET /api/library/featured ────────────────────────────────
library.get('/featured', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data, error } = await supabase
    .from('library_items')
    .select(SELECT_FIELDS)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('downloads_count', { ascending: false })
    .limit(6)

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  return c.json<ApiResponse>({ success: true, data: data || [] })
})

// ── GET /api/library/stats ───────────────────────────────────
library.get('/stats', async (c) => {
  const supabase = getSupabase(c.env)
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data, error } = await supabase
    .from('library_items')
    .select('category, downloads_count')
    .eq('status', 'published')

  if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)

  const items = data || []
  const stats = {
    byCategory: {
      ensino_geral:         items.filter(i => i.category === 'ensino_geral').length,
      apostilas:            items.filter(i => i.category === 'apostilas').length,
      artigos:              items.filter(i => i.category === 'artigos').length,
      educacao_financeira:  items.filter(i => i.category === 'educacao_financeira').length,
      empreendedorismo:     items.filter(i => i.category === 'empreendedorismo').length,
      obras_poemas:         items.filter(i => i.category === 'obras_poemas').length,
    },
    totalDownloads: items.reduce((s, i) => s + (i.downloads_count || 0), 0),
  }

  return c.json<ApiResponse>({ success: true, data: stats })
})

// ── GET /api/library/:id ─────────────────────────────────────
library.get('/:id', async (c) => {
  const supabase = getSupabase(c.env)
  const id = c.req.param('id')
  if (!supabase) return c.json<ApiResponse>({ success: false, error: 'BD não configurada' }, 503)

  const { data: item, error } = await supabase
    .from('library_items')
    .select(SELECT_FIELDS)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !item) return c.json<ApiResponse>({ success: false, error: 'Material não encontrado' }, 404)

  // Relacionados: mesma disciplina ou mesma classe, excluindo este
  const { data: related } = await supabase
    .from('library_items')
    .select(SELECT_FIELDS)
    .eq('status', 'published')
    .neq('id', id)
    .or(`subject_id.eq.${item.subject_id},grade_id.eq.${item.grade_id}`)
    .order('downloads_count', { ascending: false })
    .limit(4)

  return c.json<ApiResponse>({
    success: true,
    data: { ...item, related: related || [] }
  })
})

// ── POST /api/library/:id/download ───────────────────────────
// Incrementa contador sem bloquear a resposta do cliente
library.post('/:id/download', async (c) => {
  const supabase = getSupabase(c.env)
  const id = c.req.param('id')

  if (supabase) {
    supabase
      .rpc('increment_library_downloads', { item_id: id })
      .then(({ error }: any) => { if (error) console.warn('download count failed:', error.message) })
  }

  return c.json<ApiResponse>({ success: true, data: null })
})

export default library
