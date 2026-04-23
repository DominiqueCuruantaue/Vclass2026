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
