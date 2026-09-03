-- ═════════════════════════════════════════════════════════════════════════
--  Teacher Earnings V1 — Payout execution (Art. 31, gap #3 do blueprint)
--
--  Secção 30 do prompt de implementação é explícita: não simular um gateway
--  de disbursement sem integração validada (não existe M-Pesa/banco
--  integrado nesta plataforma — ver PDR-002). Este ficheiro NÃO integra
--  nenhum gateway. Implementa o mesmo padrão já usado para subscriptions em
--  src/routes/finance.ts ("registar o que já aconteceu fora do sistema"): a
--  equipa financeira processa a transferência manualmente (M-Pesa/banco) e
--  depois regista aqui o pagamento já efectuado, com o método e a
--  referência/prova como evidência auditável.
--
--  fn_record_teacher_payout marca atomicamente TODAS as linhas APPROVED de
--  um professor como PAID e cria o registo de payout correspondente — segue
--  o mesmo padrão de advisory lock de fn_record_watch_heartbeat (migration
--  030) para impedir pagamento duplo se dois pedidos concorrentes tentarem
--  pagar o mesmo professor ao mesmo tempo.
-- ═════════════════════════════════════════════════════════════════════════

CREATE TABLE teacher_payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_mzn       NUMERIC(14, 2) NOT NULL CHECK (amount_mzn > 0),
  currency         VARCHAR(3) NOT NULL DEFAULT 'MZN',
  method           VARCHAR(30) NOT NULL CHECK (method IN ('mpesa', 'emola', 'bank_transfer', 'other')),
  reference        VARCHAR(200),
  note             TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id),
  ledger_entry_ids UUID[] NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teacher_payouts_teacher ON teacher_payouts(teacher_id);

ALTER TABLE teacher_payouts ENABLE ROW LEVEL SECURITY;

-- ── RLS: deny-all para anon/authenticated (padrão da migration 004/030) ────
DROP POLICY IF EXISTS "service_role_only" ON public.teacher_payouts;
CREATE POLICY "service_role_only" ON public.teacher_payouts
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ── Função atómica: pagar o saldo APPROVED completo de um professor ────────
CREATE OR REPLACE FUNCTION fn_record_teacher_payout(
  p_teacher_id      UUID,
  p_method          VARCHAR(30),
  p_reference       VARCHAR(200),
  p_note            TEXT,
  p_recorded_by     UUID,
  p_min_payout_mzn  NUMERIC DEFAULT 500
) RETURNS TABLE (
  out_payout_id     UUID,
  out_amount_mzn    NUMERIC,
  out_entries_paid  INTEGER
) AS $$
DECLARE
  v_lock_key    BIGINT;
  v_total       NUMERIC;
  v_entry_ids   UUID[];
  v_payout_id   UUID;
BEGIN
  -- Serializa por professor: impede que dois pedidos de payout concorrentes
  -- para o mesmo professor paguem o mesmo saldo duas vezes.
  v_lock_key := hashtextextended('teacher_payout:' || p_teacher_id::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  SELECT COALESCE(SUM(gross_amount), 0), COALESCE(array_agg(id), ARRAY[]::UUID[])
  INTO v_total, v_entry_ids
  FROM teacher_earnings_ledger
  WHERE teacher_id = p_teacher_id AND status = 'APPROVED';

  IF v_total < p_min_payout_mzn THEN
    RAISE EXCEPTION 'Saldo aprovado (% MZN) abaixo do mínimo de pagamento (% MZN)', v_total, p_min_payout_mzn;
  END IF;

  UPDATE teacher_earnings_ledger
  SET status = 'PAID', paid_at = NOW()
  WHERE id = ANY(v_entry_ids);

  INSERT INTO teacher_payouts (teacher_id, amount_mzn, method, reference, note, recorded_by, ledger_entry_ids)
  VALUES (p_teacher_id, v_total, p_method, NULLIF(p_reference, ''), NULLIF(p_note, ''), p_recorded_by, v_entry_ids)
  RETURNING id INTO v_payout_id;

  out_payout_id := v_payout_id;
  out_amount_mzn := v_total;
  out_entries_paid := array_length(v_entry_ids, 1);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- NOTA: tal como as migrations 030-032, esta função foi escrita e revista
-- manualmente mas não foi executada contra uma instância Postgres real nesta
-- sessão — aplicar e testar em staging antes de qualquer uso em produção.
