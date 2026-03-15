import { get, post, patch } from './api'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<Notification>>('/notifications/', { params }),

  get: (id: string) => get<Notification>(`/notifications/${id}/`),

  markRead: (id: string) => patch<Notification>(`/notifications/${id}/read/`),

  markAllRead: () => post<{ marked_read: number }>('/notifications/read-all/'),
}
