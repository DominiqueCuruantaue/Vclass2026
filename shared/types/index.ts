// Tipos partilhados entre web e mobile — espelham src/types/index.ts do backend.
// Mantidos manualmente em sincronia (sem build step); qualquer mudança no
// backend (src/types/index.ts) deve ser replicada aqui.

export type UserRole =
  | 'student'
  | 'teacher'
  | 'admin'
  | 'support'
  | 'editor'
  | 'country_manager'
  | 'finance'
  | 'moderator'

export type LessonStatus = 'draft' | 'pending_review' | 'published' | 'archived'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type QuestionType = 'multiple_choice' | 'true_false' | 'essay'
export type PlanType = 'free' | 'basic' | 'premium'

export interface User {
  id: string
  email: string
  full_name: string
  name?: string
  role: UserRole
  phone?: string
  country_id?: string
  country_code?: string
  grade_id?: string
  avatar_url?: string
  is_active?: boolean
  is_verified: boolean
  created_at: string
  updated_at?: string
}

export interface Country {
  id: string
  name: string
  code: string
  language?: string
  currency?: string
  flag_url?: string
  is_active?: boolean
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
  subject?: Subject
}

export interface Chapter {
  id: string
  grade_subject_id: string
  title: string
  description?: string
  display_order: number
  trimester?: number
  lessons_count?: number
}

export interface Lesson {
  id: string
  chapter_id: string
  title: string
  description?: string
  content?: string
  video_id?: string
  video_url?: string
  video_duration?: number
  thumbnail_url?: string
  display_order: number
  is_free?: boolean
  created_by?: string
  status: LessonStatus
  views_count?: number
  created_at: string
  updated_at?: string
}

export interface ExerciseOption {
  id: string
  exercise_id?: string
  option_text: string
  is_correct?: boolean
  display_order?: number
}

export interface Exercise {
  id: string
  lesson_id: string
  question: string
  question_type: QuestionType
  explanation?: string
  display_order?: number
  points?: number
  options?: ExerciseOption[]
}

export interface StudentProgress {
  id?: string
  student_id?: string
  lesson_id: string
  status: ProgressStatus
  progress_percent: number
  time_spent?: number
  last_position?: number
  completed_at?: string
}

export interface ExerciseSubmission {
  id?: string
  exercise_id: string
  selected_option_id?: string
  answer_text?: string
  is_correct?: boolean
  points_earned?: number
}

export interface Subscription {
  id: string
  student_id: string
  plan_type: PlanType
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at?: string
  payment_provider?: string
  amount?: number
}

export interface Plan {
  id: string
  type: PlanType
  name: string
  price?: number
  currency?: string
  is_popular?: boolean
  features?: string[]
}

// ── API envelope ────────────────────────────────────────────────────────────
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

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterStudentRequest {
  email: string
  password: string
  full_name: string
  role: 'student'
  phone?: string
  country_code?: string
  grade_id?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

// ── Vídeo ────────────────────────────────────────────────────────────────────
export interface VideoTokenResponse {
  token: string
  expiresAt: string
  watermark: { userId: string; email: string; name: string; ts: number }
  streamConfig: { type: 'hls'; tokenRequired: boolean; drmHint: string }
}

export interface VideoStreamResponse {
  videoId: string
  streamUrl: string
  streamType: 'hls'
  tokenValid: boolean
  expiresAt: string
}

// ── Candidatura de professor (KYT) ──────────────────────────────────────────
export type TeachingLevel = 'primary' | 'secondary' | 'tertiary'
export type Degree = 'licenciatura' | 'mestrado' | 'doutoramento' | 'bacharel' | 'outro'
export type DigitalLiteracy = 'basico' | 'intermedio' | 'avancado'

export interface TeacherApplicationRequest {
  full_name: string
  email: string
  phone: string
  birth_date: string // YYYY-MM-DD
  national_id: string
  country_id: string
  province: string
  city: string

  degree: Degree
  degree_field: string
  institution: string
  graduation_year: number
  has_teaching_cert: boolean
  teaching_cert_type?: string

  years_experience: number
  current_school?: string
  previous_schools?: string[]
  teaching_levels: TeachingLevel[]
  subjects: string[]
  subjects_other?: string

  motivation_letter: string
  reference_1_name: string
  reference_1_phone: string
  reference_1_role: string
  reference_2_name?: string
  reference_2_phone?: string

  digital_literacy: DigitalLiteracy
  has_computer: boolean
  has_internet: boolean

  password: string
  confirm_password: string

  cv_storage_path?: string
  cv_original_name?: string
  cv_link?: string
  certificate_storage_path?: string
  certificate_original_name?: string
  certificate_link?: string
}

export interface UploadDocumentResponse {
  storage_path: string
  original_name: string
}
