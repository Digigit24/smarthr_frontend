import { get, post, put, patch, del, download } from './api'
import type {
  JobListItem,
  JobDetail,
  JobFormData,
  JobStats,
  PaginatedResponse,
  ApplicationListItem,
} from '@/types'

export const jobsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<JobListItem>>('/jobs/', { params }),

  get: (id: string) => get<JobDetail>(`/jobs/${id}/`),

  create: (data: JobFormData) => post<JobDetail>('/jobs/', data),

  update: (id: string, data: JobFormData) => put<JobDetail>(`/jobs/${id}/`, data),

  patch: (id: string, data: Partial<JobFormData>) => patch<JobDetail>(`/jobs/${id}/`, data),

  delete: (id: string) => del(`/jobs/${id}/`),

  publish: (id: string) => post<JobDetail>(`/jobs/${id}/publish/`),

  close: (id: string) => post<JobDetail>(`/jobs/${id}/close/`),

  applications: (id: string, params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicationListItem>>(`/jobs/${id}/applications/`, { params }),

  stats: () => get<JobStats>('/jobs/stats/'),

  updateVoiceConfig: (id: string, data: { voice_agent_id?: string; voice_agent_provider?: string; voice_agent_config?: { auto_shortlist_threshold?: number; auto_reject_threshold?: number } }) =>
    patch<JobDetail>(`/jobs/${id}/voice-config/`, data),

  export: (filters: Record<string, string>, format: 'csv' | 'xlsx') =>
    download(
      `/jobs/export/?${new URLSearchParams({ ...filters, export_format: format })}`,
      `jobs.${format}`,
    ),
}
