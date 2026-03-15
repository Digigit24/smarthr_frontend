import { get, post, put, patch, del } from './api'
import type { ApplicationListItem, ApplicationDetail, PaginatedResponse } from '@/types'

export const applicationsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicationListItem>>('/applications/', { params }),

  get: (id: string) => get<ApplicationDetail>(`/applications/${id}/`),

  create: (data: Record<string, unknown>) => post<ApplicationDetail>('/applications/', data),

  update: (id: string, data: Record<string, unknown>) =>
    put<ApplicationDetail>(`/applications/${id}/`, data),

  patch: (id: string, data: Record<string, unknown>) =>
    patch<ApplicationDetail>(`/applications/${id}/`, data),

  delete: (id: string) => del(`/applications/${id}/`),

  changeStatus: (id: string, status: string, reason = '') =>
    post<ApplicationDetail>(`/applications/${id}/change-status/`, { status, reason }),

  triggerAiCall: (id: string) =>
    post<{ id: string; status: string }>(`/applications/${id}/trigger-ai-call/`),

  bulkAction: (application_ids: string[], action: string, status?: string) =>
    post<{ updated: number; action: string }>('/applications/bulk-action/', {
      application_ids,
      action,
      status,
    }),
}
