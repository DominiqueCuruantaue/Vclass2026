-- VClass Database Seeds
-- Dados iniciais para desenvolvimento e testes

-- ============================================================================
-- COUNTRIES & EDUCATION SYSTEMS
-- ============================================================================

-- Inserir países
INSERT INTO countries (name, code, language, currency, is_active) VALUES
  ('Moçambique', 'MOZ', 'pt', 'MZN', true),
  ('Brasil', 'BRA', 'pt', 'BRL', true),
  ('Angola', 'AGO', 'pt', 'AOA', true),
  ('Portugal', 'PRT', 'pt', 'EUR', false) -- Inativo inicialmente
ON CONFLICT (code) DO NOTHING;

-- Sistemas educacionais
INSERT INTO education_systems (country_id, name, description) VALUES
  (
    (SELECT id FROM countries WHERE code = 'MOZ'),
    'Ensino Secundário Geral (ESG)',
    'Sistema de ensino secundário de Moçambique - Classes 10-12'
  ),
  (
    (SELECT id FROM countries WHERE code = 'BRA'),
    'Ensino Médio',
    'Sistema de ensino médio do Brasil - 1º ao 3º ano'
  ),
  (
    (SELECT id FROM countries WHERE code = 'AGO'),
    'Ensino Secundário',
    'Sistema de ensino secundário de Angola - Classes 10-12'
  );

-- Grades (Séries) para Moçambique
INSERT INTO grades (education_system_id, name, level, description, display_order) VALUES
  (
    (SELECT id FROM education_systems WHERE name LIKE '%ESG%'),
    '10ª Classe',
    10,
    'Primeiro ano do Ensino Secundário Geral',
    1
  ),
  (
    (SELECT id FROM education_systems WHERE name LIKE '%ESG%'),
    '11ª Classe',
    11,
    'Segundo ano do Ensino Secundário Geral',
    2
  ),
  (
    (SELECT id FROM education_systems WHERE name LIKE '%ESG%'),
    '12ª Classe',
    12,
    'Último ano do Ensino Secundário Geral',
    3
  );

-- ============================================================================
-- SUBJECTS (Disciplinas)
-- ============================================================================

INSERT INTO subjects (name, description, color) VALUES
  ('Matemática', 'Álgebra, Geometria, Cálculo e Estatística', '#3B82F6'),
  ('Português', 'Língua Portuguesa, Literatura e Gramática', '#EF4444'),
  ('Física', 'Mecânica, Termodinâmica, Eletromagnetismo e Óptica', '#10B981'),
  ('Química', 'Química Orgânica, Inorgânica e Físico-Química', '#F59E0B'),
  ('Biologia', 'Biologia Celular, Genética, Ecologia e Fisiologia', '#8B5CF6'),
  ('História', 'História de Moçambique, África e Mundial', '#EC4899'),
  ('Geografia', 'Geografia Física, Humana e Regional', '#14B8A6'),
  ('Inglês', 'Língua Inglesa, Gramática e Conversação', '#6366F1')
ON CONFLICT DO NOTHING;

-- Relacionar disciplinas com a 10ª Classe (Moçambique)
INSERT INTO grade_subjects (grade_id, subject_id, is_mandatory, workload_hours)
SELECT 
  g.id,
  s.id,
  true,
  120
FROM grades g
CROSS JOIN subjects s
WHERE g.name = '10ª Classe'
  AND s.name IN ('Matemática', 'Português', 'Física');

-- Relacionar disciplinas com a 11ª Classe
INSERT INTO grade_subjects (grade_id, subject_id, is_mandatory, workload_hours)
SELECT 
  g.id,
  s.id,
  true,
  120
FROM grades g
CROSS JOIN subjects s
WHERE g.name = '11ª Classe'
  AND s.name IN ('Matemática', 'Português', 'Química');

-- Relacionar disciplinas com a 12ª Classe
INSERT INTO grade_subjects (grade_id, subject_id, is_mandatory, workload_hours)
SELECT 
  g.id,
  s.id,
  true,
  120
FROM grades g
CROSS JOIN subjects s
WHERE g.name = '12ª Classe'
  AND s.name IN ('Matemática', 'Português', 'Biologia');

-- ============================================================================
-- TEST USERS
-- ============================================================================

-- Senha padrão para todos: "password123" (hash bcrypt)
-- Em produção, use bcrypt.hash('password123', 10)
INSERT INTO users (email, password_hash, full_name, role, country_id, is_verified) VALUES
  (
    'admin@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Administrador VClass',
    'admin',
    (SELECT id FROM countries WHERE code = 'MOZ'),
    true
  ),
  (
    'professor@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Prof. Maria Santos',
    'teacher',
    (SELECT id FROM countries WHERE code = 'MOZ'),
    true
  ),
  (
    'estudante@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'João Matola',
    'student',
    (SELECT id FROM countries WHERE code = 'MOZ'),
    true
  ),
  (
    'estudante2@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Ana Maputo',
    'student',
    (SELECT id FROM countries WHERE code = 'MOZ'),
    true
  );

-- ============================================================================
-- SAMPLE CONTENT: MATEMÁTICA 10ª CLASSE
-- ============================================================================

-- Capítulo 1: Funções
INSERT INTO chapters (grade_subject_id, title, description, display_order)
SELECT 
  gs.id,
  'Funções',
  'Introdução ao conceito de funções, domínio, contradomínio e tipos de funções',
  1
FROM grade_subjects gs
JOIN grades g ON gs.grade_id = g.id
JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '10ª Classe' AND s.name = 'Matemática';

-- Lições do Capítulo 1
INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status)
SELECT 
  c.id,
  'Introdução às Funções',
  'O que são funções? Conceitos básicos e notação matemática.',
  '# Introdução às Funções

## O que é uma Função?

Uma **função** é uma relação especial entre dois conjuntos, onde cada elemento do primeiro conjunto (domínio) está associado a exatamente um elemento do segundo conjunto (contradomínio).

## Notação

Representamos uma função como: **f: A → B**

Onde:
- **A** é o conjunto domínio
- **B** é o conjunto contradomínio
- **f** é a regra que relaciona os elementos

## Exemplo

Se f(x) = 2x + 1, então:
- f(0) = 1
- f(1) = 3
- f(2) = 5

## Representações

Uma função pode ser representada de várias formas:
1. **Diagrama de flechas**
2. **Tabela de valores**
3. **Gráfico**
4. **Fórmula matemática**

## Exercício

Calcule f(3) se f(x) = x² - 4
',
  1,
  true, -- Aula gratuita
  (SELECT id FROM users WHERE role = 'teacher' LIMIT 1),
  'published'
FROM chapters c
WHERE c.title = 'Funções';

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status)
SELECT 
  c.id,
  'Domínio e Contradomínio',
  'Aprenda a determinar o domínio e contradomínio de funções.',
  '# Domínio e Contradomínio

## Domínio (D)

O **domínio** de uma função é o conjunto de todos os valores possíveis de entrada (x).

## Contradomínio (CD)

O **contradomínio** é o conjunto de todos os valores possíveis de saída.

## Conjunto Imagem (Im)

É o conjunto de valores que a função realmente assume.

## Exemplos

### Exemplo 1: f(x) = √x
- Domínio: x ≥ 0 (números não-negativos)
- Contradomínio: ℝ
- Imagem: y ≥ 0

### Exemplo 2: g(x) = 1/x
- Domínio: x ≠ 0
- Contradomínio: ℝ
- Imagem: y ≠ 0

## Como Determinar o Domínio

1. Identifique restrições (divisão por zero, raiz negativa, etc.)
2. Exclua valores problemáticos
3. Escreva o conjunto resultante
',
  2,
  false,
  (SELECT id FROM users WHERE role = 'teacher' LIMIT 1),
  'published'
FROM chapters c
WHERE c.title = 'Funções';

-- ============================================================================
-- EXERCISES (Exercícios)
-- ============================================================================

-- Exercícios para "Introdução às Funções"
INSERT INTO exercises (lesson_id, question, question_type, explanation, display_order, points)
SELECT 
  l.id,
  'Se f(x) = 3x - 2, qual é o valor de f(4)?',
  'multiple_choice',
  'Substituindo x por 4: f(4) = 3(4) - 2 = 12 - 2 = 10',
  1,
  1
FROM lessons l
WHERE l.title = 'Introdução às Funções';

-- Opções para o exercício 1
INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT 
  e.id,
  '10',
  true,
  1
FROM exercises e
WHERE e.question LIKE 'Se f(x) = 3x - 2%';

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT e.id, '8', false, 2 FROM exercises e WHERE e.question LIKE 'Se f(x) = 3x - 2%'
UNION ALL
SELECT e.id, '12', false, 3 FROM exercises e WHERE e.question LIKE 'Se f(x) = 3x - 2%'
UNION ALL
SELECT e.id, '14', false, 4 FROM exercises e WHERE e.question LIKE 'Se f(x) = 3x - 2%';

-- Exercício 2
INSERT INTO exercises (lesson_id, question, question_type, explanation, display_order, points)
SELECT 
  l.id,
  'Uma função relaciona cada elemento do domínio a:',
  'multiple_choice',
  'Por definição, cada elemento do domínio deve estar relacionado a exatamente um elemento do contradomínio.',
  2,
  1
FROM lessons l
WHERE l.title = 'Introdução às Funções';

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT 
  e.id,
  'Exatamente um elemento do contradomínio',
  true,
  1
FROM exercises e
WHERE e.question LIKE 'Uma função relaciona%';

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT e.id, 'Vários elementos do contradomínio', false, 2 FROM exercises e WHERE e.question LIKE 'Uma função relaciona%'
UNION ALL
SELECT e.id, 'Nenhum elemento', false, 3 FROM exercises e WHERE e.question LIKE 'Uma função relaciona%'
UNION ALL
SELECT e.id, 'Qualquer elemento', false, 4 FROM exercises e WHERE e.question LIKE 'Uma função relaciona%';

-- Exercícios para "Domínio e Contradomínio"
INSERT INTO exercises (lesson_id, question, question_type, explanation, display_order, points)
SELECT 
  l.id,
  'Qual é o domínio da função f(x) = 1/(x-3)?',
  'multiple_choice',
  'O denominador não pode ser zero. Logo x - 3 ≠ 0, então x ≠ 3. Domínio: ℝ - {3}',
  1,
  1
FROM lessons l
WHERE l.title = 'Domínio e Contradomínio';

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT 
  e.id,
  'ℝ - {3}',
  true,
  1
FROM exercises e
WHERE e.question LIKE 'Qual é o domínio da função f(x) = 1/(x-3)%';

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT e.id, 'ℝ', false, 2 FROM exercises e WHERE e.question LIKE 'Qual é o domínio da função f(x) = 1/(x-3)%'
UNION ALL
SELECT e.id, 'x > 3', false, 3 FROM exercises e WHERE e.question LIKE 'Qual é o domínio da função f(x) = 1/(x-3)%'
UNION ALL
SELECT e.id, 'x < 3', false, 4 FROM exercises e WHERE e.question LIKE 'Qual é o domínio da função f(x) = 1/(x-3)%';

-- ============================================================================
-- SAMPLE SUBSCRIPTIONS
-- ============================================================================

-- Criar subscription free para estudantes
INSERT INTO subscriptions (student_id, plan_type, status, expires_at)
SELECT 
  id,
  'free',
  'active',
  NOW() + INTERVAL '1 year'
FROM users
WHERE role = 'student';

-- ============================================================================
-- COMMENTS EXAMPLE
-- ============================================================================

INSERT INTO lesson_comments (lesson_id, user_id, content)
SELECT 
  l.id,
  u.id,
  'Excelente explicação! Muito clara e fácil de entender.'
FROM lessons l
CROSS JOIN users u
WHERE l.title = 'Introdução às Funções'
  AND u.email = 'estudante@vclass.mz'
LIMIT 1;

INSERT INTO lesson_comments (lesson_id, user_id, parent_comment_id, content)
SELECT 
  lc.lesson_id,
  u.id,
  lc.id,
  'Obrigado! Fico feliz que tenha ajudado. Continue estudando!'
FROM lesson_comments lc
CROSS JOIN users u
WHERE u.role = 'teacher'
LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Visualizar resumo dos dados inseridos
SELECT 
  'Countries' as table_name, 
  COUNT(*) as records 
FROM countries
UNION ALL
SELECT 'Education Systems', COUNT(*) FROM education_systems
UNION ALL
SELECT 'Grades', COUNT(*) FROM grades
UNION ALL
SELECT 'Subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'Grade-Subjects', COUNT(*) FROM grade_subjects
UNION ALL
SELECT 'Chapters', COUNT(*) FROM chapters
UNION ALL
SELECT 'Lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'Exercises', COUNT(*) FROM exercises
UNION ALL
SELECT 'Exercise Options', COUNT(*) FROM exercise_options
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'Comments', COUNT(*) FROM lesson_comments;

-- Credenciais de teste
SELECT 
  'TEST CREDENTIALS' as info,
  email,
  'password123' as password,
  role
FROM users
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'teacher' THEN 2
    WHEN 'student' THEN 3
  END;
