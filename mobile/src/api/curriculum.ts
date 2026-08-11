import { apiRequest } from './client'
import type { Country, Grade, Subject, Chapter, Lesson } from '@shared/types'

// Espelha src/data/curriculum.ts (COUNTRIES/EDUCATION_LEVELS/GRADES) usado no
// registo — endpoints públicos, sem auth.
export interface CurriculumCountry { id: string; name: string; flag: string }
export interface CurriculumLevel { id: string; countryId: string; name: string }
export interface CurriculumGrade { id: string; levelId: string; name: string; order: number }

export function fetchCountries() {
  return apiRequest<CurriculumCountry[]>('/api/curriculum/countries', { auth: false })
}

export function fetchLevelsForCountry(countryId: string) {
  return apiRequest<CurriculumLevel[]>(`/api/curriculum/countries/${countryId}/levels`)
}

export function fetchGradesForLevel(levelId: string) {
  return apiRequest<CurriculumGrade[]>(`/api/curriculum/levels/${levelId}/grades`)
}

// ── Navegação de conteúdo (src/routes/content.ts) — usada em /browse ──────────
export function fetchContentCountries() {
  return apiRequest<Country[]>('/api/content/countries', { auth: false })
}

export function fetchEducationSystems(countryId: string) {
  return apiRequest<{ id: string; name: string }[]>(`/api/content/education-systems/${countryId}`, { auth: false })
}

export function fetchGrades(educationSystemId: string) {
  return apiRequest<{ id: string; name: string; level: number }[]>(`/api/content/grades/${educationSystemId}`, { auth: false })
}

export function fetchSubjects(gradeId: string) {
  return apiRequest<(Subject & { grade_subject_id: string })[]>(`/api/content/subjects/${gradeId}`, { auth: false })
}

export function fetchChapters(gradeSubjectId: string) {
  return apiRequest<Chapter[]>(`/api/content/chapters/${gradeSubjectId}`, { auth: false })
}

export function fetchLessonsForChapter(chapterId: string) {
  return apiRequest<Lesson[]>(`/api/content/lessons/${chapterId}`, { auth: false })
}

export function fetchLesson(lessonId: string) {
  return apiRequest<Lesson>(`/api/content/lesson/${lessonId}`)
}

export function fetchRecentLessons() {
  return apiRequest<Lesson[]>('/api/content/recent-lessons')
}
