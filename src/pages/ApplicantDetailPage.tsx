import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, Mail, Phone, Briefcase, MapPin, Star, Loader2,
  Pencil, Trash2, SendHorizonal, ExternalLink, FileText,
  Calendar, Clock, Award, Tag, Link2, User, Plus, X, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/WhatsAppIcon'
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
import type { ApplicantFormData, ApplicantDetail } from '@/types'
import { formatDate, getInitials, cn, normalizePhone, phoneForWhatsApp } from '@/lib/utils'
import { extractApiError } from '@/lib/apiErrors'
import { RESUME_ACCEPT, formatBytes, validateResumeFile } from '@/lib/resume'

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
    queryFn: () => jobsService.list({ status: 'OPEN', ordering: 'title', page_size: '999' }),
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
    onMutate: () => ({ toastId: toast.loading('Submitting application...') }),
    onSuccess: (_data, _vars, context) => {
      toast.success('Application submitted successfully', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['applicant-detail', applicantId] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      setSelectedJobId('')
      setNotes('')
    },
    onError: (err, _vars, context) => {
      toast.error(extractApiError(err, 'Failed to submit application'), { id: context?.toastId })
    },
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
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([])
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [clearResume, setClearResume] = useState(false)

  const handleResumePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setResumeFile(null)
      return
    }
    const err = validateResumeFile(file)
    if (err) {
      toast.error(err)
      e.target.value = ''
      setResumeFile(null)
      return
    }
    setResumeFile(file)
    setClearResume(false)
  }

  const { data: applicant, isLoading } = useQuery({
    queryKey: ['applicant-detail', id],
    queryFn: () => applicantsService.get(id!),
    enabled: !!id,
  })


  const updateMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.update(id!, data),
    onMutate: async (data) => {
      const detailKey = ['applicant-detail', id]
      await qc.cancelQueries({ queryKey: detailKey })
      const previous = qc.getQueryData<ApplicantDetail>(detailKey)
      qc.setQueryData<ApplicantDetail>(detailKey, (old) => {
        if (!old) return old
        // resume_file (File) and clear_resume_file (flag) are transport-only;
        // never write them into the cache. The real resume_file URL gets
        // populated by the server response in onSettled's invalidate.
        const { resume_file: _rf, clear_resume_file: _crf, ...textData } = data
        return {
          ...old,
          ...textData,
          skills: textData.skills ?? old.skills,
          tags: textData.tags ?? old.tags,
          experience_years: textData.experience_years ?? old.experience_years,
          current_company: textData.current_company ?? old.current_company,
          current_role: textData.current_role ?? old.current_role,
          resume_url: textData.resume_url ?? old.resume_url,
          linkedin_url: textData.linkedin_url ?? old.linkedin_url,
          portfolio_url: textData.portfolio_url ?? old.portfolio_url,
          notes: textData.notes ?? old.notes,
          phone: textData.phone ?? old.phone,
          custom_fields: textData.custom_fields ?? old.custom_fields,
          full_name: `${textData.first_name} ${textData.last_name}`.trim(),
          // If the user is clearing the resume, optimistically drop it.
          ...(data.clear_resume_file && { resume_file: null, resume_download_url: null }),
        }
      })
      return { previous }
    },
    onSuccess: () => {
      setEditing(false)
      toast.success('Applicant updated')
    },
    onError: (err, _data, context) => {
      if (context?.previous) qc.setQueryData(['applicant-detail', id], context.previous)
      toast.error(extractApiError(err, 'Failed to update applicant'))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['applicant-detail', id] })
      qc.invalidateQueries({ queryKey: ['applicants'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => applicantsService.delete(id!),
    onMutate: () => ({ toastId: toast.loading('Deleting applicant...') }),
    onSuccess: (_data, _vars, context) => {
      toast.success('Applicant deleted', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['applicants'] })
      navigate(-1)
    },
    onError: (err, _vars, context) => {
      toast.error(extractApiError(err, 'Failed to delete applicant'), { id: context?.toastId })
    },
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
    const cfObj: Record<string, string> = {}
    for (const { key, value } of customFields) {
      if (key.trim()) cfObj[key.trim()] = value
    }
    updateMutation.mutate({
      ...data,
      phone: normalizePhone(data.phone),
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      custom_fields: cfObj,
      ...(resumeFile && { resume_file: resumeFile }),
      ...(clearResume && !resumeFile && { clear_resume_file: true }),
    })
    // Reset transient picker state once we've handed off to the mutation.
    setResumeFile(null)
    setClearResume(false)
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

  const apps = applicant?.applications || []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Button variant="ghost" size="icon" className="mt-1 shrink-0" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                <span className="text-sm sm:text-lg font-bold text-white">{getInitials(applicant.full_name)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold">{applicant.full_name}</h1>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium border', SOURCE_COLORS[applicant.source])}>
                    {applicant.source}
                  </span>
                </div>
                <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
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
                      {normalizePhone(applicant.phone)}
                      <a
                        href={`https://wa.me/${phoneForWhatsApp(applicant.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="inline-flex items-center justify-center text-green-600 hover:text-green-700 transition-colors ml-1"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Added {formatDate(applicant.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
              {!editing ? (
                <>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
                    setCustomFields(
                      applicant.custom_fields
                        ? Object.entries(applicant.custom_fields).map(([k, v]) => ({ key: k, value: String(v ?? '') }))
                        : []
                    )
                    setEditing(true)
                  }}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={handleDelete}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
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
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+91</span>
                    <Input className="rounded-l-none" placeholder="8767514691" {...register('phone')} />
                  </div>
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
                  <p className="text-[11px] text-muted-foreground">External link if the resume lives elsewhere.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Resume File</Label>
                  {resumeFile ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={resumeFile.name}>{resumeFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatBytes(resumeFile.size)} · uploads on save</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setResumeFile(null)}
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : applicant.resume_file && !clearResume ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-muted-foreground">A resume is on file.</span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px]"
                          onClick={() => document.getElementById('resume-file-input')?.click()}
                        >
                          Replace
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-destructive hover:text-destructive"
                          onClick={() => { setClearResume(true); setResumeFile(null) }}
                        >
                          Remove
                        </Button>
                      </div>
                      <input
                        id="resume-file-input"
                        type="file"
                        accept={RESUME_ACCEPT}
                        className="hidden"
                        onChange={handleResumePick}
                      />
                    </div>
                  ) : (
                    <>
                      <Input
                        type="file"
                        accept={RESUME_ACCEPT}
                        onChange={handleResumePick}
                        className="cursor-pointer file:cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/80"
                      />
                      {clearResume && (
                        <p className="text-[11px] text-orange-600 dark:text-orange-400">
                          Existing resume will be removed on save.{' '}
                          <button
                            type="button"
                            className="underline font-medium"
                            onClick={() => setClearResume(false)}
                          >
                            Undo
                          </button>
                        </p>
                      )}
                    </>
                  )}
                  <p className="text-[11px] text-muted-foreground">PDF / DOC / DOCX / TXT up to 10 MB.</p>
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

              {/* Custom Fields */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Custom Fields</Label>
                  <span className="text-[10px] text-muted-foreground">{customFields.length}/20</span>
                </div>
                {customFields.map((cf, idx) => (
                  <div key={`cf-${idx}-${cf.key}`} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                    <Input
                      className="h-9 text-xs flex-1"
                      placeholder="Field name"
                      maxLength={100}
                      value={cf.key}
                      onChange={(e) => {
                        const next = [...customFields]
                        next[idx] = { ...next[idx], key: e.target.value }
                        setCustomFields(next)
                      }}
                    />
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                      <Input
                        className="h-9 text-xs flex-1"
                        placeholder="Value"
                        maxLength={1000}
                        value={cf.value}
                        onChange={(e) => {
                          const next = [...customFields]
                          next[idx] = { ...next[idx], value: e.target.value }
                          setCustomFields(next)
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {customFields.length < 20 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setCustomFields([...customFields, { key: '', value: '' }])}
                  >
                    <Plus className="h-3 w-3" />
                    Add Custom Field
                  </Button>
                )}
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
                    <p className="font-medium flex items-center gap-1.5">
                      {normalizePhone(applicant.phone) || '—'}
                      {applicant.phone && (
                        <a
                          href={`https://wa.me/${phoneForWhatsApp(applicant.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Chat on WhatsApp"
                          className="inline-flex items-center justify-center text-green-600 hover:text-green-700 transition-colors"
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                        </a>
                      )}
                    </p>
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
            {(applicant.linkedin_url ||
              applicant.resume_url ||
              applicant.portfolio_url ||
              applicant.resume_file) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-emerald-500" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Uploaded resume file gets the prominent Download button */}
                    {applicant.resume_file && (
                      <Button
                        asChild
                        size="sm"
                        className="w-full justify-start h-9"
                      >
                        <a
                          href={applicant.resume_download_url ?? applicant.resume_file}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3.5 w-3.5 mr-2" />
                          Download Resume
                        </a>
                      </Button>
                    )}
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
                        {applicant.resume_file ? 'External resume link' : 'Resume'}
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

            {/* Custom Fields */}
            {applicant.custom_fields && Object.keys(applicant.custom_fields).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {Object.entries(applicant.custom_fields).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </p>
                        <p className="font-medium">{value != null ? String(value) : '—'}</p>
                      </div>
                    ))}
                  </div>
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
                {isLoading ? (
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
