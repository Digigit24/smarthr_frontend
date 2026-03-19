import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Phone, Search, RefreshCw, Play, FileText, MessageSquare, ChevronDown, Loader2,
  Eye, Pencil, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import { SideDrawer } from '@/components/SideDrawer'
import { callsService } from '@/services/calls'
import { callQueuesService } from '@/services/callQueues'
import { applicationsService } from '@/services/applications'
import type { CallRecordListItem } from '@/types'
import { formatDateTime, formatDuration, cn } from '@/lib/utils'

const CALL_STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-700',
  INITIATED: 'bg-blue-100 text-blue-700',
  RINGING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  NO_ANSWER: 'bg-orange-100 text-orange-700',
  BUSY: 'bg-yellow-100 text-yellow-700',
}

const SCORE_DIMENSION_LABELS: Record<string, string> = {
  communication_score: 'Communication',
  knowledge_score: 'Knowledge',
  confidence_score: 'Confidence',
  relevance_score: 'Relevance',
}

function ScoreDimensionBar({ label, value }: { label: string; value: string }) {
  const num = parseFloat(value)
  const pct = Math.min(100, (num / 100) * 100)
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{num.toFixed(1)}</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

interface TranscriptMessage {
  role: 'user' | 'bot' | 'agent'
  content: string
}

function parseTranscript(raw: string): TranscriptMessage[] {
  if (!raw) return []
  // Try to detect line-by-line with "User:" / "Agent:" / "Bot:" patterns
  const lines = raw.split('\n').filter(Boolean)
  const messages: TranscriptMessage[] = []
  for (const line of lines) {
    const userMatch = line.match(/^(?:User|Candidate|Human):\s*(.+)/i)
    const botMatch = line.match(/^(?:Agent|Bot|Assistant|AI):\s*(.+)/i)
    if (userMatch) {
      messages.push({ role: 'user', content: userMatch[1] })
    } else if (botMatch) {
      messages.push({ role: 'bot', content: botMatch[1] })
    } else if (messages.length > 0) {
      // Append to last message
      messages[messages.length - 1].content += ' ' + line
    } else {
      messages.push({ role: 'bot', content: line })
    }
  }
  return messages
}

function TriggerCallDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [appSearch, setAppSearch] = useState('')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [manualPhone, setManualPhone] = useState('')

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
    onError: () => toast.error('Failed to trigger call'),
  })

  const canSubmit = selectedAppId && selectedAgentId

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
              <Input
                placeholder="Search by applicant name..."
                className="pl-9"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Application *</Label>
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger>
                <SelectValue placeholder="Select application..." />
              </SelectTrigger>
              <SelectContent>
                {applicationsData?.results.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.applicant_name} — {app.job_title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Voice Agent *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice agent..." />
              </SelectTrigger>
              <SelectContent>
                {agentsData?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || triggerMutation.isPending}
              onClick={() => triggerMutation.mutate()}
            >
              <Phone className="h-4 w-4 mr-2" />
              {triggerMutation.isPending ? 'Triggering...' : 'Trigger Call'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CallsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [providerFilter, setProviderFilter] = useState('')
  const [dateFilter, setDateFilter] = useState(searchParams.get('filter') || '')

  // Clear URL params after reading them
  useEffect(() => {
    if (searchParams.has('status') || searchParams.has('filter')) {
      setSearchParams({}, { replace: true })
    }
  }, [])
  const [viewCallId, setViewCallId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editCallId, setEditCallId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ phone: '', summary: '', status: '' })
  const [showTranscript, setShowTranscript] = useState(false)
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const { data, isLoading } = useQuery({
    queryKey: ['calls', search, statusFilter, providerFilter, dateFilter],
    queryFn: () =>
      callsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(providerFilter && { provider: providerFilter }),
        ...(dateFilter === 'today' && { created_at__date: todayStr }),
      }),
  })

  const { data: viewCall, isLoading: viewCallLoading } = useQuery({
    queryKey: ['call-detail', viewCallId],
    queryFn: () => callsService.get(viewCallId!),
    enabled: !!viewCallId,
  })

  const { data: editCall, isLoading: editCallLoading } = useQuery({
    queryKey: ['call-detail', editCallId],
    queryFn: () => callsService.get(editCallId!),
    enabled: !!editCallId,
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => callsService.retry(id),
    onSuccess: (newCall) => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call retried')
      setViewCallId(newCall.id)
    },
    onError: () => toast.error('Failed to retry call'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      callsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      qc.invalidateQueries({ queryKey: ['call-detail'] })
      setEditOpen(false)
      setEditCallId(null)
      toast.success('Call record updated')
    },
    onError: () => toast.error('Failed to update call record'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => callsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      setViewOpen(false)
      setViewCallId(null)
      toast.success('Call record deleted')
    },
    onError: () => toast.error('Failed to delete call record'),
  })

  const handleView = (call: CallRecordListItem) => {
    setViewCallId(call.id)
    setViewOpen(true)
    setShowTranscript(false)
  }

  const handleEdit = (call: CallRecordListItem) => {
    setEditCallId(call.id)
    setEditForm({ phone: call.phone, summary: call.summary || '', status: call.status })
    setEditOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this call record?')) {
      deleteMutation.mutate(id)
    }
  }

  const transcriptMessages = viewCall?.transcript ? parseTranscript(viewCall.transcript) : []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Call Records</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total calls</p>
        </div>
        <Button onClick={() => setTriggerDialogOpen(true)}>
          <Phone className="h-4 w-4 mr-2" />
          Trigger Call
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={providerFilter || 'ALL'}
          onValueChange={(v) => setProviderFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-40">
            <SelectValue placeholder="All providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All providers</SelectItem>
            <SelectItem value="OMNIDIM">Omnidim</SelectItem>
            <SelectItem value="BOLNA">Bolna</SelectItem>
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
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading call records...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No call records</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Phone</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Provider</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Source</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Duration</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Started</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.results.map((call) => (
                <tr
                  key={call.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleView(call)}
                >
                  <td className="px-4 py-3 text-[13px] font-medium">{call.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{call.provider}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {(call as CallRecordListItem & { queue_name?: string }).queue_name
                      ? <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[11px]">
                          {(call as CallRecordListItem & { queue_name?: string }).queue_name}
                        </span>
                      : <span className="text-muted-foreground">Manual</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[call.status])}>
                      {call.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {call.started_at ? formatDateTime(call.started_at) : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-blue-500"
                        title="View"
                        onClick={() => handleView(call)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-amber-500"
                        title="Edit"
                        onClick={() => handleEdit(call)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Delete"
                        onClick={() => handleDelete(call.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Call Detail Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewCallId(null)
        }}
        title="Call Detail"
        mode="view"
        size="xl"
        footerButtons={
          viewCall
            ? [
                {
                  label: 'Edit',
                  variant: 'outline',
                  icon: Pencil,
                  onClick: () => {
                    setViewOpen(false)
                    setEditCallId(viewCall.id)
                    setEditForm({ phone: viewCall.phone, summary: viewCall.summary || '', status: viewCall.status })
                    setEditOpen(true)
                  },
                },
                {
                  label: 'Delete',
                  variant: 'destructive',
                  icon: Trash2,
                  onClick: () => handleDelete(viewCall.id),
                },
                ...(viewCall.status === 'FAILED'
                  ? [{
                      label: 'Retry Call',
                      icon: RefreshCw,
                      loading: retryMutation.isPending,
                      onClick: () => retryMutation.mutate(viewCall.id),
                    }]
                  : []),
              ]
            : []
        }
        footerAlignment="between"
      >
        {viewCallLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading call details...</p>
          </div>
        ) : viewCall ? (
          <div className="space-y-5">
            {/* Status & Provider badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', CALL_STATUS_COLORS[viewCall.status])}>
                {viewCall.status.replace(/_/g, ' ')}
              </span>
              <Badge variant="secondary">{viewCall.provider}</Badge>
              {viewCall.voice_agent_id && (
                <Badge variant="outline" className="text-xs">Agent: {viewCall.voice_agent_id}</Badge>
              )}
            </div>

            {/* Error alert */}
            {viewCall.status === 'FAILED' && viewCall.error_message && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
                <p className="text-xs font-semibold text-destructive mb-0.5 uppercase tracking-wide">Call Failed</p>
                <p className="text-[13px] text-destructive">{viewCall.error_message}</p>
              </div>
            )}

            {/* Info grid - ALL fields */}
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Call Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="font-medium">{viewCall.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                  <p className="font-medium">{formatDuration(viewCall.duration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Provider</p>
                  <p className="font-medium">{viewCall.provider}</p>
                </div>
                {viewCall.provider_call_id && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Provider Call ID</p>
                    <p className="font-medium font-mono text-[12px]">{viewCall.provider_call_id}</p>
                  </div>
                )}
                {viewCall.voice_agent_id && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Voice Agent ID</p>
                    <p className="font-medium font-mono text-[12px]">{viewCall.voice_agent_id}</p>
                  </div>
                )}
                {viewCall.application_id && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Application ID</p>
                    <p className="font-medium font-mono text-[12px]">{viewCall.application_id}</p>
                  </div>
                )}
                {viewCall.started_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Started</p>
                    <p className="font-medium">{formatDateTime(viewCall.started_at)}</p>
                  </div>
                )}
                {viewCall.ended_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Ended</p>
                    <p className="font-medium">{formatDateTime(viewCall.ended_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                  <p className="font-medium">{formatDateTime(viewCall.created_at)}</p>
                </div>
                {viewCall.updated_at && viewCall.updated_at !== viewCall.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Updated</p>
                    <p className="font-medium">{formatDateTime(viewCall.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {viewCall.summary && (
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Summary</p>
                <p className="text-[13px] leading-relaxed">{viewCall.summary}</p>
              </div>
            )}

            {/* Recording */}
            {viewCall.recording_url && (
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recording</p>
                <audio controls src={viewCall.recording_url} className="w-full h-10" />
              </div>
            )}

            {/* Scorecard */}
            {viewCall.scorecard && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Scorecard</p>
                <div className="space-y-2">
                  {Object.entries(SCORE_DIMENSION_LABELS).map(([key, label]) => (
                    <ScoreDimensionBar
                      key={key}
                      label={label}
                      value={(viewCall.scorecard as unknown as Record<string, string>)[key] ?? '0'}
                    />
                  ))}
                </div>
                <div className="border-t pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Overall Score</p>
                    <p className="text-xl font-bold">{parseFloat(viewCall.scorecard.overall_score).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 100</span></p>
                  </div>
                  <Badge variant="outline" className="text-sm">{viewCall.scorecard.recommendation}</Badge>
                </div>
                {viewCall.scorecard.summary && (
                  <div className="border-t pt-3">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Scorecard Summary</p>
                    <p className="text-[13px]">{viewCall.scorecard.summary}</p>
                  </div>
                )}
                {viewCall.scorecard.strengths && viewCall.scorecard.strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-emerald-600 mb-1">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {viewCall.scorecard.strengths.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-[12px]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {viewCall.scorecard.weaknesses && viewCall.scorecard.weaknesses.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-red-500 mb-1">Areas for Improvement</p>
                    <div className="flex flex-wrap gap-1">
                      {viewCall.scorecard.weaknesses.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[12px]">{w}</span>
                      ))}
                    </div>
                  </div>
                )}
                {viewCall.scorecard.detailed_feedback && Object.keys(viewCall.scorecard.detailed_feedback).length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground">Detailed Feedback</p>
                    {Object.entries(viewCall.scorecard.detailed_feedback).map(([key, val]) => (
                      <div key={key}>
                        <p className="text-[11px] font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-[13px]">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transcript */}
            {viewCall.transcript && (
              <div className="rounded-lg border p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 -ml-2 -mt-1"
                  onClick={() => setShowTranscript((s) => !s)}
                >
                  <MessageSquare className="h-4 w-4" />
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showTranscript && 'rotate-180')} />
                </Button>
                {showTranscript && (
                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                    {transcriptMessages.length > 0 ? (
                      transcriptMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={cn(
                            'rounded-lg px-3 py-2 text-[13px] max-w-[90%]',
                            msg.role === 'user'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 ml-auto'
                              : 'bg-muted text-foreground'
                          )}
                        >
                          <p className={cn('text-[10px] font-medium mb-0.5 uppercase tracking-wide',
                            msg.role === 'user' ? 'text-blue-500' : 'text-muted-foreground'
                          )}>
                            {msg.role === 'user' ? 'Candidate' : 'Agent'}
                          </p>
                          {msg.content}
                        </div>
                      ))
                    ) : (
                      <pre className="p-3 bg-muted rounded-lg text-[13px] whitespace-pre-wrap font-mono overflow-auto">
                        {viewCall.transcript}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Non-FAILED error message */}
            {viewCall.status !== 'FAILED' && viewCall.error_message && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Note</p>
                <p className="text-[13px]">{viewCall.error_message}</p>
              </div>
            )}
          </div>
        ) : null}
      </SideDrawer>

      {/* Edit Call Drawer */}
      <SideDrawer
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditCallId(null)
        }}
        title="Edit Call Record"
        mode="edit"
        size="md"
        isLoading={updateMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => { setEditOpen(false); setEditCallId(null) } },
          {
            label: 'Save Changes',
            loading: updateMutation.isPending,
            onClick: () => {
              if (editCallId) {
                updateMutation.mutate({
                  id: editCallId,
                  data: {
                    phone: editForm.phone,
                    summary: editForm.summary,
                    status: editForm.status,
                  },
                })
              }
            },
          },
        ]}
        footerAlignment="right"
      >
        {editCallLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading call details...</p>
          </div>
        ) : editCall ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea
                rows={4}
                value={editForm.summary}
                onChange={(e) => setEditForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
          </div>
        ) : null}
      </SideDrawer>

      {/* Trigger Call Dialog */}
      <TriggerCallDialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen} />
    </div>
  )
}
