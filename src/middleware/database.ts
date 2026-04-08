// Database Check Middleware
import { Context, Next } from 'hono'

export const checkDatabase = async (c: Context, next: Next) => {
  const env = c.env
  
  // Check if Supabase credentials are configured
  const hasSupabaseUrl = !!(env?.SUPABASE_URL || process.env.SUPABASE_URL)
  const hasSupabaseKey = !!(env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    // Database not configured, return helpful error
    return c.json({
      success: false,
      error: 'Database configuration missing',
      message: 'Supabase database is not configured. Please set up your database credentials.',
      setup_instructions: {
        step1: 'Create a Supabase account at https://supabase.com',
        step2: 'Create a new project and copy the URL and anon key',
        step3: 'Create a .dev.vars file with SUPABASE_URL and SUPABASE_ANON_KEY',
        step4: 'Run the database migrations from database/migrations/001_initial_schema.sql',
        step5: 'Run the seed data from database/seeds/001_initial_data.sql',
        step6: 'Restart the development server'
      },
      demo_mode: true,
      note: 'You can still browse the frontend pages, but API calls will not work until database is configured.'
    }, 503)
  }
  
  await next()
}

// Mock data for demo mode (when database is not configured)
export const mockUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'estudante@vclass.mz',
    full_name: 'Estudante Demo',
    role: 'student',
    country_id: '22222222-2222-2222-2222-222222222222',
    created_at: new Date().toISOString()
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'professor@vclass.mz',
    full_name: 'Professor Demo',
    role: 'teacher',
    country_id: '22222222-2222-2222-2222-222222222222',
    created_at: new Date().toISOString()
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'admin@vclass.mz',
    full_name: 'Admin Demo',
    role: 'admin',
    country_id: '22222222-2222-2222-2222-222222222222',
    created_at: new Date().toISOString()
  }
]

export const mockDashboardData = {
  stats: {
    totalLessons: 45,
    completedLessons: 12,
    totalExercises: 28,
    averageScore: 75.5
  },
  subjectProgress: [
    {
      subject_name: 'Matemática',
      total_lessons: 15,
      completed_lessons: 5,
      total_watch_time: 3600,
      average_score: 80
    },
    {
      subject_name: 'Português',
      total_lessons: 12,
      completed_lessons: 4,
      total_watch_time: 2400,
      average_score: 72
    },
    {
      subject_name: 'Física',
      total_lessons: 18,
      completed_lessons: 3,
      total_watch_time: 1800,
      average_score: 75
    }
  ],
  recentActivity: [
    {
      type: 'lesson_completed',
      title: 'Equações do 2º Grau',
      description: 'Matemática - Capítulo 3',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      type: 'exercise_submitted',
      title: 'Exercício de Funções',
      description: 'Pontuação: 85%',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      type: 'video_watched',
      title: 'Introdução à Cinemática',
      description: 'Física - Capítulo 1',
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ]
}

export const mockCountries = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Moçambique',
    code: 'MZ',
    is_active: true
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Brasil',
    code: 'BR',
    is_active: true
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Angola',
    code: 'AO',
    is_active: true
  }
]
