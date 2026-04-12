// ============================================================
//  VClass — Rota de Busca Global
//  GET /api/search?q=termo&country=mz&type=all
//  Busca em: capítulos do currículo, lições (mock), biblioteca
// ============================================================
import { Hono } from 'hono'
import {
  COUNTRIES,
  EDUCATION_LEVELS,
  GRADES,
  SUBJECTS,
  CHAPTERS
} from '../data/curriculum'
import { mockLessons } from '../middleware/database'

const search = new Hono()

// Normaliza string para comparação (remove acentos, lowercase)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Calcula score de relevância (0–100)
function relevance(text: string, query: string): number {
  const t = normalize(text)
  const q = normalize(query)
  if (t === q) return 100
  if (t.startsWith(q)) return 90
  if (t.includes(q)) return 70
  // Palavras individuais
  const words = q.split(/\s+/)
  const matched = words.filter(w => t.includes(w)).length
  return Math.round((matched / words.length) * 50)
}

// ── Biblioteca estática (livros de apoio) ──────────────────
const LIBRARY_BOOKS = [
  { id:'lib-1', title:'Matemática 10ª Classe', author:'INDE Moçambique', subject:'Matemática', pages:320, country:'mz', tags:['algebra','funções','geometria'] },
  { id:'lib-2', title:'Física 11ª Classe', author:'INDE Moçambique', subject:'Física', pages:280, country:'mz', tags:['mecânica','termodinâmica','electromagnetismo'] },
  { id:'lib-3', title:'Química Geral', author:'Atkins & Jones', subject:'Química', pages:512, country:'mz', tags:['atomica','ligação','reacção'] },
  { id:'lib-4', title:'Biologia Celular', author:'Alberts et al.', subject:'Biologia', pages:450, country:'mz', tags:['célula','genética','evolução'] },
  { id:'lib-5', title:'Matemática — 12º Ano', author:'Porto Editora', subject:'Matemática', pages:380, country:'pt', tags:['cálculo','probabilidade','complexos'] },
  { id:'lib-6', title:'Física e Química A — 10º', author:'Leya Portugal', subject:'Física', pages:340, country:'pt', tags:['cinemática','química','energia'] },
  { id:'lib-7', title:'Matemática EM — Brasil', author:'Dante', subject:'Matemática', pages:400, country:'br', tags:['funções','trigonometria','geometria'] },
  { id:'lib-8', title:'Biologia — Ensino Médio', author:'Amabis & Martho', subject:'Biologia', pages:460, country:'br', tags:['ecologia','genética','evolução'] },
  { id:'lib-9', title:'História de Angola', author:'Pepetela', subject:'História', pages:290, country:'ao', tags:['angola','colonialismo','independência'] },
  { id:'lib-10', title:'Língua Portuguesa — 12ª', author:'MINED Angola', subject:'Língua Portuguesa', pages:210, country:'ao', tags:['literatura','gramática','redação'] },
]

// ── Endpoint principal ─────────────────────────────────────
search.get('/', async (c) => {
  try {
    const q = c.req.query('q')?.trim() ?? ''
    const countryFilter = c.req.query('country') ?? ''
    const typeFilter = c.req.query('type') ?? 'all' // all | chapters | lessons | library | subjects

    if (!q || q.length < 2) {
      return c.json({
        success: false,
        error: 'Query mínima de 2 caracteres'
      }, 400)
    }

    // ── Busca em Disciplinas ──────────────────────────────
    let subjectResults: any[] = []
    if (typeFilter === 'all' || typeFilter === 'subjects') {
      subjectResults = SUBJECTS
        .filter(s => {
          if (countryFilter) {
            // Verifica se a disciplina pertence ao país via grade → level → country
            const grade = GRADES.find(g => g.id === s.gradeId)
            if (!grade) return false
            const level = EDUCATION_LEVELS.find(l => l.id === grade.levelId)
            if (!level || level.countryId !== countryFilter) return false
          }
          const score = Math.max(
            relevance(s.name, q),
            relevance(s.description ?? '', q),
            relevance(s.shortName, q)
          )
          return score > 30
        })
        .map(s => {
          const grade = GRADES.find(g => g.id === s.gradeId)
          const level = grade ? EDUCATION_LEVELS.find(l => l.id === grade.levelId) : null
          const country = level ? COUNTRIES.find(c => c.id === level.countryId) : null
          return {
            id: s.id,
            name: s.name,
            shortName: s.shortName,
            icon: s.icon,
            color: s.color,
            description: s.description,
            grade_name: grade?.name ?? '',
            level_name: level?.name ?? '',
            country_name: country?.name ?? '',
            country_id: country?.id ?? '',
            country_flag: country?.flag ?? '',
            chapter_count: CHAPTERS.filter(ch => ch.subjectId === s.id).length,
            score: Math.max(relevance(s.name, q), relevance(s.description ?? '', q))
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 12)
    }

    // ── Busca em Capítulos ────────────────────────────────
    let chapterResults: any[] = []
    if (typeFilter === 'all' || typeFilter === 'chapters') {
      chapterResults = CHAPTERS
        .filter(ch => {
          const score = Math.max(
            relevance(ch.title, q),
            relevance(ch.description ?? '', q)
          )
          if (score < 30) return false
          if (countryFilter) {
            const subject = SUBJECTS.find(s => s.id === ch.subjectId)
            if (!subject) return false
            const grade = GRADES.find(g => g.id === subject.gradeId)
            if (!grade) return false
            const level = EDUCATION_LEVELS.find(l => l.id === grade.levelId)
            if (!level || level.countryId !== countryFilter) return false
          }
          return true
        })
        .map(ch => {
          const subject = SUBJECTS.find(s => s.id === ch.subjectId)
          const grade = subject ? GRADES.find(g => g.id === subject.gradeId) : null
          const level = grade ? EDUCATION_LEVELS.find(l => l.id === grade.levelId) : null
          const country = level ? COUNTRIES.find(c => c.id === level.countryId) : null
          return {
            id: ch.id,
            title: ch.title,
            description: ch.description,
            term: ch.term,
            subject_name: subject?.name ?? '',
            subject_icon: subject?.icon ?? 'fa-book',
            subject_color: subject?.color ?? '#6366f1',
            subject_id: subject?.id ?? '',
            grade_name: grade?.name ?? '',
            level_name: level?.name ?? '',
            country_name: country?.name ?? '',
            country_id: country?.id ?? '',
            country_flag: country?.flag ?? '',
            score: Math.max(relevance(ch.title, q), relevance(ch.description ?? '', q))
          }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 15)
    }

    // ── Busca em Lições (mock) ────────────────────────────
    let lessonResults: any[] = []
    if (typeFilter === 'all' || typeFilter === 'lessons') {
      lessonResults = mockLessons
        .filter(l => {
          const score = Math.max(
            relevance(l.title, q),
            relevance(l.description ?? '', q),
            relevance(l.subject ?? '', q)
          )
          return score > 30
        })
        .map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          subject: l.subject,
          duration_min: l.video_duration ? Math.floor(l.video_duration / 60) : null,
          is_free: l.is_free ?? true,
          status: l.status,
          score: Math.max(relevance(l.title, q), relevance(l.description ?? '', q))
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
    }

    // ── Busca na Biblioteca ───────────────────────────────
    let libraryResults: any[] = []
    if (typeFilter === 'all' || typeFilter === 'library') {
      libraryResults = LIBRARY_BOOKS
        .filter(b => {
          if (countryFilter && b.country !== countryFilter) return false
          const score = Math.max(
            relevance(b.title, q),
            relevance(b.author, q),
            relevance(b.subject, q),
            ...b.tags.map(t => relevance(t, q))
          )
          return score > 30
        })
        .map(b => ({ ...b, score: Math.max(relevance(b.title, q), relevance(b.subject, q)) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
    }

    const total = subjectResults.length + chapterResults.length + lessonResults.length + libraryResults.length

    return c.json({
      success: true,
      data: {
        query: q,
        total,
        subjects:  subjectResults,
        chapters:  chapterResults,
        lessons:   lessonResults,
        library:   libraryResults,
      },
      message: `${total} resultado(s) para "${q}"`
    })

  } catch (err) {
    console.error('Search error:', err)
    return c.json({ success: false, error: 'Erro interno na busca' }, 500)
  }
})

// ── Sugestões de busca (autocomplete) ──────────────────────
search.get('/suggest', async (c) => {
  const q = c.req.query('q')?.trim() ?? ''
  if (!q || q.length < 2) return c.json({ success: true, data: [] })

  const suggestions = new Set<string>()

  // De disciplinas
  SUBJECTS.forEach(s => {
    if (normalize(s.name).includes(normalize(q))) suggestions.add(s.name)
  })
  // De capítulos
  CHAPTERS.forEach(ch => {
    if (normalize(ch.title).includes(normalize(q))) suggestions.add(ch.title)
  })
  // De lições mock
  mockLessons.forEach(l => {
    if (normalize(l.title).includes(normalize(q))) suggestions.add(l.title)
  })

  return c.json({
    success: true,
    data: [...suggestions].slice(0, 8)
  })
})

export default search
