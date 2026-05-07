-- 009_lessons_video_url.sql
-- Adiciona coluna video_url para suportar HLS/MP4 directo (testes locais sem Bunny).
-- Em produção continua a usar-se video_id (Bunny Stream); video_url é fallback opcional.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN public.lessons.video_url IS
  'URL HLS (.m3u8) ou MP4 directo. Usado quando video_id (Bunny) não está definido. Para testes locais.';
