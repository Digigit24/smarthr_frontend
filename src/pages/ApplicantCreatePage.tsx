import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, UserPlus, Briefcase, FileText, X as XIcon } from 'lucide-react'
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
import { applyFieldErrors } from '@/lib/apiErrors'
import ApplicationJobWizard from '@/components/ApplicationJobWizard'
import type { ApplicantFormData } from '@/types'
import { cn, normalizePhone } from '@/lib/utils'
import { RESUME_ACCEPT, formatBytes, validateResumeFile } from '@/lib/resume'

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

export default function ApplicantCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mode, setMode] = useState<'applicant-only' | 'applicant-and-apply'>('applicant-and-apply')
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ApplicantFormInput>({
    resolver: zodResolver(applicantSchema),
    defaultValues: { source: 'MANUAL' },
  })

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
  }

  const createMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.create(data),
    onMutate: () => ({ toastId: toast.loading('Creating applicant...') }),
    onSuccess: (result, _vars, context) => {
      toast.success('Applicant created', { id: context?.toastId })
      qc.invalidateQueries({ queryKey: ['applicants'] })
      navigate(`/applicants/${result.id}`)
    },
    onError: (err, _vars, context) => {
      const msg = applyFieldErrors(err, setError, 'Failed to create applicant')
      if (msg) toast.error(msg, { id: context?.toastId })
      else toast.dismiss(context?.toastId)
    },
  })

  const onSubmit = (data: ApplicantFormInput) => {
    createMutation.mutate({
      ...data,
      phone: normalizePhone(data.phone),
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      ...(resumeFile && { resume_file: resumeFile }),
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/applicants')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">Add New Applicant</h1>
                <p className="text-sm text-muted-foreground">Create a new applicant record</p>
              </div>
            </div>
            {/* Mode toggle */}
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {/* <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all',
                  mode === 'applicant-only' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setMode('applicant-only')}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Applicant Only</span>
              </button> */}
              <button
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all',
                  mode === 'applicant-and-apply' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setMode('applicant-and-apply')}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create & Apply for Job</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {mode === 'applicant-and-apply' ? (
        <ApplicationJobWizard
          onCancel={() => navigate('/applicants')}
          onSuccess={(id) => navigate(id && id !== 'undefined' ? `/applications/${id}` : '/applications')}
        />
      ) : (
        <>
          {/* Standard applicant form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="alice@example.com" {...register('email')} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Current Role</Label>
                    <Input placeholder="Backend Engineer" {...register('current_role')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Current Company</Label>
                    <Input placeholder="Acme Inc" {...register('current_company')} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Experience (years)</Label>
                  <Input type="number" min="0" placeholder="3" {...register('experience_years')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Skills (comma-separated)</Label>
                  <Input placeholder="Python, Django, PostgreSQL" {...register('skills')} />
                </div>
                <div className="space-y-1.5">
                  <Label>LinkedIn URL</Label>
                  <Input placeholder="https://linkedin.com/in/alice" {...register('linkedin_url')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Resume URL</Label>
                  <Input placeholder="https://cdn.example.com/resume.pdf" {...register('resume_url')} />
                  <p className="text-[11px] text-muted-foreground">External link if the resume lives elsewhere.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Resume File</Label>
                  {resumeFile ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" title={resumeFile.name}>{resumeFile.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatBytes(resumeFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setResumeFile(null)}
                        title="Remove"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Input
                      type="file"
                      accept={RESUME_ACCEPT}
                      onChange={handleResumePick}
                      className="cursor-pointer file:cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/80"
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Optional. PDF / DOC / DOCX / TXT up to 10 MB.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Portfolio URL</Label>
                  <Input placeholder="https://alice.dev" {...register('portfolio_url')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea rows={3} placeholder="Additional notes about this applicant..." {...register('notes')} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/applicants')}>Cancel</Button>
            <Button
              className="w-full sm:w-auto"
              disabled={createMutation.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Create Applicant</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
