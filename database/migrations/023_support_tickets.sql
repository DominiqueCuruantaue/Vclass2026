-- Migration 023: Sistema real de tickets de suporte
--
-- support_tickets: ticket aberto por um utilizador autenticado OU por um
--   visitante sem conta (o formulário em help.html não exige login — por
--   isso guest_name/guest_email existem para esse caso).
-- ticket_responses: thread de respostas (equipa de suporte ou o próprio
--   autor do ticket), incluindo a resposta marcada como resolução final.
--
-- RLS: mesmo padrão da 018_favorites_and_bookmarks.sql — o backend usa
-- sempre a service_role key (bypassa RLS); negamos tudo a anon/authenticated
-- porque toda a autorização é feita nas rotas Hono (authMiddleware / roles).

CREATE TABLE support_tickets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  guest_name  VARCHAR(255),
  guest_email VARCHAR(255),
  subject     VARCHAR(255) NOT NULL,
  message     TEXT        NOT NULL,
  category    VARCHAR(20) NOT NULL DEFAULT 'other'
              CHECK (category IN ('account','video','exercises','content','progress','technical','billing','other')),
  priority    VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status      VARCHAR(20) NOT NULL DEFAULT 'open'   CHECK (status IN ('open','in_progress','resolved')),
  sla_hours   INTEGER     NOT NULL DEFAULT 8,
  assigned_to UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND guest_email IS NOT NULL))
);

CREATE INDEX idx_support_tickets_user     ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status   ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_created  ON support_tickets(created_at DESC);

CREATE TABLE ticket_responses (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  author_role   VARCHAR(20) NOT NULL DEFAULT 'student',
  message       TEXT        NOT NULL,
  is_resolution BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_responses_ticket ON ticket_responses(ticket_id);

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['support_tickets', 'ticket_responses'];
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
