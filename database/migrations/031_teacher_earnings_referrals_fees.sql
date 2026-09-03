-- Migration 031: CRA (referrals), FEA (fee de embaixador) e RCEsp (conteúdo
-- especial) — Política de Remuneração V1.0, Art. 21-25.
--
-- Continuação de 030_teacher_earnings_foundation.sql. Ver
-- VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md para o desenho e as
-- limitações conhecidas (nenhuma destas funções/tabelas foi executada contra
-- Postgres real nesta sessão de trabalho).
--
-- Decisão de desenho relevante (PDR-004, primeiro-clique-vence): em vez de um
-- log de cliques (infra que não existe e a política não exige
-- explicitamente — Art. 21 só fala em "entrada pelo link ou código"), a
-- atribuição é capturada UMA VEZ no registo do estudante (auth.ts) e o
-- UNIQUE(student_id) abaixo garante que nunca é substituída por um código
-- posterior — implementa "primeiro clique vence" sem inventar infraestrutura
-- de tracking que a política não pede.

-- ── 1. Códigos de referência dos professores ─────────────────────────────────
CREATE TABLE referral_codes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(12) NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_teacher ON referral_codes(teacher_id);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

-- ── 2. Atribuição estudante → professor referenciador ────────────────────────
-- UNIQUE(student_id): um estudante só pode estar atribuído a UM professor
-- durante toda a sua vida na plataforma (a política não prevê re-atribuição;
-- "primeira compra elegível" implica uma relação de referência única).
CREATE TABLE referral_attributions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  teacher_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code         VARCHAR(12) NOT NULL,
  attributed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at          TIMESTAMPTZ,
  commission_ledger_id  UUID REFERENCES teacher_earnings_ledger(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_no_self_referral CHECK (student_id <> teacher_id)
);

CREATE INDEX idx_referral_attributions_teacher ON referral_attributions(teacher_id);

ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;

-- ── 3. Fee de Embaixador Educacional (Art. 25) ───────────────────────────────
-- Contratual, não é direito geral — cada linha é um contrato individual
-- negociado (secção 24 do prompt de implementação: "não hard-coded como
-- regra universal"). O valor de referência de 15.000 MZN/90 dias do
-- programa-piloto é só um exemplo no PDF, não um default nesta tabela.
CREATE TABLE ambassador_fee_contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_mzn          NUMERIC(12, 2) NOT NULL CHECK (amount_mzn >= 0),
  currency            VARCHAR(3) NOT NULL DEFAULT 'MZN',
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  contract_reference  VARCHAR(100),
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ambassador_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_ambassador_fee_teacher ON ambassador_fee_contracts(teacher_id, status);

ALTER TABLE ambassador_fee_contracts ENABLE ROW LEVEL SECURITY;

-- ── 4. Remuneração por Conteúdo Especial (RCEsp, Art. 25) ────────────────────
CREATE TABLE special_content_contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_reference   VARCHAR(255) NOT NULL,
  amount_mzn          NUMERIC(12, 2) NOT NULL CHECK (amount_mzn >= 0),
  currency            VARCHAR(3) NOT NULL DEFAULT 'MZN',
  period_start        DATE,
  period_end          DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'PAID', 'CANCELLED')),
  contract_reference  VARCHAR(100),
  notes               TEXT,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_special_content_teacher ON special_content_contracts(teacher_id, status);

ALTER TABLE special_content_contracts ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS: deny-all para anon/authenticated (padrão da migration 004/030) ──
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'referral_codes',
    'referral_attributions',
    'ambassador_fee_contracts',
    'special_content_contracts'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_only" ON public.%I;', t);
    EXECUTE format(
      'CREATE POLICY "service_role_only" ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);',
      t
    );
  END LOOP;
END$$;

-- NOTA (limitação conhecida): tal como a migration 030, este ficheiro não foi
-- aplicado nem testado contra uma instância Postgres real nesta sessão.
