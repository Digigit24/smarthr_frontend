import { get, del, download, api } from './api'
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

/**
 * Build the request body for an applicant create/update. If `data.resume_file`
 * is a File, send as multipart/form-data so the backend's file parser picks
 * it up; otherwise send plain JSON. Skips undefined fields entirely so PATCH
 * stays a partial update.
 */
function buildApplicantPayload(
  data: Partial<ApplicantFormData>,
): { body: FormData | Partial<ApplicantFormData>; isMultipart: boolean } {
  const hasFile = data.resume_file instanceof File
  if (!hasFile) {
    // Strip the file fields — they don't belong in the JSON body.
    const { resume_file: _f, clear_resume_file: clear, ...rest } = data
    const json: Record<string, unknown> = { ...rest }
    if (clear) json.resume_file = null
    return { body: json as Partial<ApplicantFormData>, isMultipart: false }
  }

  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (key === 'resume_file' && value instanceof File) {
      fd.append('resume_file', value)
      continue
    }
    if (key === 'clear_resume_file') continue
    if (Array.isArray(value)) {
      // Backend's MultiPartParser handles repeated fields as a list.
      for (const v of value) fd.append(key, String(v))
      continue
    }
    if (value !== null && typeof value === 'object') {
      fd.append(key, JSON.stringify(value))
      continue
    }
    if (value === null) {
      fd.append(key, '')
      continue
    }
    fd.append(key, String(value))
  }
  return { body: fd, isMultipart: true }
}

export const applicantsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicantListItem>>('/applicants/', { params }),

  get: (id: string) => get<ApplicantDetail>(`/applicants/${id}/`),

  create: async (data: ApplicantFormData) => {
    const { body, isMultipart } = buildApplicantPayload(data)
    const res = await api.post<ApplicantDetail>('/applicants/', body, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return res.data
  },

  update: async (id: string, data: ApplicantFormData) => {
    const { body, isMultipart } = buildApplicantPayload(data)
    const res = await api.put<ApplicantDetail>(`/applicants/${id}/`, body, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return res.data
  },

  patch: async (id: string, data: Partial<ApplicantFormData>) => {
    const { body, isMultipart } = buildApplicantPayload(data)
    const res = await api.patch<ApplicantDetail>(`/applicants/${id}/`, body, {
      headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
    })
    return res.data
  },

  delete: (id: string) => del(`/applicants/${id}/`),

  /**
   * Download the uploaded resume via the authenticated axios instance —
   * the bare URL on the model can't be used in an <a href> because the
   * backend requires the Bearer token. Filename is taken from the
   * server's Content-Disposition when present, otherwise from the
   * supplied fallback.
   */
  downloadResume: async (id: string, fallbackFilename = 'resume') => {
    const res = await api.get(`/applicants/${id}/download-resume/`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data as BlobPart])
    const blobUrl = URL.createObjectURL(blob)
    let filename = fallbackFilename
    const cd = (res.headers['content-disposition'] || res.headers['Content-Disposition']) as
      | string
      | undefined
    if (cd) {
      // Match RFC 5987 ("filename*=UTF-8''…") or plain ("filename=…").
      const star = /filename\*\s*=\s*[^']*''([^;\n]+)/i.exec(cd)
      const plain = /filename\s*=\s*"?([^";\n]+)"?/i.exec(cd)
      const raw = star?.[1] || plain?.[1]
      if (raw) {
        try {
          filename = decodeURIComponent(raw.trim())
        } catch {
          filename = raw.trim()
        }
      }
    }
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  },

  applications: (id: string, params?: Record<string, string>) =>
    get<PaginatedResponse<ApplicationListItem>>(`/applicants/${id}/applications/`, { params }),

  export: (filters: Record<string, string>, format: 'csv' | 'xlsx') =>
    download(
      `/applicants/export/?${new URLSearchParams({ ...filters, export_format: format })}`,
      `applicants.${format}`,
    ),

  importFields: () => get<ImportFieldsResponse>('/applicants/import/fields/'),

  importPreview: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<ImportPreviewResponse>('/applicants/import/preview/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },

  importApplicants: (file: File, mapping: Record<string, string>) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    return api
      .post<ImportResponse>('/applicants/import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },
}
