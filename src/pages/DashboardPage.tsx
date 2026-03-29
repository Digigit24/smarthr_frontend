import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Users,
  Phone,
  TrendingUp,
  UserCheck,
  Gift,
  BarChart2,
  Calendar,
  Loader2,
  ArrowRight,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { analyticsService } from '@/services/analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  'text-blue-500': { bg: 'bg-blue-500/10', border: 'border-l-blue-500' },
  'text-indigo-500': { bg: 'bg-indigo-500/10', border: 'border-l-indigo-500' },
  'text-violet-500': { bg: 'bg-violet-500/10', border: 'border-l-violet-500' },
  'text-amber-500': { bg: 'bg-amber-500/10', border: 'border-l-amber-500' },
  'text-orange-500': { bg: 'bg-orange-500/10', border: 'border-l-orange-500' },
  'text-rose-500': { bg: 'bg-rose-500/10', border: 'border-l-rose-500' },
  'text-cyan-500': { bg: 'bg-cyan-500/10', border: 'border-l-cyan-500' },
  'text-teal-500': { bg: 'bg-teal-500/10', border: 'border-l-teal-500' },
  'text-green-500': { bg: 'bg-green-500/10', border: 'border-l-green-500' },
  'text-pink-500': { bg: 'bg-pink-500/10', border: 'border-l-pink-500' },
  'text-foreground': { bg: 'bg-muted', border: 'border-l-foreground' },
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'text-foreground',
  onClick,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: string
  onClick?: () => void
}) {
  const palette = COLOR_MAP[color] || COLOR_MAP['text-foreground']

  return (
    <Card
      className={`border-l-4 ${palette.border} overflow-hidden ${
        onClick
          ? 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-l-4 group'
          : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`h-9 w-9 rounded-lg ${palette.bg} flex items-center justify-center`}>
          <Icon className={`h-4.5 w-4.5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {onClick && (
            <ArrowRight className={`h-4 w-4 ${color} opacity-0 translate-x-[-4px] transition-all duration-200 group-hover:opacity-70 group-hover:translate-x-0 mb-1`} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  AI_SCREENING: 'AI Screening',
  AI_COMPLETED: 'AI Completed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview',
  INTERVIEWED: 'Interviewed',
  OFFER: 'Offer',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

const STATUS_COLORS: Record<string, string> = {
  APPLIED: '#3b82f6',
  AI_SCREENING: '#f59e0b',
  AI_COMPLETED: '#8b5cf6',
  SHORTLISTED: '#06b6d4',
  INTERVIEW_SCHEDULED: '#6366f1',
  INTERVIEWED: '#84cc16',
  OFFER: '#14b8a6',
  HIRED: '#22c55e',
  REJECTED: '#ef4444',
  WITHDRAWN: '#6b7280',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (value: string) => {
    setIsExporting(true)
    try {
      const [report, format] = value.split(':') as [string, 'csv' | 'xlsx']
      await analyticsService.export(report as 'all' | 'funnel' | 'scores' | 'timeline', format, '30d')
      toast.success(`Export started (${report} · ${format.toUpperCase()})`)
    } catch {
      toast.error('Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsService.dashboard(),
  })

  const { data: funnel } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => analyticsService.funnel(),
  })

  const { data: timeline } = useQuery({
    queryKey: ['analytics-timeline'],
    queryFn: () => analyticsService.timeline('30d'),
  })

  const { data: scores } = useQuery({
    queryKey: ['analytics-scores'],
    queryFn: () => analyticsService.scores(),
  })

  if (metricsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your recruitment pipeline at a glance</p>
        </div>
        <Select onValueChange={handleExport}>
          <SelectTrigger className="w-full sm:w-40 h-9" disabled={isExporting}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Export Report" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all:xlsx">Full Report (Excel)</SelectItem>
            <SelectItem value="funnel:csv">Funnel (CSV)</SelectItem>
            <SelectItem value="scores:csv">Scores (CSV)</SelectItem>
            <SelectItem value="timeline:csv">Timeline (CSV)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Jobs"
          value={metrics?.total_jobs_open ?? 0}
          icon={Briefcase}
          description="Active job postings"
          color="text-blue-500"
          onClick={() => navigate('/jobs')}
        />
        <StatCard
          title="Total Applications"
          value={metrics?.total_applications ?? 0}
          icon={Users}
          description={`${metrics?.applications_today ?? 0} today`}
          color="text-indigo-500"
          onClick={() => navigate('/applications')}
        />
        <StatCard
          title="Calls Completed"
          value={metrics?.total_calls_completed ?? 0}
          icon={Phone}
          description={`${metrics?.calls_today ?? 0} today`}
          color="text-violet-500"
          onClick={() => navigate('/calls')}
        />
        <StatCard
          title="Avg Score"
          value={metrics?.avg_candidate_score?.toFixed(2) ?? '0.00'}
          icon={TrendingUp}
          description="Out of 10.0"
          color="text-amber-500"
          onClick={() => navigate('/scorecards')}
        />
        <StatCard
          title="Applications Today"
          value={metrics?.applications_today ?? 0}
          icon={Users}
          description="Received today"
          color="text-orange-500"
          onClick={() => navigate('/applications?filter=today')}
        />
        <StatCard
          title="Calls Today"
          value={metrics?.calls_today ?? 0}
          icon={Phone}
          description="Completed today"
          color="text-rose-500"
          onClick={() => navigate('/calls?filter=today')}
        />
        <StatCard
          title="Shortlisted"
          value={metrics?.shortlisted_count ?? 0}
          icon={UserCheck}
          color="text-cyan-500"
          onClick={() => navigate('/applications?status=SHORTLISTED')}
        />
        <StatCard
          title="Offers Sent"
          value={metrics?.offers_count ?? 0}
          icon={Gift}
          color="text-teal-500"
          onClick={() => navigate('/applications?status=OFFER')}
        />
        <StatCard
          title="Conversion Rate"
          value={`${metrics?.hiring_conversion_rate?.toFixed(1) ?? 0}%`}
          icon={BarChart2}
          description="Applications → Hired"
          color="text-green-500"
          onClick={() => navigate('/pipeline')}
        />
        <StatCard
          title="Interviews"
          value={
            funnel?.find((f) => f.status === 'INTERVIEW_SCHEDULED')?.count ?? 0
          }
          icon={Calendar}
          description="Scheduled"
          color="text-pink-500"
          onClick={() => navigate('/interviews')}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList className="overflow-x-auto flex-wrap">
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="funnel">Pipeline Funnel</TabsTrigger>
          <TabsTrigger value="scores">Score Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Application Activity (30 days)</CardTitle>
              <CardDescription>Daily applications, calls, and hires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline || []}>
                  <defs>
                    <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hireGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#3b82f6"
                    fill="url(#appGrad)"
                    strokeWidth={2}
                    name="Applications"
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#8b5cf6"
                    fill="url(#callGrad)"
                    strokeWidth={2}
                    name="Calls"
                  />
                  <Area
                    type="monotone"
                    dataKey="hires"
                    stroke="#22c55e"
                    fill="url(#hireGrad)"
                    strokeWidth={2}
                    name="Hires"
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle>Application Pipeline</CardTitle>
              <CardDescription>Candidate distribution across stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(funnel || []).map((item) => {
                  const max = Math.max(...(funnel || []).map((f) => f.count), 1)
                  const pct = (item.count / max) * 100
                  return (
                    <div key={item.status} className="flex items-center gap-3">
                      <div className="w-20 sm:w-36 text-[12px] sm:text-[13px] text-muted-foreground text-right shrink-0">
                        {STATUS_LABELS[item.status] || item.status}
                      </div>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: STATUS_COLORS[item.status] || '#6b7280',
                          }}
                        />
                      </div>
                      <div className="w-12 text-[13px] font-medium text-foreground">
                        {item.count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>How candidates scored in AI screening</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
