-- ============================================================================
-- VClass — Setup completo do banco de dados (consolidado)
-- Gerado a partir de database/migrations/001..016, na ordem correta.
-- Rode este ficheiro inteiro de uma vez no SQL Editor de um projeto Supabase novo.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 001_initial_schema.sql
-- ────────────────────────────────────────────────────────────────────────────
-- VClass Database Migration 001: Initial Schema
-- PostgreSQL 15+ (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Countries
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'pt',
  currency VARCHAR(3),
  flag_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  phone VARCHAR(20),
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Education Systems
CREATE TABLE education_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Grades (Séries/Anos)
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_system_id UUID REFERENCES education_systems(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Subjects (Disciplinas)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Grade-Subject Relationship
CREATE TABLE grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  workload_hours INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(grade_id, subject_id)
);

-- 7. Chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_subject_id UUID REFERENCES grade_subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  video_id VARCHAR(255),
  video_duration INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Lesson Attachments
CREATE TABLE lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Exercises
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  explanation TEXT,
  display_order INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Exercise Options
CREATE TABLE exercise_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Student Progress
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  time_spent INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- 13. Exercise Submissions
CREATE TABLE exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES exercise_options(id) ON DELETE SET NULL,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, exercise_id)
);

-- 14. Lesson Comments
CREATE TABLE lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  payment_provider VARCHAR(50),
  payment_id VARCHAR(255),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Video Tokens (temporary)
CREATE TABLE video_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_country ON users(country_id);

-- Education structure
CREATE INDEX idx_edu_systems_country ON education_systems(country_id);
CREATE INDEX idx_grades_edu_system ON grades(education_system_id);
CREATE INDEX idx_grade_subjects_grade ON grade_subjects(grade_id);
CREATE INDEX idx_grade_subjects_subject ON grade_subjects(subject_id);
CREATE INDEX idx_chapters_grade_subject ON chapters(grade_subject_id);

-- Lessons
CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_created_by ON lessons(created_by);
CREATE INDEX idx_lessons_chapter_status ON lessons(chapter_id, status);

-- Progress and submissions
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_progress_status ON student_progress(status);
CREATE INDEX idx_submissions_student ON exercise_submissions(student_id);
CREATE INDEX idx_submissions_exercise ON exercise_submissions(exercise_id);

-- Exercises
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX idx_options_exercise ON exercise_options(exercise_id);

-- Comments
CREATE INDEX idx_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX idx_comments_user ON lesson_comments(user_id);

-- Video tokens
CREATE INDEX idx_video_tokens_user ON video_tokens(user_id);
CREATE INDEX idx_video_tokens_expires ON video_tokens(expires_at);

-- Full-text search
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_chapters_title_search ON chapters USING gin(to_tsvector('portuguese', title));

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Student Dashboard Summary
CREATE VIEW student_dashboard AS
SELECT 
  u.id as student_id,
  u.full_name,
  u.email,
  u.avatar_url,
  COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.status = 'completed') as lessons_completed,
  COUNT(DISTINCT es.exercise_id) as exercises_completed,
  COALESCE(AVG(CASE WHEN es.is_correct THEN 100 ELSE 0 END), 0) as avg_score,
  SUM(COALESCE(sp.time_spent, 0)) as total_time_spent_seconds
FROM users u
LEFT JOIN student_progress sp ON u.id = sp.student_id
LEFT JOIN exercise_submissions es ON u.id = es.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email, u.avatar_url;

-- Subject Progress by Student
CREATE VIEW subject_progress_view AS
SELECT 
  sp.student_id,
  s.id as subject_id,
  s.name as subject_name,
  s.color as subject_color,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END) as completed_lessons,
  ROUND(
    COALESCE(
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END)::NUMERIC / 
      NULLIF(COUNT(DISTINCT l.id), 0) * 100,
      0
    ), 2
  ) as progress_percent
FROM subjects s
JOIN grade_subjects gs ON s.id = gs.subject_id
JOIN chapters c ON gs.id = c.grade_subject_id
JOIN lessons l ON c.id = l.chapter_id
LEFT JOIN student_progress sp ON l.id = sp.lesson_id
WHERE l.status = 'published'
GROUP BY sp.student_id, s.id, s.name, s.color;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update student progress automatically
CREATE OR REPLACE FUNCTION update_lesson_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_exercises INTEGER;
  completed_exercises INTEGER;
  new_progress INTEGER;
BEGIN
  -- Count exercises for this lesson
  SELECT COUNT(*) INTO total_exercises
  FROM exercises
  WHERE lesson_id = (
    SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id
  );

  -- Count completed exercises
  SELECT COUNT(*) INTO completed_exercises
  FROM exercise_submissions
  WHERE student_id = NEW.student_id
    AND exercise_id IN (
      SELECT id FROM exercises 
      WHERE lesson_id = (SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id)
    );

  -- Calculate progress
  IF total_exercises > 0 THEN
    new_progress := ROUND((completed_exercises::NUMERIC / total_exercises) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update or insert progress
  INSERT INTO student_progress (student_id, lesson_id, progress_percent, status, updated_at)
  VALUES (
    NEW.student_id,
    (SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id),
    new_progress,
    CASE 
      WHEN new_progress >= 100 THEN 'completed'
      WHEN new_progress > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    NOW()
  )
  ON CONFLICT (student_id, lesson_id) 
  DO UPDATE SET
    progress_percent = new_progress,
    status = CASE 
      WHEN new_progress >= 100 THEN 'completed'
      WHEN new_progress > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    completed_at = CASE WHEN new_progress >= 100 THEN NOW() ELSE NULL END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress
CREATE TRIGGER trigger_update_lesson_progress
AFTER INSERT OR UPDATE ON exercise_submissions
FOR EACH ROW EXECUTE FUNCTION update_lesson_progress();

-- Function to clean expired video tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM video_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be configured in Supabase dashboard
-- or via separate migration for better management

COMMENT ON TABLE users IS 'Sistema de usuários com roles (student, teacher, admin)';
COMMENT ON TABLE lessons IS 'Lições com vídeo, conteúdo e exercícios';
COMMENT ON TABLE student_progress IS 'Tracking de progresso do estudante por lição';
COMMENT ON TABLE video_tokens IS 'Tokens temporários para streaming seguro de vídeo';

-- ────────────────────────────────────────────────────────────────────────────
-- 002_fix_security_definer_views.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Fix: Supabase linter 0010_security_definer_view
-- Recria as views com security_invoker=true para que respeitem RLS do utilizador consultante.

ALTER VIEW public.student_dashboard SET (security_invoker = true);
ALTER VIEW public.subject_progress_view SET (security_invoker = true);

-- ────────────────────────────────────────────────────────────────────────────
-- 003_fix_function_search_path.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Fix: Supabase linter 0011_function_search_path_mutable
-- Fixa search_path das funcoes para evitar hijack via schemas mutaveis.

ALTER FUNCTION public.update_lesson_progress() SET search_path = public, pg_temp;
ALTER FUNCTION public.clean_expired_tokens()   SET search_path = public, pg_temp;

-- ────────────────────────────────────────────────────────────────────────────
-- 004_explicit_rls_deny_policies.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Fix: Supabase linter 0008_rls_enabled_no_policy
-- Arquitetura VClass: backend usa service_role (bypassa RLS).
-- Utilizadores sao geridos em public.users (nao em auth.users), logo auth.uid() nao mapeia.
-- Politica explicita de negacao deixa a intencao clara: so service_role acessa estas tabelas.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users',
    'exercise_submissions',
    'lesson_attachments',
    'lesson_comments',
    'student_progress',
    'subscriptions',
    'video_tokens'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "service_role_only" ON public.%I;', t
    );
    EXECUTE format(
      'CREATE POLICY "service_role_only" ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
      t
    );
  END LOOP;
END$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 005_refresh_tokens.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 005: refresh_tokens table for revocable JWT refresh tokens
-- Arquitetura VClass: backend usa service_role (bypassa RLS).
-- Mantém-se a política restritiva de deny para anon/authenticated.

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at) WHERE revoked_at IS NULL;

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.refresh_tokens;
CREATE POLICY "service_role_only" ON public.refresh_tokens
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Garbage-collection helper: chamar periodicamente (cron job ou pg_cron)
-- DELETE refresh_tokens onde já expirou OU foi revogado há >7 dias.
CREATE OR REPLACE FUNCTION public.cleanup_expired_refresh_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.refresh_tokens
  WHERE expires_at < now()
     OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '7 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 006_teacher_applications.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 006: teacher_applications — persiste candidaturas KYT no Supabase
-- Substitui o array em memória `mockTeacherApplications`.

CREATE TABLE IF NOT EXISTS public.teacher_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados pessoais
  full_name        varchar(255) NOT NULL,
  email            varchar(255) NOT NULL UNIQUE,
  phone            varchar(50)  NOT NULL,
  birth_date       date         NOT NULL,
  national_id      varchar(50)  NOT NULL,
  country_id       varchar(10)  NOT NULL,
  province         varchar(100) NOT NULL,
  city             varchar(100) NOT NULL,
  address          text,                                          -- opcional desde a migration 027

  -- Qualificações académicas
  degree              varchar(20)  NOT NULL CHECK (degree IN ('licenciatura','mestrado','doutoramento','bacharel','outro')),
  degree_field        varchar(255) NOT NULL,
  institution         varchar(255) NOT NULL,
  graduation_year     integer      NOT NULL CHECK (graduation_year BETWEEN 1960 AND 2100),
  has_teaching_cert   boolean      NOT NULL DEFAULT false,
  teaching_cert_type  varchar(255),

  -- Experiência profissional
  years_experience    integer      NOT NULL DEFAULT 0,
  current_school      varchar(255),
  previous_schools    jsonb        DEFAULT '[]'::jsonb,
  teaching_levels     jsonb        NOT NULL,                     -- ["primary","secondary","tertiary"]
  subjects            jsonb        NOT NULL,                     -- até 5 disciplinas
  subjects_other      varchar(255),

  -- Motivação & referências
  motivation_letter   text         NOT NULL,
  reference_1_name    varchar(255) NOT NULL,
  reference_1_phone   varchar(50)  NOT NULL,
  reference_1_role    varchar(255) NOT NULL,
  reference_2_name    varchar(255),
  reference_2_phone   varchar(50),

  -- Competências digitais
  digital_literacy    varchar(20)  NOT NULL CHECK (digital_literacy IN ('basico','intermedio','avancado')),
  has_computer        boolean      NOT NULL DEFAULT false,
  has_internet        boolean      NOT NULL DEFAULT false,
  available_hours     integer      CHECK (available_hours BETWEEN 1 AND 40),                                       -- opcional desde a migration 027
  preferred_schedule  varchar(20)  CHECK (preferred_schedule IN ('manha','tarde','noite','flexivel')),              -- opcional desde a migration 027

  -- Credenciais (hash bcrypt da password do candidato — copiada para users.password_hash na aprovação)
  password_hash       varchar(255) NOT NULL,

  -- Workflow / KYT
  status              varchar(30)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','under_review','info_requested','approved','rejected')),
  verification_step   varchar(30)  NOT NULL DEFAULT 'initial_screening'
                       CHECK (verification_step IN ('initial_screening','document_review','reference_check','interview','final_review','completed')),
  score               integer      CHECK (score BETWEEN 0 AND 100),
  flagged             boolean      NOT NULL DEFAULT false,
  admin_notes         text         DEFAULT '',
  documents_link      text,                                       -- URL Drive para piloto
  documents_submitted jsonb        DEFAULT '[]'::jsonb,

  -- Pedido de info adicional
  info_request_message text,
  required_documents   jsonb       DEFAULT '[]'::jsonb,
  info_requested_at    timestamptz,

  -- Aprovação
  approved_at         timestamptz,
  approved_by         varchar(255),
  user_id             uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- conta criada na aprovação

  -- Rejeição
  rejected_at         timestamptz,
  rejected_by         varchar(255),
  rejection_reason    text,
  allow_reapply       boolean      DEFAULT true,
  reapply_after_months integer     DEFAULT 6,

  -- Timestamps
  submitted_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_apps_status     ON public.teacher_applications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_apps_country    ON public.teacher_applications(country_id);
CREATE INDEX IF NOT EXISTS idx_teacher_apps_email      ON public.teacher_applications(email);
CREATE INDEX IF NOT EXISTS idx_teacher_apps_user_id    ON public.teacher_applications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teacher_apps_submitted  ON public.teacher_applications(submitted_at DESC);

-- RLS: backend usa service_role, deny tudo o resto (consistente com migration 004)
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.teacher_applications;
CREATE POLICY "service_role_only" ON public.teacher_applications
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION public.set_teacher_apps_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teacher_apps_updated_at ON public.teacher_applications;
CREATE TRIGGER trg_teacher_apps_updated_at
  BEFORE UPDATE ON public.teacher_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_teacher_apps_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 007_chapters_slug.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 007: bridge entre curriculum.ts (slugs) e tabela chapters (UUIDs)
-- Adiciona coluna slug única para resolver slug → UUID no save da lição.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS slug varchar(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_chapters_slug ON public.chapters(slug) WHERE slug IS NOT NULL;

-- Tornar grade_subject_id nullable para piloto: permite criar chapters via API
-- sem ter ainda a árvore curricular completamente seedada na DB.
ALTER TABLE public.chapters
  ALTER COLUMN grade_subject_id DROP NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 008_backfill_chapter_grade_subject.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 008: backfill grade_subject_id em chapters auto-criados via slug.
-- Antes do fix em src/routes/creator.ts, chapters criados pelo editor de lições
-- ficavam com grade_subject_id NULL — invisíveis a /api/content/chapters/:gs_id.
--
-- O slug tem formato "{country}{grade}{subject_short}-{term}-{ord}" (ex.: mz11mat-1-1).
-- Resolvemos extraindo grade ("11" → "11ª Classe") e subject_short ("mat" → "Matemática")
-- e fazendo lookup em grade_subjects.

WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.slug,
    -- "{country}{grade}{subject_short}" antes do primeiro hífen
    substring(c.slug from '^([a-z]{2})([0-9]{2})([a-z]{3,4})-') AS prefix,
    substring(c.slug from '^[a-z]{2}([0-9]{2})[a-z]{3,4}-')     AS grade_num,
    lower(substring(c.slug from '^[a-z]{2}[0-9]{2}([a-z]{3,4})-')) AS subject_short
  FROM public.chapters c
  WHERE c.grade_subject_id IS NULL
    AND c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.chapter_id,
    p.grade_num || 'ª Classe' AS grade_name,
    CASE p.subject_short
      WHEN 'mat'  THEN 'Matemática'
      WHEN 'por'  THEN 'Português'
      WHEN 'port' THEN 'Português'
      WHEN 'fis'  THEN 'Física'
      WHEN 'qui'  THEN 'Química'
      WHEN 'bio'  THEN 'Biologia'
      WHEN 'geo'  THEN 'Geografia'
      WHEN 'his'  THEN 'História'
      WHEN 'ing'  THEN 'Inglês'
      WHEN 'edm'  THEN 'Ed. Moral e Cívica'
    END AS subject_name
  FROM parsed p
)
UPDATE public.chapters AS c
SET grade_subject_id = gs.id
FROM mapped m
JOIN public.grades   g ON g.name = m.grade_name
JOIN public.subjects s ON s.name = m.subject_name
JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
WHERE c.id = m.chapter_id
  AND m.subject_name IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 009_lessons_video_url.sql
-- ────────────────────────────────────────────────────────────────────────────
-- 009_lessons_video_url.sql
-- Adiciona coluna video_url para suportar HLS/MP4 directo (testes locais sem Bunny).
-- Em produção continua a usar-se video_id (Bunny Stream); video_url é fallback opcional.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.lessons.video_url IS
  'URL HLS (.m3u8) ou MP4 directo. Usado quando video_id (Bunny) não está definido. Para testes locais.';

-- ────────────────────────────────────────────────────────────────────────────
-- 010_chapters_creator.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 010: adicionar campos de autoria e organização aos capítulos.
-- Necessário para que professores possam criar/editar/eliminar os seus próprios capítulos.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trimester  INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_chapters_created_by ON public.chapters(created_by) WHERE created_by IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 011_fix_chapter_misassignment.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 011: corrige chapters com grade_subject_id errado ou NULL.
--
-- Contexto: por causa de 3 bugs (A, B, C) corrigidos no commit anterior,
-- chapters podiam ter sido criados:
--   Bug A → com o grade_subject da PRIMEIRA classe vista (em vez da pretendida)
--   Bug B → com grade_subject_id NULL (regex do resolver não casava com hífen)
--   Bug C → distribuídos a todas as classes com mesmo nome de disciplina
--
-- Esta migration usa o slug do chapter (que codifica país+classe+disciplina)
-- como fonte da verdade e reatribui o grade_subject_id correto.
--
-- Suporta AMBOS os formatos de slug:
--   "mz12bio-..." (sem hífen entre classe e disciplina)
--   "mz12-bio-..." (com hífen — formato dos ids estáticos da curriculum.ts)
--
-- ⚠️ Antes de aplicar: rode o SELECT de PREVIEW abaixo (descomentado) para
--    inspecionar quais chapters serão alterados. Depois execute o UPDATE.

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 1 · PREVIEW (sem alterar nada) — execute primeiro para validar
-- ════════════════════════════════════════════════════════════════════════════

-- Descomente este bloco para ver o que será alterado:
/*
WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.title,
    c.slug,
    c.grade_subject_id AS current_gsid,
    -- Regex aceita "mz12bio-" e "mz12-bio-"
    (regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[2] AS grade_num,
    LOWER((regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[3]) AS subject_short
  FROM public.chapters c
  WHERE c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.*,
    p.grade_num || 'ª Classe' AS grade_name,
    CASE p.subject_short
      WHEN 'mat'  THEN 'Matemática'
      WHEN 'por'  THEN 'Português'
      WHEN 'port' THEN 'Português'
      WHEN 'fis'  THEN 'Física'
      WHEN 'qui'  THEN 'Química'
      WHEN 'bio'  THEN 'Biologia'
      WHEN 'geo'  THEN 'Geografia'
      WHEN 'his'  THEN 'História'
      WHEN 'ing'  THEN 'Inglês'
      WHEN 'edm'  THEN 'Ed. Moral e Cívica'
    END AS subject_name
  FROM parsed p
  WHERE p.grade_num IS NOT NULL
),
resolved AS (
  SELECT
    m.chapter_id,
    m.title,
    m.slug,
    m.current_gsid,
    gs.id AS correct_gsid,
    m.grade_name,
    m.subject_name
  FROM mapped m
  JOIN public.grades   g ON g.name = m.grade_name
  JOIN public.subjects s ON s.name = m.subject_name
  JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
)
SELECT
  CASE
    WHEN current_gsid IS NULL                     THEN '🔴 ÓRFÃO'
    WHEN current_gsid IS DISTINCT FROM correct_gsid THEN '🟡 CLASSE ERRADA'
    ELSE '🟢 OK'
  END AS estado,
  title,
  slug,
  grade_name || ' / ' || subject_name AS destino,
  current_gsid,
  correct_gsid
FROM resolved
ORDER BY estado, slug;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 2 · APLICAR CORREÇÃO
-- ════════════════════════════════════════════════════════════════════════════

WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.slug,
    c.grade_subject_id AS current_gsid,
    (regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[2] AS grade_num,
    LOWER((regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[3]) AS subject_short
  FROM public.chapters c
  WHERE c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.chapter_id,
    p.current_gsid,
    p.grade_num || 'ª Classe' AS grade_name,
    CASE p.subject_short
      WHEN 'mat'  THEN 'Matemática'
      WHEN 'por'  THEN 'Português'
      WHEN 'port' THEN 'Português'
      WHEN 'fis'  THEN 'Física'
      WHEN 'qui'  THEN 'Química'
      WHEN 'bio'  THEN 'Biologia'
      WHEN 'geo'  THEN 'Geografia'
      WHEN 'his'  THEN 'História'
      WHEN 'ing'  THEN 'Inglês'
      WHEN 'edm'  THEN 'Ed. Moral e Cívica'
    END AS subject_name
  FROM parsed p
  WHERE p.grade_num IS NOT NULL
)
UPDATE public.chapters AS c
SET grade_subject_id = gs.id
FROM mapped m
JOIN public.grades   g  ON g.name  = m.grade_name
JOIN public.subjects s  ON s.name  = m.subject_name
JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
WHERE c.id = m.chapter_id
  AND m.subject_name IS NOT NULL
  AND (c.grade_subject_id IS NULL OR c.grade_subject_id IS DISTINCT FROM gs.id);

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 3 · DIAGNÓSTICO PÓS-FIX
-- ════════════════════════════════════════════════════════════════════════════
-- Lista chapters que continuam órfãos (slug não casa com nenhum subject_short
-- conhecido — pode ser disciplina nova criada via /admin que não tem entrada
-- no CASE acima). Para estes, atualize o CASE ou apague/recrie manualmente.

SELECT
  c.id,
  c.title,
  c.slug,
  'Slug não resolvido — disciplina nova ou abreviação desconhecida' AS motivo
FROM public.chapters c
WHERE c.grade_subject_id IS NULL
  AND c.slug IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 012_lessons_objectives.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 012: add objectives column to lessons
-- Stores learning objectives as a JSONB array set by the teacher.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]'::jsonb;

-- ────────────────────────────────────────────────────────────────────────────
-- 013_library_items.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 013: Library Items
-- Biblioteca Digital real — substituindo mock data
-- Livros: geridos por admin
-- Apostilas/Exercícios: criados por professores, aprovados por editor/admin

CREATE TABLE library_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  author          TEXT        NOT NULL,
  category        TEXT        NOT NULL CHECK (category IN ('books', 'handouts', 'exercises')),

  -- Vínculo curricular (opcional mas recomendado)
  subject_id      UUID        REFERENCES subjects(id) ON DELETE SET NULL,
  grade_id        UUID        REFERENCES grades(id)   ON DELETE SET NULL,

  -- Ficheiro
  file_url        TEXT,
  file_size_kb    INTEGER,
  pages           INTEGER,
  cover_url       TEXT,

  -- Metadados
  downloads_count INTEGER     NOT NULL DEFAULT 0,
  is_featured     BOOLEAN     NOT NULL DEFAULT false,

  -- Fluxo de publicação (igual às lições)
  -- draft → pending_review → published | rejected
  status          TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  rejection_reason TEXT,

  -- Autoria e aprovação
  created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para as queries mais comuns
CREATE INDEX idx_library_items_status   ON library_items(status);
CREATE INDEX idx_library_items_category ON library_items(category);
CREATE INDEX idx_library_items_subject  ON library_items(subject_id);
CREATE INDEX idx_library_items_grade    ON library_items(grade_id);
CREATE INDEX idx_library_items_creator  ON library_items(created_by);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_library_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_library_items_updated_at();

-- RPC: incrementar contador de downloads atomicamente
CREATE OR REPLACE FUNCTION increment_library_downloads(item_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE library_items
  SET downloads_count = downloads_count + 1
  WHERE id = item_id AND status = 'published';
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 014_storage_library_bucket.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 014: Bucket Supabase Storage para a Biblioteca Digital
-- Cria o bucket 'vclass-library' e define políticas de acesso:
--   • Admins e professores (service_role) podem fazer upload
--   • Ficheiros publicados são de leitura pública (alunos descarregam directamente)

-- Criar bucket (idempotente via INSERT ... ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vclass-library',
  'vclass-library',
  true,                          -- acesso público (URLs directas funcionam sem auth)
  104857600,                     -- 100 MB limite por ficheiro
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Política: apenas service_role faz upload (o backend usa service_role key)
-- O Supabase JS com service_role key ignora RLS do Storage por padrão,
-- mas definimos explicitamente para ambientes onde RLS é forçado.

-- Leitura pública (qualquer pessoa pode ver/descarregar)
CREATE POLICY "library_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vclass-library');

-- Upload: utilizadores autenticados com role admin ou teacher
-- (na prática o backend usa service_role que bypassa isto, mas fica documentado)
CREATE POLICY "library_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vclass-library' AND auth.role() = 'authenticated');

-- Delete: apenas service_role (backend)
CREATE POLICY "library_service_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vclass-library' AND auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────────────────
-- 015_add_user_country_grade.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 015: País e classe do currículo no perfil do estudante
-- Guarda os códigos curtos usados por src/data/curriculum.ts (ex: 'mz', 'mz-12c'),
-- independentes do country_id (UUID legado que referencia a tabela countries,
-- a qual só cobre Moçambique/Angola/Brasil). Usado para restringir o Explorar
-- ao currículo do próprio país/classe escolhido no registo.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_id VARCHAR(20);

-- ────────────────────────────────────────────────────────────────────────────
-- 016_rls_gap_fix.sql
-- ────────────────────────────────────────────────────────────────────────────
-- Migration 016: fecha brechas de RLS encontradas na auditoria do schema.
--
-- Contexto: a migration 004 já estabeleceu o padrão "RESTRICTIVE deny-all para
-- anon/authenticated" (arquitetura VClass: backend usa sempre service_role,
-- que ignora RLS — logo negar tudo às outras roles não quebra nada).
-- Esse padrão, porém, não cobriu todas as tabelas:
--
--   • video_tokens e lesson_attachments — a 004 já criava a política de
--     negação para estas duas, mas a 001 nunca ligou RLS nelas. Uma política
--     numa tabela com RLS desligado não é aplicada — ficaram, na prática,
--     sem nenhuma proteção.
--   • library_items (013) — criada sem RLS e sem política nenhuma.
--   • Tabelas de currículo/conteúdo (countries, education_systems, grades,
--     subjects, grade_subjects, chapters, lessons, exercises,
--     exercise_options) — nunca tiveram RLS.
--
-- Sem RLS, o PostgREST do Supabase expõe estas tabelas por defeito a quem
-- tiver a anon key (chave desenhada para ser não-secreta), permitindo
-- leitura/escrita directa contornando a API — mesmo que hoje o frontend
-- não use essa key directamente.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'video_tokens',
    'lesson_attachments',
    'library_items',
    'countries',
    'education_systems',
    'grades',
    'subjects',
    'grade_subjects',
    'chapters',
    'lessons',
    'exercises',
    'exercise_options'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "service_role_only" ON public.%I;', t);
    EXECUTE format(
      'CREATE POLICY "service_role_only" ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
      t
    );
  END LOOP;
END$$;

