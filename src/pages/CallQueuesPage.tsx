import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, ListChecks, MoreHorizontal, Play, Pause, Square,
  RefreshCw, Phone, ChevronRight, Users, CheckCircle, XCircle, Clock, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SideDrawer } from '@/components/SideDrawer'
import { callQueuesService } from '@/services/callQueues'
import { jobsService } from '@/services/jobs'
import type { CallQueue, CallQueueItem, CallQueueStatus } from '@/types'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

const QUEUE_STATUS_COLORS: Record<CallQueueStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RUNNING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const ITEM_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  CALLING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  SKIPPED: 'bg-orange-100 text-orange-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
}

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'US/Eastern',
  'US/Central',
  'US/Mountain',
  'US/Pacific',
  'UTC',
]

const queueSchema = z.object({
  name: z.string().min(1, 'Name required'),
  job: z.string().min(1, 'Job required'),
  voice_agent_id: z.string().min(1, 'Voice agent required'),
  max_concurrent_calls: z.coerce.number().min(1).default(1),
  delay_between_calls_seconds: z.coerce.number().min(0).default(30),
  max_retries: z.coerce.number().min(0).default(2),
  call_window_start: z.string().default('09:00'),
  call_window_end: z.string().default('18:00'),
  timezone: z.string().default('Asia/Kolkata'),
  auto_shortlist_threshold: z.coerce.number().min(0).max(10).default(7.0),
  auto_reject_threshold: z.coerce.number().min(0).max(10).default(4.0),
  filter_statuses: z.array(z.string()).default(['APPLIED']),
})

type QueueForm = z.infer<typeof queueSchema>

const APPLICATION_STATUSES = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER',
]

function QueueCard({
  queue,
  onView,
  onStart,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: {
  queue: CallQueue
  onView: (q: CallQueue) => void
  onStart: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
}) {
  const progress = queue.total_queued > 0 ? (queue.total_called / queue.total_queued) * 100 : 0

  return (
    <Card
      className="hover:border-border/80 transition-colors cursor-pointer"
      onClick={() => onView(queue)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', QUEUE_STATUS_COLORS[queue.status])}>
                {queue.status}
              </span>
            </div>
            <h3 className="font-semibold text-sm truncate">{queue.name}</h3>
            <p className="text-[13px] text-muted-foreground truncate mt-0.5">{queue.job_title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(queue) }}>
                <ChevronRight className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {queue.status === 'DRAFT' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStart(queue.id) }}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </DropdownMenuItem>
              )}
              {queue.status === 'RUNNING' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPause(queue.id) }}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              {queue.status === 'PAUSED' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onResume(queue.id) }}>
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </DropdownMenuItem>
              )}
              {(queue.status === 'RUNNING' || queue.status === 'PAUSED') && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); onCancel(queue.id) }}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(queue.id) }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1">
            <span>{queue.total_called} / {queue.total_queued} called</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            {queue.total_completed} completed
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="h-3.5 w-3.5" />
            {queue.total_failed} failed
          </span>
          <span className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(queue.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateQueueForm({
  defaultJobId,
  defaultVoiceAgentId,
  onSubmit,
}: {
  defaultJobId?: string
  defaultVoiceAgentId?: string
  onSubmit: (data: QueueForm) => void
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<QueueForm>({
    resolver: zodResolver(queueSchema),
    defaultValues: {
      max_concurrent_calls: 1,
      delay_between_calls_seconds: 30,
      max_retries: 2,
      call_window_start: '09:00',
      call_window_end: '18:00',
      timezone: 'Asia/Kolkata',
      auto_shortlist_threshold: 7.0,
      auto_reject_threshold: 4.0,
      filter_statuses: ['APPLIED'],
      job: defaultJobId || '',
      voice_agent_id: defaultVoiceAgentId || '',
    },
  })

  const filterStatuses = watch('filter_statuses') || []

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'OPEN'],
    queryFn: () => jobsService.list({ status: 'OPEN' }),
  })

  const { data: agentsData } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: () => callQueuesService.voiceAgents(),
  })

  const toggleFilterStatus = (status: string) => {
    const current = filterStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setValue('filter_statuses', next)
  }

  return (
    <form id="queue-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Queue Name *</Label>
          <Input placeholder="e.g. Software Engineer Screening - May" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Job *</Label>
          <Select
            value={watch('job')}
            onValueChange={(v) => setValue('job', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {jobsData?.results.map((job) => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.job && <p className="text-xs text-destructive">{errors.job.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Voice Agent *</Label>
          <Select
            value={watch('voice_agent_id')}
            onValueChange={(v) => setValue('voice_agent_id', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice agent..." />
            </SelectTrigger>
            <SelectContent>
              {agentsData?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.voice_agent_id && <p className="text-xs text-destructive">{errors.voice_agent_id.message}</p>}
        </div>
      </div>

      {/* Config Section */}
      <div className="space-y-3 border-t pt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Configuration</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Max Concurrent Calls</Label>
            <Input type="number" min="1" max="10" {...register('max_concurrent_calls')} />
          </div>
          <div className="space-y-1.5">
            <Label>Delay Between Calls (sec)</Label>
            <Input type="number" min="0" {...register('delay_between_calls_seconds')} />
          </div>
          <div className="space-y-1.5">
            <Label>Max Retries</Label>
            <Input type="number" min="0" max="5" {...register('max_retries')} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select
              value={watch('timezone')}
              onValueChange={(v) => setValue('timezone', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Call Window Start</Label>
            <Input type="time" {...register('call_window_start')} />
          </div>
          <div className="space-y-1.5">
            <Label>Call Window End</Label>
            <Input type="time" {...register('call_window_end')} />
          </div>
          <div className="space-y-1.5">
            <Label>Auto Shortlist Threshold</Label>
            <Input type="number" min="0" max="10" step="0.1" {...register('auto_shortlist_threshold')} />
            <p className="text-[11px] text-muted-foreground">Score ≥ this → shortlisted</p>
          </div>
          <div className="space-y-1.5">
            <Label>Auto Reject Threshold</Label>
            <Input type="number" min="0" max="10" step="0.1" {...register('auto_reject_threshold')} />
            <p className="text-[11px] text-muted-foreground">Score ≤ this → rejected</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Filter Statuses</Label>
          <div className="flex flex-wrap gap-2">
            {APPLICATION_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => toggleFilterStatus(status)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors',
                  filterStatuses.includes(status)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground'
                )}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}

function QueueDetailContent({ queue: initialQueue, onActionSuccess }: {
  queue: CallQueue
  onActionSuccess: () => void
}) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['queue-items', initialQueue.id, page],
    queryFn: () => callQueuesService.items(initialQueue.id, { page: String(page) }),
    refetchInterval: initialQueue.status === 'RUNNING' ? 5000 : false,
  })

  const { data: queueData } = useQuery({
    queryKey: ['queue', initialQueue.id],
    queryFn: () => callQueuesService.get(initialQueue.id),
    refetchInterval: initialQueue.status === 'RUNNING' ? 5000 : false,
    initialData: initialQueue,
  })

  const queue = queueData || initialQueue

  const populateMutation = useMutation({
    mutationFn: () => callQueuesService.populate(queue.id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['queue-items', queue.id] })
      qc.invalidateQueries({ queryKey: ['call-queues'] })
      toast.success(`${res.created} items added to queue`)
    },
    onError: () => toast.error('Failed to populate queue'),
  })

  const progress = queue.total_queued > 0 ? (queue.total_completed / queue.total_queued) * 100 : 0

  return (
    <div className="space-y-5">
      {/* Status + Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', QUEUE_STATUS_COLORS[queue.status])}>
          {queue.status}
        </span>
        <span className="text-[13px] text-muted-foreground">{queue.job_title}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Queued', value: queue.total_queued, icon: Users, color: 'text-gray-600' },
          { label: 'Called', value: queue.total_called, icon: Phone, color: 'text-blue-600' },
          { label: 'Completed', value: queue.total_completed, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Failed', value: queue.total_failed, icon: XCircle, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-3 text-center">
            <stat.icon className={cn('h-4 w-4 mx-auto mb-1', stat.color)} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1">
          <span>Completion progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Config */}
      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configuration</p>
        <div className="grid grid-cols-2 gap-y-2 text-[13px]">
          <div>
            <span className="text-muted-foreground">Concurrent calls: </span>
            <span className="font-medium">{queue.config.max_concurrent_calls}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Delay: </span>
            <span className="font-medium">{queue.config.delay_between_calls_seconds}s</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max retries: </span>
            <span className="font-medium">{queue.config.max_retries}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Timezone: </span>
            <span className="font-medium">{queue.config.timezone}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Window: </span>
            <span className="font-medium">{queue.config.call_window_start} – {queue.config.call_window_end}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Shortlist ≥ </span>
            <span className="font-medium">{queue.config.auto_shortlist_threshold}</span>
            <span className="text-muted-foreground"> / Reject ≤ </span>
            <span className="font-medium">{queue.config.auto_reject_threshold}</span>
          </div>
        </div>
        {queue.config.filter_statuses?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {queue.config.filter_statuses.map((s) => (
              <span key={s} className="px-1.5 py-0.5 bg-muted rounded text-[11px]">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Populate button */}
      {(queue.status === 'DRAFT' || queue.status === 'PAUSED') && (
        <Button
          variant="outline"
          onClick={() => populateMutation.mutate()}
          disabled={populateMutation.isPending}
          className="w-full"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', populateMutation.isPending && 'animate-spin')} />
          Populate Queue from Job Applications
        </Button>
      )}

      {/* Queue Items table */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Queue Items {itemsData ? `(${itemsData.count})` : ''}
        </p>
        {itemsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (itemsData?.results?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No items in queue. Use "Populate Queue" to add items.</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">#</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">Applicant</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">Attempts</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">Score</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground text-[12px]">Done At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itemsData?.results.map((item: CallQueueItem) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 text-muted-foreground">{item.position}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{item.application.applicant_name}</p>
                        <p className="text-[12px] text-muted-foreground">{item.application.applicant_email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-medium',
                          ITEM_STATUS_COLORS[item.status],
                          item.status === 'CALLING' && 'animate-pulse'
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{item.attempts}</td>
                      <td className="px-3 py-2.5">
                        {item.score != null
                          ? <span className="font-medium">{Number(item.score).toFixed(1)}</span>
                          : <span className="text-muted-foreground">—</span>
                        }
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground text-[12px]">
                        {item.completed_at ? formatDateTime(item.completed_at) : '—'}
                        {item.call_record && (
                          <span className="ml-1 inline-flex">
                            <Phone className="h-3 w-3 text-blue-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {(itemsData?.next || itemsData?.previous) && (
              <div className="flex justify-between mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!itemsData.previous}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!itemsData.next}
                  onClick={() => setPage((p) => p + 1)}
                >
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

export default function CallQueuesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewQueueId, setViewQueueId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [defaultJobId, setDefaultJobId] = useState<string | undefined>()
  const [defaultVoiceAgentId, setDefaultVoiceAgentId] = useState<string | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['call-queues', search, statusFilter],
    queryFn: () =>
      callQueuesService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      }),
  })

  const { data: viewQueue, isLoading: viewQueueLoading } = useQuery({
    queryKey: ['queue-detail', viewQueueId],
    queryFn: () => callQueuesService.get(viewQueueId!),
    enabled: !!viewQueueId,
  })

  const createMutation = useMutation({
    mutationFn: (formData: QueueForm) =>
      callQueuesService.create({
        name: formData.name,
        job: formData.job,
        voice_agent_id: formData.voice_agent_id,
        config: {
          max_concurrent_calls: formData.max_concurrent_calls,
          delay_between_calls_seconds: formData.delay_between_calls_seconds,
          max_retries: formData.max_retries,
          call_window_start: formData.call_window_start,
          call_window_end: formData.call_window_end,
          timezone: formData.timezone,
          auto_shortlist_threshold: formData.auto_shortlist_threshold,
          auto_reject_threshold: formData.auto_reject_threshold,
          filter_statuses: formData.filter_statuses,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['call-queues'] })
      setCreateOpen(false)
      setDefaultJobId(undefined)
      setDefaultVoiceAgentId(undefined)
      toast.success('Queue created successfully')
    },
    onError: () => toast.error('Failed to create queue'),
  })

  const startMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.start(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue started') },
    onError: () => toast.error('Failed to start queue'),
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.pause(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue paused') },
    onError: () => toast.error('Failed to pause queue'),
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.resume(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue resumed') },
    onError: () => toast.error('Failed to resume queue'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue cancelled') },
    onError: () => toast.error('Failed to cancel queue'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['call-queues'] })
      toast.success('Queue deleted')
    },
    onError: () => toast.error('Failed to delete queue'),
  })

  const openCreate = (jobId?: string, voiceAgentId?: string) => {
    setDefaultJobId(jobId)
    setDefaultVoiceAgentId(voiceAgentId)
    setCreateOpen(true)
  }

  const handleView = (queue: CallQueue) => {
    setViewQueueId(queue.id)
    setViewOpen(true)
  }

  const getViewFooterButtons = () => {
    if (!viewQueue) return []
    const buttons = []
    if (viewQueue.status === 'DRAFT') {
      buttons.push({
        label: 'Start Queue',
        icon: Play,
        onClick: () => { startMutation.mutate(viewQueue.id); setViewOpen(false) },
        loading: startMutation.isPending,
      })
    }
    if (viewQueue.status === 'RUNNING') {
      buttons.push({
        label: 'Pause',
        variant: 'outline' as const,
        icon: Pause,
        onClick: () => { pauseMutation.mutate(viewQueue.id); setViewOpen(false) },
      })
    }
    if (viewQueue.status === 'PAUSED') {
      buttons.push({
        label: 'Resume',
        icon: Play,
        onClick: () => { resumeMutation.mutate(viewQueue.id); setViewOpen(false) },
      })
    }
    if (viewQueue.status === 'RUNNING' || viewQueue.status === 'PAUSED') {
      buttons.push({
        label: 'Cancel',
        variant: 'destructive' as const,
        icon: Square,
        onClick: () => { cancelMutation.mutate(viewQueue.id); setViewOpen(false) },
      })
    }
    return buttons
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">AI Call Queues</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total queues</p>
        </div>
        <Button onClick={() => openCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Queue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queues..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'] as CallQueueStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading call queues...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No call queues</p>
          <p className="text-sm mt-1">Create your first AI call queue</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              onView={handleView}
              onStart={startMutation.mutate}
              onPause={pauseMutation.mutate}
              onResume={resumeMutation.mutate}
              onCancel={cancelMutation.mutate}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      )}

      {/* Create Drawer */}
      <SideDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Call Queue"
        mode="create"
        size="xl"
        isLoading={createMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCreateOpen(false) },
          {
            label: 'Create Queue',
            loading: createMutation.isPending,
            onClick: () =>
              document.getElementById('queue-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              ),
          },
        ]}
        footerAlignment="right"
      >
        <CreateQueueForm
          key={`${defaultJobId}-${defaultVoiceAgentId}`}
          defaultJobId={defaultJobId}
          defaultVoiceAgentId={defaultVoiceAgentId}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      </SideDrawer>

      {/* View / Detail Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewQueueId(null)
        }}
        title={viewQueue?.name || 'Queue Details'}
        mode="view"
        size="xl"
        footerButtons={getViewFooterButtons()}
        footerAlignment="right"
      >
        {viewQueueLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading queue details...</p>
          </div>
        ) : viewQueue ? (
          <QueueDetailContent
            queue={viewQueue}
            onActionSuccess={() => qc.invalidateQueries({ queryKey: ['queue-detail', viewQueueId] })}
          />
        ) : null}
      </SideDrawer>
    </div>
  )
}
