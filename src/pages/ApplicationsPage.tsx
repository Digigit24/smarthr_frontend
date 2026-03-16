import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Phone, Star, ChevronDown, Loader2 } from 'lucide-react'
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
import { SideDrawer } from '@/components/SideDrawer'
import { applicationsService } from '@/services/applications'
import type { ApplicationListItem, ApplicationStatus } from '@/types'
import { formatDate, formatDateTime, formatDuration, cn } from '@/lib/utils'

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

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-cyan-100 text-cyan-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
}

const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN',
]

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

function ScoreDimensionBar({ label, value }: { label: string; value: string }) {
  const num = parseFloat(value)
  const pct = Math.min(100, num)
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

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewAppId, setViewAppId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: () =>
      applicationsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      }),
  })

  const { data: viewApp, isLoading: viewAppLoading } = useQuery({
    queryKey: ['application-detail', viewAppId],
    queryFn: () => applicationsService.get(viewAppId!),
    enabled: !!viewAppId,
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
    setViewAppId(app.id)
    setViewOpen(true)
    setExpandedCallId(null)
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Applications</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading applications...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applications found</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 px-3 py-2.5 text-left" />
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applicant</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Job</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Score</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applied</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.results.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
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
                    <p className="font-medium text-[13px]">{app.applicant_name}</p>
                    <p className="text-[12px] text-muted-foreground">{app.applicant_email}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground max-w-[160px] truncate">
                    {app.job_title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLORS[app.status])}>
                      {app.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={app.score} />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {formatDate(app.created_at)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
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
      )}

      {/* Detail Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewAppId(null)
        }}
        title="Application Detail"
        mode="view"
        size="xl"
        footerButtons={
          viewApp
            ? [
                {
                  label: 'Trigger AI Call',
                  variant: 'outline',
                  icon: Phone,
                  onClick: () => {
                    triggerCallMutation.mutate(viewApp.id)
                    toast.success('AI call triggered')
                  },
                },
              ]
            : []
        }
        footerAlignment="right"
      >
        {viewAppLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading application details...</p>
          </div>
        ) : viewApp ? (
          <div className="space-y-5">
            {/* Status + Score */}
            <div className="flex items-center gap-3">
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLORS[viewApp.status])}>
                {viewApp.status.replace(/_/g, ' ')}
              </span>
              {viewApp.score && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-sm">{parseFloat(viewApp.score).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              )}
            </div>

            {/* Rejection reason */}
            {viewApp.status === 'REJECTED' && viewApp.rejection_reason && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5 uppercase tracking-wide">Rejection Reason</p>
                <p className="text-[13px]">{viewApp.rejection_reason}</p>
              </div>
            )}

            {/* Applicant */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applicant</p>
              <p className="font-semibold">{viewApp.applicant.first_name} {viewApp.applicant.last_name}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.email}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.current_role} @ {viewApp.applicant.current_company}</p>
              {viewApp.applicant.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewApp.applicant.skills.slice(0, 6).map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-muted rounded text-[11px]">{s}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Job */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job</p>
              <p className="font-semibold">{viewApp.job.title}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.job.department} · {viewApp.job.location}</p>
            </div>

            {/* Call Records */}
            {viewApp.call_records?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Call Records ({viewApp.call_records.length})</p>
                {viewApp.call_records.map((cr) => (
                  <div key={cr.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[cr.status])}>
                        {cr.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] text-muted-foreground">{formatDuration(cr.duration)}</span>
                    </div>
                    {cr.started_at && (
                      <p className="text-[12px] text-muted-foreground">{formatDateTime(cr.started_at)}</p>
                    )}
                    {cr.summary && <p className="text-[13px]">{cr.summary}</p>}
                    {cr.recording_url && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-1">Recording</p>
                        <audio controls src={cr.recording_url} className="w-full h-8" />
                      </div>
                    )}
                    {cr.recording_url === '' && (
                      <button
                        className="text-[12px] text-blue-500 hover:underline"
                        onClick={() => setExpandedCallId(expandedCallId === cr.id ? null : cr.id)}
                      >
                        {expandedCallId === cr.id ? 'Hide transcript' : 'Show transcript'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Scorecards */}
            {viewApp.scorecards?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Scorecard</p>
                {viewApp.scorecards.map((sc) => (
                  <div key={sc.id} className="rounded-lg border p-4 space-y-3">
                    <div className="space-y-2">
                      {[
                        { label: 'Communication', value: sc.communication_score },
                        { label: 'Knowledge', value: sc.knowledge_score },
                        { label: 'Confidence', value: sc.confidence_score },
                        { label: 'Relevance', value: sc.relevance_score },
                      ].map((item) => (
                        <ScoreDimensionBar key={item.label} label={item.label} value={item.value} />
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Overall Score</p>
                        <p className="text-xl font-bold">{parseFloat(sc.overall_score).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 100</span></p>
                      </div>
                      <Badge variant="outline">{sc.recommendation}</Badge>
                    </div>
                    {sc.summary && <p className="text-[13px]">{sc.summary}</p>}
                    <div className="flex gap-4">
                      {sc.strengths?.length > 0 && (
                        <div className="flex-1">
                          <p className="text-[11px] font-medium text-emerald-600 mb-1">Strengths</p>
                          <div className="flex flex-wrap gap-1">
                            {sc.strengths.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-[12px]">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sc.weaknesses?.length > 0 && (
                        <div className="flex-1">
                          <p className="text-[11px] font-medium text-red-500 mb-1">To Improve</p>
                          <div className="flex flex-wrap gap-1">
                            {sc.weaknesses.map((w, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-[12px]">{w}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Interviews */}
            {viewApp.interviews?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interviews ({viewApp.interviews.length})</p>
                {viewApp.interviews.map((iv) => (
                  <div key={iv.id} className="rounded-lg border p-3 text-[13px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{iv.interview_type.replace(/_/g, ' ')}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', INTERVIEW_STATUS_COLORS[iv.status] || 'bg-gray-100 text-gray-700')}>
                        {iv.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{formatDateTime(iv.scheduled_at)} · {iv.duration_minutes}min</p>
                    <p className="text-muted-foreground">{iv.interviewer_name} &lt;{iv.interviewer_email}&gt;</p>
                    {iv.meeting_link && (
                      <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-[12px]">
                        Join Meeting
                      </a>
                    )}
                    {iv.feedback && (
                      <p className="text-[13px] italic text-muted-foreground mt-1">"{iv.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Change Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Change Status</p>
              <Select
                value={viewApp.status}
                onValueChange={(status) => {
                  changeStatusMutation.mutate({ id: viewApp.id, status }, {
                    onSuccess: () => qc.invalidateQueries({ queryKey: ['application-detail', viewAppId] }),
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </SideDrawer>
    </div>
  )
}
