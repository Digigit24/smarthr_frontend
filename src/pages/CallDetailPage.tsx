import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Loader2, Phone, Pencil, Trash2, RefreshCw,
  Clock, FileText, MessageSquare, ChevronDown, Mic, Activity,
  AlertTriangle, XCircle, CheckCircle2, AlertCircle,
  TrendingUp, Shield, Zap, Star, ExternalLink, Calendar,
  PhoneCall, PhoneIncoming, PhoneOff, Hash, User, Radio,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { StaleCallCountdown } from '@/components/StaleCallCountdown'
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
import { callsService } from '@/services/calls'
import type { CallRecordDetail, CallStatus } from '@/types'
import { formatDateTime, formatDuration, isActiveCallStatus, cn } from '@/lib/utils'

const CALL_STATUS_CONFIG: Record<string, { bg: string; dot: string; gradient: string; icon: typeof Phone }> = {
  QUEUED: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500', icon: Clock },
  INITIATED: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', icon: PhoneCall },
  RINGING: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500', icon: PhoneIncoming },
  IN_PROGRESS: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-500', icon: PhoneCall },
  COMPLETED: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
  FAILED: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', gradient: 'from-red-500 to-rose-600', icon: PhoneOff },
  NO_ANSWER: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500', gradient: 'from-orange-500 to-amber-600', icon: PhoneOff },
  BUSY: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500', gradient: 'from-yellow-500 to-amber-500', icon: PhoneOff },
}

const RECOMMENDATION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  STRONG_YES: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400', icon: CheckCircle2 },
  YES: { color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400', icon: CheckCircle2 },
  MAYBE: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400', icon: AlertCircle },
  NO: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400', icon: XCircle },
  STRONG_NO: { color: 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400', icon: XCircle },
}

const HAPPY_PATH = ['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED']
const TERMINAL_STATUSES = ['FAILED', 'NO_ANSWER', 'BUSY']
const ALL_STATUSES = [...HAPPY_PATH, ...TERMINAL_STATUSES]

interface TranscriptMessage {
  role: 'user' | 'bot' | 'agent'
  content: string
}

function parseTranscript(raw: string): TranscriptMessage[] {
  if (!raw) return []
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
      messages[messages.length - 1].content += ' ' + line
    } else {
      messages.push({ role: 'bot', content: line })
    }
  }
  return messages
}

function ScoreRing({ score, size = 'lg' }: { score: string; size?: 'sm' | 'lg' }) {
  const val = parseFloat(score)
  const r = size === 'lg' ? 40 : 28
  const circumference = 2 * Math.PI * r
  const offset = circumference - (val / 100) * circumference
  const color = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444'
  const svgSize = size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'
  const textSize = size === 'lg' ? 'text-xl' : 'text-sm'
  const subSize = size === 'lg' ? 'text-[9px]' : 'text-[8px]'
  return (
    <div className={cn('relative mx-auto', svgSize)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSize)}>{val.toFixed(0)}</span>
        <span className={cn('text-muted-foreground -mt-0.5', subSize)}>/ 100</span>
      </div>
    </div>
  )
}

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

/* ── Status Timeline ── */
function StatusTimeline({ status }: { status: string }) {
  const isFailed = TERMINAL_STATUSES.includes(status)
  const happyIdx = HAPPY_PATH.indexOf(status)
  const currentHappyIdx = isFailed
    ? HAPPY_PATH.indexOf('IN_PROGRESS')
    : happyIdx

  return (
    <div className="space-y-4">
      {/* Happy path row */}
      <div className="flex items-center gap-0">
        {HAPPY_PATH.map((step, idx) => {
          const isDone = idx <= currentHappyIdx && !isFailed
          const isCurrent = step === status
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                  isCurrent ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                    : isDone ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-border text-muted-foreground'
                )}>
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span className={cn(
                  'text-[9px] sm:text-[10px] font-medium whitespace-nowrap',
                  isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
              {idx < HAPPY_PATH.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-1 rounded-full',
                  idx < currentHappyIdx && !isFailed ? 'bg-primary' : 'bg-border'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Terminal statuses row */}
      <div className="flex items-center gap-3 pl-1">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide shrink-0">Terminal:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {TERMINAL_STATUSES.map((step) => {
            const isCurrent = step === status
            const conf = CALL_STATUS_CONFIG[step]
            return (
              <div
                key={step}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                  isCurrent
                    ? 'ring-2 ring-offset-1 ' + (step === 'FAILED' ? 'bg-red-100 text-red-700 border-red-300 ring-red-400 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                      : step === 'NO_ANSWER' ? 'bg-orange-100 text-orange-700 border-orange-300 ring-orange-400 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-300 ring-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700')
                    : 'bg-muted/50 text-muted-foreground border-border/60'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', isCurrent ? conf.dot : 'bg-muted-foreground/40')} />
                {step.replace(/_/g, ' ')}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Info Row ── */
function InfoRow({ icon: Icon, label, value, mono }: { icon: typeof Phone; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className={cn('text-sm font-medium mt-0.5', mono && 'font-mono text-[11px] text-muted-foreground break-all')}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showTranscript, setShowTranscript] = useState(false)

  const { data: call, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['call-detail', id],
    queryFn: () => callsService.get(id!),
    enabled: !!id,
  })

  const retryMutation = useMutation({
    mutationFn: () => callsService.retry(id!),
    onMutate: () => ({ toastId: toast.loading('Retrying call...') }),
    onSuccess: (newCall, _vars, context) => {
      toast.success('Call retried', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['calls'] })
      navigate(`/calls/${newCall.id}`)
    },
    onError: (err, _vars, context) => {
      toast.error(extractApiError(err, 'Failed to retry call'), { id: context?.toastId })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => callsService.delete(id!),
    onMutate: () => ({ toastId: toast.loading('Deleting call record...') }),
    onSuccess: (_data, _vars, context) => {
      toast.success('Call record deleted', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['calls'] })
      navigate(-1)
    },
    onError: (err, _vars, context) => {
      toast.error(extractApiError(err, 'Failed to delete call record'), { id: context?.toastId })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => callsService.updateStatus(id!, status),
    onMutate: async (status) => {
      const detailKey = ['call-detail', id]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<CallRecordDetail>(detailKey)
      qc.setQueryData<CallRecordDetail>(detailKey, (old) =>
        old ? { ...old, status: status as CallStatus } : old
      )
      return { previous }
    },
    onSuccess: () => {
      toast.success('Status updated')
    },
    onError: (err, _status, context) => {
      if (context?.previous) qc.setQueryData(['call-detail', id], context.previous)
      toast.error(extractApiError(err, 'Failed to update status'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      qc.invalidateQueries({ queryKey: ['call-detail', id] })
    },
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this call record?')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading call details...</p>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Phone className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Call record not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Calls
        </Button>
      </div>
    )
  }

  const statusConf = CALL_STATUS_CONFIG[call.status] || CALL_STATUS_CONFIG.QUEUED
  const StatusIcon = statusConf.icon
  const transcriptMessages = call.transcript ? parseTranscript(call.transcript) : []

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Hero Header */}
      <Card className="overflow-hidden border-0 shadow-md">
        <div className={cn('bg-gradient-to-r p-3 sm:p-5 md:p-6', statusConf.gradient)}>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Button variant="ghost" size="icon" className="mt-0.5 shrink-0 text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                <StatusIcon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{call.phone}</h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {call.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/80 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateTime(call.created_at)}
                  </span>
                  <Badge className="bg-white/20 text-white border-white/20 hover:bg-white/30 text-[10px]">{call.provider}</Badge>
                  {call.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(call.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto sm:ml-0">
              {call.status === 'FAILED' && (
                <Button size="sm" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/20" variant="outline" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', retryMutation.isPending && 'animate-spin')} />
                  Retry
                </Button>
              )}
              {isActiveCallStatus(call.status) && (call.seconds_until_stale ?? 0) > 0 && (
                <Button
                  size="sm"
                  className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/20"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate('FAILED')}
                  disabled={updateStatusMutation.isPending}
                >
                  <PhoneOff className="h-3.5 w-3.5 mr-1.5" />
                  Mark as Failed
                </Button>
              )}
              <Button size="sm" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/20" variant="outline" onClick={() => navigate(`/calls/${call.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
              <Button size="sm" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white border-white/20" variant="outline" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="px-4 sm:px-6 py-4 bg-card">
          <StatusTimeline status={call.status} />
        </div>
      </Card>

      {/* Auto-fail countdown banner */}
      {isActiveCallStatus(call.status) && (call.seconds_until_stale ?? 0) > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Auto-fail timer
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Backend will automatically mark this call as failed if it stays in{' '}
              <span className="font-semibold">{call.status.replace(/_/g, ' ')}</span> for more than{' '}
              {call.stale_threshold_minutes} minute
              {call.stale_threshold_minutes === 1 ? '' : 's'}.
            </p>
            <div className="pt-1">
              <StaleCallCountdown
                staleAt={call.stale_at}
                initialSecondsUntilStale={call.seconds_until_stale}
                fetchedAt={dataUpdatedAt}
                onExpire={() => qc.invalidateQueries({ queryKey: ['call-detail', id] })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {call.status === 'FAILED' && call.error_message && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5 uppercase tracking-wide">Call Failed</p>
            <p className="text-sm text-red-800 dark:text-red-300">{call.error_message}</p>
          </div>
        </div>
      )}
      {call.status !== 'FAILED' && call.error_message && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5 uppercase tracking-wide">Note</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">{call.error_message}</p>
          </div>
        </div>
      )}

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Duration</p>
                <p className="text-base sm:text-lg font-bold">{call.duration > 0 ? formatDuration(call.duration) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Radio className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Provider</p>
                <p className="text-base sm:text-lg font-bold">{call.provider}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Created</p>
                <p className="text-sm font-bold">{formatDateTime(call.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                call.scorecard ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <Star className={cn('h-5 w-5',
                  call.scorecard ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                )} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Score</p>
                <p className="text-base sm:text-lg font-bold">
                  {call.scorecard ? `${parseFloat(call.scorecard.overall_score).toFixed(0)}/100` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* Call Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                Call Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:gap-x-6">
                <InfoRow icon={Phone} label="Phone Number" value={call.phone} />
                <InfoRow icon={Clock} label="Duration" value={call.duration > 0 ? formatDuration(call.duration) : 'Not started'} />
                {call.started_at && <InfoRow icon={Activity} label="Started At" value={formatDateTime(call.started_at)} />}
                {call.ended_at && <InfoRow icon={CheckCircle2} label="Ended At" value={formatDateTime(call.ended_at)} />}
                <InfoRow icon={Calendar} label="Created" value={formatDateTime(call.created_at)} />
                {call.updated_at && call.updated_at !== call.created_at && (
                  <InfoRow icon={RefreshCw} label="Updated" value={formatDateTime(call.updated_at)} />
                )}
                {call.provider_call_id && <InfoRow icon={Hash} label="Provider Call ID" value={call.provider_call_id} mono />}
                {call.voice_agent_id && <InfoRow icon={User} label="Voice Agent ID" value={call.voice_agent_id} mono />}
                {call.application_id && <InfoRow icon={FileText} label="Application ID" value={call.application_id} mono />}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {call.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{call.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Recording */}
          {call.recording_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Mic className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-4">
                  <audio controls src={call.recording_url} className="w-full h-10" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Scorecard */}
          {call.scorecard && (() => {
            const sc = call.scorecard
            const recConf = RECOMMENDATION_CONFIG[sc.recommendation]
            const RecIcon = recConf?.icon || AlertCircle
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    AI Scorecard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 px-3 sm:px-6">
                  {/* Score Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ScoreDimensionBar label="Communication" value={sc.communication_score} icon={MessageSquare} />
                    <ScoreDimensionBar label="Knowledge" value={sc.knowledge_score} icon={TrendingUp} />
                    <ScoreDimensionBar label="Confidence" value={sc.confidence_score} icon={Shield} />
                    <ScoreDimensionBar label="Relevance" value={sc.relevance_score} icon={Zap} />
                  </div>

                  {/* Overall + Recommendation */}
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4">
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
                        <div className="rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sc.strengths.map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md text-[11px] font-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {sc.weaknesses?.length > 0 && (
                        <div className="rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3">
                          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" /> Areas to Improve
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

                  {/* Detailed Feedback */}
                  {sc.detailed_feedback && Object.keys(sc.detailed_feedback).length > 0 && (
                    <div className="pt-3 border-t space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Detailed Feedback</p>
                      {Object.entries(sc.detailed_feedback).map(([key, val]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-muted-foreground capitalize mb-0.5">{key.replace(/_/g, ' ')}</p>
                          <p className="text-sm leading-relaxed">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Transcript */}
          {call.transcript && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Transcript
                  <button
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setShowTranscript((s) => !s)}
                  >
                    {showTranscript ? 'Collapse' : 'Expand'}
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showTranscript && 'rotate-180')} />
                  </button>
                </CardTitle>
              </CardHeader>
              {showTranscript && (
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {transcriptMessages.length > 0 ? (
                      transcriptMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={cn(
                            'rounded-xl px-3 py-2.5 text-[13px] max-w-[85%]',
                            msg.role === 'user'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 ml-auto'
                              : 'bg-muted text-foreground'
                          )}
                        >
                          <p className={cn('text-[10px] font-semibold mb-1 uppercase tracking-wider',
                            msg.role === 'user' ? 'text-blue-500' : 'text-muted-foreground'
                          )}>
                            {msg.role === 'user' ? 'Candidate' : 'Agent'}
                          </p>
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      ))
                    ) : (
                      <pre className="p-3 bg-muted rounded-xl text-[13px] whitespace-pre-wrap font-mono overflow-auto">
                        {call.transcript}
                      </pre>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-4 sm:space-y-5">

          {/* Score Ring */}
          {call.scorecard && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-5">
                <ScoreRing score={call.scorecard.overall_score} />
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {call.scorecard.recommendation.replace(/_/g, ' ')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Update Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={call.status}
                onValueChange={(newStatus) => updateStatusMutation.mutate(newStatus)}
                disabled={updateStatusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => {
                    const conf = CALL_STATUS_CONFIG[s]
                    return (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', conf.dot)} />
                          {s.replace(/_/g, ' ')}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {updateStatusMutation.isPending && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating status...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {call.application_id && (
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate(`/applications/${call.application_id}`)}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View Application
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate(`/calls/${call.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Edit Call Record
              </Button>
              {call.status === 'FAILED' && (
                <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-2', retryMutation.isPending && 'animate-spin')} />
                  Retry Call
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Record
              </Button>
            </CardContent>
          </Card>

          {/* Call Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Call ID</p>
                <p className="font-mono text-[11px] break-all text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">{call.id}</p>
              </div>
              {call.provider_call_id && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Provider Call ID</p>
                  <p className="font-mono text-[11px] break-all text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">{call.provider_call_id}</p>
                </div>
              )}
              {call.voice_agent_id && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Voice Agent ID</p>
                  <p className="font-mono text-[11px] break-all text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md">{call.voice_agent_id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
