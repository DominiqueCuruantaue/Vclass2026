-- Migration 015: País e classe do currículo no perfil do estudante
-- Guarda os códigos curtos usados por src/data/curriculum.ts (ex: 'mz', 'mz-12c'),
-- independentes do country_id (UUID legado que referencia a tabela countries,
-- a qual só cobre Moçambique/Angola/Brasil). Usado para restringir o Explorar
-- ao currículo do próprio país/classe escolhido no registo.

ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS grade_id VARCHAR(20);
