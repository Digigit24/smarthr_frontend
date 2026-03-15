import { get, post, patch, del } from './api'
import type { CallQueue, CallQueueItem, CallQueueConfig, VoiceAgent, PaginatedResponse } from '@/types'

export interface CreateCallQueueData {
  name: string
  job: string
  voice_agent_id: string
  config?: Partial<CallQueueConfig>
}

export const callQueuesService = {
  list: (params?: Record<string, string>) =>
    get<PaginatedResponse<CallQueue>>('/call-queues/', { params }),

  get: (id: string) => get<CallQueue>(`/call-queues/${id}/`),

  create: (data: CreateCallQueueData) => post<CallQueue>('/call-queues/', data),

  update: (id: string, data: Partial<CreateCallQueueData>) =>
    patch<CallQueue>(`/call-queues/${id}/`, data),

  delete: (id: string) => del(`/call-queues/${id}/`),

  start: (id: string) => post<CallQueue>(`/call-queues/${id}/start/`),

  pause: (id: string) => post<CallQueue>(`/call-queues/${id}/pause/`),

  resume: (id: string) => post<CallQueue>(`/call-queues/${id}/resume/`),

  cancel: (id: string) => post<CallQueue>(`/call-queues/${id}/cancel/`),

  items: (id: string, params?: Record<string, string>) =>
    get<PaginatedResponse<CallQueueItem>>(`/call-queues/${id}/items/`, { params }),

  populate: (id: string) =>
    post<{ created: number; message: string }>(`/call-queues/${id}/populate/`),

  voiceAgents: () => get<VoiceAgent[]>('/voice-agents/'),

  voiceAgent: (id: string) => get<VoiceAgent>(`/voice-agents/${id}/`),
}
