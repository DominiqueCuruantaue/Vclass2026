-- Migration 011: corrige chapters com grade_subject_id errado ou NULL.
--
-- Contexto: por causa de 3 bugs (A, B, C) corrigidos no commit anterior,
-- chapters podiam ter sido criados:
--   Bug A → com o grade_subject da PRIMEIRA classe vista (em vez da pretendida)
--   Bug B → com grade_subject_id NULL (regex do resolver não casava com hífen)
--   Bug C → distribuídos a todas as classes com mesmo nome de disciplina
--
-- Esta migration usa o slug do chapter (que codifica país+classe+disciplina)
-- como fonte da verdade e reatribui o grade_subject_id correto.
--
-- Suporta AMBOS os formatos de slug:
--   "mz12bio-..." (sem hífen entre classe e disciplina)
--   "mz12-bio-..." (com hífen — formato dos ids estáticos da curriculum.ts)
--
-- ⚠️ Antes de aplicar: rode o SELECT de PREVIEW abaixo (descomentado) para
--    inspecionar quais chapters serão alterados. Depois execute o UPDATE.

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 1 · PREVIEW (sem alterar nada) — execute primeiro para validar
-- ════════════════════════════════════════════════════════════════════════════

-- Descomente este bloco para ver o que será alterado:
/*
WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.title,
    c.slug,
    c.grade_subject_id AS current_gsid,
    -- Regex aceita "mz12bio-" e "mz12-bio-"
    (regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[2] AS grade_num,
    LOWER((regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[3]) AS subject_short
  FROM public.chapters c
  WHERE c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.*,
    p.grade_num || 'ª Classe' AS grade_name,
    CASE p.subject_short
      WHEN 'mat'  THEN 'Matemática'
      WHEN 'por'  THEN 'Português'
      WHEN 'port' THEN 'Português'
      WHEN 'fis'  THEN 'Física'
      WHEN 'qui'  THEN 'Química'
      WHEN 'bio'  THEN 'Biologia'
      WHEN 'geo'  THEN 'Geografia'
      WHEN 'his'  THEN 'História'
      WHEN 'ing'  THEN 'Inglês'
      WHEN 'edm'  THEN 'Ed. Moral e Cívica'
    END AS subject_name
  FROM parsed p
  WHERE p.grade_num IS NOT NULL
),
resolved AS (
  SELECT
    m.chapter_id,
    m.title,
    m.slug,
    m.current_gsid,
    gs.id AS correct_gsid,
    m.grade_name,
    m.subject_name
  FROM mapped m
  JOIN public.grades   g ON g.name = m.grade_name
  JOIN public.subjects s ON s.name = m.subject_name
  JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
)
SELECT
  CASE
    WHEN current_gsid IS NULL                     THEN '🔴 ÓRFÃO'
    WHEN current_gsid IS DISTINCT FROM correct_gsid THEN '🟡 CLASSE ERRADA'
    ELSE '🟢 OK'
  END AS estado,
  title,
  slug,
  grade_name || ' / ' || subject_name AS destino,
  current_gsid,
  correct_gsid
FROM resolved
ORDER BY estado, slug;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 2 · APLICAR CORREÇÃO
-- ════════════════════════════════════════════════════════════════════════════

WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.slug,
    c.grade_subject_id AS current_gsid,
    (regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[2] AS grade_num,
    LOWER((regexp_match(c.slug, '^([a-z]{2})(\d{1,2})-?([a-z]{3,5})-', 'i'))[3]) AS subject_short
  FROM public.chapters c
  WHERE c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.chapter_id,
    p.current_gsid,
    p.grade_num || 'ª Classe' AS grade_name,
    CASE p.subject_short
      WHEN 'mat'  THEN 'Matemática'
      WHEN 'por'  THEN 'Português'
      WHEN 'port' THEN 'Português'
      WHEN 'fis'  THEN 'Física'
      WHEN 'qui'  THEN 'Química'
      WHEN 'bio'  THEN 'Biologia'
      WHEN 'geo'  THEN 'Geografia'
      WHEN 'his'  THEN 'História'
      WHEN 'ing'  THEN 'Inglês'
      WHEN 'edm'  THEN 'Ed. Moral e Cívica'
    END AS subject_name
  FROM parsed p
  WHERE p.grade_num IS NOT NULL
)
UPDATE public.chapters AS c
SET grade_subject_id = gs.id
FROM mapped m
JOIN public.grades   g  ON g.name  = m.grade_name
JOIN public.subjects s  ON s.name  = m.subject_name
JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
WHERE c.id = m.chapter_id
  AND m.subject_name IS NOT NULL
  AND (c.grade_subject_id IS NULL OR c.grade_subject_id IS DISTINCT FROM gs.id);

-- ════════════════════════════════════════════════════════════════════════════
-- PARTE 3 · DIAGNÓSTICO PÓS-FIX
-- ════════════════════════════════════════════════════════════════════════════
-- Lista chapters que continuam órfãos (slug não casa com nenhum subject_short
-- conhecido — pode ser disciplina nova criada via /admin que não tem entrada
-- no CASE acima). Para estes, atualize o CASE ou apague/recrie manualmente.

SELECT
  c.id,
  c.title,
  c.slug,
  'Slug não resolvido — disciplina nova ou abreviação desconhecida' AS motivo
FROM public.chapters c
WHERE c.grade_subject_id IS NULL
  AND c.slug IS NOT NULL;
