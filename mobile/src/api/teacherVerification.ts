import { apiRequest, apiUpload } from './client'
import type { TeacherApplicationRequest, UploadDocumentResponse } from '@shared/types'

export function submitTeacherApplication(payload: TeacherApplicationRequest) {
  return apiRequest<{ id: string }>('/api/teacher-verification/apply', { method: 'POST', auth: false, body: payload })
}

// docType: 'cv' | 'certificate'. `file` deve ser { uri, name, type } vindo do
// expo-document-picker.
export function uploadApplicationDocument(
  docType: 'cv' | 'certificate',
  file: { uri: string; name: string; mimeType?: string | null }
) {
  const form = new FormData()
  form.append('doc_type', docType)
  // React Native aceita este objecto "file-like" em FormData; o runtime faz
  // upload multipart a partir do URI local.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || 'application/pdf',
  } as any)
  return apiUpload<UploadDocumentResponse & { size_kb: number }>('/api/teacher-verification/apply/upload-document', form)
}

export function fetchApplicationStatus(email: string) {
  return apiRequest<{
    id: string
    full_name: string
    status: string
    verification_step: string
    step_label: string
    estimated_days_remaining: number
    rejection_reason?: string
  }>(`/api/teacher-verification/status/${encodeURIComponent(email)}`, { auth: false })
}
