import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SideDrawer } from '@/components/SideDrawer'
import { scorecardsService } from '@/services/scorecards'
import type { ScorecardListItem } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const REC_COLORS: Record<string, string> = {
  STRONG_YES: 'bg-emerald-100 text-emerald-700',
  YES: 'bg-green-100 text-green-700',
  MAYBE: 'bg-amber-100 text-amber-700',
  NO: 'bg-red-100 text-red-700',
  STRONG_NO: 'bg-red-200 text-red-900',
}

function ScoreGauge({ score }: { score: string }) {
  const val = parseFloat(score)
  const color = val >= 70 ? 'text-emerald-500' : val >= 40 ? 'text-amber-500' : 'text-red-500'
  return <span className={cn('text-lg font-bold', color)}>{val.toFixed(1)}</span>
}

export default function ScorecardsPage() {
  const [search, setSearch] = useState('')
  const [recFilter, setRecFilter] = useState('')
  const [ordering, setOrdering] = useState('-overall_score')
  const [viewCardId, setViewCardId] = useState<string | null>(null)
  const [viewOpen, setViewOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['scorecards', search, recFilter, ordering],
    queryFn: () =>
      scorecardsService.list({
        ...(search && { search }),
        ...(recFilter && { recommendation: recFilter }),
        ordering,
      }),
  })

  const { data: viewCard, isLoading: viewCardLoading } = useQuery({
    queryKey: ['scorecard-detail', viewCardId],
    queryFn: () => scorecardsService.get(viewCardId!),
    enabled: !!viewCardId,
  })

  const handleView = (sc: ScorecardListItem) => {
    setViewCardId(sc.id)
    setViewOpen(true)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Scorecards</h1>
        <p className="text-xs text-muted-foreground">{data?.count ?? 0} total scorecards</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scorecards..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={recFilter || 'ALL'}
          onValueChange={(v) => setRecFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
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
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-overall_score">Highest score</SelectItem>
            <SelectItem value="overall_score">Lowest score</SelectItem>
            <SelectItem value="-created_at">Newest first</SelectItem>
            <SelectItem value="created_at">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading scorecards...</p>
        </div>
      ) : (data?.results?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No scorecards yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.results.map((sc) => (
            <Card
              key={sc.id}
              className="cursor-pointer hover:border-border/80 transition-colors"
              onClick={() => handleView(sc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                    <ScoreGauge score={sc.overall_score} />
                    <span className="text-muted-foreground text-sm"> / 100</span>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', REC_COLORS[sc.recommendation])}>
                    {sc.recommendation.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[12px] text-muted-foreground">
                  <span>Com: <strong className="text-foreground">{parseFloat(sc.communication_score).toFixed(1)}</strong></span>
                  <span>Know: <strong className="text-foreground">{parseFloat(sc.knowledge_score).toFixed(1)}</strong></span>
                  <span>Conf: <strong className="text-foreground">{parseFloat(sc.confidence_score).toFixed(1)}</strong></span>
                  <span>Rel: <strong className="text-foreground">{parseFloat(sc.relevance_score).toFixed(1)}</strong></span>
                </div>
                {sc.summary && (
                  <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2">{sc.summary}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">{formatDate(sc.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SideDrawer
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setViewCardId(null)
        }}
        title="Scorecard Detail"
        mode="view"
        size="lg"
      >
        {viewCardLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-3">Loading scorecard details...</p>
          </div>
        ) : viewCard ? (
          <div className="space-y-5">
            <div className="text-center py-4 rounded-lg bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">Overall Score</p>
              <ScoreGauge score={viewCard.overall_score} />
              <span className="text-muted-foreground"> / 100</span>
              <div className="mt-2">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-medium', REC_COLORS[viewCard.recommendation])}>
                  {viewCard.recommendation.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Communication', value: viewCard.communication_score },
                { label: 'Knowledge', value: viewCard.knowledge_score },
                { label: 'Confidence', value: viewCard.confidence_score },
                { label: 'Relevance', value: viewCard.relevance_score },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-bold">{parseFloat(item.value).toFixed(1)}</p>
                </div>
              ))}
            </div>
            {viewCard.summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Summary</p>
                <p className="text-[13px]">{viewCard.summary}</p>
              </div>
            )}
            {viewCard.strengths?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-600 mb-1.5">Strengths</p>
                <ul className="list-disc list-inside text-[13px] space-y-1">
                  {viewCard.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {viewCard.weaknesses?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-500 mb-1.5">Areas to Improve</p>
                <ul className="list-disc list-inside text-[13px] space-y-1">
                  {viewCard.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {Object.entries(viewCard.detailed_feedback || {}).map(([key, val]) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground capitalize mb-1">{key}</p>
                <p className="text-[13px]">{val}</p>
              </div>
            ))}
          </div>
        ) : null}
      </SideDrawer>
    </div>
  )
}
