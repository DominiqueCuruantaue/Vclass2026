-- Migration 021: feedback de revisão editorial em lessons
-- Necessário para o painel do Editor (src/routes/editor.ts) poder rejeitar
-- ou pedir alterações a uma lição com efeito real (o schema só tinha
-- draft/pending_review/published/archived, sem sítio para guardar o motivo).

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS review_feedback TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS review_action VARCHAR(20)
  CHECK (review_action IN ('rejected', 'changes_requested'));
