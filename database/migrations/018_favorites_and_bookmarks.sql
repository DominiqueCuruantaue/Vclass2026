-- Migration 018: Favoritos e Marcadores de vídeo, e likes de comentários
--
-- lesson_favorites: uma aula favoritada por um estudante (toggle simples).
-- lesson_bookmarks: pontos (timestamp) guardados dentro de uma aula — várias
--   marcações por aula são permitidas, ao contrário dos favoritos.
-- increment_comment_likes: RPC para o botão de "gostei" em lesson_comments
--   (tabela já existe desde a 001_initial_schema.sql).

CREATE TABLE lesson_favorites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  lesson_id  UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, lesson_id)
);

CREATE INDEX idx_lesson_favorites_student ON lesson_favorites(student_id);
CREATE INDEX idx_lesson_favorites_lesson  ON lesson_favorites(lesson_id);

CREATE TABLE lesson_bookmarks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  lesson_id    UUID        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  time_seconds INTEGER     NOT NULL CHECK (time_seconds >= 0),
  title        TEXT        NOT NULL DEFAULT 'Marcador',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_bookmarks_student ON lesson_bookmarks(student_id);
CREATE INDEX idx_lesson_bookmarks_lesson  ON lesson_bookmarks(lesson_id);

-- RLS: mesmo padrão da 016_rls_gap_fix.sql — o backend usa sempre a
-- service_role key (bypassa RLS), por isso negamos tudo a anon/authenticated.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['lesson_favorites', 'lesson_bookmarks'];
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

-- RPC: incrementar likes de um comentário atomicamente (mesmo padrão de
-- increment_library_downloads, 013_library_items.sql)
CREATE OR REPLACE FUNCTION increment_comment_likes(comment_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE lesson_comments
  SET likes_count = likes_count + 1
  WHERE id = comment_id AND is_approved = true;
$$;
