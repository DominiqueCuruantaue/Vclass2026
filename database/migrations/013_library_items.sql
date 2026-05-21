-- Migration 013: Library Items
-- Biblioteca Digital real — substituindo mock data
-- Livros: geridos por admin
-- Apostilas/Exercícios: criados por professores, aprovados por editor/admin

CREATE TABLE library_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  author          TEXT        NOT NULL,
  category        TEXT        NOT NULL CHECK (category IN ('books', 'handouts', 'exercises')),

  -- Vínculo curricular (opcional mas recomendado)
  subject_id      UUID        REFERENCES subjects(id) ON DELETE SET NULL,
  grade_id        UUID        REFERENCES grades(id)   ON DELETE SET NULL,

  -- Ficheiro
  file_url        TEXT,
  file_size_kb    INTEGER,
  pages           INTEGER,
  cover_url       TEXT,

  -- Metadados
  downloads_count INTEGER     NOT NULL DEFAULT 0,
  is_featured     BOOLEAN     NOT NULL DEFAULT false,

  -- Fluxo de publicação (igual às lições)
  -- draft → pending_review → published | rejected
  status          TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'pending_review', 'published', 'rejected')),
  rejection_reason TEXT,

  -- Autoria e aprovação
  created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  approved_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para as queries mais comuns
CREATE INDEX idx_library_items_status   ON library_items(status);
CREATE INDEX idx_library_items_category ON library_items(category);
CREATE INDEX idx_library_items_subject  ON library_items(subject_id);
CREATE INDEX idx_library_items_grade    ON library_items(grade_id);
CREATE INDEX idx_library_items_creator  ON library_items(created_by);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_library_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_library_items_updated_at
  BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_library_items_updated_at();

-- RPC: incrementar contador de downloads atomicamente
CREATE OR REPLACE FUNCTION increment_library_downloads(item_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE library_items
  SET downloads_count = downloads_count + 1
  WHERE id = item_id AND status = 'published';
$$;
