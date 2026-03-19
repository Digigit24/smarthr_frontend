import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { interviewsService } from '@/services/interviews'
import { applicationsService } from '@/services/applications'
import type { InterviewFormData, InterviewType } from '@/types'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  application: z.string().min(1, 'Application required'),
  interview_type: z.enum(['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL']),
  scheduled_at: z.string().min(1, 'Schedule time required'),
  duration_minutes: z.coerce.number().min(15).max(480),
  interviewer_name: z.string().min(1, 'Interviewer name required'),
  interviewer_email: z.string().email('Valid email required'),
  meeting_link: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: 'AI_VOICE', label: 'AI Voice', desc: 'AI-powered voice screening' },
  { value: 'HR_SCREEN', label: 'HR Screen', desc: 'Initial HR screening call' },
  { value: 'TECHNICAL', label: 'Technical', desc: 'Technical assessment interview' },
  { value: 'CULTURE_FIT', label: 'Culture Fit', desc: 'Team & culture evaluation' },
  { value: 'FINAL', label: 'Final', desc: 'Final round interview' },
]

export default function InterviewCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { interview_type: 'TECHNICAL', duration_minutes: 60 },
  })

  const { data: applicationsData } = useQuery({
    queryKey: ['applications', 'for-interview'],
    queryFn: () => applicationsService.list({}),
  })

  const createMutation = useMutation({
    mutationFn: (data: InterviewFormData) => interviewsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Interview scheduled')
      navigate('/interviews')
    },
    onError: () => toast.error('Failed to schedule interview'),
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/interviews')} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Interviews
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Schedule Interview</h1>
            <p className="text-sm text-muted-foreground">Set up a new interview for an applicant</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data as InterviewFormData))} className="space-y-4 sm:space-y-6">
        {/* Application & Type */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
            Interview Setup
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Application <span className="text-destructive">*</span></Label>
              <Select value={watch('application')} onValueChange={(v) => setValue('application', v)}>
                <SelectTrigger><SelectValue placeholder="Select an application..." /></SelectTrigger>
                <SelectContent>
                  {applicationsData?.results?.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.applicant_name || app.applicant_email} — {app.job_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.application && <p className="text-xs text-destructive">{errors.application.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Interview Type</Label>
              <Select value={watch('interview_type')} onValueChange={(v) => setValue('interview_type', v as InterviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min="15" max="480" {...register('duration_minutes')} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs font-bold">2</span>
            Schedule & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Scheduled At <span className="text-destructive">*</span></Label>
              <Input type="datetime-local" {...register('scheduled_at')} />
              {errors.scheduled_at && <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input placeholder="https://meet.google.com/..." {...register('meeting_link')} />
            </div>
          </div>
        </div>

        {/* Interviewer */}
        <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">3</span>
            Interviewer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="John Doe" {...register('interviewer_name')} />
              {errors.interviewer_name && <p className="text-xs text-destructive">{errors.interviewer_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="john@company.com" {...register('interviewer_email')} />
              {errors.interviewer_email && <p className="text-xs text-destructive">{errors.interviewer_email.message}</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/interviews')} className="sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} className="sm:w-auto">
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Schedule Interview
          </Button>
        </div>
      </form>
    </div>
  )
}
