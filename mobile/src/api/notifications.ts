import { apiRequest } from './client'

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  link?: string
}

export function fetchNotifications(unreadOnly = false) {
  return apiRequest<NotificationItem[]>(`/api/notifications${unreadOnly ? '?unread=true' : ''}`)
}

export function fetchUnreadCount() {
  return apiRequest<{ count: number }>('/api/notifications/unread-count')
}

export function markNotificationRead(id: string) {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return apiRequest('/api/notifications/mark-all-read', { method: 'POST' })
}
