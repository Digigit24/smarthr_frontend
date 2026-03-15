import { get } from './api'
import type { Activity, PaginatedResponse } from '@/types'

export const activitiesService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<Activity>>('/activities/', { params }),

  get: (id: string) => get<Activity>(`/activities/${id}/`),
}
