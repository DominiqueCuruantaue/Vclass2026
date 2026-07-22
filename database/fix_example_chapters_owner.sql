-- Vincula os capítulos de exemplo (criados sem dono) ao professor de teste,
-- para que apareçam no dropdown "Capítulo" do editor de lições
-- (/api/creator/chapters filtra por created_by).

UPDATE chapters
SET created_by = (SELECT id FROM users WHERE email = 'professor.teste@vclass.mz')
WHERE created_by IS NULL;

-- Confirmação
SELECT title, created_by FROM chapters;
