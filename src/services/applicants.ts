import { get, post, put, patch, del, download, api } from './api'
import type {
  ApplicantListItem,
  ApplicantDetail,
  ApplicantFormData,
  PaginatedResponse,
  ApplicationListItem,
} from '@/types'

export interface ImportFieldsResponse {
  fields: Record<string, string>
}

export interface ImportPreviewResponse {
  columns: string[]
  sample_data: Record<string, unknown>[]
  suggested_mapping: Record<string, string>
}

export interface ImportResponse {
  total_rows: number
  imported: number
  skipped: number
  errors: { row: number; errors: Record<string, string[]> }[]
}

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
      `/applicants/export/?${new URLSearchParams({ ...filters, export_format: format })}`,
      `applicants.${format}`,
    ),

  importFields: () =>
    get<ImportFieldsResponse>('/applicants/import/fields/'),

  importPreview: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ImportPreviewResponse>('/applicants/import/preview/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },

  importApplicants: (file: File, mapping: Record<string, string>, includeUnmapped = true) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    formData.append('include_unmapped', String(includeUnmapped))
    return api.post<ImportResponse>('/applicants/import/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data)
  },
}
