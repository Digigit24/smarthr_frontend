import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pencil, Trash2, Loader2, AlertTriangle, Calendar, Clock,
  User, Mail, Video, XCircle, CheckCircle, Star, MessageSquare, ExternalLink, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { interviewsService } from '@/services/interviews'
import type { InterviewStatus, InterviewType } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string; gradient: string; dot: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', gradient: 'from-cyan-500 to-blue-500', dot: 'bg-cyan-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400' },
}

const TYPE_CONFIG: Record<InterviewType, { label: string; icon: typeof Calendar; color: string; bg: string }> = {
  AI_VOICE: { label: 'AI Voice', icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  HR_SCREEN: { label: 'HR Screen', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  TECHNICAL: { label: 'Technical', icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  CULTURE_FIT: { label: 'Culture Fit', icon: Star, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  FINAL: { label: 'Final', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

const completeSchema = z.object({
  feedback: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
})

type CompleteData = z.infer<typeof completeSchema>

function GradientAvatar({ name }: { name: string }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={cn('h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initials}
    </div>
  )
}

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [completeOpen, setCompleteOpen] = useState(false)

  const { data: interview, isLoading } = useQuery({
    queryKey: ['interview-detail', id],
    queryFn: () => interviewsService.get(id!),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => interviewsService.cancel(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); qc.invalidateQueries({ queryKey: ['interview-detail', id] }); toast.success('Interview cancelled') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to cancel interview')),
  })

  const completeMutation = useMutation({
    mutationFn: ({ feedback, rating }: { feedback: string; rating?: number }) =>
      interviewsService.complete(id!, feedback, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      qc.invalidateQueries({ queryKey: ['interview-detail', id] })
      setCompleteOpen(false)
      toast.success('Interview completed')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to complete interview')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => interviewsService.delete(id!),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); toast.success('Interview deleted'); navigate('/interviews') },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete interview')),
  })

  const { register: completeRegister, handleSubmit: handleCompleteSubmit } = useForm<CompleteData>({
    resolver: zodResolver(completeSchema),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 sm:py-32">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
        <p className="text-xs sm:text-sm text-muted-foreground mt-3">Loading interview...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center py-24 sm:py-32">
        <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500 mb-3" />
        <p className="text-xs sm:text-sm text-muted-foreground">Interview not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[interview.status]
  const typeCfg = TYPE_CONFIG[interview.interview_type]
  const TypeIcon = typeCfg.icon
  const scheduledDate = new Date(interview.scheduled_at)
  const isUpcoming = scheduledDate > new Date() && interview.status !== 'CANCELLED' && interview.status !== 'COMPLETED'

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Hero Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className={cn('h-1.5 sm:h-2 bg-gradient-to-r', statusCfg.gradient)} />
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Top row: icon + info */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={cn('h-11 w-11 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0', statusCfg.gradient)}>
                <TypeIcon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <span className={cn('inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium', statusCfg.color)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot)} />
                    {statusCfg.label}
                  </span>
                  <span className={cn('inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium', typeCfg.bg, typeCfg.color)}>
                    {typeCfg.label}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{typeCfg.label} Interview</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {formatDateTime(interview.scheduled_at)} · {interview.duration_minutes} min
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">
                  Created {formatDateTime(interview.created_at)} · Updated {formatDateTime(interview.updated_at)}
                </p>
              </div>
            </div>
            {/* Action buttons — full width on mobile */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 shrink-0">
              {(interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS') && (
                <Button size="sm" onClick={() => setCompleteOpen(true)} className="text-xs sm:text-sm">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" /> Complete
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate(`/interviews/${id}/edit`)} className="text-xs sm:text-sm">
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" /> Edit
              </Button>
              {interview.status !== 'CANCELLED' && interview.status !== 'COMPLETED' && (
                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="text-xs sm:text-sm">
                  <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" /> Cancel
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive text-xs sm:text-sm"
                onClick={() => { if (window.confirm('Delete this interview?')) deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-5">
          {/* Schedule & Details */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-xs sm:text-sm">Interview Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{formatDateTime(interview.scheduled_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Duration</p>
                  <p className="text-xs sm:text-sm font-medium">{interview.duration_minutes} minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                  <TypeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Type</p>
                  <p className="text-xs sm:text-sm font-medium">{typeCfg.label}</p>
                </div>
              </div>
              {interview.meeting_link && (
                <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Meeting Link</p>
                    <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:underline truncate block">
                      Join Meeting <ExternalLink className="h-3 w-3 inline ml-1" />
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                <div className={cn('h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0',
                  interview.calendar_synced ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800'
                )}>
                  <CalendarDays className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4',
                    interview.calendar_synced ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                  )} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Calendar Sync</p>
                  <p className={cn('text-xs sm:text-sm font-medium', interview.calendar_synced ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                    {interview.calendar_synced ? 'Synced to Google Calendar' : 'Not synced'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate & Interviewer */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Candidate */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm">Candidate</h3>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                  <GradientAvatar name={interview.applicant_name || interview.applicant_email || 'A'} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{interview.applicant_name || 'Unknown'}</p>
                    {interview.applicant_email && (
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{interview.applicant_email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Interviewer */}
              <div>
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
                  <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm">Interviewer</h3>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30">
                  <GradientAvatar name={interview.interviewer_name || interview.interviewer_email} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs sm:text-sm truncate">{interview.interviewer_name || 'No name'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{interview.interviewer_email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Rating */}
          {(interview.feedback || interview.rating) && (
            <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm">Feedback & Rating</h3>
              </div>
              {interview.rating != null && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-4 w-4 sm:h-5 sm:w-5', i < interview.rating! ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/20')} />
                    ))}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-amber-600">{interview.rating}/5</span>
                </div>
              )}
              {interview.feedback && (
                <div className="p-2.5 sm:p-3 rounded-lg bg-muted/30">
                  <p className="text-xs sm:text-sm leading-relaxed">{interview.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Complete Interview inline form */}
          {completeOpen && (
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 bg-card p-3 sm:p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm">Complete Interview</h3>
              </div>
              <form
                onSubmit={handleCompleteSubmit((data) =>
                  completeMutation.mutate({ feedback: data.feedback || '', rating: data.rating })
                )}
                className="space-y-3 sm:space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Feedback (optional)</Label>
                  <Textarea rows={3} placeholder="Candidate showed excellent problem-solving skills..." {...completeRegister('feedback')} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Rating (1-5)</Label>
                  <Input type="number" min="1" max="5" placeholder="e.g. 4" {...completeRegister('rating')} className="w-24 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCompleteOpen(false)} className="text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={completeMutation.isPending} className="text-xs sm:text-sm">
                    {completeMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    Mark Complete
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-3 sm:space-y-4">
          {/* Status */}
          <div className={cn('rounded-xl border-2 p-3 sm:p-4 md:p-5',
            interview.status === 'COMPLETED' ? 'border-emerald-200 dark:border-emerald-800/50'
            : interview.status === 'CANCELLED' || interview.status === 'NO_SHOW' ? 'border-red-200 dark:border-red-800/50'
            : 'border-blue-200 dark:border-blue-800/50'
          )}>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Status</p>
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold', statusCfg.color)}>
              <span className={cn('h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full', statusCfg.dot)} />
              {statusCfg.label}
            </span>
            {isUpcoming && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3">
                {(() => {
                  const diff = scheduledDate.getTime() - Date.now()
                  const hours = Math.floor(diff / (1000 * 60 * 60))
                  const days = Math.floor(hours / 24)
                  if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`
                  if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`
                  return 'Starting soon'
                })()}
              </p>
            )}
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
            <h3 className="font-semibold text-xs sm:text-sm">Quick Info</h3>
            <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Type</span>
                <span className="font-medium">{typeCfg.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Duration</span>
                <span className="font-medium">{interview.duration_minutes}m</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Candidate</span>
                <span className="font-medium truncate ml-2 text-right">{interview.applicant_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0"><User className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Interviewer</span>
                <span className="font-medium truncate ml-2 text-right">{interview.interviewer_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Calendar</span>
                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium',
                  interview.calendar_synced
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                )}>
                  {interview.calendar_synced ? 'Synced' : 'Not synced'}
                </span>
              </div>
              {interview.rating != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Rating</span>
                  <span className="font-medium text-amber-600">{interview.rating}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Meeting link */}
          {interview.meeting_link && isUpcoming && (
            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl border bg-card p-3 sm:p-4 hover:border-primary/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors">Join Meeting</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Open video call</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </a>
          )}

          {/* Actions */}
          <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-5 space-y-1.5 sm:space-y-2">
            <h3 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-3">Actions</h3>
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm" size="sm" onClick={() => navigate(`/interviews/${id}/edit`)}>
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" /> Edit Interview
            </Button>
            {interview.status !== 'CANCELLED' && interview.status !== 'COMPLETED' && (
              <Button variant="outline" className="w-full justify-start text-xs sm:text-sm" size="sm" onClick={() => cancelMutation.mutate()}>
                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" /> Cancel Interview
              </Button>
            )}
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive text-xs sm:text-sm" size="sm"
              onClick={() => { if (window.confirm('Delete this interview?')) deleteMutation.mutate() }}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" /> Delete Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
