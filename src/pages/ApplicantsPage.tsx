import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, Mail, Phone, Briefcase, Eye, Pencil, Trash2, Star, Loader2, SendHorizonal } from 'lucide-react'
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
import { applicantsService } from '@/services/applicants'
import { applicationsService } from '@/services/applications'
import { jobsService } from '@/services/jobs'
import type { ApplicantListItem, ApplicantFormData } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'bg-gray-100 text-gray-700',
  WEBSITE: 'bg-blue-100 text-blue-700',
  LINKEDIN: 'bg-indigo-100 text-indigo-700',
  REFERRAL: 'bg-green-100 text-green-700',
  IMPORT: 'bg-purple-100 text-purple-700',
}

const APP_STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  AI_SCREENING: 'bg-amber-100 text-amber-700',
  AI_COMPLETED: 'bg-purple-100 text-purple-700',
  SHORTLISTED: 'bg-cyan-100 text-cyan-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEWED: 'bg-emerald-100 text-emerald-700',
  OFFER: 'bg-teal-100 text-teal-700',
  HIRED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDRAWN: 'bg-gray-100 text-gray-700',
}

const applicantSchema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  source: z.enum(['MANUAL', 'WEBSITE', 'LINKEDIN', 'REFERRAL', 'IMPORT']),
  current_role: z.string().optional(),
  current_company: z.string().optional(),
  experience_years: z.coerce.number().min(0).optional(),
  skills: z.string().optional(),
  linkedin_url: z.string().optional(),
  resume_url: z.string().optional(),
  notes: z.string().optional(),
})

type ApplicantFormInput = z.infer<typeof applicantSchema>

function ApplicantCard({
  applicant,
  onView,
  onEdit,
  onDelete,
}: {
  applicant: ApplicantListItem
  onView: (a: ApplicantListItem) => void
  onEdit: (a: ApplicantListItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className="hover:border-border/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-[13px] font-medium text-foreground">
                {getInitials(applicant.full_name)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{applicant.full_name}</p>
              <p className="text-[13px] text-muted-foreground">{applicant.current_role || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-blue-500"
              title="View"
              onClick={() => onView(applicant)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-500"
              title="Edit"
              onClick={() => onEdit(applicant)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Delete"
              onClick={() => onDelete(applicant.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{applicant.email}</span>
          </div>
          {applicant.phone && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{applicant.phone}</span>
            </div>
          )}
          {applicant.current_company && (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>{applicant.current_company}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {applicant.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-1.5 py-0.5 bg-muted rounded text-[11px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {applicant.skills.length > 3 && (
              <span className="px-1.5 py-0.5 bg-muted rounded text-[11px] text-muted-foreground">
                +{applicant.skills.length - 3}
              </span>
            )}
          </div>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium',
              SOURCE_COLORS[applicant.source] || 'bg-gray-100 text-gray-700'
            )}
          >
            {applicant.source}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicantFormComp({
  defaultValues,
  onSubmit,
}: {
  defaultValues?: Partial<ApplicantFormInput>
  onSubmit: (data: ApplicantFormInput) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicantFormInput>({
    resolver: zodResolver(applicantSchema),
    defaultValues: { source: 'MANUAL', ...defaultValues },
  })

  return (
    <form id="applicant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input placeholder="Alice" {...register('first_name')} />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Last Name *</Label>
          <Input placeholder="Johnson" {...register('last_name')} />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" placeholder="alice@example.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input placeholder="+1 415 555 0001" {...register('phone')} />
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Select value={watch('source')} onValueChange={(v) => setValue('source', v as ApplicantFormInput['source'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MANUAL">Manual</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
              <SelectItem value="IMPORT">Import</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Current Role</Label>
          <Input placeholder="Backend Engineer" {...register('current_role')} />
        </div>
        <div className="space-y-1.5">
          <Label>Current Company</Label>
          <Input placeholder="Acme Inc" {...register('current_company')} />
        </div>
        <div className="space-y-1.5">
          <Label>Experience (years)</Label>
          <Input type="number" min="0" {...register('experience_years')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Skills (comma-separated)</Label>
          <Input placeholder="Python, Django, PostgreSQL" {...register('skills')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>LinkedIn URL</Label>
          <Input placeholder="https://linkedin.com/in/alice" {...register('linkedin_url')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Resume URL</Label>
          <Input placeholder="https://cdn.example.com/resume.pdf" {...register('resume_url')} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Notes</Label>
          <Textarea rows={2} placeholder="Additional notes..." {...register('notes')} />
        </div>
      </div>
    </form>
  )
}

function ApplicantApplications({ applicantId }: { applicantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['applicant-applications', applicantId],
    queryFn: () => applicantsService.applications(applicantId),
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }

  const apps = data?.results || []

  if (apps.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-4">No applications yet</p>
    )
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div key={app.id} className="rounded-lg border p-3 text-[13px]">
          <div className="flex items-center justify-between">
            <p className="font-medium truncate">{app.job_title}</p>
            <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ml-2', APP_STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700')}>
              {app.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
            {app.score && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                {parseFloat(app.score).toFixed(1)}
              </span>
            )}
            <span>{formatDate(app.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ApplyForJob({ applicantId }: { applicantId: string }) {
  const qc = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState('')
  const [notes, setNotes] = useState('')

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-list-for-apply'],
    queryFn: () => jobsService.list({ status: 'OPEN', ordering: 'title' }),
  })

  const applyMutation = useMutation({
    mutationFn: () =>
      applicationsService.create({
        job: selectedJobId,
        applicant: applicantId,
        status: 'APPLIED',
        notes: notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicant-applications', applicantId] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      setSelectedJobId('')
      setNotes('')
      toast.success('Application submitted successfully')
    },
    onError: () => toast.error('Failed to submit application'),
  })

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <SendHorizonal className="h-3.5 w-3.5" />
        Apply for a Job
      </p>
      <div className="space-y-1.5">
        <Label className="text-[13px]">Select Job *</Label>
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an open job..." />
          </SelectTrigger>
          <SelectContent>
            {jobsData?.results?.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title} — {job.department} ({job.location})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[13px]">Notes</Label>
        <Textarea
          rows={2}
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button
        className="w-full"
        disabled={!selectedJobId || applyMutation.isPending}
        onClick={() => applyMutation.mutate()}
      >
        {applyMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <SendHorizonal className="h-4 w-4 mr-2" />
            Submit Application
          </>
        )}
      </Button>
    </div>
  )
}

export default function ApplicantsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewApplicantId, setViewApplicantId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editApplicantId, setEditApplicantId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', search, sourceFilter, ordering],
    queryFn: () =>
      applicantsService.list({
        ...(search && { search }),
        ...(sourceFilter && { source: sourceFilter }),
        ordering,
      }),
  })

  const { data: viewApplicant, isLoading: viewApplicantLoading } = useQuery({
    queryKey: ['applicant-detail', viewApplicantId],
    queryFn: () => applicantsService.get(viewApplicantId!),
    enabled: !!viewApplicantId,
  })

  const { data: editApplicant, isLoading: editApplicantLoading } = useQuery({
    queryKey: ['applicant-detail', editApplicantId],
    queryFn: () => applicantsService.get(editApplicantId!),
    enabled: !!editApplicantId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApplicantFormData }) => applicantsService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      qc.invalidateQueries({ queryKey: ['applicant-detail'] })
      setEditOpen(false)
      setEditApplicantId(null)
      toast.success('Applicant updated')
    },
    onError: () => toast.error('Failed to update applicant'),
  })

  const createMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      setCreateOpen(false)
      toast.success('Applicant created')
    },
    onError: () => toast.error('Failed to create applicant'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicantsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      setViewOpen(false)
      setViewApplicantId(null)
      toast.success('Applicant deleted')
    },
    onError: () => toast.error('Failed to delete applicant'),
  })

  const handleView = (applicant: ApplicantListItem) => {
    setViewApplicantId(applicant.id)
    setViewOpen(true)
  }

  const handleEdit = (applicant: ApplicantListItem) => {
    setEditApplicantId(applicant.id)
    setEditOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this applicant?')) {
      deleteMutation.mutate(id)
    }
  }

  const toPayload = (data: ApplicantFormInput): ApplicantFormData => ({
    ...data,
    phone: data.phone || '',
    skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
  })

  const handleCreate = (data: ApplicantFormInput) => {
    createMutation.mutate(toPayload(data))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Applicants</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total applicants</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Applicant
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={sourceFilter || 'ALL'}
          onValueChange={(v) => setSourceFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-40">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All sources</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
            <SelectItem value="WEBSITE">Website</SelectItem>
            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            <SelectItem value="REFERRAL">Referral</SelectItem>
            <SelectItem value="IMPORT">Import</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ordering} onValueChange={setOrdering}>
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
            <SelectItem value="full_name">Name A–Z</SelectItem>
            <SelectItem value="-full_name">Name Z–A</SelectItem>
            <SelectItem value="-experience_years">Most experienced</SelectItem>
            <SelectItem value="experience_years">Least experienced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading applicants...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No applicants found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create */}
      <SideDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Applicant"
        mode="create"
        size="lg"
        isLoading={createMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCreateOpen(false) },
          {
            label: 'Create Applicant',
            loading: createMutation.isPending,
            onClick: () =>
              document.getElementById('applicant-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              ),
          },
        ]}
        footerAlignment="right"
      >
        <ApplicantFormComp onSubmit={handleCreate} />
      </SideDrawer>

      {/* Edit */}
      <SideDrawer
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditApplicantId(null)
        }}
        title={editApplicant ? `Edit: ${editApplicant.full_name}` : 'Edit Applicant'}
        mode="edit"
        size="lg"
        isLoading={updateMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => { setEditOpen(false); setEditApplicantId(null) } },
          {
            label: 'Save Changes',
            loading: updateMutation.isPending,
            onClick: () =>
              document.getElementById('applicant-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              ),
          },
        ]}
        footerAlignment="right"
      >
        {editApplicantLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading applicant details...</p>
          </div>
        ) : editApplicant ? (
          <ApplicantFormComp
            key={editApplicant.id}
            defaultValues={{
              first_name: editApplicant.first_name,
              last_name: editApplicant.last_name,
              email: editApplicant.email,
              phone: editApplicant.phone || undefined,
              source: editApplicant.source,
              current_role: editApplicant.current_role || undefined,
              current_company: editApplicant.current_company || undefined,
              experience_years: editApplicant.experience_years,
              skills: editApplicant.skills.join(', '),
              linkedin_url: editApplicant.linkedin_url || undefined,
              resume_url: editApplicant.resume_url || undefined,
              notes: editApplicant.notes || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate({ id: editApplicant.id, data: toPayload(data) })}
          />
        ) : null}
      </SideDrawer>

      {/* View */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewApplicantId(null)
        }}
        title={viewApplicant?.full_name || 'Applicant'}
        mode="view"
        size="lg"
        footerButtons={
          viewApplicant
            ? [
                {
                  label: 'Edit',
                  variant: 'outline',
                  icon: Pencil,
                  onClick: () => {
                    setViewOpen(false)
                    handleEdit({ id: viewApplicant.id } as ApplicantListItem)
                  },
                },
                {
                  label: 'Delete',
                  variant: 'destructive',
                  icon: Trash2,
                  onClick: () => handleDelete(viewApplicant.id),
                },
              ]
            : []
        }
        footerAlignment="between"
      >
        {viewApplicantLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading applicant details...</p>
          </div>
        ) : viewApplicant ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <span className="text-lg font-semibold">{getInitials(viewApplicant.full_name)}</span>
              </div>
              <div>
                <p className="font-semibold">{viewApplicant.full_name}</p>
                <p className="text-sm text-muted-foreground">{viewApplicant.current_role || '—'}</p>
                <p className="text-sm text-muted-foreground">{viewApplicant.current_company || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                <p>{viewApplicant.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                <p>{viewApplicant.phone || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Source</p>
                <p>{viewApplicant.source}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Experience</p>
                <p>{viewApplicant.experience_years} yrs</p>
              </div>
            </div>
            {viewApplicant.skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {viewApplicant.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-muted rounded text-[13px]">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {viewApplicant.linkedin_url && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">LinkedIn</p>
                <a
                  href={viewApplicant.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  {viewApplicant.linkedin_url}
                </a>
              </div>
            )}
            {viewApplicant.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{viewApplicant.notes}</p>
              </div>
            )}

            {/* Apply for Job */}
            <ApplyForJob applicantId={viewApplicant.id} />

            {/* Applications Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Applications</p>
              <ApplicantApplications applicantId={viewApplicant.id} />
            </div>
          </div>
        ) : null}
      </SideDrawer>
    </div>
  )
}
