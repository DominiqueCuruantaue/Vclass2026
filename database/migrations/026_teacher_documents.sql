-- Migration 026: Upload real de CV e Certificado de Habilitações na candidatura de professor
-- Substitui o campo único "documents_link" (workaround piloto) por dois campos dedicados,
-- cada um aceitando ficheiro (PDF/Word, guardado no Storage) OU um link externo (Drive/Dropbox).

-- Bucket privado — documentos de candidatos contêm dados pessoais (BI, diploma), por isso
-- NÃO é público como o 'vclass-library'. Leitura só via signed URL gerada pelo backend
-- (service_role) quando um admin abre a candidatura no painel de moderação.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vclass-teacher-docs',
  'vclass-teacher-docs',
  false,
  10485760,                      -- 10 MB por ficheiro
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Nega tudo a anon/authenticated — só o backend (service_role, que bypassa RLS) lê/escreve.
-- Consistente com o padrão RESTRICTIVE usado em 004_explicit_rls_deny_policies.sql.
DROP POLICY IF EXISTS "teacher_docs_deny_all" ON storage.objects;
CREATE POLICY "teacher_docs_deny_all"
  ON storage.objects
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'vclass-teacher-docs')
  WITH CHECK (bucket_id <> 'vclass-teacher-docs');

-- Colunas: cada documento guarda OU um caminho de storage (ficheiro carregado) OU um link
-- externo — nunca os dois. O nome original é preservado para exibição/download no painel admin.
ALTER TABLE public.teacher_applications
  ADD COLUMN IF NOT EXISTS cv_storage_path          text,
  ADD COLUMN IF NOT EXISTS cv_original_name         text,
  ADD COLUMN IF NOT EXISTS cv_link                  text,
  ADD COLUMN IF NOT EXISTS certificate_storage_path text,
  ADD COLUMN IF NOT EXISTS certificate_original_name text,
  ADD COLUMN IF NOT EXISTS certificate_link         text;
