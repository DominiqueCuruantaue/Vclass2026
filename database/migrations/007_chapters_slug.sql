-- Migration 007: bridge entre curriculum.ts (slugs) e tabela chapters (UUIDs)
-- Adiciona coluna slug única para resolver slug → UUID no save da lição.

ALTER TABLE public.chapters
  ADD COLUMN IF NOT EXISTS slug varchar(100) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_chapters_slug ON public.chapters(slug) WHERE slug IS NOT NULL;

-- Tornar grade_subject_id nullable para piloto: permite criar chapters via API
-- sem ter ainda a árvore curricular completamente seedada na DB.
ALTER TABLE public.chapters
  ALTER COLUMN grade_subject_id DROP NOT NULL;
