# 🗄️ VClass - Database Schema

## 📊 PostgreSQL Schema (Supabase)

Este schema suporta multi-país, multi-currículo e é totalmente escalável.

---

## 🗂️ Tabelas Principais

### 1. **users** (Usuários)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  phone VARCHAR(20),
  country_id UUID REFERENCES countries(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_country ON users(country_id);
```

---

### 2. **countries** (Países)
```sql
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL, -- ISO 3166-1 alpha-3 (MOZ, BRA, AGO)
  language VARCHAR(50) NOT NULL, -- pt, en, fr, es
  currency VARCHAR(3), -- MZN, BRL, USD
  flag_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dados iniciais
INSERT INTO countries (name, code, language, currency) VALUES
  ('Moçambique', 'MOZ', 'pt', 'MZN'),
  ('Brasil', 'BRA', 'pt', 'BRL'),
  ('Angola', 'AGO', 'pt', 'AOA');
```

---

### 3. **education_systems** (Sistemas Educacionais)
```sql
CREATE TABLE education_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Ensino Secundário Geral", "High School"
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edu_systems_country ON education_systems(country_id);

-- Exemplo: Moçambique
INSERT INTO education_systems (country_id, name) VALUES
  ((SELECT id FROM countries WHERE code = 'MOZ'), 'Ensino Secundário Geral (ESG)');
```

---

### 4. **grades** (Séries/Anos)
```sql
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_system_id UUID REFERENCES education_systems(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL, -- "10ª Classe", "Grade 10"
  level INTEGER NOT NULL, -- 10, 11, 12
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grades_edu_system ON grades(education_system_id);
CREATE INDEX idx_grades_level ON grades(level);

-- Exemplo: Moçambique 10ª-12ª classe
INSERT INTO grades (education_system_id, name, level, display_order) VALUES
  ((SELECT id FROM education_systems WHERE name LIKE '%ESG%'), '10ª Classe', 10, 1),
  ((SELECT id FROM education_systems WHERE name LIKE '%ESG%'), '11ª Classe', 11, 2),
  ((SELECT id FROM education_systems WHERE name LIKE '%ESG%'), '12ª Classe', 12, 3);
```

---

### 5. **subjects** (Disciplinas)
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- "Matemática", "Português", "Física"
  description TEXT,
  icon_url TEXT,
  color VARCHAR(7), -- Hex color: #3B82F6
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disciplinas universais
INSERT INTO subjects (name, color) VALUES
  ('Matemática', '#3B82F6'),
  ('Português', '#EF4444'),
  ('Física', '#10B981'),
  ('Química', '#F59E0B'),
  ('Biologia', '#8B5CF6'),
  ('História', '#EC4899'),
  ('Geografia', '#14B8A6'),
  ('Inglês', '#6366F1');
```

---

### 6. **grade_subjects** (Relação Série-Disciplina)
```sql
CREATE TABLE grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  workload_hours INTEGER, -- Carga horária
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(grade_id, subject_id)
);

CREATE INDEX idx_grade_subjects_grade ON grade_subjects(grade_id);
CREATE INDEX idx_grade_subjects_subject ON grade_subjects(subject_id);
```

---

### 7. **chapters** (Capítulos)
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_subject_id UUID REFERENCES grade_subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chapters_grade_subject ON chapters(grade_subject_id);
CREATE INDEX idx_chapters_order ON chapters(display_order);
```

---

### 8. **lessons** (Lições)
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT, -- Conteúdo em Markdown
  video_id VARCHAR(255), -- ID do vídeo no Bunny.net
  video_duration INTEGER, -- Duração em segundos
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false, -- Aula grátis para preview
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_created_by ON lessons(created_by);
```

---

### 9. **lesson_attachments** (Anexos de Lições)
```sql
CREATE TABLE lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- PDF, DOCX, etc
  file_size INTEGER, -- Bytes
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attachments_lesson ON lesson_attachments(lesson_id);
```

---

### 10. **exercises** (Exercícios)
```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  display_order INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
```

---

### 11. **exercise_options** (Opções de Exercícios)
```sql
CREATE TABLE exercise_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_options_exercise ON exercise_options(exercise_id);
```

---

### 12. **student_progress** (Progresso do Estudante)
```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  time_spent INTEGER DEFAULT 0, -- Segundos
  last_position INTEGER DEFAULT 0, -- Última posição do vídeo (segundos)
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_progress_status ON student_progress(status);
```

---

### 13. **exercise_submissions** (Submissões de Exercícios)
```sql
CREATE TABLE exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES exercise_options(id),
  answer_text TEXT, -- Para questões dissertativas
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, exercise_id)
);

CREATE INDEX idx_submissions_student ON exercise_submissions(student_id);
CREATE INDEX idx_submissions_exercise ON exercise_submissions(exercise_id);
```

---

### 14. **lesson_comments** (Comentários em Lições)
```sql
CREATE TABLE lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES lesson_comments(id), -- Para respostas
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX idx_comments_user ON lesson_comments(user_id);
CREATE INDEX idx_comments_parent ON lesson_comments(parent_comment_id);
```

---

### 15. **subscriptions** (Assinaturas - Futuro)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) CHECK (plan_type IN ('free', 'basic', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  payment_provider VARCHAR(50), -- stripe, mpesa
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

### 16. **video_tokens** (Tokens de Vídeo Temporários)
```sql
CREATE TABLE video_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_tokens_user ON video_tokens(user_id);
CREATE INDEX idx_video_tokens_lesson ON video_tokens(lesson_id);
CREATE INDEX idx_video_tokens_expires ON video_tokens(expires_at);
```

---

## 🔐 Row Level Security (RLS) - Supabase

```sql
-- Habilitar RLS em todas as tabelas sensíveis
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Estudantes podem ver apenas seu próprio progresso
CREATE POLICY "Students view own progress" ON student_progress
  FOR SELECT USING (auth.uid() = student_id);

-- Policy: Estudantes podem atualizar apenas seu progresso
CREATE POLICY "Students update own progress" ON student_progress
  FOR UPDATE USING (auth.uid() = student_id);

-- Policy: Todos podem ver lições publicadas
CREATE POLICY "Anyone can view published lessons" ON lessons
  FOR SELECT USING (status = 'published');

-- Policy: Teachers podem criar lições
CREATE POLICY "Teachers can create lessons" ON lessons
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
  );
```

---

## 📊 Views Úteis

### View: Student Dashboard
```sql
CREATE VIEW student_dashboard AS
SELECT 
  u.id as student_id,
  u.full_name,
  COUNT(DISTINCT sp.lesson_id) as lessons_completed,
  COUNT(DISTINCT es.exercise_id) as exercises_completed,
  AVG(CASE WHEN es.is_correct THEN 100 ELSE 0 END) as avg_score,
  SUM(sp.time_spent) as total_time_spent
FROM users u
LEFT JOIN student_progress sp ON u.id = sp.student_id AND sp.status = 'completed'
LEFT JOIN exercise_submissions es ON u.id = es.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name;
```

### View: Subject Progress
```sql
CREATE VIEW subject_progress AS
SELECT 
  sp.student_id,
  s.id as subject_id,
  s.name as subject_name,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END) as completed_lessons,
  ROUND(
    COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT l.id), 0) * 100, 2
  ) as progress_percent
FROM subjects s
JOIN grade_subjects gs ON s.id = gs.subject_id
JOIN chapters c ON gs.id = c.grade_subject_id
JOIN lessons l ON c.id = l.chapter_id
LEFT JOIN student_progress sp ON l.id = sp.lesson_id
WHERE l.status = 'published'
GROUP BY sp.student_id, s.id, s.name;
```

---

## 🔧 Funções Úteis

### Atualizar progresso automaticamente
```sql
CREATE OR REPLACE FUNCTION update_lesson_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular progresso baseado em exercícios completados
  UPDATE student_progress
  SET 
    progress_percent = (
      SELECT COUNT(*)::NUMERIC / NULLIF(
        (SELECT COUNT(*) FROM exercises WHERE lesson_id = NEW.lesson_id), 0
      ) * 100
      FROM exercise_submissions
      WHERE student_id = NEW.student_id 
        AND exercise_id IN (SELECT id FROM exercises WHERE lesson_id = NEW.lesson_id)
    ),
    status = CASE 
      WHEN progress_percent >= 100 THEN 'completed'
      WHEN progress_percent > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    updated_at = NOW()
  WHERE student_id = NEW.student_id 
    AND lesson_id = NEW.lesson_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress
AFTER INSERT OR UPDATE ON exercise_submissions
FOR EACH ROW EXECUTE FUNCTION update_lesson_progress();
```

---

## 📈 Índices para Performance

```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_lessons_chapter_status ON lessons(chapter_id, status);
CREATE INDEX idx_progress_student_status ON student_progress(student_id, status);
CREATE INDEX idx_submissions_student_exercise ON exercise_submissions(student_id, exercise_id);

-- Índices para busca
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_chapters_title_search ON chapters USING gin(to_tsvector('portuguese', title));
```

---

## 🗃️ Dados de Exemplo (Seeds)

Ver arquivo `seed.sql` para dados completos de teste incluindo:
- 3 países (Moçambique, Brasil, Angola)
- Sistemas educacionais
- Séries 10-12
- 8 disciplinas
- Capítulos e lições de exemplo
- Exercícios com opções
- Usuários de teste (student, teacher, admin)

---

## 📊 Diagrama ER (Texto)

```
users ──┬─→ student_progress ──→ lessons
        ├─→ exercise_submissions ──→ exercises
        ├─→ lesson_comments
        └─→ subscriptions

countries ──→ education_systems ──→ grades ──→ grade_subjects
                                                     ↓
subjects ────────────────────────────────────→ grade_subjects
                                                     ↓
                                                 chapters
                                                     ↓
                                                 lessons ──┬─→ exercises ──→ exercise_options
                                                           ├─→ lesson_attachments
                                                           └─→ video_tokens
```

