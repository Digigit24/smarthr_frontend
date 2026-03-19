import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, Pencil, Phone } from 'lucide-react'
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
import { callsService } from '@/services/calls'
import { FileText } from 'lucide-react'

const ALL_STATUSES = ['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'] as const

export default function CallEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: call, isLoading } = useQuery({
    queryKey: ['call-detail', id],
    queryFn: () => callsService.get(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState({ phone: '', summary: '', status: '' })

  useEffect(() => {
    if (call) {
      setForm({ phone: call.phone, summary: call.summary || '', status: call.status })
    }
  }, [call])

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => callsService.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      qc.invalidateQueries({ queryKey: ['call-detail', id] })
      toast.success('Call record updated')
      navigate(-1)
    },
    onError: () => toast.error('Failed to update call record'),
  })

  const handleSave = () => {
    updateMutation.mutate({ phone: form.phone, summary: form.summary, status: form.status })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading call record...</p>
      </div>
    )
  }

  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <FileText className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">Call record not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Calls
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-400" />
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">Edit Call Record</h1>
                <p className="text-sm text-muted-foreground">{call.phone} · {call.provider}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button disabled={updateMutation.isPending} onClick={handleSave}>
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Call Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Textarea
              rows={5}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              placeholder="Call summary..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
