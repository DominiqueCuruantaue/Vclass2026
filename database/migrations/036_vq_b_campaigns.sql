-- Migration 036: Campanhas VQ-B (visualização qualificada bonificada, Art. 6,
-- secção 11 do prompt de implementação)
--
-- Até aqui toda visualização elegível e dentro do limite de repetição
-- classificava sempre VQ-R (ver comentário removido em fn_record_watch_
-- heartbeat, migration 030). O resto do sistema já estava pronto para VQ-B
-- desde o início (CHECK de qualified_views.classification, limite de
-- repetição a contar VQ-R+VQ-B, base do BQE a incluir VQ-B) — só faltava
-- (1) uma forma de definir campanhas e (2) a classificação em si escolher
-- VQ-B quando aplicável.
--
-- Design (PDR-09, provisório — a secção 11 completa do prompt de
-- implementação não está disponível nesta sessão para confirmar ao
-- pormenor; os três tipos de taxa abaixo já estavam nomeados no blueprint
-- (gap #1) a partir de uma leitura anterior dessa secção):
--   - Uma campanha cobre um CONJUNTO DE LIÇÕES concretas (não um professor
--     nem a plataforma inteira) — a leitura mais literal de "bónus de
--     visualização EM LOTE".
--   - rate_type NORMAL_VCPM: a visualização conta para os escalões
--     progressivos normais (Art. 15-16), só é rotulada VQ-B para efeitos de
--     relatório/participação na campanha — não paga mais nem menos que uma
--     VQ-R equivalente.
--   - rate_type PERCENTAGE_OF_VCPM: paga a taxa marginal do escalão que o
--     professor atingiria de qualquer forma (Art. 15-16), multiplicada por
--     rate_value/100 (ex. 150.00 = 150%).
--   - rate_type FIXED_VCPM: paga rate_value MZN por 1000 visualizações,
--     independentemente do escalão do professor nesse período.
--   - Uma visualização VQ-B continua a contar para o limite de repetição de
--     2/aluno/aula/30 dias (Art. 13) — uma campanha não é uma forma de
--     contornar esse limite.

CREATE TABLE IF NOT EXISTS public.vq_b_campaigns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(120) NOT NULL,
  rate_type  VARCHAR(20) NOT NULL CHECK (rate_type IN ('NORMAL_VCPM', 'PERCENTAGE_OF_VCPM', 'FIXED_VCPM')),
  -- % (ex. 150.00 = 150%) para PERCENTAGE_OF_VCPM; MZN por 1000 visualizações para FIXED_VCPM; NULL para NORMAL_VCPM.
  rate_value NUMERIC(10, 2),
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_vq_b_campaign_dates CHECK (ends_at > starts_at),
  CONSTRAINT chk_vq_b_campaign_rate_value CHECK (
    (rate_type = 'NORMAL_VCPM' AND rate_value IS NULL) OR
    (rate_type <> 'NORMAL_VCPM' AND rate_value IS NOT NULL AND rate_value > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_vq_b_campaigns_active_dates ON public.vq_b_campaigns(active, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS public.vq_b_campaign_lessons (
  campaign_id UUID NOT NULL REFERENCES public.vq_b_campaigns(id) ON DELETE CASCADE,
  lesson_id   UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_vq_b_campaign_lessons_lesson ON public.vq_b_campaign_lessons(lesson_id);

ALTER TABLE public.qualified_views ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.vq_b_campaigns(id);

ALTER TABLE public.vq_b_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vq_b_campaign_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_only" ON public.vq_b_campaigns;
CREATE POLICY "service_role_only" ON public.vq_b_campaigns
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "service_role_only" ON public.vq_b_campaign_lessons;
CREATE POLICY "service_role_only" ON public.vq_b_campaign_lessons
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ── fn_record_watch_heartbeat: única mudança é a escolha VQ-R vs VQ-B ──────
-- Corpo idêntico ao da migration 030, excepto o ramo antes assinalado "VQ-B
-- é fase posterior" (agora consulta vq_b_campaigns) e o INSERT em
-- qualified_views (agora inclui campaign_id).
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
  v_max_heartbeat_gap       INTEGER := 20;
  v_new_qualified_view_id   UUID;
  v_campaign_id             UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM video_watch_events WHERE event_id = p_event_id) THEN
    SELECT ws.session_token, ws.effective_watched_seconds, ws.finalized, qv.classification, qv.reason_code
    INTO out_session_token, out_effective_watched_seconds, out_finalized, out_classification, out_reason_code
    FROM video_watch_sessions ws
    LEFT JOIN qualified_views qv ON qv.session_token = ws.session_token
    WHERE ws.session_token = p_session_token;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO video_watch_events (event_id, session_token, student_id, lesson_id, event_type, position_seconds, delta_seconds, ip_address, user_agent)
  VALUES (p_event_id, p_session_token, p_student_id, p_lesson_id, p_event_type, p_position_seconds, p_delta_seconds, p_ip_address, p_user_agent);

  v_lock_key := hashtextextended(p_student_id::text || ':' || p_lesson_id::text, 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  INSERT INTO video_watch_sessions (session_token, student_id, lesson_id, last_heartbeat_at, last_position_seconds)
  VALUES (p_session_token, p_student_id, p_lesson_id, NOW(), p_position_seconds)
  ON CONFLICT (session_token) DO NOTHING;

  SELECT ws.effective_watched_seconds, ws.finalized
  INTO v_session_effective, v_session_finalized
  FROM video_watch_sessions ws WHERE ws.session_token = p_session_token FOR UPDATE;

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

  IF p_event_type IN ('heartbeat', 'play', 'resume', 'ended') THEN
    v_capped_delta := GREATEST(0, LEAST(COALESCE(p_delta_seconds, 0), v_max_heartbeat_gap));
    v_session_effective := v_session_effective + v_capped_delta;
  END IF;

  UPDATE video_watch_sessions
  SET effective_watched_seconds = v_session_effective,
      last_position_seconds = p_position_seconds,
      last_heartbeat_at = NOW()
  WHERE video_watch_sessions.session_token = p_session_token;

  SELECT l.video_duration, l.is_free, l.created_by
  INTO v_lesson_duration, v_lesson_is_free, v_teacher_id
  FROM lessons l WHERE l.id = p_lesson_id;

  IF v_lesson_duration IS NULL OR v_lesson_duration <= 0 THEN
    v_threshold := 0;
  ELSIF v_lesson_duration <= 300 THEN
    v_threshold := CEIL(v_lesson_duration * 0.60);
  ELSIF v_lesson_duration <= 900 THEN
    v_threshold := CEIL(v_lesson_duration * 0.40);
  ELSE
    v_threshold := 300;
  END IF;

  v_qualifies := v_lesson_duration > 0 AND v_session_effective >= v_threshold;

  IF NOT v_qualifies THEN
    out_session_token := p_session_token;
    out_effective_watched_seconds := v_session_effective;
    out_finalized := false;
    out_classification := NULL;
    out_reason_code := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_lesson_is_free THEN
    v_classification := 'VQ-P';
    v_reason_code := NULL;
    v_funding_source := NULL;
  ELSE
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
        -- Campanha VQ-B activa para esta lição agora? (migration 036)
        SELECT vbc.id INTO v_campaign_id
        FROM vq_b_campaigns vbc
        JOIN vq_b_campaign_lessons vbcl ON vbcl.campaign_id = vbc.id
        WHERE vbcl.lesson_id = p_lesson_id
          AND vbc.active = true
          AND NOW() BETWEEN vbc.starts_at AND vbc.ends_at
        LIMIT 1;

        IF v_campaign_id IS NOT NULL THEN
          v_classification := 'VQ-B';
        ELSE
          v_classification := 'VQ-R';
        END IF;
        v_reason_code := NULL;
      END IF;
    END IF;
  END IF;

  INSERT INTO qualified_views (
    session_token, student_id, lesson_id, teacher_id, classification, reason_code,
    funding_source, lesson_duration_seconds, effective_watched_seconds, threshold_required_seconds, policy_version, campaign_id
  ) VALUES (
    p_session_token, p_student_id, p_lesson_id, v_teacher_id, v_classification, v_reason_code,
    v_funding_source, v_lesson_duration, v_session_effective, v_threshold, 'V1.0', v_campaign_id
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
