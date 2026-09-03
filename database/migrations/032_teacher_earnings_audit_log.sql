-- Migration 032: Audit log genérico para operações administrativas sensíveis
-- do domínio Teacher Earnings (secção 34 do prompt de implementação).
--
-- Cobre especificamente: aprovações de lançamentos, ajustes/estornos,
-- mudanças de estado de contratos FEA/RCEsp. Não substitui os campos de
-- metadata já existentes em teacher_earnings_ledger — complementa-os com um
-- registo centralizado e pesquisável por actor/acção/entidade.

CREATE TABLE earnings_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES users(id),
  action       VARCHAR(60) NOT NULL,
  entity_type  VARCHAR(60) NOT NULL,
  entity_id    UUID,
  before_state JSONB,
  after_state  JSONB,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_earnings_audit_actor ON earnings_audit_log(actor_id, created_at);
CREATE INDEX idx_earnings_audit_entity ON earnings_audit_log(entity_type, entity_id);

ALTER TABLE earnings_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.earnings_audit_log;
CREATE POLICY "service_role_only" ON public.earnings_audit_log AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- NOTA (limitação conhecida, igual às migrations 030/031): não aplicada nem
-- testada contra Postgres real nesta sessão de trabalho.
