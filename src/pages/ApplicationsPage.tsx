import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, FileText, Phone, Star, ChevronDown, Loader2,
  Plus, Eye, Pencil, Trash2, LayoutList, Columns3,
  GripVertical, Clock, User, Briefcase,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { applicationsService } from '@/services/applications'
import type { ApplicationListItem, ApplicationStatus } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  AI_SCREENING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  AI_COMPLETED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHORTLISTED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  INTERVIEWED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  OFFER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  HIRED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WITHDRAWN: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  APPLIED: 'border-blue-300 dark:border-blue-700',
  AI_SCREENING: 'border-amber-300 dark:border-amber-700',
  AI_COMPLETED: 'border-purple-300 dark:border-purple-700',
  SHORTLISTED: 'border-cyan-300 dark:border-cyan-700',
  INTERVIEW_SCHEDULED: 'border-indigo-300 dark:border-indigo-700',
  INTERVIEWED: 'border-emerald-300 dark:border-emerald-700',
  OFFER: 'border-teal-300 dark:border-teal-700',
  HIRED: 'border-green-300 dark:border-green-700',
  REJECTED: 'border-red-300 dark:border-red-700',
  WITHDRAWN: 'border-gray-300 dark:border-gray-700',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-500',
  AI_SCREENING: 'bg-amber-500',
  AI_COMPLETED: 'bg-purple-500',
  SHORTLISTED: 'bg-cyan-500',
  INTERVIEW_SCHEDULED: 'bg-indigo-500',
  INTERVIEWED: 'bg-emerald-500',
  OFFER: 'bg-teal-500',
  HIRED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  WITHDRAWN: 'bg-gray-400',
}

const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN',
]

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
]

function getAvatarGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function ScoreBar({ score }: { score: string | null }) {
  if (!score) return <span className="text-muted-foreground text-[13px]">—</span>
  const val = parseFloat(score)
  const color = val >= 70 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${val}%` }} />
      </div>
      <span className="text-[13px] font-medium">{val.toFixed(0)}</span>
    </div>
  )
}

function ScoreBadge({ score }: { score: string | null }) {
  if (!score) return null
  const val = parseFloat(score)
  const color = val >= 70
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : val >= 40
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold', color)}>
      <Star className="h-2.5 w-2.5 fill-current" />
      {val.toFixed(0)}
    </span>
  )
}

/* ──────────────────────────── Kanban Board ──────────────────────────── */

function KanbanBoard({
  applications,
  onView,
  onChangeStatus,
  onTriggerCall,
  onDelete,
}: {
  applications: ApplicationListItem[]
  onView: (app: ApplicationListItem) => void
  onChangeStatus: (id: string, status: string) => void
  onTriggerCall: (id: string) => void
  onDelete: (id: string) => void
}) {
  const columns = ALL_STATUSES.map((status) => ({
    status,
    items: applications.filter((a) => a.status === status),
  }))

  const [dragItem, setDragItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDragItem(appId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', appId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    const appId = e.dataTransfer.getData('text/plain')
    if (appId && dragItem) {
      const app = applications.find((a) => a.id === appId)
      if (app && app.status !== targetStatus) {
        onChangeStatus(appId, targetStatus)
      }
    }
    setDragItem(null)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
      {columns.map(({ status, items }) => (
        <div
          key={status}
          className="flex-shrink-0 w-[260px] sm:w-[280px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          {/* Column Header */}
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-t-lg border-t-2', STATUS_BORDER_COLORS[status], 'bg-muted/30')}>
            <span className={cn('w-2 h-2 rounded-full', STATUS_DOT_COLORS[status])} />
            <span className="text-xs font-semibold truncate">{status.replace(/_/g, ' ')}</span>
            <span className="ml-auto text-[10px] font-medium bg-muted rounded-full px-1.5 py-0.5">
              {items.length}
            </span>
          </div>

          {/* Column Body */}
          <div className={cn(
            'min-h-[200px] max-h-[calc(100vh-340px)] overflow-y-auto rounded-b-lg border border-t-0 bg-muted/10 p-2 space-y-2',
            dragItem && 'bg-muted/20'
          )}>
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-muted-foreground">
                No applications
              </div>
            ) : (
              items.map((app) => (
                <div
                  key={app.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, app.id)}
                  className={cn(
                    'rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all group',
                    dragItem === app.id && 'opacity-50'
                  )}
                >
                  {/* Drag handle + name row */}
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0 group-hover:text-muted-foreground/70" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0', getAvatarGradient(app.applicant_name))}>
                          <span className="text-[9px] font-bold text-white">{getInitials(app.applicant_name)}</span>
                        </div>
                        <p className="text-[12px] font-semibold truncate">{app.applicant_name}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 ml-8">{app.applicant_email}</p>
                    </div>
                  </div>

                  {/* Job + meta */}
                  <div className="mt-2 ml-5.5 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Briefcase className="h-3 w-3 shrink-0" />
                      <span className="truncate">{app.job_title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(app.created_at)}
                      </span>
                      <ScoreBadge score={app.score} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                      title="View"
                      onClick={(e) => { e.stopPropagation(); onView(app) }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-violet-500"
                      title="Trigger AI Call"
                      onClick={(e) => { e.stopPropagation(); onTriggerCall(app.id) }}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); onDelete(app.id) }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────── Main Page ────────────────────────── */

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [ordering, setOrdering] = useState('-created_at')
  const [dateFilter, setDateFilter] = useState(searchParams.get('filter') || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  useEffect(() => {
    if (searchParams.has('status') || searchParams.has('filter')) {
      setSearchParams({}, { replace: true })
    }
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter, ordering, dateFilter, dateFrom, dateTo],
    queryFn: () =>
      applicationsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFilter === 'today' && { created_at_gte: todayStr, created_at_lte: todayStr }),
        ...(dateFrom && !dateFilter && { created_at_gte: dateFrom }),
        ...(dateTo && !dateFilter && { created_at_lte: dateTo }),
        ordering,
      }),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationsService.changeStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const triggerCallMutation = useMutation({
    mutationFn: (id: string) => applicationsService.triggerAiCall(id),
    onSuccess: () => toast.success('AI call triggered'),
    onError: () => toast.error('Failed to trigger AI call'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application deleted')
    },
    onError: () => toast.error('Failed to delete application'),
  })

  const bulkMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      applicationsService.bulkAction(ids, 'change_status', status),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      setSelectedIds(new Set())
      toast.success(`${res.updated} applications updated`)
    },
    onError: () => toast.error('Bulk action failed'),
  })

  const handleView = (app: ApplicationListItem) => {
    navigate(`/applications/${app.id}`)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!data?.results) return
    if (selectedIds.size === data.results.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(data.results.map((a) => a.id)))
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Applications</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <Select
                onValueChange={(status) =>
                  bulkMutation.mutate({ ids: Array.from(selectedIds), status })
                }
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          <Button onClick={() => navigate('/applications/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] min-[400px]:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ordering} onValueChange={setOrdering}>
          <SelectTrigger className="w-[calc(50%-6px)] min-[400px]:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="-score">Highest score</SelectItem>
            <SelectItem value="score">Lowest score</SelectItem>
            <SelectItem value="applicant_name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
        {dateFilter === 'today' && (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-destructive/10"
            onClick={() => setDateFilter('')}
          >
            Today only ✕
          </Badge>
        )}
        <DateRangeFilter
          fromDate={dateFrom}
          toDate={dateTo}
          onFromChange={(v) => { setDateFrom(v); setDateFilter('') }}
          onToChange={(v) => { setDateTo(v); setDateFilter('') }}
          onClear={() => { setDateFrom(''); setDateTo('') }}
        />

        {/* View Toggle */}
        <div className="flex items-center border rounded-lg overflow-hidden ml-auto">
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Table
          </button>
          <button
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              viewMode === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setViewMode('kanban')}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Kanban
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading applications...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applications found</p>
          <p className="text-sm mt-1">Create your first application to get started</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          applications={data!.results}
          onView={handleView}
          onChangeStatus={(id, status) => changeStatusMutation.mutate({ id, status })}
          onTriggerCall={(id) => triggerCallMutation.mutate(id)}
          onDelete={handleDelete}
        />
      ) : (
        /* ── Table View ── */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 800 }}>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-3 py-2.5 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-border cursor-pointer"
                      checked={data!.results.length > 0 && selectedIds.size === data!.results.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applicant</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Job</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Score</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applied</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Updated</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.results.map((app) => (
                  <tr
                    key={app.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleView(app)}
                  >
                    <td className="px-3 py-3" onClick={(e) => toggleSelect(app.id, e)}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(app.id)}
                        onChange={() => {}}
                        className="rounded border-border cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0', getAvatarGradient(app.applicant_name))}>
                          <span className="text-[10px] font-bold text-white">{getInitials(app.applicant_name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-[13px]">{app.applicant_name}</p>
                          <p className="text-[11px] text-muted-foreground">{app.applicant_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground max-w-[180px]">
                      <span className="truncate block">{app.job_title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLORS[app.status])}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT_COLORS[app.status])} />
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={app.score} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(app.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(app.updated_at)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                          title="View"
                          onClick={() => handleView(app)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                          title="Edit"
                          onClick={() => navigate(`/applications/${app.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(app.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-violet-500"
                          title="Trigger AI Call"
                          onClick={() => triggerCallMutation.mutate(app.id)}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                        <Select
                          value={app.status}
                          onValueChange={(status) => changeStatusMutation.mutate({ id: app.id, status })}
                        >
                          <SelectTrigger className="h-7 w-7 p-0 border-0 shadow-none [&>svg]:hidden hover:bg-accent rounded">
                            <ChevronDown className="h-3.5 w-3.5 mx-auto" />
                          </SelectTrigger>
                          <SelectContent>
                            {ALL_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
