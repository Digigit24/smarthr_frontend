import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
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
import type { ApplicantFormData } from '@/types'

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicantFormInput>({
    resolver: zodResolver(applicantSchema),
    defaultValues: { source: 'MANUAL' },
  })

  const createMutation = useMutation({
    mutationFn: (data: ApplicantFormData) => applicantsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant created')
      navigate('/applicants')
    },
    onError: () => toast.error('Failed to create applicant'),
  })

  const onSubmit = (data: ApplicantFormInput) => {
    createMutation.mutate({
      ...data,
      phone: data.phone || '',
      skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/applicants')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Add New Applicant</h1>
                <p className="text-sm text-muted-foreground">Fill in the details to create a new applicant record</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/applicants')}>
                Cancel
              </Button>
              <Button
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
          </div>
        </CardContent>
      </Card>

      {/* Form */}
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
    </div>
  )
}
