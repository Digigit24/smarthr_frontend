import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, Mail, Phone, Briefcase, MoreHorizontal, Trash2 } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SideDrawer } from '@/components/SideDrawer'
import { applicantsService } from '@/services/applicants'
import type { ApplicantListItem, ApplicantDetail, ApplicantFormData } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'bg-gray-100 text-gray-700',
  WEBSITE: 'bg-blue-100 text-blue-700',
  LINKEDIN: 'bg-indigo-100 text-indigo-700',
  REFERRAL: 'bg-green-100 text-green-700',
  IMPORT: 'bg-purple-100 text-purple-700',
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


function ApplicantCard({
  applicant,
  onView,
  onDelete,
}: {
  applicant: ApplicantListItem
  onView: (a: ApplicantListItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      className="hover:border-border/80 transition-colors cursor-pointer"
      onClick={() => onView(applicant)}
    >
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(applicant) }}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(applicant.id) }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

function ApplicantForm({
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
      <div className="grid grid-cols-2 gap-3">
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
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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

export default function ApplicantsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewApplicant, setViewApplicant] = useState<ApplicantDetail | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['applicants', search],
    queryFn: () => applicantsService.list(search ? { search } : undefined),
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
      toast.success('Applicant deleted')
    },
    onError: () => toast.error('Failed to delete applicant'),
  })

  const handleView = async (applicant: ApplicantListItem) => {
    try {
      const detail = await applicantsService.get(applicant.id)
      setViewApplicant(detail)
      setViewOpen(true)
    } catch {
      toast.error('Failed to load applicant')
    }
  }

  const handleCreate = (data: ApplicantFormInput) => {
    const payload: ApplicantFormData = {
      ...data,
      phone: data.phone || '',
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }
    createMutation.mutate(payload)
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
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
              onDelete={deleteMutation.mutate}
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
        <ApplicantForm onSubmit={handleCreate} />
      </SideDrawer>

      {/* View */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={viewApplicant?.full_name || 'Applicant'}
        mode="view"
        size="lg"
      >
        {viewApplicant && (
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
            <div className="grid grid-cols-2 gap-3 text-sm">
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
          </div>
        )}
      </SideDrawer>
    </div>
  )
}

type ApplicantFormInput = z.infer<typeof applicantSchema>
