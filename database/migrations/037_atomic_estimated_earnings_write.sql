-- ═════════════════════════════════════════════════════════════════════════
--  Teacher Earnings V1 — escrita atómica das estimativas (fecha lacuna de
--  idempotência encontrada em auditoria de código, 2026-09-22)
--
--  Problema: writeEstimatedLedgerEntries (src/services/earningsAggregation.ts)
--  fazia DELETE das linhas ESTIMATED do período seguido de INSERT das novas,
--  em duas chamadas HTTP/transacções PostgREST separadas. Duas invocações
--  concorrentes de runEstimatePhase para o mesmo professor/período (ex.:
--  retry do cron do GitHub Actions a coincidir com um accionamento manual de
--  POST /finance/earnings/estimate) podiam intercalar-se: A apaga, B apaga
--  (no-op), A insere, B insere → linhas ESTIMATED duplicadas, que seguem até
--  VALIDATING→APPROVED→PAID e duplicam pagamento real.
--
--  Correcção: mover DELETE+INSERT para dentro de uma única função plpgsql
--  (uma única transacção Postgres) protegida por advisory lock por
--  (teacher_id, período) — mesmo padrão já usado em fn_record_watch_heartbeat
--  (migration 030) e fn_record_teacher_payout (migration 033).
-- ═════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_write_estimated_earnings(
  p_teacher_id    UUID,
  p_period_start  DATE,
  p_period_end    DATE,
  p_rows          JSONB -- array de {earning_type, gross_amount, policy_version, calculation_metadata}
) RETURNS SETOF teacher_earnings_ledger AS $$
DECLARE
  v_lock_key BIGINT;
BEGIN
  -- Serializa por (professor, período): a segunda chamada concorrente espera
  -- a primeira terminar (commit) antes de correr o seu próprio DELETE+INSERT,
  -- eliminando a janela de intercalação descrita acima.
  v_lock_key := hashtextextended('estimate:' || p_teacher_id::text || ':' || p_period_start::text || ':' || p_period_end::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  DELETE FROM teacher_earnings_ledger
  WHERE teacher_id = p_teacher_id
    AND period_start = p_period_start
    AND period_end = p_period_end
    AND status = 'ESTIMATED'
    AND earning_type IN ('VCPM', 'QUALITY_BONUS', 'BONIFIED_VIEW');

  RETURN QUERY
  INSERT INTO teacher_earnings_ledger (
    teacher_id, earning_type, period_start, period_end, gross_amount, currency,
    status, policy_version, calculation_metadata
  )
  SELECT
    p_teacher_id,
    r->>'earning_type',
    p_period_start,
    p_period_end,
    (r->>'gross_amount')::numeric,
    'MZN',
    'ESTIMATED',
    r->>'policy_version',
    r->'calculation_metadata'
  FROM jsonb_array_elements(p_rows) AS r
  RETURNING *;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- NOTA: escrita e revista manualmente nesta sessão; a mesma sessão aplicou-a
-- directamente à Supabase de produção (projecto já ligado via `supabase
-- projects list`) e correu a suite de testes automatizada depois de ajustar
-- o serviço TypeScript correspondente. Não foi possível repetir aqui o teste
-- de concorrência real ao vivo (Promise.all contra produção) feito na
-- sessão 5 do blueprint para fn_record_watch_heartbeat/fn_record_teacher_payout
-- — recomenda-se ao utilizador correr esse mesmo tipo de teste antes do
-- próximo ciclo real de settlement, se quiser confirmação empírica.
