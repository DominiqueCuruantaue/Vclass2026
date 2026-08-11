import { apiRequest } from './client'
import type { Exercise } from '@shared/types'

export function fetchExercises(lessonId: string) {
  return apiRequest<Exercise[]>(`/api/exercises/${lessonId}`)
}

export interface SubmitAnswerResult {
  id: string
  exercise_id: string
  is_correct: boolean | null
  points_earned: number
  correctAnswer: { id: string; option_text: string } | null
}

export function submitAnswer(payload: { exercise_id: string; selected_option_id?: string; answer_text?: string }) {
  return apiRequest<SubmitAnswerResult>('/api/exercises/submit', { method: 'POST', body: payload })
}

export function fetchResults(lessonId: string) {
  return apiRequest<{
    submissions: any[]
    summary: { totalExercises: number; correctAnswers: number; totalPoints: number; maxPoints: number; scorePercent: number }
  }>(`/api/exercises/results/${lessonId}`)
}
