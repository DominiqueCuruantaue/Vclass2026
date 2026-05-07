-- Migration 008: backfill grade_subject_id em chapters auto-criados via slug.
-- Antes do fix em src/routes/creator.ts, chapters criados pelo editor de lições
-- ficavam com grade_subject_id NULL — invisíveis a /api/content/chapters/:gs_id.
--
-- O slug tem formato "{country}{grade}{subject_short}-{term}-{ord}" (ex.: mz11mat-1-1).
-- Resolvemos extraindo grade ("11" → "11ª Classe") e subject_short ("mat" → "Matemática")
-- e fazendo lookup em grade_subjects.

WITH parsed AS (
  SELECT
    c.id AS chapter_id,
    c.slug,
    -- "{country}{grade}{subject_short}" antes do primeiro hífen
    substring(c.slug from '^([a-z]{2})([0-9]{2})([a-z]{3,4})-') AS prefix,
    substring(c.slug from '^[a-z]{2}([0-9]{2})[a-z]{3,4}-')     AS grade_num,
    lower(substring(c.slug from '^[a-z]{2}[0-9]{2}([a-z]{3,4})-')) AS subject_short
  FROM public.chapters c
  WHERE c.grade_subject_id IS NULL
    AND c.slug IS NOT NULL
),
mapped AS (
  SELECT
    p.chapter_id,
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
)
UPDATE public.chapters AS c
SET grade_subject_id = gs.id
FROM mapped m
JOIN public.grades   g ON g.name = m.grade_name
JOIN public.subjects s ON s.name = m.subject_name
JOIN public.grade_subjects gs ON gs.grade_id = g.id AND gs.subject_id = s.id
WHERE c.id = m.chapter_id
  AND m.subject_name IS NOT NULL;
