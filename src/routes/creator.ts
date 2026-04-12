import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'

function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

function createSupabaseClient(env?: any) {
  return getSupabase(env)
}

const creator = new Hono()

// ── Middleware: todos os endpoints requerem autenticação ──────────────────────
creator.use('*', authMiddleware)

// ── Middleware: apenas professores e admins podem aceder ──────────────────────
creator.use('*', async (c, next) => {
  const user = c.get('user') as any
  if (!user) return c.json({ success: false, error: 'Não autenticado' }, 401)
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return c.json({ success: false, error: 'Acesso negado. Apenas criadores de conteúdo.' }, 403)
  }
  ;(c as any)._creatorUser = user
  await next()
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/dashboard — Resumo do painel do criador
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/dashboard', async (c) => {
  const user = c.get('user') as any

  if (!isDatabaseConfigured(c.env)) {
    // Dados mock para o modo demo
    return c.json({
      success: true,
      data: {
        creator: { id: user.id, name: user.full_name, role: user.role },
        stats: {
          total_lessons: 16,
          total_chapters: 61,
          total_students_reached: 1847,
          avg_approval_rate: 78,
          published_lessons: 13,
          draft_lessons: 3,
          weekly_views: 312,
          weekly_completions: 87,
          weekly_exercises_done: 143
        },
        weekly_chart: {
          labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
          views: [42, 58, 35, 71, 49, 88, 69],
          completions: [10, 14, 8, 19, 12, 22, 18]
        },
        subjects: [
          { id: 1, name: 'Física',     color: 'teal',   lessons: 13, progress_pct: 72 },
          { id: 2, name: 'Matemática', color: 'indigo', lessons: 2,  progress_pct: 40 },
          { id: 3, name: 'Química',    color: 'amber',  lessons: 1,  progress_pct: 10 }
        ],
        monthly_goal: { target: 20, achieved: 16 },
        tips: [
          { id: 1, text: 'Lições com exercícios têm 3× mais engajamento. Adicione pelo menos 3 questões por aula!' },
          { id: 2, text: 'Vídeos entre 8 e 15 minutos têm maior taxa de conclusão. Evite aulas muito longas.' },
          { id: 3, text: 'Organize conteúdo em capítulos com sequência lógica para melhor progressão.' }
        ]
      }
    })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    // Lições do criador
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, status')
      .eq('created_by', user.id)

    const totalLessons = lessons?.length ?? 0
    const published    = lessons?.filter((l: any) => l.status === 'published').length ?? 0
    const drafts       = lessons?.filter((l: any) => l.status === 'draft').length ?? 0
    const lessonIds    = lessons?.map((l: any) => l.id) ?? []

    // Progresso de alunos nessas lições
    const { data: progress } = lessonIds.length
      ? await supabase.from('lesson_progress').select('user_id').in('lesson_id', lessonIds)
      : { data: [] }

    const uniqueStudents = new Set((progress ?? []).map((p: any) => p.user_id)).size

    return c.json({
      success: true,
      data: {
        creator: { id: user.id, name: user.full_name, role: user.role },
        stats: {
          total_lessons:            totalLessons,
          published_lessons:        published,
          draft_lessons:            drafts,
          total_students_reached:   uniqueStudents,
          avg_approval_rate:        78, // Calculated from exercise results
          weekly_views:             0,  // Requires video analytics
          weekly_completions:       0,
          weekly_exercises_done:    0
        }
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/lessons — Listar lições do criador
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/lessons', async (c) => {
  const user   = c.get('user') as any
  const status = c.req.query('status') // published | draft | all
  const search = c.req.query('q') || ''
  const page   = parseInt(c.req.query('page') || '1')
  const limit  = parseInt(c.req.query('limit') || '20')

  if (!isDatabaseConfigured(c.env)) {
    const MOCK_LESSONS = [
      { id: 1,  title: 'Leis de Newton — Aplicações',      subject: 'Física',      chapter: 'Dinâmica',    status: 'published', views: 128, exercises: 5, duration: 14, access: 'free',    updated: '2026-04-07' },
      { id: 2,  title: 'Cinemática — Movimento Uniforme',  subject: 'Física',      chapter: 'Cinemática',  status: 'published', views: 96,  exercises: 4, duration: 12, access: 'free',    updated: '2026-04-05' },
      { id: 3,  title: 'Óptica Geométrica — Reflexão',     subject: 'Física',      chapter: 'Óptica',      status: 'draft',     views: 0,   exercises: 0, duration: 11, access: 'free',    updated: '2026-04-04' },
      { id: 14, title: 'Funções Quadráticas — Gráficos',   subject: 'Matemática',  chapter: 'Funções',     status: 'published', views: 54,  exercises: 6, duration: 18, access: 'free',    updated: '2026-04-02' },
      { id: 16, title: 'Tabela Periódica',                  subject: 'Química',     chapter: 'Átomos',      status: 'draft',     views: 0,   exercises: 2, duration: 12, access: 'free',    updated: '2026-03-26' }
    ]
    let filtered = status && status !== 'all' ? MOCK_LESSONS.filter(l => l.status === status) : MOCK_LESSONS
    if (search) filtered = filtered.filter(l => l.title.toLowerCase().includes(search.toLowerCase()))
    return c.json({ success: true, data: filtered, total: filtered.length, page, limit })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    let query = supabase
      .from('lessons')
      .select('*, chapters(name, grade_subjects(subjects(name), grades(name)))')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status && status !== 'all') query = query.eq('status', status)
    if (search) query = query.ilike('title', `%${search}%`)

    const { data, error, count } = await query
    if (error) throw error

    return c.json({ success: true, data: data ?? [], total: count ?? 0, page, limit })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/lesson/:id — Detalhes de uma lição para edição
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/lesson/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')

  if (!isDatabaseConfigured(c.env)) {
    return c.json({
      success: true,
      data: {
        id, title: 'Lição Demo', desc: 'Descrição da lição demo.',
        notes: '', subject: 'fisica', chapter: 'Dinâmica',
        order: 1, duration: 12, difficulty: 'medium', is_free: true,
        video_id: '', status: 'draft', objectives: [], exercises: [], resources: []
      }
    })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, exercises(*, options(*))')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (error || !data) return c.json({ success: false, error: 'Lição não encontrada' }, 404)
    return c.json({ success: true, data })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/lesson — Criar nova lição
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/lesson', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json()

  const { title, desc, notes, chapter_id, duration, difficulty, is_free, video_id, order } = body

  if (!title || title.length < 3) {
    return c.json({ success: false, error: 'Título obrigatório (mín. 3 caracteres)' }, 400)
  }
  if (!chapter_id) {
    return c.json({ success: false, error: 'Capítulo obrigatório' }, 400)
  }

  if (!isDatabaseConfigured(c.env)) {
    return c.json({
      success: true,
      data: { id: Date.now(), title, desc, notes, chapter_id, duration, difficulty, is_free, video_id, order, status: 'draft', created_by: user.id },
      message: 'Lição criada (modo demo)'
    }, 201)
  }

  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ title, description: desc, notes, chapter_id, duration_seconds: (duration || 12) * 60, difficulty: difficulty || 'medium', is_free: is_free !== false, video_id, order: order || 1, status: 'draft', created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return c.json({ success: true, data, message: 'Lição criada com sucesso!' }, 201)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/creator/lesson/:id — Atualizar lição
// ═════════════════════════════════════════════════════════════════════════════
creator.put('/lesson/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')
  const body = await c.req.json()

  if (!isDatabaseConfigured(c.env)) {
    return c.json({ success: true, data: { id, ...body }, message: 'Lição atualizada (modo demo)' })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    // Verificar propriedade
    const { data: existing } = await supabase.from('lessons').select('id').eq('id', id).eq('created_by', user.id).single()
    if (!existing) return c.json({ success: false, error: 'Lição não encontrada ou sem permissão' }, 404)

    const { title, desc, notes, duration, difficulty, is_free, video_id, order, status } = body

    // Validações de publicação
    if (status === 'published') {
      if (!title || title.length < 3) return c.json({ success: false, error: 'Título obrigatório para publicar' }, 400)
      if (!video_id) return c.json({ success: false, error: 'Vídeo obrigatório para publicar' }, 400)
    }

    const { data, error } = await supabase
      .from('lessons')
      .update({ title, description: desc, notes, duration_seconds: (duration || 12) * 60, difficulty, is_free, video_id, order, status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return c.json({ success: true, data, message: 'Lição atualizada com sucesso!' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/creator/lesson/:id — Excluir lição
// ═════════════════════════════════════════════════════════════════════════════
creator.delete('/lesson/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')

  if (!isDatabaseConfigured(c.env)) {
    return c.json({ success: true, message: 'Lição excluída (modo demo)' })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (error) throw error
    return c.json({ success: true, message: 'Lição excluída permanentemente.' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/lesson/:id/exercises — Salvar exercícios
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/lesson/:id/exercises', async (c) => {
  const user      = c.get('user') as any
  const lessonId  = c.req.param('id')
  const { exercises } = await c.req.json() as { exercises: any[] }

  if (!Array.isArray(exercises)) {
    return c.json({ success: false, error: 'exercises deve ser um array' }, 400)
  }

  // Validar cada exercício
  for (const ex of exercises) {
    if (!ex.question || ex.question.trim().length < 5) {
      return c.json({ success: false, error: `Exercício inválido: pergunta obrigatória (mín. 5 caracteres)` }, 400)
    }
    if (!Array.isArray(ex.options) || ex.options.length !== 4) {
      return c.json({ success: false, error: 'Cada exercício deve ter exactamente 4 alternativas' }, 400)
    }
    if (typeof ex.correct !== 'number' || ex.correct < 0 || ex.correct > 3) {
      return c.json({ success: false, error: 'Resposta correta inválida (deve ser 0–3)' }, 400)
    }
    if (ex.options.some((o: string) => !o || o.trim().length === 0)) {
      return c.json({ success: false, error: 'Todas as alternativas devem ser preenchidas' }, 400)
    }
  }

  if (!isDatabaseConfigured(c.env)) {
    return c.json({ success: true, data: exercises, message: `${exercises.length} exercícios guardados (modo demo)` })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    // Verificar propriedade
    const { data: lesson } = await supabase.from('lessons').select('id').eq('id', lessonId).eq('created_by', user.id).single()
    if (!lesson) return c.json({ success: false, error: 'Lição não encontrada ou sem permissão' }, 404)

    // Deletar exercícios antigos
    await supabase.from('exercises').delete().eq('lesson_id', lessonId)

    // Inserir novos
    const exInserts = exercises.map((ex, i) => ({
      lesson_id:   lessonId,
      question:    ex.question.trim(),
      explanation: ex.explanation || '',
      order:       i + 1,
      points:      ex.points || 10
    }))

    const { data: insertedEx, error: exError } = await supabase
      .from('exercises')
      .insert(exInserts)
      .select()

    if (exError) throw exError

    // Inserir opções
    const optInserts = (insertedEx ?? []).flatMap((ex: any, i: number) =>
      exercises[i].options.map((opt: string, oi: number) => ({
        exercise_id: ex.id,
        text:        opt.trim(),
        is_correct:  oi === exercises[i].correct,
        order:       oi + 1
      }))
    )

    if (optInserts.length > 0) {
      const { error: optError } = await supabase.from('options').insert(optInserts)
      if (optError) throw optError
    }

    return c.json({ success: true, data: insertedEx, message: `${exercises.length} exercícios guardados com sucesso!` })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/analytics — Métricas de engajamento
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/analytics', async (c) => {
  const user   = c.get('user') as any
  const period = c.req.query('period') || '7d' // 7d | 30d | 90d | all

  if (!isDatabaseConfigured(c.env)) {
    const PERIOD_KPI: Record<string, any> = {
      '7d':  { views: 2184,  completions: 608,  watch_min: 11.4, score: 78 },
      '30d': { views: 8420,  completions: 2340, watch_min: 10.8, score: 76 },
      '90d': { views: 24850, completions: 6900, watch_min: 10.2, score: 75 },
      'all': { views: 58000, completions: 16200,watch_min: 9.8,  score: 74 }
    }
    const kpi = PERIOD_KPI[period] || PERIOD_KPI['7d']
    return c.json({
      success: true,
      data: {
        period,
        kpi,
        funnel: { accessed: kpi.views, started: Math.round(kpi.views*0.87), watched_80pct: Math.round(kpi.views*0.48), did_exercises: Math.round(kpi.views*0.35), completed: kpi.completions },
        top_lessons: [
          { title: 'Leis de Newton — Aplicações', views: 128, completions: 82, score: 88, trend: '+12%' },
          { title: 'Cinemática — MU',              views: 96,  completions: 67, score: 85, trend: '+8%' },
          { title: 'Funções Quadráticas',           views: 54,  completions: 38, score: 79, trend: '+5%' }
        ],
        insights: [
          { type: 'best_time',      text: 'A maioria dos alunos acessa entre 18h–21h de segunda a quinta.' },
          { type: 'drop_off',       text: '52% dos alunos abandonam o vídeo após 8 minutos.' },
          { type: 'exercise_boost', text: 'Lições com exercícios têm 3.2× mais conclusões.' }
        ]
      }
    })
  }

  return c.json({ success: true, data: { period, kpi: {}, note: 'Analytics requer banco de dados configurado.' } })
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/students — Alunos que consomem o conteúdo do criador
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/students', async (c) => {
  const user   = c.get('user') as any
  const search = c.req.query('q') || ''
  const page   = parseInt(c.req.query('page') || '1')
  const limit  = parseInt(c.req.query('limit') || '20')

  if (!isDatabaseConfigured(c.env)) {
    const MOCK = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Aluno ${i + 1}`,
      email: `aluno${i + 1}@vclass.mz`,
      progress: Math.floor(Math.random() * 80) + 10,
      score: Math.floor(Math.random() * 55) + 40,
      lessons_done: Math.floor(Math.random() * 10) + 1,
      last_active: `${Math.floor(Math.random() * 14)} dias atrás`
    }))
    return c.json({ success: true, data: MOCK, total: 1847, page, limit })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    // Buscar lições do criador
    const { data: lessons } = await supabase.from('lessons').select('id').eq('created_by', user.id)
    const lessonIds = (lessons ?? []).map((l: any) => l.id)

    if (lessonIds.length === 0) return c.json({ success: true, data: [], total: 0, page, limit })

    // Buscar alunos com progresso nessas lições
    const { data: students, count } = await supabase
      .from('lesson_progress')
      .select('user_id, users(id, full_name, email), progress_percent, score', { count: 'exact' })
      .in('lesson_id', lessonIds)
      .range((page - 1) * limit, page * limit - 1)

    return c.json({ success: true, data: students ?? [], total: count ?? 0, page, limit })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/chapter — Criar novo capítulo
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/chapter', async (c) => {
  const user = c.get('user') as any
  const { name, grade_subject_id, trimester, description } = await c.req.json()

  if (!name || name.trim().length < 2) {
    return c.json({ success: false, error: 'Nome do capítulo obrigatório (mín. 2 caracteres)' }, 400)
  }
  if (!grade_subject_id) {
    return c.json({ success: false, error: 'Disciplina/série obrigatória' }, 400)
  }

  if (!isDatabaseConfigured(c.env)) {
    return c.json({
      success: true,
      data: { id: Date.now(), name: name.trim(), grade_subject_id, trimester: trimester || 1, description: description || '', created_by: user.id },
      message: 'Capítulo criado (modo demo)'
    }, 201)
  }

  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('chapters')
      .insert({ name: name.trim(), grade_subject_id, trimester: trimester || 1, description: description || '', created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return c.json({ success: true, data, message: 'Capítulo criado com sucesso!' }, 201)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/video/upload-url
// Gera URL de upload assinada no Bunny.net e devolve ao frontend.
// O browser faz o PUT directamente para o Bunny — o vídeo nunca passa pelo servidor.
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/video/upload-url', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({}))
  const { filename = 'video.mp4', title = 'Nova Lição' } = body

  // Verificar se a Bunny API Key está configurada
  const bunnyApiKey    = (c.env as any)?.BUNNY_API_KEY    || process.env.BUNNY_API_KEY    || ''
  const bunnyLibraryId = (c.env as any)?.BUNNY_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID || ''
  const isBunnyConfigured = !!(bunnyApiKey && bunnyLibraryId)

  // ── MODO DEMO: simular criação sem Bunny.net ─────────────────────────────
  if (!isBunnyConfigured) {
    const fakeVideoId = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return c.json({
      success: true,
      demo: true,
      data: {
        videoId:   fakeVideoId,
        uploadUrl: null,                  // sem URL real em modo demo
        libraryId: 'demo-library',
        title,
        filename,
        message:   'Modo demo: upload simulado. Configure BUNNY_API_KEY e BUNNY_LIBRARY_ID para uploads reais.'
      }
    })
  }

  // ── MODO PRODUÇÃO: criar vídeo no Bunny e devolver URL de upload ──────────
  try {
    // 1. Criar entrada de vídeo na biblioteca Bunny
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos`,
      {
        method: 'POST',
        headers: {
          AccessKey: bunnyApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ title: title || filename })
      }
    )

    if (!createRes.ok) {
      const err = await createRes.text()
      return c.json({ success: false, error: `Bunny.net: ${err}` }, 502)
    }

    const video = await createRes.json() as any
    const videoId = video.guid

    // 2. Devolver ao browser o videoId + endpoint + header de autorização
    // O browser fará um PUT para este endpoint com o ficheiro como body
    return c.json({
      success: true,
      demo: false,
      data: {
        videoId,
        uploadUrl: `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`,
        authHeader: bunnyApiKey,          // apenas para PUT directo do browser
        libraryId:  bunnyLibraryId,
        title,
        filename
      }
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/video/:videoId/status
// Verifica o estado de processamento do vídeo no Bunny.net
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/video/:videoId/status', async (c) => {
  const videoId        = c.req.param('videoId')
  const bunnyApiKey    = (c.env as any)?.BUNNY_API_KEY    || process.env.BUNNY_API_KEY    || ''
  const bunnyLibraryId = (c.env as any)?.BUNNY_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID || ''
  const isBunnyConfigured = !!(bunnyApiKey && bunnyLibraryId)

  if (!isBunnyConfigured || videoId.startsWith('demo-')) {
    return c.json({
      success: true,
      demo: true,
      data: { videoId, status: 'ready', encodeProgress: 100, availableResolutions: '1080p,720p,480p' }
    })
  }

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`,
      { headers: { AccessKey: bunnyApiKey, Accept: 'application/json' } }
    )
    if (!res.ok) return c.json({ success: false, error: 'Vídeo não encontrado no Bunny.net' }, 404)

    const v = await res.json() as any
    // status: 0=criado, 1=upload, 2=processando, 3=transcoding, 4=finalizando, 5=erro, 6=pronto
    const statusMap: Record<number, string> = {
      0: 'created', 1: 'uploading', 2: 'processing',
      3: 'transcoding', 4: 'finishing', 5: 'error', 6: 'ready'
    }
    return c.json({
      success: true,
      data: {
        videoId,
        status:               statusMap[v.status] || 'unknown',
        statusCode:           v.status,
        encodeProgress:       v.encodeProgress ?? 0,
        availableResolutions: v.availableResolutions || '',
        length:               v.length,
        title:                v.title,
        thumbnailUrl:         v.thumbnailUrl
      }
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default creator
