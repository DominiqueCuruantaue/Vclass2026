// Database Check Middleware
import { Context, Next } from 'hono'
import { COUNTRIES, EDUCATION_LEVELS, GRADES, SUBJECTS, CHAPTERS } from '../data/curriculum'

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

// ══════════════════════════════════════════════════════════════════════════════
//  Contas de demonstração (modo sem base de dados / Supabase não configurado)
//  Senha universal: vclass2024
// ══════════════════════════════════════════════════════════════════════════════
export const DEMO_PASSWORD = 'vclass2024'

export const mockUsers = [
  // ── Estudante — Moçambique ─────────────────────────────────────────────────
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ana.silva@vclass.mz',
    full_name: 'Ana Silva',
    role: 'student',
    country_id: 'mz',
    country_name: 'Moçambique',
    country_flag: '🇲🇿',
    grade: '12ª Classe',
    school: 'Escola Secundária Eduardo Mondlane',
    phone: '+258 84 123 4567',
    avatar_color: '#7c3aed',
    is_verified: true,
    is_active: true,
    xp: 340,
    streak: 12,
    created_at: new Date('2025-09-01').toISOString()
  },
  // ── Estudante — Angola ────────────────────────────────────────────────────
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'mario.costa@vclass.ao',
    full_name: 'Mário Costa',
    role: 'student',
    country_id: 'ao',
    country_name: 'Angola',
    country_flag: '🇦🇴',
    grade: '10ª Classe',
    school: 'Escola do Ensino Secundário Agostinho Neto',
    phone: '+244 923 456 789',
    avatar_color: '#2563eb',
    is_verified: true,
    is_active: true,
    xp: 175,
    streak: 5,
    created_at: new Date('2025-10-15').toISOString()
  },
  // ── Professor ─────────────────────────────────────────────────────────────
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'prof.carlos@vclass.mz',
    full_name: 'Prof. Carlos Machava',
    role: 'teacher',
    country_id: 'mz',
    country_name: 'Moçambique',
    country_flag: '🇲🇿',
    subject: 'Matemática & Física',
    school: 'Escola Secundária Samora Machel',
    phone: '+258 82 987 6543',
    avatar_color: '#059669',
    is_verified: true,
    is_active: true,
    lessons_created: 48,
    students_count: 312,
    created_at: new Date('2025-06-10').toISOString()
  },
  // ── Criador de Conteúdo ───────────────────────────────────────────────────
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'criador@vclass.mz',
    full_name: 'Beatriz Nhamposse',
    role: 'teacher',
    country_id: 'mz',
    country_name: 'Moçambique',
    country_flag: '🇲🇿',
    subject: 'Química & Biologia',
    school: 'VClass Academy',
    phone: '+258 84 555 0000',
    avatar_color: '#d97706',
    is_verified: true,
    is_active: true,
    lessons_created: 127,
    students_count: 1840,
    created_at: new Date('2025-04-20').toISOString()
  },
  // ── Administrador ─────────────────────────────────────────────────────────
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'admin@vclass.mz',
    full_name: 'Administrador VClass',
    role: 'admin',
    country_id: 'mz',
    country_name: 'Moçambique',
    country_flag: '🇲🇿',
    phone: '+258 21 000 0000',
    avatar_color: '#dc2626',
    is_verified: true,
    is_active: true,
    created_at: new Date('2025-01-01').toISOString()
  },
  // ── Suporte ───────────────────────────────────────────────────────────────
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'suporte@vclass.mz',
    full_name: 'Equipa de Suporte',
    role: 'support',
    country_id: 'mz',
    country_name: 'Moçambique',
    country_flag: '🇲🇿',
    phone: '+258 84 000 0000',
    avatar_color: '#0891b2',
    is_verified: true,
    is_active: true,
    tickets_open: 14,
    tickets_resolved: 238,
    avg_response_minutes: 18,
    created_at: new Date('2025-03-01').toISOString()
  }
]

// ── Dados de dashboard por utilizador ────────────────────────────────────────
const _dashboardByUser: Record<string, any> = {
  // Ana Silva — estudante activa, bom progresso
  '11111111-1111-1111-1111-111111111111': {
    summary: {
      lessons_completed: 38,
      exercises_completed: 74,
      avg_score: 83.2,
      total_time_spent_seconds: 43200 // 12 horas
    },
    subjectProgress: [
      { subject_name: 'Matemática',  subject_color: '#9333ea', total_lessons: 18, completed_lessons: 14, progress_percent: 78 },
      { subject_name: 'Física',      subject_color: '#2563eb', total_lessons: 15, completed_lessons: 12, progress_percent: 80 },
      { subject_name: 'Química',     subject_color: '#10b981', total_lessons: 14, completed_lessons: 8,  progress_percent: 57 },
      { subject_name: 'Biologia',    subject_color: '#22c55e', total_lessons: 12, completed_lessons: 4,  progress_percent: 33 },
      { subject_name: 'Português',   subject_color: '#3b82f6', total_lessons: 10, completed_lessons: 0,  progress_percent: 0  },
    ],
    recentActivity: [
      { progress_percent: 100, updated_at: new Date(Date.now() - 1800000).toISOString(),  lesson: { id: 'l1', title: 'Geometria Analítica — Retas' } },
      { progress_percent: 100, updated_at: new Date(Date.now() - 7200000).toISOString(),  lesson: { id: 'l2', title: 'Leis de Newton — Dinâmica' } },
      { progress_percent: 75,  updated_at: new Date(Date.now() - 86400000).toISOString(), lesson: { id: 'l3', title: 'Termodinâmica — 1ª Lei' } },
    ]
  },
  // Mário Costa — estudante iniciante, Angola
  '22222222-2222-2222-2222-222222222222': {
    summary: {
      lessons_completed: 12,
      exercises_completed: 21,
      avg_score: 68.5,
      total_time_spent_seconds: 14400 // 4 horas
    },
    subjectProgress: [
      { subject_name: 'Matemática',        subject_color: '#9333ea', total_lessons: 14, completed_lessons: 5, progress_percent: 36 },
      { subject_name: 'Língua Portuguesa', subject_color: '#3b82f6', total_lessons: 12, completed_lessons: 4, progress_percent: 33 },
      { subject_name: 'Ciências Físicas',  subject_color: '#10b981', total_lessons: 10, completed_lessons: 3, progress_percent: 30 },
    ],
    recentActivity: [
      { progress_percent: 100, updated_at: new Date(Date.now() - 3600000).toISOString(),  lesson: { id: 'l4', title: 'Funções do 1º Grau' } },
      { progress_percent: 60,  updated_at: new Date(Date.now() - 10800000).toISOString(), lesson: { id: 'l5', title: 'Equações e Sistemas' } },
    ]
  }
}

// Dashboard padrão (professor / admin / fallback)
const _defaultDashboard = {
  summary: {
    lessons_completed: 12,
    exercises_completed: 28,
    avg_score: 75.5,
    total_time_spent_seconds: 14400
  },
  subjectProgress: [
    { subject_name: 'Matemática', subject_color: '#9333ea', total_lessons: 15, completed_lessons: 5, progress_percent: 33 },
    { subject_name: 'Português',  subject_color: '#3b82f6', total_lessons: 12, completed_lessons: 4, progress_percent: 33 },
    { subject_name: 'Física',     subject_color: '#10b981', total_lessons: 18, completed_lessons: 3, progress_percent: 17 },
    { subject_name: 'Química',    subject_color: '#f59e0b', total_lessons: 10, completed_lessons: 0, progress_percent: 0  },
  ],
  recentActivity: [
    { progress_percent: 100, updated_at: new Date(Date.now() - 3600000).toISOString(),  lesson: { id: 'l1', title: 'Equações do 2º Grau' } },
    { progress_percent: 85,  updated_at: new Date(Date.now() - 7200000).toISOString(),  lesson: { id: 'l2', title: 'Funções Quadráticas' } },
    { progress_percent: 60,  updated_at: new Date(Date.now() - 86400000).toISOString(), lesson: { id: 'l3', title: 'Introdução à Cinemática' } },
  ]
}

export function getMockDashboard(userId?: string) {
  return (userId && _dashboardByUser[userId]) || _defaultDashboard
}

// Manter export antigo por compatibilidade
export const mockDashboardData = _defaultDashboard

// Re-export curriculum data for backwards compat
export const mockCountries = COUNTRIES.map(c => ({
  id: c.id,
  name: c.name,
  code: c.code,
  flag_url: c.flag,
  is_active: c.is_active,
  currency: c.currency,
  educationTerms: c.educationTerms,
  termCount: c.termCount,
}))

export const mockEducationSystems = EDUCATION_LEVELS.map(l => ({
  id: l.id,
  country_id: l.countryId,
  name: l.name,
  short_name: l.shortName,
  description: l.description,
  age_range: l.ageRange,
  display_order: l.displayOrder,
}))

export const mockGrades = GRADES.map(g => ({
  id: g.id,
  education_system_id: g.levelId,
  name: g.name,
  short_name: g.shortName,
  display_order: g.displayOrder,
}))

export const mockSubjects = SUBJECTS.map(s => ({
  id: s.id,
  grade_subject_id: s.id,
  grade_id: s.gradeId,
  name: s.name,
  short_name: s.shortName,
  description: s.description,
  icon: s.icon,
  color: s.color,
  display_order: s.displayOrder,
}))

export const mockChapters_LEGACY = [
  // Matemática 10ª Classe - 1º Trimestre
  {
    id: 'ch-mat-1',
    grade_subject_id: 'gs-matematica-10',
    title: 'Funções',
    description: 'Introdução às funções matemáticas',
    trimester: 1,
    display_order: 1
  },
  {
    id: 'ch-mat-2',
    grade_subject_id: 'gs-matematica-10',
    title: 'Equações',
    description: 'Equações do 1º e 2º grau',
    trimester: 1,
    display_order: 2
  },
  {
    id: 'ch-mat-3',
    grade_subject_id: 'gs-matematica-10',
    title: 'Geometria Plana',
    description: 'Polígonos e áreas',
    trimester: 1,
    display_order: 3
  },
  // Matemática 10ª Classe - 2º Trimestre
  {
    id: 'ch-mat-4',
    grade_subject_id: 'gs-matematica-10',
    title: 'Trigonometria',
    description: 'Seno, cosseno e tangente',
    trimester: 2,
    display_order: 4
  },
  {
    id: 'ch-mat-5',
    grade_subject_id: 'gs-matematica-10',
    title: 'Logaritmos',
    description: 'Propriedades e aplicações',
    trimester: 2,
    display_order: 5
  },
  {
    id: 'ch-mat-6',
    grade_subject_id: 'gs-matematica-10',
    title: 'Progressões',
    description: 'Aritméticas e geométricas',
    trimester: 2,
    display_order: 6
  },
  // Matemática 10ª Classe - 3º Trimestre
  {
    id: 'ch-mat-7',
    grade_subject_id: 'gs-matematica-10',
    title: 'Matrizes',
    description: 'Operações com matrizes',
    trimester: 3,
    display_order: 7
  },
  {
    id: 'ch-mat-8',
    grade_subject_id: 'gs-matematica-10',
    title: 'Determinantes',
    description: 'Cálculo de determinantes',
    trimester: 3,
    display_order: 8
  },
  {
    id: 'ch-mat-9',
    grade_subject_id: 'gs-matematica-10',
    title: 'Geometria Analítica',
    description: 'Retas e circunferências',
    trimester: 3,
    display_order: 9
  },
  
  // Português 10ª Classe - 1º Trimestre
  {
    id: 'ch-port-1',
    grade_subject_id: 'gs-portugues-10',
    title: 'Classes Gramaticais',
    description: 'Substantivos, verbos e adjetivos',
    trimester: 1,
    display_order: 1
  },
  {
    id: 'ch-port-2',
    grade_subject_id: 'gs-portugues-10',
    title: 'Literatura Portuguesa',
    description: 'Autores clássicos',
    trimester: 1,
    display_order: 2
  },
  {
    id: 'ch-port-3',
    grade_subject_id: 'gs-portugues-10',
    title: 'Análise Sintática',
    description: 'Sujeito, predicado e complementos',
    trimester: 1,
    display_order: 3
  },
  // Português 10ª Classe - 2º Trimestre
  {
    id: 'ch-port-4',
    grade_subject_id: 'gs-portugues-10',
    title: 'Orações Coordenadas',
    description: 'Coordenação sindética e assindética',
    trimester: 2,
    display_order: 4
  },
  {
    id: 'ch-port-5',
    grade_subject_id: 'gs-portugues-10',
    title: 'Orações Subordinadas',
    description: 'Substantivas, adjetivas e adverbiais',
    trimester: 2,
    display_order: 5
  },
  {
    id: 'ch-port-6',
    grade_subject_id: 'gs-portugues-10',
    title: 'Literatura Moçambicana',
    description: 'Autores contemporâneos',
    trimester: 2,
    display_order: 6
  },
  // Português 10ª Classe - 3º Trimestre
  {
    id: 'ch-port-7',
    grade_subject_id: 'gs-portugues-10',
    title: 'Redação',
    description: 'Dissertação e argumentação',
    trimester: 3,
    display_order: 7
  },
  {
    id: 'ch-port-8',
    grade_subject_id: 'gs-portugues-10',
    title: 'Interpretação de Textos',
    description: 'Análise crítica de textos',
    trimester: 3,
    display_order: 8
  },
  {
    id: 'ch-port-9',
    grade_subject_id: 'gs-portugues-10',
    title: 'Literatura Africana',
    description: 'Literatura dos PALOP',
    trimester: 3,
    display_order: 9
  },
  
  // Física 10ª Classe - 1º Trimestre
  {
    id: 'ch-fis-1',
    grade_subject_id: 'gs-fisica-10',
    title: 'Cinemática',
    description: 'Movimento uniforme e variado',
    trimester: 1,
    display_order: 1
  },
  {
    id: 'ch-fis-2',
    grade_subject_id: 'gs-fisica-10',
    title: 'Dinâmica',
    description: 'Leis de Newton e forças',
    trimester: 1,
    display_order: 2
  },
  {
    id: 'ch-fis-3',
    grade_subject_id: 'gs-fisica-10',
    title: 'Trabalho e Energia',
    description: 'Energia cinética e potencial',
    trimester: 1,
    display_order: 3
  },
  // Física 10ª Classe - 2º Trimestre
  {
    id: 'ch-fis-4',
    grade_subject_id: 'gs-fisica-10',
    title: 'Termodinâmica',
    description: 'Calor e temperatura',
    trimester: 2,
    display_order: 4
  },
  {
    id: 'ch-fis-5',
    grade_subject_id: 'gs-fisica-10',
    title: 'Óptica Geométrica',
    description: 'Reflexão e refração da luz',
    trimester: 2,
    display_order: 5
  },
  {
    id: 'ch-fis-6',
    grade_subject_id: 'gs-fisica-10',
    title: 'Ondulatória',
    description: 'Ondas mecânicas e eletromagnéticas',
    trimester: 2,
    display_order: 6
  },
  // Física 10ª Classe - 3º Trimestre
  {
    id: 'ch-fis-7',
    grade_subject_id: 'gs-fisica-10',
    title: 'Eletrostática',
    description: 'Cargas elétricas e força elétrica',
    trimester: 3,
    display_order: 7
  },
  {
    id: 'ch-fis-8',
    grade_subject_id: 'gs-fisica-10',
    title: 'Eletrodinâmica',
    description: 'Corrente elétrica e circuitos',
    trimester: 3,
    display_order: 8
  },
  {
    id: 'ch-fis-9',
    grade_subject_id: 'gs-fisica-10',
    title: 'Magnetismo',
    description: 'Campo magnético e eletromagnetismo',
    trimester: 3,
    display_order: 9
  },
  
  // Química 10ª Classe - 1º Trimestre
  {
    id: 'ch-quim-1',
    grade_subject_id: 'gs-quimica-10',
    title: 'Estrutura Atômica',
    description: 'Átomos, prótons e elétrons',
    trimester: 1,
    display_order: 1
  },
  {
    id: 'ch-quim-2',
    grade_subject_id: 'gs-quimica-10',
    title: 'Tabela Periódica',
    description: 'Organização dos elementos',
    trimester: 1,
    display_order: 2
  },
  {
    id: 'ch-quim-3',
    grade_subject_id: 'gs-quimica-10',
    title: 'Ligações Químicas',
    description: 'Iônicas, covalentes e metálicas',
    trimester: 1,
    display_order: 3
  },
  // Química 10ª Classe - 2º Trimestre
  {
    id: 'ch-quim-4',
    grade_subject_id: 'gs-quimica-10',
    title: 'Funções Inorgânicas',
    description: 'Ácidos, bases, sais e óxidos',
    trimester: 2,
    display_order: 4
  },
  {
    id: 'ch-quim-5',
    grade_subject_id: 'gs-quimica-10',
    title: 'Reações Químicas',
    description: 'Tipos de reações e balanceamento',
    trimester: 2,
    display_order: 5
  },
  {
    id: 'ch-quim-6',
    grade_subject_id: 'gs-quimica-10',
    title: 'Estequiometria',
    description: 'Cálculos químicos',
    trimester: 2,
    display_order: 6
  },
  // Química 10ª Classe - 3º Trimestre
  {
    id: 'ch-quim-7',
    grade_subject_id: 'gs-quimica-10',
    title: 'Química Orgânica',
    description: 'Hidrocarbonetos e cadeias carbônicas',
    trimester: 3,
    display_order: 7
  },
  {
    id: 'ch-quim-8',
    grade_subject_id: 'gs-quimica-10',
    title: 'Funções Orgânicas',
    description: 'Álcoois, éteres e aldeídos',
    trimester: 3,
    display_order: 8
  },
  {
    id: 'ch-quim-9',
    grade_subject_id: 'gs-quimica-10',
    title: 'Isomeria',
    description: 'Tipos de isômeros',
    trimester: 3,
    display_order: 9
  },
  
  // Biologia 10ª Classe - 1º Trimestre
  {
    id: 'ch-bio-1',
    grade_subject_id: 'gs-biologia-10',
    title: 'Citologia',
    description: 'Estrutura celular',
    trimester: 1,
    display_order: 1
  },
  {
    id: 'ch-bio-2',
    grade_subject_id: 'gs-biologia-10',
    title: 'Metabolismo Celular',
    description: 'Respiração e fotossíntese',
    trimester: 1,
    display_order: 2
  },
  {
    id: 'ch-bio-3',
    grade_subject_id: 'gs-biologia-10',
    title: 'Divisão Celular',
    description: 'Mitose e meiose',
    trimester: 1,
    display_order: 3
  },
  // Biologia 10ª Classe - 2º Trimestre
  {
    id: 'ch-bio-4',
    grade_subject_id: 'gs-biologia-10',
    title: 'Genética',
    description: 'Leis de Mendel',
    trimester: 2,
    display_order: 4
  },
  {
    id: 'ch-bio-5',
    grade_subject_id: 'gs-biologia-10',
    title: 'DNA e RNA',
    description: 'Ácidos nucleicos',
    trimester: 2,
    display_order: 5
  },
  {
    id: 'ch-bio-6',
    grade_subject_id: 'gs-biologia-10',
    title: 'Evolução',
    description: 'Teorias evolutivas',
    trimester: 2,
    display_order: 6
  },
  // Biologia 10ª Classe - 3º Trimestre
  {
    id: 'ch-bio-7',
    grade_subject_id: 'gs-biologia-10',
    title: 'Ecologia',
    description: 'Ecossistemas e cadeias alimentares',
    trimester: 3,
    display_order: 7
  },
  {
    id: 'ch-bio-8',
    grade_subject_id: 'gs-biologia-10',
    title: 'Taxonomia',
    description: 'Classificação dos seres vivos',
    trimester: 3,
    display_order: 8
  },
  {
    id: 'ch-bio-9',
    grade_subject_id: 'gs-biologia-10',
    title: 'Fisiologia Humana',
    description: 'Sistemas do corpo humano',
    trimester: 3,
    display_order: 9
  }
]

export const mockLessons = [
  // Funções (Matemática)
  {
    id: 'lesson-1',
    chapter_id: 'ch-mat-1',
    title: 'Introdução às Funções',
    description: 'Conceitos básicos de funções matemáticas',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1200,
    display_order: 1,
  },
  {
    id: 'lesson-2',
    chapter_id: 'ch-mat-1',
    title: 'Domínio e Contradomínio',
    description: 'Entendendo domínio e contradomínio de funções',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 900,
    display_order: 2,
  },
  // Equações (Matemática)
  {
    id: 'lesson-3',
    chapter_id: 'ch-mat-2',
    title: 'Equações do 1º Grau',
    description: 'Resolvendo equações do primeiro grau',
    thumbnail_url: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1000,
    display_order: 1,
  },
  {
    id: 'lesson-4',
    chapter_id: 'ch-mat-2',
    title: 'Equações do 2º Grau',
    description: 'Fórmula de Bhaskara e resolução',
    thumbnail_url: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1500,
    display_order: 2,
  },
  // Cinemática (Física)
  {
    id: 'lesson-5',
    chapter_id: 'ch-fis-1',
    title: 'Movimento Uniforme',
    description: 'Conceitos de velocidade constante',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1100,
    display_order: 1,
  },
  {
    id: 'lesson-6',
    chapter_id: 'ch-fis-1',
    title: 'Movimento Uniformemente Variado',
    description: 'Aceleração e movimento acelerado',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1300,
    display_order: 2,
  },
  {
    id: 'lesson-7',
    chapter_id: 'ch-fis-1',
    title: 'Queda Livre',
    description: 'Movimento vertical sob ação da gravidade',
    thumbnail_url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 950,
    display_order: 3,
  },
  // Dinâmica (Física)
  {
    id: 'lesson-8',
    chapter_id: 'ch-fis-2',
    title: '1ª Lei de Newton',
    description: 'Lei da Inércia',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1000,
    display_order: 1,
  },
  {
    id: 'lesson-9',
    chapter_id: 'ch-fis-2',
    title: '2ª Lei de Newton',
    description: 'Força = massa × aceleração',
    thumbnail_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1200,
    display_order: 2,
  },
  {
    id: 'lesson-10',
    chapter_id: 'ch-fis-2',
    title: '3ª Lei de Newton',
    description: 'Ação e reação',
    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1100,
    display_order: 3,
  },
  // Trabalho e Energia (Física)
  {
    id: 'lesson-11',
    chapter_id: 'ch-fis-3',
    title: 'Trabalho de uma Força',
    description: 'Cálculo do trabalho realizado',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1050,
    display_order: 1,
  },
  {
    id: 'lesson-12',
    chapter_id: 'ch-fis-3',
    title: 'Energia Cinética',
    description: 'Energia do movimento',
    thumbnail_url: 'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 980,
    display_order: 2,
  },
  {
    id: 'lesson-13',
    chapter_id: 'ch-fis-3',
    title: 'Energia Potencial',
    description: 'Energia armazenada e conservação',
    thumbnail_url: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1150,
    display_order: 3,
  },
  // Termodinâmica (Física)
  {
    id: 'lesson-14',
    chapter_id: 'ch-fis-4',
    title: 'Temperatura e Calor',
    description: 'Diferença entre temperatura e calor',
    thumbnail_url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1100,
    display_order: 1,
  },
  {
    id: 'lesson-15',
    chapter_id: 'ch-fis-4',
    title: 'Dilatação Térmica',
    description: 'Expansão dos corpos com o calor',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1050,
    display_order: 2,
  },
  {
    id: 'lesson-16',
    chapter_id: 'ch-fis-4',
    title: 'Calorimetria',
    description: 'Medição de calor e capacidade térmica',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
    video_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration_seconds: 1250,
    display_order: 3,
  }
]

// Exportar mockChapters a partir do currículo real
export const mockChapters = CHAPTERS.map(c => ({
  id: c.id,
  grade_subject_id: c.subjectId,
  title: c.title,
  description: c.description,
  trimester: c.term,
  display_order: c.displayOrder,
}))
