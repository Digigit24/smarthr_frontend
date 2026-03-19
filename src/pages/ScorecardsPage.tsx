import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star, Search, Loader2, Trash2, MessageSquare, Brain, Shield, Zap,
  ThumbsUp, ThumbsDown, TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { scorecardsService } from '@/services/scorecards'
import type { ScorecardListItem, ScorecardRecommendation } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const REC_CONFIG: Record<string, { label: string; color: string; gradient: string; dot: string }> = {
  STRONG_YES: { label: 'Strong Yes', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500' },
  YES: { label: 'Yes', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', gradient: 'from-green-500 to-emerald-500', dot: 'bg-green-500' },
  MAYBE: { label: 'Maybe', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500' },
  NO: { label: 'No', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500' },
  STRONG_NO: { label: 'Strong No', color: 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300', gradient: 'from-red-500 to-red-700', dot: 'bg-red-600' },
}

const DIMENSION_ICONS = [
  { key: 'communication_score', label: 'Com', icon: MessageSquare, color: 'text-blue-500' },
  { key: 'knowledge_score', label: 'Know', icon: Brain, color: 'text-purple-500' },
  { key: 'confidence_score', label: 'Conf', icon: Shield, color: 'text-amber-500' },
  { key: 'relevance_score', label: 'Rel', icon: Zap, color: 'text-emerald-500' },
]

function ScoreRingSmall({ score }: { score: number }) {
  const size = 56
  const stroke = 4
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? 'stroke-emerald-500' : score >= 40 ? 'stroke-amber-500' : 'stroke-red-500'
  const textColor = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className={cn(color, 'transition-all duration-500')} />
      </svg>
      <span className={cn('absolute text-sm font-bold', textColor)}>{score.toFixed(0)}</span>
    </div>
  )
}

function ScorecardCard({ sc, onDelete }: { sc: ScorecardListItem; onDelete: (id: string) => void }) {
  const navigate = useNavigate()
  const overall = parseFloat(sc.overall_score)
  const recCfg = REC_CONFIG[sc.recommendation] || REC_CONFIG.MAYBE

  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/scorecards/${sc.id}`)}
    >
      {/* Gradient accent */}
      <div className={cn('h-1.5 bg-gradient-to-r', recCfg.gradient)} />

      <div className="p-4 sm:p-5">
        {/* Top: Score ring + Recommendation */}
        <div className="flex items-center gap-3 mb-4">
          <ScoreRingSmall score={overall} />
          <div className="flex-1 min-w-0">
            <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', recCfg.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', recCfg.dot)} />
              {recCfg.label}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Overall: <span className="font-semibold text-foreground">{overall.toFixed(1)}</span> / 100</p>
          </div>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(sc.id) }}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Dimension scores as mini bars */}
        <div className="space-y-2 mb-4">
          {DIMENSION_ICONS.map((dim) => {
            const val = parseFloat((sc as unknown as Record<string, string>)[dim.key] || '0')
            return (
              <div key={dim.key} className="flex items-center gap-2">
                <dim.icon className={cn('h-3.5 w-3.5 shrink-0', dim.color)} />
                <span className="text-[11px] text-muted-foreground w-10 shrink-0">{dim.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500',
                      val >= 70 ? 'bg-emerald-500' : val >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium w-8 text-right">{val.toFixed(0)}</span>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {sc.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{sc.summary}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span>{formatDate(sc.created_at)}</span>
          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium">
            View Details →
          </span>
        </div>
      </div>
    </div>
  )
}

export default function ScorecardsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [recFilter, setRecFilter] = useState('')
  const [ordering, setOrdering] = useState('-overall_score')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['scorecards', search, recFilter, ordering, dateFrom, dateTo],
    queryFn: () =>
      scorecardsService.list({
        ...(search && { search }),
        ...(recFilter && { recommendation: recFilter }),
        ...(dateFrom && { created_at_gte: dateFrom }),
        ...(dateTo && { created_at_lte: dateTo }),
        ordering,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scorecardsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scorecards'] })
      toast.success('Scorecard deleted')
    },
    onError: () => toast.error('Failed to delete scorecard'),
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this scorecard? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  // Recommendation counts
  const allCards = data?.results || []
  const recCounts = allCards.reduce((acc, c) => { acc[c.recommendation] = (acc[c.recommendation] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
          Scorecards
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data?.count ?? 0} total scorecards</p>
      </div>

      {/* Quick recommendation pills */}
      {allCards.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO'] as ScorecardRecommendation[]).map((r) => {
            const count = recCounts[r] || 0
            if (count === 0) return null
            const cfg = REC_CONFIG[r]
            return (
              <button
                key={r}
                onClick={() => setRecFilter(recFilter === r ? '' : r)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  recFilter === r ? 'ring-2 ring-offset-1 ring-primary/30 ' + cfg.color : cfg.color + ' border-transparent hover:shadow-sm'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                {count} {cfg.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scorecards..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={recFilter || 'ALL'} onValueChange={(v) => setRecFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All recommendations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All recommendations</SelectItem>
              <SelectItem value="STRONG_YES">Strong Yes</SelectItem>
              <SelectItem value="YES">Yes</SelectItem>
              <SelectItem value="MAYBE">Maybe</SelectItem>
              <SelectItem value="NO">No</SelectItem>
              <SelectItem value="STRONG_NO">Strong No</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ordering} onValueChange={setOrdering}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-overall_score">Highest score</SelectItem>
              <SelectItem value="overall_score">Lowest score</SelectItem>
              <SelectItem value="-created_at">Newest first</SelectItem>
              <SelectItem value="created_at">Oldest first</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter
            fromDate={dateFrom}
            toDate={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo('') }}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading scorecards...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No scorecards yet</p>
          <p className="text-sm text-muted-foreground mt-1">Scorecards are generated when AI calls are completed</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.results.map((sc) => (
            <ScorecardCard key={sc.id} sc={sc} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
