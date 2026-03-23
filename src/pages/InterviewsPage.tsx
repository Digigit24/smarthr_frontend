import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Calendar, Loader2, Trash2, Clock, User, Video,
  MessageSquare, Star, CheckCircle, ExternalLink, UserCheck, Briefcase,
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { interviewsService } from '@/services/interviews'
import type { InterviewListItem, InterviewStatus, InterviewType } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string; gradient: string; dot: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', gradient: 'from-cyan-500 to-blue-500', dot: 'bg-cyan-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', gradient: 'from-amber-400 to-orange-500', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-500', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', gradient: 'from-red-400 to-rose-500', dot: 'bg-red-500' },
  NO_SHOW: { label: 'No Show', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400' },
}

const TYPE_CONFIG: Record<InterviewType, { label: string; icon: typeof Calendar; color: string; bg: string }> = {
  AI_VOICE: { label: 'AI Voice', icon: MessageSquare, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  HR_SCREEN: { label: 'HR Screen', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  TECHNICAL: { label: 'Technical', icon: Calendar, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  CULTURE_FIT: { label: 'Culture Fit', icon: Star, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  FINAL: { label: 'Final', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function GradientAvatar({ name }: { name: string }) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradients = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500', 'from-pink-500 to-rose-500', 'from-indigo-500 to-blue-600',
  ]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className={cn('h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold shrink-0', gradients[hash % gradients.length])}>
      {initials}
    </div>
  )
}

function InterviewCard({ iv }: { iv: InterviewListItem }) {
  const navigate = useNavigate()
  const statusCfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.SCHEDULED
  const typeCfg = TYPE_CONFIG[iv.interview_type] || TYPE_CONFIG.TECHNICAL
  const TypeIcon = typeCfg.icon
  const scheduledDate = new Date(iv.scheduled_at)
  const isUpcoming = scheduledDate > new Date() && iv.status !== 'CANCELLED' && iv.status !== 'COMPLETED'

  return (
    <div
      className="group rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/interviews/${iv.id}`)}
    >
      <div className={cn('h-1.5 bg-gradient-to-r', statusCfg.gradient)} />
      <div className="p-4 sm:p-5">
        {/* Status + Type badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', statusCfg.color)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', statusCfg.dot, iv.status === 'IN_PROGRESS' && 'animate-pulse')} />
            {statusCfg.label}
          </span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', typeCfg.bg, typeCfg.color)}>
            <TypeIcon className="h-3 w-3" />
            {typeCfg.label}
          </span>
          {isUpcoming && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              {(() => {
                const diff = scheduledDate.getTime() - Date.now()
                const hours = Math.floor(diff / (1000 * 60 * 60))
                const days = Math.floor(hours / 24)
                if (days > 0) return `In ${days}d`
                if (hours > 0) return `In ${hours}h`
                return 'Soon'
              })()}
            </span>
          )}
        </div>

        {/* Schedule info */}
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm font-medium">{formatDateTime(iv.scheduled_at)}</p>
        </div>

        {/* Applicant (whose interview) */}
        <div className="flex items-center gap-2.5 mb-2 p-2.5 rounded-lg bg-muted/30">
          <GradientAvatar name={iv.applicant_name || iv.applicant_email || 'A'} />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Candidate</p>
            <p className="text-sm font-medium truncate">{iv.applicant_name || iv.applicant_email || 'Unknown'}</p>
          </div>
        </div>

        {/* Interviewer (who takes the interview) */}
        <div className="flex items-center gap-2.5 mb-3 p-2.5 rounded-lg bg-muted/30">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Interviewer</p>
            <p className="text-sm font-medium truncate">{iv.interviewer_name || 'No name'}</p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-3 pt-3 border-t text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {iv.duration_minutes}min
          </span>
          {iv.meeting_link && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Video className="h-3 w-3" /> Link
            </span>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium ml-auto">
            View Details →
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Calendar helpers ── */
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= totalDays; d++) days.push(d)
  // pad to complete the last week
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/* ── Calendar View component ── */
function CalendarView({ interviews }: { interviews: InterviewListItem[] }) {
  const navigate = useNavigate()
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
    setSelectedDate(null)
  }
  const goToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
    setSelectedDate(dateKey(today))
  }

  // Group interviews by date
  const interviewsByDate = useMemo(() => {
    const map: Record<string, InterviewListItem[]> = {}
    for (const iv of interviews) {
      const key = dateKey(new Date(iv.scheduled_at))
      if (!map[key]) map[key] = []
      map[key].push(iv)
    }
    // Sort each day's interviews by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    }
    return map
  }, [interviews])

  const days = getCalendarDays(calYear, calMonth)
  const todayKey = dateKey(today)
  const selectedInterviews = selectedDate ? (interviewsByDate[selectedDate] || []) : []

  return (
    <div className="space-y-4">
      {/* Calendar card */}
      <Card className="overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-base sm:text-lg font-semibold">
            {MONTH_NAMES[calMonth]} {calYear}
          </h2>
          <Button variant="outline" size="sm" className="text-xs" onClick={goToday}>
            Today
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/20">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`pad-${idx}`} className="border-b border-r last:border-r-0 bg-muted/5 min-h-[52px] sm:min-h-[90px]" />
            }
            const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayInterviews = interviewsByDate[key] || []
            const isToday = key === todayKey
            const isSelected = key === selectedDate
            const isWeekend = idx % 7 === 0 || idx % 7 === 6

            return (
              <div
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                className={cn(
                  'relative border-b border-r text-left p-1 sm:p-2 min-h-[52px] sm:min-h-[90px] transition-colors cursor-pointer',
                  'hover:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary/30',
                  isSelected && 'bg-primary/10 ring-1 ring-inset ring-primary/30',
                  isWeekend && !isSelected && 'bg-muted/10',
                )}
              >
                {/* Day number */}
                <span className={cn(
                  'inline-flex items-center justify-center h-6 w-6 sm:h-7 sm:w-7 rounded-full text-xs sm:text-sm font-medium',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}>
                  {day}
                </span>

                {/* Interview dots / chips */}
                {dayInterviews.length > 0 && (
                  <div className="mt-0.5 sm:mt-1 space-y-0.5">
                    {/* Mobile: show dots */}
                    <div className="flex gap-0.5 flex-wrap sm:hidden">
                      {dayInterviews.slice(0, 4).map((iv) => {
                        const cfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.SCHEDULED
                        return <span key={iv.id} className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      })}
                      {dayInterviews.length > 4 && (
                        <span className="text-[8px] text-muted-foreground">+{dayInterviews.length - 4}</span>
                      )}
                    </div>

                    {/* Desktop: show all event chips (cell grows to fit) */}
                    <div className="hidden sm:block space-y-0.5">
                      {dayInterviews.map((iv) => {
                        const cfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.SCHEDULED
                        return (
                          <div
                            key={iv.id}
                            onClick={(e) => { e.stopPropagation(); navigate(`/interviews/${iv.id}`) }}
                            className={cn(
                              'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer',
                              'hover:ring-1 hover:ring-inset hover:ring-primary/40 transition-all',
                              cfg.color,
                            )}
                          >
                            <span className={cn('h-1 w-1 rounded-full shrink-0', cfg.dot)} />
                            <span className="truncate">
                              {formatTime(iv.scheduled_at)} {iv.applicant_name?.split(' ')[0] || 'Interview'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Selected day detail panel */}
      {selectedDate && (
        <Card className="overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b bg-muted/30 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 min-w-0">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span className="sm:hidden">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </span>
            </h3>
            <span className="text-xs text-muted-foreground shrink-0">{selectedInterviews.length} interview{selectedInterviews.length !== 1 ? 's' : ''}</span>
          </div>
          {selectedInterviews.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-sm text-muted-foreground">
              No interviews on this day
            </div>
          ) : (
            <div className="divide-y">
              {selectedInterviews.map((iv) => {
                const statusCfg = STATUS_CONFIG[iv.status] || STATUS_CONFIG.SCHEDULED
                const typeCfg = TYPE_CONFIG[iv.interview_type] || TYPE_CONFIG.TECHNICAL
                const TypeIcon = typeCfg.icon
                return (
                  <div
                    key={iv.id}
                    className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/interviews/${iv.id}`)}
                  >
                    {/* Time block */}
                    <div className="text-center shrink-0 w-14">
                      <p className="text-sm font-bold">{formatTime(iv.scheduled_at)}</p>
                      <p className="text-[10px] text-muted-foreground">{iv.duration_minutes}min</p>
                    </div>

                    {/* Color bar */}
                    <div className={cn('w-1 self-stretch rounded-full bg-gradient-to-b', statusCfg.gradient)} />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">
                          {iv.applicant_name || iv.applicant_email || 'Unknown Candidate'}
                        </p>
                        <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium', statusCfg.color)}>
                          <span className={cn('h-1 w-1 rounded-full', statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                        <span className={cn('inline-flex items-center gap-1', typeCfg.color)}>
                          <TypeIcon className="h-3 w-3" />
                          {typeCfg.label}
                        </span>
                        {iv.interviewer_name && (
                          <>
                            <span className="text-border hidden sm:inline">|</span>
                            <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                              <UserCheck className="h-3 w-3 shrink-0" />
                              <span className="truncate">{iv.interviewer_name}</span>
                            </span>
                          </>
                        )}
                        {iv.meeting_link && (
                          <>
                            <span className="text-border hidden sm:inline">|</span>
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Video className="h-3 w-3" /> Link
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default function InterviewsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [interviewerFilter, setInterviewerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', search, statusFilter, typeFilter, interviewerFilter, dateFrom, dateTo],
    queryFn: () =>
      interviewsService.list({
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { interview_type: typeFilter }),
        ...(dateFrom && { scheduled_at_gte: dateFrom }),
        ...(dateTo && { scheduled_at_lte: dateTo }),
        ordering: 'scheduled_at',
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interviewsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] })
      toast.success('Interview deleted')
    },
    onError: (err) => toast.error(extractApiError(err, 'Failed to delete interview')),
  })

  // Client-side interviewer filter + status counts
  const rawInterviews = data?.results || []
  const uniqueInterviewers = [...new Set(rawInterviews.map((iv) => iv.interviewer_name).filter(Boolean))].sort()
  const allInterviews = interviewerFilter
    ? rawInterviews.filter((iv) => iv.interviewer_name === interviewerFilter)
    : rawInterviews
  const statusCounts = allInterviews.reduce((acc, iv) => { acc[iv.status] = (acc[iv.status] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            Interviews
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.count ?? 0} total interviews</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
          <Button onClick={() => navigate('/interviews/new')} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Schedule Interview
          </Button>
        </div>
      </div>

      {/* Quick status pills */}
      {allInterviews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as InterviewStatus[]).map((s) => {
            const count = statusCounts[s] || 0
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  statusFilter === s ? 'ring-2 ring-offset-1 ring-primary/30 ' + cfg.color : cfg.color + ' border-transparent hover:shadow-sm'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot, s === 'IN_PROGRESS' && 'animate-pulse')} />
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
            placeholder="Search interviewer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as InterviewStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {(['AI_VOICE', 'HR_SCREEN', 'TECHNICAL', 'CULTURE_FIT', 'FINAL'] as InterviewType[]).map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {uniqueInterviewers.length > 0 && (
            <Select value={interviewerFilter || 'ALL'} onValueChange={(v) => setInterviewerFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All interviewers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All interviewers</SelectItem>
                {uniqueInterviewers.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {viewMode === 'grid' && (
            <DateRangeFilter
              fromDate={dateFrom}
              toDate={dateTo}
              onFromChange={setDateFrom}
              onToChange={setDateTo}
              onClear={() => { setDateFrom(''); setDateTo('') }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading interviews...</p>
        </div>
      ) : allInterviews.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No interviews scheduled</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Schedule your first interview to get started</p>
          <Button onClick={() => navigate('/interviews/new')}>
            <Plus className="h-4 w-4 mr-2" /> Schedule Interview
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allInterviews.map((iv) => (
            <InterviewCard key={iv.id} iv={iv} />
          ))}
        </div>
      ) : (
        <CalendarView interviews={allInterviews} />
      )}
    </div>
  )
}
