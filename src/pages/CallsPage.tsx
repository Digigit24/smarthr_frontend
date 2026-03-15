import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Search, RefreshCw, Play, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SideDrawer } from '@/components/SideDrawer'
import { callsService } from '@/services/calls'
import type { CallRecordListItem, CallRecordDetail } from '@/types'
import { formatDateTime, formatDuration, cn } from '@/lib/utils'

const CALL_STATUS_COLORS: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-700',
  INITIATED: 'bg-blue-100 text-blue-700',
  RINGING: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
  NO_ANSWER: 'bg-orange-100 text-orange-700',
  BUSY: 'bg-yellow-100 text-yellow-700',
}

export default function CallsPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [viewCall, setViewCall] = useState<CallRecordDetail | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['calls', statusFilter],
    queryFn: () => callsService.list(statusFilter ? { status: statusFilter } : undefined),
  })

  const retryMutation = useMutation({
    mutationFn: (id: string) => callsService.retry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      toast.success('Call retried')
    },
    onError: () => toast.error('Failed to retry call'),
  })

  const handleView = async (call: CallRecordListItem) => {
    try {
      const detail = await callsService.get(call.id)
      setViewCall(detail)
      setViewOpen(true)
      setShowTranscript(false)
    } catch {
      toast.error('Failed to load call')
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Call Records</h1>
        <p className="text-xs text-muted-foreground">{data?.count ?? 0} total calls</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-16" />
            </Card>
          ))}
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No call records</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Phone</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Provider</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Status</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Duration</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Started</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-[13px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.results.map((call) => (
                <tr
                  key={call.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleView(call)}
                >
                  <td className="px-4 py-3 text-[13px] font-medium">{call.phone}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{call.provider}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[call.status])}>
                      {call.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">
                    {call.started_at ? formatDateTime(call.started_at) : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {call.status === 'FAILED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => retryMutation.mutate(call.id)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Call Detail Drawer */}
      <SideDrawer
        open={viewOpen}
        onOpenChange={setViewOpen}
        title="Call Detail"
        mode="view"
        size="xl"
        footerButtons={
          viewCall?.status === 'FAILED'
            ? [
                {
                  label: 'Retry Call',
                  icon: RefreshCw,
                  onClick: () => {
                    retryMutation.mutate(viewCall.id)
                    setViewOpen(false)
                  },
                },
              ]
            : []
        }
        footerAlignment="right"
      >
        {viewCall && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', CALL_STATUS_COLORS[viewCall.status])}>
                {viewCall.status.replace(/_/g, ' ')}
              </span>
              <Badge variant="secondary">{viewCall.provider}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                <p className="font-medium">{viewCall.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                <p className="font-medium">{formatDuration(viewCall.duration)}</p>
              </div>
              {viewCall.started_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Started</p>
                  <p className="font-medium">{formatDateTime(viewCall.started_at)}</p>
                </div>
              )}
              {viewCall.ended_at && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Ended</p>
                  <p className="font-medium">{formatDateTime(viewCall.ended_at)}</p>
                </div>
              )}
            </div>

            {viewCall.summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                <p className="text-[13px]">{viewCall.summary}</p>
              </div>
            )}

            {viewCall.recording_url && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Recording</p>
                <audio controls src={viewCall.recording_url} className="w-full h-10" />
              </div>
            )}

            {viewCall.scorecard && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scorecard</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Communication', value: viewCall.scorecard.communication_score },
                    { label: 'Knowledge', value: viewCall.scorecard.knowledge_score },
                    { label: 'Confidence', value: viewCall.scorecard.confidence_score },
                    { label: 'Relevance', value: viewCall.scorecard.relevance_score },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] text-muted-foreground">{item.label}</p>
                      <p className="font-semibold">{parseFloat(item.value).toFixed(1)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <p className="text-lg font-bold">{parseFloat(viewCall.scorecard.overall_score).toFixed(1)} / 10</p>
                  <Badge variant="outline">{viewCall.scorecard.recommendation}</Badge>
                </div>
              </div>
            )}

            {viewCall.transcript && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowTranscript((s) => !s)}
                >
                  <FileText className="h-4 w-4" />
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </Button>
                {showTranscript && (
                  <pre className="mt-3 p-3 bg-muted rounded-lg text-[13px] whitespace-pre-wrap font-mono overflow-auto max-h-64">
                    {viewCall.transcript}
                  </pre>
                )}
              </div>
            )}

            {viewCall.error_message && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-xs font-medium text-destructive mb-0.5">Error</p>
                <p className="text-[13px]">{viewCall.error_message}</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </div>
  )
}
