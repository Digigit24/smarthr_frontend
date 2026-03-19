import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Pencil, Trash2, Loader2, AlertTriangle,
  MessageSquare, Brain, Shield, Zap, Star, ThumbsUp, ThumbsDown, FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { scorecardsService } from '@/services/scorecards'
import type { ScorecardRecommendation } from '@/types'
import { cn } from '@/lib/utils'

const REC_CONFIG: Record<ScorecardRecommendation, { label: string; color: string; gradient: string; dot: string; icon: typeof Star }> = {
  STRONG_YES: { label: 'Strong Yes', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500', icon: Star },
  YES: { label: 'Yes', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', gradient: 'from-green-500 to-emerald-500', dot: 'bg-green-500', icon: ThumbsUp },
  MAYBE: { label: 'Maybe', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500', icon: MessageSquare },
  NO: { label: 'No', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500', icon: ThumbsDown },
  STRONG_NO: { label: 'Strong No', color: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300', gradient: 'from-red-500 to-red-700', dot: 'bg-red-600', icon: ThumbsDown },
}

const DIMENSION_CONFIG = [
  { key: 'communication_score', label: 'Communication', icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500' },
  { key: 'knowledge_score', label: 'Knowledge', icon: Brain, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', bar: 'bg-purple-500' },
  { key: 'confidence_score', label: 'Confidence', icon: Shield, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500' },
  { key: 'relevance_score', label: 'Relevance', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500' },
]

function ScoreRing({ score, size = 120, stroke = 8 }: { score: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'stroke-emerald-500' : score >= 40 ? 'stroke-amber-500' : 'stroke-red-500'
  const bgColor = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className={cn(color, 'transition-all duration-700')} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', bgColor)}>{score.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

export default function ScorecardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: card, isLoading } = useQuery({
    queryKey: ['scorecard-detail', id],
    queryFn: () => scorecardsService.get(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => scorecardsService.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scorecards'] })
      toast.success('Scorecard deleted')
      navigate(-1)
    },
    onError: () => toast.error('Failed to delete scorecard'),
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
  const recCfg = REC_CONFIG[card.recommendation] || REC_CONFIG.MAYBE
  const RecIcon = recCfg.icon

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Scorecards
      </Button>

      {/* Hero Header */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className={cn('h-2 bg-gradient-to-r', recCfg.gradient)} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Score Ring */}
            <div className="flex justify-center sm:justify-start">
              <ScoreRing score={overall} />
            </div>
            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mb-2">
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', recCfg.color)}>
                  <RecIcon className="h-3.5 w-3.5" />
                  {recCfg.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">AI Scorecard</h1>
              <p className="text-sm text-muted-foreground mt-1">Scorecard ID: {id}</p>
            </div>
            {/* Actions */}
            <div className="flex justify-center sm:justify-end gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => navigate(`/scorecards/${id}/edit`)}>
                <Pencil className="h-4 w-4 mr-1.5" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                onClick={() => { if (window.confirm('Delete this scorecard?')) deleteMutation.mutate() }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {DIMENSION_CONFIG.map((dim) => {
          const val = parseFloat((card as unknown as Record<string, string>)[dim.key] || '0')
          return (
            <div key={dim.key} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', dim.bg)}>
                  <dim.icon className={cn('h-4.5 w-4.5', dim.color)} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{dim.label}</p>
                  <p className="text-lg font-bold">{val.toFixed(1)}</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', dim.bar)} style={{ width: `${val}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Summary */}
          {card.summary && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm">Summary</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.summary}</p>
            </div>
          )}

          {/* Strengths */}
          {card.strengths?.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <ThumbsUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm">Strengths</h3>
                <span className="text-xs text-muted-foreground">({card.strengths.length})</span>
              </div>
              <div className="space-y-2">
                {card.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {card.weaknesses?.length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <ThumbsDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-sm">Areas to Improve</h3>
                <span className="text-xs text-muted-foreground">({card.weaknesses.length})</span>
              </div>
              <div className="space-y-2">
                {card.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                    <span className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Feedback */}
          {card.detailed_feedback && Object.keys(card.detailed_feedback).length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold text-sm">Detailed Feedback</h3>
              </div>
              <div className="space-y-4">
                {Object.entries(card.detailed_feedback).map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-muted-foreground capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm leading-relaxed">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Score Overview */}
          <div className="rounded-xl border bg-card p-4 sm:p-5">
            <h3 className="font-semibold text-sm mb-3">Score Breakdown</h3>
            <div className="space-y-3">
              {DIMENSION_CONFIG.map((dim) => {
                const val = parseFloat((card as unknown as Record<string, string>)[dim.key] || '0')
                return (
                  <div key={dim.key} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <dim.icon className={cn('h-3.5 w-3.5 shrink-0', dim.color)} />
                      <span className="text-xs text-muted-foreground truncate">{dim.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{val.toFixed(1)}</span>
                  </div>
                )
              })}
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-xs font-medium">Overall</span>
                <span className="text-lg font-bold">{overall.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={cn('rounded-xl border-2 p-4 sm:p-5',
            overall >= 70 ? 'border-emerald-200 dark:border-emerald-800/50'
            : overall >= 40 ? 'border-amber-200 dark:border-amber-800/50'
            : 'border-red-200 dark:border-red-800/50'
          )}>
            <p className="text-xs text-muted-foreground mb-2">Recommendation</p>
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold', recCfg.color)}>
                <RecIcon className="h-4 w-4" />
                {recCfg.label}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-2">
            <h3 className="font-semibold text-sm mb-3">Actions</h3>
            <Button variant="outline" className="w-full justify-start" size="sm" onClick={() => navigate(`/scorecards/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Scorecard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" size="sm"
              onClick={() => { if (window.confirm('Delete this scorecard?')) deleteMutation.mutate() }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete Scorecard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
