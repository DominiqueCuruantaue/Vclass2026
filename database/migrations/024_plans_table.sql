-- Migration 024: Planos e preços editáveis pela equipa financeira
--
-- Antes desta migration, os planos (preços + lista de funcionalidades) estavam
-- hardcoded em src/routes/plans.ts — o painel financeiro tinha um modal de
-- "editar plano" que não gravava nada (modo demo). Agora os preços e as
-- funcionalidades vivem na BD e são lidos por /api/plans (página pública de
-- preços) e editados por /api/finance/plans (painel financeiro).
--
-- plans: um por nível (free/basic/premium) — id estável porque é referenciado
--   por subscriptions.plan_type (migration 001).
-- plan_features: lista ordenada de funcionalidades por plano, cada uma
--   marcada como incluída ou não (para a UI "✓ / ✗" das secções superiores).

CREATE TABLE plans (
  id                 VARCHAR(20)  PRIMARY KEY,
  name               VARCHAR(100) NOT NULL,
  tagline            VARCHAR(255),
  price_monthly_mzn  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_monthly_aoa  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_monthly_brl  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_monthly_eur  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly_mzn   NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly_aoa   NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly_brl   NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly_eur   NUMERIC(10,2) NOT NULL DEFAULT 0,
  yearly_saving_pct  INTEGER,
  color              VARCHAR(7)  NOT NULL DEFAULT '#6b7280',
  color_bg           VARCHAR(7)  NOT NULL DEFAULT '#f3f4f6',
  icon               VARCHAR(50) NOT NULL DEFAULT 'fa-star',
  popular            BOOLEAN     NOT NULL DEFAULT false,
  cta                VARCHAR(100) NOT NULL DEFAULT 'Escolher plano',
  cta_style          VARCHAR(20)  NOT NULL DEFAULT 'primary',
  display_order      INTEGER      NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_features (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       VARCHAR(20) NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  text          VARCHAR(255) NOT NULL,
  included      BOOLEAN     NOT NULL DEFAULT true,
  display_order INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_plan_features_plan ON plan_features(plan_id, display_order);

-- ── Seed: valores actuais de src/routes/plans.ts, para não haver regressão
-- visual até a equipa financeira editar algo ────────────────────────────────
INSERT INTO plans (id, name, tagline, price_monthly_mzn, price_monthly_aoa, price_monthly_brl, price_monthly_eur, price_yearly_mzn, price_yearly_aoa, price_yearly_brl, price_yearly_eur, yearly_saving_pct, color, color_bg, icon, popular, cta, cta_style, display_order) VALUES
('free',    'Gratuito', 'Começa sem custo',              0,   0,    0,    0,    0,    0,     0,   0,    NULL, '#6b7280', '#f3f4f6', 'fa-seedling',  false, 'Começar Grátis',        'outline', 1),
('basic',   'Básico',   'Para estudantes dedicados',     99,  800,  9.9,  1.99, 830,  6720,  83,  16.7, 30,   '#2563eb', '#eff6ff', 'fa-book-open', false, 'Subscrever Básico',     'primary', 2),
('premium', 'Premium',  'A experiência completa',        199, 1600, 19.9, 3.49, 1670, 13440, 167, 29.3, 30,   '#7c3aed', '#f5f3ff', 'fa-crown',     true,  'Subscrever Premium',    'premium', 3);

INSERT INTO plan_features (plan_id, text, included, display_order) VALUES
('free', '10 aulas por mês', true, 1),
('free', 'Exercícios básicos', true, 2),
('free', 'Biblioteca limitada (30 recursos)', true, 3),
('free', 'Chat de suporte comunitário', true, 4),
('free', 'Descarregar PDFs', false, 5),
('free', 'Chat com IA', false, 6),
('free', 'Aulas ilimitadas', false, 7),
('free', 'Acesso antecipado a novos conteúdos', false, 8),
('free', 'Certificados de conclusão', false, 9),
('free', 'Suporte prioritário', false, 10),

('basic', 'Aulas ilimitadas', true, 1),
('basic', 'Todos os exercícios', true, 2),
('basic', 'Biblioteca completa', true, 3),
('basic', 'Chat de suporte prioritário', true, 4),
('basic', 'Descarregar PDFs', true, 5),
('basic', 'Chat com IA (30 msg/dia)', true, 6),
('basic', 'Modo offline (app móvel)', false, 7),
('basic', 'Acesso antecipado a novos conteúdos', false, 8),
('basic', 'Certificados de conclusão', false, 9),
('basic', 'Sessões ao vivo com professores', false, 10),

('premium', 'Aulas ilimitadas', true, 1),
('premium', 'Exercícios ilimitados', true, 2),
('premium', 'Biblioteca completa + exclusivos', true, 3),
('premium', 'Chat de suporte prioritário', true, 4),
('premium', 'Descarregar PDFs ilimitados', true, 5),
('premium', 'Chat com IA ilimitado', true, 6),
('premium', 'Modo offline (app móvel)', true, 7),
('premium', 'Acesso antecipado a novos conteúdos', true, 8),
('premium', 'Certificados de conclusão', true, 9),
('premium', 'Sessões ao vivo com professores', true, 10);

-- RLS: mesmo padrão da 018/023 — backend usa sempre a service_role key.
-- plans/plan_features precisam ser LEGÍVEIS publicamente (página de preços
-- sem login lê via service_role de qualquer forma, isto é só defesa extra
-- caso alguma chave anon seja usada por engano), mas nunca escritas fora do
-- backend.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['plans', 'plan_features'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "public_read" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "public_read" ON public.%I FOR SELECT TO anon, authenticated USING (true);', t);
    -- CREATE POLICY só aceita um único comando por FOR — daí três políticas
    -- restritivas separadas em vez de "FOR INSERT, UPDATE, DELETE" (inválido).
    EXECUTE format('DROP POLICY IF EXISTS "no_insert" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "no_insert" ON public.%I AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);', t);
    EXECUTE format('DROP POLICY IF EXISTS "no_update" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "no_update" ON public.%I AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);', t);
    EXECUTE format('DROP POLICY IF EXISTS "no_delete" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "no_delete" ON public.%I AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);', t);
  END LOOP;
END$$;
