-- VClass Database Migration 001: Initial Schema
-- PostgreSQL 15+ (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- 1. Countries
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL,
  language VARCHAR(50) NOT NULL DEFAULT 'pt',
  currency VARCHAR(3),
  flag_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  phone VARCHAR(20),
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Education Systems
CREATE TABLE education_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Grades (Séries/Anos)
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_system_id UUID REFERENCES education_systems(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Subjects (Disciplinas)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Grade-Subject Relationship
CREATE TABLE grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id UUID REFERENCES grades(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  workload_hours INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(grade_id, subject_id)
);

-- 7. Chapters
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_subject_id UUID REFERENCES grade_subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  video_id VARCHAR(255),
  video_duration INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL,
  is_free BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Lesson Attachments
CREATE TABLE lesson_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Exercises
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'essay')),
  explanation TEXT,
  display_order INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Exercise Options
CREATE TABLE exercise_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Student Progress
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  time_spent INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- 13. Exercise Submissions
CREATE TABLE exercise_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES exercise_options(id) ON DELETE SET NULL,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, exercise_id)
);

-- 14. Lesson Comments
CREATE TABLE lesson_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES lesson_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  payment_provider VARCHAR(50),
  payment_id VARCHAR(255),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Video Tokens (temporary)
CREATE TABLE video_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_country ON users(country_id);

-- Education structure
CREATE INDEX idx_edu_systems_country ON education_systems(country_id);
CREATE INDEX idx_grades_edu_system ON grades(education_system_id);
CREATE INDEX idx_grade_subjects_grade ON grade_subjects(grade_id);
CREATE INDEX idx_grade_subjects_subject ON grade_subjects(subject_id);
CREATE INDEX idx_chapters_grade_subject ON chapters(grade_subject_id);

-- Lessons
CREATE INDEX idx_lessons_chapter ON lessons(chapter_id);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lessons_created_by ON lessons(created_by);
CREATE INDEX idx_lessons_chapter_status ON lessons(chapter_id, status);

-- Progress and submissions
CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);
CREATE INDEX idx_progress_status ON student_progress(status);
CREATE INDEX idx_submissions_student ON exercise_submissions(student_id);
CREATE INDEX idx_submissions_exercise ON exercise_submissions(exercise_id);

-- Exercises
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id);
CREATE INDEX idx_options_exercise ON exercise_options(exercise_id);

-- Comments
CREATE INDEX idx_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX idx_comments_user ON lesson_comments(user_id);

-- Video tokens
CREATE INDEX idx_video_tokens_user ON video_tokens(user_id);
CREATE INDEX idx_video_tokens_expires ON video_tokens(expires_at);

-- Full-text search
CREATE INDEX idx_lessons_title_search ON lessons USING gin(to_tsvector('portuguese', title));
CREATE INDEX idx_chapters_title_search ON chapters USING gin(to_tsvector('portuguese', title));

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Student Dashboard Summary
CREATE VIEW student_dashboard AS
SELECT 
  u.id as student_id,
  u.full_name,
  u.email,
  u.avatar_url,
  COUNT(DISTINCT sp.lesson_id) FILTER (WHERE sp.status = 'completed') as lessons_completed,
  COUNT(DISTINCT es.exercise_id) as exercises_completed,
  COALESCE(AVG(CASE WHEN es.is_correct THEN 100 ELSE 0 END), 0) as avg_score,
  SUM(COALESCE(sp.time_spent, 0)) as total_time_spent_seconds
FROM users u
LEFT JOIN student_progress sp ON u.id = sp.student_id
LEFT JOIN exercise_submissions es ON u.id = es.student_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.email, u.avatar_url;

-- Subject Progress by Student
CREATE VIEW subject_progress_view AS
SELECT 
  sp.student_id,
  s.id as subject_id,
  s.name as subject_name,
  s.color as subject_color,
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END) as completed_lessons,
  ROUND(
    COALESCE(
      COUNT(DISTINCT CASE WHEN sp.status = 'completed' THEN l.id END)::NUMERIC / 
      NULLIF(COUNT(DISTINCT l.id), 0) * 100,
      0
    ), 2
  ) as progress_percent
FROM subjects s
JOIN grade_subjects gs ON s.id = gs.subject_id
JOIN chapters c ON gs.id = c.grade_subject_id
JOIN lessons l ON c.id = l.chapter_id
LEFT JOIN student_progress sp ON l.id = sp.lesson_id
WHERE l.status = 'published'
GROUP BY sp.student_id, s.id, s.name, s.color;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update student progress automatically
CREATE OR REPLACE FUNCTION update_lesson_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_exercises INTEGER;
  completed_exercises INTEGER;
  new_progress INTEGER;
BEGIN
  -- Count exercises for this lesson
  SELECT COUNT(*) INTO total_exercises
  FROM exercises
  WHERE lesson_id = (
    SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id
  );

  -- Count completed exercises
  SELECT COUNT(*) INTO completed_exercises
  FROM exercise_submissions
  WHERE student_id = NEW.student_id
    AND exercise_id IN (
      SELECT id FROM exercises 
      WHERE lesson_id = (SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id)
    );

  -- Calculate progress
  IF total_exercises > 0 THEN
    new_progress := ROUND((completed_exercises::NUMERIC / total_exercises) * 100);
  ELSE
    new_progress := 0;
  END IF;

  -- Update or insert progress
  INSERT INTO student_progress (student_id, lesson_id, progress_percent, status, updated_at)
  VALUES (
    NEW.student_id,
    (SELECT lesson_id FROM exercises WHERE id = NEW.exercise_id),
    new_progress,
    CASE 
      WHEN new_progress >= 100 THEN 'completed'
      WHEN new_progress > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    NOW()
  )
  ON CONFLICT (student_id, lesson_id) 
  DO UPDATE SET
    progress_percent = new_progress,
    status = CASE 
      WHEN new_progress >= 100 THEN 'completed'
      WHEN new_progress > 0 THEN 'in_progress'
      ELSE 'not_started'
    END,
    completed_at = CASE WHEN new_progress >= 100 THEN NOW() ELSE NULL END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update progress
CREATE TRIGGER trigger_update_lesson_progress
AFTER INSERT OR UPDATE ON exercise_submissions
FOR EACH ROW EXECUTE FUNCTION update_lesson_progress();

-- Function to clean expired video tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM video_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be configured in Supabase dashboard
-- or via separate migration for better management

COMMENT ON TABLE users IS 'Sistema de usuários com roles (student, teacher, admin)';
COMMENT ON TABLE lessons IS 'Lições com vídeo, conteúdo e exercícios';
COMMENT ON TABLE student_progress IS 'Tracking de progresso do estudante por lição';
COMMENT ON TABLE video_tokens IS 'Tokens temporários para streaming seguro de vídeo';
