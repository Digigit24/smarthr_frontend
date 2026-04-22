import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { extractApiError, extractFieldErrors } from '@/lib/apiErrors'
import {
  ArrowLeft, Loader2, Save, Briefcase, MapPin, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { jobsService } from '@/services/jobs'
import type { JobFormData } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const jobSchema = z.object({
  title: z.string().min(1, 'Title required'),
  department: z.string().min(1, 'Department required'),
  location: z.string().min(1, 'Location required'),
  job_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  experience_level: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD']),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  description: z.string().min(1, 'Description required'),
  requirements: z.string().min(1, 'Requirements required'),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED']),
  closes_at: z.string().optional(),
})

type JobForm = z.infer<typeof jobSchema>

export default function JobEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: () => jobsService.get(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobFormData }) => jobsService.update(id, data),
    onMutate: () => ({ toastId: toast.loading('Saving job...') }),
    onSuccess: (_data, _vars, context) => {
      toast.success('Job updated successfully', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['job-detail'] })
      navigate(-1)
    },
    onError: (err, _vars, context) => {
      const fieldErrors = extractFieldErrors(err)
      setServerErrors(fieldErrors)
      const hasFieldErrors = Object.keys(fieldErrors).length > 0
      if (hasFieldErrors) {
        toast.error('Please fix the highlighted errors', { id: context?.toastId })
      } else {
        toast.error(extractApiError(err, 'Failed to update job'), { id: context?.toastId })
      }
    },
  })

  if (isLoading) {
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
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold">Edit Job</h1>
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', JOB_STATUS_COLORS[job.status])}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{job.department}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Created {formatDate(job.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <EditForm
        key={job.id}
        defaultValues={{
          title: job.title,
          department: job.department,
          location: job.location,
          job_type: job.job_type,
          experience_level: job.experience_level,
          salary_min: job.salary_min || undefined,
          salary_max: job.salary_max || undefined,
          description: job.description,
          requirements: job.requirements,
          status: job.status,
          closes_at: job.closes_at || undefined,
        }}
        onSubmit={(data) => { setServerErrors({}); updateMutation.mutate({ id: job.id, data: data as JobFormData }) }}
        isLoading={updateMutation.isPending}
        onCancel={() => navigate(-1)}
        serverErrors={serverErrors}
      />
    </div>
  )
}

function EditForm({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
  serverErrors = {},
}: {
  defaultValues: Partial<JobForm>
  onSubmit: (data: JobForm) => void
  isLoading?: boolean
  onCancel: () => void
  serverErrors?: Record<string, string>
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: 'DRAFT',
      job_type: 'FULL_TIME',
      experience_level: 'MID',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Job Title *</Label>
            <Input placeholder="e.g. Senior Python Developer" {...register('title')} className="max-w-lg" />
            {(errors.title || serverErrors.title) && <p className="text-xs text-destructive">{errors.title?.message || serverErrors.title}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Input placeholder="e.g. Engineering" {...register('department')} />
              {(errors.department || serverErrors.department) && <p className="text-xs text-destructive">{errors.department?.message || serverErrors.department}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Input placeholder="e.g. Remote" {...register('location')} />
              {(errors.location || serverErrors.location) && <p className="text-xs text-destructive">{errors.location?.message || serverErrors.location}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Job Type</Label>
              <Select value={watch('job_type')} onValueChange={(v) => setValue('job_type', v as JobForm['job_type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Experience Level</Label>
              <Select value={watch('experience_level')} onValueChange={(v) => setValue('experience_level', v as JobForm['experience_level'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRY">Entry</SelectItem>
                  <SelectItem value="MID">Mid</SelectItem>
                  <SelectItem value="SENIOR">Senior</SelectItem>
                  <SelectItem value="LEAD">Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch('status')} onValueChange={(v) => setValue('status', v as JobForm['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary & Closing */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Compensation & Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Min Salary</Label>
              <Input placeholder="e.g. 80000" {...register('salary_min')} />
              {serverErrors.salary_min && <p className="text-xs text-destructive">{serverErrors.salary_min}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Max Salary</Label>
              <Input placeholder="e.g. 120000" {...register('salary_max')} />
              {serverErrors.salary_max && <p className="text-xs text-destructive">{serverErrors.salary_max}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Closes At</Label>
              <Input type="datetime-local" {...register('closes_at')} />
              {serverErrors.closes_at && <p className="text-xs text-destructive">{serverErrors.closes_at}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description & Requirements */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Description & Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea rows={6} placeholder="Job description..." {...register('description')} />
            {(errors.description || serverErrors.description) && <p className="text-xs text-destructive">{errors.description?.message || serverErrors.description}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Requirements *</Label>
            <Textarea rows={4} placeholder="Required skills and experience..." {...register('requirements')} />
            {(errors.requirements || serverErrors.requirements) && <p className="text-xs text-destructive">{errors.requirements?.message || serverErrors.requirements}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pb-6">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save Changes</>
          )}
        </Button>
      </div>
    </form>
  )
}
