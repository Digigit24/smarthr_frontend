import { get, post, patch, del } from './api'
import type { CallRecordListItem, CallRecordDetail, VoiceAgent, PaginatedResponse } from '@/types'

export const callsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<CallRecordListItem>>('/calls/', { params }),

  get: (id: string) => get<CallRecordDetail>(`/calls/${id}/`),

  transcript: (id: string) => get<{ transcript: string }>(`/calls/${id}/transcript/`),

  retry: (id: string) => post<CallRecordDetail>(`/calls/${id}/retry/`),

  update: (id: string, data: Record<string, unknown>) =>
    patch<CallRecordDetail>(`/calls/${id}/`, data),

  delete: (id: string) => del(`/calls/${id}/`),

  availableAgents: () => get<VoiceAgent[]>('/calls/available-agents/'),
}
