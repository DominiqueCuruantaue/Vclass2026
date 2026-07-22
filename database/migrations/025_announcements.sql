-- Migration 025: Avisos reais enviados pela equipa de suporte
--
-- Antes desta migration, /api/support/announcements devolvia sempre os
-- mesmos 2 avisos fictícios e "enviar aviso" não gravava nada. Agora os
-- avisos reais vivem aqui; a rota só volta a mostrar os fictícios enquanto
-- esta tabela estiver vazia (ver src/routes/support.ts).

CREATE TABLE announcements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  message      TEXT        NOT NULL,
  audience     VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (audience IN ('all','students','teachers','mz','ao','pt','br','cv')),
  sent_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  sent_by_name VARCHAR(255),
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_sent_at ON announcements(sent_at DESC);

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['announcements'];
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
