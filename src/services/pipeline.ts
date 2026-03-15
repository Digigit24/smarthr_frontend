import { get, post, put, patch, del } from './api'
import type { PipelineStage, PaginatedResponse } from '@/types'

export const pipelineService = {
  list: () => get<PaginatedResponse<PipelineStage>>('/pipeline/'),

  create: (data: Partial<PipelineStage>) => post<PipelineStage>('/pipeline/', data),

  update: (id: string, data: Partial<PipelineStage>) =>
    put<PipelineStage>(`/pipeline/${id}/`, data),

  patch: (id: string, data: Partial<PipelineStage>) =>
    patch<PipelineStage>(`/pipeline/${id}/`, data),

  delete: (id: string) => del(`/pipeline/${id}/`),

  reorder: (stage_ids: string[]) => post<PipelineStage[]>('/pipeline/reorder/', { stage_ids }),

  seedDefaults: () => post<PipelineStage[]>('/pipeline/seed-defaults/'),
}
