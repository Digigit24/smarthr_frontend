import { get, post, put, patch, del, download } from './api'
import type {
  ApplicantListItem,
  ApplicantDetail,
  ApplicantFormData,
  PaginatedResponse,
  ApplicationListItem,
} from '@/types'

export const applicantsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicantListItem>>('/applicants/', { params }),

  get: (id: string) => get<ApplicantDetail>(`/applicants/${id}/`),

  create: (data: ApplicantFormData) => post<ApplicantDetail>('/applicants/', data),

  update: (id: string, data: ApplicantFormData) => put<ApplicantDetail>(`/applicants/${id}/`, data),

  patch: (id: string, data: Partial<ApplicantFormData>) =>
    patch<ApplicantDetail>(`/applicants/${id}/`, data),

  delete: (id: string) => del(`/applicants/${id}/`),

  applications: (id: string, params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicationListItem>>(`/applicants/${id}/applications/`, { params }),

  export: (filters: Record<string, string>, format: 'csv' | 'xlsx') =>
    download(
      `/applicants/export/?${new URLSearchParams({ ...filters, format })}`,
      `applicants.${format}`,
    ),
}
