import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Star, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { scorecardsService } from '@/services/scorecards'
import { cn } from '@/lib/utils'

const REC_OPTIONS = [
  { value: 'STRONG_YES', label: 'Strong Yes', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'YES', label: 'Yes', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'MAYBE', label: 'Maybe', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'NO', label: 'No', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'STRONG_NO', label: 'Strong No', color: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300' },
]

export default function ScorecardEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({ summary: '', recommendation: '' })

  const { data: card, isLoading } = useQuery({
    queryKey: ['scorecard-detail', id],
    queryFn: () => scorecardsService.get(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (card) {
      setForm({
        summary: card.summary || '',
        recommendation: card.recommendation || '',
      })
    }
  }, [card])

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => scorecardsService.update(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scorecards'] })
      qc.invalidateQueries({ queryKey: ['scorecard-detail', id] })
      toast.success('Scorecard updated')
      navigate(`/scorecards/${id}`)
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to update scorecard')),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading scorecard...</p>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">Scorecard not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Scorecards
        </Button>
      </div>
    )
  }

  const overall = parseFloat(card.overall_score)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(`/scorecards/${id}`)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Scorecard
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="p-4 sm:p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Edit Scorecard</h1>
            <p className="text-sm text-muted-foreground">Overall Score: <span className="font-semibold text-foreground">{overall.toFixed(1)}</span></p>
          </div>
        </div>
      </div>

      {/* Read-only scores */}
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-xs font-medium text-muted-foreground mb-3">Score Breakdown (read-only)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Communication', value: card.communication_score, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
            { label: 'Knowledge', value: card.knowledge_score, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
            { label: 'Confidence', value: card.confidence_score, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
            { label: 'Relevance', value: card.relevance_score, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-lg p-3 text-center', s.color.split(' ').slice(0, 2).join(' '))}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{parseFloat(s.value).toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-5">
        <div className="space-y-2">
          <Label>Recommendation</Label>
          <Select value={form.recommendation} onValueChange={(v) => setForm(f => ({ ...f, recommendation: v }))}>
            <SelectTrigger><SelectValue placeholder="Select recommendation..." /></SelectTrigger>
            <SelectContent>
              {REC_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <span className="flex items-center gap-2">
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', r.color)}>{r.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Preview current selection */}
          {form.recommendation && (
            <div className="mt-1">
              {(() => {
                const opt = REC_OPTIONS.find(r => r.value === form.recommendation)
                return opt ? <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', opt.color)}>{opt.label}</span> : null
              })()}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea
            rows={6}
            placeholder="Summarize the candidate's performance..."
            value={form.summary}
            onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">{form.summary.length} characters</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 pb-4">
        <Button type="button" variant="outline" onClick={() => navigate(`/scorecards/${id}`)} className="sm:w-auto">
          Cancel
        </Button>
        <Button
          onClick={() => updateMutation.mutate({ summary: form.summary, recommendation: form.recommendation })}
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
