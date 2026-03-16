import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
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
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { analyticsService } from '@/services/analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'text-foreground',
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  color?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Your recruitment pipeline at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Jobs"
          value={metrics?.total_jobs_open ?? 0}
          icon={Briefcase}
          description="Active job postings"
          color="text-blue-500"
        />
        <StatCard
          title="Total Applications"
          value={metrics?.total_applications ?? 0}
          icon={Users}
          description={`${metrics?.applications_today ?? 0} today`}
          color="text-indigo-500"
        />
        <StatCard
          title="Calls Completed"
          value={metrics?.total_calls_completed ?? 0}
          icon={Phone}
          description={`${metrics?.calls_today ?? 0} today`}
          color="text-violet-500"
        />
        <StatCard
          title="Avg Score"
          value={metrics?.avg_candidate_score?.toFixed(2) ?? '0.00'}
          icon={TrendingUp}
          description="Out of 10.0"
          color="text-amber-500"
        />
        <StatCard
          title="Applications Today"
          value={metrics?.applications_today ?? 0}
          icon={Users}
          description="Received today"
          color="text-orange-500"
        />
        <StatCard
          title="Calls Today"
          value={metrics?.calls_today ?? 0}
          icon={Phone}
          description="Completed today"
          color="text-rose-500"
        />
        <StatCard
          title="Shortlisted"
          value={metrics?.shortlisted_count ?? 0}
          icon={UserCheck}
          color="text-cyan-500"
        />
        <StatCard
          title="Offers Sent"
          value={metrics?.offers_count ?? 0}
          icon={Gift}
          color="text-teal-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${metrics?.hiring_conversion_rate?.toFixed(1) ?? 0}%`}
          icon={BarChart2}
          description="Applications → Hired"
          color="text-green-500"
        />
        <StatCard
          title="Interviews"
          value={
            funnel?.find((f) => f.status === 'INTERVIEW_SCHEDULED')?.count ?? 0
          }
          icon={Calendar}
          description="Scheduled"
          color="text-pink-500"
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList>
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
              <ResponsiveContainer width="100%" height={300}>
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
                </AreaChart>
              </ResponsiveContainer>
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
                      <div className="w-36 text-[13px] text-muted-foreground text-right shrink-0">
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
              <ResponsiveContainer width="100%" height={300}>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
