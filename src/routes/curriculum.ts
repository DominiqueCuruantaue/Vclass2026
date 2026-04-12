// ============================================================
//  VClass — Rota /api/curriculum
//  Fornece dados curriculares por país, nível, classe e disciplina
//  POLÍTICA: todos os endpoints exigem autenticação
// ============================================================
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
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

const curriculum = new Hono()

// ── Todos os endpoints do currículo exigem sessão autenticada ────────────────
curriculum.use('/*', authMiddleware)

// GET /api/curriculum/countries
curriculum.get('/countries', (c) => {
  return c.json({ success: true, data: getCountries() })
})

// GET /api/curriculum/countries/:countryId/levels
curriculum.get('/countries/:countryId/levels', (c) => {
  const { countryId } = c.req.param()
  const levels = getLevelsByCountry(countryId)
  if (!levels.length) return c.json({ success: false, error: 'País não encontrado' }, 404)
  return c.json({ success: true, data: levels })
})

// GET /api/curriculum/levels/:levelId/grades
curriculum.get('/levels/:levelId/grades', (c) => {
  const { levelId } = c.req.param()
  const grades = getGradesByLevel(levelId)
  return c.json({ success: true, data: grades })
})

// GET /api/curriculum/grades/:gradeId/subjects
curriculum.get('/grades/:gradeId/subjects', (c) => {
  const { gradeId } = c.req.param()
  const subjects = getSubjectsByGrade(gradeId)
  return c.json({ success: true, data: subjects })
})

// GET /api/curriculum/subjects/:subjectId/chapters?term=1
curriculum.get('/subjects/:subjectId/chapters', (c) => {
  const { subjectId } = c.req.param()
  const term = c.req.query('term') ? parseInt(c.req.query('term')!) : undefined
  const chapters = getChaptersBySubject(subjectId, term)
  return c.json({ success: true, data: chapters })
})

// GET /api/curriculum/tree/:countryId  — árvore completa
curriculum.get('/tree/:countryId', (c) => {
  const { countryId } = c.req.param()
  const country = COUNTRIES.find(ct => ct.id === countryId)
  if (!country) return c.json({ success: false, error: 'País não encontrado' }, 404)
  return c.json({ success: true, data: { country, curriculum: getCurriculumTree(countryId) } })
})

// GET /api/curriculum/search?q=newton&countryId=mz
curriculum.get('/search', (c) => {
  const q = (c.req.query('q') || '').toLowerCase()
  const countryId = c.req.query('countryId')
  if (!q || q.length < 2) return c.json({ success: false, error: 'Termo muito curto' }, 400)

  let chapters = CHAPTERS
  if (countryId) {
    // Filtrar capítulos pelo país
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

// GET /api/curriculum/full — JSON completo de todos os currículos (para o frontend)
curriculum.get('/full', (c) => {
  const tree = COUNTRIES
    .filter(ct => ct.is_active)
    .map(country => ({
      ...country,
      levels: getLevelsByCountry(country.id).map(level => ({
        ...level,
        grades: getGradesByLevel(level.id).map(grade => ({
          ...grade,
          subjects: getSubjectsByGrade(grade.id).map(subject => ({
            ...subject,
            chapters: getChaptersBySubject(subject.id),
          })),
        })),
      })),
    }))
  return c.json({ success: true, data: tree })
})

export default curriculum
