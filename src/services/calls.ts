import { get, post } from './api'
import type { CallRecordListItem, CallRecordDetail, VoiceAgent, PaginatedResponse } from '@/types'

export const callsService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<CallRecordListItem>>('/calls/', { params }),

  get: (id: string) => get<CallRecordDetail>(`/calls/${id}/`),

  transcript: (id: string) => get<{ transcript: string }>(`/calls/${id}/transcript/`),

  retry: (id: string) => post<CallRecordDetail>(`/calls/${id}/retry/`),

  availableAgents: () => get<VoiceAgent[]>('/calls/available-agents/'),
}
