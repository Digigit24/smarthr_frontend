import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Play, Pause, Square, RefreshCw, Phone, Users, CheckCircle,
  XCircle, Clock, ListChecks, Loader2, Settings2, Zap, Timer, RotateCcw,
  Globe, SlidersHorizontal, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { callQueuesService } from '@/services/callQueues'
import type { CallQueueItem, CallQueueStatus } from '@/types'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<CallQueueStatus, { label: string; color: string; gradient: string; dot: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400' },
  RUNNING: { label: 'Running', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500' },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500' },
}

const ITEM_STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  PENDING: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' },
  CALLING: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  COMPLETED: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  FAILED: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  SKIPPED: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  CANCELLED: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
}

function ProgressRing({ progress, size = 80, stroke = 6 }: { progress: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
        className="stroke-muted" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="stroke-emerald-500 transition-all duration-700" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-sm font-bold" transform={`rotate(90 ${size / 2} ${size / 2})`}>
        {progress.toFixed(0)}%
      </text>
    </svg>
  )
}

function GradientAvatar({ name }: { name: string }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={cn('h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initials}
    </div>
  )
}

export default function CallQueueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [configExpanded, setConfigExpanded] = useState(false)

  const { data: queue, isLoading } = useQuery({
    queryKey: ['queue', id],
    queryFn: () => callQueuesService.get(id!),
    enabled: !!id,
    refetchInterval: (query) => query.state.data?.status === 'RUNNING' ? 5000 : false,
  })

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['queue-items', id, page],
    queryFn: () => callQueuesService.items(id!, { page: String(page) }),
    enabled: !!id,
    refetchInterval: (query) => queue?.status === 'RUNNING' ? 5000 : false,
  })

  const populateMutation = useMutation({
    mutationFn: () => callQueuesService.populate(id!),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['queue-items', id] })
      qc.invalidateQueries({ queryKey: ['queue', id] })
      qc.invalidateQueries({ queryKey: ['call-queues'] })
      toast.success(`${res.created} items added to queue`)
    },
    onError: () => toast.error('Failed to populate queue'),
  })

  const startMutation = useMutation({
    mutationFn: () => callQueuesService.start(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue started') },
    onError: () => toast.error('Failed to start queue'),
  })
  const pauseMutation = useMutation({
    mutationFn: () => callQueuesService.pause(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue paused') },
    onError: () => toast.error('Failed to pause queue'),
  })
  const resumeMutation = useMutation({
    mutationFn: () => callQueuesService.resume(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue resumed') },
    onError: () => toast.error('Failed to resume queue'),
  })
  const cancelMutation = useMutation({
    mutationFn: () => callQueuesService.cancel(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['queue', id] }); qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue cancelled') },
    onError: () => toast.error('Failed to cancel queue'),
  })
  const deleteMutation = useMutation({
    mutationFn: () => callQueuesService.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue deleted'); navigate('/call-queues') },
    onError: () => toast.error('Failed to delete queue'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading queue...</p>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">Queue not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[queue.status]
  const completionProgress = queue.total_queued > 0 ? (queue.total_completed / queue.total_queued) * 100 : 0
  const calledProgress = queue.total_queued > 0 ? (queue.total_called / queue.total_queued) * 100 : 0

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className={cn('h-2 bg-gradient-to-r', statusCfg.gradient)} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Icon */}
            <div className={cn('h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0', statusCfg.gradient)}>
              <ListChecks className="h-7 w-7" />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                  {statusCfg.label}
                </span>
                {queue.status === 'RUNNING' && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Processing...
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold truncate">{queue.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{queue.job_title}</p>
              <p className="text-xs text-muted-foreground mt-1">Created {formatDate(queue.created_at)} · Updated {formatDate(queue.updated_at)}</p>
            </div>
            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {queue.status === 'DRAFT' && (
                <Button size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                  <Play className="h-4 w-4 mr-1.5" /> Start Queue
                </Button>
              )}
              {queue.status === 'RUNNING' && (
                <Button size="sm" variant="outline" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
                  <Pause className="h-4 w-4 mr-1.5" /> Pause
                </Button>
              )}
              {queue.status === 'PAUSED' && (
                <Button size="sm" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
                  <Play className="h-4 w-4 mr-1.5" /> Resume
                </Button>
              )}
              {(queue.status === 'RUNNING' || queue.status === 'PAUSED') && (
                <Button size="sm" variant="destructive" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                  <Square className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
              )}
              {(queue.status === 'DRAFT' || queue.status === 'PAUSED') && (
                <Button size="sm" variant="outline" onClick={() => populateMutation.mutate()} disabled={populateMutation.isPending}>
                  <RefreshCw className={cn('h-4 w-4 mr-1.5', populateMutation.isPending && 'animate-spin')} /> Populate
                </Button>
              )}
              {(queue.status === 'DRAFT' || queue.status === 'COMPLETED' || queue.status === 'CANCELLED') && (
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Progress */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Total Queued', value: queue.total_queued, icon: Users, iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-600 dark:text-gray-400' },
          { label: 'Called', value: queue.total_called, icon: Phone, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed', value: queue.total_completed, icon: CheckCircle, iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Failed', value: queue.total_failed, icon: XCircle, iconBg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500 dark:text-red-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', stat.iconBg)}>
                <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
        {/* Progress ring */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border bg-card p-3 sm:p-4 flex items-center justify-center gap-4">
          <ProgressRing progress={completionProgress} size={72} stroke={5} />
          <div className="lg:hidden">
            <p className="text-sm font-semibold">Completion</p>
            <p className="text-xs text-muted-foreground">{queue.total_completed} of {queue.total_queued}</p>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold text-sm">Progress</h3>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Calls Made</span>
              <span>{queue.total_called} / {queue.total_queued}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${calledProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Completed</span>
              <span>{queue.total_completed} / {queue.total_queued}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionProgress}%` }} />
            </div>
          </div>
          {queue.total_failed > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Failed</span>
                <span>{queue.total_failed} / {queue.total_queued}</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${queue.total_queued > 0 ? (queue.total_failed / queue.total_queued) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration (collapsible) */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Settings2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-sm">Configuration</h3>
          </div>
          {configExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {configExpanded && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: SlidersHorizontal, label: 'Max Concurrent', value: String(queue.config.max_concurrent_calls), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                { icon: Timer, label: 'Delay Between Calls', value: `${queue.config.delay_between_calls_seconds}s`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                { icon: RotateCcw, label: 'Max Retries', value: String(queue.config.max_retries), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                { icon: Globe, label: 'Timezone', value: queue.config.timezone, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                { icon: Clock, label: 'Call Window', value: `${queue.config.call_window_start} – ${queue.config.call_window_end}`, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                { icon: Zap, label: 'Auto Thresholds', value: `Shortlist ≥ ${queue.config.auto_shortlist_threshold} · Reject ≤ ${queue.config.auto_reject_threshold}`, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              ].map((cfg) => (
                <div key={cfg.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                    <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    <p className="text-sm font-medium truncate">{cfg.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {queue.config.filter_statuses?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Filter Statuses</p>
                <div className="flex flex-wrap gap-1.5">
                  {queue.config.filter_statuses.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{s.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Queue Items */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-semibold text-sm">Queue Items</h3>
            {itemsData && <span className="text-xs text-muted-foreground ml-1">({itemsData.count})</span>}
          </div>
        </div>

        {itemsLoading ? (
          <div className="p-8 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (itemsData?.results?.length ?? 0) === 0 ? (
          <div className="text-center py-12 px-4">
            <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-sm">No items in queue</p>
            <p className="text-xs text-muted-foreground mt-1">Use the "Populate" button to add items from job applications.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-border">
              {itemsData?.results.map((item: CallQueueItem) => {
                const itemCfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.PENDING
                const appName = item.applicant_name || item.applicant_email || `Applicant #${item.position}`
                const appEmail = item.applicant_name ? (item.applicant_email || '') : ''
                return (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GradientAvatar name={appName} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{appName}</p>
                          {appEmail && <p className="text-xs text-muted-foreground truncate">{appEmail}</p>}
                          {item.job_title && <p className="text-xs text-muted-foreground truncate">{item.job_title}</p>}
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', itemCfg.color, item.status === 'CALLING' && 'animate-pulse')}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', itemCfg.dot)} />
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>#{item.position}</span>
                      {item.applicant_phone && <span>{item.applicant_phone}</span>}
                      <span>Attempts: {item.attempts}</span>
                      {item.score != null && (
                        <span className="font-medium text-foreground">Score: {Number(item.score).toFixed(1)}</span>
                      )}
                      {item.call_record_id && (
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Phone className="h-3 w-3" /> Call
                        </span>
                      )}
                    </div>
                    {item.completed_at && (
                      <p className="text-xs text-muted-foreground">Done: {formatDateTime(item.completed_at)}</p>
                    )}
                    {item.error_message && (
                      <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">{item.error_message}</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Applicant</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Attempts</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itemsData?.results.map((item: CallQueueItem) => {
                    const itemCfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.PENDING
                    const appName = item.applicant_name || item.applicant_email || `Applicant #${item.position}`
                    const appEmail = item.applicant_name ? (item.applicant_email || '') : ''
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{item.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <GradientAvatar name={appName} />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{appName}</p>
                              {appEmail && <p className="text-xs text-muted-foreground truncate">{appEmail}</p>}
                              {item.job_title && <p className="text-xs text-muted-foreground truncate">{item.job_title}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', itemCfg.color, item.status === 'CALLING' && 'animate-pulse')}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', itemCfg.dot)} />
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.attempts}</td>
                        <td className="px-4 py-3">
                          {item.score != null
                            ? <span className="font-semibold text-sm">{Number(item.score).toFixed(1)}</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{item.completed_at ? formatDateTime(item.completed_at) : '—'}</span>
                            {item.call_record_id && (
                              <span className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(itemsData?.next || itemsData?.previous) && (
              <div className="flex items-center justify-between p-4 border-t">
                <Button variant="outline" size="sm" disabled={!itemsData?.previous} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" disabled={!itemsData?.next} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
