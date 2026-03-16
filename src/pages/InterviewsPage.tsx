import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Calendar, CheckCircle, XCircle, Loader2, Eye, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { SideDrawer } from '@/components/SideDrawer'
import { interviewsService } from '@/services/interviews'
import type { InterviewListItem, InterviewFormData, InterviewType } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const IV_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-cyan-100 text-cyan-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
}

const formSchema = z.object({
  application: z.string().min(1, 'Application ID required'),
  interview_type: z.enum(['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL']),
  scheduled_at: z.string().min(1, 'Schedule time required'),
  duration_minutes: z.coerce.number().min(15).max(480),
  interviewer_name: z.string().min(1, 'Interviewer name required'),
  interviewer_email: z.string().email('Valid email required'),
  meeting_link: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const completeSchema = z.object({
  feedback: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
})

type CompleteData = z.infer<typeof completeSchema>

export default function InterviewsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewInterviewId, setViewInterviewId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', search, statusFilter, typeFilter],
    queryFn: () =>
      interviewsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { interview_type: typeFilter }),
        ordering: 'scheduled_at',
      }),
  })

  const { data: viewInterview, isLoading: viewInterviewLoading } = useQuery({
    queryKey: ['interview-detail', viewInterviewId],
    queryFn: () => interviewsService.get(viewInterviewId!),
    enabled: !!viewInterviewId,
  })

  const createMutation = useMutation({
    mutationFn: (data: InterviewFormData) => interviewsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      setCreateOpen(false)
      toast.success('Interview scheduled')
    },
    onError: () => toast.error('Failed to schedule interview'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => interviewsService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      setViewOpen(false)
      toast.success('Interview cancelled')
    },
    onError: () => toast.error('Failed to cancel interview'),
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, feedback, rating }: { id: string; feedback: string; rating?: number }) =>
      interviewsService.complete(id, feedback, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      setCompleteOpen(false)
      setViewOpen(false)
      toast.success('Interview completed')
    },
    onError: () => toast.error('Failed to complete interview'),
  })

  const [editInterviewId, setEditInterviewId] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    interviewer_name: '',
    interviewer_email: '',
    meeting_link: '',
    scheduled_at: '',
    duration_minutes: 60,
  })

  const { data: editInterview } = useQuery({
    queryKey: ['interview-detail', editInterviewId],
    queryFn: () => interviewsService.get(editInterviewId!),
    enabled: !!editInterviewId,
  })

  useEffect(() => {
    if (editInterview) {
      setEditForm({
        interviewer_name: editInterview.interviewer_name || '',
        interviewer_email: editInterview.interviewer_email || '',
        meeting_link: editInterview.meeting_link || '',
        scheduled_at: editInterview.scheduled_at ? editInterview.scheduled_at.slice(0, 16) : '',
        duration_minutes: editInterview.duration_minutes || 60,
      })
    }
  }, [editInterview])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewFormData> }) =>
      interviewsService.patch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      qc.invalidateQueries({ queryKey: ['interview-detail'] })
      setEditOpen(false)
      setEditInterviewId(null)
      toast.success('Interview updated')
    },
    onError: () => toast.error('Failed to update interview'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      setViewOpen(false)
      setViewInterviewId(null)
      toast.success('Interview deleted')
    },
    onError: () => toast.error('Failed to delete interview'),
  })

  const {
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    setValue: createSetValue,
    watch: createWatch,
    formState: { errors: createErrors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { interview_type: 'TECHNICAL', duration_minutes: 60 },
  })

  const {
    register: completeRegister,
    handleSubmit: handleCompleteSubmit,
  } = useForm<CompleteData>({ resolver: zodResolver(completeSchema) })

  const handleView = (iv: InterviewListItem) => {
    setViewInterviewId(iv.id)
    setViewOpen(true)
  }

  const handleEditClick = (iv: InterviewListItem) => {
    setEditInterviewId(iv.id)
    setEditOpen(true)
  }

  const handleDeleteClick = (iv: InterviewListItem) => {
    if (window.confirm('Delete this interview? This cannot be undone.')) {
      deleteMutation.mutate(iv.id)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Interviews</h1>
          <p className="text-xs text-muted-foreground">{data?.count ?? 0} total</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search interviewer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter || 'ALL'}
          onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL'].map((t) => (
              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading interviews...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No interviews scheduled</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.results.map((iv) => (
            <Card key={iv.id} className="hover:border-border/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{iv.interview_type.replace(/_/g, ' ')}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{formatDateTime(iv.scheduled_at)}</p>
                    <p className="text-[13px] text-muted-foreground">{iv.interviewer_name}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0', IV_STATUS_COLORS[iv.status])}>
                    {iv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[12px] text-muted-foreground">{iv.duration_minutes}min · {iv.meeting_link ? '🔗 Link' : 'No link'}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleView(iv)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(iv)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDeleteClick(iv)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Interview Drawer */}
      <SideDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Schedule Interview"
        mode="create"
        size="lg"
        isLoading={createMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCreateOpen(false) },
          {
            label: 'Schedule',
            loading: createMutation.isPending,
            onClick: () =>
              document.getElementById('interview-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              ),
          },
        ]}
        footerAlignment="right"
      >
        <form
          id="interview-form"
          onSubmit={handleCreateSubmit((data) => createMutation.mutate(data as InterviewFormData))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Application ID *</Label>
            <Input placeholder="application-uuid" {...createRegister('application')} />
            {createErrors.application && <p className="text-xs text-destructive">{createErrors.application.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={createWatch('interview_type')} onValueChange={(v) => createSetValue('interview_type', v as InterviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL'].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" min="15" {...createRegister('duration_minutes')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled At *</Label>
            <Input type="datetime-local" {...createRegister('scheduled_at')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Interviewer Name *</Label>
              <Input placeholder="John Doe" {...createRegister('interviewer_name')} />
            </div>
            <div className="space-y-1.5">
              <Label>Interviewer Email *</Label>
              <Input type="email" placeholder="john@company.com" {...createRegister('interviewer_email')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meeting Link</Label>
            <Input placeholder="https://meet.google.com/..." {...createRegister('meeting_link')} />
          </div>
        </form>
      </SideDrawer>

      {/* View Interview Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewInterviewId(null)
        }}
        title="Interview Details"
        mode="view"
        size="lg"
        footerButtons={
          viewInterview
            ? [
                {
                  label: 'Edit',
                  variant: 'outline' as const,
                  icon: Pencil,
                  onClick: () => {
                    setViewOpen(false)
                    setEditInterviewId(viewInterview.id)
                    setEditOpen(true)
                  },
                },
                {
                  label: 'Delete',
                  variant: 'destructive' as const,
                  icon: Trash2,
                  onClick: () => {
                    if (window.confirm('Delete this interview? This cannot be undone.')) {
                      deleteMutation.mutate(viewInterview.id)
                    }
                  },
                },
                ...(viewInterview.status !== 'CANCELLED' && viewInterview.status !== 'COMPLETED'
                  ? [
                      {
                        label: 'Cancel Interview',
                        variant: 'outline' as const,
                        icon: XCircle,
                        onClick: () => cancelMutation.mutate(viewInterview.id),
                      },
                    ]
                  : []),
                ...(viewInterview.status === 'SCHEDULED' || viewInterview.status === 'IN_PROGRESS'
                  ? [
                      {
                        label: 'Complete',
                        icon: CheckCircle,
                        onClick: () => setCompleteOpen(true),
                      },
                    ]
                  : []),
              ]
            : []
        }
        footerAlignment="between"
      >
        {viewInterviewLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading interview details...</p>
          </div>
        ) : viewInterview ? (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', IV_STATUS_COLORS[viewInterview.status])}>
                {viewInterview.status}
              </span>
              <span className="text-muted-foreground">{viewInterview.interview_type.replace(/_/g, ' ')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground mb-0.5">Scheduled</p><p>{formatDateTime(viewInterview.scheduled_at)}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Duration</p><p>{viewInterview.duration_minutes} min</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Interviewer</p><p>{viewInterview.interviewer_name}</p></div>
              <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><p>{viewInterview.interviewer_email}</p></div>
            </div>
            {viewInterview.meeting_link && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Meeting Link</p>
                <a href={viewInterview.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                  {viewInterview.meeting_link}
                </a>
              </div>
            )}
            {viewInterview.feedback && (
              <div><p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p><p>{viewInterview.feedback}</p></div>
            )}
            {viewInterview.rating && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Rating</p>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < viewInterview.rating! ? 'text-amber-400' : 'text-muted-foreground/30'}>★</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SideDrawer>

      {/* Complete Interview Drawer */}
      <SideDrawer
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete Interview"
        mode="edit"
        size="md"
        isLoading={completeMutation.isPending}
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => setCompleteOpen(false) },
          {
            label: 'Mark Complete',
            loading: completeMutation.isPending,
            onClick: () =>
              document.getElementById('complete-form')?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              ),
          },
        ]}
        footerAlignment="right"
      >
        {viewInterview && (
          <form
            id="complete-form"
            onSubmit={handleCompleteSubmit((data) =>
              completeMutation.mutate({
                id: viewInterview.id,
                feedback: data.feedback || '',
                rating: data.rating,
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Feedback (optional)</Label>
              <Textarea rows={4} placeholder="Candidate showed excellent problem-solving skills..." {...completeRegister('feedback')} />
            </div>
            <div className="space-y-1.5">
              <Label>Rating (1–5)</Label>
              <Input type="number" min="1" max="5" {...completeRegister('rating')} />
            </div>
          </form>
        )}
      </SideDrawer>

      {/* Edit Interview Drawer */}
      <SideDrawer
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditInterviewId(null)
        }}
        title="Edit Interview"
        mode="edit"
        size="md"
        footerButtons={[
          { label: 'Cancel', variant: 'outline', onClick: () => { setEditOpen(false); setEditInterviewId(null) } },
          {
            label: 'Save Changes',
            loading: updateMutation.isPending,
            onClick: () => {
              if (!editInterviewId) return
              updateMutation.mutate({
                id: editInterviewId,
                data: {
                  interviewer_name: editForm.interviewer_name,
                  interviewer_email: editForm.interviewer_email,
                  meeting_link: editForm.meeting_link,
                  scheduled_at: editForm.scheduled_at,
                  duration_minutes: editForm.duration_minutes,
                },
              })
            },
          },
        ]}
        footerAlignment="right"
      >
        {editInterview ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Interviewer Name</Label>
              <Input
                value={editForm.interviewer_name}
                onChange={(e) => setEditForm((f) => ({ ...f, interviewer_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Interviewer Email</Label>
              <Input
                type="email"
                value={editForm.interviewer_email}
                onChange={(e) => setEditForm((f) => ({ ...f, interviewer_email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled At</Label>
              <Input
                type="datetime-local"
                value={editForm.scheduled_at}
                onChange={(e) => setEditForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min="15"
                value={editForm.duration_minutes}
                onChange={(e) => setEditForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input
                value={editForm.meeting_link}
                onChange={(e) => setEditForm((f) => ({ ...f, meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </SideDrawer>
    </div>
  )
}
