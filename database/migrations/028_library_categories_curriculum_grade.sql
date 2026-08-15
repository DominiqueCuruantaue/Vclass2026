-- Migration 028: Novas categorias da Biblioteca + classe curricular
--
-- Antes: category tinha 3 valores (books/handouts/exercises), sem nenhuma
-- relação com o currículo por país do aluno.
--
-- Depois: 6 categorias fixas pedidas pelo produto — Livros do Ensino Geral,
-- Apostilas, Artigos, Educação Financeira, Empreendedorismo, Obras e Poemas.
-- "Livros do Ensino Geral" passa a poder ser marcado com uma classe do
-- currículo estático (src/data/curriculum.ts — os mesmos códigos já usados
-- em users.country_code/grade_id, migration 015), para o aluno ver os livros
-- agrupados pela classe do currículo do seu próprio país.
--
-- Mapeamento dos dados existentes: 'books' -> 'ensino_geral';
-- 'handouts' e 'exercises' -> 'apostilas' (a aba "Exercícios" deixa de existir).
--
-- Nota: o constraint antigo tem de ser removido ANTES de migrar os dados —
-- senão o UPDATE para os novos valores ('ensino_geral', 'apostilas') é
-- rejeitado pelo CHECK ainda em vigor (só aceitava books/handouts/exercises).

ALTER TABLE public.library_items DROP CONSTRAINT IF EXISTS library_items_category_check;

UPDATE public.library_items SET category = 'ensino_geral' WHERE category = 'books';
UPDATE public.library_items SET category = 'apostilas' WHERE category IN ('handouts', 'exercises');

ALTER TABLE public.library_items ADD CONSTRAINT library_items_category_check
  CHECK (category IN ('ensino_geral', 'apostilas', 'artigos', 'educacao_financeira', 'empreendedorismo', 'obras_poemas'));

-- Classe do currículo estático (ex: 'mz-12c') — só usado quando category = 'ensino_geral'.
ALTER TABLE public.library_items ADD COLUMN IF NOT EXISTS curriculum_grade_id VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_library_items_curriculum_grade ON public.library_items(curriculum_grade_id);
