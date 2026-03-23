import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Activity, Loader2, AlertTriangle, Clock, User, Plus,
  Pencil, Trash2, ArrowRightLeft, Globe, XCircle, Phone, PhoneOff,
  Calendar, CalendarCheck, CalendarX, ClipboardList, StickyNote, Layers, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { activitiesService } from '@/services/activities'
import type { ActivityVerb } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const VERB_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string; gradient: string; dot: string; bg: string }> = {
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
    <div className={cn('h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initial}
    </div>
  )
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity-detail', id],
    queryFn: () => activitiesService.get(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading activity...</p>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">Activity not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const verbCfg = VERB_CONFIG[activity.verb] || VERB_CONFIG.updated
  const VerbIcon = verbCfg.icon
  const resourceRoute = RESOURCE_ROUTES[activity.resource_type]
  const beforeKeys = Object.keys(activity.before || {})
  const afterKeys = Object.keys(activity.after || {})
  const allChangeKeys = Array.from(new Set([...beforeKeys, ...afterKeys]))
  const metadataKeys = Object.keys(activity.metadata || {})

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Go Back
      </Button>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className={cn('h-2 bg-gradient-to-r', verbCfg.gradient)} />
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={cn('h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0', verbCfg.gradient)}>
              <VerbIcon className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', verbCfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', verbCfg.dot)} />
                  {verbCfg.label}
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{activity.resource_type}</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{activity.resource_label}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDateTime(activity.created_at)}</span>
              </div>
            </div>
            {resourceRoute && (
              <Button variant="outline" size="sm" onClick={() => navigate(resourceRoute)} className="shrink-0">
                <ExternalLink className="h-4 w-4 mr-1.5" /> Go to {activity.resource_type}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Changes */}
          {allChangeKeys.length > 0 && (
            <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm">Changes ({allChangeKeys.length} fields)</h3>
              </div>
              <div className="space-y-2">
                {allChangeKeys.map((key) => {
                  const prev = (activity.before || {})[key]
                  const next = (activity.after || {})[key]
                  const changed = JSON.stringify(prev) !== JSON.stringify(next)
                  return (
                    <div key={key} className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{key}</p>
                      <div className="flex items-start gap-2 flex-wrap text-sm">
                        {prev !== undefined && (
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            changed ? 'line-through text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground bg-muted'
                          )}>
                            {typeof prev === 'object' ? JSON.stringify(prev) : String(prev)}
                          </span>
                        )}
                        {changed && next !== undefined && (
                          <>
                            <span className="text-muted-foreground text-xs">→</span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400">
                              {typeof next === 'object' ? JSON.stringify(next) : String(next)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Metadata */}
          {metadataKeys.length > 0 && (
            <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm">Metadata</h3>
              </div>
              <div className="space-y-2">
                {metadataKeys.map((key) => (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium min-w-[80px] sm:min-w-[100px] shrink-0">{key}</span>
                    <span className="text-sm font-medium break-all">
                      {typeof activity.metadata[key] === 'object' ? JSON.stringify(activity.metadata[key]) : String(activity.metadata[key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No changes */}
          {allChangeKeys.length === 0 && metadataKeys.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No detailed change data available for this event</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actor */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5">
            <h3 className="font-semibold text-sm mb-3">Actor</h3>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <GradientAvatar email={activity.actor_email} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{activity.actor_email}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <User className="h-3 w-3" />
                  <span>User</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5 space-y-3">
            <h3 className="font-semibold text-sm">Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-muted-foreground">Action</span>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', verbCfg.color)}>
                  {verbCfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-muted-foreground">Resource</span>
                <span className="font-medium">{activity.resource_type}</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-muted-foreground">Changes</span>
                <span className="font-medium">{allChangeKeys.length} fields</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-muted-foreground">When</span>
                <span className="font-medium text-xs">{formatDateTime(activity.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Navigate */}
          {resourceRoute && (
            <button
              onClick={() => navigate(resourceRoute)}
              className="w-full rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', verbCfg.bg)}>
                  <VerbIcon className={cn('h-5 w-5', verbCfg.color.split(' ').pop())} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">View {activity.resource_type}</p>
                  <p className="text-xs text-muted-foreground">Navigate to resource</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
