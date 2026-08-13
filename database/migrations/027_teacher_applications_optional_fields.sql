-- Migration 027: endereço, horas disponíveis e horário preferido deixam de ser
-- pedidos no formulário de candidatura de professor (register-teacher.html) —
-- fricção sem valor de triagem real para ensino remoto (já temos país/província/
-- cidade para localização, e disponibilidade/horário são acordados após aprovação).
-- Tornar as colunas opcionais em vez de as remover preserva candidaturas antigas.

ALTER TABLE public.teacher_applications
  ALTER COLUMN address            DROP NOT NULL,
  ALTER COLUMN available_hours    DROP NOT NULL,
  ALTER COLUMN preferred_schedule DROP NOT NULL;
