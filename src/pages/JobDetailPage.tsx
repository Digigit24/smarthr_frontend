import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Briefcase, MapPin, Clock, Users, Bot, ListChecks,
  Pencil, Trash2, Phone, ChevronDown, Star, Eye, Loader2,
  DollarSign, Calendar, Award, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { DateRangeFilter } from '@/components/DateRangeFilter'
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
  const [selectedProvider, setSelectedProvider] = useState(job.voice_agent_provider || '')
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

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId)
    const agent = agentsData?.find((a) => a.id === agentId)
    setSelectedProvider(agent?.provider || '')
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      jobsService.updateVoiceConfig(job.id, {
        voice_agent_id: selectedAgentId || undefined,
        voice_agent_provider: selectedProvider || undefined,
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
    onError: (err) => toast.error(extractApiError(err, 'Failed to save voice config')),
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
            <Select value={selectedAgentId} onValueChange={handleAgentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                {agentsData?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                    <span className="ml-1.5 text-muted-foreground text-[11px]">({agent.provider})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProvider && (
              <p className="text-[11px] text-muted-foreground">Provider: <span className="font-medium text-foreground">{selectedProvider}</span></p>
            )}
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
  const [appDateFrom, setAppDateFrom] = useState('')
  const [appDateTo, setAppDateTo] = useState('')
  const [voiceConfigOpen, setVoiceConfigOpen] = useState(false)

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
    queryKey: ['job-applications', id, appStatusFilter, appSearch, appDateFrom, appDateTo],
    queryFn: () =>
      jobsService.applications(id!, {
        ...(appStatusFilter && { status: appStatusFilter }),
        ...(appSearch && { search: appSearch }),
        ...(appDateFrom && { created_at_gte: appDateFrom }),
        ...(appDateTo && { created_at_lte: appDateTo }),
      }),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => jobsService.delete(jobId),
    onSuccess: () => {
      toast.success('Job deleted')
      navigate(-1)
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete job')),
  })

  const triggerCallMutation = useMutation({
    mutationFn: (appId: string) => applicationsService.triggerAiCall(appId),
    onSuccess: () => toast.success('AI call triggered'),
    onError: (err) => toast.error(extractApiError(err, 'Failed to trigger AI call')),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsService.changeStatus(appId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications', id] })
      toast.success('Status updated')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to update status')),
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id!)
    }
  }

  const handleViewApplication = (app: ApplicationListItem) => {
    navigate(`/jobs/${id}/applications/${app.id}`)
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
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className={cn('h-1.5', {
          'bg-emerald-500': job.status === 'OPEN',
          'bg-gray-400': job.status === 'DRAFT',
          'bg-amber-500': job.status === 'PAUSED',
          'bg-red-500': job.status === 'CLOSED',
        })} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-semibold">{job.title}</h1>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', JOB_STATUS_COLORS[job.status])}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {job.experience_level} · {job.job_type.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {job.application_count} applications
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(job.created_at)}
                  </span>
                  {job.salary_min && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {job.salary_min} - {job.salary_max}
                    </span>
                  )}
                </div>

                {/* Job Description Preview */}
                {job.description && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{job.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Left column - details */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-500" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-emerald-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{job.requirements}</p>
                </CardContent>
              </Card>
            </div>

            {/* Right column - voice config & actions */}
            <div className="space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-500" />
                      Voice Configuration
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setVoiceConfigOpen(true)}>
                      Configure
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.voice_agent_id ? (
                    <div className="text-sm space-y-1.5">
                      <div>
                        <span className="text-muted-foreground text-xs">Agent: </span>
                        <span className="font-medium">{agentData?.name || job.voice_agent_id}</span>
                      </div>
                      {job.voice_agent_provider && (
                        <div>
                          <span className="text-muted-foreground text-xs">Provider: </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full text-[11px] font-medium">
                            <Bot className="h-3 w-3" />
                            {job.voice_agent_provider}
                          </span>
                        </div>
                      )}
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
                </CardContent>
              </Card>

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
            <DateRangeFilter
              fromDate={appDateFrom}
              toDate={appDateTo}
              onFromChange={setAppDateFrom}
              onToChange={setAppDateTo}
              onClear={() => { setAppDateFrom(''); setAppDateTo('') }}
            />
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
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 700 }}>
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
                        onClick={() => handleViewApplication(app)}
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
                              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                              title="View"
                              onClick={() => handleViewApplication(app)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
