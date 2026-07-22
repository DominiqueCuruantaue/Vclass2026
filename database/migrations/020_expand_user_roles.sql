-- Migration 020: alarga o CHECK de users.role para os papéis de staff que já
-- existem em código (middleware, rotas /api/support|editor|country|finance|moderator
-- e os respectivos dashboards) mas que a BD ainda rejeitava.

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('student','teacher','admin','support','editor','finance','moderator','country_manager'));

