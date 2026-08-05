// TypeScript types for the application

export type UserRole = 'student' | 'teacher' | 'admin' | 'support' | 'editor' | 'country_manager' | 'finance' | 'moderator'

export type LessonStatus = 'draft' | 'published' | 'archived'

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type QuestionType = 'multiple_choice' | 'true_false' | 'essay'

export type PlanType = 'free' | 'basic' | 'premium'

import "flag-icons/css/flag-icons.min.css";

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  country_id?: string
  avatar_url?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Country {
  id: string
  name: string
  code: string
  language: string
  currency?: string
  flag_url?: string
  is_active: boolean
}

export interface EducationSystem {
  id: string
  country_id: string
  name: string
  description?: string
}

export interface Grade {
  id: string
  education_system_id: string
  name: string
  level: number
  description?: string
  display_order: number
}

export interface Subject {
  id: string
  name: string
  description?: string
  icon_url?: string
  color: string
}

export interface GradeSubject {
  id: string
  grade_id: string
  subject_id: string
  is_mandatory: boolean
  workload_hours?: number
}

export interface Chapter {
  id: string
  grade_subject_id: string
  title: string
  description?: string
  display_order: number
}

export interface Lesson {
  id: string
  chapter_id: string
  title: string
  description?: string
  content?: string
  video_id?: string
  video_duration?: number
  thumbnail_url?: string
  display_order: number
  /** @internal — campo de BD; nunca expor ao estudante */
  is_free?: boolean
  created_by?: string
  status: LessonStatus
  views_count: number
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  lesson_id: string
  question: string
  question_type: QuestionType
  explanation?: string
  display_order: number
  points: number
}

export interface ExerciseOption {
  id: string
  exercise_id: string
  option_text: string
  is_correct: boolean
  display_order: number
}

export interface StudentProgress {
  id: string
  student_id: string
  lesson_id: string
  status: ProgressStatus
  progress_percent: number
  time_spent: number
  last_position: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface ExerciseSubmission {
  id: string
  student_id: string
  exercise_id: string
  selected_option_id?: string
  answer_text?: string
  is_correct?: boolean
  points_earned: number
  submitted_at: string
}

export interface LessonComment {
  id: string
  lesson_id: string
  user_id: string
  parent_comment_id?: string
  content: string
  is_approved: boolean
  likes_count: number
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  student_id: string
  plan_type: PlanType
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at?: string
  payment_provider?: string
  payment_id?: string
  amount?: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: UserRole
  country_id?: string
  phone?: string
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>
  accessToken: string
  refreshToken: string
}

// Video token type
export interface VideoTokenResponse {
  token: string
  streamUrl: string
  expiresAt: string
}
