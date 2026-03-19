import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Briefcase, MapPin, Clock, Users, Bot, ListChecks,
  Pencil, Trash2, Phone, ChevronDown, Star, Eye, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { SideDrawer } from '@/components/SideDrawer'
import { jobsService } from '@/services/jobs'
import { applicationsService } from '@/services/applications'
import { callQueuesService } from '@/services/callQueues'
import type { ApplicationListItem, ApplicationStatus, JobDetail } from '@/types'
import { formatDate, formatDateTime, formatDuration, cn } from '@/lib/utils'

const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

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

function VoiceConfigDialog({
  job,
  open,
  onOpenChange,
  onSuccess,
}: {
  job: JobDetail
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [selectedAgentId, setSelectedAgentId] = useState(job.voice_agent_id || '')
  const [shortlistThreshold, setShortlistThreshold] = useState(
    String(job.voice_agent_config?.auto_shortlist_threshold ?? 7.0)
  )
  const [rejectThreshold, setRejectThreshold] = useState(
    String(job.voice_agent_config?.auto_reject_threshold ?? 4.0)
  )

  const { data: agentsData } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: () => callQueuesService.voiceAgents(),
    enabled: open,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      jobsService.updateVoiceConfig(job.id, {
        voice_agent_id: selectedAgentId || undefined,
        voice_agent_config: {
          auto_shortlist_threshold: parseFloat(shortlistThreshold),
          auto_reject_threshold: parseFloat(rejectThreshold),
        },
      }),
    onSuccess: () => {
      toast.success('Voice config saved')
      onSuccess()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to save voice config'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Voice Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Voice Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                {agentsData?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Auto Shortlist Threshold</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={shortlistThreshold}
                onChange={(e) => setShortlistThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{"Score >= this -> shortlisted"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Auto Reject Threshold</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rejectThreshold}
                onChange={(e) => setRejectThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{"Score <= this -> rejected"}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [appStatusFilter, setAppStatusFilter] = useState('')
  const [appSearch, setAppSearch] = useState('')
  const [voiceConfigOpen, setVoiceConfigOpen] = useState(false)
  const [viewAppId, setViewAppId] = useState<string | null>(null)
  const [viewAppOpen, setViewAppOpen] = useState(false)
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)

  // Fetch job detail
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: () => jobsService.get(id!),
    enabled: !!id,
  })

  // Fetch voice agent name
  const { data: agentData } = useQuery({
    queryKey: ['voice-agent', job?.voice_agent_id],
    queryFn: () => callQueuesService.voiceAgent(job!.voice_agent_id!),
    enabled: !!job?.voice_agent_id,
  })

  // Fetch applications for this job
  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', id, appStatusFilter, appSearch],
    queryFn: () =>
      jobsService.applications(id!, {
        ...(appStatusFilter && { status: appStatusFilter }),
        ...(appSearch && { search: appSearch }),
      }),
    enabled: !!id,
  })

  // Fetch application detail for drawer
  const { data: viewApp, isLoading: viewAppLoading } = useQuery({
    queryKey: ['application-detail', viewAppId],
    queryFn: () => applicationsService.get(viewAppId!),
    enabled: !!viewAppId,
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => jobsService.delete(jobId),
    onSuccess: () => {
      toast.success('Job deleted')
      navigate('/jobs')
    },
    onError: () => toast.error('Failed to delete job'),
  })

  const triggerCallMutation = useMutation({
    mutationFn: (appId: string) => applicationsService.triggerAiCall(appId),
    onSuccess: () => toast.success('AI call triggered'),
    onError: () => toast.error('Failed to trigger AI call'),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsService.changeStatus(appId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications', id] })
      qc.invalidateQueries({ queryKey: ['application-detail'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id!)
    }
  }

  if (jobLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading job details...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Briefcase className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Job not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-semibold">{job.title}</h1>
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', JOB_STATUS_COLORS[job.status])}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {job.application_count} applications
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(job.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate(`/jobs?edit=${job.id}`)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({applicationsData?.count ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - details */}
            <div className="space-y-5">
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job Details</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Job Type</p>
                    <p className="font-medium">{job.job_type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Experience Level</p>
                    <p className="font-medium">{job.experience_level}</p>
                  </div>
                  {job.salary_min && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Salary Range</p>
                      <p className="font-medium">${job.salary_min} - ${job.salary_max}</p>
                    </div>
                  )}
                  {job.published_at && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Published</p>
                      <p className="font-medium">{formatDate(job.published_at)}</p>
                    </div>
                  )}
                  {job.closes_at && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Closes</p>
                      <p className="font-medium">{formatDate(job.closes_at)}</p>
                    </div>
                  )}
                  {job.updated_at && job.updated_at !== job.created_at && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Last Updated</p>
                      <p className="font-medium">{formatDate(job.updated_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
                <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requirements</p>
                <p className="text-sm whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>

            {/* Right column - voice config & actions */}
            <div className="space-y-5">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    Voice Configuration
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setVoiceConfigOpen(true)}>
                    Configure
                  </Button>
                </div>
                {job.voice_agent_id ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-muted-foreground text-xs">Agent: </span>
                      <span className="font-medium">{agentData?.name || job.voice_agent_id}</span>
                    </div>
                    {job.voice_agent_config?.auto_shortlist_threshold != null && (
                      <div className="text-[13px] text-muted-foreground">
                        {"Shortlist >= "}{job.voice_agent_config.auto_shortlist_threshold}{" / "}
                        {"Reject <= "}{job.voice_agent_config.auto_reject_threshold}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">No voice agent configured</p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate(`/call-queues?job_id=${job.id}&voice_agent_id=${job.voice_agent_id || ''}`)}
              >
                <ListChecks className="h-4 w-4" />
                Create AI Call Queue for this Job
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
              <Input
                placeholder="Search by name or email..."
                className="pl-3"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>
            <Select
              value={appStatusFilter || 'ALL'}
              onValueChange={(v) => setAppStatusFilter(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-[calc(50%-6px)] sm:w-48">
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

          {/* Applications Table */}
          {appsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-3">Loading applications...</p>
            </div>
          ) : (applicationsData?.results?.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No applications yet</p>
              <p className="text-sm mt-1">Applications for this job will appear here</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applicant</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Score</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Applied</th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {applicationsData?.results.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setViewAppId(app.id)
                        setViewAppOpen(true)
                        setExpandedCallId(null)
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[13px]">{app.applicant_name}</p>
                        <p className="text-[12px] text-muted-foreground">{app.applicant_email}</p>
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
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-blue-500"
                            title="View"
                            onClick={() => {
                              setViewAppId(app.id)
                              setViewAppOpen(true)
                              setExpandedCallId(null)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
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
                            onValueChange={(status) => changeStatusMutation.mutate({ appId: app.id, status })}
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
        </TabsContent>
      </Tabs>

      {/* Application Detail Drawer */}
      <SideDrawer
        open={viewAppOpen}
        onOpenChange={(open) => {
          setViewAppOpen(open)
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
                  onClick: () => triggerCallMutation.mutate(viewApp.id),
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

            {/* Notes */}
            {viewApp.notes && (
              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</p>
                <p className="text-[13px] whitespace-pre-wrap">{viewApp.notes}</p>
              </div>
            )}

            {/* Applicant */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applicant</p>
              <p className="font-semibold">{viewApp.applicant.first_name} {viewApp.applicant.last_name}</p>
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.email}</p>
              {viewApp.applicant.phone && (
                <p className="text-[13px] text-muted-foreground">{viewApp.applicant.phone}</p>
              )}
              <p className="text-[13px] text-muted-foreground">{viewApp.applicant.current_role} @ {viewApp.applicant.current_company}</p>
              {viewApp.applicant.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewApp.applicant.skills.slice(0, 6).map((s) => (
                    <span key={s} className="px-1.5 py-0.5 bg-muted rounded text-[11px]">{s}</span>
                  ))}
                </div>
              )}
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
                  changeStatusMutation.mutate({ appId: viewApp.id, status }, {
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

      {/* Voice Config Dialog */}
      {job && (
        <VoiceConfigDialog
          job={job}
          open={voiceConfigOpen}
          onOpenChange={setVoiceConfigOpen}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['job-detail', id] })}
        />
      )}
    </div>
  )
}
