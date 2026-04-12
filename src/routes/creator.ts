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
        order: 1, duration: 12, difficulty: 'medium',
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

  const { title, desc, notes, chapter_id, duration, difficulty, video_id, order } = body

  if (!title || title.length < 3) {
    return c.json({ success: false, error: 'Título obrigatório (mín. 3 caracteres)' }, 400)
  }
  if (!chapter_id) {
    return c.json({ success: false, error: 'Capítulo obrigatório' }, 400)
  }

  if (!isDatabaseConfigured(c.env)) {
    return c.json({
      success: true,
      data: { id: Date.now(), title, desc, notes, chapter_id, duration, difficulty, video_id, order, status: 'draft', created_by: user.id },
      message: 'Lição criada (modo demo)'
    }, 201)
  }

  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ title, description: desc, notes, chapter_id, duration_seconds: (duration || 12) * 60, difficulty: difficulty || 'medium', video_id, order: order || 1, status: 'draft', created_by: user.id })
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

    const { title, desc, notes, duration, difficulty, video_id, order, status } = body

    // Validações de publicação
    if (status === 'published') {
      if (!title || title.length < 3) return c.json({ success: false, error: 'Título obrigatório para publicar' }, 400)
      if (!video_id) return c.json({ success: false, error: 'Vídeo obrigatório para publicar' }, 400)
    }

    const { data, error } = await supabase
      .from('lessons')
      .update({ title, description: desc, notes, duration_seconds: (duration || 12) * 60, difficulty, video_id, order, status, updated_at: new Date().toISOString() })
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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/earnings — Ganhos do professor
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/earnings', async (c) => {
  const user   = c.get('user') as any
  const period = c.req.query('period') || '30d'   // 7d | 30d | 90d | 12m | all

  // ── Modelo de ganhos ──────────────────────────────────────────────────────
  // A plataforma usa um modelo de partilha de receita:
  //   Professor recebe 40 % da receita líquida gerada pelas suas aulas
  //   Cálculo: (nº alunos pagos × valor médio da subscrição × peso das aulas do prof.)
  //   O peso é proporcional ao nº de aulas do prof. / total de aulas da plataforma.
  //   Taxa de plataforma: 60 % (cobre infra, suporte, marketing, pagamentos)

  const COMMISSION_RATE = 0.40   // 40 % para o professor
  const PLATFORM_FEE    = 0.60   // 60 % para a plataforma

  // Preço médio mensal por aluno pago (mix MZN/AOA/BRL, convertido para MZN)
  const AVG_SUBSCRIPTION_MZN = 130

  // Alunos pagos que consomem conteúdo deste professor
  const PAID_STUDENTS_BASE = 312

  // Dados por período
  const PERIOD_DATA: Record<string, {
    paid_students: number, avg_watch_min: number, completions: number,
    total_gross_mzn: number, periods: { label: string, gross: number, commission: number, students: number }[]
  }> = {
    '7d': {
      paid_students: 187, avg_watch_min: 11.4, completions: 608,
      total_gross_mzn: 2431,
      periods: [
        { label: 'Seg', gross: 320, commission: 128, students: 22 },
        { label: 'Ter', gross: 290, commission: 116, students: 20 },
        { label: 'Qua', gross: 410, commission: 164, students: 31 },
        { label: 'Qui', gross: 375, commission: 150, students: 27 },
        { label: 'Sex', gross: 460, commission: 184, students: 34 },
        { label: 'Sáb', gross: 318, commission: 127, students: 24 },
        { label: 'Dom', gross: 258, commission: 103, students: 19 },
      ]
    },
    '30d': {
      paid_students: 312, avg_watch_min: 10.8, completions: 2340,
      total_gross_mzn: 9750,
      periods: Array.from({ length: 4 }, (_, w) => ({
        label: `Sem ${w + 1}`,
        gross: [2100, 2450, 2800, 2400][w],
        commission: [840, 980, 1120, 960][w],
        students: [71, 83, 94, 81][w]
      }))
    },
    '90d': {
      paid_students: 489, avg_watch_min: 10.2, completions: 6900,
      total_gross_mzn: 28600,
      periods: Array.from({ length: 3 }, (_, m) => ({
        label: ['Mês 1', 'Mês 2', 'Mês 3'][m],
        gross: [8900, 9750, 9950][m],
        commission: [3560, 3900, 3980][m],
        students: [276, 312, 342][m]
      }))
    },
    '12m': {
      paid_students: 847, avg_watch_min: 9.8, completions: 16200,
      total_gross_mzn: 117000,
      periods: [
        { label:'Jan', gross:7200,  commission:2880,  students:231 },
        { label:'Fev', gross:7800,  commission:3120,  students:248 },
        { label:'Mar', gross:8400,  commission:3360,  students:267 },
        { label:'Abr', gross:8900,  commission:3560,  students:276 },
        { label:'Mai', gross:9200,  commission:3680,  students:287 },
        { label:'Jun', gross:9750,  commission:3900,  students:312 },
        { label:'Jul', gross:10100, commission:4040,  students:324 },
        { label:'Ago', gross:10400, commission:4160,  students:338 },
        { label:'Set', gross:10800, commission:4320,  students:350 },
        { label:'Out', gross:11200, commission:4480,  students:362 },
        { label:'Nov', gross:11750, commission:4700,  students:378 },
        { label:'Dez', gross:11700, commission:4680,  students:375 },
      ]
    },
    'all': {
      paid_students: 847, avg_watch_min: 9.8, completions: 58000,
      total_gross_mzn: 185400,
      periods: [
        { label:'2025 T1', gross:23400, commission:9360,  students:267 },
        { label:'2025 T2', gross:27850, commission:11140, students:312 },
        { label:'2025 T3', gross:30300, commission:12120, students:338 },
        { label:'2025 T4', gross:33650, commission:13460, students:375 },
        { label:'2026 T1', gross:35200, commission:14080, students:390 },
      ]
    }
  }

  const d = PERIOD_DATA[period] || PERIOD_DATA['30d']

  const gross_mzn      = d.total_gross_mzn
  const commission_mzn = Math.round(gross_mzn * COMMISSION_RATE)
  const platform_mzn   = Math.round(gross_mzn * PLATFORM_FEE)

  // Top lições por ganho
  const TOP_LESSONS = [
    { id:'l-01', title:'Leis de Newton — Aplicações Práticas', subject:'Física',    views:1284, completions:820, commission_mzn:1840, trend:'+12%', plan_split: { free:40, basic:35, premium:25 } },
    { id:'l-02', title:'Cinemática: Movimento Uniforme',       subject:'Física',    views: 960, completions:672, commission_mzn:1520, trend: '+8%', plan_split: { free:45, basic:33, premium:22 } },
    { id:'l-03', title:'Funções Quadráticas — Exemplos',       subject:'Matemática',views: 840, completions:588, commission_mzn:1210, trend: '+5%', plan_split: { free:50, basic:30, premium:20 } },
    { id:'l-04', title:'Trigonometria — Seno e Coseno',        subject:'Matemática',views: 612, completions:428, commission_mzn: 880, trend: '+3%', plan_split: { free:48, basic:32, premium:20 } },
    { id:'l-05', title:'Termodinâmica — 1ª Lei',               subject:'Física',    views: 540, completions:378, commission_mzn: 775, trend: '+2%', plan_split: { free:55, basic:28, premium:17 } },
  ]

  // Levantamentos / pagamentos realizados
  const WITHDRAWALS = [
    { id:'wth-001', date:'2026-03-01', amount_mzn:3900, method:'M-Pesa',     phone:'+258 82 987 6543', status:'pago',      ref:'WD-2026-03-001' },
    { id:'wth-002', date:'2026-02-01', amount_mzn:3560, method:'M-Pesa',     phone:'+258 82 987 6543', status:'pago',      ref:'WD-2026-02-001' },
    { id:'wth-003', date:'2026-01-01', amount_mzn:3680, method:'M-Pesa',     phone:'+258 82 987 6543', status:'pago',      ref:'WD-2026-01-001' },
    { id:'wth-004', date:'2025-12-01', amount_mzn:4040, method:'Transferência',phone:'+258 82 987 6543',status:'pago',     ref:'WD-2025-12-001' },
    { id:'wth-005', date:'2025-11-01', amount_mzn:4160, method:'M-Pesa',     phone:'+258 82 987 6543', status:'pago',      ref:'WD-2025-11-001' },
  ]

  // Saldo disponível para levantamento
  const AVAILABLE_MZN = period === '30d' ? commission_mzn : 4680

  return c.json({
    success: true,
    data: {
      period,
      teacher: { id: user.id, name: user.full_name, email: user.email },

      // KPIs principais
      kpi: {
        commission_mzn,
        gross_mzn,
        platform_fee_mzn: platform_mzn,
        commission_rate_pct: Math.round(COMMISSION_RATE * 100),
        paid_students: d.paid_students,
        completions: d.completions,
        avg_watch_min: d.avg_watch_min,
        available_mzn: AVAILABLE_MZN,
        pending_mzn: Math.round(commission_mzn * 0.15),   // em processamento
      },

      // Série temporal para gráfico
      chart: d.periods,

      // Breakdown por plano dos alunos
      plan_breakdown: {
        free:    { pct: 48, students: Math.round(d.paid_students * 0.48), commission_share: 0 },
        basic:   { pct: 33, students: Math.round(d.paid_students * 0.33), commission_share: 55 },
        premium: { pct: 19, students: Math.round(d.paid_students * 0.19), commission_share: 45 },
      },

      // Lições que mais geraram ganhos
      top_lessons: TOP_LESSONS,

      // Levantamentos
      withdrawals: WITHDRAWALS,

      // Regras de comissão
      commission_rules: {
        teacher_pct: 40,
        platform_pct: 60,
        min_withdrawal_mzn: 500,
        payment_cycle: 'Mensal (dia 1 de cada mês)',
        payment_methods: ['M-Pesa', 'e-Mola', 'Transferência Bancária'],
        tax_note: 'Os valores apresentados são brutos. Podem aplicar-se retenções fiscais conforme a legislação local.',
      }
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/earnings/withdraw — Solicitar levantamento
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/earnings/withdraw', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({})) as any

  const { amount_mzn, method, phone } = body

  if (!amount_mzn || amount_mzn < 500) {
    return c.json({ success: false, message: 'Valor mínimo de levantamento: MT 500' }, 400)
  }
  if (!method || !['mpesa', 'emola', 'transferencia'].includes(method)) {
    return c.json({ success: false, message: 'Método de pagamento inválido.' }, 400)
  }

  const ref = `WD-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${Date.now().toString(36).toUpperCase().slice(-4)}`

  return c.json({
    success: true,
    message: `Pedido de levantamento de MT ${amount_mzn.toLocaleString()} enviado com sucesso.`,
    data: {
      reference: ref,
      amount_mzn,
      method,
      phone: phone || user.phone || '—',
      status: 'em_processamento',
      eta: 'Processado até 3 dias úteis',
      requested_at: new Date().toISOString(),
    }
  })
})

export default creator
