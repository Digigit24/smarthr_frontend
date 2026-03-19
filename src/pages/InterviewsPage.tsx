import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Calendar, Loader2, Trash2, Clock, User, Video,
  MessageSquare, Star, CheckCircle, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { interviewsService } from '@/services/interviews'
import type { InterviewListItem, InterviewStatus, InterviewType } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string; gradient: string; dot: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', gradient: 'from-cyan-500 to-blue-500', dot: 'bg-cyan-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400' },
}

const TYPE_CONFIG: Record<InterviewType, { label: string; icon: typeof Calendar; color: string; bg: string }> = {
  AI_VOICE: { label: 'AI Voice', icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  HR_SCREEN: { label: 'HR Screen', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  TECHNICAL: { label: 'Technical', icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  CULTURE_FIT: { label: 'Culture Fit', icon: Star, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  FINAL: { label: 'Final', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

function GradientAvatar({ name }: { name: string }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={cn('h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initials}
    </div>
  )
}

function InterviewCard({ iv }: { iv: InterviewListItem }) {
  const navigate = useNavigate()
  const statusCfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.SCHEDULED
  const typeCfg = TYPE_CONFIG[iv.interview_type] || TYPE_CONFIG.TECHNICAL
  const TypeIcon = typeCfg.icon
  const scheduledDate = new Date(iv.scheduled_at)
  const isUpcoming = scheduledDate > new Date() && iv.status !== 'CANCELLED' && iv.status !== 'COMPLETED'

  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/interviews/${iv.id}`)}
    >
      <div className={cn('h-1.5 bg-gradient-to-r', statusCfg.gradient)} />
      <div className="p-4 sm:p-5">
        {/* Status + Type badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', statusCfg.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot, iv.status === 'IN_PROGRESS' && 'animate-pulse')} />
            {statusCfg.label}
          </span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', typeCfg.bg, typeCfg.color)}>
            <TypeIcon className="h-3 w-3" />
            {typeCfg.label}
          </span>
          {isUpcoming && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {(() => {
                const diff = scheduledDate.getTime() - Date.now()
                const hours = Math.floor(diff / (1000 * 60 * 60))
                const days = Math.floor(hours / 24)
                if (days > 0) return `In ${days}d`
                if (hours > 0) return `In ${hours}h`
                return 'Soon'
              })()}
            </span>
          )}
        </div>

        {/* Schedule info */}
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">{formatDateTime(iv.scheduled_at)}</p>
        </div>

        {/* Interviewer */}
        <div className="flex items-center gap-2.5 mb-3 p-2.5 rounded-lg bg-muted/30">
          <GradientAvatar name={iv.interviewer_name || iv.interviewer_email} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{iv.interviewer_name || 'No name'}</p>
            <p className="text-xs text-muted-foreground truncate">{iv.interviewer_email}</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-3 pt-3 border-t text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {iv.duration_minutes}min
          </span>
          {iv.meeting_link && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Video className="h-3 w-3" /> Link
            </span>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium ml-auto">
            View Details →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function InterviewsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', search, statusFilter, typeFilter, dateFrom, dateTo],
    queryFn: () =>
      interviewsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { interview_type: typeFilter }),
        ...(dateFrom && { scheduled_at_gte: dateFrom }),
        ...(dateTo && { scheduled_at_lte: dateTo }),
        ordering: 'scheduled_at',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Interview deleted')
    },
    onError: () => toast.error('Failed to delete interview'),
  })

  // Status counts
  const allInterviews = data?.results || []
  const statusCounts = allInterviews.reduce((acc, iv) => { acc[iv.status] = (acc[iv.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            Interviews
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.count ?? 0} total interviews</p>
        </div>
        <Button onClick={() => navigate('/interviews/new')} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      {/* Quick status pills */}
      {allInterviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as InterviewStatus[]).map((s) => {
            const count = statusCounts[s] || 0
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  statusFilter === s ? 'ring-2 ring-offset-1 ring-primary/30 ' + cfg.color : cfg.color + ' border-transparent hover:shadow-sm'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot, s === 'IN_PROGRESS' && 'animate-pulse')} />
                {count} {cfg.label}
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
            placeholder="Search interviewer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as InterviewStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {(['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL'] as InterviewType[]).map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeFilter
            fromDate={dateFrom}
            toDate={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo('') }}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading interviews...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No interviews scheduled</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Schedule your first interview to get started</p>
          <Button onClick={() => navigate('/interviews/new')}>
            <Plus className="h-4 w-4 mr-2" /> Schedule Interview
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.results.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} />
          ))}
        </div>
      )}
    </div>
  )
}
