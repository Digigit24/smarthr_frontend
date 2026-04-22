import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, MapPin, Users, Clock, Bot,
  Loader2, Eye, Pencil, Trash2, ArrowUpRight, Award, Calendar, Download,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { jobsService } from '@/services/jobs'
import type { JobListItem, PaginatedResponse } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const JOB_STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  OPEN: 'bg-emerald-500',
  PAUSED: 'bg-amber-500',
  CLOSED: 'bg-red-500',
}

const JOB_STATUS_ACCENT: Record<string, string> = {
  DRAFT: 'border-l-gray-400',
  OPEN: 'border-l-emerald-500',
  PAUSED: 'border-l-amber-500',
  CLOSED: 'border-l-red-500',
}

const JOB_STATUS_ICON_BG: Record<string, string> = {
  DRAFT: 'bg-gray-100 dark:bg-gray-800',
  OPEN: 'bg-emerald-50 dark:bg-emerald-900/20',
  PAUSED: 'bg-amber-50 dark:bg-amber-900/20',
  CLOSED: 'bg-red-50 dark:bg-red-900/20',
}


function JobCard({
  job,
  onView,
  onEdit,
  onDelete,
}: {
  job: JobListItem
  onView: (job: JobListItem) => void
  onEdit: (job: JobListItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      className={cn(
        'group border-l-4 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden',
        JOB_STATUS_ACCENT[job.status],
      )}
      onClick={() => onView(job)}
    >
      <CardContent className="p-0">
        {/* Card Header with icon */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-3 flex-1 min-w-0">
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                JOB_STATUS_ICON_BG[job.status],
              )}>
                <Briefcase className={cn('h-5 w-5', {
                  'text-gray-500': job.status === 'DRAFT',
                  'text-emerald-600': job.status === 'OPEN',
                  'text-amber-600': job.status === 'PAUSED',
                  'text-red-500': job.status === 'CLOSED',
                })} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[15px] text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-[13px] text-muted-foreground">
                  <span>{job.department}</span>
                  <span className="text-border">·</span>
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            {/* Action buttons - visible on hover */}
            <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-500" title="View" onClick={() => onView(job)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-500" title="Edit" onClick={() => onEdit(job)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete" onClick={() => onDelete(job.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
              JOB_STATUS_COLORS[job.status]
            )}>
              <span className={cn('h-1.5 w-1.5 rounded-full', JOB_STATUS_DOT[job.status])} />
              {job.status}
            </span>
            <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md font-medium">
              {job.job_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md font-medium">
              {job.experience_level}
            </span>
            {job.voice_agent_provider && (
              <span className="inline-flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-400 px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/20 rounded-md font-medium">
                <Bot className="h-3 w-3" />
                {job.voice_agent_provider}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[13px]">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-semibold text-foreground">{job.application_count}</span>
            <span className="text-muted-foreground">applicants</span>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(job.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function JobsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [statusFilter, setStatusFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [expLevelFilter, setExpLevelFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', debouncedSearch, statusFilter, jobTypeFilter, expLevelFilter, ordering, dateFrom, dateTo, page],
    queryFn: () =>
      jobsService.list({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(jobTypeFilter && { job_type: jobTypeFilter }),
        ...(expLevelFilter && { experience_level: expLevelFilter }),
        ...(dateFrom && { created_at_gte: dateFrom }),
        ...(dateTo && { created_at_lte: dateTo }),
        ordering,
        page: String(page),
      }),
    placeholderData: (previous) => previous,
  })

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  const jobsQueryKey = ['jobs', debouncedSearch, statusFilter, jobTypeFilter, expLevelFilter, ordering, dateFrom, dateTo, page]

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: jobsQueryKey })
      const previous = qc.getQueryData<PaginatedResponse<JobListItem>>(jobsQueryKey)
      qc.setQueryData<PaginatedResponse<JobListItem>>(jobsQueryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          results: old.results.filter((j) => j.id !== id),
          count: Math.max(0, (old.count ?? 0) - 1),
        }
      })
      return { previous }
    },
    onSuccess: () => {
      toast.success('Job deleted')
    },
    onError: (err, _id, context) => {
      if (context?.previous) qc.setQueryData(jobsQueryKey, context.previous)
      toast.error(extractApiError(err, 'Failed to delete job'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  const handleView = (job: JobListItem) => navigate(`/jobs/${job.id}`)
  const handleEdit = (job: JobListItem) => navigate(`/jobs/${job.id}/edit`)
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true)
    try {
      const filters: Record<string, string> = {}
      if (search) filters.search = search
      if (statusFilter) filters.status = statusFilter
      if (jobTypeFilter) filters.job_type = jobTypeFilter
      if (expLevelFilter) filters.experience_level = expLevelFilter
      if (dateFrom) filters.created_at_gte = dateFrom
      if (dateTo) filters.created_at_lte = dateTo
      await jobsService.export(filters, format)
      toast.success(`Export started (${format.toUpperCase()})`)
    } catch (err) {
      toast.error(extractApiError(err, 'Export failed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">Jobs</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => handleExport(v as 'csv' | 'xlsx')}>
            <SelectTrigger className="w-full sm:w-32 h-9" disabled={isExporting}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="xlsx">Export Excel</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Filters Row 1 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full min-[400px]:w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jobTypeFilter || 'ALL'} onValueChange={(v) => { setJobTypeFilter(v === 'ALL' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full min-[400px]:w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="INTERNSHIP">Internship</SelectItem>
          </SelectContent>
        </Select>
        <Select value={expLevelFilter || 'ALL'} onValueChange={(v) => { setExpLevelFilter(v === 'ALL' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full min-[400px]:w-40"><SelectValue placeholder="All levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All levels</SelectItem>
            <SelectItem value="ENTRY">Entry</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordering} onValueChange={(v) => { setOrdering(v); setPage(1) }}>
          <SelectTrigger className="w-full min-[400px]:w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="-title">Title Z-A</SelectItem>
            <SelectItem value="-application_count">Most applications</SelectItem>
            <SelectItem value="application_count">Least applications</SelectItem>
          </SelectContent>
        </Select>
        <DateRangeFilter
          fromDate={dateFrom}
          toDate={dateTo}
          onFromChange={(v) => { setDateFrom(v); setPage(1) }}
          onToChange={(v) => { setDateTo(v); setPage(1) }}
          onClear={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
        />
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading jobs...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">Create your first job posting</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((job) => (
            <JobCard key={job.id} job={job} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
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
