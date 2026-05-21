// ============================================================
//  VClass — Rota /api/curriculum
//  Fornece dados curriculares por país, nível, classe e disciplina
//  POLÍTICA:
//    - Endpoints de leitura pública (GET /full, /countries, /tree, /search) → SEM auth
//    - Endpoints detalhados (/levels, /grades, /subjects, /chapters) → COM auth
// ============================================================
import { Hono } from 'hono'
import type { CloudflareBindings } from '../types/bindings'
import { authMiddleware } from '../middleware/auth'
import { getSupabase } from '../config/supabase'
import {
  getCountries,
  getLevelsByCountry,
  getGradesByLevel,
  getSubjectsByGrade,
  getChaptersBySubject,
  getCurriculumTree,
  COUNTRIES,
  EDUCATION_LEVELS,
  GRADES,
  SUBJECTS,
  CHAPTERS,
} from '../data/curriculum'

// Mescla capítulos persistidos no DB (criados por professores) na árvore
// curricular estática.
//
// O slug de capítulo segue o padrão `${subjectId}-${ts}` onde `subjectId`
// pode conter hífen (ex.: `mz12-mat-1762…`). MAS a página de Conteúdos
// deduplica disciplinas por NOME (mostra uma só "Matemática" para todas as
// classes) e atribui o id da primeira classe vista — então um capítulo
// criado para "Matemática" pode receber slug `mz10-mat-…` mesmo quando o
// criador o associou mentalmente à 12ª.
//
// Para isso o matching é feito em duas etapas:
//   1) Extrair do slug a parte que coincida com um id de disciplina estática.
//   2) Adicionar esse capítulo a TODAS as disciplinas da árvore que tenham
//      o mesmo NOME (independente da classe).
// Injecta disciplinas criadas via /admin (que vivem em `subjects` + `grade_subjects`)
// na árvore curricular estática, ligando-as à classe pelo nome (ex: "12ª Classe").
//
// Estratégia: fazer match por (countryName + gradeName) sempre que possível;
// se o country não bater, anexar a todas as classes com o mesmo nome — mesmo
// dedup pragmático que já existe no merge de chapters.
async function mergeDbSubjectsIntoTree(env: any, tree: any[]) {
  const supabase = getSupabase(env)
  if (!supabase) return tree
  try {
    const { data, error } = await supabase
      .from('grade_subjects')
      .select('id, grade_id, is_mandatory, workload_hours, subjects(id, name, description, color, icon_url), grades(name, education_systems(countries(name)))')
    if (error || !Array.isArray(data) || !data.length) return tree

    // Indexar grades estáticas por (countryName|gradeName) e por gradeName
    const gradesByCountryGrade: Record<string, any[]> = {}
    const gradesByGrade:        Record<string, any[]> = {}
    for (const country of tree) {
      const cn = String(country.name || '').toLowerCase().trim()
      for (const level of (country.levels || [])) {
        for (const grade of (level.grades || [])) {
          const gn = String(grade.name || '').toLowerCase().trim()
          ;(gradesByCountryGrade[`${cn}|${gn}`] = gradesByCountryGrade[`${cn}|${gn}`] || []).push(grade)
          ;(gradesByGrade[gn] = gradesByGrade[gn] || []).push(grade)
        }
      }
    }

    for (const gs of data) {
      const subj = (gs as any).subjects
      const gr   = (gs as any).grades
      if (!subj || !gr) continue
      const gradeName   = String(gr.name || '').toLowerCase().trim()
      const countryName = String(gr.education_systems?.countries?.name || '').toLowerCase().trim()
      const targets =
        gradesByCountryGrade[`${countryName}|${gradeName}`] ||
        gradesByGrade[gradeName] ||
        []
      if (!targets.length) continue

      for (const targetGrade of targets) {
        const list = targetGrade.subjects || (targetGrade.subjects = [])
        // Evitar duplicar: se já existe disciplina (estática ou de BD) com mesmo nome, skip
        const dupe = list.some((s: any) => String(s.name || '').toLowerCase().trim() === String(subj.name || '').toLowerCase().trim())
        if (dupe) continue
        list.push({
          id: subj.id,
          gradeId: targetGrade.id,
          name: subj.name,
          shortName: String(subj.name || '').slice(0, 3).toUpperCase(),
          icon: 'fa-book',
          color: subj.color || '#3B82F6',
          description: subj.description || '',
          displayOrder: 999,
          chapters: [],
          fromDb: true,
        })
      }
    }
  } catch (e) {
    console.warn('mergeDbSubjectsIntoTree failed:', e)
  }
  return tree
}

async function mergeDbChaptersIntoTree(env: any, tree: any[]) {
  const supabase = getSupabase(env)
  if (!supabase) return tree
  try {
    const { data: dbChapters, error } = await supabase
      .from('chapters')
      .select('id, title, slug, description, display_order, trimester, grade_subject_id, created_at')
      .order('display_order', { ascending: true })
    if (error || !Array.isArray(dbChapters) || !dbChapters.length) return tree

    // Achatar disciplinas e indexar por nome
    const allSubjects: any[] = []
    const subjectsByName: Record<string, any[]> = {}
    for (const level of tree) {
      for (const grade of (level.grades || [])) {
        for (const subject of (grade.subjects || [])) {
          allSubjects.push(subject)
          const key = String(subject.name || '').toLowerCase().trim()
          if (key) (subjectsByName[key] = subjectsByName[key] || []).push(subject)
        }
      }
    }

    for (const ch of dbChapters) {
      const slug = String(ch.slug || '').toLowerCase()
      if (!slug) continue

      // Encontrar a disciplina cujo id estático é prefixo do slug.
      // Aplicar APENAS a essa disciplina (classe específica) — broadcast por nome
      // causava que uma lição de "Biologia 12ª" aparecesse em todas as classes.
      const seed = allSubjects.find(s => slug.startsWith(String(s.id).toLowerCase() + '-'))
      const targets = seed ? [seed] : []

      if (!targets.length) continue

      const mapped = {
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description || '',
        displayOrder: ch.display_order ?? 999,
        term: ch.trimester ?? null,
        trimester: ch.trimester ?? null,
        fromDb: true,
      }

      for (const target of targets) {
        const existing = target.chapters || (target.chapters = [])
        if (!existing.some((c: any) => c.id === mapped.id)) {
          existing.push({ ...mapped, subjectId: target.id })
        }
      }
    }
  } catch (e) {
    console.warn('mergeDbChaptersIntoTree failed:', e)
  }
  return tree
}

const curriculum = new Hono<{ Bindings: CloudflareBindings }>()

// ── Endpoints PÚBLICOS (sem autenticação) ────────────────────────────────────

// GET /api/curriculum/countries — lista países disponíveis (público)
curriculum.get('/countries', (c) => {
  return c.json({ success: true, data: getCountries() })
})

function clearStaticChapters(levels: any[]) {
  levels.flatMap((l: any) => l.grades || [])
        .flatMap((g: any) => g.subjects || [])
        .forEach((s: any) => { s.chapters = [] })
}

async function buildCountryTree(env: any, country: any) {
  const levels = getCurriculumTree(country.id)
  await mergeDbSubjectsIntoTree(env, [{ name: country.name, levels }])
  clearStaticChapters(levels)
  await mergeDbChaptersIntoTree(env, levels)
  return levels
}

// GET /api/curriculum/full — JSON completo de todos os currículos (para browse.html)
curriculum.get('/full', async (c) => {
  const countries = COUNTRIES.filter(ct => ct.is_active)
  const tree = await Promise.all(
    countries.map(async country => ({
      ...country,
      levels: await buildCountryTree(c.env, country),
    }))
  )
  return c.json({ success: true, data: tree })
})

// GET /api/curriculum/tree/:countryId — árvore completa de um país (público)
curriculum.get('/tree/:countryId', async (c) => {
  const { countryId } = c.req.param()
  const country = COUNTRIES.find(ct => ct.id === countryId)
  if (!country) return c.json({ success: false, error: 'País não encontrado' }, 404)
  const curriculum = await buildCountryTree(c.env, country)
  return c.json({ success: true, data: { country, curriculum } })
})

// GET /api/curriculum/search?q=newton&countryId=mz (público)
curriculum.get('/search', (c) => {
  const q = (c.req.query('q') || '').toLowerCase()
  const countryId = c.req.query('countryId')
  if (!q || q.length < 2) return c.json({ success: false, error: 'Termo muito curto' }, 400)

  let chapters = CHAPTERS
  if (countryId) {
    const gradeIds = GRADES
      .filter(g => EDUCATION_LEVELS.some(l => l.id === g.levelId && l.countryId === countryId))
      .map(g => g.id)
    const subjectIds = SUBJECTS.filter(s => gradeIds.includes(s.gradeId)).map(s => s.id)
    chapters = CHAPTERS.filter(c => subjectIds.includes(c.subjectId))
  }

  const results = chapters
    .filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    .slice(0, 20)
    .map(ch => {
      const subject = SUBJECTS.find(s => s.id === ch.subjectId)
      const grade   = subject ? GRADES.find(g => g.id === subject.gradeId) : null
      const level   = grade ? EDUCATION_LEVELS.find(l => l.id === grade.levelId) : null
      const country = level ? COUNTRIES.find(ct => ct.id === level.countryId) : null
      return {
        ...ch,
        subject: subject ? { id: subject.id, name: subject.name, icon: subject.icon, color: subject.color } : null,
        grade:   grade   ? { id: grade.id, name: grade.name } : null,
        level:   level   ? { id: level.id, name: level.name } : null,
        country: country ? { id: country.id, name: country.name, flag: country.flag } : null,
      }
    })

  return c.json({ success: true, count: results.length, data: results })
})

// ── Endpoints AUTENTICADOS (requerem sessão) ─────────────────────────────────

// GET /api/curriculum/countries/:countryId/levels
curriculum.get('/countries/:countryId/levels', authMiddleware, (c) => {
  const { countryId } = c.req.param()
  const levels = getLevelsByCountry(countryId)
  if (!levels.length) return c.json({ success: false, error: 'País não encontrado' }, 404)
  return c.json({ success: true, data: levels })
})

// GET /api/curriculum/levels/:levelId/grades
curriculum.get('/levels/:levelId/grades', authMiddleware, (c) => {
  const { levelId } = c.req.param()
  const grades = getGradesByLevel(levelId)
  return c.json({ success: true, data: grades })
})

// GET /api/curriculum/grades/:gradeId/subjects
curriculum.get('/grades/:gradeId/subjects', authMiddleware, (c) => {
  const { gradeId } = c.req.param()
  const subjects = getSubjectsByGrade(gradeId)
  return c.json({ success: true, data: subjects })
})

// GET /api/curriculum/subjects/:subjectId/chapters?term=1
curriculum.get('/subjects/:subjectId/chapters', authMiddleware, (c) => {
  const { subjectId } = c.req.param()
  const term = c.req.query('term') ? parseInt(c.req.query('term')!) : undefined
  const chapters = getChaptersBySubject(subjectId, term)
  return c.json({ success: true, data: chapters })
})

export default curriculum
