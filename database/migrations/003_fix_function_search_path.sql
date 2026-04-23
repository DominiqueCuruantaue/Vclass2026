-- Fix: Supabase linter 0011_function_search_path_mutable
-- Fixa search_path das funcoes para evitar hijack via schemas mutaveis.

ALTER FUNCTION public.update_lesson_progress() SET search_path = public, pg_temp;
ALTER FUNCTION public.clean_expired_tokens()   SET search_path = public, pg_temp;
