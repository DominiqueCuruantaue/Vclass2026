-- Migration 022: garante (de forma idempotente) que o bucket 'vclass-library'
-- está público e que as policies de leitura/upload/delete existem.
--
-- Contexto: a 014_storage_library_bucket.sql cria as policies com CREATE
-- POLICY simples (sem DROP POLICY IF EXISTS). Se já existiam policies com o
-- mesmo nome (ex: tentativa anterior de aplicar a 014), o CREATE POLICY falha
-- com "policy already exists" e — como o SQL Editor do Supabase corre o
-- script colado numa única transacção — isso desfaz TUDO, incluindo o
-- UPDATE que marcava o bucket como público. Resultado: ficheiros da
-- biblioteca ficam com URL "pública" que na prática não é acessível sem
-- autenticação (o browser do aluno recebe erro em vez do PDF).
--
-- Esta migration repete a mesma intenção da 014, mas de forma segura para
-- correr mais de uma vez.

-- Bucket: garantir que existe e está público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vclass-library',
  'vclass-library',
  true,
  104857600,
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

-- Leitura pública (qualquer pessoa vê/descarrega ficheiros deste bucket)
DROP POLICY IF EXISTS "library_public_read" ON storage.objects;
CREATE POLICY "library_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vclass-library');

-- Upload: utilizadores autenticados (na prática o backend usa service_role,
-- que ignora RLS; isto fica como documentação/rede de segurança)
DROP POLICY IF EXISTS "library_authenticated_insert" ON storage.objects;
CREATE POLICY "library_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vclass-library' AND auth.role() = 'authenticated');

-- Delete: apenas service_role (backend)
DROP POLICY IF EXISTS "library_service_delete" ON storage.objects;
CREATE POLICY "library_service_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vclass-library' AND auth.role() = 'service_role');

-- Confirmação: deve devolver 1 linha com public = true
SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'vclass-library';
