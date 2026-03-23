import { get, post, put, patch, del, download } from './api'
import type { ApplicationListItem, ApplicationDetail, ApplicationFormData, PaginatedResponse } from '@/types'

export interface BulkActionPayload {
  application_ids: string[]
  action: 'change_status' | 'delete' | 'trigger_ai_call' | 'add_to_queue'
  status?: string
  queue_id?: string
}

export interface BulkActionResponse {
  action: string
  affected: number
  errors?: { application_id: string; error: string }[]
  skipped?: number
  queue_id?: string
}

export const applicationsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicationListItem>>('/applications/', { params }),

  get: (id: string) => get<ApplicationDetail>(`/applications/${id}/`),

  create: (data: ApplicationFormData) => post<ApplicationDetail>('/applications/', data),

  update: (id: string, data: ApplicationFormData) =>
    put<ApplicationDetail>(`/applications/${id}/`, data),

  patch: (id: string, data: Partial<ApplicationFormData>) =>
    patch<ApplicationDetail>(`/applications/${id}/`, data),

  delete: (id: string) => del(`/applications/${id}/`),

  changeStatus: (id: string, status: string, reason = '') =>
    post<ApplicationDetail>(`/applications/${id}/change-status/`, { status, reason }),

  triggerAiCall: (id: string) =>
    post<{ id: string; status: string }>(`/applications/${id}/trigger-ai-call/`),

  bulkAction: (payload: BulkActionPayload) =>
    post<BulkActionResponse>('/applications/bulk-action/', payload),

  export: (filters: Record<string, string>, format: 'csv' | 'xlsx') =>
    download(
      `/applications/export/?${new URLSearchParams({ ...filters, format })}`,
      `applications.${format}`,
    ),
}
