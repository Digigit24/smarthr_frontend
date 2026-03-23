import { get, download } from './api'
import type { DashboardMetrics, FunnelItem, ScoreDistributionItem, TimelineItem } from '@/types'

export const analyticsService = {
  dashboard: () => get<DashboardMetrics>('/analytics/dashboard/'),
  funnel: () => get<FunnelItem[]>('/analytics/funnel/'),
  scores: () => get<ScoreDistributionItem[]>('/analytics/scores/'),
  timeline: (period: '7d' | '30d' | '90d' = '30d') =>
    get<TimelineItem[]>(`/analytics/timeline/?period=${period}`),

  export: (report: 'all' | 'funnel' | 'scores' | 'timeline', format: 'csv' | 'xlsx', period?: string) => {
    const params = new URLSearchParams({ report, format })
    if (period) params.set('period', period)
    return download(`/analytics/export/?${params}`, `analytics-${report}.${format}`)
  },
}
