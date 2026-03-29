import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, Check, Loader2, UserPlus, Search, User,
  Briefcase, FileText, ChevronRight, Mail, Phone, Building,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { extractApiError, extractFieldErrors } from '@/lib/apiErrors'
import type { ApplicantFormData } from '@/types'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Candidate', icon: User },
  { label: 'Job', icon: Briefcase },
  { label: 'Review & Submit', icon: Check },
]

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
})

type ApplicantFormInput = z.infer<typeof applicantSchema>

interface WizardProps {
  /** Pre-select an existing applicant (from ApplicantDetailPage "apply for job" flow) */
  preSelectedApplicantId?: string
  preSelectedApplicantName?: string
  /** Pre-select a job */
  preSelectedJobId?: string
  /** Where to navigate on success */
  onSuccess?: (applicationId: string) => void
  /** Where to navigate on cancel */
  onCancel?: () => void
}

export default function ApplicationJobWizard({
  preSelectedApplicantId,
  preSelectedApplicantName,
  preSelectedJobId,
  onSuccess,
  onCancel,
}: WizardProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  // ── Wizard state ──
  const [step, setStep] = useState(preSelectedApplicantId ? 1 : 0)
  const [candidateMode, setCandidateMode] = useState<'existing' | 'new'>(
    preSelectedApplicantId ? 'existing' : 'existing'
  )

  // ── Step 1: Candidate ──
  const [selectedApplicantId, setSelectedApplicantId] = useState(preSelectedApplicantId || '')
  const [selectedApplicantName, setSelectedApplicantName] = useState(preSelectedApplicantName || '')
  const [applicantSearch, setApplicantSearch] = useState('')
  const [newApplicant, setNewApplicant] = useState<ApplicantFormInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'MANUAL',
    current_role: '',
    current_company: '',
    experience_years: 0,
    skills: '',
  })
  const [applicantErrors, setApplicantErrors] = useState<Record<string, string>>({})

  // ── Step 2: Job ──
  const [selectedJobId, setSelectedJobId] = useState(preSelectedJobId || '')
  const [selectedJobTitle, setSelectedJobTitle] = useState('')

  // ── Step 3: Review ──
  const [resumeUrl, setResumeUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({})

  // ── Queries ──
  const { data: applicantsData } = useQuery({
    queryKey: ['applicants-wizard', applicantSearch],
    queryFn: () => applicantsService.list({ search: applicantSearch, ordering: 'first_name' }),
    enabled: candidateMode === 'existing',
  })

  const { data: jobsData } = useQuery({
    queryKey: ['jobs-wizard'],
    queryFn: () => jobsService.list({ status: 'OPEN', ordering: 'title' }),
  })

  // Check existing applications for duplicate prevention
  const { data: existingApps } = useQuery({
    queryKey: ['applicant-apps-check', selectedApplicantId],
    queryFn: () => applicantsService.applications(selectedApplicantId),
    enabled: !!selectedApplicantId,
  })

  // ── Mutations ──
  const createApplicantMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      setSelectedApplicantId(result.id)
      setSelectedApplicantName(result.full_name)
      setCandidateMode('existing')
      setStep(1)
    },
    onError: (err) => {
      const fe = extractFieldErrors(err)
      if (Object.keys(fe).length > 0) {
        setApplicantErrors(fe)
        toast.error('Please fix the highlighted errors')
      } else {
        toast.error(extractApiError(err))
      }
    },
  })

  const createApplicationMutation = useMutation({
    mutationFn: (data: { job: string; applicant: string; status: string; notes?: string; resume_url?: string }) =>
      applicationsService.create(data as any),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Application submitted successfully!')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const appId = result?.id ?? (result as any)?.application_id ?? (result as any)?.pk
      if (onSuccess) {
        onSuccess(appId)
      } else {
        navigate(appId ? `/applications/${appId}` : '/applications')
      }
    },
    onError: (err) => {
      const fe = extractFieldErrors(err)
      if (Object.keys(fe).length > 0) {
        setSubmitErrors(fe)
        toast.error('Please fix the highlighted errors')
      } else {
        toast.error(extractApiError(err))
      }
    },
  })

  // ── Step validation & navigation ──
  const canGoNext = () => {
    if (step === 0) {
      if (candidateMode === 'existing') return !!selectedApplicantId
      return true // will validate on next
    }
    if (step === 1) return !!selectedJobId
    return true
  }

  const handleNext = () => {
    if (step === 0 && candidateMode === 'new') {
      // Validate new applicant form
      const result = applicantSchema.safeParse(newApplicant)
      if (!result.success) {
        const errs: Record<string, string> = {}
        result.error.errors.forEach((e) => {
          errs[e.path[0] as string] = e.message
        })
        setApplicantErrors(errs)
        return
      }
      setApplicantErrors({})
      // Create the applicant
      createApplicantMutation.mutate({
        ...result.data,
        phone: result.data.phone || '',
        skills: result.data.skills ? result.data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      })
      return
    }
    if (step < 2) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  // Check if applicant already applied for this job within 30 days
  const getDuplicateWarning = (): string | null => {
    if (!existingApps?.results || !selectedJobId) return null
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentDuplicate = existingApps.results.find(
      (app) => app.job_id === selectedJobId && new Date(app.created_at) > thirtyDaysAgo
    )
    if (recentDuplicate) {
      const appliedDate = new Date(recentDuplicate.created_at).toLocaleDateString()
      return `This candidate already applied for this position on ${appliedDate}. You cannot apply for the same position within 30 days.`
    }
    return null
  }

  const duplicateWarning = getDuplicateWarning()

  const handleSubmit = () => {
    if (duplicateWarning) {
      toast.error(duplicateWarning)
      return
    }
    createApplicationMutation.mutate({
      job: selectedJobId,
      applicant: selectedApplicantId,
      status: 'APPLIED',
      notes: notes || undefined,
      resume_url: resumeUrl || undefined,
    })
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate(-1)
    }
  }

  const applicants = applicantsData?.results || []
  const jobs = jobsData?.results || []

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const isActive = step === i
          const isDone = step > i
          return (
            <div key={s.label} className="flex items-center">
              {i > 0 && (
                <div className={cn('w-8 sm:w-12 h-0.5 mx-1', isDone ? 'bg-primary' : 'bg-border')} />
              )}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all',
                  isActive && 'bg-primary text-primary-foreground shadow-sm',
                  isDone && 'bg-primary/10 text-primary',
                  !isActive && !isDone && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          {/* ── Step 0: Candidate ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Select or Create Candidate</h2>
                <p className="text-sm text-muted-foreground">Choose an existing applicant or create a new one</p>
              </div>

              {/* Toggle */}
              <div className="flex rounded-lg border bg-muted/30 p-0.5 w-fit">
                <button
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all',
                    candidateMode === 'existing' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setCandidateMode('existing')}
                >
                  <Search className="h-3.5 w-3.5 inline mr-1.5" />
                  Select Existing
                </button>
                <button
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-all',
                    candidateMode === 'new' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setCandidateMode('new')}
                >
                  <UserPlus className="h-3.5 w-3.5 inline mr-1.5" />
                  Create New
                </button>
              </div>

              {candidateMode === 'existing' ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Search by name or email..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="max-w-md"
                  />
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5 border rounded-lg p-2">
                    {applicants.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No applicants found.{' '}
                        <button className="text-primary hover:underline" onClick={() => setCandidateMode('new')}>
                          Create one
                        </button>
                      </p>
                    ) : (
                      applicants.map((a) => (
                        <button
                          key={a.id}
                          className={cn(
                            'w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors',
                            selectedApplicantId === a.id
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-muted/50 border border-transparent'
                          )}
                          onClick={() => {
                            setSelectedApplicantId(a.id)
                            setSelectedApplicantName(a.full_name)
                          }}
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {a.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.full_name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                {a.email}
                              </span>
                              {a.current_role && (
                                <span className="flex items-center gap-1 truncate hidden sm:flex">
                                  <Building className="h-3 w-3 shrink-0" />
                                  {a.current_role}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedApplicantId === a.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* New applicant form */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>First Name *</Label>
                      <Input
                        placeholder="Alice"
                        value={newApplicant.first_name}
                        onChange={(e) => setNewApplicant({ ...newApplicant, first_name: e.target.value })}
                      />
                      {applicantErrors.first_name && <p className="text-xs text-destructive">{applicantErrors.first_name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Last Name *</Label>
                      <Input
                        placeholder="Johnson"
                        value={newApplicant.last_name}
                        onChange={(e) => setNewApplicant({ ...newApplicant, last_name: e.target.value })}
                      />
                      {applicantErrors.last_name && <p className="text-xs text-destructive">{applicantErrors.last_name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="alice@example.com"
                        value={newApplicant.email}
                        onChange={(e) => setNewApplicant({ ...newApplicant, email: e.target.value })}
                      />
                      {applicantErrors.email && <p className="text-xs text-destructive">{applicantErrors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 415 555 0001"
                        value={newApplicant.phone}
                        onChange={(e) => setNewApplicant({ ...newApplicant, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Source</Label>
                      <Select value={newApplicant.source} onValueChange={(v) => setNewApplicant({ ...newApplicant, source: v as any })}>
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
                      <Input
                        placeholder="Backend Engineer"
                        value={newApplicant.current_role}
                        onChange={(e) => setNewApplicant({ ...newApplicant, current_role: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Current Company</Label>
                      <Input
                        placeholder="Acme Inc"
                        value={newApplicant.current_company}
                        onChange={(e) => setNewApplicant({ ...newApplicant, current_company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Experience (years)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={newApplicant.experience_years || ''}
                        onChange={(e) => setNewApplicant({ ...newApplicant, experience_years: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Skills (comma-separated)</Label>
                      <Input
                        placeholder="Python, Django, PostgreSQL"
                        value={newApplicant.skills}
                        onChange={(e) => setNewApplicant({ ...newApplicant, skills: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Job ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Select a Job Position</h2>
                <p className="text-sm text-muted-foreground">
                  Applying as <span className="font-medium text-foreground">{selectedApplicantName}</span>
                </p>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-lg p-2">
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No open jobs available</p>
                ) : (
                  jobs.map((job) => (
                    <button
                      key={job.id}
                      className={cn(
                        'w-full text-left flex items-center gap-3 p-3 sm:p-4 rounded-lg transition-colors',
                        selectedJobId === job.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50 border border-transparent'
                      )}
                      onClick={() => {
                        setSelectedJobId(job.id)
                        setSelectedJobTitle(`${job.title} — ${job.department}`)
                      }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.department} · {job.location} · {job.job_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {selectedJobId === job.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Review & Submit ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold mb-1">Review & Submit</h2>
                <p className="text-sm text-muted-foreground">Confirm the details and optionally attach a resume</p>
              </div>

              {/* Duplicate warning */}
              {duplicateWarning && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                  <span className="text-red-500 shrink-0 mt-0.5 text-sm">!</span>
                  <p className="text-sm text-red-700 dark:text-red-300">{duplicateWarning}</p>
                </div>
              )}

              {/* Server errors */}
              {Object.keys(submitErrors).length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
                  {Object.entries(submitErrors).map(([field, msg]) => (
                    <p key={field} className="text-sm text-red-700 dark:text-red-300">
                      <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>: {msg}
                    </p>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Candidate</p>
                    <p className="text-sm font-medium">{selectedApplicantName}</p>
                    {submitErrors.applicant && <p className="text-xs text-destructive">{submitErrors.applicant}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Job Position</p>
                    <p className="text-sm font-medium">{selectedJobTitle}</p>
                    {submitErrors.job && <p className="text-xs text-destructive">{submitErrors.job}</p>}
                  </div>
                </div>
              </div>

              {/* Optional fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Resume URL
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="https://cdn.example.com/resume.pdf"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="Any additional notes about this application..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={step === 0 ? handleCancel : handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < 2 ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || createApplicantMutation.isPending}
          >
            {createApplicantMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating Applicant...</>
            ) : (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createApplicationMutation.isPending || !!duplicateWarning}
          >
            {createApplicationMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
            ) : (
              <><Check className="h-4 w-4 mr-2" />Submit Application</>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
