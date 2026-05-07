// Admin Dashboard Routes — VClass
// Apenas utilizadores com role 'admin' têm acesso
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import type { ApiResponse } from '../types'

const admin = new Hono<{ Bindings: CloudflareBindings }>()

// ── Auth guard: apenas admins ─────────────────────────────────────────────────
admin.use('*', authMiddleware)
admin.use('*', requireAdmin)

function isDatabaseConfigured(env?: any): boolean {
  return !!(env?.SUPABASE_URL || process.env.SUPABASE_URL) &&
         !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
}

// ─── Mock data ────────────────────────────────────────────────────────────────
function getMockAdminData() {
  const now = Date.now()
  return {
    stats: {
      total_users:        1_247,
      active_users_today:   89,
      new_users_week:       43,
      total_students:     1_190,
      total_teachers:        52,
      total_admins:           5,
      total_lessons:        120,
      published_lessons:    108,
      draft_lessons:         12,
      total_views:       34_820,
      views_today:          312,
      total_exercises_done: 9_840,
      avg_score:           76.4,
      total_countries:        5,
      active_countries:       3,
    },
    chart_week: {
      labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
      new_users:    [6, 9, 5, 12, 8, 14, 11],
      lesson_views: [42, 58, 35, 71, 49, 88, 69],
      exercises:    [18, 27, 14, 34, 22, 41, 31],
    },
    chart_month: {
      labels: ['Sem 1','Sem 2','Sem 3','Sem 4'],
      new_users:    [28, 35, 22, 40],
      lesson_views: [220, 310, 195, 370],
      exercises:    [95, 132, 88, 160],
    },
    countries: [
      { name: 'Moçambique', code: 'mz', flag: '🇲🇿', students: 620, lessons: 120, active: true },
      { name: 'Angola',     code: 'ao', flag: '🇦🇴', students: 310, lessons: 120, active: true },
      { name: 'Portugal',   code: 'pt', flag: '🇵🇹', students: 185, lessons:  60, active: true },
      { name: 'Brasil',     code: 'br', flag: '🇧🇷', students:  58, lessons:  30, active: false },
      { name: 'Cabo Verde', code: 'cv', flag: '🇨🇻', students:  17, lessons:  10, active: false },
    ],
    recent_users: [
      { id:'u1', name:'Ana Machava',    email:'ana@vclass.mz',   role:'student', country:'mz', joined: new Date(now - 1*3600000).toISOString(),  active:true  },
      { id:'u2', name:'Carlos Sitoe',   email:'csitoe@vclass.mz',role:'teacher', country:'mz', joined: new Date(now - 3*3600000).toISOString(),  active:true  },
      { id:'u3', name:'Beatriz Santos', email:'bsantos@vclass.ao',role:'student',country:'ao', joined: new Date(now - 5*3600000).toISOString(),  active:true  },
      { id:'u4', name:'Fábio Nuvunga',  email:'fnuvu@vclass.mz', role:'student', country:'mz', joined: new Date(now - 8*3600000).toISOString(),  active:false },
      { id:'u5', name:'Lénia Bila',     email:'lbila@vclass.mz', role:'student', country:'mz', joined: new Date(now - 12*3600000).toISOString(), active:true  },
      { id:'u6', name:'Tomás Guambe',   email:'tguambe@vclass.mz',role:'teacher',country:'mz',joined: new Date(now - 24*3600000).toISOString(), active:true  },
      { id:'u7', name:'Isadora Chaves', email:'ichaves@vclass.ao',role:'student',country:'ao', joined: new Date(now - 30*3600000).toISOString(), active:true  },
      { id:'u8', name:'Rui Mondlane',   email:'rmondl@vclass.mz', role:'student',country:'mz', joined: new Date(now - 36*3600000).toISOString(), active:false },
    ],
    recent_lessons: [
      { id:'l1', title:'Funções Quadráticas',      subject:'Matemática', teacher:'Carlos Sitoe', status:'published', views:284, created: new Date(now - 2*86400000).toISOString()  },
      { id:'l2', title:'Leis de Newton',            subject:'Física',     teacher:'Tomás Guambe', status:'published', views:197, created: new Date(now - 3*86400000).toISOString()  },
      { id:'l3', title:'Tabela Periódica',           subject:'Química',    teacher:'Carlos Sitoe', status:'draft',    views:  0, created: new Date(now - 1*86400000).toISOString()  },
      { id:'l4', title:'Verbos Irregulares',         subject:'Português',  teacher:'Lénia Bila',   status:'published', views:143, created: new Date(now - 4*86400000).toISOString()  },
      { id:'l5', title:'Genética e Hereditariedade', subject:'Biologia',   teacher:'Tomás Guambe', status:'published', views: 92, created: new Date(now - 5*86400000).toISOString()  },
    ],
    system_alerts: [
      { level:'info',    msg:'Sistema a funcionar normalmente',        time: new Date(now - 300000).toISOString() },
      { level:'warning', msg:'3 lições aguardam aprovação de conteúdo', time: new Date(now - 3600000).toISOString() },
      { level:'info',    msg:'Backup automático concluído com sucesso', time: new Date(now - 7200000).toISOString() },
      { level:'success', msg:'43 novos utilizadores esta semana',       time: new Date(now - 86400000).toISOString() },
    ],
    top_lessons: [
      { title:'Equações do 2º Grau',   subject:'Matemática', views:412, score:82 },
      { title:'Leis de Newton',         subject:'Física',     views:388, score:78 },
      { title:'Tabela Periódica',       subject:'Química',    views:341, score:74 },
      { title:'Verbos Irregulares',     subject:'Português',  views:295, score:80 },
      { title:'Cinemática',             subject:'Física',     views:267, score:76 },
    ],
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/dashboard
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/dashboard', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      return c.json<ApiResponse>({ success: true, data: getMockAdminData(), message: 'demo' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB error' }, 500)

    // Parallel queries
    const [usersRes, lessonsRes, progressRes] = await Promise.all([
      supabase.from('users').select('id, role, country_id, created_at, is_active'),
      supabase.from('lessons').select('id, status, views_count, created_at'),
      supabase.from('student_progress').select('id, status, points_earned, updated_at'),
    ])

    const users    = usersRes.data    || []
    const lessons  = lessonsRes.data  || []
    const progress = progressRes.data || []

    const today    = new Date(); today.setHours(0,0,0,0)
    const weekAgo  = new Date(Date.now() - 7*86400000)

    const stats = {
      total_users:         users.length,
      active_users_today:  users.filter((u:any) => u.is_active && new Date(u.created_at) >= today).length,
      new_users_week:      users.filter((u:any) => new Date(u.created_at) >= weekAgo).length,
      total_students:      users.filter((u:any) => u.role === 'student').length,
      total_teachers:      users.filter((u:any) => u.role === 'teacher').length,
      total_admins:        users.filter((u:any) => u.role === 'admin').length,
      total_lessons:       lessons.length,
      published_lessons:   lessons.filter((l:any) => l.status === 'published').length,
      draft_lessons:       lessons.filter((l:any) => l.status === 'draft').length,
      total_views:         lessons.reduce((s:number, l:any) => s + (l.views_count||0), 0),
      views_today:         0,
      total_exercises_done:progress.length,
      avg_score:           0,
      total_countries:     5,
      active_countries:    3,
    }

    return c.json<ApiResponse>({ success: true, data: { stats, ...getMockAdminData() } })
  } catch (e: any) {
    console.error('Admin dashboard error:', e)
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/users?page=1&limit=20&role=&search=
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/users', async (c) => {
  try {
    const page   = parseInt(c.req.query('page')  || '1')
    const limit  = parseInt(c.req.query('limit') || '20')
    const role   = c.req.query('role')   || ''
    const search = c.req.query('search') || ''

    if (!isDatabaseConfigured(c.env)) {
      const mock = getMockAdminData()
      let users = mock.recent_users as any[]
      if (role)   users = users.filter(u => u.role === role)
      if (search) users = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
      return c.json({ success: true, data: users, pagination: { page, limit, total: users.length, totalPages: 1 } })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, country_id, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit - 1)

    if (role)   query = query.eq('role', role)
    if (search) query = query.ilike('full_name', `%${search}%`)

    const { data, count, error } = await query
    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data: data || [], pagination: { page, limit, total: count||0, totalPages: Math.ceil((count||0)/limit) } })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/users/:id — toggle active / change role
// ═══════════════════════════════════════════════════════════════════════════════
admin.patch('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as { is_active?: boolean; role?: string }

    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, data: { id, ...body }, message: 'Demo: alteração simulada' })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const updates: any = { updated_at: new Date().toISOString() }
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.role)                    updates.role      = body.role

    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single()
    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/content — lessons list with teacher info
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/content', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, data: getMockAdminData().recent_lessons })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const { data, error } = await supabase
      .from('lessons')
      .select('id, title, status, views_count, created_at, created_by, chapter:chapters(title, grade_subject:grade_subjects(subject:subjects(name)))')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return c.json({ success: false, error: error.message }, 500)
    return c.json({ success: true, data: data || [] })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/content/:id — publish / archive / delete lesson
// ═══════════════════════════════════════════════════════════════════════════════
admin.patch('/content/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json() as { status: string }

    if (!isDatabaseConfigured(c.env)) {
      return c.json({ success: true, message: `Demo: lição ${id} → ${status}` })
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json({ success: false, error: 'DB error' }, 500)

    const { data, error } = await supabase.from('lessons').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return c.json({ success: false, error: error.message }, 500)

    return c.json({ success: true, data })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// CURRICULUM MANAGEMENT — Admin gere disciplinas e vínculos com classes
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/curriculum — devolve subjects, grades e grade_subjects
admin.get('/curriculum', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const [subjectsRes, gradesRes, gsRes] = await Promise.all([
      supabase.from('subjects').select('id, name, description, color, icon_url, created_at').order('name'),
      supabase.from('grades').select('id, name, level, display_order, education_system_id, education_systems(id, name, country_id, countries(id, name, flag))').order('display_order'),
      supabase.from('grade_subjects').select('id, grade_id, subject_id, is_mandatory, workload_hours'),
    ])

    if (subjectsRes.error) return c.json<ApiResponse>({ success: false, error: subjectsRes.error.message }, 500)

    return c.json<ApiResponse>({
      success: true,
      data: {
        subjects:        subjectsRes.data || [],
        grades:          gradesRes.data   || [],
        grade_subjects:  gsRes.data       || [],
      },
    })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// POST /api/admin/curriculum/subjects — criar nova disciplina
admin.post('/curriculum/subjects', async (c) => {
  try {
    const body = await c.req.json() as { name: string; description?: string; color?: string; icon_url?: string }
    if (!body.name || !body.name.trim()) {
      return c.json<ApiResponse>({ success: false, error: 'Nome da disciplina é obrigatório' }, 400)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name:        body.name.trim(),
        description: body.description?.trim() || null,
        color:       body.color || '#3B82F6',
        icon_url:    body.icon_url || null,
      })
      .select()
      .single()

    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// PATCH /api/admin/curriculum/subjects/:id — editar disciplina
admin.patch('/curriculum/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json() as { name?: string; description?: string; color?: string; icon_url?: string }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const updates: any = {}
    if (body.name !== undefined)        updates.name        = body.name.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.color !== undefined)       updates.color       = body.color
    if (body.icon_url !== undefined)    updates.icon_url    = body.icon_url || null

    const { data, error } = await supabase.from('subjects').update(updates).eq('id', id).select().single()
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// DELETE /api/admin/curriculum/subjects/:id — apagar disciplina (cascade em grade_subjects e chapters)
admin.delete('/curriculum/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// POST /api/admin/curriculum/grade-subjects — vincular disciplina a uma classe
admin.post('/curriculum/grade-subjects', async (c) => {
  try {
    const body = await c.req.json() as { grade_id: string; subject_id: string; is_mandatory?: boolean; workload_hours?: number }
    if (!body.grade_id || !body.subject_id) {
      return c.json<ApiResponse>({ success: false, error: 'grade_id e subject_id são obrigatórios' }, 400)
    }

    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { data, error } = await supabase
      .from('grade_subjects')
      .insert({
        grade_id:       body.grade_id,
        subject_id:     body.subject_id,
        is_mandatory:   body.is_mandatory ?? true,
        workload_hours: body.workload_hours ?? null,
      })
      .select()
      .single()

    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true, data })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// DELETE /api/admin/curriculum/grade-subjects/:id — desvincular
admin.delete('/curriculum/grade-subjects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const supabase = getSupabase(c.env)
    if (!supabase) return c.json<ApiResponse>({ success: false, error: 'DB não configurada' }, 503)

    const { error } = await supabase.from('grade_subjects').delete().eq('id', id)
    if (error) return c.json<ApiResponse>({ success: false, error: error.message }, 500)
    return c.json<ApiResponse>({ success: true })
  } catch (e: any) {
    return c.json<ApiResponse>({ success: false, error: e.message }, 500)
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats/overview — mini stats for widgets
// ═══════════════════════════════════════════════════════════════════════════════
admin.get('/stats/overview', async (c) => {
  try {
    if (!isDatabaseConfigured(c.env)) {
      const d = getMockAdminData()
      return c.json({ success: true, data: d.stats })
    }
    // (produção: mesmo que /dashboard mas só stats)
    return c.json({ success: true, data: getMockAdminData().stats })
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500)
  }
})

export default admin
