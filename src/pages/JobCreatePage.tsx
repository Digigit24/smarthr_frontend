import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { applyFieldErrors } from '@/lib/apiErrors'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
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

export default function JobCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: 'DRAFT',
      job_type: 'FULL_TIME',
      experience_level: 'MID',
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: JobFormData) => jobsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job created successfully')
      navigate('/jobs')
    },
    onError: (err) => {
      const msg = applyFieldErrors(err, setError, 'Failed to create job')
      if (msg) toast.error(msg)
    },
  })

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Create New Job</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to create a new job posting</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => createMutation.mutate(data as JobFormData))} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input placeholder="e.g. Senior Python Developer" {...register('title')} className="max-w-lg" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Input placeholder="e.g. Engineering" {...register('department')} />
                {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Location *</Label>
                <Input placeholder="e.g. Remote" {...register('location')} />
                {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
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
              </div>
              <div className="space-y-1.5">
                <Label>Max Salary</Label>
                <Input placeholder="e.g. 120000" {...register('salary_max')} />
              </div>
              <div className="space-y-1.5">
                <Label>Closes At</Label>
                <Input type="datetime-local" {...register('closes_at')} />
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
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Requirements *</Label>
              <Textarea rows={4} placeholder="Required skills and experience..." {...register('requirements')} />
              {errors.requirements && <p className="text-xs text-destructive">{errors.requirements.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pb-6">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/jobs')} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" />Create Job</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
