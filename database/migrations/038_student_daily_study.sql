-- ═════════════════════════════════════════════════════════════════════════
--  Tempo de estudo diário do aluno (gráfico "Actividade Semanal" do dashboard)
--
--  student_progress.time_spent é cumulativo por lição — não permite saber
--  quantos minutos o aluno estudou em cada dia. Esta tabela guarda segundos
--  por (aluno, dia local do aluno), incrementados por
--  POST /api/video/:lessonId/progress a cada gravação de progresso.
--  Começa vazia para cada conta nova e passa a recolher desde o primeiro vídeo.
-- ═════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS student_daily_study (
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day        DATE NOT NULL,
  seconds    INTEGER NOT NULL DEFAULT 0 CHECK (seconds >= 0),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, day)
);

ALTER TABLE student_daily_study ENABLE ROW LEVEL SECURITY;

-- Incremento atómico (INSERT ... ON CONFLICT) — duas gravações concorrentes
-- do mesmo aluno no mesmo dia somam-se em vez de uma sobrescrever a outra.
CREATE OR REPLACE FUNCTION fn_add_study_seconds(
  p_student_id UUID,
  p_day        DATE,
  p_seconds    INTEGER
) RETURNS VOID AS $$
BEGIN
  IF p_seconds IS NULL OR p_seconds <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO student_daily_study (student_id, day, seconds, updated_at)
  VALUES (p_student_id, p_day, p_seconds, NOW())
  ON CONFLICT (student_id, day)
  DO UPDATE SET seconds = student_daily_study.seconds + EXCLUDED.seconds,
                updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
