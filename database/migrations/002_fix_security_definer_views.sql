-- Fix: Supabase linter 0010_security_definer_view
-- Recria as views com security_invoker=true para que respeitem RLS do utilizador consultante.

ALTER VIEW public.student_dashboard SET (security_invoker = true);
ALTER VIEW public.subject_progress_view SET (security_invoker = true);
