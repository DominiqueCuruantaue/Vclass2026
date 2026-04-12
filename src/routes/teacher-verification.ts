// Teacher Verification Routes
// Sistema rigoroso de verificação de professores
import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware, requireAdmin } from '../middleware/auth'
import { rateLimitMiddleware } from '../middleware/auth'
import { hashPassword, validatePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt'
import { DEMO_PASSWORD } from '../middleware/database'
import type { ApiResponse } from '../types'

const tv = new Hono()

// Rate limiting rigoroso para registo de professores: max 3 por hora por IP
tv.use('/apply', rateLimitMiddleware(3, 3_600_000))

// ══════════════════════════════════════════════════════════════════════════════
//  Schema de candidatura de professor — multi-etapas
// ══════════════════════════════════════════════════════════════════════════════
const teacherApplicationSchema = z.object({
  // Dados Pessoais
  full_name:    z.string().min(5, 'Nome completo deve ter pelo menos 5 caracteres'),
  email:        z.string().email('Email inválido'),
  phone:        z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  birth_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)'),
  national_id:  z.string().min(6, 'Número do BI/CC é obrigatório'),
  country_id:   z.string().min(2, 'País é obrigatório'),
  province:     z.string().min(2, 'Província é obrigatória'),
  city:         z.string().min(2, 'Cidade é obrigatória'),
  address:      z.string().min(5, 'Endereço é obrigatório'),

  // Qualificações Académicas
  degree:             z.enum(['licenciatura', 'mestrado', 'doutoramento', 'bacharel', 'outro'], {
    errorMap: () => ({ message: 'Grau académico inválido' })
  }),
  degree_field:       z.string().min(3, 'Área de formação é obrigatória'),
  institution:        z.string().min(3, 'Instituição de formação é obrigatória'),
  graduation_year:    z.number().int().min(1960).max(new Date().getFullYear()),
  has_teaching_cert:  z.boolean(),
  teaching_cert_type: z.string().optional(),

  // Experiência Profissional
  years_experience:   z.number().int().min(0).max(50),
  current_school:     z.string().optional(),
  previous_schools:   z.array(z.string()).optional(),
  teaching_levels:    z.array(z.enum(['primary', 'secondary', 'tertiary'])).min(1, 'Selecione pelo menos um nível'),
  subjects:           z.array(z.string()).min(1, 'Selecione pelo menos uma disciplina').max(5, 'Máximo 5 disciplinas'),
  subjects_other:     z.string().optional(),

  // Motivação & Referências
  motivation_letter:  z.string().min(200, 'Carta de motivação deve ter pelo menos 200 caracteres').max(2000),
  reference_1_name:   z.string().min(3, 'Nome da referência 1 é obrigatório'),
  reference_1_phone:  z.string().min(9, 'Telefone da referência 1 é obrigatório'),
  reference_1_role:   z.string().min(2, 'Cargo da referência 1 é obrigatório'),
  reference_2_name:   z.string().optional(),
  reference_2_phone:  z.string().optional(),

  // Competências Digitais
  digital_literacy:   z.enum(['basico', 'intermedio', 'avancado']),
  has_computer:       z.boolean(),
  has_internet:       z.boolean(),
  available_hours:    z.number().int().min(1).max(40, 'Máximo 40 horas/semana'),
  preferred_schedule: z.enum(['manha', 'tarde', 'noite', 'flexivel']),

  // Credenciais de acesso
  password:           z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirm_password:   z.string()
}).refine(d => d.password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password']
}).refine(d => {
  // Validar que candidato tem pelo menos 21 anos
  const birth = new Date(d.birth_date)
  const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000)
  return age >= 21
}, {
  message: 'É necessário ter pelo menos 21 anos para se candidatar como professor',
  path: ['birth_date']
})

// ══════════════════════════════════════════════════════════════════════════════
//  Mock store de candidaturas (demo mode)
// ══════════════════════════════════════════════════════════════════════════════
export const mockTeacherApplications: any[] = [
  {
    id: 'app-001',
    full_name: 'Hélder António Chissano',
    email: 'helder.chissano@gmail.com',
    phone: '+258 84 234 5678',
    birth_date: '1988-03-14',
    national_id: '0234567890MZ',
    country_id: 'mz',
    province: 'Maputo',
    city: 'Maputo',
    address: 'Av. 25 de Setembro, 1234',
    degree: 'licenciatura',
    degree_field: 'Matemática e Física',
    institution: 'Universidade Eduardo Mondlane',
    graduation_year: 2012,
    has_teaching_cert: true,
    teaching_cert_type: 'CFPEF — Certificado de Formação de Professores',
    years_experience: 11,
    current_school: 'Escola Secundária Josina Machel',
    previous_schools: ['Escola Secundária de Machava'],
    teaching_levels: ['secondary'],
    subjects: ['Matemática', 'Física'],
    motivation_letter: 'Tenho 11 anos de experiência no ensino secundário e desejo expandir o meu alcance para estudantes que não têm acesso a boa qualidade de ensino presencial. Acredito que a educação digital é o futuro de Moçambique e quero contribuir activamente para esse processo através da plataforma VClass.',
    reference_1_name: 'Dr. João Sitoi',
    reference_1_phone: '+258 82 111 2222',
    reference_1_role: 'Director Pedagógico, ESJ Machel',
    digital_literacy: 'avancado',
    has_computer: true,
    has_internet: true,
    available_hours: 15,
    preferred_schedule: 'tarde',
    status: 'pending',
    verification_step: 'document_review',
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    score: null,
    admin_notes: '',
    documents_submitted: ['diploma_scan.pdf', 'bi_scan.pdf', 'cert_docencia.pdf'],
    flagged: false
  },
  {
    id: 'app-002',
    full_name: 'Conceição Maria Ferreira',
    email: 'conceicao.ferreira@hotmail.com',
    phone: '+244 923 456 789',
    birth_date: '1991-07-22',
    national_id: '056789012AO',
    country_id: 'ao',
    province: 'Luanda',
    city: 'Luanda',
    address: 'Rua Major Kanhangulo, 45, Bairro Ingombota',
    degree: 'mestrado',
    degree_field: 'Química e Biologia',
    institution: 'Universidade Agostinho Neto',
    graduation_year: 2016,
    has_teaching_cert: true,
    teaching_cert_type: 'INIDE — Instituto Nacional de Investigação e Desenvolvimento da Educação',
    years_experience: 8,
    current_school: 'Escola do 1º Ciclo do Ensino Secundário Patrice Lumumba',
    previous_schools: [],
    teaching_levels: ['secondary'],
    subjects: ['Química', 'Biologia'],
    motivation_letter: 'Como professora com mestrado em Química e Biologia e 8 anos de docência, sinto a necessidade urgente de criar materiais digitais de qualidade para os nossos alunos angolanos. Muitos deles vivem em províncias sem acesso a bons professores dessas disciplinas e a VClass pode ser a solução.',
    reference_1_name: 'Prof.ª Beatriz Tchilemba',
    reference_1_phone: '+244 912 333 444',
    reference_1_role: 'Directora Pedagógica, ESEP Lumumba',
    reference_2_name: 'Dr. António Mbemba',
    reference_2_phone: '+244 922 555 666',
    digital_literacy: 'intermedio',
    has_computer: true,
    has_internet: true,
    available_hours: 20,
    preferred_schedule: 'manha',
    status: 'under_review',
    verification_step: 'reference_check',
    submitted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    score: 78,
    admin_notes: 'Referências contactadas. Aguardar confirmação.',
    documents_submitted: ['diploma_scan.pdf', 'bi_scan.pdf', 'mestrado_certificado.pdf'],
    flagged: false
  },
  {
    id: 'app-003',
    full_name: 'Paulo Ernesto Nhavene',
    email: 'p.nhavene@outlook.com',
    phone: '+258 82 678 9012',
    birth_date: '1995-11-05',
    national_id: '0456789012MZ',
    country_id: 'mz',
    province: 'Inhambane',
    city: 'Inhambane',
    address: 'Bairro Muelé, Rua das Acácias, 78',
    degree: 'licenciatura',
    degree_field: 'Língua Portuguesa e Literatura',
    institution: 'Universidade Pedagógica de Moçambique',
    graduation_year: 2019,
    has_teaching_cert: false,
    teaching_cert_type: '',
    years_experience: 3,
    current_school: 'Escola Secundária de Inhambane',
    previous_schools: [],
    teaching_levels: ['secondary'],
    subjects: ['Português', 'Literatura'],
    motivation_letter: 'Sou professor de Português há 3 anos e tenho muita paixão pelo ensino. Quero criar aulas em vídeo que ajudem os estudantes a melhorar a sua expressão oral e escrita, que são competências fundamentais para o sucesso académico e profissional.',
    reference_1_name: 'Prof. Manuel Zunguza',
    reference_1_phone: '+258 84 777 8888',
    reference_1_role: 'Coordenador de Português, ESI',
    digital_literacy: 'basico',
    has_computer: false,
    has_internet: false,
    available_hours: 8,
    preferred_schedule: 'noite',
    status: 'pending',
    verification_step: 'initial_screening',
    submitted_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    score: null,
    admin_notes: 'Sem certificado de docência. Sem computador. Rever cuidadosamente.',
    documents_submitted: ['diploma_scan.pdf'],
    flagged: true
  },
  {
    id: 'app-004',
    full_name: 'Sofia Isabel Manhique',
    email: 'sofia.manhique@gmail.com',
    phone: '+258 84 345 6789',
    birth_date: '1985-04-18',
    national_id: '0123456789MZ',
    country_id: 'mz',
    province: 'Sofala',
    city: 'Beira',
    address: 'Av. Daniel Napatima, 234, Munhava',
    degree: 'doutoramento',
    degree_field: 'Física e Ciências Naturais',
    institution: 'Universidade de Coimbra + UEM',
    graduation_year: 2018,
    has_teaching_cert: true,
    teaching_cert_type: 'CFPEF + Certificado Internacional UNESCO',
    years_experience: 15,
    current_school: 'Instituto Superior de Ciências e Tecnologia de Moçambique',
    previous_schools: ['Universidade Pedagógica', 'ESS Sofala'],
    teaching_levels: ['secondary', 'tertiary'],
    subjects: ['Física', 'Ciências Naturais'],
    motivation_letter: 'Sou Doutora em Física com 15 anos de experiência no ensino universitário e secundário. O meu sonho é democratizar o ensino de Física em Moçambique através da tecnologia. Tenho experiência em produção de conteúdo digital e já leccionei online durante a pandemia.',
    reference_1_name: 'Prof. Dr. Armando Mucavele',
    reference_1_phone: '+258 21 400 1234',
    reference_1_role: 'Reitor, ISCTEM',
    reference_2_name: 'Dra. Palmira Bila',
    reference_2_phone: '+258 82 456 7890',
    digital_literacy: 'avancado',
    has_computer: true,
    has_internet: true,
    available_hours: 25,
    preferred_schedule: 'flexivel',
    status: 'approved',
    verification_step: 'completed',
    submitted_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    score: 96,
    admin_notes: 'Candidatura exemplar. Aprovação unânime. Prioridade de onboarding.',
    documents_submitted: ['diploma_scan.pdf', 'doutoramento_diploma.pdf', 'bi_scan.pdf', 'cert_docencia.pdf', 'publicacoes.pdf'],
    flagged: false,
    approved_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    approved_by: 'Administrador VClass'
  },
  {
    id: 'app-005',
    full_name: 'Roberto Caetano Tembe',
    email: 'r.tembe@yahoo.com',
    phone: '+258 82 111 2345',
    birth_date: '1992-09-30',
    national_id: '0567890123MZ',
    country_id: 'mz',
    province: 'Gaza',
    city: 'Xai-Xai',
    address: 'Bairro 1 de Maio, Rua Maputo 45',
    degree: 'licenciatura',
    degree_field: 'História e Ciências Sociais',
    institution: 'Universidade Pedagógica de Moçambique — Delegação de Gaza',
    graduation_year: 2017,
    has_teaching_cert: true,
    teaching_cert_type: 'CFPEF',
    years_experience: 6,
    current_school: 'Escola Secundária de Chibuto',
    previous_schools: [],
    teaching_levels: ['secondary'],
    subjects: ['História'],
    motivation_letter: 'Com 6 anos de experiência no ensino de História, quero contribuir para que os jovens moçambicanos compreendam a riqueza da nossa história e cultura. A educação digital permite-me alcançar estudantes em zonas rurais onde os recursos são escassos.',
    reference_1_name: 'Prof. Carlos Mondlane',
    reference_1_phone: '+258 84 234 5678',
    reference_1_role: 'Director, ES Chibuto',
    digital_literacy: 'intermedio',
    has_computer: true,
    has_internet: true,
    available_hours: 12,
    preferred_schedule: 'tarde',
    status: 'rejected',
    verification_step: 'completed',
    submitted_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    score: 42,
    admin_notes: 'Reprovado: Carta de motivação genérica. Referências não verificáveis. Solicitar reenvio de documentos e nova candidatura após 6 meses.',
    documents_submitted: ['diploma_scan.pdf'],
    flagged: true,
    rejected_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    rejection_reason: 'Documentação incompleta e referências não verificadas'
  }
]

// Scores de avaliação automática
function autoScoreApplication(app: any): number {
  let score = 0
  // Grau académico (30 pts)
  const degreeScore: Record<string, number> = {
    doutoramento: 30, mestrado: 25, licenciatura: 20, bacharel: 12, outro: 5
  }
  score += degreeScore[app.degree] || 0

  // Experiência (20 pts)
  score += Math.min(app.years_experience * 2, 20)

  // Certificado de docência (15 pts)
  if (app.has_teaching_cert) score += 15

  // Literacia digital (10 pts)
  const digScore: Record<string, number> = { avancado: 10, intermedio: 6, basico: 2 }
  score += digScore[app.digital_literacy] || 0

  // Infra-estrutura (10 pts)
  if (app.has_computer) score += 5
  if (app.has_internet) score += 5

  // Carta de motivação (10 pts — baseado no comprimento)
  const letterLen = (app.motivation_letter || '').length
  if (letterLen >= 800) score += 10
  else if (letterLen >= 500) score += 7
  else if (letterLen >= 200) score += 4

  // Disponibilidade (5 pts)
  if (app.available_hours >= 10) score += 5
  else if (app.available_hours >= 5) score += 3

  return Math.min(score, 100)
}

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/teacher-verification/apply
//  Submeter candidatura de professor
// ══════════════════════════════════════════════════════════════════════════════
tv.post('/apply', async (c) => {
  try {
    const body = await c.req.json()
    const validation = teacherApplicationSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return c.json<ApiResponse>({
        success: false,
        error: firstError.message,
        data: { field: firstError.path.join('.'), all_errors: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) }
      }, 400)
    }

    const data = validation.data

    // Validação de força da senha
    const { valid: pwdOk, message: pwdMsg } = validatePasswordStrict(data.password)
    if (!pwdOk) {
      return c.json<ApiResponse>({ success: false, error: pwdMsg }, 400)
    }

    // Verificar duplicado de email (demo mode)
    const exists = mockTeacherApplications.find(a => a.email === data.email)
    if (exists) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Já existe uma candidatura com este email. Verifique o estado em /teacher-verification.html'
      }, 409)
    }

    // Calcular score automático
    const score = autoScoreApplication(data)
    const flagged = score < 40 || !data.has_computer || !data.has_internet

    const newApp: any = {
      id: `app-${String(mockTeacherApplications.length + 1).padStart(3, '0')}`,
      ...data,
      password: undefined, // Nunca guardar em texto limpo
      confirm_password: undefined,
      status: 'pending',
      verification_step: 'initial_screening',
      submitted_at: new Date().toISOString(),
      score,
      flagged,
      admin_notes: '',
      documents_submitted: []
    }

    mockTeacherApplications.push(newApp)

    return c.json<ApiResponse>({
      success: true,
      data: {
        application_id: newApp.id,
        status: 'pending',
        message: 'Candidatura submetida com sucesso',
        estimated_review_days: 5,
        tracking_email: data.email,
        score_preview: score >= 60 ? 'Perfil promissor' : score >= 40 ? 'Perfil a avaliar' : 'Perfil com lacunas — pode ser contactado para esclarecimentos'
      },
      message: 'A sua candidatura foi recebida e será analisada em até 5 dias úteis.'
    }, 201)

  } catch (err: any) {
    console.error('Teacher apply error:', err)
    return c.json<ApiResponse>({ success: false, error: 'Erro interno do servidor' }, 500)
  }
})

// ══════════════════════════════════════════════════════════════════════════════
//  GET /api/teacher-verification/status/:email
//  Verificar estado da candidatura por email
// ══════════════════════════════════════════════════════════════════════════════
tv.get('/status/:email', async (c) => {
  const email = decodeURIComponent(c.req.param('email'))
  const app = mockTeacherApplications.find(a => a.email === email)

  if (!app) {
    return c.json<ApiResponse>({ success: false, error: 'Nenhuma candidatura encontrada com este email' }, 404)
  }

  const stepLabels: Record<string, string> = {
    initial_screening: 'Triagem inicial',
    document_review:   'Revisão de documentos',
    reference_check:   'Verificação de referências',
    interview:         'Entrevista de validação',
    final_review:      'Revisão final',
    completed:         'Processo concluído'
  }

  return c.json<ApiResponse>({
    success: true,
    data: {
      id: app.id,
      full_name: app.full_name,
      email: app.email,
      status: app.status,
      verification_step: app.verification_step,
      step_label: stepLabels[app.verification_step] || app.verification_step,
      submitted_at: app.submitted_at,
      score: app.score,
      flagged: app.flagged,
      approved_at: app.approved_at || null,
      rejected_at: app.rejected_at || null,
      rejection_reason: app.rejection_reason || null,
      documents_submitted: app.documents_submitted || [],
      estimated_days_remaining: app.status === 'pending' ? 5 : app.status === 'under_review' ? 2 : 0
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  GET /api/teacher-verification/applications  (admin only)
//  Listar todas as candidaturas com filtros
// ══════════════════════════════════════════════════════════════════════════════
tv.get('/applications', authMiddleware, requireAdmin, async (c) => {
  const status  = c.req.query('status')  || 'all'
  const country = c.req.query('country') || 'all'
  const flagged = c.req.query('flagged')
  const search  = (c.req.query('search') || '').toLowerCase()
  const page    = parseInt(c.req.query('page') || '1')
  const limit   = parseInt(c.req.query('limit') || '10')

  let apps = [...mockTeacherApplications]

  if (status  !== 'all') apps = apps.filter(a => a.status === status)
  if (country !== 'all') apps = apps.filter(a => a.country_id === country)
  if (flagged === 'true') apps = apps.filter(a => a.flagged)
  if (search) apps = apps.filter(a =>
    a.full_name.toLowerCase().includes(search) ||
    a.email.toLowerCase().includes(search) ||
    a.subjects?.some((s: string) => s.toLowerCase().includes(search))
  )

  const total  = apps.length
  const offset = (page - 1) * limit
  const paged  = apps.slice(offset, offset + limit).map(a => ({
    id: a.id, full_name: a.full_name, email: a.email, phone: a.phone,
    country_id: a.country_id, degree: a.degree, degree_field: a.degree_field,
    years_experience: a.years_experience, subjects: a.subjects,
    has_teaching_cert: a.has_teaching_cert, digital_literacy: a.digital_literacy,
    status: a.status, verification_step: a.verification_step,
    submitted_at: a.submitted_at, score: a.score, flagged: a.flagged,
    admin_notes: a.admin_notes, documents_submitted: a.documents_submitted
  }))

  const stats = {
    total: mockTeacherApplications.length,
    pending:      mockTeacherApplications.filter(a => a.status === 'pending').length,
    under_review: mockTeacherApplications.filter(a => a.status === 'under_review').length,
    approved:     mockTeacherApplications.filter(a => a.status === 'approved').length,
    rejected:     mockTeacherApplications.filter(a => a.status === 'rejected').length,
    flagged:      mockTeacherApplications.filter(a => a.flagged).length
  }

  return c.json<ApiResponse>({
    success: true,
    data: { applications: paged, total, page, limit, pages: Math.ceil(total / limit), stats }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  GET /api/teacher-verification/applications/:id  (admin)
//  Ver candidatura completa
// ══════════════════════════════════════════════════════════════════════════════
tv.get('/applications/:id', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const app = mockTeacherApplications.find(a => a.id === id)
  if (!app) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)

  return c.json<ApiResponse>({ success: true, data: { ...app, password: undefined, confirm_password: undefined } })
})

// ══════════════════════════════════════════════════════════════════════════════
//  PATCH /api/teacher-verification/applications/:id/review  (admin)
//  Actualizar status / step / notas
// ══════════════════════════════════════════════════════════════════════════════
tv.patch('/applications/:id/review', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const idx = mockTeacherApplications.findIndex(a => a.id === id)
  if (idx === -1) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)

  const body = await c.req.json() as {
    status?: string; verification_step?: string; admin_notes?: string
    score?: number; flagged?: boolean
  }

  const app = mockTeacherApplications[idx]
  if (body.status)            app.status = body.status
  if (body.verification_step) app.verification_step = body.verification_step
  if (body.admin_notes !== undefined) app.admin_notes = body.admin_notes
  if (body.score !== undefined)       app.score = body.score
  if (body.flagged !== undefined)     app.flagged = body.flagged

  return c.json<ApiResponse>({
    success: true,
    data: { id, status: app.status, verification_step: app.verification_step, score: app.score },
    message: 'Candidatura actualizada'
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/teacher-verification/applications/:id/approve  (admin)
// ══════════════════════════════════════════════════════════════════════════════
tv.post('/applications/:id/approve', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const idx = mockTeacherApplications.findIndex(a => a.id === id)
  if (idx === -1) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)

  const user = c.get('user')
  const body = await c.req.json().catch(() => ({})) as { notes?: string }
  const app  = mockTeacherApplications[idx]

  app.status = 'approved'
  app.verification_step = 'completed'
  app.approved_at = new Date().toISOString()
  app.approved_by = user.full_name || user.email
  if (body.notes) app.admin_notes = body.notes

  // Calcular score final se ainda não existe
  if (!app.score) app.score = autoScoreApplication(app)

  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'approved', approved_at: app.approved_at, score: app.score },
    message: `Professor ${app.full_name} aprovado com sucesso. Email de boas-vindas será enviado.`
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/teacher-verification/applications/:id/reject  (admin)
// ══════════════════════════════════════════════════════════════════════════════
tv.post('/applications/:id/reject', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const idx = mockTeacherApplications.findIndex(a => a.id === id)
  if (idx === -1) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)

  const user = c.get('user')
  const body = await c.req.json() as { reason: string; allow_reapply?: boolean; reapply_after_months?: number }
  if (!body.reason) return c.json<ApiResponse>({ success: false, error: 'Motivo de rejeição é obrigatório' }, 400)

  const app = mockTeacherApplications[idx]
  app.status = 'rejected'
  app.verification_step = 'completed'
  app.rejected_at = new Date().toISOString()
  app.rejected_by = user.full_name || user.email
  app.rejection_reason = body.reason
  app.allow_reapply = body.allow_reapply !== false
  app.reapply_after_months = body.reapply_after_months || 6

  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'rejected', rejected_at: app.rejected_at, reason: body.reason },
    message: `Candidatura de ${app.full_name} rejeitada. ${body.allow_reapply !== false ? `Pode candidatar-se novamente após ${body.reapply_after_months || 6} meses.` : 'Nova candidatura não permitida.'}`
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  POST /api/teacher-verification/applications/:id/request-info  (admin)
//  Pedir informações adicionais ao candidato
// ══════════════════════════════════════════════════════════════════════════════
tv.post('/applications/:id/request-info', authMiddleware, requireAdmin, async (c) => {
  const id = c.req.param('id')
  const idx = mockTeacherApplications.findIndex(a => a.id === id)
  if (idx === -1) return c.json<ApiResponse>({ success: false, error: 'Candidatura não encontrada' }, 404)

  const body = await c.req.json() as { message: string; required_documents?: string[] }
  if (!body.message) return c.json<ApiResponse>({ success: false, error: 'Mensagem é obrigatória' }, 400)

  const app = mockTeacherApplications[idx]
  app.status = 'info_requested'
  app.info_request_message = body.message
  app.required_documents = body.required_documents || []
  app.info_requested_at = new Date().toISOString()

  return c.json<ApiResponse>({
    success: true,
    data: { id, status: 'info_requested' },
    message: 'Pedido de informação enviado ao candidato por email'
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  GET /api/teacher-verification/stats  (admin)
// ══════════════════════════════════════════════════════════════════════════════
tv.get('/stats', authMiddleware, requireAdmin, async (c) => {
  const apps = mockTeacherApplications
  const byCountry = apps.reduce((acc: any, a) => {
    acc[a.country_id] = (acc[a.country_id] || 0) + 1
    return acc
  }, {})
  const byDegree = apps.reduce((acc: any, a) => {
    acc[a.degree] = (acc[a.degree] || 0) + 1
    return acc
  }, {})
  const avgScore = apps.filter(a => a.score).reduce((s, a) => s + a.score, 0) / (apps.filter(a => a.score).length || 1)

  return c.json<ApiResponse>({
    success: true,
    data: {
      total: apps.length,
      pending:      apps.filter(a => a.status === 'pending').length,
      under_review: apps.filter(a => a.status === 'under_review').length,
      approved:     apps.filter(a => a.status === 'approved').length,
      rejected:     apps.filter(a => a.status === 'rejected').length,
      info_requested: apps.filter(a => a.status === 'info_requested').length,
      flagged:      apps.filter(a => a.flagged).length,
      avg_score:    Math.round(avgScore * 10) / 10,
      by_country:   byCountry,
      by_degree:    byDegree,
      approval_rate: Math.round((apps.filter(a => a.status === 'approved').length / apps.length) * 100)
    }
  })
})

// ── Validação de senha rigorosa ───────────────────────────────────────────────
function validatePasswordStrict(pwd: string): { valid: boolean; message: string } {
  if (pwd.length < 8)          return { valid: false, message: 'Senha deve ter pelo menos 8 caracteres' }
  if (!/[A-Z]/.test(pwd))      return { valid: false, message: 'Senha deve conter pelo menos uma letra maiúscula' }
  if (!/[a-z]/.test(pwd))      return { valid: false, message: 'Senha deve conter pelo menos uma letra minúscula' }
  if (!/[0-9]/.test(pwd))      return { valid: false, message: 'Senha deve conter pelo menos um número' }
  if (!/[^A-Za-z0-9]/.test(pwd)) return { valid: false, message: 'Senha deve conter pelo menos um carácter especial (!@#$%...)' }
  return { valid: true, message: 'OK' }
}

export default tv
