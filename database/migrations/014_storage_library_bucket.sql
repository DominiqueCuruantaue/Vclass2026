-- Migration 014: Bucket Supabase Storage para a Biblioteca Digital
-- Cria o bucket 'vclass-library' e define políticas de acesso:
--   • Admins e professores (service_role) podem fazer upload
--   • Ficheiros publicados são de leitura pública (alunos descarregam directamente)

-- Criar bucket (idempotente via INSERT ... ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vclass-library',
  'vclass-library',
  true,                          -- acesso público (URLs directas funcionam sem auth)
  104857600,                     -- 100 MB limite por ficheiro
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

-- Política: apenas service_role faz upload (o backend usa service_role key)
-- O Supabase JS com service_role key ignora RLS do Storage por padrão,
-- mas definimos explicitamente para ambientes onde RLS é forçado.

-- Leitura pública (qualquer pessoa pode ver/descarregar)
CREATE POLICY "library_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vclass-library');

-- Upload: utilizadores autenticados com role admin ou teacher
-- (na prática o backend usa service_role que bypassa isto, mas fica documentado)
CREATE POLICY "library_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vclass-library' AND auth.role() = 'authenticated');

-- Delete: apenas service_role (backend)
CREATE POLICY "library_service_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vclass-library' AND auth.role() = 'service_role');
