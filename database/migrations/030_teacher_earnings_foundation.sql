-- Migration 030: Fundação do domínio "Teacher Earnings"
--
-- Implementa a base de dados exigida pela Política de Remuneração e
-- Comissões dos Professores VClass V1.0 (Setembro 2026), fases 2-4 do
-- VCLASS_TEACHER_EARNINGS_V1_IMPLEMENTATION_BLUEPRINT.md:
--   - watch-time server-side (não existia nenhum registo — vídeo apenas
--     devolvia 200 sem gravar nada, ver POST /api/video/:id/progress)
--   - classificação de visualizações (VQ-R/VQ-P/VQ-B/VQ-NR/VNQ, Art. 6)
--   - limite de repetição concurrency-safe (Art. 13)
--   - configuração versionada do VCPM (Art. 15)
--   - ledger financeiro imutável (Art. 28)
--
-- Fora de âmbito nesta migration (fases posteriores do blueprint):
--   settlement mensal, payouts, campanhas VQ-B, CRA/referrals, FEA, RCEsp.
--
-- Convenção seguida: RLS "deny all para anon/authenticated" igual à
-- migration 004 — o backend usa sempre a service_role key, RLS aqui é só
-- defesa extra contra uso indevido de uma chave anon.

-- ── 1. Fonte financeira elegível (Art. 5.3, Art. 10) ─────────────────────────
-- Adicionado a `subscriptions` em vez de criar tabela nova: cada visualização
-- remunerável precisa de saber que fonte financeira a sustenta, e é a
-- subscrição activa do estudante que determina isso hoje. Default mantém o
-- comportamento actual (plano pago = PAID_SUBSCRIPTION) sem quebrar linhas
-- existentes; institucional/patrocinado/etc. ficam disponíveis para a equipa
-- financeira atribuir manualmente quando esses programas existirem.
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS funding_source VARCHAR(30) NOT NULL DEFAULT 'PAID_SUBSCRIPTION'
    CHECK (funding_source IN (
      'PAID_SUBSCRIPTION', 'INSTITUTIONAL_PAID', 'SPONSORED', 'FUNDED_SCHOLARSHIP',
      'CORPORATE', 'GOVERNMENT_FUNDED', 'NGO_FUNDED', 'OTHER_ELIGIBLE'
    ));

-- ── 2. Configuração versionada da política (Art. 15, 18, 21, 31) ────────────
-- Uma alteração futura de tarifário NÃO pode alterar earnings já aprovados
-- (secção 17 do prompt de implementação) — por isso é uma tabela de versões,
-- nunca um UPDATE in-place dos valores em vigor.
CREATE TABLE earnings_policy_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_version VARCHAR(20) NOT NULL UNIQUE,
  effective_date DATE NOT NULL,
  config         JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO earnings_policy_config (policy_version, effective_date, config) VALUES (
  'V1.0',
  CURRENT_DATE,
  '{
    "vcpmTiersMzn": [
      {"minVqR": 0,      "maxVqR": 10000,  "rateMznPer1000": 100},
      {"minVqR": 10000,  "maxVqR": 50000,  "rateMznPer1000": 125},
      {"minVqR": 50000,  "maxVqR": 100000, "rateMznPer1000": 150},
      {"minVqR": 100000, "maxVqR": null,   "rateMznPer1000": 175}
    ],
    "bqeTiers": [
      {"minCompletionPct": 0,  "maxCompletionPct": 40, "bonusPct": 0},
      {"minCompletionPct": 40, "maxCompletionPct": 60, "bonusPct": 5},
      {"minCompletionPct": 60, "maxCompletionPct": 80, "bonusPct": 10},
      {"minCompletionPct": 80, "maxCompletionPct": null, "bonusPct": 15}
    ],
    "consumptionThresholds": [
      {"maxDurationSeconds": 300,  "minPct": 60, "minSeconds": null},
      {"maxDurationSeconds": 900,  "minPct": 40, "minSeconds": null},
      {"maxDurationSeconds": null, "minPct": null, "minSeconds": 300}
    ],
    "repeatLimit": 2,
    "repeatWindowDays": 30,
    "craRatePct": 15,
    "craAttributionWindowDays": 30,
    "craAttributionRule": "FIRST_CLICK",
    "minPayoutMzn": 500,
    "currency": "MZN",
    "roundingPolicy": "ROUND_HALF_UP_2DP",
    "bqeCompletionBasis": "VIDEO_CONSUMPTION"
  }'::jsonb
);

ALTER TABLE earnings_policy_config ENABLE ROW LEVEL SECURITY;

-- ── 3. Eventos brutos de consumo de vídeo (append-only, idempotente) ────────
-- O frontend/mobile envia heartbeats; cada um tem um event_id gerado no
-- cliente para que retries de rede/refresh nunca contem tempo a dobrar
-- (secção 8 do prompt de implementação — idempotência).
CREATE TABLE video_watch_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         VARCHAR(100) NOT NULL UNIQUE,
  session_token    VARCHAR(100) NOT NULL,
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  event_type       VARCHAR(20) NOT NULL CHECK (event_type IN ('play', 'heartbeat', 'pause', 'seek', 'resume', 'ended')),
  position_seconds INTEGER NOT NULL DEFAULT 0,
  delta_seconds    INTEGER NOT NULL DEFAULT 0,
  ip_address       VARCHAR(45),
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_events_session ON video_watch_events(session_token);
CREATE INDEX idx_watch_events_student_lesson ON video_watch_events(student_id, lesson_id);

ALTER TABLE video_watch_events ENABLE ROW LEVEL SECURITY;

-- ── 4. Sessão de visualização (agregado server-side por sessão) ─────────────
-- Uma linha por sessão de reprodução. `effective_watched_seconds` é a soma
-- de deltas entre heartbeats consecutivos, já protegida contra saltos
-- impossíveis (ver fn_record_watch_heartbeat) — não é simplesmente
-- last_position - first_position, que um seek falsificaria facilmente.
CREATE TABLE video_watch_sessions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token             VARCHAR(100) NOT NULL UNIQUE,
  student_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id                 UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at         TIMESTAMPTZ,
  effective_watched_seconds INTEGER NOT NULL DEFAULT 0,
  last_position_seconds     INTEGER NOT NULL DEFAULT 0,
  finalized                 BOOLEAN NOT NULL DEFAULT false,
  qualified_view_id         UUID,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_sessions_student_lesson ON video_watch_sessions(student_id, lesson_id);

ALTER TABLE video_watch_sessions ENABLE ROW LEVEL SECURITY;

-- ── 5. Classificação final da visualização (Art. 6) ─────────────────────────
-- Uma linha por sessão qualificada (UNIQUE em session_token impede dupla
-- classificação da mesma sessão — proíbe VQ-R + VQ-B simultâneos, secção 4).
CREATE TABLE qualified_views (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token               VARCHAR(100) NOT NULL UNIQUE REFERENCES video_watch_sessions(session_token),
  student_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id                   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id                  UUID REFERENCES users(id),
  classification               VARCHAR(10) NOT NULL CHECK (classification IN ('VQ-R', 'VQ-P', 'VQ-B', 'VQ-NR', 'VNQ')),
  reason_code                 VARCHAR(40),
  funding_source               VARCHAR(30),
  lesson_duration_seconds      INTEGER NOT NULL,
  effective_watched_seconds    INTEGER NOT NULL,
  threshold_required_seconds   INTEGER NOT NULL,
  policy_version               VARCHAR(20) NOT NULL DEFAULT 'V1.0',
  classified_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qualified_views_student_lesson_time ON qualified_views(student_id, lesson_id, classified_at);
CREATE INDEX idx_qualified_views_teacher_time ON qualified_views(teacher_id, classified_at);
CREATE INDEX idx_qualified_views_classification ON qualified_views(classification);

ALTER TABLE qualified_views ENABLE ROW LEVEL SECURITY;

-- ── 6. Ledger financeiro imutável (Art. 28) ──────────────────────────────────
-- Schema apenas nesta migration — o workflow de settlement/aprovação/payout
-- (Art. 30-31) é uma fase posterior do blueprint. Nenhuma linha escrita
-- automaticamente ainda; existe para as fases seguintes gravarem nela sem
-- nova migration.
CREATE TABLE teacher_earnings_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  earning_type          VARCHAR(30) NOT NULL CHECK (earning_type IN (
                           'VCPM', 'QUALITY_BONUS', 'REFERRAL_COMMISSION', 'BONIFIED_VIEW',
                           'SPECIAL_CONTENT', 'AMBASSADOR_FEE', 'ADJUSTMENT', 'REVERSAL'
                         )),
  period_start          DATE,
  period_end            DATE,
  gross_amount          NUMERIC(14, 2) NOT NULL,
  currency              VARCHAR(3) NOT NULL DEFAULT 'MZN',
  status                VARCHAR(20) NOT NULL DEFAULT 'ESTIMATED'
                           CHECK (status IN ('ESTIMATED', 'VALIDATING', 'APPROVED', 'PAID', 'ADJUSTED')),
  policy_version        VARCHAR(20) NOT NULL DEFAULT 'V1.0',
  calculation_metadata  JSONB,
  reversal_of_id        UUID REFERENCES teacher_earnings_ledger(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at          TIMESTAMPTZ,
  approved_at           TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ
);

CREATE INDEX idx_earnings_ledger_teacher_status ON teacher_earnings_ledger(teacher_id, status);
CREATE INDEX idx_earnings_ledger_period ON teacher_earnings_ledger(period_start, period_end);

ALTER TABLE teacher_earnings_ledger ENABLE ROW LEVEL SECURITY;

-- ── 7. RLS: deny-all para anon/authenticated (padrão da migration 004) ──────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'earnings_policy_config',
    'video_watch_events',
    'video_watch_sessions',
    'qualified_views',
    'teacher_earnings_ledger'
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

-- ── 8. Função atómica: registar heartbeat e classificar quando aplicável ────
--
-- Chamada uma vez por heartbeat (~15s) via supabase.rpc(...). Cada chamada
-- corre dentro da sua própria transacção Postgres, por isso é o único sítio
-- onde a decisão "esta visualização qualifica-se e é remunerável" pode ser
-- tomada em segurança contra concorrência (dois heartbeats simultâneos da
-- mesma sessão, ou duas sessões em paralelo do mesmo estudante na mesma
-- aula a tentar consumir a última vaga do limite de repetição).
--
-- pg_advisory_xact_lock serializa por (student_id, lesson_id): impede que
-- duas sessões concorrentes do MESMO estudante na MESMA aula ultrapassem o
-- limite de 2 VQ remuneráveis / 30 dias (Art. 13). O lock liberta-se
-- automaticamente no fim da transacção da função.
--
-- Devolve o estado da sessão + classificação (se já finalizada).
CREATE OR REPLACE FUNCTION fn_record_watch_heartbeat(
  p_event_id         VARCHAR(100),
  p_session_token     VARCHAR(100),
  p_student_id        UUID,
  p_lesson_id         UUID,
  p_event_type        VARCHAR(20),
  p_position_seconds  INTEGER,
  p_delta_seconds     INTEGER,
  p_ip_address        VARCHAR(45),
  p_user_agent        TEXT
) RETURNS TABLE (
  out_session_token              VARCHAR(100),
  out_effective_watched_seconds  INTEGER,
  out_finalized                  BOOLEAN,
  out_classification              VARCHAR(10),
  out_reason_code                 VARCHAR(40)
) AS $$
DECLARE
  v_lock_key            BIGINT;
  v_lesson_duration      INTEGER;
  v_lesson_is_free       BOOLEAN;
  v_teacher_id           UUID;
  v_capped_delta         INTEGER;
  v_session_effective    INTEGER;
  v_session_finalized    BOOLEAN;
  v_threshold             INTEGER;
  v_qualifies             BOOLEAN;
  v_funding_source        VARCHAR(30);
  v_is_funding_eligible   BOOLEAN;
  v_classification         VARCHAR(10);
  v_reason_code             VARCHAR(40);
  v_remunerable_count_30d   INTEGER;
  v_config                  JSONB;
  v_max_heartbeat_gap       INTEGER := 20; -- segundos; protege contra deltas absurdos (fraude/clock skew)
  v_new_qualified_view_id   UUID;
BEGIN
  -- Idempotência: evento já processado (retry de rede) → não conta segundos outra vez.
  IF EXISTS (SELECT 1 FROM video_watch_events WHERE event_id = p_event_id) THEN
    SELECT ws.session_token, ws.effective_watched_seconds, ws.finalized, qv.classification, qv.reason_code
    INTO out_session_token, out_effective_watched_seconds, out_finalized, out_classification, out_reason_code
    FROM video_watch_sessions ws
    LEFT JOIN qualified_views qv ON qv.session_token = ws.session_token
    WHERE ws.session_token = p_session_token;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Log bruto, sempre (auditoria/reconstrução) — mesmo que a sessão já esteja finalizada.
  INSERT INTO video_watch_events (event_id, session_token, student_id, lesson_id, event_type, position_seconds, delta_seconds, ip_address, user_agent)
  VALUES (p_event_id, p_session_token, p_student_id, p_lesson_id, p_event_type, p_position_seconds, p_delta_seconds, p_ip_address, p_user_agent);

  -- Serializa por (estudante, aula) — protege o limite de repetição contra concorrência.
  v_lock_key := hashtextextended(p_student_id::text || ':' || p_lesson_id::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Upsert da sessão (lock de linha implícito: só este processo, já serializado acima, escreve nela).
  INSERT INTO video_watch_sessions (session_token, student_id, lesson_id, last_heartbeat_at, last_position_seconds)
  VALUES (p_session_token, p_student_id, p_lesson_id, NOW(), p_position_seconds)
  ON CONFLICT (session_token) DO NOTHING;

  SELECT ws.effective_watched_seconds, ws.finalized
  INTO v_session_effective, v_session_finalized
  FROM video_watch_sessions ws WHERE ws.session_token = p_session_token FOR UPDATE;

  -- Sessão já classificada: nada mais a fazer (idempotente para heartbeats tardios).
  IF v_session_finalized THEN
    SELECT qv.classification, qv.reason_code INTO v_classification, v_reason_code
    FROM qualified_views qv WHERE qv.session_token = p_session_token;
    out_session_token := p_session_token;
    out_effective_watched_seconds := v_session_effective;
    out_finalized := true;
    out_classification := v_classification;
    out_reason_code := v_reason_code;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Só eventos de reprodução efectiva acumulam tempo (pause/seek não somam).
  IF p_event_type IN ('heartbeat', 'play', 'resume', 'ended') THEN
    v_capped_delta := GREATEST(0, LEAST(COALESCE(p_delta_seconds, 0), v_max_heartbeat_gap));
    v_session_effective := v_session_effective + v_capped_delta;
  END IF;

  UPDATE video_watch_sessions
  SET effective_watched_seconds = v_session_effective,
      last_position_seconds = p_position_seconds,
      last_heartbeat_at = NOW()
  WHERE video_watch_sessions.session_token = p_session_token;

  -- Limiar de qualificação (Art. 7) — mantido em sync manual com
  -- src/services/qualifiedViewEngine.ts::classifyConsumption (ver blueprint,
  -- limitação conhecida: sem harness de testes contra Postgres real nesta sessão).
  SELECT l.video_duration, l.is_free, l.created_by
  INTO v_lesson_duration, v_lesson_is_free, v_teacher_id
  FROM lessons l WHERE l.id = p_lesson_id;

  IF v_lesson_duration IS NULL OR v_lesson_duration <= 0 THEN
    v_threshold := 0; -- aula sem duração registada: não é possível qualificar por consumo
  ELSIF v_lesson_duration <= 300 THEN
    v_threshold := CEIL(v_lesson_duration * 0.60);
  ELSIF v_lesson_duration <= 900 THEN
    v_threshold := CEIL(v_lesson_duration * 0.40);
  ELSE
    v_threshold := 300;
  END IF;

  v_qualifies := v_lesson_duration > 0 AND v_session_effective >= v_threshold;

  IF NOT v_qualifies THEN
    -- Ainda não atingiu o mínimo — não finaliza; próximos heartbeats decidem.
    out_session_token := p_session_token;
    out_effective_watched_seconds := v_session_effective;
    out_finalized := false;
    out_classification := NULL;
    out_reason_code := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Atingiu o limiar agora: classificar e finalizar (uma única vez, por causa
  -- do UNIQUE(session_token) em qualified_views + do lock advisory acima).
  IF v_lesson_is_free THEN
    v_classification := 'VQ-P';
    v_reason_code := NULL;
    v_funding_source := NULL;
  ELSE
    -- Espelha exactamente src/utils/subscription.ts::getUserPlan — mesma
    -- linha "active" mais recente, mesmo tratamento de expires_at no
    -- passado como efectivamente 'free' (nada no código faz o flip
    -- automático do status para 'expired'). Manter em sync com esse ficheiro.
    SELECT s.funding_source,
           (s.status = 'active' AND s.plan_type <> 'free' AND (s.expires_at IS NULL OR s.expires_at >= NOW()))
    INTO v_funding_source, v_is_funding_eligible
    FROM subscriptions s
    WHERE s.student_id = p_student_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;

    IF NOT COALESCE(v_is_funding_eligible, false) THEN
      v_classification := 'VQ-NR';
      v_reason_code := 'INELIGIBLE_ACCESS';
    ELSE
      -- Limite de repetição: máx. 2 VQ remuneráveis por estudante/aula em 30 dias (Art. 13).
      SELECT COUNT(*) INTO v_remunerable_count_30d
      FROM qualified_views qv
      WHERE qv.student_id = p_student_id
        AND qv.lesson_id = p_lesson_id
        AND qv.classification IN ('VQ-R', 'VQ-B')
        AND qv.classified_at >= NOW() - INTERVAL '30 days';

      IF v_remunerable_count_30d >= 2 THEN
        v_classification := 'VQ-NR';
        v_reason_code := 'REPEAT_LIMIT';
      ELSE
        -- VQ-B (campanhas de bonificação) é uma fase posterior do blueprint —
        -- por agora toda visualização elegível e dentro do limite é VQ-R.
        v_classification := 'VQ-R';
        v_reason_code := NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO qualified_views (
    session_token, student_id, lesson_id, teacher_id, classification, reason_code,
    funding_source, lesson_duration_seconds, effective_watched_seconds, threshold_required_seconds, policy_version
  ) VALUES (
    p_session_token, p_student_id, p_lesson_id, v_teacher_id, v_classification, v_reason_code,
    v_funding_source, v_lesson_duration, v_session_effective, v_threshold, 'V1.0'
  )
  RETURNING qualified_views.id INTO v_new_qualified_view_id;

  UPDATE video_watch_sessions
  SET finalized = true,
      qualified_view_id = v_new_qualified_view_id
  WHERE video_watch_sessions.session_token = p_session_token;

  out_session_token := p_session_token;
  out_effective_watched_seconds := v_session_effective;
  out_finalized := true;
  out_classification := v_classification;
  out_reason_code := v_reason_code;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- NOTA IMPORTANTE (limitação conhecida, ver secção "Testes executados" do
-- relatório de implementação): esta função não foi executada contra uma
-- instância Postgres real nesta sessão de trabalho — não há ligação Supabase
-- disponível aqui. Foi escrita e revista manualmente com o máximo de cuidado
-- possível, mas DEVE ser aplicada e testada num projecto Supabase de staging
-- antes de qualquer uso em produção. Ver TE-V1-002/003/004 no blueprint.
