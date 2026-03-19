import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, MapPin, Users, Clock,
  Loader2, Eye, Pencil, Trash2, ArrowRight, Award,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SideDrawer } from '@/components/SideDrawer'
import { jobsService } from '@/services/jobs'
import type { JobListItem, JobFormData } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OPEN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CLOSED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const JOB_STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-gray-400',
  OPEN: 'bg-emerald-500',
  PAUSED: 'bg-amber-500',
  CLOSED: 'bg-red-500',
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

function JobCard({
  job,
  onView,
  onEdit,
  onDelete,
}: {
  job: JobListItem
  onView: (job: JobListItem) => void
  onEdit: (job: JobListItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      className="group hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onView(job)}
    >
      {/* Colored top bar */}
      <div className={cn('h-1', JOB_STATUS_DOT[job.status])} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                  JOB_STATUS_COLORS[job.status]
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', JOB_STATUS_DOT[job.status])} />
                {job.status}
              </span>
              <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                {job.job_type.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                {job.experience_level}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-blue-500"
              title="View"
              onClick={() => onView(job)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-amber-500"
              title="Edit"
              onClick={() => onEdit(job)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete"
              onClick={() => onDelete(job.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {job.department}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-[13px]">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-medium text-foreground">{job.application_count}</span>
            <span className="text-muted-foreground">applications</span>
          </span>
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(job.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function JobFormComp({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<JobForm>
  onSubmit: (data: JobForm) => void
  isLoading?: boolean
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
    <form id="job-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Job Title *</Label>
          <Input placeholder="e.g. Senior Python Developer" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
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
          <Label>Min Salary</Label>
          <Input placeholder="e.g. 80000" {...register('salary_min')} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Salary</Label>
          <Input placeholder="e.g. 120000" {...register('salary_max')} />
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
        <div className="space-y-1.5">
          <Label>Closes At</Label>
          <Input type="datetime-local" {...register('closes_at')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Description *</Label>
          <Textarea rows={4} placeholder="Job description..." {...register('description')} />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Requirements *</Label>
          <Textarea rows={3} placeholder="Required skills and experience..." {...register('requirements')} />
          {errors.requirements && <p className="text-xs text-destructive">{errors.requirements.message}</p>}
        </div>
      </div>
    </form>
  )
}

export default function JobsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [jobTypeFilter, setJobTypeFilter] = useState('')
  const [expLevelFilter, setExpLevelFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', search, statusFilter, jobTypeFilter, expLevelFilter, ordering],
    queryFn: () =>
      jobsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(jobTypeFilter && { job_type: jobTypeFilter }),
        ...(expLevelFilter && { experience_level: expLevelFilter }),
        ordering,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      toast.success('Job deleted')
    },
    onError: () => toast.error('Failed to delete job'),
  })

  const createMutation = useMutation({
    mutationFn: (data: JobFormData) => jobsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setCreateOpen(false)
      toast.success('Job created successfully')
    },
    onError: () => toast.error('Failed to create job'),
  })

  const handleView = (job: JobListItem) => {
    navigate(`/jobs/${job.id}`)
  }

  const handleEdit = (job: JobListItem) => {
    navigate(`/jobs/${job.id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Jobs</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total jobs</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={jobTypeFilter || 'ALL'}
          onValueChange={(v) => setJobTypeFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="INTERNSHIP">Internship</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={expLevelFilter || 'ALL'}
          onValueChange={(v) => setExpLevelFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-40">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All levels</SelectItem>
            <SelectItem value="ENTRY">Entry</SelectItem>
            <SelectItem value="MID">Mid</SelectItem>
            <SelectItem value="SENIOR">Senior</SelectItem>
            <SelectItem value="LEAD">Lead</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={ordering}
          onValueChange={setOrdering}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="-title">Title Z-A</SelectItem>
            <SelectItem value="-application_count">Most applications</SelectItem>
            <SelectItem value="application_count">Least applications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading jobs...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">Create your first job posting</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Job Drawer */}
      <SideDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Job"
        mode="create"
        size="xl"
        isLoading={createMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCreateOpen(false) },
          {
            label: 'Create Job',
            loading: createMutation.isPending,
            onClick: () => {
              document.getElementById('job-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              )
            },
          },
        ]}
        footerAlignment="right"
      >
        <JobFormComp
          onSubmit={(data) => createMutation.mutate(data as JobFormData)}
          isLoading={createMutation.isPending}
        />
      </SideDrawer>
    </div>
  )
}
