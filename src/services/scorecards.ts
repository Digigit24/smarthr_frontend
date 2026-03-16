import { get, patch, del } from './api'
import type { ScorecardListItem, ScorecardDetail, PaginatedResponse } from '@/types'

export const scorecardsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<ScorecardListItem>>('/scorecards/', { params }),

  get: (id: string) => get<ScorecardDetail>(`/scorecards/${id}/`),

  update: (id: string, data: Record<string, unknown>) =>
    patch<ScorecardDetail>(`/scorecards/${id}/`, data),

  delete: (id: string) => del(`/scorecards/${id}/`),
}
