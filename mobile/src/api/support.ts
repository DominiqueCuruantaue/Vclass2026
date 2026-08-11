import { apiRequest } from './client'

export const TICKET_CATEGORIES = [
  { id: 'account', label: 'Conta' },
  { id: 'video', label: 'Vídeo' },
  { id: 'exercises', label: 'Exercícios' },
  { id: 'content', label: 'Conteúdo' },
  { id: 'progress', label: 'Progresso' },
  { id: 'technical', label: 'Técnico' },
  { id: 'billing', label: 'Faturação' },
  { id: 'other', label: 'Outro' },
] as const

export function createTicket(payload: { category: string; message: string; name?: string; email?: string }) {
  return apiRequest<{ id: string }>('/api/tickets', { method: 'POST', auth: false, body: payload })
}
