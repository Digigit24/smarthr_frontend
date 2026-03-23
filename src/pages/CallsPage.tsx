import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone, Search, Loader2, Eye, Pencil, Trash2, Clock, Calendar,
  Activity, PhoneOff, PhoneIncoming, PhoneCall,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { callsService } from '@/services/calls'
import { callQueuesService } from '@/services/callQueues'
import { applicationsService } from '@/services/applications'
import type { CallRecordListItem } from '@/types'
import { formatDateTime, formatDuration, cn } from '@/lib/utils'

const CALL_STATUS_CONFIG: Record<string, { bg: string; dot: string }> = {
  QUEUED: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' },
  INITIATED: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  RINGING: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  IN_PROGRESS: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500' },
  COMPLETED: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  FAILED: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  NO_ANSWER: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  BUSY: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
}

const STATUS_ICON: Record<string, typeof Phone> = {
  QUEUED: Clock,
  INITIATED: PhoneCall,
  RINGING: PhoneIncoming,
  IN_PROGRESS: PhoneCall,
  COMPLETED: Phone,
  FAILED: PhoneOff,
  NO_ANSWER: PhoneOff,
  BUSY: PhoneOff,
}

const ALL_STATUSES = ['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY']

/* ── Trigger Call Dialog (kept as dialog, not a page) ── */
function TriggerCallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [appSearch, setAppSearch] = useState('')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')

  const { data: applicationsData } = useQuery({
    queryKey: ['applications-search', appSearch],
    queryFn: () => applicationsService.list(appSearch ? { search: appSearch, status: 'APPLIED' } : { status: 'APPLIED' }),
    enabled: open,
  })

  const { data: agentsData } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: () => callQueuesService.voiceAgents(),
    enabled: open,
  })

  const triggerMutation = useMutation({
    mutationFn: () => applicationsService.triggerAiCall(selectedAppId),
    onSuccess: () => {
      toast.success('AI call triggered successfully')
      onOpenChange(false)
      setSelectedAppId('')
      setSelectedAgentId('')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to trigger call')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Trigger AI Call</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Search Application</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by applicant name..." className="pl-9" value={appSearch} onChange={(e) => setAppSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Application *</Label>
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger><SelectValue placeholder="Select application..." /></SelectTrigger>
              <SelectContent>
                {applicationsData?.results.map((app) => (
                  <SelectItem key={app.id} value={app.id}>{app.applicant_name} — {app.job_title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Voice Agent *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger><SelectValue placeholder="Select voice agent..." /></SelectTrigger>
              <SelectContent>
                {agentsData?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" disabled={!selectedAppId || !selectedAgentId || triggerMutation.isPending} onClick={() => triggerMutation.mutate()}>
              <Phone className="h-4 w-4 mr-2" />
              {triggerMutation.isPending ? 'Triggering...' : 'Trigger Call'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Mobile Call Card ── */
function CallCard({ call, onView, onEdit, onDelete }: {
  call: CallRecordListItem
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const conf = CALL_STATUS_CONFIG[call.status] || CALL_STATUS_CONFIG.QUEUED
  const Icon = STATUS_ICON[call.status] || Phone

  return (
    <Card className="group hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer" onClick={onView}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0',
              call.status === 'COMPLETED' ? 'from-emerald-500 to-teal-600'
              : call.status === 'FAILED' ? 'from-red-500 to-rose-600'
              : call.status === 'IN_PROGRESS' ? 'from-indigo-500 to-purple-500'
              : 'from-gray-400 to-gray-500'
            )}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{call.phone}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', conf.bg)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />
                  {call.status.replace(/_/g, ' ')}
                </span>
                <Badge variant="outline" className="text-[10px] py-0">{call.provider}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={onView}><Eye className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(call.duration)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDateTime(call.created_at)}
          </span>
          {call.started_at && (
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {formatDateTime(call.started_at)}
            </span>
          )}
          {call.summary && (
            <span className="truncate max-w-[200px]">{call.summary}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Main Page ── */
export default function CallsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [providerFilter, setProviderFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(searchParams.get('filter') || '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false)

  useEffect(() => {
    if (searchParams.has('status') || searchParams.has('filter')) {
      setSearchParams({}, { replace: true })
    }
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['calls', search, statusFilter, providerFilter, dateFilter, dateFrom, dateTo],
    queryFn: () =>
      callsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(providerFilter && { provider: providerFilter }),
        ...(dateFilter === 'today' && { created_at_gte: todayStr, created_at_lte: todayStr }),
        ...(dateFrom && !dateFilter && { created_at_gte: dateFrom }),
        ...(dateTo && !dateFilter && { created_at_lte: dateTo }),
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => callsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call record deleted')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete call record')),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this call record?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">Call Records</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total calls</p>
        </div>
        <Button onClick={() => setTriggerDialogOpen(true)} size="sm" className="sm:size-default">
          <Phone className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Trigger Call</span>
          <span className="sm:hidden">Call</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[calc(50%-4px)] min-[400px]:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={providerFilter || 'ALL'} onValueChange={(v) => setProviderFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[calc(50%-4px)] min-[400px]:w-40">
            <SelectValue placeholder="All providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All providers</SelectItem>
            <SelectItem value="OMNIDIM">Omnidim</SelectItem>
            <SelectItem value="BOLNA">Bolna</SelectItem>
          </SelectContent>
        </Select>
        {dateFilter === 'today' && (
          <Badge variant="secondary" className="cursor-pointer hover:bg-destructive/10" onClick={() => setDateFilter('')}>
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading call records...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No call records</p>
          <p className="text-sm mt-1">Trigger your first AI call to get started</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {data?.results.map((call) => (
              <CallCard
                key={call.id}
                call={call}
                onView={() => navigate(`/calls/${call.id}`)}
                onEdit={() => navigate(`/calls/${call.id}/edit`)}
                onDelete={() => handleDelete(call.id)}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 750 }}>
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Phone</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Provider</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Source</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Duration</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Summary</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Created</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Started</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data?.results.map((call) => {
                    const conf = CALL_STATUS_CONFIG[call.status] || CALL_STATUS_CONFIG.QUEUED
                    const Icon = STATUS_ICON[call.status] || Phone
                    return (
                      <tr
                        key={call.id}
                        className="group hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/calls/${call.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0',
                              call.status === 'COMPLETED' ? 'from-emerald-500 to-teal-600'
                              : call.status === 'FAILED' ? 'from-red-500 to-rose-600'
                              : call.status === 'IN_PROGRESS' ? 'from-indigo-500 to-purple-500'
                              : 'from-gray-400 to-gray-500'
                            )}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="font-medium text-[13px]">{call.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{call.provider}</Badge>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground">
                          {(call as CallRecordListItem & { queue_name?: string }).queue_name
                            ? <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-medium">
                                {(call as CallRecordListItem & { queue_name?: string }).queue_name}
                              </span>
                            : <span className="text-muted-foreground text-[12px]">Manual</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', conf.bg)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />
                            {call.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {formatDuration(call.duration)}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground max-w-[180px]">
                          <span className="truncate block">{call.summary || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {formatDateTime(call.created_at)}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                          {call.started_at ? formatDateTime(call.started_at) : '—'}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" title="View" onClick={() => navigate(`/calls/${call.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500" title="Edit" onClick={() => navigate(`/calls/${call.id}/edit`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Delete" onClick={() => handleDelete(call.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <TriggerCallDialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen} />
    </div>
  )
}
