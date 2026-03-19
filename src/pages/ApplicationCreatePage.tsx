import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, FilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { jobsService } from '@/services/jobs'
import { applicantsService } from '@/services/applicants'
import type { ApplicationFormData, ApplicationStatus } from '@/types'

const ALL_STATUSES: ApplicationStatus[] = [
  'APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED',
  'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN',
]

const schema = z.object({
  job: z.string().min(1, 'Job is required'),
  applicant: z.string().min(1, 'Applicant is required'),
  status: z.enum(['APPLIED', 'AI_SCREENING', 'AI_COMPLETED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN']),
  notes: z.string().optional(),
})

type FormInput = z.infer<typeof schema>

export default function ApplicationCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'APPLIED' },
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-list-for-select'],
    queryFn: () => jobsService.list({ ordering: 'title' }),
  })

  const { data: applicantsData } = useQuery({
    queryKey: ['applicants-list-for-select'],
    queryFn: () => applicantsService.list({ ordering: 'first_name' }),
  })

  const createMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => applicationsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success('Application created')
      navigate('/applications')
    },
    onError: () => toast.error('Failed to create application'),
  })

  const onSubmit = (data: FormInput) => {
    createMutation.mutate(data as ApplicationFormData)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <FilePlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">New Application</h1>
                <p className="text-sm text-muted-foreground">Link an applicant to a job opening</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/applications')}>Cancel</Button>
              <Button
                disabled={createMutation.isPending}
                onClick={handleSubmit(onSubmit)}
              >
                {createMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
                ) : (
                  <><FilePlus className="h-4 w-4 mr-2" />Create Application</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Job *</Label>
              <Select value={watch('job') || ''} onValueChange={(v) => setValue('job', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobsData?.results?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} — {job.department} ({job.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.job && <p className="text-xs text-destructive">{errors.job.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Applicant *</Label>
              <Select value={watch('applicant') || ''} onValueChange={(v) => setValue('applicant', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an applicant..." />
                </SelectTrigger>
                <SelectContent>
                  {applicantsData?.results?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name} ({a.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.applicant && <p className="text-xs text-destructive">{errors.applicant.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FormInput['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} placeholder="Optional notes..." {...register('notes')} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
