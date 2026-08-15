-- Migration 029: Histórico de trocas de país/classe do estudante
--
-- Permite ao aluno trocar o seu país/classe (users.country_code/grade_id,
-- migration 015) sem re-registo, através do botão "Mudar de Classe" na
-- navbar. Limite: 5 trocas em qualquer janela de 365 dias corridos — este
-- log guarda cada troca para permitir contar essa janela deslizante
-- (COUNT(*) WHERE created_at > now() - interval '365 days').

CREATE TABLE IF NOT EXISTS public.class_switch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  previous_country_code varchar(2),
  previous_grade_id     varchar(20),
  new_country_code      varchar(2) NOT NULL,
  new_grade_id          varchar(20) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_switch_log_user_created ON public.class_switch_log(user_id, created_at);

ALTER TABLE public.class_switch_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.class_switch_log;
CREATE POLICY "service_role_only" ON public.class_switch_log
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
