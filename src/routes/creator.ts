import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import { createBunnyVideo, buildBunnyTusCredentials, getBunnyVideoStatus } from '../utils/bunny'
import { extractPageCount } from '../utils/documentMeta'

function isDatabaseConfigured(env?: any): boolean {
  const hasUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  return hasUrl && hasKey
}

function createSupabaseClient(env?: any) {
  const sb = getSupabase(env)
  if (!sb) throw new Error('Database not configured')
  return sb
}

const creator = new Hono<{ Bindings: CloudflareBindings }>()

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
  const supabase = createSupabaseClient(c.env)

  try {
    // Lições do criador
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, status, chapter_id')
      .eq('created_by', user.id)

    const totalLessons = lessons?.length ?? 0
    const published    = lessons?.filter((l: any) => l.status === 'published').length ?? 0
    const drafts       = lessons?.filter((l: any) => l.status === 'draft').length ?? 0
    const reviewing    = lessons?.filter((l: any) => l.status === 'review').length ?? 0
    const lessonIds    = lessons?.map((l: any) => l.id) ?? []

    // Capítulos criados pelo professor (com fallback se created_by não existir)
    let chaptersCount = 0
    try {
      const { count } = await supabase
        .from('chapters')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
      chaptersCount = count ?? 0
    } catch {
      // created_by pode não existir — contar pelos chapter_ids das lições
      const uniqueChapters = new Set((lessons ?? []).map((l: any) => l.chapter_id).filter(Boolean))
      chaptersCount = uniqueChapters.size
    }
    if (chaptersCount === 0) {
      const uniqueChapters = new Set((lessons ?? []).map((l: any) => l.chapter_id).filter(Boolean))
      chaptersCount = uniqueChapters.size
    }

    // Progresso de alunos nessas lições
    const { data: allProgress } = lessonIds.length
      ? await supabase
          .from('lesson_progress')
          .select('user_id, progress_percent, created_at')
          .in('lesson_id', lessonIds)
      : { data: [] }

    const uniqueStudents = new Set((allProgress ?? []).map((p: any) => p.user_id)).size

    // Score médio (aprovação) dos alunos com pelo menos 50% de progresso
    const progWithScore = (allProgress ?? []).filter((p: any) => p.progress_percent >= 50)
    const avgScore = progWithScore.length > 0
      ? Math.round(progWithScore.reduce((acc: number, p: any) => acc + (p.progress_percent ?? 0), 0) / progWithScore.length)
      : 0

    // Engajamento semanal (últimos 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const weeklyProgress = (allProgress ?? []).filter((p: any) => p.created_at >= sevenDaysAgo)

    const weeklyViews       = weeklyProgress.length
    const weeklyCompletions = weeklyProgress.filter((p: any) => (p.progress_percent ?? 0) >= 80).length

    // Distribuição por dia da semana (Seg=0 ... Dom=6)
    const byDay = [0, 0, 0, 0, 0, 0, 0]
    for (const p of weeklyProgress) {
      const d = new Date(p.created_at)
      byDay[(d.getDay() + 6) % 7]++
    }

    // Lições sem exercícios
    let lessonsWithoutExercises = 0
    if (lessonIds.length > 0) {
      try {
        const { data: exData } = await supabase
          .from('exercises')
          .select('lesson_id')
          .in('lesson_id', lessonIds)
        const lessonsWithEx = new Set((exData ?? []).map((e: any) => e.lesson_id))
        lessonsWithoutExercises = lessonIds.filter((id: string) => !lessonsWithEx.has(id)).length
      } catch {}
    }

    // Disciplinas: agrupar lições por subject via chapters -> grade_subjects -> subjects
    let subjects: any[] = []
    try {
      const { data: lessonsWithSubj } = await supabase
        .from('lessons')
        .select('id, status, chapters(title, grade_subjects(subjects(name, icon_url)))')
        .eq('created_by', user.id)

      const subjectMap = new Map<string, { lessons: number; published: number; icon: string }>()
      for (const l of lessonsWithSubj ?? []) {
        const ch = (l as any).chapters
        const subjectName: string = ch?.grade_subjects?.subjects?.name || 'Outros'
        const subjectIcon: string = ch?.grade_subjects?.subjects?.icon_url || 'fa-book'
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, { lessons: 0, published: 0, icon: subjectIcon })
        }
        const s = subjectMap.get(subjectName)!
        s.lessons++
        if ((l as any).status === 'published') s.published++
      }

      subjects = Array.from(subjectMap.entries())
        .map(([name, data]) => ({
          name,
          lessons: data.lessons,
          published: data.published,
          pct: data.lessons > 0 ? Math.round((data.published / data.lessons) * 100) : 0,
          icon: data.icon
        }))
        .sort((a, b) => b.lessons - a.lessons)
    } catch {}

    return c.json({
      success: true,
      data: {
        creator: { id: user.id, name: user.full_name, role: user.role },
        stats: {
          total_lessons:               totalLessons,
          published_lessons:           published,
          draft_lessons:               drafts,
          review_lessons:              reviewing,
          total_chapters:              chaptersCount,
          total_students_reached:      uniqueStudents,
          avg_approval_rate:           avgScore,
          weekly_views:                weeklyViews,
          weekly_completions:          weeklyCompletions,
          weekly_exercises_done:       0,  // requer tabela de respostas de exercícios
          weekly_by_day:               byDay,
          lessons_without_exercises:   lessonsWithoutExercises,
        },
        subjects
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

  const supabase = createSupabaseClient(c.env)

  try {
    let query = supabase
      .from('lessons')
      // Schema real: chapters.title (não .name). Join é nullable porque chapters
      // criados via slug podem não ter grade_subject_id.
      .select('id, title, description, video_id, video_url, video_duration, status, views_count, display_order, is_free, thumbnail_url, created_at, updated_at, chapter_id, chapters(title, slug, grade_subjects(subjects(name)))', { count: 'exact' })
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status && status !== 'all') query = query.eq('status', status) as any
    if (search) query = query.ilike('title', `%${search}%`) as any

    const { data, error, count } = await query
    if (error) throw error

    // Normalizar formato esperado pelo frontend
    const normalized = (data ?? []).map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      subject: l.chapters?.grade_subjects?.subjects?.name || '—',
      chapter: l.chapters?.title || '—',
      chapter_id: l.chapter_id,
      chapter_slug: l.chapters?.slug || '',
      video_id: l.video_id,
      video_url: l.video_url,
      duration: Math.round((l.video_duration || 0) / 60),
      status: l.status,
      views: l.views_count || 0,
      exercises: 0,  // preenchido separadamente se necessário
      access: l.is_free ? 'free' : 'premium',
      thumbnail_url: l.thumbnail_url,
      updated: l.updated_at?.slice(0, 10),
      created_at: l.created_at
    }))

    return c.json({ success: true, data: normalized, total: count ?? 0, page, limit })
  } catch (error: any) {
    console.error('List creator lessons error:', error)
    return c.json({ success: false, error: error.message || 'DB error' }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/lesson/:id — Detalhes de uma lição para edição
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/lesson/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')
  const supabase = createSupabaseClient(c.env)

  try {
    // Query principal sem JOIN (mais robusto: nem todas as DBs têm exercises/options seedadas)
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle()

    if (error) {
      console.error('Get lesson error:', error)
      return c.json({ success: false, error: error.message || 'DB error' }, 500)
    }
    if (!data) return c.json({ success: false, error: 'Lição não encontrada' }, 404)

    // Buscar exercises separadamente (não bloqueia se a tabela não existir)
    let exercises: any[] = []
    try {
      const { data: exs } = await supabase
        .from('exercises')
        .select('id, question, explanation, display_order, points, exercise_options(id, option_text, is_correct, display_order)')
        .eq('lesson_id', id)
        .order('display_order', { ascending: true })
      exercises = exs || []
    } catch (e: any) {
      console.warn('exercises fetch failed:', e?.message)
    }

    return c.json({ success: true, data: { ...data, exercises } })
  } catch (error: any) {
    console.error('Get lesson error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/lesson — Criar nova lição
// ═════════════════════════════════════════════════════════════════════════════
/**
 * Resolve um chapter_id que pode ser:
 *  - UUID válido (FK directo)
 *  - Slug do curriculum tree (ex: "mz10mat-1-1") → busca/cria chapter na DB
 * Devolve sempre um UUID válido pronto para FK em lessons.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Slug do currículo estático: ex. "mz11mat-1-1" → country=mz, grade=11, subject=mat, term=1, ord=1
// O prefixo curricular "{country}{grade}{subject}" identifica o grade_subject na BD.
//
// Fallback estático para disciplinas seedadas (alguns shortnames têm 4 letras
// como "port" ou abreviações que não derivam linearmente do nome).
const STATIC_SUBJECT_SHORTNAME: Record<string, string> = {
  mat: 'Matemática',     por: 'Português',  port: 'Português',
  fis: 'Física',         qui: 'Química',    bio: 'Biologia',
  geo: 'Geografia',      his: 'História',   ing: 'Inglês',
  edm: 'Ed. Moral e Cívica'
}

// Normaliza nome → short de 3 letras (sem acentos/lowercase). "Robótica" → "rob"
function nameToShort3(name: string): string {
  return String(name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z]/g, '')
    .slice(0, 3)
}

// Cache curto (60s) para evitar query repetida a cada chapter criado, mas
// permitir que disciplinas novas apareçam sem redeploy.
let _shortMapCache: { data: Record<string, string>; expires: number } | null = null
const SHORTMAP_TTL_MS = 60_000

async function getSubjectShortMap(supabase: any): Promise<Record<string, string>> {
  if (_shortMapCache && _shortMapCache.expires > Date.now()) return _shortMapCache.data
  const map: Record<string, string> = { ...STATIC_SUBJECT_SHORTNAME }
  try {
    const { data } = await supabase.from('subjects').select('name')
    for (const row of (data || [])) {
      const short = nameToShort3(row.name)
      if (short && short.length === 3 && !map[short]) {
        map[short] = row.name
      }
    }
  } catch (e) {
    console.warn('getSubjectShortMap: BD lookup falhou, usando estático', e)
  }
  _shortMapCache = { data: map, expires: Date.now() + SHORTMAP_TTL_MS }
  return map
}

/**
 * Parseia "mz11mat-1-1" e devolve o grade_subjects.id correspondente na BD,
 * fazendo lookup por nome de grade ("11ª Classe") e subject ("Matemática").
 * Devolve null se o padrão não bater ou a relação não existir na BD.
 */
async function resolveGradeSubjectFromSlug(supabase: any, slug: string): Promise<string | null> {
  // Padrão aceita AMBOS:
  //   - "mz12bio-..." (sem hífen — formato do creator antigo)
  //   - "mz12-bio-..." (com hífen — id estático "mz{N}-{abrev}" da curriculum.ts)
  const m = slug.match(/^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-/i)
  if (!m) return null
  const [, , gradeNum, subjShort] = m
  const shortMap = await getSubjectShortMap(supabase)
  const subjectName = shortMap[subjShort.toLowerCase()]
  if (!subjectName) return null
  const gradeName = `${parseInt(gradeNum, 10)}ª Classe`

  // Lookup grade_subjects via JOIN inline (PostgREST)
  const { data, error } = await supabase
    .from('grade_subjects')
    .select('id, grades!inner(name), subjects!inner(name)')
    .eq('grades.name', gradeName)
    .eq('subjects.name', subjectName)
    .maybeSingle()

  if (error) {
    console.warn('resolveGradeSubjectFromSlug lookup failed:', error.message)
    return null
  }
  return data?.id ?? null
}

async function resolveChapterUuid(supabase: any, chapterId: string, fallbackTitle?: string): Promise<string | null> {
  if (!chapterId) return null
  if (UUID_RE.test(chapterId)) return chapterId

  // É slug — find-or-create
  const { data: existing } = await supabase
    .from('chapters')
    .select('id, grade_subject_id')
    .eq('slug', chapterId)
    .maybeSingle()

  if (existing?.id) {
    // Backfill: chapters criados antes do fix podem ter grade_subject_id NULL,
    // o que os torna invisíveis aos alunos. Resolver e UPDATE de forma idempotente.
    if (!existing.grade_subject_id) {
      const gsid = await resolveGradeSubjectFromSlug(supabase, chapterId)
      if (gsid) {
        await supabase.from('chapters').update({ grade_subject_id: gsid }).eq('id', existing.id)
      }
    }
    return existing.id
  }

  // Resolver grade_subject_id a partir do slug — sem isto, o chapter fica
  // invisível aos alunos (filtram por grade_subject_id em /api/content/chapters).
  const gradeSubjectId = await resolveGradeSubjectFromSlug(supabase, chapterId)

  const { data: created, error } = await supabase
    .from('chapters')
    .insert({
      slug: chapterId,
      title: fallbackTitle || chapterId,
      description: 'Auto-criado via editor de lições',
      display_order: 1,
      grade_subject_id: gradeSubjectId   // null se a relação ainda não existir seedada
    })
    .select('id')
    .single()

  if (error) {
    console.error('resolveChapterUuid: failed to create chapter for slug', chapterId, error)
    return null
  }
  return created.id
}

// Professores nunca publicam directamente — "Publicar" envia para a fila de
// revisão do admin ('pending_review'). Só um admin (painel Admin > Conteúdo)
// pode mudar o estado para 'published', que é o único estado visível aos
// estudantes (ver filtro em src/routes/content.ts).
function toSubmittableStatus(status: string): string {
  return status === 'published' ? 'pending_review' : status
}

creator.post('/lesson', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json()

  const {
    title,
    description = body.desc,
    content     = body.notes,
    chapter_id,
    chapter_title,                                 // útil quando chapter_id é slug
    video_duration = (body.duration || 0),
    video_id,
    video_url,
    thumbnail_url,
    is_free = false,
    display_order = body.order || 1,
    status: statusInput = 'draft',
    objectives
  } = body
  const status = toSubmittableStatus(statusInput)

  if (!title || title.length < 3) {
    return c.json({ success: false, error: 'Título obrigatório (mín. 3 caracteres)' }, 400)
  }
  if (!chapter_id) {
    return c.json({ success: false, error: 'Capítulo obrigatório' }, 400)
  }

  const supabase = createSupabaseClient(c.env)
  try {
    const resolvedChapterId = await resolveChapterUuid(supabase, chapter_id, chapter_title)
    if (!resolvedChapterId) {
      return c.json({ success: false, error: 'Não foi possível resolver capítulo. Tente outro.' }, 400)
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        title,
        description,
        content,
        chapter_id: resolvedChapterId,
        video_id,
        video_url,
        video_duration: typeof video_duration === 'number' ? video_duration : 0,
        thumbnail_url,
        is_free,
        display_order,
        status,
        created_by: user.id,
        objectives: Array.isArray(objectives) ? objectives : []
      })
      .select()
      .single()

    if (error) throw error
    return c.json({ success: true, data, message: 'Lição criada' }, 201)
  } catch (error: any) {
    console.error('Create lesson error:', error)
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
  const supabase = createSupabaseClient(c.env)

  try {
    // Verificar propriedade
    const { data: existing } = await supabase.from('lessons').select('id').eq('id', id).eq('created_by', user.id).single()
    if (!existing) return c.json({ success: false, error: 'Lição não encontrada ou sem permissão' }, 404)

    const {
      title,
      description = body.desc,
      content     = body.notes,
      video_duration = body.duration,
      video_id,
      video_url,
      thumbnail_url,
      is_free,
      display_order = body.order,
      status: statusInput,
      objectives
    } = body

    // Validações de publicação (o professor pede 'published'; o estado gravado
    // fica 'pending_review' — ver toSubmittableStatus)
    if (statusInput === 'published') {
      if (!title || title.length < 3) return c.json({ success: false, error: 'Título obrigatório para publicar' }, 400)
      if (!video_id && !video_url) return c.json({ success: false, error: 'Vídeo obrigatório para publicar' }, 400)
    }
    const status = statusInput !== undefined ? toSubmittableStatus(statusInput) : undefined

    // Construir payload só com campos definidos (evita NULL acidental)
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (title          !== undefined) patch.title          = title
    if (description    !== undefined) patch.description    = description
    if (content        !== undefined) patch.content        = content
    if (video_duration !== undefined) patch.video_duration = video_duration
    if (video_id       !== undefined) patch.video_id       = video_id
    if (video_url      !== undefined) patch.video_url      = video_url
    if (thumbnail_url  !== undefined) patch.thumbnail_url  = thumbnail_url
    if (is_free        !== undefined) patch.is_free        = is_free
    if (display_order  !== undefined) patch.display_order  = display_order
    if (status         !== undefined) patch.status         = status
    if (objectives     !== undefined) patch.objectives     = Array.isArray(objectives) ? objectives : []

    const { data, error } = await supabase
      .from('lessons')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return c.json({ success: true, data, message: 'Lição atualizada' })
  } catch (error: any) {
    console.error('Update lesson error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/creator/lesson/:id — Excluir lição
// ═════════════════════════════════════════════════════════════════════════════
creator.delete('/lesson/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')
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

  const supabase = createSupabaseClient(c.env)

  try {
    // Verificar propriedade
    const { data: lesson } = await supabase.from('lessons').select('id').eq('id', lessonId).eq('created_by', user.id).single()
    if (!lesson) return c.json({ success: false, error: 'Lição não encontrada ou sem permissão' }, 404)

    // Deletar exercícios antigos
    await supabase.from('exercises').delete().eq('lesson_id', lessonId)

    // Inserir novos
    const exInserts = exercises.map((ex, i) => ({
      lesson_id:     lessonId,
      question:      ex.question.trim(),
      explanation:   ex.explanation || '',
      display_order: i + 1,
      points:        ex.points || 10
    }))

    const { data: insertedEx, error: exError } = await supabase
      .from('exercises')
      .insert(exInserts)
      .select()

    if (exError) throw exError

    // Inserir opções
    const optInserts = (insertedEx ?? []).flatMap((ex: any, i: number) =>
      exercises[i].options.map((opt: string, oi: number) => ({
        exercise_id:   ex.id,
        option_text:   opt.trim(),
        is_correct:    oi === exercises[i].correct,
        display_order: oi + 1
      }))
    )

    if (optInserts.length > 0) {
      const { error: optError } = await supabase.from('exercise_options').insert(optInserts)
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
    return c.json({ success: true, data: MOCK, total: MOCK.length, page, limit })
  }

  const supabase = createSupabaseClient(c.env)

  try {
    // 1) Buscar todos os alunos registados (role='student')
    let usersQuery = supabase
      .from('users')
      .select('id, full_name, email, created_at', { count: 'exact' })
      .eq('role', 'student')
      .eq('is_active', true)

    if (search) {
      const safeSearch = search.replace(/[%,()]/g, '')
      if (safeSearch) usersQuery = usersQuery.or(`full_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
    }

    const { data: studentsRaw, count } = await usersQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const students = studentsRaw ?? []
    if (students.length === 0) return c.json({ success: true, data: [], total: count ?? 0, page, limit })

    // 2) Buscar lições do criador (para agregar progresso só nelas)
    const { data: lessons } = await supabase.from('lessons').select('id').eq('created_by', user.id)
    const lessonIds = (lessons ?? []).map((l: any) => l.id)

    // 3) Buscar progresso desses alunos nas lições do criador
    const studentIds = students.map((s: any) => s.id)
    let progressByStudent: Record<string, { sumPct: number; n: number; done: number; lastAt: number }> = {}

    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from('student_progress')
        .select('student_id, lesson_id, status, progress_percent, updated_at')
        .in('student_id', studentIds)
        .in('lesson_id', lessonIds)

      for (const p of progress ?? []) {
        const sid = (p as any).student_id
        const acc = progressByStudent[sid] ?? { sumPct: 0, n: 0, done: 0, lastAt: 0 }
        acc.sumPct += (p as any).progress_percent ?? 0
        acc.n += 1
        if ((p as any).status === 'completed') acc.done += 1
        const t = (p as any).updated_at ? new Date((p as any).updated_at).getTime() : 0
        if (t > acc.lastAt) acc.lastAt = t
        progressByStudent[sid] = acc
      }
    }

    // 4) Pontuação média a partir de exercise_submissions (todas as submissões do aluno)
    const scoreByStudent: Record<string, { correct: number; total: number }> = {}
    {
      const { data: subs } = await supabase
        .from('exercise_submissions')
        .select('student_id, is_correct')
        .in('student_id', studentIds)
      for (const s of subs ?? []) {
        const sid = (s as any).student_id
        const acc = scoreByStudent[sid] ?? { correct: 0, total: 0 }
        acc.total += 1
        if ((s as any).is_correct) acc.correct += 1
        scoreByStudent[sid] = acc
      }
    }

    const now = Date.now()
    const data = students.map((s: any) => {
      const p = progressByStudent[s.id]
      const sc = scoreByStudent[s.id]
      const progress = p && p.n ? Math.round(p.sumPct / p.n) : 0
      const score = sc && sc.total ? Math.round((sc.correct / sc.total) * 100) : 0
      const lastTs = p?.lastAt || (s.created_at ? new Date(s.created_at).getTime() : 0)
      const daysAgo = lastTs ? Math.max(0, Math.floor((now - lastTs) / 86400000)) : 999
      return {
        user_id: s.id,
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        progress_percent: progress,
        score,
        lessons_done: p?.done ?? 0,
        last_active: `${daysAgo} dias atrás`,
      }
    })

    return c.json({ success: true, data, total: count ?? data.length, page, limit })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// Sessões Online (Google Meet)
//
//  POST   /api/creator/session      → marcar sessão para um capítulo (curso)
//  GET    /api/creator/sessions     → listar sessões marcadas pelo professor
//  DELETE /api/creator/session/:id  → cancelar sessão
//
// O professor cola o link de uma reunião já criada no Google Meet — a
// plataforma não integra com a Google Calendar API. Ao marcar, todos os
// alunos com progresso registado nas lições do capítulo (mesma definição
// de "meus alunos" usada em GET /api/creator/students) são inscritos como
// destinatários e passam a ver a sessão no dashboard e nas notificações.
// ═════════════════════════════════════════════════════════════════════════════
const MEET_LINK_RE = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i

creator.post('/session', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json().catch(() => ({})) as any
  const { chapter_id, description = '', duration_minutes = 60 } = body
  const title       = (body.title || '').trim()
  const meetLink    = (body.meet_link || '').trim()
  const scheduledAt = body.scheduled_at

  if (!chapter_id) return c.json({ success: false, error: 'Capítulo (curso) obrigatório' }, 400)
  if (!title || title.length < 3) return c.json({ success: false, error: 'Título obrigatório (mín. 3 caracteres)' }, 400)
  if (!scheduledAt || isNaN(Date.parse(scheduledAt))) return c.json({ success: false, error: 'Data e hora inválidas' }, 400)
  if (new Date(scheduledAt).getTime() < Date.now() - 60_000) {
    return c.json({ success: false, error: 'A data da sessão deve ser no futuro' }, 400)
  }
  if (!MEET_LINK_RE.test(meetLink)) {
    return c.json({ success: false, error: 'Link inválido. Cole um link do Google Meet (ex: https://meet.google.com/abc-defg-hij)' }, 400)
  }

  const supabase = createSupabaseClient(c.env)
  try {
    // Verificar propriedade do capítulo
    const { data: chapter } = await supabase
      .from('chapters').select('id, title').eq('id', chapter_id).eq('created_by', user.id).maybeSingle()
    if (!chapter) return c.json({ success: false, error: 'Capítulo não encontrado ou sem permissão' }, 404)

    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({
        creator_id: user.id,
        chapter_id,
        title,
        description: description?.trim() || null,
        meet_link: meetLink,
        scheduled_at: scheduledAt,
        duration_minutes: Number(duration_minutes) > 0 ? Number(duration_minutes) : 60
      })
      .select()
      .single()
    if (error) throw error

    // Alunos "inscritos" no curso: têm progresso nas lições deste capítulo
    const { data: lessons } = await supabase.from('lessons').select('id').eq('chapter_id', chapter_id)
    const lessonIds = (lessons ?? []).map((l: any) => l.id)

    let studentIds: string[] = []
    if (lessonIds.length > 0) {
      const { data: progress } = await supabase
        .from('student_progress').select('student_id').in('lesson_id', lessonIds)
      studentIds = [...new Set((progress ?? []).map((p: any) => p.student_id))]
    }

    if (studentIds.length > 0) {
      const { error: recError } = await supabase
        .from('live_session_recipients')
        .insert(studentIds.map((sid) => ({ session_id: session.id, student_id: sid })))
      if (recError) throw recError
    }

    return c.json({
      success: true,
      data: { ...session, chapter_title: chapter.title, students_notified: studentIds.length },
      message: studentIds.length > 0
        ? `Sessão marcada e link partilhado com ${studentIds.length} aluno${studentIds.length > 1 ? 's' : ''}.`
        : 'Sessão marcada. Ainda não há alunos com progresso registado neste capítulo para notificar.'
    }, 201)
  } catch (error: any) {
    console.error('Create session error:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

creator.get('/sessions', async (c) => {
  const user = c.get('user') as any
  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('id, title, description, meet_link, scheduled_at, duration_minutes, status, created_at, chapters(title)')
      .eq('creator_id', user.id)
      .order('scheduled_at', { ascending: true })
    if (error) throw error

    const ids = (data ?? []).map((s: any) => s.id)
    const countBySession: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: recips } = await supabase
        .from('live_session_recipients').select('session_id').in('session_id', ids)
      for (const r of recips ?? []) {
        const sid = (r as any).session_id
        countBySession[sid] = (countBySession[sid] ?? 0) + 1
      }
    }

    const normalized = (data ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      meet_link: s.meet_link,
      scheduled_at: s.scheduled_at,
      duration_minutes: s.duration_minutes,
      status: s.status,
      chapter_title: s.chapters?.title || '—',
      students_notified: countBySession[s.id] ?? 0,
      created_at: s.created_at
    }))

    return c.json({ success: true, data: normalized })
  } catch (error: any) {
    console.error('List sessions error:', error)
    return c.json({ success: false, error: error.message || 'DB error' }, 500)
  }
})

creator.delete('/session/:id', async (c) => {
  const user = c.get('user') as any
  const id   = c.req.param('id')
  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('creator_id', user.id)
      .select()
      .maybeSingle()
    if (error) throw error
    if (!data) return c.json({ success: false, error: 'Sessão não encontrada' }, 404)
    return c.json({ success: true, message: 'Sessão cancelada' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/creator/chapter — Criar novo capítulo
// ═════════════════════════════════════════════════════════════════════════════
creator.post('/chapter', async (c) => {
  const user = c.get('user') as any
  const body = await c.req.json()
  const title = (body.title || body.name || '').trim()
  let { grade_subject_id, trimester, description, subject_slug, slug } = body

  if (!title || title.length < 2) {
    return c.json({ success: false, error: 'Título do capítulo obrigatório (mín. 2 caracteres)' }, 400)
  }

  const supabase = createSupabaseClient(c.env)

  // Resolver grade_subject_id a partir de subject_slug (ex: "mz10mat") se não fornecido
  if (!grade_subject_id && subject_slug) {
    const resolved = await resolveGradeSubjectFromSlug(supabase, `${subject_slug}-`)
    if (resolved) grade_subject_id = resolved
  }

  // Columns available since migration 010 (created_by, trimester, updated_at).
  // If the migration has not run yet, a retry without those columns is attempted.
  const buildInsert = (withExtras: boolean): any => {
    const obj: any = { title, description: description || '', display_order: 1 }
    if (grade_subject_id) obj.grade_subject_id = grade_subject_id
    if (slug) obj.slug = slug
    if (withExtras) {
      obj.created_by = user.id
      obj.trimester  = trimester || 1
    }
    return obj
  }

  try {
    let { data, error } = await supabase.from('chapters').insert(buildInsert(true)).select().single()

    if (error?.message?.includes("created_by") || error?.message?.includes("trimester")) {
      // Migration 010 not yet applied — retry without those columns
      const res = await supabase.from('chapters').insert(buildInsert(false)).select().single()
      data  = res.data
      error = res.error
    }

    if (error) throw error
    return c.json({ success: true, data, message: 'Capítulo criado com sucesso!' }, 201)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/creator/chapters — Listar capítulos criados pelo professor
// ═════════════════════════════════════════════════════════════════════════════
creator.get('/chapters', async (c) => {
  const user = c.get('user') as any
  const supabase = createSupabaseClient(c.env)

  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, title, slug, description, display_order, grade_subject_id, trimester, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return c.json({ success: true, data: data ?? [] })
  } catch (error: any) {
    console.error('List chapters error:', error)
    return c.json({ success: false, error: error.message || 'DB error' }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/creator/chapter/:id — Atualizar capítulo
// ═════════════════════════════════════════════════════════════════════════════
creator.put('/chapter/:id', async (c) => {
  const user = c.get('user') as any
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = createSupabaseClient(c.env)

  const patch: any = {}
  if (body.title !== undefined)         patch.title         = String(body.title).trim()
  if (body.description !== undefined)   patch.description   = body.description
  if (body.display_order !== undefined) patch.display_order = body.display_order

  try {
    const { data, error } = await supabase
      .from('chapters').update(patch).eq('id', id).eq('created_by', user.id).select().maybeSingle()

    if (error) throw error
    if (!data) return c.json({ success: false, error: 'Capítulo não encontrado' }, 404)
    return c.json({ success: true, data, message: 'Capítulo atualizado' })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/creator/chapter/:id — Eliminar capítulo (apenas se sem lições)
// ═════════════════════════════════════════════════════════════════════════════
creator.delete('/chapter/:id', async (c) => {
  const user = c.get('user') as any
  const id = c.req.param('id')
  const supabase = createSupabaseClient(c.env)

  try {
    const { count } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', id)
    if ((count ?? 0) > 0) {
      return c.json({ success: false, error: 'Capítulo tem lições. Elimine-as primeiro.' }, 409)
    }

    const { error } = await supabase.from('chapters').delete().eq('id', id).eq('created_by', user.id)
    if (error) throw error
    return c.json({ success: true, message: 'Capítulo eliminado' })
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
  const body = await c.req.json().catch(() => ({}))
  const { filename = 'video.mp4', title = 'Nova Lição' } = body

  const apiKey    = c.env?.BUNNY_API_KEY    || ''
  const libraryId = c.env?.BUNNY_LIBRARY_ID || ''

  if (!apiKey || !libraryId) {
    return c.json({ success: false, error: 'Bunny.net não configurado (BUNNY_API_KEY / BUNNY_LIBRARY_ID em falta)' }, 503)
  }

  // ── Criar vídeo no Bunny + devolver credenciais TUS assinadas ──
  // A master API key NUNCA é exposta ao browser. Em vez disso, devolvemos
  // uma assinatura HMAC com escopo (videoId × expiração) — só permite upload
  // daquele vídeo específico durante 24h.
  try {
    const videoId = await createBunnyVideo(apiKey, libraryId, title || filename)
    const tus = await buildBunnyTusCredentials(apiKey, libraryId, videoId)

    return c.json({
      success: true,
      demo: false,
      data: {
        videoId,
        title,
        filename,
        upload: {
          // Endpoint TUS oficial Bunny.net Stream
          endpoint: tus.endpoint,
          // Bunny exige a autenticação como HTTP headers (não como Upload-Metadata)
          headers: {
            AuthorizationSignature: tus.authorizationSignature,
            AuthorizationExpire:    String(tus.authorizationExpire),
            VideoId:                tus.videoId,
            LibraryId:              tus.libraryId
          },
          // Properties do vídeo vão em TUS Upload-Metadata
          metadata: {
            filetype: 'video/mp4',
            title:    title || filename
          },
          expiresAt: tus.expiresAtIso
        }
      }
    })
  } catch (err: any) {
    console.error('upload-url error:', err)
    return c.json({ success: false, error: err.message || 'Bunny upload error' }, 502)
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
  if (!bunnyApiKey || !bunnyLibraryId) {
    return c.json({ success: false, error: 'Bunny.net não configurado' }, 503)
  }

  try {
    const res = await fetch(
      `https://video.bunnycdn.com/library/${bunnyLibraryId}/videos/${videoId}`,
      { headers: { AccessKey: bunnyApiKey, Accept: 'application/json' } }
    )
    if (!res.ok) return c.json({ success: false, error: 'Vídeo não encontrado no Bunny.net' }, 404)

    const v = await res.json() as any
    // Bunny Stream status oficial:
    // 0=Created 1=Uploaded 2=Processing 3=Transcoding 4=Finished(ready)
    // 5=Error 6=UploadFailed 7=JitSegmenting 8=JitPlaylistsCreated
    const statusMap: Record<number, string> = {
      0: 'created', 1: 'uploading', 2: 'processing',
      3: 'transcoding', 4: 'ready', 5: 'error', 6: 'error',
      7: 'transcoding', 8: 'ready'
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

  // MVP — sem alunos pagantes reais ainda
  const AVG_SUBSCRIPTION_MZN = 130
  const PAID_STUDENTS_BASE = 0

  // Dados por período — MVP: todos zeros (pagamento não activado)
  const zeroPeriods7d  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(l => ({ label: l, gross: 0, commission: 0, students: 0 }))
  const zeroPeriods4w  = [1,2,3,4].map(w => ({ label: `Sem ${w}`, gross: 0, commission: 0, students: 0 }))
  const zeroPeriods3m  = ['Mês 1','Mês 2','Mês 3'].map(l => ({ label: l, gross: 0, commission: 0, students: 0 }))
  const zeroPeriods12m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(l => ({ label: l, gross: 0, commission: 0, students: 0 }))
  const zeroPeriodsTri = ['2025 T1','2025 T2','2025 T3','2025 T4','2026 T1'].map(l => ({ label: l, gross: 0, commission: 0, students: 0 }))

  const PERIOD_DATA: Record<string, {
    paid_students: number, avg_watch_min: number, completions: number,
    total_gross_mzn: number, periods: { label: string, gross: number, commission: number, students: number }[]
  }> = {
    '7d':  { paid_students: 0, avg_watch_min: 0, completions: 0, total_gross_mzn: 0, periods: zeroPeriods7d  },
    '30d': { paid_students: 0, avg_watch_min: 0, completions: 0, total_gross_mzn: 0, periods: zeroPeriods4w  },
    '90d': { paid_students: 0, avg_watch_min: 0, completions: 0, total_gross_mzn: 0, periods: zeroPeriods3m  },
    '12m': { paid_students: 0, avg_watch_min: 0, completions: 0, total_gross_mzn: 0, periods: zeroPeriods12m },
    'all': { paid_students: 0, avg_watch_min: 0, completions: 0, total_gross_mzn: 0, periods: zeroPeriodsTri },
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

// ═════════════════════════════════════════════════════════════════════════════
// BIBLIOTECA DIGITAL — Endpoints do Professor
//
//  GET  /api/creator/library              → lista os materiais do professor
//  POST /api/creator/library              → submeter apostila/exercício
//  GET  /api/creator/library/:id          → detalhe para edição
//  PUT  /api/creator/library/:id          → actualizar rascunho
//  DELETE /api/creator/library/:id        → apagar rascunho
//  POST /api/creator/library/:id/submit   → enviar para revisão
// ═════════════════════════════════════════════════════════════════════════════

const LIBRARY_SELECT = `
  id, title, description, author, category,
  subject_id, grade_id, file_url, file_size_kb, pages, cover_url,
  downloads_count, is_featured, status, rejection_reason,
  created_at, updated_at,
  subjects:subject_id ( id, name, color ),
  grades:grade_id     ( id, name, level )
`

// GET /api/creator/library
creator.get('/library', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const status   = c.req.query('status') || ''
  const category = c.req.query('category') || ''
  const page  = Math.max(1, parseInt(c.req.query('page')  || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '20')))
  const from  = (page - 1) * limit

  let query = supabase
    .from('library_items')
    .select(LIBRARY_SELECT, { count: 'exact' })
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1)

  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category', category)

  const { data, error, count } = await query
  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({
    success: true,
    data: {
      items: data || [],
      pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) }
    }
  })
})

// POST /api/creator/library — criar rascunho
creator.post('/library', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const body     = await c.req.json().catch(() => ({}))

  const { title, description, category, subject_id, grade_id,
          file_url, file_size_kb, pages, cover_url } = body

  if (!title?.trim())    return c.json({ success: false, error: 'Título obrigatório' }, 400)
  if (!category)         return c.json({ success: false, error: 'Categoria obrigatória (books|handouts|exercises)' }, 400)
  if (!['handouts', 'exercises'].includes(category))
    return c.json({ success: false, error: 'Professores só podem criar apostilas ou exercícios' }, 403)

  const { data, error } = await supabase
    .from('library_items')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      author: user.full_name || user.email,
      category,
      subject_id:    subject_id    || null,
      grade_id:      grade_id      || null,
      file_url:      file_url      || null,
      file_size_kb:  file_size_kb  || null,
      pages:         pages         || null,
      cover_url:     cover_url     || null,
      status:        'draft',
      created_by:    user.id,
    })
    .select(LIBRARY_SELECT)
    .single()

  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({ success: true, data }, 201)
})

// GET /api/creator/library/:id
creator.get('/library/:id', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const id       = c.req.param('id')

  const { data, error } = await supabase
    .from('library_items')
    .select(LIBRARY_SELECT)
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (error || !data) return c.json({ success: false, error: 'Material não encontrado' }, 404)

  return c.json({ success: true, data })
})

// PUT /api/creator/library/:id — actualizar (só em draft ou rejected)
creator.put('/library/:id', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const id       = c.req.param('id')
  const body     = await c.req.json().catch(() => ({}))

  const { data: existing } = await supabase
    .from('library_items')
    .select('id, status, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!existing) return c.json({ success: false, error: 'Material não encontrado' }, 404)
  if (!['draft', 'rejected'].includes(existing.status))
    return c.json({ success: false, error: 'Só é possível editar rascunhos ou materiais rejeitados' }, 400)

  const allowed = ['title','description','category','subject_id','grade_id',
                   'file_url','file_size_kb','pages','cover_url']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (existing.status === 'rejected') updates.status = 'draft'
  updates.rejection_reason = null

  const { data, error } = await supabase
    .from('library_items')
    .update(updates)
    .eq('id', id)
    .select(LIBRARY_SELECT)
    .single()

  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({ success: true, data })
})

// DELETE /api/creator/library/:id — rascunhos e materiais rejeitados
creator.delete('/library/:id', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const id       = c.req.param('id')

  const { data: existing } = await supabase
    .from('library_items')
    .select('id, status, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!existing) return c.json({ success: false, error: 'Material não encontrado' }, 404)
  if (!['draft', 'rejected'].includes(existing.status))
    return c.json({ success: false, error: 'Só é possível eliminar rascunhos ou materiais rejeitados' }, 400)

  const { error } = await supabase
    .from('library_items')
    .delete()
    .eq('id', id)

  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({ success: true, data: null })
})

// POST /api/creator/library/upload — upload de PDF para Supabase Storage
creator.post('/library/upload', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ success: false, error: 'Corpo inválido — envie multipart/form-data' }, 400)
  }

  const file = formData.get('file') as File | null
  if (!file || !file.name) return c.json({ success: false, error: 'Ficheiro não encontrado no pedido' }, 400)

  const allowed = ['application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                   'application/vnd.ms-excel',
                   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                   'application/vnd.ms-powerpoint',
                   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                   'image/jpeg', 'image/png',
                   'application/zip', 'application/x-zip-compressed']
  if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|zip)$/i))
    return c.json({ success: false, error: 'Tipo de ficheiro não suportado' }, 400)

  // Tecto do bucket 'vclass-library' no Supabase (limite global de upload do projecto) — manter em sincronia
  const MAX_MB = 50
  if (file.size > MAX_MB * 1024 * 1024)
    return c.json({ success: false, error: `Ficheiro demasiado grande (máx ${MAX_MB} MB)` }, 400)

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/_{2,}/g, '_')
  const path     = `library/teachers/${user.id}/${Date.now()}_${safeName}`

  const buffer = await file.arrayBuffer()

  // Nº de páginas real, extraído do ficheiro (não confiar em input manual do utilizador)
  const pages = await extractPageCount(buffer, file.type, file.name)

  const { error: upErr } = await supabase.storage
    .from('vclass-library')
    .upload(path, buffer, { contentType: file.type || 'application/pdf', upsert: false })

  if (upErr) return c.json({ success: false, error: upErr.message }, 500)

  const { data: urlData } = supabase.storage.from('vclass-library').getPublicUrl(path)

  return c.json({
    success: true,
    data: {
      url:           urlData.publicUrl,
      path,
      size_kb:       Math.round(file.size / 1024),
      pages,
      original_name: file.name,
    }
  }, 201)
})

// GET /api/creator/curriculum — disciplinas e classes (para selectors nos modals)
creator.get('/curriculum', async (c) => {
  const supabase = createSupabaseClient(c.env)
  const [subjectsRes, gradesRes] = await Promise.all([
    supabase.from('subjects').select('id, name, color').order('name'),
    supabase.from('grades').select('id, name, level, display_order').order('display_order'),
  ])
  return c.json({
    success: true,
    data: {
      subjects: subjectsRes.data || [],
      grades:   gradesRes.data   || [],
    },
  })
})

// POST /api/creator/library/:id/submit — enviar para revisão
creator.post('/library/:id/submit', async (c) => {
  const user     = c.get('user') as any
  const supabase = createSupabaseClient(c.env)
  const id       = c.req.param('id')

  const { data: existing } = await supabase
    .from('library_items')
    .select('id, title, file_url, status, created_by')
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!existing) return c.json({ success: false, error: 'Material não encontrado' }, 404)
  if (!['draft', 'rejected'].includes(existing.status))
    return c.json({ success: false, error: 'Apenas rascunhos podem ser submetidos' }, 400)
  if (!existing.title?.trim())
    return c.json({ success: false, error: 'Título obrigatório antes de submeter' }, 400)
  if (!existing.file_url)
    return c.json({ success: false, error: 'É necessário carregar o ficheiro antes de submeter' }, 400)

  const { data, error } = await supabase
    .from('library_items')
    .update({ status: 'pending_review', rejection_reason: null })
    .eq('id', id)
    .select(LIBRARY_SELECT)
    .single()

  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({ success: true, data })
})

export default creator
