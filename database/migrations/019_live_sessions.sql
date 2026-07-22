-- Migration 019: Sessões Online (Google Meet)
--
-- Permite que um professor marque uma sessão ao vivo para um dos seus
-- capítulos (curso), colando o link de uma reunião já criada no Google
-- Meet. Ao marcar, todos os alunos que têm progresso registado nas lições
-- desse capítulo (a mesma definição de "meus alunos" usada em
-- GET /api/creator/students) são inscritos como destinatários e passam a
-- ver a sessão no dashboard e nas notificações.

CREATE TABLE live_sessions (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id        UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  chapter_id        UUID         NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  meet_link         TEXT         NOT NULL,
  scheduled_at      TIMESTAMPTZ  NOT NULL,
  duration_minutes  INTEGER      NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  status            VARCHAR(20)  NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_creator   ON live_sessions(creator_id);
CREATE INDEX idx_live_sessions_chapter   ON live_sessions(chapter_id);
CREATE INDEX idx_live_sessions_scheduled ON live_sessions(scheduled_at);

-- Destinatários: um por aluno convidado, com estado de leitura próprio
-- (usado tanto na secção "Sessões" do dashboard como no feed de notificações).
CREATE TABLE live_session_recipients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID        NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX idx_live_session_recipients_session ON live_session_recipients(session_id);
CREATE INDEX idx_live_session_recipients_student ON live_session_recipients(student_id);

-- RLS: mesmo padrão da 018_favorites_and_bookmarks.sql — o backend usa sempre
-- a service_role key (bypassa RLS), por isso negamos tudo a anon/authenticated.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['live_sessions', 'live_session_recipients'];
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
