-- Migration 017: fluxo de aprovação de lições pelo admin.
--
-- Antes: o professor publicava directamente (status -> 'published'), ficando
-- a lição imediatamente visível aos estudantes, sem nenhuma revisão.
--
-- Depois: ao "publicar", o professor apenas envia a lição para a fila de
-- revisão ('pending_review'). Só um admin, ao aprovar (via painel
-- Admin > Conteúdo), muda o estado para 'published' — só aí fica visível
-- para estudantes (o filtro por `status = 'published'` para role student já
-- existia em src/routes/content.ts, não precisa de alteração).

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_status_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));
