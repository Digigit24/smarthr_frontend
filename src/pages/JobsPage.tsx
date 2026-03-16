import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Briefcase, MapPin, Users, Clock,
  Bot, ListChecks, ChevronRight, Loader2,
  Eye, Pencil, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SideDrawer } from '@/components/SideDrawer'
import { jobsService } from '@/services/jobs'
import { callQueuesService } from '@/services/callQueues'
import type { JobListItem, JobDetail, JobFormData } from '@/types'
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
    <Card className="hover:border-border/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium',
                  JOB_STATUS_COLORS[job.status]
                )}
              >
                {job.status}
              </span>
              <span className="text-[11px] text-muted-foreground">{job.job_type.replace('_', ' ')}</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
              title="View"
              onClick={() => onView(job)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-500"
              title="Edit"
              onClick={() => onEdit(job)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete"
              onClick={() => onDelete(job.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
          <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {job.application_count} applications
          </span>
          <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
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

function VoiceConfigDialog({
  job,
  open,
  onOpenChange,
  onSuccess,
}: {
  job: JobDetail
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [selectedAgentId, setSelectedAgentId] = useState(job.voice_agent_id || '')
  const [shortlistThreshold, setShortlistThreshold] = useState(
    String(job.voice_agent_config?.auto_shortlist_threshold ?? 7.0)
  )
  const [rejectThreshold, setRejectThreshold] = useState(
    String(job.voice_agent_config?.auto_reject_threshold ?? 4.0)
  )

  const { data: agentsData } = useQuery({
    queryKey: ['voice-agents'],
    queryFn: () => callQueuesService.voiceAgents(),
    enabled: open,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      jobsService.updateVoiceConfig(job.id, {
        voice_agent_id: selectedAgentId || undefined,
        voice_agent_config: {
          auto_shortlist_threshold: parseFloat(shortlistThreshold),
          auto_reject_threshold: parseFloat(rejectThreshold),
        },
      }),
    onSuccess: () => {
      toast.success('Voice config saved')
      onSuccess()
      onOpenChange(false)
    },
    onError: () => toast.error('Failed to save voice config'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Voice Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Voice Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent..." />
              </SelectTrigger>
              <SelectContent>
                {agentsData?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Auto Shortlist Threshold</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={shortlistThreshold}
                onChange={(e) => setShortlistThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Score ≥ this → shortlisted</p>
            </div>
            <div className="space-y-1.5">
              <Label>Auto Reject Threshold</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rejectThreshold}
                onChange={(e) => setRejectThreshold(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Score ≤ this → rejected</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [viewJobId, setViewJobId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editJobId, setEditJobId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [voiceConfigOpen, setVoiceConfigOpen] = useState(false)

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

  const { data: viewJob, isLoading: viewJobLoading } = useQuery({
    queryKey: ['job-detail', viewJobId],
    queryFn: () => jobsService.get(viewJobId!),
    enabled: !!viewJobId,
  })

  const { data: agentData } = useQuery({
    queryKey: ['voice-agent', viewJob?.voice_agent_id],
    queryFn: () => callQueuesService.voiceAgent(viewJob!.voice_agent_id!),
    enabled: !!viewJob?.voice_agent_id,
  })

  const { data: editJob, isLoading: editJobLoading } = useQuery({
    queryKey: ['job-detail', editJobId],
    queryFn: () => jobsService.get(editJobId!),
    enabled: !!editJobId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobFormData }) => jobsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['job-detail'] })
      setEditOpen(false)
      setEditJobId(null)
      toast.success('Job updated successfully')
    },
    onError: () => toast.error('Failed to update job'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => jobsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      setViewOpen(false)
      setViewJobId(null)
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
    setViewJobId(job.id)
    setViewOpen(true)
  }

  const handleEdit = (job: JobListItem) => {
    setEditJobId(job.id)
    setEditOpen(true)
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
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="-title">Title Z–A</SelectItem>
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

      {/* Edit Job Drawer */}
      <SideDrawer
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditJobId(null)
        }}
        title={editJob?.title ? `Edit: ${editJob.title}` : 'Edit Job'}
        mode="edit"
        size="xl"
        isLoading={updateMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => { setEditOpen(false); setEditJobId(null) } },
          {
            label: 'Save Changes',
            loading: updateMutation.isPending,
            onClick: () => {
              document.getElementById('job-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              )
            },
          },
        ]}
        footerAlignment="right"
      >
        {editJobLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading job details...</p>
          </div>
        ) : editJob ? (
          <JobFormComp
            key={editJob.id}
            defaultValues={{
              title: editJob.title,
              department: editJob.department,
              location: editJob.location,
              job_type: editJob.job_type,
              experience_level: editJob.experience_level,
              salary_min: editJob.salary_min || undefined,
              salary_max: editJob.salary_max || undefined,
              description: editJob.description,
              requirements: editJob.requirements,
              status: editJob.status,
              closes_at: editJob.closes_at || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate({ id: editJob.id, data: data as JobFormData })}
            isLoading={updateMutation.isPending}
          />
        ) : null}
      </SideDrawer>

      {/* View Job Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewJobId(null)
        }}
        title={viewJob?.title || 'Job Details'}
        mode="view"
        size="xl"
        footerButtons={
          viewJob
            ? [
                {
                  label: 'Edit',
                  variant: 'outline',
                  icon: Pencil,
                  onClick: () => {
                    setViewOpen(false)
                    handleEdit({ id: viewJob.id } as JobListItem)
                  },
                },
                {
                  label: 'Delete',
                  variant: 'destructive',
                  icon: Trash2,
                  onClick: () => handleDelete(viewJob.id),
                },
              ]
            : []
        }
        footerAlignment="between"
      >
        {viewJobLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading job details...</p>
          </div>
        ) : viewJob ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', JOB_STATUS_COLORS[viewJob.status])}>
                {viewJob.status}
              </span>
              <Badge variant="secondary">{viewJob.job_type.replace('_', ' ')}</Badge>
              <Badge variant="secondary">{viewJob.experience_level}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                <p className="font-medium">{viewJob.department}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Location</p>
                <p className="font-medium">{viewJob.location}</p>
              </div>
              {viewJob.salary_min && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Salary Range</p>
                  <p className="font-medium">${viewJob.salary_min} – ${viewJob.salary_max}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Applications</p>
                <button
                  className="font-medium text-blue-500 hover:underline flex items-center gap-1"
                  onClick={() => { setViewOpen(false); navigate(`/applications?job_id=${viewJob.id}`) }}
                >
                  {viewJob.application_count} applications
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {viewJob.published_at && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Published</p>
                  <p className="font-medium">{formatDate(viewJob.published_at)}</p>
                </div>
              )}
              {viewJob.closes_at && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Closes</p>
                  <p className="font-medium">{formatDate(viewJob.closes_at)}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Created</p>
                <p className="font-medium">{formatDate(viewJob.created_at)}</p>
              </div>
              {viewJob.updated_at && viewJob.updated_at !== viewJob.created_at && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Last Updated</p>
                  <p className="font-medium">{formatDate(viewJob.updated_at)}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm whitespace-pre-wrap">{viewJob.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Requirements</p>
              <p className="text-sm whitespace-pre-wrap">{viewJob.requirements}</p>
            </div>

            {/* Voice Config Section */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  Voice Configuration
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVoiceConfigOpen(true)}
                >
                  Configure
                </Button>
              </div>
              {viewJob.voice_agent_id ? (
                <div className="text-sm space-y-1">
                  <div>
                    <span className="text-muted-foreground text-xs">Agent: </span>
                    <span className="font-medium">{agentData?.name || viewJob.voice_agent_id}</span>
                  </div>
                  {viewJob.voice_agent_config?.auto_shortlist_threshold != null && (
                    <div className="text-[13px] text-muted-foreground">
                      Shortlist ≥ {viewJob.voice_agent_config.auto_shortlist_threshold} /
                      Reject ≤ {viewJob.voice_agent_config.auto_reject_threshold}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">No voice agent configured</p>
              )}
            </div>

            {/* Create Queue Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setViewOpen(false)
                // Navigate to call queues with pre-fill
                navigate(`/call-queues?job_id=${viewJob.id}&voice_agent_id=${viewJob.voice_agent_id || ''}`)
              }}
            >
              <ListChecks className="h-4 w-4" />
              Create AI Call Queue for this Job
            </Button>
          </div>
        ) : null}
      </SideDrawer>

      {/* Voice Config Dialog */}
      {viewJob && (
        <VoiceConfigDialog
          job={viewJob}
          open={voiceConfigOpen}
          onOpenChange={setVoiceConfigOpen}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['job-detail', viewJobId] })}
        />
      )}
    </div>
  )
}
