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
