import { get, post, put, patch, del } from './api'
import type { InterviewListItem, InterviewDetail, InterviewFormData, PaginatedResponse } from '@/types'

export const interviewsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<InterviewListItem>>('/interviews/', { params }),

  get: (id: string) => get<InterviewDetail>(`/interviews/${id}/`),

  create: (data: InterviewFormData) => post<InterviewDetail>('/interviews/', data),

  update: (id: string, data: InterviewFormData) =>
    put<InterviewDetail>(`/interviews/${id}/`, data),

  patch: (id: string, data: Partial<InterviewFormData>) =>
    patch<InterviewDetail>(`/interviews/${id}/`, data),

  delete: (id: string) => del(`/interviews/${id}/`),

  cancel: (id: string) => post<InterviewDetail>(`/interviews/${id}/cancel/`),

  complete: (id: string, feedback = '', rating?: number) =>
    post<InterviewDetail>(`/interviews/${id}/complete/`, { feedback, rating }),
}
