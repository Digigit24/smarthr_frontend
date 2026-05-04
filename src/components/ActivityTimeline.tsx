import { useQuery } from '@tanstack/react-query'
import {
  Activity as ActivityIcon, Plus, Pencil, Trash2, Send, CheckCircle2, XCircle,
  Phone, PhoneCall, PhoneOff, Calendar, CalendarCheck, CalendarX, Star, MessageSquare,
  Layers, RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { activitiesService } from '@/services/activities'
import type { Activity, ActivityVerb } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'

interface ActivityTimelineProps {
  resourceType: 'application' | 'applicant' | 'job' | 'interview' | 'call_record' | 'scorecard'
  resourceId: string
  /** Cap items shown — older entries are hidden behind a "View all" link. */
  limit?: number
  className?: string
}

const VERB_CONFIG: Record<ActivityVerb, { label: string; icon: typeof ActivityIcon; color: string; bg: string }> = {
  created:              { label: 'Created',                icon: Plus,           color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  updated:              { label: 'Updated',                icon: Pencil,         color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20' },
  deleted:              { label: 'Deleted',                icon: Trash2,         color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20' },
  status_changed:       { label: 'Status changed',         icon: RefreshCw,      color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  published:            { label: 'Published',              icon: Send,           color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  closed:               { label: 'Closed',                 icon: XCircle,        color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-100 dark:bg-gray-800/50' },
  triggered_call:       { label: 'AI call triggered',      icon: Phone,          color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
  call_completed:       { label: 'Call completed',         icon: PhoneCall,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  call_failed:          { label: 'Call failed',            icon: PhoneOff,       color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20' },
  interview_scheduled:  { label: 'Interview scheduled',    icon: Calendar,       color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20' },
  interview_completed:  { label: 'Interview completed',    icon: CalendarCheck,  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  interview_cancelled:  { label: 'Interview cancelled',    icon: CalendarX,      color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/20' },
  scorecard_created:    { label: 'Scorecard generated',    icon: Star,           color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20' },
  note_added:           { label: 'Note added',             icon: MessageSquare,  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20' },
  bulk_action:          { label: 'Bulk action',            icon: Layers,         color: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-900/20' },
}

function describe(activity: Activity): string {
  const cfg = VERB_CONFIG[activity.verb]
  if (activity.verb === 'status_changed') {
    const before = (activity.before?.status as string | undefined) || ''
    const after = (activity.after?.status as string | undefined) || ''
    if (before && after) return `${prettifyStatus(before)} → ${prettifyStatus(after)}`
    return cfg?.label || activity.verb
  }
  return cfg?.label || activity.verb.replace(/_/g, ' ')
}

function prettifyStatus(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateTime(dateStr)
}

export function ActivityTimeline({
  resourceType,
  resourceId,
  limit = 8,
  className,
}: ActivityTimelineProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['activities', resourceType, resourceId],
    queryFn: () =>
      activitiesService.list({
        resource_type: resourceType,
        resource_id: resourceId,
      }),
    enabled: !!resourceId,
  })

  const items = (data?.results || []).slice(0, limit)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <ActivityIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Activity
          {!isLoading && !isError && items.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {data?.results.length || 0}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Couldn't load activity.
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity yet.
          </p>
        ) : (
          <ol className="relative space-y-4">
            {/* Vertical guide line */}
            <span className="absolute left-3.5 top-2 bottom-2 w-px bg-border" aria-hidden />
            {items.map((a) => {
              const cfg = VERB_CONFIG[a.verb] || {
                label: a.verb,
                icon: ActivityIcon,
                color: 'text-muted-foreground',
                bg: 'bg-muted',
              }
              const Icon = cfg.icon
              return (
                <li key={a.id} className="relative flex items-start gap-3 pl-0">
                  <div
                    className={cn(
                      'relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background',
                      cfg.bg,
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{describe(a)}</span>
                      {a.actor_email && (
                        <span className="text-muted-foreground"> · by {a.actor_email}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5" title={formatDateTime(a.created_at)}>
                      {getRelativeTime(a.created_at)}
                    </p>
                  </div>
                </li>
              )
            })}
            {(data?.results.length || 0) > limit && (
              <li className="text-[11px] text-muted-foreground pl-10">
                +{(data?.results.length || 0) - limit} more
              </li>
            )}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
