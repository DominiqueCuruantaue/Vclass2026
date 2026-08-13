import { apiRequest } from './client'
import type { Country, Grade, Subject, Chapter, Lesson } from '@shared/types'

// Espelha src/data/curriculum.ts (COUNTRIES/EDUCATION_LEVELS/GRADES) — usado
// no registo. Todos públicos (sem auth): o candidato ainda não tem conta.
export interface CurriculumCountry {
  id: string; code: string; name: string; flag: string; currency: string
  educationTerms: string; termCount: number; is_active: boolean
}
export interface CurriculumGrade { id: string; levelId: string; name: string; shortName: string; displayOrder: number }
export interface CurriculumLevel {
  id: string; countryId: string; name: string; shortName: string
  description: string; ageRange: string; displayOrder: number
  grades: CurriculumGrade[]
}

export function fetchCountries() {
  return apiRequest<CurriculumCountry[]>('/api/curriculum/countries', { auth: false })
}

// Árvore pública de níveis+classes de um país — usada para o selector de
// classe no registo de estudante (GET /api/curriculum/tree/:countryId).
export function fetchCountryLevels(countryId: string) {
  return apiRequest<{ country: CurriculumCountry; curriculum: CurriculumLevel[] }>(
    `/api/curriculum/tree/${countryId}`,
    { auth: false }
  )
}

// ── Navegação de conteúdo (src/routes/content.ts) — usada em /browse ──────────
// /api/content/* exige sessão (content.use('/*', authMiddleware) no backend) —
// ao contrário de /api/curriculum/*, que é público para o fluxo de registo.
export function fetchContentCountries() {
  return apiRequest<Country[]>('/api/content/countries')
}

export function fetchEducationSystems(countryId: string) {
  return apiRequest<{ id: string; name: string }[]>(`/api/content/education-systems/${countryId}`)
}

export function fetchGrades(educationSystemId: string) {
  return apiRequest<{ id: string; name: string; level: number }[]>(`/api/content/grades/${educationSystemId}`)
}

export function fetchSubjects(gradeId: string) {
  return apiRequest<(Subject & { grade_subject_id: string })[]>(`/api/content/subjects/${gradeId}`)
}

export function fetchChapters(gradeSubjectId: string) {
  return apiRequest<Chapter[]>(`/api/content/chapters/${gradeSubjectId}`)
}

export function fetchLessonsForChapter(chapterId: string) {
  return apiRequest<Lesson[]>(`/api/content/lessons/${chapterId}`)
}

export function fetchLesson(lessonId: string) {
  return apiRequest<Lesson>(`/api/content/lesson/${lessonId}`)
}

export function fetchRecentLessons() {
  return apiRequest<Lesson[]>('/api/content/recent-lessons')
}
