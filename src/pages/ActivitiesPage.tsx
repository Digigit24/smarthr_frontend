import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Search, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { activitiesService } from '@/services/activities'
import { formatDateTime, cn } from '@/lib/utils'

const VERB_COLORS: Record<string, string> = {
  CREATED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  DELETED: 'bg-red-100 text-red-700',
  STATUS_CHANGED: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  TRIGGERED_CALL: 'bg-violet-100 text-violet-700',
  CALL_COMPLETED: 'bg-cyan-100 text-cyan-700',
  CALL_FAILED: 'bg-red-100 text-red-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_COMPLETED: 'bg-teal-100 text-teal-700',
  INTERVIEW_CANCELLED: 'bg-orange-100 text-orange-700',
  SCORECARD_CREATED: 'bg-purple-100 text-purple-700',
  NOTE_ADDED: 'bg-yellow-100 text-yellow-700',
  BULK_ACTION: 'bg-gray-100 text-gray-700',
}

const ALL_VERBS = [
  'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'PUBLISHED', 'CLOSED',
  'TRIGGERED_CALL', 'CALL_COMPLETED', 'CALL_FAILED', 'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED', 'INTERVIEW_CANCELLED', 'SCORECARD_CREATED', 'NOTE_ADDED', 'BULK_ACTION',
]

const RESOURCE_TYPES = [
  'Job', 'Application', 'Applicant', 'Interview', 'CallRecord', 'CallQueue',
  'Scorecard', 'PipelineStage', 'Notification',
]

const RESOURCE_ROUTES: Record<string, string> = {
  Job: '/jobs',
  Application: '/applications',
  Applicant: '/applicants',
  Interview: '/interviews',
  CallRecord: '/calls',
  CallQueue: '/call-queues',
  Scorecard: '/scorecards',
}

function DiffDisplay({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
  if (allKeys.length === 0) return null

  return (
    <div className="mt-1.5 rounded bg-muted/50 border border-border/60 p-2 text-[12px] space-y-1">
      {allKeys.map((key) => {
        const prev = before[key]
        const next = after[key]
        const changed = JSON.stringify(prev) !== JSON.stringify(next)
        return (
          <div key={key} className="flex items-start gap-1.5 flex-wrap">
            <span className="font-medium text-muted-foreground shrink-0">{key}:</span>
            {prev !== undefined && (
              <span className={cn('px-1 rounded', changed ? 'line-through text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground')}>
                {typeof prev === 'object' ? JSON.stringify(prev) : String(prev)}
              </span>
            )}
            {changed && next !== undefined && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="px-1 rounded text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
                  {typeof next === 'object' ? JSON.stringify(next) : String(next)}
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ActivitiesPage() {
  const navigate = useNavigate()
  const [actorFilter, setActorFilter] = useState('')
  const [verbFilter, setVerbFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const params: Record<string, string> = { page: String(page) }
  if (actorFilter) params.actor_email = actorFilter
  if (verbFilter) params.verb = verbFilter
  if (resourceTypeFilter) params.resource_type = resourceTypeFilter
  if (dateFrom) params.created_after = dateFrom
  if (dateTo) params.created_before = dateTo

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activities', actorFilter, verbFilter, resourceTypeFilter, dateFrom, dateTo, page],
    queryFn: () => activitiesService.list(params),
    refetchInterval: autoRefresh ? 10_000 : false,
  })

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [actorFilter, verbFilter, resourceTypeFilter, dateFrom, dateTo])

  const activities = data?.results || []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Activity Log</h1>
          <p className="text-xs text-muted-foreground">Audit trail for your tenant</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            Auto-refresh
          </Button>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by actor email..."
            className="pl-9 w-52"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
        </div>
        <Select
          value={verbFilter || 'ALL'}
          onValueChange={(v) => setVerbFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All verbs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All verbs</SelectItem>
            {ALL_VERBS.map((v) => (
              <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={resourceTypeFilter || 'ALL'}
          onValueChange={(v) => setResourceTypeFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {RESOURCE_TYPES.map((rt) => (
              <SelectItem key={rt} value={rt}>{rt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-36"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="From date"
        />
        <Input
          type="date"
          className="w-36"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="To date"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading activity log...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {activities.map((activity) => {
              const resourceRoute = RESOURCE_ROUTES[activity.resource_type]
              return (
                <Card key={activity.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0', VERB_COLORS[activity.verb] || 'bg-gray-100 text-gray-700')}>
                          {activity.verb.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[12px] text-muted-foreground">{activity.resource_type}</span>
                      </div>
                      {resourceRoute ? (
                        <button
                          className="text-[13px] font-medium hover:underline text-left text-foreground"
                          onClick={() => navigate(resourceRoute)}
                        >
                          {activity.resource_label}
                        </button>
                      ) : (
                        <p className="text-[13px] font-medium">{activity.resource_label}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground">
                        <span>{activity.actor_email}</span>
                        <span>·</span>
                        <span>{formatDateTime(activity.created_at)}</span>
                      </div>
                      {(Object.keys(activity.before || {}).length > 0 || Object.keys(activity.after || {}).length > 0) && (
                        <DiffDisplay before={activity.before || {}} after={activity.after || {}} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {data?.count} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.previous}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.next}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
