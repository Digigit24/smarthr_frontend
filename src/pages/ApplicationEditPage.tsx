import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { applyFieldErrors } from '@/lib/apiErrors'
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
import { FileText } from 'lucide-react'

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

export default function ApplicationEditPage() {
  const { appId } = useParams<{ appId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: app, isLoading } = useQuery({
    queryKey: ['application-detail', appId],
    queryFn: () => applicationsService.get(appId!),
    enabled: !!appId,
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-list-for-select'],
    queryFn: () => jobsService.list({ ordering: 'title', page_size: '999' }),
  })

  const { data: applicantsData } = useQuery({
    queryKey: ['applicants-list-for-select'],
    queryFn: () => applicantsService.list({ ordering: 'first_name', page_size: '999' }),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    values: app
      ? {
          job: app.job_id,
          applicant: app.applicant_id,
          status: app.status,
          notes: app.notes || undefined,
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ApplicationFormData) => applicationsService.update(appId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['application-detail', appId] })
      toast.success('Application updated')
      navigate(-1)
    },
    onError: (err) => {
      const msg = applyFieldErrors(err, setError, 'Failed to update application')
      if (msg) toast.error(msg)
    },
  })

  const onSubmit = (data: FormInput) => {
    updateMutation.mutate(data as ApplicationFormData)
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
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">Edit Application</h1>
                <p className="text-sm text-muted-foreground">
                  {app.applicant.first_name} {app.applicant.last_name} — {app.job.title}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)}>Cancel</Button>
              <Button
                className="w-full sm:w-auto"
                disabled={updateMutation.isPending}
                onClick={handleSubmit(onSubmit)}
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Changes'
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
