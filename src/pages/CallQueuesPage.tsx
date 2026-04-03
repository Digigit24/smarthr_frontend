import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, ListChecks, MoreHorizontal, Play, Pause, Square,
  Phone, ChevronRight, ChevronLeft, Users, CheckCircle, XCircle, Clock, Loader2,
  Zap, Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { callQueuesService } from '@/services/callQueues'
import type { CallQueue, CallQueueStatus } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<CallQueueStatus, { label: string; color: string; gradient: string; dot: string; ring: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400', ring: 'ring-gray-200 dark:ring-gray-700' },
  RUNNING: { label: 'Running', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800' },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' },
}

function QueueCard({
  queue,
  onStart,
  onPause,
  onResume,
  onCancel,
  onDelete,
}: {
  queue: CallQueue
  onStart: (id: string) => void
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
}) {
  const navigate = useNavigate()
  const progress = queue.total_queued > 0 ? (queue.total_called / queue.total_queued) * 100 : 0
  const completionProgress = queue.total_queued > 0 ? (queue.total_completed / queue.total_queued) * 100 : 0
  const statusCfg = STATUS_CONFIG[queue.status]

  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/call-queues/${queue.id}`)}
    >
      {/* Gradient accent */}
      <div className={cn('h-1.5 bg-gradient-to-r', statusCfg.gradient)} />

      <div className="p-4 sm:p-5">
        {/* Top row: status + actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', statusCfg.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot, queue.status === 'RUNNING' && 'animate-pulse')} />
            {statusCfg.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/call-queues/${queue.id}`) }}>
                <ChevronRight className="mr-2 h-4 w-4" /> View Details
              </DropdownMenuItem>
              {queue.status === 'DRAFT' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStart(queue.id) }}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </DropdownMenuItem>
              )}
              {queue.status === 'RUNNING' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPause(queue.id) }}>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </DropdownMenuItem>
              )}
              {queue.status === 'PAUSED' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onResume(queue.id) }}>
                  <Play className="mr-2 h-4 w-4" /> Resume
                </DropdownMenuItem>
              )}
              {(queue.status === 'RUNNING' || queue.status === 'PAUSED') && (
                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onCancel(queue.id) }}>
                  <Square className="mr-2 h-4 w-4" /> Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(queue.id) }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title + Job */}
        <div className="mb-4">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{queue.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 shrink-0" />
            <span className="truncate">{queue.job_title}</span>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2.5 mb-4">
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Called</span>
              <span>{queue.total_called}/{queue.total_queued}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</span>
              <span>{completionProgress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-3 border-t text-[11px]">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" /> {queue.total_queued}
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3" /> {queue.total_completed}
          </span>
          {queue.total_failed > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <XCircle className="h-3 w-3" /> {queue.total_failed}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground ml-auto">
            <Clock className="h-3 w-3" /> {formatDate(queue.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function CallQueuesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['call-queues', search, statusFilter, ordering, page],
    queryFn: () =>
      callQueuesService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ordering,
        page: String(page),
      }),
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const startMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.start(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue started') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to start queue')),
  })
  const pauseMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.pause(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue paused') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to pause queue')),
  })
  const resumeMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.resume(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue resumed') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to resume queue')),
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.cancel(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue cancelled') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to cancel queue')),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => callQueuesService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['call-queues'] }); toast.success('Queue deleted') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete queue')),
  })

  // Status counts
  const allQueues = data?.results || []
  const statusCounts = allQueues.reduce((acc, q) => { acc[q.status] = (acc[q.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Zap className="h-4 w-4" />
            </div>
            AI Call Queues
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.count ?? 0} total queues</p>
        </div>
        <Button onClick={() => navigate('/call-queues/new')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Create Queue
        </Button>
      </div>

      {/* Quick status pills */}
      {allQueues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['RUNNING', 'PAUSED', 'DRAFT', 'COMPLETED', 'CANCELLED'] as CallQueueStatus[]).map((s) => {
            const count = statusCounts[s] || 0
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1) }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  statusFilter === s
                    ? 'ring-2 ring-offset-1 ' + cfg.ring + ' ' + cfg.color
                    : cfg.color + ' border-transparent hover:shadow-sm'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot, s === 'RUNNING' && 'animate-pulse')} />
                {count} {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search queues..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(['DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'] as CallQueueStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={ordering} onValueChange={(v) => { setOrdering(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">Newest first</SelectItem>
              <SelectItem value="created_at">Oldest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="-total_queued">Most queued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading call queues...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <ListChecks className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No call queues</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first AI call queue to start screening applicants</p>
          <Button onClick={() => navigate('/call-queues/new')}>
            <Plus className="h-4 w-4 mr-2" /> Create Queue
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {data?.results.map((queue) => (
            <QueueCard
              key={queue.id}
              queue={queue}
              onStart={startMutation.mutate}
              onPause={pauseMutation.mutate}
              onResume={resumeMutation.mutate}
              onCancel={cancelMutation.mutate}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
              acc.push(p)
              return acc
            }, [])
            .map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">...</span>
              ) : (
                <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>
                  {p}
                </Button>
              )
            )}
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
