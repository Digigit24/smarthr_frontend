import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { interviewsService } from '@/services/interviews'
import type { InterviewFormData } from '@/types'

export default function InterviewEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    interviewer_name: '',
    interviewer_email: '',
    meeting_link: '',
    scheduled_at: '',
    duration_minutes: 60,
  })

  const { data: interview, isLoading } = useQuery({
    queryKey: ['interview-detail', id],
    queryFn: () => interviewsService.get(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (interview) {
      setForm({
        interviewer_name: interview.interviewer_name || '',
        interviewer_email: interview.interviewer_email || '',
        meeting_link: interview.meeting_link || '',
        scheduled_at: interview.scheduled_at ? interview.scheduled_at.slice(0, 16) : '',
        duration_minutes: interview.duration_minutes || 60,
      })
    }
  }, [interview])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<InterviewFormData>) => interviewsService.patch(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      qc.invalidateQueries({ queryKey: ['interview-detail', id] })
      toast.success('Interview updated')
      navigate(`/interviews/${id}`)
    },
    onError: () => toast.error('Failed to update interview'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading interview...</p>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">Interview not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/interviews')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Interviews
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(`/interviews/${id}`)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Interview
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
            <Pencil className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Edit Interview</h1>
            <p className="text-sm text-muted-foreground">{interview.interview_type.replace(/_/g, ' ')} · {interview.status}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Interviewer Name</Label>
            <Input
              value={form.interviewer_name}
              onChange={(e) => setForm(f => ({ ...f, interviewer_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Interviewer Email</Label>
            <Input
              type="email"
              value={form.interviewer_email}
              onChange={(e) => setForm(f => ({ ...f, interviewer_email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled At</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="15"
              value={form.duration_minutes}
              onChange={(e) => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Meeting Link</Label>
            <Input
              value={form.meeting_link}
              onChange={(e) => setForm(f => ({ ...f, meeting_link: e.target.value }))}
              placeholder="https://meet.google.com/..."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-4">
        <Button type="button" variant="outline" onClick={() => navigate(`/interviews/${id}`)} className="sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={() => updateMutation.mutate({
            interviewer_name: form.interviewer_name,
            interviewer_email: form.interviewer_email,
            meeting_link: form.meeting_link,
            scheduled_at: form.scheduled_at,
            duration_minutes: form.duration_minutes,
          })}
          disabled={updateMutation.isPending}
          className="sm:w-auto"
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
