import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Loader2, Phone, Star, User, Briefcase, MapPin, Mail,
  Clock, FileText, Tag, Award, MessageSquare, Calendar, ExternalLink,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applicationsService } from '@/services/applications'
import type { ApplicationStatus } from '@/types'
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
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { appId, id: jobId } = useParams<{ id: string; appId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)

  const { data: app, isLoading } = useQuery({
    queryKey: ['application-detail', appId],
    queryFn: () => applicationsService.get(appId!),
    enabled: !!appId,
  })

  const triggerCallMutation = useMutation({
    mutationFn: (id: string) => applicationsService.triggerAiCall(id),
    onSuccess: () => {
      toast.success('AI call triggered')
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
    },
    onError: () => toast.error('Failed to trigger AI call'),
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsService.changeStatus(appId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
      qc.invalidateQueries({ queryKey: ['job-applications'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const goBack = () => {
    if (jobId) {
      navigate(`/jobs/${jobId}`)
    } else {
      navigate('/applications')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading application...</p>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Application not found</p>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {app.applicant.first_name} {app.applicant.last_name}
              </h1>
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', STATUS_COLORS[app.status])}>
                {app.status.replace(/_/g, ' ')}
              </span>
              {app.score && (
                <div className="flex items-center gap-1 ml-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-sm">{parseFloat(app.score).toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Applied for <span className="font-medium text-foreground">{app.job.title}</span> · {app.job.department} · {formatDate(app.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerCallMutation.mutate(app.id)}
            disabled={triggerCallMutation.isPending}
          >
            <Phone className="h-3.5 w-3.5 mr-1.5" />
            Trigger AI Call
          </Button>
        </div>
      </div>

      {/* Rejection reason banner */}
      {app.status === 'REJECTED' && app.rejection_reason && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 uppercase tracking-wide">Rejection Reason</p>
          <p className="text-sm">{app.rejection_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={User} label="Full Name" value={`${app.applicant.first_name} ${app.applicant.last_name}`} />
                <InfoRow icon={Mail} label="Email" value={app.applicant.email} />
                {app.applicant.phone && <InfoRow icon={Phone} label="Phone" value={app.applicant.phone} />}
                <InfoRow icon={Tag} label="Source" value={app.applicant.source.replace(/_/g, ' ')} />
                {app.applicant.current_role && <InfoRow icon={Briefcase} label="Current Role" value={app.applicant.current_role} />}
                {app.applicant.current_company && <InfoRow icon={Briefcase} label="Current Company" value={app.applicant.current_company} />}
                {app.applicant.experience_years > 0 && <InfoRow icon={Clock} label="Experience" value={`${app.applicant.experience_years} year${app.applicant.experience_years !== 1 ? 's' : ''}`} />}
              </div>
              {app.applicant.skills?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.applicant.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-500" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Briefcase} label="Title" value={app.job.title} />
                <InfoRow icon={Briefcase} label="Department" value={app.job.department} />
                <InfoRow icon={MapPin} label="Location" value={app.job.location} />
                <InfoRow icon={Tag} label="Job Type" value={app.job.job_type.replace(/_/g, ' ')} />
                <InfoRow icon={Award} label="Experience Level" value={app.job.experience_level} />
                <div className="flex items-start gap-2.5">
                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium mt-0.5', {
                      'bg-emerald-100 text-emerald-700': app.job.status === 'OPEN',
                      'bg-gray-100 text-gray-700': app.job.status === 'DRAFT',
                      'bg-amber-100 text-amber-700': app.job.status === 'PAUSED',
                      'bg-red-100 text-red-700': app.job.status === 'CLOSED',
                    })}>
                      {app.job.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Records */}
          {app.call_records?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-500" />
                  Call Records ({app.call_records.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.call_records.map((cr) => (
                  <div key={cr.id} className="rounded-lg border p-4 space-y-2.5 hover:border-border/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[cr.status])}>
                          {cr.status.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-[11px]">{cr.provider}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDuration(cr.duration)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{cr.phone}</p>
                      </div>
                      {cr.started_at && (
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{formatDateTime(cr.started_at)}</p>
                        </div>
                      )}
                      {cr.ended_at && (
                        <div>
                          <p className="text-muted-foreground">Ended</p>
                          <p className="font-medium">{formatDateTime(cr.ended_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDateTime(cr.created_at)}</p>
                      </div>
                    </div>
                    {cr.summary && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Summary</p>
                        <p className="text-sm">{cr.summary}</p>
                      </div>
                    )}
                    {cr.recording_url && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Recording</p>
                        <audio controls src={cr.recording_url} className="w-full h-8" />
                      </div>
                    )}
                    {!cr.recording_url && (
                      <button
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                        onClick={() => setExpandedCallId(expandedCallId === cr.id ? null : cr.id)}
                      >
                        {expandedCallId === cr.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expandedCallId === cr.id ? 'Hide details' : 'Show details'}
                      </button>
                    )}
                    {expandedCallId === cr.id && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                        Provider Call ID: {cr.provider_call_id}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Scorecards */}
          {app.scorecards?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  AI Scorecard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.scorecards.map((sc) => (
                  <div key={sc.id} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <ScoreDimensionBar label="Communication" value={sc.communication_score} />
                      <ScoreDimensionBar label="Knowledge" value={sc.knowledge_score} />
                      <ScoreDimensionBar label="Confidence" value={sc.confidence_score} />
                      <ScoreDimensionBar label="Relevance" value={sc.relevance_score} />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Overall Score</p>
                        <p className="text-2xl font-bold">
                          {parseFloat(sc.overall_score).toFixed(1)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm">{sc.recommendation}</Badge>
                    </div>
                    {sc.summary && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Summary</p>
                        <p className="text-sm">{sc.summary}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sc.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-emerald-600 mb-1.5">Strengths</p>
                          <div className="flex flex-wrap gap-1">
                            {sc.strengths.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-xs">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sc.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-500 mb-1.5">Areas to Improve</p>
                          <div className="flex flex-wrap gap-1">
                            {sc.weaknesses.map((w, i) => (
                              <span key={i} className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs">{w}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Interviews */}
          {app.interviews?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  Interviews ({app.interviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.interviews.map((iv) => (
                  <div key={iv.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{iv.interview_type.replace(/_/g, ' ')}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', INTERVIEW_STATUS_COLORS[iv.status] || 'bg-gray-100 text-gray-700')}>
                        {iv.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Scheduled</p>
                        <p className="font-medium">{formatDateTime(iv.scheduled_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{iv.duration_minutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interviewer</p>
                        <p className="font-medium">{iv.interviewer_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{iv.interviewer_email}</p>
                      </div>
                    </div>
                    {iv.meeting_link && (
                      <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                    {iv.feedback && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Feedback</p>
                        <p className="text-sm italic">"{iv.feedback}"</p>
                      </div>
                    )}
                    {iv.rating && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="font-medium">{iv.rating}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Change Status</p>
                <Select
                  value={app.status}
                  onValueChange={(status) => changeStatusMutation.mutate({ appId: app.id, status })}
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => triggerCallMutation.mutate(app.id)}
                disabled={triggerCallMutation.isPending}
              >
                <Phone className="h-4 w-4 mr-2" />
                Trigger AI Call
              </Button>
            </CardContent>
          </Card>

          {/* Application Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Application Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Application ID</p>
                <p className="font-mono text-xs mt-0.5 break-all">{app.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Applied On</p>
                <p className="font-medium">{formatDateTime(app.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDateTime(app.updated_at)}</p>
              </div>
              {app.score && (
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="text-lg font-bold">{parseFloat(app.score).toFixed(1)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {app.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {app.metadata && Object.keys(app.metadata).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(app.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
