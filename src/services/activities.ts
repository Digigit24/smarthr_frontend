import { get } from './api'
import type { Activity, CursorPaginatedResponse } from '@/types'

export const activitiesService = {
  list: (params?: Record<string, string>) =>
    get<CursorPaginatedResponse<Activity>>('/activities/', { params }),

  get: (id: string) => get<Activity>(`/activities/${id}/`),
}
