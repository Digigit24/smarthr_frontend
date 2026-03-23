import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Search, RefreshCw, ChevronLeft, ChevronRight, Loader2,
  Plus, Pencil, Trash2, ArrowRightLeft, Globe, XCircle, Phone, PhoneOff,
  Calendar, CalendarCheck, CalendarX, ClipboardList, StickyNote, Layers, Eye,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { activitiesService } from '@/services/activities'
import type { Activity as ActivityType, ActivityVerb } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const VERB_CONFIG: Record<ActivityVerb, { label: string; icon: typeof Activity; color: string; gradient: string; dot: string; bg: string }> = {
  created: { label: 'Created', icon: Plus, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  updated: { label: 'Updated', icon: Pencil, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  deleted: { label: 'Deleted', icon: Trash2, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  status_changed: { label: 'Status Changed', icon: ArrowRightLeft, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  published: { label: 'Published', icon: Globe, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', gradient: 'from-green-500 to-emerald-500', dot: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  closed: { label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  triggered_call: { label: 'Triggered Call', icon: Phone, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', gradient: 'from-violet-500 to-purple-500', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  call_completed: { label: 'Call Completed', icon: PhoneOff, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', gradient: 'from-cyan-500 to-blue-500', dot: 'bg-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  call_failed: { label: 'Call Failed', icon: PhoneOff, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-500 to-rose-500', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  interview_scheduled: { label: 'Interview Scheduled', icon: Calendar, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', gradient: 'from-indigo-500 to-blue-500', dot: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  interview_completed: { label: 'Interview Done', icon: CalendarCheck, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', gradient: 'from-teal-500 to-emerald-500', dot: 'bg-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  interview_cancelled: { label: 'Interview Cancelled', icon: CalendarX, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', gradient: 'from-orange-400 to-red-500', dot: 'bg-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  scorecard_created: { label: 'Scorecard Created', icon: ClipboardList, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', gradient: 'from-purple-500 to-violet-500', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  note_added: { label: 'Note Added', icon: StickyNote, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', gradient: 'from-yellow-400 to-amber-500', dot: 'bg-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  bulk_action: { label: 'Bulk Action', icon: Layers, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-500 to-gray-600', dot: 'bg-gray-500', bg: 'bg-gray-50 dark:bg-gray-800/50' },
}

const ALL_VERBS = Object.keys(VERB_CONFIG) as ActivityVerb[]

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

function GradientAvatar({ email }: { email: string }) {
  const hash = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initial = email[0]?.toUpperCase() || '?'
  return (
    <div className={cn('h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initial}
    </div>
  )
}

function DiffDisplay({ before, after }: { before: Record<string, unknown>; after: Record<string, unknown> }) {
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
  if (allKeys.length === 0) return null

  return (
    <div className="mt-3 rounded-lg bg-muted/30 border border-border/40 p-3 text-xs space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">Changes</p>
      {allKeys.map((key) => {
        const prev = before[key]
        const next = after[key]
        const changed = JSON.stringify(prev) !== JSON.stringify(next)
        return (
          <div key={key} className="flex items-start gap-2 flex-wrap">
            <span className="font-medium text-muted-foreground shrink-0 min-w-[80px]">{key}:</span>
            {prev !== undefined && (
              <span className={cn('px-1.5 py-0.5 rounded', changed ? 'line-through text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground')}>
                {typeof prev === 'object' ? JSON.stringify(prev) : String(prev)}
              </span>
            )}
            {changed && next !== undefined && (
              <>
                <span className="text-muted-foreground">→</span>
                <span className="px-1.5 py-0.5 rounded text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium">
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateTime(dateStr)
}

function ActivityCard({ activity }: { activity: ActivityType }) {
  const navigate = useNavigate()
  const verbCfg = VERB_CONFIG[activity.verb as ActivityVerb] || VERB_CONFIG.updated
  const VerbIcon = verbCfg.icon
  const resourceRoute = RESOURCE_ROUTES[activity.resource_type]
  const hasDiff = Object.keys(activity.before || {}).length > 0 || Object.keys(activity.after || {}).length > 0

  return (
    <div className="group relative flex gap-3 sm:gap-4">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
          verbCfg.bg
        )}>
          <VerbIcon className={cn('h-4 w-4', verbCfg.color.split(' ').pop())} />
        </div>
        <div className="w-px flex-1 bg-border/60 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', verbCfg.color)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', verbCfg.dot)} />
                {verbCfg.label}
              </span>
              <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{activity.resource_type}</span>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{getTimeAgo(activity.created_at)}</span>
          </div>

          {/* Resource label */}
          {resourceRoute ? (
            <button
              className="text-sm font-medium hover:text-primary transition-colors text-left truncate block max-w-full"
              onClick={() => navigate(resourceRoute)}
            >
              {activity.resource_label}
            </button>
          ) : (
            <p className="text-sm font-medium truncate">{activity.resource_label}</p>
          )}

          {/* Actor */}
          <div className="flex items-center gap-2 mt-2">
            <GradientAvatar email={activity.actor_email} />
            <span className="text-xs text-muted-foreground truncate">{activity.actor_email}</span>
          </div>

          {/* Diff */}
          {hasDiff && <DiffDisplay before={activity.before || {}} after={activity.after || {}} />}

          {/* View details */}
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => navigate(`/activities/${activity.id}`)}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Eye className="h-3 w-3" /> View details
            </button>
            {resourceRoute && (
              <button
                onClick={() => navigate(resourceRoute)}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Go to {activity.resource_type} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ActivitiesPage() {
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

  useEffect(() => { setPage(1) }, [actorFilter, verbFilter, resourceTypeFilter, dateFrom, dateTo])

  const activities = data?.results || []

  // Verb counts
  const verbCounts = activities.reduce((acc, a) => { acc[a.verb] = (acc[a.verb] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Activity Log</h1>
            <p className="text-sm text-muted-foreground">{data?.count ?? 0} events · Audit trail for your tenant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {autoRefresh ? 'Live' : 'Auto-refresh off'}
          </button>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick verb filters */}
      {activities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ALL_VERBS.map((v) => {
            const count = verbCounts[v] || 0
            if (count === 0 && verbFilter !== v) return null
            const cfg = VERB_CONFIG[v]
            return (
              <button
                key={v}
                onClick={() => setVerbFilter(verbFilter === v ? '' : v)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                  verbFilter === v ? 'ring-2 ring-offset-1 ring-primary/30 ' + cfg.color : cfg.color + ' border-transparent hover:shadow-sm'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                {count > 0 && <span>{count}</span>} {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by actor email..."
            className="pl-9"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={verbFilter || 'ALL'} onValueChange={(v) => setVerbFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {ALL_VERBS.map((v) => (
                <SelectItem key={v} value={v}>{v.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resourceTypeFilter || 'ALL'} onValueChange={(v) => setResourceTypeFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-40">
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
            className="w-full sm:w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From date"
          />
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading activity log...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">Events will appear here as actions are taken</p>
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted-foreground">{data?.count} total · Page {page}</p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" disabled={!data?.previous} onClick={() => setPage((p) => p - 1)} className="flex-1 sm:flex-none">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!data?.next} onClick={() => setPage((p) => p + 1)} className="flex-1 sm:flex-none">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
