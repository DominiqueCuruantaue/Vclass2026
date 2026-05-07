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
  address          text         NOT NULL,

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
  available_hours     integer      NOT NULL CHECK (available_hours BETWEEN 1 AND 40),
  preferred_schedule  varchar(20)  NOT NULL CHECK (preferred_schedule IN ('manha','tarde','noite','flexivel')),

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
