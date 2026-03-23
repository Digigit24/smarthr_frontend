import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ListChecks, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { applyFieldErrors } from '@/lib/apiErrors'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { callQueuesService } from '@/services/callQueues'
import { jobsService } from '@/services/jobs'
import { cn } from '@/lib/utils'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'US/Eastern', 'US/Central',
  'US/Mountain', 'US/Pacific', 'UTC',
]

const APPLICATION_STATUSES = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER',
]

const queueSchema = z.object({
  name: z.string().min(1, 'Name required'),
  job: z.string().min(1, 'Job required'),
  voice_agent_id: z.string().min(1, 'Voice agent required'),
  max_concurrent_calls: z.coerce.number().min(1).default(1),
  delay_between_calls_seconds: z.coerce.number().min(0).default(30),
  max_retries: z.coerce.number().min(0).default(2),
  call_window_start: z.string().default('09:00'),
  call_window_end: z.string().default('18:00'),
  timezone: z.string().default('Asia/Kolkata'),
  auto_shortlist_threshold: z.coerce.number().min(0).max(10).default(7.0),
  auto_reject_threshold: z.coerce.number().min(0).max(10).default(4.0),
  filter_statuses: z.array(z.string()).default(['APPLIED']),
})

type QueueForm = z.output<typeof queueSchema>
type QueueFormInput = z.input<typeof queueSchema>

export default function CallQueueCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const defaultJobId = searchParams.get('job') || ''
  const defaultVoiceAgentId = searchParams.get('agent') || ''

  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = useForm<QueueFormInput, unknown, QueueForm>({
    resolver: zodResolver(queueSchema),
    defaultValues: {
      name: '',
      job: defaultJobId,
      voice_agent_id: defaultVoiceAgentId,
      max_concurrent_calls: 1,
      delay_between_calls_seconds: 30,
      max_retries: 2,
      call_window_start: '09:00',
      call_window_end: '18:00',
      timezone: 'Asia/Kolkata',
      auto_shortlist_threshold: 7.0,
      auto_reject_threshold: 4.0,
      filter_statuses: ['APPLIED'],
    },
  })

  const filterStatuses = watch('filter_statuses') || []

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'OPEN'],
    queryFn: () => jobsService.list({ status: 'OPEN' }),
  })

  const { data: agentsData } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: () => callQueuesService.voiceAgents(),
  })

  const createMutation = useMutation({
    mutationFn: (formData: QueueForm) =>
      callQueuesService.create({
        name: formData.name,
        job: formData.job,
        voice_agent_id: formData.voice_agent_id,
        config: {
          max_concurrent_calls: formData.max_concurrent_calls,
          delay_between_calls_seconds: formData.delay_between_calls_seconds,
          max_retries: formData.max_retries,
          call_window_start: formData.call_window_start,
          call_window_end: formData.call_window_end,
          timezone: formData.timezone,
          auto_shortlist_threshold: formData.auto_shortlist_threshold,
          auto_reject_threshold: formData.auto_reject_threshold,
          filter_statuses: formData.filter_statuses,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['call-queues'] })
      toast.success('Queue created successfully')
      navigate('/call-queues')
    },
    onError: (err) => {
      const msg = applyFieldErrors(err, setError, 'Failed to create queue')
      if (msg) toast.error(msg)
    },
  })

  const toggleFilterStatus = (status: string) => {
    const current = filterStatuses
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setValue('filter_statuses', next)
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/call-queues')} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Queues
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
        <div className="p-3 sm:p-4 md:p-6 flex items-center gap-3 sm:gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Create Call Queue</h1>
            <p className="text-sm text-muted-foreground">Set up AI-powered call screening for a job</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Queue Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Software Engineer Screening - May" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Job <span className="text-destructive">*</span></Label>
              <Select value={watch('job')} onValueChange={(v) => setValue('job', v)}>
                <SelectTrigger><SelectValue placeholder="Select a job..." /></SelectTrigger>
                <SelectContent>
                  {jobsData?.results.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.job && <p className="text-xs text-destructive">{errors.job.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Voice Agent <span className="text-destructive">*</span></Label>
              <Select value={watch('voice_agent_id')} onValueChange={(v) => setValue('voice_agent_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select a voice agent..." /></SelectTrigger>
                <SelectContent>
                  {agentsData?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.voice_agent_id && <p className="text-xs text-destructive">{errors.voice_agent_id.message}</p>}
            </div>
          </div>
        </div>

        {/* Call Configuration */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">2</span>
            Call Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Max Concurrent Calls</Label>
              <Input type="number" min="1" max="10" {...register('max_concurrent_calls')} />
            </div>
            <div className="space-y-1.5">
              <Label>Delay Between Calls (sec)</Label>
              <Input type="number" min="0" {...register('delay_between_calls_seconds')} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Retries</Label>
              <Input type="number" min="0" max="5" {...register('max_retries')} />
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={watch('timezone')} onValueChange={(v) => setValue('timezone', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Call Window Start</Label>
              <Input type="time" {...register('call_window_start')} />
            </div>
            <div className="space-y-1.5">
              <Label>Call Window End</Label>
              <Input type="time" {...register('call_window_end')} />
            </div>
          </div>
        </div>

        {/* Thresholds & Filters */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">3</span>
            Thresholds & Filters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Auto Shortlist Threshold</Label>
              <Input type="number" min="0" max="10" step="0.1" {...register('auto_shortlist_threshold')} />
              <p className="text-[11px] text-muted-foreground">Score ≥ this → auto shortlisted</p>
            </div>
            <div className="space-y-1.5">
              <Label>Auto Reject Threshold</Label>
              <Input type="number" min="0" max="10" step="0.1" {...register('auto_reject_threshold')} />
              <p className="text-[11px] text-muted-foreground">Score ≤ this → auto rejected</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filter Application Statuses</Label>
            <p className="text-xs text-muted-foreground">Only applicants with these statuses will be added to the queue</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {APPLICATION_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleFilterStatus(status)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    filterStatuses.includes(status)
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background text-muted-foreground border-border hover:border-foreground/40'
                  )}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/call-queues')} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Queue
          </Button>
        </div>
      </form>
    </div>
  )
}
