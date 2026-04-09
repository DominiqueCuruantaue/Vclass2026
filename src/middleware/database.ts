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
  summary: {
    lessons_completed: 12,
    exercises_completed: 28,
    avg_score: 75.5,
    total_time_spent_seconds: 14400 // 4 hours in seconds
  },
  subjectProgress: [
    {
      subject_name: 'Matemática',
      subject_color: '#9333ea',
      total_lessons: 15,
      completed_lessons: 5,
      progress_percent: 33
    },
    {
      subject_name: 'Português',
      subject_color: '#3b82f6',
      total_lessons: 12,
      completed_lessons: 4,
      progress_percent: 33
    },
    {
      subject_name: 'Física',
      subject_color: '#10b981',
      total_lessons: 18,
      completed_lessons: 3,
      progress_percent: 17
    },
    {
      subject_name: 'Química',
      subject_color: '#f59e0b',
      total_lessons: 10,
      completed_lessons: 0,
      progress_percent: 0
    }
  ],
  recentActivity: [
    {
      progress_percent: 100,
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      lesson: {
        id: '1',
        title: 'Equações do 2º Grau',
        thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400'
      }
    },
    {
      progress_percent: 85,
      updated_at: new Date(Date.now() - 7200000).toISOString(),
      lesson: {
        id: '2',
        title: 'Funções Quadráticas',
        thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
      }
    },
    {
      progress_percent: 60,
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      lesson: {
        id: '3',
        title: 'Introdução à Cinemática',
        thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400'
      }
    }
  ]
}

export const mockCountries = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Moçambique',
    code: 'MZ',
    flag_url: '🇲🇿',
    is_active: true
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Brasil',
    code: 'BR',
    flag_url: '🇧🇷',
    is_active: true
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Angola',
    code: 'AO',
    flag_url: '🇦🇴',
    is_active: true
  }
]

export const mockEducationSystems = [
  {
    id: 'es-11111111-1111-1111-1111-111111111111',
    country_id: '22222222-2222-2222-2222-222222222222',
    name: 'Sistema Nacional de Ensino',
    description: 'Sistema educacional de Moçambique'
  },
  {
    id: 'es-22222222-2222-2222-2222-222222222222',
    country_id: '55555555-5555-5555-5555-555555555555',
    name: 'Sistema Nacional Brasileiro',
    description: 'Sistema educacional do Brasil'
  },
  {
    id: 'es-33333333-3333-3333-3333-333333333333',
    country_id: '66666666-6666-6666-6666-666666666666',
    name: 'Sistema Nacional Angolano',
    description: 'Sistema educacional de Angola'
  }
]

export const mockGrades = [
  // Moçambique
  {
    id: 'gr-10-moz',
    education_system_id: 'es-11111111-1111-1111-1111-111111111111',
    name: '10ª Classe',
    level: 10,
    description: 'Décima classe do ensino secundário',
    display_order: 1
  },
  {
    id: 'gr-11-moz',
    education_system_id: 'es-11111111-1111-1111-1111-111111111111',
    name: '11ª Classe',
    level: 11,
    description: 'Décima primeira classe do ensino secundário',
    display_order: 2
  },
  {
    id: 'gr-12-moz',
    education_system_id: 'es-11111111-1111-1111-1111-111111111111',
    name: '12ª Classe',
    level: 12,
    description: 'Décima segunda classe do ensino secundário',
    display_order: 3
  },
  // Brasil
  {
    id: 'gr-1-br',
    education_system_id: 'es-22222222-2222-2222-2222-222222222222',
    name: '1º Ano do Ensino Médio',
    level: 1,
    description: 'Primeiro ano do ensino médio',
    display_order: 1
  },
  {
    id: 'gr-2-br',
    education_system_id: 'es-22222222-2222-2222-2222-222222222222',
    name: '2º Ano do Ensino Médio',
    level: 2,
    description: 'Segundo ano do ensino médio',
    display_order: 2
  },
  // Angola
  {
    id: 'gr-10-ao',
    education_system_id: 'es-33333333-3333-3333-3333-333333333333',
    name: '10ª Classe',
    level: 10,
    description: 'Décima classe do ensino secundário',
    display_order: 1
  }
]

export const mockSubjects = [
  // 10ª Classe Moçambique
  {
    id: 'gs-matematica-10',
    grade_subject_id: 'gs-matematica-10',
    grade_id: 'gr-10-moz',
    name: 'Matemática',
    description: 'Álgebra, Geometria e Funções',
    color: '#9333ea',
    display_order: 1
  },
  {
    id: 'gs-portugues-10',
    grade_subject_id: 'gs-portugues-10',
    grade_id: 'gr-10-moz',
    name: 'Português',
    description: 'Gramática, Literatura e Redação',
    color: '#3b82f6',
    display_order: 2
  },
  {
    id: 'gs-fisica-10',
    grade_subject_id: 'gs-fisica-10',
    grade_id: 'gr-10-moz',
    name: 'Física',
    description: 'Mecânica, Óptica e Termodinâmica',
    color: '#10b981',
    display_order: 3
  },
  {
    id: 'gs-quimica-10',
    grade_subject_id: 'gs-quimica-10',
    grade_id: 'gr-10-moz',
    name: 'Química',
    description: 'Química Geral e Orgânica',
    color: '#f59e0b',
    display_order: 4
  },
  {
    id: 'gs-biologia-10',
    grade_subject_id: 'gs-biologia-10',
    grade_id: 'gr-10-moz',
    name: 'Biologia',
    description: 'Citologia, Genética e Ecologia',
    color: '#22c55e',
    display_order: 5
  }
]

export const mockChapters = [
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
    is_free: true
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
    is_free: false
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
    is_free: true
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
    is_free: false
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
    is_free: true
  }
]
