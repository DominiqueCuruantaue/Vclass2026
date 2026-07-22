-- VClass Database Seeds — 002
-- Dados fictícios adicionais para alimentar as dashboards que já leem da BD
-- a sério (student dashboard, admin dashboard, editor dashboard, creator
-- dashboard). Complementa o database/seeds/001_initial_data.sql — corre
-- depois dele (usa os países/disciplinas/classes/utilizadores de lá).
--
-- NÃO cobre: creator-analytics, creator-earnings, finance, moderator,
-- support e country dashboards — essas usam arrays MOCK_* fixos no código
-- (finance.ts, moderator.ts, support.ts, country.ts, creator.ts), não leem
-- da BD, por isso inserir dados aqui não muda o que aparece nelas.
--
-- Senha de todos os utilizadores novos: "password123" (mesmo hash do seed 001).

-- ============================================================================
-- UTILIZADORES ADICIONAIS
-- ============================================================================

-- Professores (para diversificar autoria de capítulos/lições)
INSERT INTO users (email, password_hash, full_name, role, country_id, country_code, is_verified, created_at) VALUES
  (
    'prof.ana@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Ana Cumbe', 'teacher',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '40 days'
  ),
  (
    'prof.carlos@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Carlos Nhaca', 'teacher',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '35 days'
  ),
  (
    'prof.fatima@vclass.br',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Fátima Souza', 'teacher',
    (SELECT id FROM countries WHERE code = 'BRA'), 'br', true,
    NOW() - INTERVAL '20 days'
  )
ON CONFLICT (email) DO NOTHING;

-- Staff (editor, moderador, finanças, suporte, gestor de país) — necessário
-- para os papéis existirem de facto, mesmo que os respectivos dashboards
-- ainda sejam mock; o editor-dashboard é real e precisa de um utilizador
-- 'editor' para testar o fluxo de aprovação.
INSERT INTO users (email, password_hash, full_name, role, country_id, country_code, is_verified, created_at) VALUES
  (
    'editor.paulo@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Paulo Machel', 'editor',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '30 days'
  ),
  (
    'moderador.sara@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Sara Nunes', 'moderator',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '30 days'
  ),
  (
    'financas.miguel@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Miguel Costa', 'finance',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '30 days'
  ),
  (
    'suporte.lucia@vclass.mz',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Lúcia Fernandes', 'support',
    (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', true,
    NOW() - INTERVAL '30 days'
  ),
  (
    'gestor.pt@vclass.pt',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Rui Almeida', 'country_manager',
    (SELECT id FROM countries WHERE code = 'PRT'), 'pt', true,
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (email) DO NOTHING;

-- Estudantes adicionais, espalhados por país e classe, com created_at
-- variado (alguns hoje / esta semana / semanas passadas) para alimentar os
-- gráficos e o contador "novos utilizadores" do admin dashboard.
INSERT INTO users (email, password_hash, full_name, role, country_id, country_code, grade_id, is_verified, created_at) VALUES
  (
    'sofia.chissano@vclass.mz', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Sofia Chissano', 'student', (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', 'mz-10c', true,
    NOW() - INTERVAL '25 days'
  ),
  (
    'bruno.tembe@vclass.mz', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Bruno Tembe', 'student', (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', 'mz-11c', true,
    NOW() - INTERVAL '18 days'
  ),
  (
    'ines.macamo@vclass.mz', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Inês Macamo', 'student', (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', 'mz-12c', true,
    NOW() - INTERVAL '12 days'
  ),
  (
    'miguel.neto@vclass.ao', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Miguel Neto', 'student', (SELECT id FROM countries WHERE code = 'AGO'), 'ao', NULL, true,
    NOW() - INTERVAL '9 days'
  ),
  (
    'larissa.oliveira@vclass.br', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Larissa Oliveira', 'student', (SELECT id FROM countries WHERE code = 'BRA'), 'br', NULL, true,
    NOW() - INTERVAL '6 days'
  ),
  (
    'tomas.pereira@vclass.pt', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Tomás Pereira', 'student', (SELECT id FROM countries WHERE code = 'PRT'), 'pt', NULL, true,
    NOW() - INTERVAL '3 days'
  ),
  (
    'diana.mabjaia@vclass.mz', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Diana Mabjaia', 'student', (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', 'mz-10c', true,
    NOW() - INTERVAL '1 day'
  ),
  (
    'edson.macuacua@vclass.mz', '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m',
    'Edson Macuácua', 'student', (SELECT id FROM countries WHERE code = 'MOZ'), 'mz', 'mz-11c', true,
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- CAPÍTULOS E LIÇÕES ADICIONAIS
-- ============================================================================

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Gramática: Classes de Palavras',
       'Substantivos, adjectivos, verbos e suas flexões.', 1, 'mz10por-1-1',
       (SELECT id FROM users WHERE email = 'prof.ana@vclass.mz'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '10ª Classe' AND s.name = 'Português'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Cinemática: Movimento Rectilíneo',
       'Conceitos de posição, velocidade e aceleração.', 1, 'mz10fis-1-1',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '10ª Classe' AND s.name = 'Física'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Trigonometria',
       'Razões trigonométricas e círculo trigonométrico.', 1, 'mz11mat-1-1',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '11ª Classe' AND s.name = 'Matemática'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Tabela Periódica',
       'Organização e propriedades periódicas dos elementos.', 1, 'mz11qui-1-1',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '11ª Classe' AND s.name = 'Química'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Genética Mendeliana',
       'Leis de Mendel, cruzamentos e heredogramas.', 1, 'mz12bio-1-1',
       (SELECT id FROM users WHERE email = 'prof.fatima@vclass.br'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '12ª Classe' AND s.name = 'Biologia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chapters (grade_subject_id, title, description, display_order, slug, created_by, trimester)
SELECT gs.id, 'Estatística e Probabilidade',
       'Medidas de tendência central e introdução à probabilidade.', 2, 'mz12mat-1-2',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 1
FROM grade_subjects gs JOIN grades g ON gs.grade_id = g.id JOIN subjects s ON gs.subject_id = s.id
WHERE g.name = '12ª Classe' AND s.name = 'Matemática'
ON CONFLICT (slug) DO NOTHING;

-- Lições (com video_url fictício preenchido — necessário para que lições
-- 'pending_review' apareçam nas filas do admin/editor sem depender de uma
-- Bunny Library real: isLessonVideoReady() considera pronto qualquer vídeo
-- com video_url definido, ver src/utils/bunny.ts).

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Substantivos e Adjectivos', 'Classificação e flexão de substantivos e adjectivos.',
       E'# Substantivos e Adjectivos\n\nOs substantivos nomeiam seres, objectos e ideias. Os adjectivos qualificam os substantivos.',
       1, true, (SELECT id FROM users WHERE email = 'prof.ana@vclass.mz'), 'published', 210,
       'https://demo-cdn.vclass.mz/videos/mz10por-1-1-l1.mp4', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'
FROM chapters c WHERE c.slug = 'mz10por-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Substantivos e Adjectivos');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Verbos e Conjugações', 'Tempos e modos verbais em português.',
       E'# Verbos e Conjugações\n\nOs verbos indicam acções, estados ou fenómenos, variando em tempo, modo e pessoa.',
       2, false, (SELECT id FROM users WHERE email = 'prof.ana@vclass.mz'), 'published', 95,
       'https://demo-cdn.vclass.mz/videos/mz10por-1-1-l2.mp4', NOW() - INTERVAL '19 days', NOW() - INTERVAL '17 days'
FROM chapters c WHERE c.slug = 'mz10por-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Verbos e Conjugações');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Introdução à Cinemática', 'Posição, referencial e trajectória.',
       E'# Introdução à Cinemática\n\nA cinemática estuda o movimento dos corpos sem se preocupar com as suas causas.',
       1, true, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'published', 340,
       'https://demo-cdn.vclass.mz/videos/mz10fis-1-1-l1.mp4', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
FROM chapters c WHERE c.slug = 'mz10fis-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Introdução à Cinemática');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Movimento Uniformemente Variado', 'Aceleração constante e equações do MUV.',
       E'# Movimento Uniformemente Variado\n\nQuando a aceleração é constante e não nula, o movimento é uniformemente variado.',
       2, false, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'pending_review', 0,
       'https://demo-cdn.vclass.mz/videos/mz10fis-1-1-l2.mp4', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'
FROM chapters c WHERE c.slug = 'mz10fis-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Movimento Uniformemente Variado');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Razões Trigonométricas', 'Seno, cosseno e tangente no triângulo rectângulo.',
       E'# Razões Trigonométricas\n\nAs razões trigonométricas relacionam os ângulos de um triângulo rectângulo com os seus lados.',
       1, true, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'published', 178,
       'https://demo-cdn.vclass.mz/videos/mz11mat-1-1-l1.mp4', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'
FROM chapters c WHERE c.slug = 'mz11mat-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Razões Trigonométricas');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Círculo Trigonométrico', 'Ângulos notáveis e sinais das razões trigonométricas.',
       E'# Círculo Trigonométrico\n\nO círculo trigonométrico permite visualizar os valores de seno e cosseno para qualquer ângulo.',
       2, false, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'published', 64,
       'https://demo-cdn.vclass.mz/videos/mz11mat-1-1-l2.mp4', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
FROM chapters c WHERE c.slug = 'mz11mat-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Círculo Trigonométrico');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Organização da Tabela Periódica', 'Grupos, períodos e classificação dos elementos.',
       E'# Organização da Tabela Periódica\n\nOs elementos estão organizados em grupos (colunas) e períodos (linhas).',
       1, true, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'published', 152,
       'https://demo-cdn.vclass.mz/videos/mz11qui-1-1-l1.mp4', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'
FROM chapters c WHERE c.slug = 'mz11qui-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Organização da Tabela Periódica');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at, review_feedback, review_action)
SELECT c.id, 'Propriedades Periódicas', 'Raio atómico, electronegatividade e energia de ionização.',
       E'# Propriedades Periódicas\n\n(rascunho ainda incompleto)',
       2, false, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'draft', 0,
       'https://demo-cdn.vclass.mz/videos/mz11qui-1-1-l2.mp4', NOW() - INTERVAL '8 days', NOW() - INTERVAL '5 days',
       'Conteúdo incompleto — falta a secção sobre raio atómico. Por favor revê e resubmete.', 'changes_requested'
FROM chapters c WHERE c.slug = 'mz11qui-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Propriedades Periódicas');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Leis de Mendel', 'Primeira e segunda leis de Mendel.',
       E'# Leis de Mendel\n\nGregor Mendel estabeleceu os princípios básicos da hereditariedade.',
       1, true, (SELECT id FROM users WHERE email = 'prof.fatima@vclass.br'), 'published', 289,
       'https://demo-cdn.vclass.mz/videos/mz12bio-1-1-l1.mp4', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'
FROM chapters c WHERE c.slug = 'mz12bio-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Leis de Mendel');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Cruzamentos e Heredogramas', 'Interpretação de heredogramas e cruzamentos genéticos.',
       E'# Cruzamentos e Heredogramas\n\nHeredogramas são diagramas que representam a transmissão de características ao longo de gerações.',
       2, false, (SELECT id FROM users WHERE email = 'prof.fatima@vclass.br'), 'pending_review', 0,
       'https://demo-cdn.vclass.mz/videos/mz12bio-1-1-l2.mp4', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
FROM chapters c WHERE c.slug = 'mz12bio-1-1'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Cruzamentos e Heredogramas');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Medidas de Tendência Central', 'Média, moda e mediana.',
       E'# Medidas de Tendência Central\n\nMédia, moda e mediana resumem um conjunto de dados num único valor representativo.',
       1, true, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'published', 421,
       'https://demo-cdn.vclass.mz/videos/mz12mat-1-2-l1.mp4', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'
FROM chapters c WHERE c.slug = 'mz12mat-1-2'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Medidas de Tendência Central');

INSERT INTO lessons (chapter_id, title, description, content, display_order, is_free, created_by, status, views_count, video_url, created_at, updated_at)
SELECT c.id, 'Introdução à Probabilidade', 'Espaço amostral e probabilidade de eventos.',
       E'# Introdução à Probabilidade\n\nA probabilidade mede a chance de um evento ocorrer, entre 0 e 1.',
       2, false, (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), 'archived', 58,
       'https://demo-cdn.vclass.mz/videos/mz12mat-1-2-l2.mp4', NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'
FROM chapters c WHERE c.slug = 'mz12mat-1-2'
AND NOT EXISTS (SELECT 1 FROM lessons WHERE title = 'Introdução à Probabilidade');

-- ============================================================================
-- EXERCÍCIOS ADICIONAIS (para variar a base de submissões)
-- ============================================================================

INSERT INTO exercises (lesson_id, question, question_type, explanation, display_order, points)
SELECT l.id, 'Um corpo parte do repouso com aceleração constante de 2 m/s². Qual a velocidade após 5s?',
       'multiple_choice', 'v = v0 + a*t = 0 + 2*5 = 10 m/s', 1, 1
FROM lessons l WHERE l.title = 'Introdução à Cinemática'
AND NOT EXISTS (SELECT 1 FROM exercises WHERE question LIKE 'Um corpo parte do repouso%');

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT e.id, '10 m/s', true, 1 FROM exercises e WHERE e.question LIKE 'Um corpo parte do repouso%'
UNION ALL
SELECT e.id, '2 m/s', false, 2 FROM exercises e WHERE e.question LIKE 'Um corpo parte do repouso%'
UNION ALL
SELECT e.id, '5 m/s', false, 3 FROM exercises e WHERE e.question LIKE 'Um corpo parte do repouso%'
UNION ALL
SELECT e.id, '20 m/s', false, 4 FROM exercises e WHERE e.question LIKE 'Um corpo parte do repouso%';

INSERT INTO exercises (lesson_id, question, question_type, explanation, display_order, points)
SELECT l.id, 'Num triângulo rectângulo, o seno de um ângulo é a razão entre:',
       'multiple_choice', 'Seno = cateto oposto / hipotenusa.', 1, 1
FROM lessons l WHERE l.title = 'Razões Trigonométricas'
AND NOT EXISTS (SELECT 1 FROM exercises WHERE question LIKE 'Num triângulo rectângulo, o seno%');

INSERT INTO exercise_options (exercise_id, option_text, is_correct, display_order)
SELECT e.id, 'Cateto oposto e hipotenusa', true, 1 FROM exercises e WHERE e.question LIKE 'Num triângulo rectângulo, o seno%'
UNION ALL
SELECT e.id, 'Cateto adjacente e hipotenusa', false, 2 FROM exercises e WHERE e.question LIKE 'Num triângulo rectângulo, o seno%'
UNION ALL
SELECT e.id, 'Cateto oposto e cateto adjacente', false, 3 FROM exercises e WHERE e.question LIKE 'Num triângulo rectângulo, o seno%';

-- ============================================================================
-- SUBMISSÕES DE EXERCÍCIOS (para preencher média de acerto e gráficos)
-- ============================================================================

INSERT INTO exercise_submissions (student_id, exercise_id, is_correct, points_earned, submitted_at)
SELECT u.id, e.id, v.is_correct, v.is_correct::int, NOW() - (v.days_ago::text || ' days')::interval
FROM (VALUES
  ('estudante@vclass.mz',        'Se f(x) = 3x - 2%',                  true,  1),
  ('estudante2@vclass.mz',       'Se f(x) = 3x - 2%',                  false, 6),
  ('sofia.chissano@vclass.mz',   'Uma função relaciona%',              true,  0),
  ('bruno.tembe@vclass.mz',      'Uma função relaciona%',              true,  1),
  ('ines.macamo@vclass.mz',      'Qual é o domínio da função%',        true,  2),
  ('miguel.neto@vclass.ao',      'Qual é o domínio da função%',        false, 4),
  ('larissa.oliveira@vclass.br', 'Um corpo parte do repouso%',         true,  1),
  ('tomas.pereira@vclass.pt',    'Um corpo parte do repouso%',         false, 5),
  ('diana.mabjaia@vclass.mz',    'Num triângulo rectângulo, o seno%',  true,  0),
  ('edson.macuacua@vclass.mz',   'Num triângulo rectângulo, o seno%',  true,  3)
) AS v(email, question_like, is_correct, days_ago)
JOIN users u ON u.email = v.email
JOIN exercises e ON e.question LIKE v.question_like
ON CONFLICT (student_id, exercise_id) DO NOTHING;

-- ============================================================================
-- PROGRESSO DOS ALUNOS (student_progress)
-- ============================================================================

INSERT INTO student_progress (student_id, lesson_id, status, progress_percent, time_spent, created_at, updated_at)
SELECT u.id, l.id, v.status, v.pct, v.secs,
       NOW() - (v.days_ago::text || ' days')::interval, NOW() - (v.days_ago::text || ' days')::interval
FROM (VALUES
  ('estudante@vclass.mz',        'Introdução às Funções',            'completed',   100, 900,  1),
  ('estudante@vclass.mz',        'Domínio e Contradomínio',          'in_progress', 60,  420,  1),
  ('estudante2@vclass.mz',       'Introdução às Funções',            'completed',   100, 780,  3),
  ('sofia.chissano@vclass.mz',   'Substantivos e Adjectivos',        'completed',   100, 650,  2),
  ('sofia.chissano@vclass.mz',   'Verbos e Conjugações',             'in_progress', 45,  300,  1),
  ('bruno.tembe@vclass.mz',      'Razões Trigonométricas',           'completed',   100, 1100, 4),
  ('bruno.tembe@vclass.mz',      'Círculo Trigonométrico',           'in_progress', 30,  240,  2),
  ('ines.macamo@vclass.mz',      'Leis de Mendel',                   'completed',   100, 980,  5),
  ('ines.macamo@vclass.mz',      'Medidas de Tendência Central',     'in_progress', 70,  560,  3),
  ('miguel.neto@vclass.ao',      'Introdução à Cinemática',          'completed',   100, 720,  6),
  ('larissa.oliveira@vclass.br', 'Organização da Tabela Periódica',  'in_progress', 55,  400,  2),
  ('tomas.pereira@vclass.pt',    'Introdução às Funções',            'completed',   100, 850,  7),
  ('diana.mabjaia@vclass.mz',    'Substantivos e Adjectivos',        'in_progress', 20,  150,  0),
  ('edson.macuacua@vclass.mz',   'Razões Trigonométricas',           'completed',   100, 990,  1)
) AS v(email, lesson_title, status, pct, secs, days_ago)
JOIN users u ON u.email = v.email
JOIN lessons l ON l.title = v.lesson_title
ON CONFLICT (student_id, lesson_id) DO NOTHING;

-- ============================================================================
-- SUBSCRIÇÕES DOS NOVOS ESTUDANTES
-- ============================================================================

INSERT INTO subscriptions (student_id, plan_type, status, started_at, expires_at, payment_provider, amount)
SELECT u.id, v.plan_type, v.status, NOW() - INTERVAL '30 days',
       CASE v.status WHEN 'expired' THEN NOW() - INTERVAL '2 days' ELSE NOW() + INTERVAL '1 year' END,
       v.provider, v.amount
FROM (VALUES
  ('sofia.chissano@vclass.mz',   'basic',   'active',    'mpesa',   199.00),
  ('bruno.tembe@vclass.mz',      'premium', 'active',    'mpesa',   499.00),
  ('ines.macamo@vclass.mz',      'free',    'active',    NULL,      0.00),
  ('miguel.neto@vclass.ao',      'basic',   'cancelled', 'unitel_money', 199.00),
  ('larissa.oliveira@vclass.br', 'premium', 'active',    'pix',     499.00),
  ('tomas.pereira@vclass.pt',    'free',    'active',    NULL,      0.00),
  ('diana.mabjaia@vclass.mz',    'basic',   'expired',   'mpesa',   199.00),
  ('edson.macuacua@vclass.mz',   'free',    'active',    NULL,      0.00)
) AS v(email, plan_type, status, provider, amount)
JOIN users u ON u.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM subscriptions sub WHERE sub.student_id = u.id);

-- ============================================================================
-- CANDIDATURAS DE PROFESSOR (teacher_applications)
-- ============================================================================

INSERT INTO teacher_applications (
  full_name, email, phone, birth_date, national_id, country_id, province, city, address,
  degree, degree_field, institution, graduation_year, has_teaching_cert,
  years_experience, teaching_levels, subjects,
  motivation_letter, reference_1_name, reference_1_phone, reference_1_role,
  digital_literacy, has_computer, has_internet, available_hours, preferred_schedule,
  password_hash, status, submitted_at
) VALUES
  (
    'Isabel Machado', 'isabel.machado@example.mz', '+258841112233', '1990-04-12', '110222333M',
    'mz', 'Maputo', 'Maputo', 'Av. Julius Nyerere, 123',
    'licenciatura', 'Matemática', 'Universidade Eduardo Mondlane', 2014, true,
    6, '["secondary"]'::jsonb, '["Matemática"]'::jsonb,
    'Tenho paixão por ensinar matemática e quero levar aulas de qualidade a mais estudantes moçambicanos.',
    'Paulo Machado', '+258841119999', 'Director da Escola Secundária de Maputo',
    'avancado', true, true, 15, 'tarde',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m', 'pending', NOW() - INTERVAL '2 days'
  ),
  (
    'Ricardo Sitoe', 'ricardo.sitoe@example.mz', '+258842223344', '1988-09-03', '110333444R',
    'mz', 'Gaza', 'Xai-Xai', 'Bairro Central, Rua 5',
    'licenciatura', 'Física', 'Universidade Pedagógica', 2012, true,
    9, '["secondary"]'::jsonb, '["Física", "Matemática"]'::jsonb,
    'Sou professor há 9 anos e quero expandir o meu impacto através do ensino online.',
    'Fernanda Sitoe', '+258842229999', 'Coordenadora Pedagógica',
    'intermedio', true, true, 10, 'noite',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m', 'under_review', NOW() - INTERVAL '6 days'
  ),
  (
    'Helena Pinto', 'helena.pinto@example.pt', '+351911223344', '1985-01-20', 'PT1234567',
    'pt', 'Lisboa', 'Lisboa', 'Rua das Flores, 45',
    'mestrado', 'Biologia', 'Universidade de Lisboa', 2010, true,
    12, '["secondary"]'::jsonb, '["Biologia"]'::jsonb,
    'Quero partilhar a minha experiência de 12 anos a leccionar biologia com estudantes lusófonos.',
    'João Pinto', '+351911229999', 'Colega de Departamento',
    'avancado', true, true, 8, 'flexivel',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m', 'info_requested', NOW() - INTERVAL '10 days'
  ),
  (
    'Ana Cumbe', 'prof.ana@vclass.mz', '+258843334455', '1992-07-15', '110444555A',
    'mz', 'Maputo', 'Matola', 'Bairro Fomento, Rua 12',
    'licenciatura', 'Letras Modernas (Português)', 'Universidade Eduardo Mondlane', 2016, true,
    5, '["secondary"]'::jsonb, '["Português"]'::jsonb,
    'Acredito no poder da educação à distância para chegar a estudantes em zonas remotas.',
    'Marta Cumbe', '+258843339999', 'Directora da Escola de Matola',
    'avancado', true, true, 20, 'manha',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m', 'approved', NOW() - INTERVAL '40 days'
  ),
  (
    'Jorge Baptista', 'jorge.baptista@example.ao', '+244923112233', '1983-11-30', 'AO9988776',
    'ao', 'Luanda', 'Luanda', 'Rua Comandante Valódia, 88',
    'bacharel', 'Química Industrial', 'Instituto Politécnico de Luanda', 2008, false,
    14, '["secondary"]'::jsonb, '["Química"]'::jsonb,
    'Trabalho há 14 anos como técnico de laboratório e quero migrar para o ensino.',
    'Cláudia Baptista', '+244923119999', 'Supervisora de Laboratório',
    'basico', false, true, 6, 'noite',
    '$2b$10$rKvVLZ2xX5YQZ5vH.l8yXuCZQX/0mVZGQb8bQKq8KZU5tqGZ5cq5m', 'rejected', NOW() - INTERVAL '15 days'
  )
ON CONFLICT (email) DO NOTHING;

-- Liga a candidatura aprovada da Ana Cumbe à conta de professor já criada
UPDATE teacher_applications
SET approved_at = NOW() - INTERVAL '38 days',
    approved_by = 'admin@vclass.mz',
    user_id = (SELECT id FROM users WHERE email = 'prof.ana@vclass.mz')
WHERE email = 'prof.ana@vclass.mz' AND status = 'approved';

UPDATE teacher_applications
SET rejected_at = NOW() - INTERVAL '13 days',
    rejected_by = 'admin@vclass.mz',
    rejection_reason = 'Sem certificação pedagógica e experiência de sala de aula insuficiente para o piloto actual.'
WHERE email = 'jorge.baptista@example.ao' AND status = 'rejected';

-- ============================================================================
-- BIBLIOTECA (library_items)
-- ============================================================================

INSERT INTO library_items (title, description, author, category, subject_id, grade_id, file_url, pages, status, created_by, approved_by, approved_at, downloads_count)
SELECT 'Manual de Matemática 10ª Classe', 'Manual oficial de apoio ao estudante.', 'Ministério da Educação', 'books',
       (SELECT id FROM subjects WHERE name = 'Matemática'), (SELECT id FROM grades WHERE name = '10ª Classe'),
       'https://demo-cdn.vclass.mz/library/manual-mat-10.pdf', 180, 'published',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), (SELECT id FROM users WHERE email = 'admin@vclass.mz'),
       NOW() - INTERVAL '25 days', 128
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE title = 'Manual de Matemática 10ª Classe');

INSERT INTO library_items (title, description, author, category, subject_id, grade_id, file_url, pages, status, created_by, approved_by, approved_at, downloads_count)
SELECT 'Ficha de Exercícios: Trigonometria', 'Exercícios resolvidos de trigonometria.', 'Carlos Nhaca', 'exercises',
       (SELECT id FROM subjects WHERE name = 'Matemática'), (SELECT id FROM grades WHERE name = '11ª Classe'),
       'https://demo-cdn.vclass.mz/library/ficha-trig-11.pdf', 12, 'published',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), (SELECT id FROM users WHERE email = 'admin@vclass.mz'),
       NOW() - INTERVAL '9 days', 76
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE title = 'Ficha de Exercícios: Trigonometria');

INSERT INTO library_items (title, description, author, category, subject_id, grade_id, file_url, pages, status, created_by)
SELECT 'Resumo: Tabela Periódica', 'Resumo ilustrado dos grupos e períodos.', 'Carlos Nhaca', 'handouts',
       (SELECT id FROM subjects WHERE name = 'Química'), (SELECT id FROM grades WHERE name = '11ª Classe'),
       'https://demo-cdn.vclass.mz/library/resumo-tabela-periodica.pdf', 6, 'pending_review',
       (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz')
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE title = 'Resumo: Tabela Periódica');

INSERT INTO library_items (title, description, author, category, subject_id, grade_id, file_url, pages, status, created_by)
SELECT 'Apostila de Biologia — Genética', 'Apostila de genética mendeliana em elaboração.', 'Fátima Souza', 'books',
       (SELECT id FROM subjects WHERE name = 'Biologia'), (SELECT id FROM grades WHERE name = '12ª Classe'),
       NULL, 0, 'draft',
       (SELECT id FROM users WHERE email = 'prof.fatima@vclass.br')
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE title = 'Apostila de Biologia — Genética');

-- ============================================================================
-- SESSÕES AO VIVO (live_sessions)
-- ============================================================================

INSERT INTO live_sessions (creator_id, chapter_id, title, description, meet_link, scheduled_at, duration_minutes, status)
SELECT (SELECT id FROM users WHERE email = 'prof.ana@vclass.mz'), c.id,
       'Aula ao vivo: Tira-dúvidas de Gramática', 'Sessão para esclarecer dúvidas sobre classes de palavras.',
       'https://meet.google.com/abc-defg-hij', NOW() + INTERVAL '3 days', 60, 'scheduled'
FROM chapters c WHERE c.slug = 'mz10por-1-1'
AND NOT EXISTS (SELECT 1 FROM live_sessions WHERE title = 'Aula ao vivo: Tira-dúvidas de Gramática');

INSERT INTO live_sessions (creator_id, chapter_id, title, description, meet_link, scheduled_at, duration_minutes, status)
SELECT (SELECT id FROM users WHERE email = 'prof.carlos@vclass.mz'), c.id,
       'Revisão: Cinemática para o exame', 'Revisão geral de cinemática antes do teste trimestral.',
       'https://meet.google.com/xyz-uvwx-klm', NOW() + INTERVAL '5 days', 90, 'scheduled'
FROM chapters c WHERE c.slug = 'mz10fis-1-1'
AND NOT EXISTS (SELECT 1 FROM live_sessions WHERE title = 'Revisão: Cinemática para o exame');

INSERT INTO live_session_recipients (session_id, student_id)
SELECT ls.id, u.id
FROM live_sessions ls
JOIN users u ON u.email IN ('sofia.chissano@vclass.mz', 'diana.mabjaia@vclass.mz')
WHERE ls.title = 'Aula ao vivo: Tira-dúvidas de Gramática'
ON CONFLICT (session_id, student_id) DO NOTHING;

INSERT INTO live_session_recipients (session_id, student_id)
SELECT ls.id, u.id
FROM live_sessions ls
JOIN users u ON u.email IN ('miguel.neto@vclass.ao', 'edson.macuacua@vclass.mz')
WHERE ls.title = 'Revisão: Cinemática para o exame'
ON CONFLICT (session_id, student_id) DO NOTHING;

-- ============================================================================
-- RESUMO
-- ============================================================================

SELECT 'Users' as table_name, COUNT(*) as records FROM users
UNION ALL SELECT 'Chapters', COUNT(*) FROM chapters
UNION ALL SELECT 'Lessons', COUNT(*) FROM lessons
UNION ALL SELECT 'Lessons pending_review', COUNT(*) FROM lessons WHERE status = 'pending_review'
UNION ALL SELECT 'Exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'Exercise Submissions', COUNT(*) FROM exercise_submissions
UNION ALL SELECT 'Student Progress', COUNT(*) FROM student_progress
UNION ALL SELECT 'Subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'Teacher Applications', COUNT(*) FROM teacher_applications
UNION ALL SELECT 'Library Items', COUNT(*) FROM library_items
UNION ALL SELECT 'Live Sessions', COUNT(*) FROM live_sessions;
