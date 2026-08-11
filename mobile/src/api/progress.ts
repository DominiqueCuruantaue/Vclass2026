import { apiRequest } from './client'
import type { Lesson, StudentProgress } from '@shared/types'

export interface DashboardData {
  stats: {
    totalLessons: number
    completedLessons: number
    totalExercises: number
    averageScore: number
    [key: string]: any
  }
  recentActivity: Array<{
    id: string
    progress_percent: number
    status: string
    updated_at: string
    lesson: Pick<Lesson, 'id' | 'title' | 'thumbnail_url'>
  }>
  subjectProgress: Array<{ subject_id?: string; subject_name?: string; progress_percent?: number; [key: string]: any }>
}

export function fetchDashboard() {
  return apiRequest<DashboardData>('/api/progress/dashboard')
}

export function fetchLessonProgress(lessonId: string) {
  return apiRequest<StudentProgress | null>(`/api/progress/lesson/${lessonId}`)
}

export function fetchSubjectProgress(gradeSubjectId: string) {
  return apiRequest<any>(`/api/progress/subject/${gradeSubjectId}`)
}

export function fetchRecommendations() {
  return apiRequest<Lesson[]>('/api/progress/recommendations')
}

export function fetchActivity() {
  return apiRequest<any[]>('/api/progress/activity')
}
