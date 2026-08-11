import { apiRequest } from './client'

export interface LibraryItem {
  id: string
  title: string
  description?: string
  author?: string
  category: 'books' | 'handouts' | 'exercises' | string
  subject_id?: string
  grade_id?: string
  file_url: string
  file_size_kb?: number
  pages?: number
  cover_url?: string
  downloads_count: number
  is_featured?: boolean
  status: string
  created_at: string
  subjects?: { id: string; name: string; color: string }
  grades?: { id: string; name: string; level: number }
}

export function fetchLibrary(params: { category?: string; subject_id?: string; grade_id?: string; q?: string; page?: number } = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)) })
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return apiRequest<{ books: LibraryItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/library${suffix}`)
}

export function fetchFeaturedLibrary() {
  return apiRequest<LibraryItem[]>('/api/library/featured')
}

export function fetchLibraryStats() {
  return apiRequest<{ totalBooks: number; totalHandouts: number; totalExercises: number; totalDownloads: number }>('/api/library/stats')
}

export function fetchLibraryItem(id: string) {
  return apiRequest<LibraryItem & { related: LibraryItem[] }>(`/api/library/${id}`)
}

export function registerLibraryDownload(id: string) {
  return apiRequest(`/api/library/${id}/download`, { method: 'POST' })
}
