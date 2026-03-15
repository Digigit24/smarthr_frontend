import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText, Phone, Star, ChevronDown } from 'lucide-react'
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
import type { ApplicationListItem, ApplicationDetail, ApplicationStatus } from '@/types'
import { formatDate, formatDateTime, cn } from '@/lib/utils'

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

const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN',
]

function ScoreBar({ score }: { score: string | null }) {
  if (!score) return <span className="text-muted-foreground text-[13px]">—</span>
  const val = parseFloat(score) // 0–100 scale
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

export default function ApplicationsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewApp, setViewApp] = useState<ApplicationDetail | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['applications', search, statusFilter],
    queryFn: () =>
      applicationsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
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

  const handleView = async (app: ApplicationListItem) => {
    try {
      const detail = await applicationsService.get(app.id)
      setViewApp(detail)
      setViewOpen(true)
    } catch {
      toast.error('Failed to load application')
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
        <Card className="animate-pulse">
          <CardContent className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
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
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium',
                        STATUS_COLORS[app.status]
                      )}
                    >
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
        onOpenChange={setViewOpen}
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
                    setViewOpen(false)
                  },
                },
              ]
            : []
        }
        footerAlignment="right"
      >
        {viewApp && (
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

            {/* Applicant */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applicant</p>
              <p className="font-semibold">{viewApp.applicant.first_name} {viewApp.applicant.last_name}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.email}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.current_role} @ {viewApp.applicant.current_company}</p>
            </div>

            {/* Job */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job</p>
              <p className="font-semibold">{viewApp.job.title}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.job.department} · {viewApp.job.location}</p>
            </div>

            {/* Scorecards */}
            {viewApp.scorecards.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Scorecard</p>
                {viewApp.scorecards.map((sc) => (
                  <div key={sc.id} className="rounded-lg border p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { label: 'Communication', value: sc.communication_score },
                        { label: 'Knowledge', value: sc.knowledge_score },
                        { label: 'Confidence', value: sc.confidence_score },
                        { label: 'Relevance', value: sc.relevance_score },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[11px] text-muted-foreground">{item.label}</p>
                          <p className="font-semibold">{parseFloat(item.value).toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[11px] text-muted-foreground mb-0.5">Overall</p>
                      <p className="text-lg font-bold">{parseFloat(sc.overall_score).toFixed(1)} / 100</p>
                      <Badge variant="outline" className="mt-1">{sc.recommendation}</Badge>
                    </div>
                    {sc.summary && <p className="text-[13px]">{sc.summary}</p>}
                    {sc.strengths.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-emerald-600 mb-1">Strengths</p>
                        <ul className="list-disc list-inside text-[13px] space-y-0.5">
                          {sc.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {sc.weaknesses.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-red-500 mb-1">Areas for Improvement</p>
                        <ul className="list-disc list-inside text-[13px] space-y-0.5">
                          {sc.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Interviews */}
            {viewApp.interviews.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interviews</p>
                {viewApp.interviews.map((iv) => (
                  <div key={iv.id} className="rounded-lg border p-3 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{iv.interview_type.replace(/_/g, ' ')}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px]', iv.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}>
                        {iv.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{formatDateTime(iv.scheduled_at)} · {iv.duration_minutes}min</p>
                    <p className="text-muted-foreground">{iv.interviewer_name} &lt;{iv.interviewer_email}&gt;</p>
                  </div>
                ))}
              </div>
            )}

            {/* Change Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Change Status</p>
              <Select
                onValueChange={(status) => {
                  changeStatusMutation.mutate({ id: viewApp.id, status })
                  setViewOpen(false)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status..." />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  )
}
