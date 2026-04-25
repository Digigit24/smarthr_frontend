import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BellRing, CheckCheck, ChevronLeft, ChevronRight, Search, X,
  FileText, Calendar, Phone, Settings, ChevronRight as ChevRight,
  Mail, MessageSquare, Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { notificationsService } from '@/services/notifications'
import type { Notification, NotificationCategory, CursorPaginatedResponse } from '@/types'
import { formatDateTime, cn, extractCursor } from '@/lib/utils'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: typeof Bell; color: string; gradient: string; dot: string; bg: string; ring: string }> = {
  APPLICATION: {
    label: 'Application',
    icon: FileText,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    gradient: 'from-blue-500 to-indigo-500',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    ring: 'ring-blue-500/30',
  },
  INTERVIEW: {
    label: 'Interview',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    gradient: 'from-indigo-500 to-purple-500',
    dot: 'bg-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    ring: 'ring-indigo-500/30',
  },
  CALL: {
    label: 'Call',
    icon: Phone,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    gradient: 'from-violet-500 to-purple-500',
    dot: 'bg-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    ring: 'ring-violet-500/30',
  },
  SYSTEM: {
    label: 'System',
    icon: Settings,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    gradient: 'from-gray-400 to-gray-500',
    dot: 'bg-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    ring: 'ring-gray-500/30',
  },
}

const CATEGORY_TABS: { label: string; value: 'ALL' | NotificationCategory }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Application', value: 'APPLICATION' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Call', value: 'CALL' },
  { label: 'System', value: 'SYSTEM' },
]

const READ_FILTERS = ['ALL', 'UNREAD', 'READ'] as const
type ReadFilter = (typeof READ_FILTERS)[number]

function getNotificationRoute(data: Record<string, unknown>): string | null {
  if (data.application_id) return `/applications/${data.application_id}`
  if (data.job_id) return `/jobs/${data.job_id}`
  if (data.interview_id) return `/interviews/${data.interview_id}`
  if (data.call_record_id) return `/calls/${data.call_record_id}`
  return null
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateTime(dateStr)
}

/* ── Card ── */
function NotificationCard({
  n,
  onMarkRead,
  onClick,
}: {
  n: Notification
  onMarkRead: (id: string) => void
  onClick: (n: Notification) => void
}) {
  const cfg = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.SYSTEM
  const CatIcon = cfg.icon
  const route = getNotificationRoute(n.data)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(n)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(n)
        }
      }}
      className={cn(
        'group relative rounded-xl border overflow-hidden transition-all duration-200',
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'hover:shadow-sm hover:border-border/80 active:scale-[0.998]',
        !n.is_read
          ? 'border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/60 via-card to-card dark:from-blue-950/20'
          : 'bg-card',
      )}
    >
      {/* Unread accent bar */}
      {!n.is_read && (
        <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', cfg.gradient)} />
      )}

      <div className="flex items-start gap-3 p-3 sm:p-4">
        {/* Icon */}
        <div
          className={cn(
            'h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0',
            !n.is_read ? `bg-gradient-to-br ${cfg.gradient} text-white shadow-sm` : cfg.bg,
          )}
        >
          <CatIcon
            className={cn(
              'h-5 w-5',
              n.is_read && cfg.color.split(' ').find((c) => c.startsWith('text-')),
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: badges + time */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium',
                cfg.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
            {!n.is_read && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                New
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] text-muted-foreground ml-auto shrink-0">
              {getTimeAgo(n.sent_at)}
            </span>
          </div>

          {/* Title */}
          <p
            className={cn(
              'text-sm leading-snug',
              !n.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
            )}
          >
            {n.title}
          </p>

          {/* Message preview */}
          <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {n.message}
          </p>

          {/* Footer meta */}
          <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
            {n.notification_type && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground">
                {n.notification_type === 'EMAIL' && <Mail className="h-3 w-3" />}
                {n.notification_type === 'WHATSAPP' && <MessageSquare className="h-3 w-3" />}
                {n.notification_type === 'IN_APP' && <Bell className="h-3 w-3" />}
                {n.notification_type.replace(/_/g, ' ')}
              </span>
            )}
            {route && (
              <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] text-primary ml-auto font-medium">
                View <ChevRight className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Mark-read action — visible on mobile, hover on desktop */}
        {!n.is_read && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(n.id)
            }}
            title="Mark as read"
            className={cn(
              'shrink-0 h-8 w-8 sm:h-8 sm:w-auto sm:px-2.5 rounded-md',
              'inline-flex items-center justify-center gap-1 text-[11px] font-medium',
              'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
              'hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors',
              'sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100',
            )}
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Mark read</span>
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton card ── */
function NotificationSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="pt-1 flex items-center gap-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-10 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | NotificationCategory>('ALL')
  const [readFilter, setReadFilter] = useState<ReadFilter>('ALL')
  const [cursor, setCursor] = useState<string | null>(null)

  const params: Record<string, string> = {}
  if (cursor) params.cursor = cursor
  if (categoryFilter !== 'ALL') params.category = categoryFilter
  if (readFilter === 'UNREAD') params.is_read = 'false'
  if (readFilter === 'READ') params.is_read = 'true'
  if (debouncedSearch) params.search = debouncedSearch

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', categoryFilter, readFilter, debouncedSearch, cursor],
    queryFn: () => notificationsService.list(params),
    placeholderData: (previous) => previous,
  })

  const notificationsQueryKey = [
    'notifications',
    categoryFilter,
    readFilter,
    debouncedSearch,
    cursor,
  ]

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationsQueryKey })
      const previous = qc.getQueryData<CursorPaginatedResponse<Notification>>(notificationsQueryKey)
      const now = new Date().toISOString()
      qc.setQueryData<CursorPaginatedResponse<Notification>>(notificationsQueryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          results: old.results.map((n) =>
            n.id === id ? { ...n, is_read: true, read_at: n.read_at ?? now } : n,
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(notificationsQueryKey, context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationsQueryKey })
      const previous = qc.getQueryData<CursorPaginatedResponse<Notification>>(notificationsQueryKey)
      const now = new Date().toISOString()
      qc.setQueryData<CursorPaginatedResponse<Notification>>(notificationsQueryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          results: old.results.map((n) =>
            n.is_read ? n : { ...n, is_read: true, read_at: now },
          ),
        }
      })
      return { previous }
    },
    onSuccess: (res) => {
      toast.success(`${res.marked_read} notifications marked as read`)
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(notificationsQueryKey, context.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.results || []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleCardClick = (n: Notification) => {
    if (!n.is_read) markReadMutation.mutate(n.id)
    navigate(`/notifications/${n.id}`)
  }

  // Counts for the category pills
  const categoryCounts = notifications.reduce(
    (acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const showSkeleton = isLoading
  const filtersActive = !!debouncedSearch || categoryFilter !== 'ALL' || readFilter !== 'ALL'

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('ALL')
    setReadFilter('ALL')
    setCursor(null)
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-tight">Notifications</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {showSkeleton
                ? 'Loading…'
                : unreadCount > 0
                  ? `${unreadCount} unread${notifications.length ? ` of ${notifications.length}` : ''}`
                  : notifications.length
                    ? 'All caught up — no unread'
                    : 'Nothing to show'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="w-full sm:w-auto h-9"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Mark all read</span>
              <span className="hidden sm:inline">Mark all as read</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Search + Read filter ─── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search notifications..."
            className="pl-9 pr-9 h-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCursor(null)
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCursor(null)
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Read filter — segmented */}
        <div
          role="tablist"
          aria-label="Filter by read status"
          className="flex gap-1 bg-muted/60 rounded-lg p-1 h-10"
        >
          {READ_FILTERS.map((v) => {
            const active = readFilter === v
            const label = v === 'ALL' ? 'All' : v === 'UNREAD' ? 'Unread' : 'Read'
            return (
              <button
                key={v}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setReadFilter(v)
                  setCursor(null)
                }}
                className={cn(
                  'flex-1 sm:flex-none px-3 sm:px-4 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {v === 'UNREAD' && unreadCount > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 inline-flex items-center justify-center rounded-full text-[10px] px-1.5 min-w-[18px] h-4',
                      active
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    )}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Category tabs ─── */}
      <div className="flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-px border-b border-border scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const count =
            tab.value === 'ALL' ? notifications.length : categoryCounts[tab.value] || 0
          const cfg = tab.value !== 'ALL' ? CATEGORY_CONFIG[tab.value] : null
          const active = categoryFilter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => {
                setCategoryFilter(tab.value)
                setCursor(null)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-[13px] font-medium transition-all border-b-2 -mb-px whitespace-nowrap shrink-0',
                active
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {cfg && <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />}
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Content ─── */}
      {showSkeleton ? (
        <div
          className={cn('space-y-2 sm:space-y-3 transition-opacity', isFetching && 'opacity-60')}
          aria-busy="true"
          aria-label="Loading notifications"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-sm sm:text-base">
            {filtersActive ? 'No matching notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
            {filtersActive
              ? 'Try a different filter or clear your search.'
              : 'New activity will appear here as it happens.'}
          </p>
          {filtersActive && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div
            className={cn(
              'space-y-2 sm:space-y-3 transition-opacity',
              isFetching && 'opacity-70',
            )}
          >
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onClick={handleCardClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.previous}
                onClick={() => setCursor(extractCursor(data?.previous ?? null))}
                className="flex-1 sm:flex-none h-9"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Newer
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data?.next}
                onClick={() => setCursor(extractCursor(data?.next ?? null))}
                className="flex-1 sm:flex-none h-9"
              >
                Older <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
