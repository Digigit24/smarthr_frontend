import { get, post, put, patch, del } from './api'
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
}
