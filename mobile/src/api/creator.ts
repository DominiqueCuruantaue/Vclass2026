import { apiRequest } from './client'

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface CreatorDashboard {
  creator: { id: string; name: string; role: string }
  stats: {
    total_lessons: number
    published_lessons: number
    draft_lessons: number
    review_lessons: number
    total_chapters: number
    total_students_reached: number
    avg_approval_rate: number
    weekly_views: number
    weekly_completions: number
    weekly_by_day: number[]
    lessons_without_exercises: number
  }
  subjects: { name: string; lessons: number; published: number; pct: number; icon: string }[]
}

export function fetchCreatorDashboard() {
  return apiRequest<CreatorDashboard>('/api/creator/dashboard')
}

// ── Lições ───────────────────────────────────────────────────────────────────
export interface CreatorLessonListItem {
  id: string
  title: string
  description?: string
  subject: string
  chapter: string
  chapter_id: string
  video_id?: string
  video_url?: string
  duration: number
  status: 'draft' | 'pending_review' | 'published' | 'archived'
  views: number
  access: 'free' | 'premium'
  thumbnail_url?: string
  updated?: string
  created_at: string
}

export function fetchCreatorLessons(params: { status?: string; q?: string; page?: number } = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiRequest<CreatorLessonListItem[]>(`/api/creator/lessons${suffix}`)
}

export interface CreatorExerciseDraft {
  id?: string
  question: string
  explanation?: string
  points?: number
  display_order?: number
  exercise_options: { id?: string; option_text: string; is_correct: boolean; display_order?: number }[]
}

export interface CreatorLessonDetail {
  id: string
  title: string
  description?: string
  content?: string
  chapter_id: string
  video_id?: string
  video_url?: string
  video_duration?: number
  thumbnail_url?: string
  is_free: boolean
  status: string
  display_order: number
  exercises: CreatorExerciseDraft[]
}

export function fetchCreatorLesson(id: string) {
  return apiRequest<CreatorLessonDetail>(`/api/creator/lesson/${id}`)
}

export interface LessonUpsertPayload {
  title: string
  description?: string
  content?: string
  chapter_id: string
  chapter_title?: string
  video_id?: string
  video_url?: string
  video_duration?: number
  thumbnail_url?: string
  is_free?: boolean
  display_order?: number
  status?: 'draft' | 'published'
}

export function createLesson(payload: LessonUpsertPayload) {
  return apiRequest<{ id: string }>('/api/creator/lesson', { method: 'POST', body: payload })
}

export function updateLesson(id: string, payload: Partial<LessonUpsertPayload>) {
  return apiRequest<{ id: string }>(`/api/creator/lesson/${id}`, { method: 'PUT', body: payload })
}

export function deleteLesson(id: string) {
  return apiRequest(`/api/creator/lesson/${id}`, { method: 'DELETE' })
}

// Cada exercício: { question, explanation?, points?, options: string[4], correct: 0-3 }
export function saveLessonExercises(lessonId: string, exercises: Array<{ question: string; explanation?: string; points?: number; options: string[]; correct: number }>) {
  return apiRequest(`/api/creator/lesson/${lessonId}/exercises`, { method: 'POST', body: { exercises } })
}

// ── Capítulos ────────────────────────────────────────────────────────────────
export interface CreatorChapter {
  id: string
  title: string
  slug?: string
  description?: string
  display_order: number
  grade_subject_id?: string
  trimester?: number
  created_at: string
}

export function fetchCreatorChapters() {
  return apiRequest<CreatorChapter[]>('/api/creator/chapters')
}

export function createChapter(payload: { title: string; grade_subject_id?: string; subject_slug?: string; trimester?: number; description?: string }) {
  return apiRequest<CreatorChapter>('/api/creator/chapter', { method: 'POST', body: payload })
}

export function fetchCreatorCurriculum() {
  return apiRequest<any>('/api/creator/curriculum')
}

// ── Vídeo (Bunny.net via TUS) ────────────────────────────────────────────────
export interface VideoUploadCredentials {
  videoId: string
  title: string
  filename: string
  upload: {
    endpoint: string
    headers: Record<string, string>
    metadata: { filetype: string; title: string }
    expiresAt: string
  }
}

export function requestVideoUploadUrl(filename: string, title: string) {
  return apiRequest<VideoUploadCredentials>('/api/creator/video/upload-url', { method: 'POST', body: { filename, title } })
}

export function fetchVideoStatus(videoId: string) {
  return apiRequest<{ status: string; progress?: number; ready: boolean }>(`/api/creator/video/${videoId}/status`)
}

// ── Analytics / Alunos / Ganhos ─────────────────────────────────────────────
export function fetchCreatorAnalytics(period: '7d' | '30d' | '90d' | 'all' = '7d') {
  return apiRequest<any>(`/api/creator/analytics?period=${period}`)
}

export interface CreatorStudent {
  user_id: string
  full_name: string
  email: string
  progress_percent: number
  score: number
  lessons_done: number
  last_active: string
}

export function fetchCreatorStudents(params: { q?: string; page?: number } = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiRequest<CreatorStudent[]>(`/api/creator/students${suffix}`)
}

export function fetchCreatorEarnings(period: '7d' | '30d' | '90d' | '12m' | 'all' = '30d') {
  return apiRequest<any>(`/api/creator/earnings?period=${period}`)
}

export function requestWithdrawal(payload: { amount_mzn: number; method: 'mpesa' | 'emola' | 'transferencia'; phone: string }) {
  return apiRequest<{ reference: string }>('/api/creator/earnings/withdraw', { method: 'POST', body: payload })
}
