import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Mail, Phone, Briefcase, MapPin, Star, Loader2,
  Pencil, Trash2, SendHorizonal, ExternalLink, FileText,
  Calendar, Clock, Award, Tag, Link2, User,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { applicantsService } from '@/services/applicants'
import { applicationsService } from '@/services/applications'
import { jobsService } from '@/services/jobs'
import type { ApplicantFormData } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { extractApiError } from '@/lib/apiErrors'

const APP_STATUS_COLORS: Record<string, string> = {
  APPLIED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  AI_SCREENING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  AI_COMPLETED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHORTLISTED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  INTERVIEWED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  OFFER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  HIRED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  WITHDRAWN: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'bg-gray-100 text-gray-700 border-gray-200',
  WEBSITE: 'bg-blue-50 text-blue-700 border-blue-200',
  LINKEDIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  REFERRAL: 'bg-green-50 text-green-700 border-green-200',
  IMPORT: 'bg-purple-50 text-purple-700 border-purple-200',
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
  portfolio_url: z.string().optional(),
  notes: z.string().optional(),
})

type ApplicantFormInput = z.infer<typeof applicantSchema>

function ApplyForJob({ applicantId, existingApps }: { applicantId: string; existingApps: { job_id: string; created_at: string }[] }) {
  const qc = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState('')
  const [notes, setNotes] = useState('')

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-list-for-apply'],
    queryFn: () => jobsService.list({ status: 'OPEN', ordering: 'title' }),
  })

  // Check for duplicate within 30 days
  const getDuplicateWarning = (): string | null => {
    if (!selectedJobId || !existingApps) return null
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dup = existingApps.find(
      (app) => app.job_id === selectedJobId && new Date(app.created_at) > thirtyDaysAgo
    )
    if (dup) {
      return `Already applied for this position on ${new Date(dup.created_at).toLocaleDateString()}. Cannot reapply within 30 days.`
    }
    return null
  }
  const duplicateWarning = getDuplicateWarning()

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
    onError: (err) => toast.error(extractApiError(err, 'Failed to submit application')),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <SendHorizonal className="h-4 w-4 text-blue-500" />
          Apply for a Job
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        {duplicateWarning && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2.5 text-xs text-red-700 dark:text-red-300">
            {duplicateWarning}
          </div>
        )}
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
          disabled={!selectedJobId || applyMutation.isPending || !!duplicateWarning}
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
      </CardContent>
    </Card>
  )
}

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true')

  const { data: applicant, isLoading } = useQuery({
    queryKey: ['applicant-detail', id],
    queryFn: () => applicantsService.get(id!),
    enabled: !!id,
  })

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applicant-applications', id],
    queryFn: () => applicantsService.applications(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicant-detail', id] })
      qc.invalidateQueries({ queryKey: ['applicants'] })
      setEditing(false)
      toast.success('Applicant updated')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to update applicant')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => applicantsService.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant deleted')
      navigate(-1)
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete applicant')),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicantFormInput>({
    resolver: zodResolver(applicantSchema),
    values: applicant
      ? {
          first_name: applicant.first_name,
          last_name: applicant.last_name,
          email: applicant.email,
          phone: applicant.phone || undefined,
          source: applicant.source,
          current_role: applicant.current_role || undefined,
          current_company: applicant.current_company || undefined,
          experience_years: applicant.experience_years,
          skills: applicant.skills.join(', '),
          linkedin_url: applicant.linkedin_url || undefined,
          resume_url: applicant.resume_url || undefined,
          portfolio_url: applicant.portfolio_url || undefined,
          notes: applicant.notes || undefined,
        }
      : undefined,
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this applicant?')) {
      deleteMutation.mutate()
    }
  }

  const onSubmit = (data: ApplicantFormInput) => {
    updateMutation.mutate({
      ...data,
      phone: data.phone || '',
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading applicant...</p>
      </div>
    )
  }

  if (!applicant) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <User className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Applicant not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applicants
        </Button>
      </div>
    )
  }

  const apps = appsData?.results || []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-lg font-bold text-white">{getInitials(applicant.full_name)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-semibold">{applicant.full_name}</h1>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium border', SOURCE_COLORS[applicant.source])}>
                    {applicant.source}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {applicant.current_role && (
                    <span className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {applicant.current_role}
                    </span>
                  )}
                  {applicant.current_company && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {applicant.current_company}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {applicant.email}
                  </span>
                  {applicant.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {applicant.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Added {formatDate(applicant.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={handleSubmit(onSubmit)}
                  >
                    {updateMutation.isPending ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Body */}
      {editing ? (
        /* ── Edit Form ── */
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit Applicant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input {...register('first_name')} />
                  {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input {...register('last_name')} />
                  {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
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
                  <Label>Experience (years)</Label>
                  <Input type="number" min="0" {...register('experience_years')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Current Role</Label>
                  <Input {...register('current_role')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Current Company</Label>
                  <Input {...register('current_company')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Skills (comma-separated)</Label>
                  <Input placeholder="Python, Django, PostgreSQL" {...register('skills')} />
                </div>
                <div className="space-y-1.5">
                  <Label>LinkedIn URL</Label>
                  <Input {...register('linkedin_url')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Resume URL</Label>
                  <Input {...register('resume_url')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Portfolio URL</Label>
                  <Input {...register('portfolio_url')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea rows={3} {...register('notes')} />
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* ── View Mode ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column — details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Contact & Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Email</p>
                    <p className="font-medium">{applicant.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Phone</p>
                    <p className="font-medium">{applicant.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Source</p>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border', SOURCE_COLORS[applicant.source])}>
                      {applicant.source}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Current Role</p>
                    <p className="font-medium">{applicant.current_role || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Company</p>
                    <p className="font-medium">{applicant.current_company || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Experience</p>
                    <p className="font-medium">{applicant.experience_years ? `${applicant.experience_years} years` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">Added</p>
                    <p className="font-medium">{formatDate(applicant.created_at)}</p>
                  </div>
                  {applicant.updated_at && applicant.updated_at !== applicant.created_at && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">Last Updated</p>
                      <p className="font-medium">{formatDate(applicant.updated_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills & Tags */}
            {(applicant.skills.length > 0 || applicant.tags.length > 0) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-violet-500" />
                    Skills & Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {applicant.skills.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {applicant.skills.map((s) => (
                          <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md text-[12px] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {applicant.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {applicant.tags.map((t) => (
                          <span key={t} className="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-md text-[12px] font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {(applicant.linkedin_url || applicant.resume_url || applicant.portfolio_url) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-emerald-500" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {applicant.linkedin_url && (
                      <a
                        href={applicant.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        LinkedIn Profile
                      </a>
                    )}
                    {applicant.resume_url && (
                      <a
                        href={applicant.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Resume
                      </a>
                    )}
                    {applicant.portfolio_url && (
                      <a
                        href={applicant.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {applicant.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{applicant.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Applications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" />
                  Applications ({apps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : apps.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground text-center py-6">No applications yet</p>
                ) : (
                  <div className="space-y-2">
                    {apps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-lg border p-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <p className="font-medium text-sm truncate">{app.job_title}</p>
                          </div>
                          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ml-2', APP_STATUS_COLORS[app.status])}>
                            {app.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground">
                          {app.score && (
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              {parseFloat(app.score).toFixed(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(app.created_at)}
                          </span>
                          <button
                            className="flex items-center gap-1 text-primary hover:underline ml-auto"
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${app.job_id}`) }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — quick apply */}
          <div className="space-y-6">
            <ApplyForJob applicantId={applicant.id} existingApps={apps} />
          </div>
        </div>
      )}
    </div>
  )
}
