-- Migration 010: adicionar campos de autoria e organização aos capítulos.
-- Necessário para que professores possam criar/editar/eliminar os seus próprios capítulos.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trimester  INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_chapters_created_by ON public.chapters(created_by) WHERE created_by IS NOT NULL;
