import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Loader2, Phone, Star, User, Briefcase, MapPin, Mail,
  Clock, FileText, Tag, Award, MessageSquare, Calendar, ExternalLink,
  ChevronDown, ChevronUp, Mic, Activity, TrendingUp, Shield, Zap,
  CheckCircle2, XCircle, AlertCircle, Pencil, Check, X, PhoneOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { StaleCallCountdown } from '@/components/StaleCallCountdown'
import { extractApiError, getActiveCallExistsDetails } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { applicationsService } from '@/services/applications'
import { callsService } from '@/services/calls'
import type { ApplicationStatus, CallRecordSummary, ApplicationDetail } from '@/types'
import {
  formatDate,
  formatDateTime,
  formatDuration,
  getInitials,
  isActiveCallStatus,
  cn,
} from '@/lib/utils'

const STATUS_CONFIG: Record<string, { bg: string; dot: string; gradient: string }> = {
  APPLIED: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
  AI_SCREENING: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
  AI_COMPLETED: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', dot: 'bg-purple-500', gradient: 'from-purple-500 to-violet-600' },
  SHORTLISTED: { bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', dot: 'bg-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  INTERVIEW_SCHEDULED: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
  INTERVIEWED: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
  OFFER: { bg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', dot: 'bg-teal-500', gradient: 'from-teal-500 to-emerald-500' },
  HIRED: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500', gradient: 'from-green-500 to-emerald-600' },
  REJECTED: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', gradient: 'from-red-500 to-rose-600' },
  WITHDRAWN: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' },
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

const RECOMMENDATION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  STRONG_YES: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400', icon: CheckCircle2 },
  YES: { color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400', icon: CheckCircle2 },
  MAYBE: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400', icon: AlertCircle },
  NO: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400', icon: XCircle },
  STRONG_NO: { color: 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400', icon: XCircle },
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

/* ── Score ring for sidebar ── */
function ScoreRing({ score }: { score: string }) {
  const val = parseFloat(score)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (val / 100) * circumference
  const color = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{val.toFixed(0)}</span>
        <span className="text-[10px] text-muted-foreground -mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

/* ── Score dimension bar ── */
function ScoreDimensionBar({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  const num = parseFloat(value)
  const pct = Math.min(100, num)
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="text-[12px] font-semibold">{num.toFixed(1)}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { appId, id: jobId } = useParams<{ id: string; appId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  const { data: app, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['application-detail', appId],
    queryFn: () => applicationsService.get(appId!),
    enabled: !!appId,
  })

  // Any call still within its auto-fail window blocks a new trigger.
  const blockingCall: CallRecordSummary | undefined = app?.call_records?.find(
    (cr) =>
      isActiveCallStatus(cr.status) &&
      (cr.seconds_until_stale ?? 0) > 0,
  )

  const triggerCallMutation = useMutation({
    mutationFn: (id: string) => applicationsService.triggerAiCall(id),
    onMutate: async () => {
      const toastId = toast.loading('Triggering AI call...')
      const detailKey = ['application-detail', appId]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<ApplicationDetail>(detailKey)
      const now = new Date().toISOString()
      const pendingCall: CallRecordSummary = {
        id: `pending-${Date.now()}`,
        provider: 'OMNIDIM',
        provider_call_id: '',
        phone: previous?.applicant?.phone ?? '',
        status: 'QUEUED',
        duration: 0,
        summary: '',
        recording_url: '',
        started_at: null,
        ended_at: null,
        created_at: now,
        stale_at: null,
        seconds_until_stale: null,
        stale_threshold_minutes: 0,
      }
      qc.setQueryData<ApplicationDetail>(detailKey, (old) =>
        old ? { ...old, call_records: [pendingCall, ...old.call_records] } : old
      )
      return { toastId, previous }
    },
    onSuccess: (_data, _vars, context) => {
      toast.success('AI call triggered', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['application-detail', appId], context.previous)
      const active = getActiveCallExistsDetails(err)
      if (active) {
        toast.error('An active call is already in flight for this application.', {
          id: context?.toastId,
          description: `It will auto-fail after ${active.stale_threshold_minutes} minutes, or you can mark it failed manually.`,
        })
        qc.invalidateQueries({ queryKey: ['application-detail', appId] })
        return
      }
      toast.error(extractApiError(err, 'Failed to trigger AI call'), { id: context?.toastId })
    },
  })

  const markCallFailedMutation = useMutation({
    mutationFn: (callId: string) => callsService.updateStatus(callId, 'FAILED'),
    onMutate: async (callId) => {
      const detailKey = ['application-detail', appId]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<ApplicationDetail>(detailKey)
      qc.setQueryData<ApplicationDetail>(detailKey, (old) =>
        old
          ? {
              ...old,
              call_records: old.call_records.map((cr) =>
                cr.id === callId ? { ...cr, status: 'FAILED', seconds_until_stale: 0 } : cr
              ),
            }
          : old
      )
      return { previous }
    },
    onSuccess: () => {
      toast.success('Call marked as failed')
    },
    onError: (err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['application-detail', appId], context.previous)
      toast.error(extractApiError(err, 'Failed to update call status'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
      qc.invalidateQueries({ queryKey: ['calls'] })
    },
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsService.changeStatus(appId, status),
    onMutate: async ({ appId: mutatedAppId, status }) => {
      const detailKey = ['application-detail', mutatedAppId]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<ApplicationDetail>(detailKey)
      qc.setQueryData<ApplicationDetail>(detailKey, (old) =>
        old ? { ...old, status: status as ApplicationStatus } : old
      )
      return { previous }
    },
    onSuccess: () => {
      toast.success('Status updated')
    },
    onError: (err, vars, context) => {
      if (context?.previous) qc.setQueryData(['application-detail', vars.appId], context.previous)
      toast.error(extractApiError(err, 'Failed to update status'))
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['application-detail', vars.appId] })
      qc.invalidateQueries({ queryKey: ['job-applications'] })
      qc.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  const notesMutation = useMutation({
    mutationFn: (notes: string) => applicationsService.patch(appId!, { notes }),
    onMutate: async (notes) => {
      const detailKey = ['application-detail', appId]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<ApplicationDetail>(detailKey)
      qc.setQueryData<ApplicationDetail>(detailKey, (old) => (old ? { ...old, notes } : old))
      return { previous }
    },
    onSuccess: () => {
      setEditingNotes(false)
      toast.success('Notes saved')
    },
    onError: (err, _notes, context) => {
      if (context?.previous) qc.setQueryData(['application-detail', appId], context.previous)
      toast.error(extractApiError(err, 'Failed to save notes'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
    },
  })

  const startEditingNotes = () => {
    setNotesValue(app?.notes || '')
    setEditingNotes(true)
  }

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

  const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED
  const fullName = `${app.applicant.first_name} ${app.applicant.last_name}`

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* ── Hero Header Card ── */}
      <Card className="overflow-hidden">
        <div className={cn('h-1.5 bg-gradient-to-r', statusConf.gradient)} />
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={cn('w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md', getAvatarGradient(fullName))}>
                <span className="text-lg font-bold text-white">{getInitials(fullName)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <h1
                    className="text-lg sm:text-xl font-semibold hover:text-primary cursor-pointer transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/applicants/${app.applicant_id}`) }}
                  >
                    {fullName}
                  </h1>
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium', statusConf.bg)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', statusConf.dot)} />
                    {app.status.replace(/_/g, ' ')}
                  </span>
                  {app.score && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-[11px] font-semibold">
                      <Star className="h-3 w-3 fill-current" />
                      {parseFloat(app.score).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {app.job.title}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {app.job.department} · {app.job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Applied {formatDate(app.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => triggerCallMutation.mutate(app.id)}
                disabled={triggerCallMutation.isPending}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                AI Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => navigate(`/applicants/${app.applicant_id}`)}
              >
                <User className="h-3.5 w-3.5 mr-1.5" />
                Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection reason banner */}
      {app.status === 'REJECTED' && app.rejection_reason && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5 uppercase tracking-wide">Rejection Reason</p>
            <p className="text-sm text-red-800 dark:text-red-300">{app.rejection_reason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle
                className="text-base flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
                onClick={() => navigate(`/applicants/${app.applicant_id}`)}
              >
                <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                Applicant Information
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Full Name</p>
                  <p
                    className="font-medium text-primary hover:underline cursor-pointer"
                    onClick={() => navigate(`/applicants/${app.applicant_id}`)}
                  >
                    {fullName}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                  <p className="font-medium">{app.applicant.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                  <p className="font-medium flex items-center gap-1.5">
                    {app.applicant.phone || '—'}
                    {app.applicant.phone && (
                      <a
                        href={`https://wa.me/${app.applicant.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="inline-flex items-center justify-center text-green-600 hover:text-green-700 transition-colors"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Source</p>
                  <p className="font-medium">{app.applicant.source.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Current Role</p>
                  <p className="font-medium">{app.applicant.current_role || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Company</p>
                  <p className="font-medium">{app.applicant.current_company || '—'}</p>
                </div>
                {app.applicant.experience_years > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Experience</p>
                    <p className="font-medium">{app.applicant.experience_years} year{app.applicant.experience_years !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
              {app.applicant.skills?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.applicant.skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md text-[12px] font-medium">{s}</span>
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
                <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Title</p>
                  <p className="font-medium">{app.job.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                  <p className="font-medium">{app.job.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Location</p>
                  <p className="font-medium">{app.job.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Job Type</p>
                  <p className="font-medium">{app.job.job_type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Experience Level</p>
                  <p className="font-medium">{app.job.experience_level}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Job Status</p>
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium', {
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': app.job.status === 'OPEN',
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': app.job.status === 'DRAFT',
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': app.job.status === 'PAUSED',
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': app.job.status === 'CLOSED',
                  })}>
                    {app.job.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Scorecard */}
          {app.scorecards?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  AI Scorecard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {app.scorecards.map((sc) => {
                  const recConf = RECOMMENDATION_CONFIG[sc.recommendation]
                  const RecIcon = recConf?.icon || AlertCircle
                  return (
                    <div key={sc.id} className="space-y-4">
                      {/* Score dimensions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ScoreDimensionBar label="Communication" value={sc.communication_score} icon={MessageSquare} />
                        <ScoreDimensionBar label="Knowledge" value={sc.knowledge_score} icon={TrendingUp} />
                        <ScoreDimensionBar label="Confidence" value={sc.confidence_score} icon={Shield} />
                        <ScoreDimensionBar label="Relevance" value={sc.relevance_score} icon={Zap} />
                      </div>

                      {/* Overall + Recommendation */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <ScoreRing score={sc.overall_score} />
                          <div>
                            <p className="text-xs text-muted-foreground">Overall Assessment</p>
                            <p className="text-base sm:text-lg font-bold mt-0.5">
                              {parseFloat(sc.overall_score).toFixed(1)}
                              <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
                            </p>
                          </div>
                        </div>
                        {recConf && (
                          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium', recConf.color)}>
                            <RecIcon className="h-4 w-4" />
                            {sc.recommendation.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      {sc.summary && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Summary</p>
                          <p className="text-sm leading-relaxed">{sc.summary}</p>
                        </div>
                      )}

                      {/* Strengths & Weaknesses */}
                      {(sc.strengths?.length > 0 || sc.weaknesses?.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                          {sc.strengths?.length > 0 && (
                            <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Strengths
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {sc.strengths.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-[11px] font-medium">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {sc.weaknesses?.length > 0 && (
                            <div className="rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3">
                              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Areas to Improve
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {sc.weaknesses.map((w, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-[11px] font-medium">{w}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Call Records */}
          {app.call_records?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Phone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Call Records
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {app.call_records.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.call_records.map((cr) => {
                  const callIsActive =
                    isActiveCallStatus(cr.status) && (cr.seconds_until_stale ?? 0) > 0
                  return (
                  <div key={cr.id} className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[cr.status])}>
                          {cr.status.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{cr.provider}</Badge>
                        {callIsActive && (
                          <StaleCallCountdown
                            staleAt={cr.stale_at}
                            initialSecondsUntilStale={cr.seconds_until_stale}
                            fetchedAt={dataUpdatedAt}
                            onExpire={() =>
                              qc.invalidateQueries({ queryKey: ['application-detail', appId] })
                            }
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(cr.duration)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Phone</p>
                        <p className="font-medium flex items-center gap-1.5">
                          {cr.phone}
                          {cr.phone && (
                            <a
                              href={`https://wa.me/${cr.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="inline-flex items-center justify-center text-green-600 hover:text-green-700 transition-colors"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </p>
                      </div>
                      {cr.started_at && (
                        <div>
                          <p className="text-muted-foreground mb-0.5">Started</p>
                          <p className="font-medium">{formatDateTime(cr.started_at)}</p>
                        </div>
                      )}
                      {cr.ended_at && (
                        <div>
                          <p className="text-muted-foreground mb-0.5">Ended</p>
                          <p className="font-medium">{formatDateTime(cr.ended_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground mb-0.5">Created</p>
                        <p className="font-medium">{formatDateTime(cr.created_at)}</p>
                      </div>
                    </div>
                    {cr.summary && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Summary</p>
                        <p className="text-sm leading-relaxed">{cr.summary}</p>
                      </div>
                    )}
                    {cr.recording_url && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Mic className="h-3 w-3" />
                          Recording
                        </p>
                        <audio controls src={cr.recording_url} className="w-full h-8" />
                      </div>
                    )}
                    {!cr.recording_url && (
                      <button
                        className="flex items-center gap-1 text-xs text-blue-500 hover:underline pt-1"
                        onClick={() => setExpandedCallId(expandedCallId === cr.id ? null : cr.id)}
                      >
                        {expandedCallId === cr.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {expandedCallId === cr.id ? 'Hide details' : 'Show details'}
                      </button>
                    )}
                    {expandedCallId === cr.id && (
                      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 font-mono">
                        Provider Call ID: {cr.provider_call_id}
                      </div>
                    )}
                    {callIsActive && (
                      <div className="pt-3 border-t flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/40"
                          onClick={() => markCallFailedMutation.mutate(cr.id)}
                          disabled={
                            markCallFailedMutation.isPending &&
                            markCallFailedMutation.variables === cr.id
                          }
                        >
                          <PhoneOff className="h-3 w-3 mr-1.5" />
                          Mark as Failed
                        </Button>
                      </div>
                    )}
                  </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Interviews */}
          {app.interviews?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Calendar className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
                  </div>
                  Interviews
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {app.interviews.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.interviews.map((iv) => (
                  <div key={iv.id} className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{iv.interview_type.replace(/_/g, ' ')}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', INTERVIEW_STATUS_COLORS[iv.status] || 'bg-gray-100 text-gray-700')}>
                        {iv.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Scheduled</p>
                        <p className="font-medium">{formatDateTime(iv.scheduled_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Duration</p>
                        <p className="font-medium">{iv.duration_minutes} minutes</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Interviewer</p>
                        <p className="font-medium">{iv.interviewer_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Email</p>
                        <p className="font-medium">{iv.interviewer_email}</p>
                      </div>
                    </div>
                    {iv.meeting_link && (
                      <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        Join Meeting
                      </a>
                    )}
                    {iv.feedback && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Feedback</p>
                        <p className="text-sm italic leading-relaxed text-muted-foreground">"{iv.feedback}"</p>
                      </div>
                    )}
                    {iv.rating && (
                      <div className="flex items-center gap-1 text-xs pt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn('h-3.5 w-3.5', i < iv.rating! ? 'text-amber-500 fill-amber-500' : 'text-muted')}
                          />
                        ))}
                        <span className="font-medium ml-1">{iv.rating}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right Column — Sidebar ── */}
        <div className="space-y-6">

          {/* Score Ring */}
          {app.score && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  Candidate Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <ScoreRing score={app.score} />
              </CardContent>
            </Card>
          )}

          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                Status & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                disabled={triggerCallMutation.isPending || !!blockingCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                {blockingCall ? 'Call in progress…' : 'Trigger AI Call'}
              </Button>
              {blockingCall && (
                <div className="rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span className="font-medium">
                      {blockingCall.status.replace(/_/g, ' ')} call blocks new triggers
                    </span>
                  </div>
                  <div>
                    <StaleCallCountdown
                      staleAt={blockingCall.stale_at}
                      initialSecondsUntilStale={blockingCall.seconds_until_stale}
                      fetchedAt={dataUpdatedAt}
                      onExpire={() =>
                        qc.invalidateQueries({ queryKey: ['application-detail', appId] })
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => markCallFailedMutation.mutate(blockingCall.id)}
                    disabled={markCallFailedMutation.isPending}
                  >
                    <PhoneOff className="h-3 w-3 mr-1.5" />
                    Mark as Failed
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                Application Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Application ID</p>
                <p className="font-mono text-[11px] break-all text-muted-foreground">{app.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Applied On</p>
                <p className="font-medium">{formatDateTime(app.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Last Updated</p>
                <p className="font-medium">{formatDateTime(app.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  Notes
                </CardTitle>
                {!editingNotes && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={startEditingNotes} title="Edit notes">
                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this application..."
                    className="text-xs sm:text-sm"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] sm:text-xs"
                      onClick={() => setEditingNotes(false)}
                      disabled={notesMutation.isPending}
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[10px] sm:text-xs"
                      onClick={() => notesMutation.mutate(notesValue)}
                      disabled={notesMutation.isPending}
                    >
                      {notesMutation.isPending ? (
                        <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : app.notes ? (
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{app.notes}</p>
              ) : (
                <p
                  className="text-xs sm:text-sm text-muted-foreground italic cursor-pointer hover:text-foreground transition-colors"
                  onClick={startEditingNotes}
                >
                  Tap to add notes...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          {app.metadata && Object.keys(app.metadata).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Tag className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5 text-sm">
                  {Object.entries(app.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground mb-0.5">{key}</p>
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
