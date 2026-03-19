import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Loader2, Phone, Pencil, Trash2, RefreshCw,
  Clock, FileText, MessageSquare, ChevronDown, Mic, Activity,
  AlertTriangle, XCircle, CheckCircle2, AlertCircle,
  TrendingUp, Shield, Zap, Star, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { callsService } from '@/services/calls'
import { formatDateTime, formatDuration, cn } from '@/lib/utils'

const CALL_STATUS_CONFIG: Record<string, { bg: string; dot: string; gradient: string }> = {
  QUEUED: { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400', gradient: 'from-gray-400 to-gray-500' },
  INITIATED: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600' },
  RINGING: { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500' },
  IN_PROGRESS: { bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
  COMPLETED: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
  FAILED: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', gradient: 'from-red-500 to-rose-600' },
  NO_ANSWER: { bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500', gradient: 'from-orange-500 to-amber-600' },
  BUSY: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500', gradient: 'from-yellow-500 to-amber-500' },
}

const RECOMMENDATION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  STRONG_YES: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400', icon: CheckCircle2 },
  YES: { color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400', icon: CheckCircle2 },
  MAYBE: { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400', icon: AlertCircle },
  NO: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400', icon: XCircle },
  STRONG_NO: { color: 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400', icon: XCircle },
}

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

function ScoreRing({ score }: { score: string }) {
  const val = parseFloat(score)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (val / 100) * circumference
  const color = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{val.toFixed(0)}</span>
        <span className="text-[9px] text-muted-foreground -mt-0.5">/ 100</span>
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

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showTranscript, setShowTranscript] = useState(false)

  const { data: call, isLoading } = useQuery({
    queryKey: ['call-detail', id],
    queryFn: () => callsService.get(id!),
    enabled: !!id,
  })

  const retryMutation = useMutation({
    mutationFn: () => callsService.retry(id!),
    onSuccess: (newCall) => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call retried')
      navigate(`/calls/${newCall.id}`)
    },
    onError: () => toast.error('Failed to retry call'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => callsService.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call record deleted')
      navigate(-1)
    },
    onError: () => toast.error('Failed to delete call record'),
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
  const transcriptMessages = call.transcript ? parseTranscript(call.transcript) : []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <Card className="overflow-hidden">
        <div className={cn('h-1.5 bg-gradient-to-r', statusConf.gradient)} />
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md', statusConf.gradient)}>
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold">{call.phone}</h1>
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium', statusConf.bg)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', statusConf.dot)} />
                    {call.status.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{call.provider}</Badge>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(call.duration)}
                  </span>
                  {call.started_at && (
                    <span className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5" />
                      {formatDateTime(call.started_at)}
                    </span>
                  )}
                  {call.application_id && (
                    <button
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:underline"
                      onClick={() => navigate(`/applications/${call.application_id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Application
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
              {call.status === 'FAILED' && (
                <Button variant="outline" size="sm" onClick={() => retryMutation.mutate()} disabled={retryMutation.isPending}>
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', retryMutation.isPending && 'animate-spin')} />
                  Retry
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate(`/calls/${call.id}/edit`)}>
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

      {/* Error Banner */}
      {call.status === 'FAILED' && call.error_message && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-0.5 uppercase tracking-wide">Call Failed</p>
            <p className="text-sm text-red-800 dark:text-red-300">{call.error_message}</p>
          </div>
        </div>
      )}
      {call.status !== 'FAILED' && call.error_message && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-0.5 uppercase tracking-wide">Note</p>
            <p className="text-sm text-amber-800 dark:text-amber-300">{call.error_message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Call Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                Call Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                  <p className="font-medium">{call.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Duration</p>
                  <p className="font-medium">{formatDuration(call.duration)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Provider</p>
                  <p className="font-medium">{call.provider}</p>
                </div>
                {call.provider_call_id && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Provider Call ID</p>
                    <p className="font-mono text-[11px] break-all text-muted-foreground">{call.provider_call_id}</p>
                  </div>
                )}
                {call.voice_agent_id && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Voice Agent ID</p>
                    <p className="font-mono text-[11px] break-all text-muted-foreground">{call.voice_agent_id}</p>
                  </div>
                )}
                {call.application_id && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Application ID</p>
                    <p className="font-mono text-[11px] break-all text-muted-foreground">{call.application_id}</p>
                  </div>
                )}
                {call.started_at && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Started</p>
                    <p className="font-medium">{formatDateTime(call.started_at)}</p>
                  </div>
                )}
                {call.ended_at && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Ended</p>
                    <p className="font-medium">{formatDateTime(call.ended_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Created</p>
                  <p className="font-medium">{formatDateTime(call.created_at)}</p>
                </div>
                {call.updated_at && call.updated_at !== call.created_at && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Updated</p>
                    <p className="font-medium">{formatDateTime(call.updated_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {call.summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
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
                  <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <Mic className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent>
                <audio controls src={call.recording_url} className="w-full h-10" />
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
                    <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    AI Scorecard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
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
                        <p className="text-lg font-bold mt-0.5">
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
                        <div className="rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3">
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
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
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
                            'rounded-lg px-3 py-2.5 text-[13px] max-w-[85%]',
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
                      <pre className="p-3 bg-muted rounded-lg text-[13px] whitespace-pre-wrap font-mono overflow-auto">
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
        <div className="space-y-4 sm:space-y-6">

          {/* Score Ring */}
          {call.scorecard && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
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

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5 text-primary" />
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
                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                Call Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Call ID</p>
                <p className="font-mono text-[11px] break-all text-muted-foreground">{call.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                <p className="font-medium">{formatDateTime(call.created_at)}</p>
              </div>
              {call.updated_at && call.updated_at !== call.created_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Updated</p>
                  <p className="font-medium">{formatDateTime(call.updated_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
